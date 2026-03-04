import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idMueble, tablaOrigen, cambios, razonCambio, userId } = body;

    // Validate required fields
    if (!idMueble || !tablaOrigen || !cambios || !userId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validate tabla_origen
    const validTables = ['muebles', 'mueblesitea', 'mueblestlaxcala'];
    if (!validTables.includes(tablaOrigen)) {
      return NextResponse.json(
        { error: 'Tabla de origen no válida' },
        { status: 400 }
      );
    }

    // Validate cambios array
    if (!Array.isArray(cambios) || cambios.length === 0) {
      return NextResponse.json(
        { error: 'El array de cambios está vacío o no es válido' },
        { status: 400 }
      );
    }

    // Prepare records for insertion
    const registros = cambios.map((cambio: any) => ({
      id_mueble: idMueble,
      tabla_origen: tablaOrigen,
      campo_modificado: cambio.campo,
      valor_anterior: cambio.valorAnterior,
      valor_nuevo: cambio.valorNuevo,
      usuario_id: userId,
      metadata: {
        campo_display: cambio.campoDisplay || cambio.campo,
        tipo_cambio: 'edicion' as const,
        razon_cambio: razonCambio || undefined
      }
    }));

    // Insert records using service role client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('cambios_inventario')
      .insert(registros)
      .select();

    if (error) {
      console.error('❌ [API] Error al registrar cambios:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ [API] ${registros.length} cambios registrados exitosamente`);

    return NextResponse.json(
      { 
        success: true, 
        count: registros.length,
        data 
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('❌ [API] Error inesperado:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
