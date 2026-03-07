import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Tipos para el request y response
interface TransferOrigenRequest {
  record_id: string;
  id_inventario: string;
  origen_actual: 'inea' | 'itea' | 'no-listado';
  origen_destino: 'inea' | 'itea' | 'no-listado';
}

interface TransferOrigenResponse {
  success: boolean;
  message?: string;
  new_record_id?: string;
  cambio_id?: string;
  error?: string;
  code?: string;
}

// Create admin client with service role key (bypasses RLS)
// IMPORTANT: Disable realtime to prevent triggering reindexation on INSERT/DELETE
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 0, // Disable realtime events completely
      },
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-skip-realtime': 'true', // Custom header to skip realtime
      },
    },
  }
);

/**
 * Verifica si un registro tiene resguardo activo
 * Note: resguardos table uses 'id_mueble' column (UUID), not 'id_inventario'
 * Note: There is no 'fecha_baja' column in resguardos table
 */
async function checkActiveResguardo(
  supabase: any,
  recordId: string
): Promise<boolean> {
  console.log(`[checkActiveResguardo] Verificando resguardo para UUID: ${recordId}`);
  
  try {
    const { data, error } = await supabase
      .from('resguardos')
      .select('id')
      .eq('id_mueble', recordId)
      .limit(1);

    if (error) {
      console.error('[checkActiveResguardo] Error en query:', error);
      throw new Error(`Error al verificar resguardo activo: ${error.message}`);
    }

    const hasResguardo = data && data.length > 0;
    console.log(`[checkActiveResguardo] Tiene resguardo activo: ${hasResguardo}`);
    
    return hasResguardo;
  } catch (err: any) {
    console.error('[checkActiveResguardo] Error catch:', err);
    throw new Error(`Error al verificar resguardo activo: ${err.message}`);
  }
}

/**
 * Verifica si el id_inv ya existe en la tabla destino
 * Note: Inventory tables use 'id_inv' column, not 'id_inventario'
 * Table names: muebles (INEA), mueblesitea (ITEA), mueblestlaxcala (TLAXCALA)
 */
async function checkDuplicateInDestino(
  supabase: any,
  idInventario: string,
  origenDestino: string
): Promise<boolean> {
  // Map origen names to actual table names
  const tableMap: Record<string, string> = {
    'inea': 'muebles',
    'itea': 'mueblesitea',
    'no-listado': 'mueblestlaxcala'
  };
  
  const tableName = tableMap[origenDestino];
  if (!tableName) {
    throw new Error(`Tabla destino inválida: ${origenDestino}`);
  }
  
  console.log(`[checkDuplicateInDestino] Verificando duplicado en tabla: ${tableName}, ID: ${idInventario}`);
  
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .eq('id_inv', idInventario)
      .limit(1);

    if (error) {
      console.error('[checkDuplicateInDestino] Error en query:', error);
      throw new Error(`Error al verificar duplicado en destino: ${error.message}`);
    }

    const hasDuplicate = data && data.length > 0;
    console.log(`[checkDuplicateInDestino] Existe duplicado: ${hasDuplicate}`);
    
    return hasDuplicate;
  } catch (err: any) {
    console.error('[checkDuplicateInDestino] Error catch:', err);
    throw new Error(`Error al verificar duplicado en destino: ${err.message}`);
  }
}

/**
 * Ejecuta la transacción de transferencia entre tablas
 * Note: Table names are muebles (INEA), mueblesitea (ITEA), mueblestlaxcala (TLAXCALA)
 * Note: cambios_inventario uses id_mueble (UUID), not id_inventario
 */
async function executeTransferTransaction(
  supabase: any,
  recordId: string,
  idInventario: string,
  origenActual: string,
  origenDestino: string,
  userId: string
): Promise<{ newRecordId: string; cambioId: string }> {
  // Map origen names to actual table names
  const tableMap: Record<string, string> = {
    'inea': 'muebles',
    'itea': 'mueblesitea',
    'no-listado': 'mueblestlaxcala'
  };
  
  const sourceTable = tableMap[origenActual];
  const destTable = tableMap[origenDestino];
  
  if (!sourceTable || !destTable) {
    throw new Error(`Tablas inválidas: origen=${origenActual}, destino=${origenDestino}`);
  }
  
  console.log(`[executeTransferTransaction] Tablas mapeadas: ${sourceTable} -> ${destTable}`);
  
  // 1. Leer registro origen
  const { data: sourceRecord, error: selectError } = await supabase
    .from(sourceTable)
    .select('*')
    .eq('id', recordId)
    .single();

  if (selectError || !sourceRecord) {
    console.error('Error reading source record:', selectError);
    throw new Error('No se pudo leer el registro origen');
  }

  // 2. Preparar datos para inserción (excluir id, created_at, updated_at - dejar que la DB los maneje)
  const { id, created_at, updated_at, ...recordData } = sourceRecord;

  // 3. Insertar en tabla destino (sin especificar updated_at - la DB lo maneja automáticamente)
  // Note: Using .select() returns data which triggers realtime events causing full reindexation
  // Instead, we insert without select (like registration form) to let realtime handle updates naturally
  const { error: insertError } = await supabase
    .from(destTable)
    .insert(recordData);

  if (insertError) {
    console.error('Error inserting into destino:', insertError);
    throw new Error('Error al insertar en tabla destino');
  }

  // Get the new record ID by querying with id_inv (since we don't have it from insert)
  const { data: newRecord, error: getIdError } = await supabase
    .from(destTable)
    .select('id')
    .eq('id_inv', recordData.id_inv)
    .single();

  if (getIdError || !newRecord) {
    console.error('Error getting new record ID:', getIdError);
    throw new Error('Error al obtener ID del nuevo registro');
  }

  // 4. Registrar cambio en cambios_inventario (sin select para evitar reindexación)
  const { error: cambioError } = await supabase
    .from('cambios_inventario')
    .insert({
      id_mueble: recordId, // UUID of the record
      tabla_origen: sourceTable,
      campo_modificado: 'origen',
      valor_anterior: origenActual,
      valor_nuevo: origenDestino,
      usuario_id: userId,
      fecha_cambio: new Date().toISOString(),
    });

  if (cambioError) {
    console.error('Error creating audit record:', cambioError);
    // Intentar rollback eliminando el registro insertado
    await supabase.from(destTable).delete().eq('id', newRecord.id);
    throw new Error('Error al registrar auditoría');
  }

  // Get cambio ID if needed (optional, since we don't return it)
  const { data: cambioRecord } = await supabase
    .from('cambios_inventario')
    .select('id')
    .eq('id_mueble', recordId)
    .eq('campo_modificado', 'origen')
    .order('fecha_cambio', { ascending: false })
    .limit(1)
    .single();

  // 5. Eliminar de tabla origen
  const { error: deleteError } = await supabase
    .from(sourceTable)
    .delete()
    .eq('id', recordId);

  if (deleteError) {
    console.error('Error deleting from origen:', deleteError);
    // Intentar rollback
    await supabase.from(destTable).delete().eq('id', newRecord.id);
    if (cambioRecord?.id) {
      await supabase.from('cambios_inventario').delete().eq('id', cambioRecord.id);
    }
    throw new Error('Error al eliminar de tabla origen');
  }

  return {
    newRecordId: newRecord.id,
    cambioId: cambioRecord?.id || '',
  };
}

/**
 * POST /api/inventario/transfer-origen
 * Transfiere un registro de inventario entre tablas (inea, itea, no-listado)
 */
export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] === INICIO TRANSFER ORIGEN ===`);
  
  try {
    // 1. Parsear y validar body
    const body: TransferOrigenRequest = await request.json();
    const { record_id, id_inventario, origen_actual, origen_destino } = body;

    console.log(`[${requestId}] Body recibido:`, {
      record_id,
      id_inventario,
      origen_actual,
      origen_destino,
    });

    if (!record_id || !id_inventario || !origen_actual || !origen_destino) {
      console.log(`[${requestId}] ERROR: Faltan parámetros requeridos`);
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan parámetros requeridos',
          code: 'VALIDATION_ERROR',
        } as TransferOrigenResponse,
        { status: 400 }
      );
    }

    // 2. Obtener userData de la cookie (contiene el ID del usuario)
    const userDataCookie = request.cookies.get('userData')?.value;
    console.log(`[${requestId}] userData cookie presente:`, !!userDataCookie);
    
    if (!userDataCookie) {
      console.log(`[${requestId}] ERROR: No hay cookie userData`);
      return NextResponse.json(
        {
          success: false,
          error: 'No autenticado - sesión no encontrada',
          code: 'PERMISSION_DENIED',
        } as TransferOrigenResponse,
        { status: 401 }
      );
    }

    let userData: any;
    try {
      userData = JSON.parse(userDataCookie);
      console.log(`[${requestId}] userData parseado:`, {
        id: userData.id,
        email: userData.email,
        rol: userData.rol,
      });
    } catch (e) {
      console.log(`[${requestId}] ERROR: No se pudo parsear userData`);
      return NextResponse.json(
        {
          success: false,
          error: 'Sesión inválida',
          code: 'PERMISSION_DENIED',
        } as TransferOrigenResponse,
        { status: 401 }
      );
    }

    if (!userData.id) {
      console.log(`[${requestId}] ERROR: userData no tiene ID`);
      return NextResponse.json(
        {
          success: false,
          error: 'Sesión inválida - falta ID de usuario',
          code: 'PERMISSION_DENIED',
        } as TransferOrigenResponse,
        { status: 401 }
      );
    }

    // 3. Verificar rol admin o superadmin usando service role (bypassa RLS)
    console.log(`[${requestId}] Consultando rol del usuario en tabla users...`);
    const { data: dbUserData, error: userError } = await supabaseAdmin
      .from('users')
      .select('rol, first_name, last_name, email')
      .eq('id', userData.id)
      .single();

    if (userError) {
      console.log(`[${requestId}] ERROR al consultar usuarios:`, userError);
      return NextResponse.json(
        {
          success: false,
          error: `Error al verificar permisos: ${userError.message}`,
          code: 'PERMISSION_DENIED',
        } as TransferOrigenResponse,
        { status: 403 }
      );
    }

    if (!dbUserData) {
      console.log(`[${requestId}] ERROR: Usuario no encontrado en tabla users`);
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario no encontrado en el sistema',
          code: 'PERMISSION_DENIED',
        } as TransferOrigenResponse,
        { status: 403 }
      );
    }

    console.log(`[${requestId}] Datos del usuario:`, {
      id: userData.id,
      first_name: dbUserData.first_name,
      last_name: dbUserData.last_name,
      email: dbUserData.email,
      rol: dbUserData.rol,
    });

    if (dbUserData.rol !== 'admin' && dbUserData.rol !== 'superadmin') {
      console.log(`[${requestId}] ERROR: Rol insuficiente. Rol actual: ${dbUserData.rol}`);
      return NextResponse.json(
        {
          success: false,
          error: `No tienes permisos para transferir registros. Tu rol es: ${dbUserData.rol}`,
          code: 'PERMISSION_DENIED',
        } as TransferOrigenResponse,
        { status: 403 }
      );
    }

    console.log(`[${requestId}] ✓ Usuario autorizado con rol: ${dbUserData.rol}`);

    // 4. Validar que origen y destino sean diferentes
    if (origen_actual === origen_destino) {
      console.log(`[${requestId}] ERROR: Origen y destino son iguales`);
      return NextResponse.json(
        {
          success: false,
          error: 'El origen y destino no pueden ser iguales',
          code: 'VALIDATION_ERROR',
        } as TransferOrigenResponse,
        { status: 400 }
      );
    }

    // 5. Validar valores permitidos
    const validOrigenes = ['inea', 'itea', 'no-listado'];
    if (
      !validOrigenes.includes(origen_actual) ||
      !validOrigenes.includes(origen_destino)
    ) {
      console.log(`[${requestId}] ERROR: Valores de origen inválidos`);
      return NextResponse.json(
        {
          success: false,
          error: 'Valores de origen inválidos',
          code: 'VALIDATION_ERROR',
        } as TransferOrigenResponse,
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Validaciones básicas pasadas`);

    // 6. Verificar resguardo activo (opcional - si falla, continuar)
    console.log(`[${requestId}] Verificando resguardo activo...`);
    try {
      const hasActiveResguardo = await checkActiveResguardo(
        supabaseAdmin,
        record_id // Use UUID, not id_inventario
      );
      if (hasActiveResguardo) {
        console.log(`[${requestId}] ADVERTENCIA: Registro tiene resguardo activo`);
        return NextResponse.json(
          {
            success: false,
            error: 'No se puede transferir: el registro tiene un resguardo activo',
            code: 'RESGUARDO_ACTIVE',
          } as TransferOrigenResponse,
          { status: 400 }
        );
      }
      console.log(`[${requestId}] ✓ Sin resguardo activo`);
    } catch (err: any) {
      // Si falla la verificación de resguardo, continuar de todos modos
      console.log(`[${requestId}] ADVERTENCIA: No se pudo verificar resguardo activo, continuando...`, err.message);
    }

    // 7. Verificar duplicado en destino
    console.log(`[${requestId}] Verificando duplicado en destino...`);
    const existsInDestino = await checkDuplicateInDestino(
      supabaseAdmin,
      id_inventario,
      origen_destino
    );
    if (existsInDestino) {
      console.log(`[${requestId}] ERROR: ID ya existe en destino`);
      return NextResponse.json(
        {
          success: false,
          error: 'El ID de inventario ya existe en la tabla destino',
          code: 'DUPLICATE_ID',
        } as TransferOrigenResponse,
        { status: 400 }
      );
    }
    console.log(`[${requestId}] ✓ No hay duplicado en destino`);

    // 8. Ejecutar transacción de transferencia
    console.log(`[${requestId}] Iniciando transacción de transferencia...`);
    const { newRecordId, cambioId } = await executeTransferTransaction(
      supabaseAdmin,
      record_id,
      id_inventario,
      origen_actual,
      origen_destino,
      userData.id
    );

    console.log(`[${requestId}] ✓ Transacción completada exitosamente`);

    // 9. Log de auditoría
    console.log(`[${requestId}] === TRANSFER EXITOSO ===`, {
      action: 'ORIGEN_TRANSFER',
      user_id: userData.id,
      user_email: userData.email,
      user_rol: dbUserData.rol,
      id_inventario,
      origen_actual,
      origen_destino,
      new_record_id: newRecordId,
      cambio_id: cambioId,
      timestamp: new Date().toISOString(),
      success: true,
    });

    // 10. Retornar éxito
    return NextResponse.json(
      {
        success: true,
        message: 'Registro transferido exitosamente',
        new_record_id: newRecordId,
        cambio_id: cambioId,
      } as TransferOrigenResponse,
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`[${requestId}] === ERROR CRÍTICO ===`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al transferir registro',
        code: 'TRANSACTION_FAILED',
      } as TransferOrigenResponse,
      { status: 500 }
    );
  }
}
