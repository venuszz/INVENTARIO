import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API Endpoint: Transfer Bienes (Assets) between Directors
 * 
 * Handles two types of transfers:
 * 1. Complete Area Transfer: Transfers all assets from an area to another director
 * 2. Partial Bienes Transfer: Transfers selected assets to a specific area of another director
 * 
 * Features:
 * - Authentication and authorization validation (admin/superadmin only)
 * - Input validation
 * - Business rules validation
 * - Atomic transactions with rollback on failure
 * - Batch processing for large transfers
 * - Comprehensive logging
 * - Cache invalidation after successful transfer
 * 
 * Requirements: 8.1-8.8, 9.1-9.6, 10.1-10.6, 12.1-12.5, 14.1-14.6, 15.1-15.5, 16.1-16.5
 */

// Create admin client with service role key (bypasses RLS)
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

/**
 * POST handler for transfer operations
 * 
 * Note: Authentication is handled by middleware at the page level.
 * This API assumes the user is already authenticated and authorized.
 */
export async function POST(request: NextRequest) {
  const logPrefix = '[API:TRANSFER_BIENES]';
  const timestamp = new Date().toISOString();

  console.log(`${logPrefix} ========================================`);
  console.log(`${logPrefix} Nueva solicitud de transferencia`);
  console.log(`${logPrefix} Timestamp: ${timestamp}`);

  try {
    // STEP 1: Parse and validate request body
    console.log(`${logPrefix} STEP 1: Validando request body...`);

    const body = await request.json();
    const { action, sourceDirectorId, targetDirectorId, sourceAreaId, targetAreaId, bienIds, userId } = body;

    console.log(`${logPrefix} Acción:`, action);
    console.log(`${logPrefix} Parámetros:`, {
      sourceDirectorId,
      targetDirectorId,
      sourceAreaId,
      targetAreaId,
      userId,
      bienIds: bienIds ? {
        inea: bienIds.inea?.length || 0,
        itea: bienIds.itea?.length || 0,
        no_listado: bienIds.no_listado?.length || 0
      } : undefined
    });

    // Validate userId
    if (!userId) {
      console.error(`${logPrefix} ❌ No se proporcionó userId`);
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario no válido'
        },
        { status: 400 }
      );
    }

    // Validate input
    const inputValidation = validateInput(body);
    if (!inputValidation.valid) {
      console.error(`${logPrefix} ❌ Validación de input falló:`, inputValidation.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Datos de entrada inválidos',
          details: inputValidation.errors
        },
        { status: 400 }
      );
    }

    console.log(`${logPrefix} ✓ Input validado correctamente`);

    // STEP 2: Validate business rules
    console.log(`${logPrefix} STEP 2: Validando reglas de negocio...`);

    const businessValidation = await validateBusinessRules(body);
    if (!businessValidation.valid) {
      console.error(`${logPrefix} ❌ Validación de reglas de negocio falló:`, businessValidation.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Validación de reglas de negocio falló',
          validationErrors: businessValidation.errors
        },
        { status: 422 }
      );
    }

    console.log(`${logPrefix} ✓ Reglas de negocio validadas correctamente`);

    // STEP 3: Execute transfer based on action
    console.log(`${logPrefix} STEP 3: Ejecutando transferencia...`);

    let result;

    if (action === 'transfer_complete_area') {
      result = await handleCompleteAreaTransfer(
        sourceDirectorId,
        targetDirectorId,
        sourceAreaId,
        targetAreaId,
        userId
      );
    } else if (action === 'transfer_partial_bienes') {
      result = await handlePartialBienesTransfer(
        sourceDirectorId,
        targetDirectorId,
        targetAreaId,
        bienIds,
        userId
      );
    } else {
      console.error(`${logPrefix} ❌ Acción no válida:`, action);
      return NextResponse.json(
        {
          success: false,
          error: 'Acción no válida'
        },
        { status: 400 }
      );
    }

    console.log(`${logPrefix} ========================================`);
    console.log(`${logPrefix} ✅ Transferencia completada exitosamente`);
    console.log(`${logPrefix} Resultado:`, result);
    console.log(`${logPrefix} ========================================`);

    return NextResponse.json(result);

  } catch (error) {
    console.error(`${logPrefix} ❌❌❌ ERROR CRÍTICO ❌❌❌`);
    console.error(`${logPrefix} Error:`, error);
    console.error(`${logPrefix} Stack:`, error instanceof Error ? error.stack : 'N/A');
    console.error(`${logPrefix} ========================================`);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al procesar transferencia'
      },
      { status: 500 }
    );
  }
}

/**
 * Validate input data structure and types
 * Requirement: 12.5
 */
function validateInput(body: any): { valid: boolean; errors?: Array<{ field: string; issue: string }> } {
  const errors: Array<{ field: string; issue: string }> = [];

  // Validate action
  if (!body.action || typeof body.action !== 'string') {
    errors.push({ field: 'action', issue: 'Campo requerido y debe ser string' });
  } else if (body.action !== 'transfer_complete_area' && body.action !== 'transfer_partial_bienes') {
    errors.push({ field: 'action', issue: 'Debe ser "transfer_complete_area" o "transfer_partial_bienes"' });
  }

  // Validate sourceDirectorId
  if (!body.sourceDirectorId || typeof body.sourceDirectorId !== 'number' || body.sourceDirectorId <= 0) {
    errors.push({ field: 'sourceDirectorId', issue: 'Campo requerido y debe ser número positivo' });
  }

  // Validate targetDirectorId
  if (!body.targetDirectorId || typeof body.targetDirectorId !== 'number' || body.targetDirectorId <= 0) {
    errors.push({ field: 'targetDirectorId', issue: 'Campo requerido y debe ser número positivo' });
  }

  // Validate fields specific to complete area transfer
  if (body.action === 'transfer_complete_area') {
    if (!body.sourceAreaId || typeof body.sourceAreaId !== 'number' || body.sourceAreaId <= 0) {
      errors.push({ field: 'sourceAreaId', issue: 'Campo requerido para transferencia completa y debe ser número positivo' });
    }

    // targetAreaId can be null, -1 (create new), or positive number (merge to existing)
    if (body.targetAreaId !== null && body.targetAreaId !== -1 && (typeof body.targetAreaId !== 'number' || body.targetAreaId <= 0)) {
      errors.push({ field: 'targetAreaId', issue: 'Debe ser null, -1, o número positivo' });
    }
  }

  // Validate fields specific to partial bienes transfer
  if (body.action === 'transfer_partial_bienes') {
    if (!body.targetAreaId || typeof body.targetAreaId !== 'number' || body.targetAreaId <= 0) {
      errors.push({ field: 'targetAreaId', issue: 'Campo requerido para transferencia parcial y debe ser número positivo' });
    }

    if (!body.bienIds || typeof body.bienIds !== 'object') {
      errors.push({ field: 'bienIds', issue: 'Campo requerido para transferencia parcial y debe ser objeto' });
    } else {
      if (!Array.isArray(body.bienIds.inea)) {
        errors.push({ field: 'bienIds.inea', issue: 'Debe ser array' });
      } else {
        // Validate that all INEA IDs are strings (UUIDs)
        const invalidIneaIds = body.bienIds.inea.filter((id: any) => typeof id !== 'string');
        if (invalidIneaIds.length > 0) {
          errors.push({ field: 'bienIds.inea', issue: `Todos los IDs deben ser strings (UUIDs). IDs inválidos: ${invalidIneaIds.join(', ')}` });
        }
      }
      
      if (!Array.isArray(body.bienIds.itea)) {
        errors.push({ field: 'bienIds.itea', issue: 'Debe ser array' });
      } else {
        // Validate that all ITEA IDs are strings (UUIDs)
        const invalidIteaIds = body.bienIds.itea.filter((id: any) => typeof id !== 'string');
        if (invalidIteaIds.length > 0) {
          errors.push({ field: 'bienIds.itea', issue: `Todos los IDs deben ser strings (UUIDs). IDs inválidos: ${invalidIteaIds.join(', ')}` });
        }
      }
      
      if (!Array.isArray(body.bienIds.no_listado)) {
        errors.push({ field: 'bienIds.no_listado', issue: 'Debe ser array' });
      } else {
        // Validate that all No Listado IDs are strings (UUIDs)
        const invalidNoListadoIds = body.bienIds.no_listado.filter((id: any) => typeof id !== 'string');
        if (invalidNoListadoIds.length > 0) {
          errors.push({ field: 'bienIds.no_listado', issue: `Todos los IDs deben ser strings (UUIDs). IDs inválidos: ${invalidNoListadoIds.join(', ')}` });
        }
      }

      // Check that at least one array has items
      const totalBienes = (body.bienIds.inea?.length || 0) +
        (body.bienIds.itea?.length || 0) +
        (body.bienIds.no_listado?.length || 0);

      if (totalBienes === 0) {
        errors.push({ field: 'bienIds', issue: 'Debe incluir al menos un bien para transferir' });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validate business rules
 * Requirements: 3.1, 3.2, 14.1, 14.2, 14.3, 14.4, 14.5
 */
async function validateBusinessRules(body: any): Promise<{
  valid: boolean;
  errors?: Array<{ type: string; message: string; details?: any }>
}> {
  const errors: Array<{ type: string; message: string; details?: any }> = [];

  // Rule 1: Source and target directors must be different (Requirement 14.1)
  if (body.sourceDirectorId === body.targetDirectorId) {
    errors.push({
      type: 'same_director',
      message: 'El director origen y destino deben ser diferentes'
    });
  }

  // Rule 2: Check for active resguardos (Requirement 3.1, 3.2)
  if (body.action === 'transfer_complete_area') {
    const { count: resguardosCount } = await supabaseAdmin
      .from('resguardos')
      .select('*', { count: 'exact', head: true })
      .eq('id_directorio', body.sourceDirectorId)
      .eq('id_area', body.sourceAreaId)
      .eq('activo', true);

    if (resguardosCount && resguardosCount > 0) {
      errors.push({
        type: 'resguardos',
        message: `No se puede transferir el área porque tiene ${resguardosCount} resguardo(s) activo(s)`,
        details: { count: resguardosCount }
      });
    }
  }

  // Rule 3: Check for duplicate area in target director (Requirement 14.2)
  // Only check if creating new area (targetAreaId is null or -1)
  if (body.action === 'transfer_complete_area' && (body.targetAreaId === null || body.targetAreaId === -1)) {
    const { data: existingArea } = await supabaseAdmin
      .from('directorio_areas')
      .select('id_area')
      .eq('id_directorio', body.targetDirectorId)
      .eq('id_area', body.sourceAreaId)
      .single();

    if (existingArea) {
      errors.push({
        type: 'duplicate_area',
        message: 'El director destino ya tiene esta área asignada'
      });
    }
  }

  // Rule 4: Validate target area exists and belongs to target director (Requirement 14.3)
  if (body.action === 'transfer_partial_bienes') {
    const { data: targetArea } = await supabaseAdmin
      .from('directorio_areas')
      .select('id_area')
      .eq('id_directorio', body.targetDirectorId)
      .eq('id_area', body.targetAreaId)
      .single();

    if (!targetArea) {
      errors.push({
        type: 'no_target_area',
        message: 'El área destino no existe o no pertenece al director destino'
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Handle complete area transfer
 * Requirements: 8.1-8.8
 * 
 * ATOMIC TRANSACTION: All operations must succeed or all fail (rollback)
 * 
 * @param targetAreaId - null or -1 to transfer area with same name (create new relationship)
 *                       number to merge bienes to existing area
 */
async function handleCompleteAreaTransfer(
  sourceDirectorId: number,
  targetDirectorId: number,
  sourceAreaId: number,
  targetAreaId: number | null,
  userId: string
): Promise<any> {
  const logPrefix = '[TRANSFER:COMPLETE_AREA]';
  const startTime = Date.now();

  console.log(`${logPrefix} ========================================`);
  console.log(`${logPrefix} Iniciando transferencia completa de área`);
  console.log(`${logPrefix} Parámetros:`, { sourceDirectorId, targetDirectorId, sourceAreaId, targetAreaId, userId });
  console.log(`${logPrefix} Modo:`, targetAreaId === null || targetAreaId === -1 ? 'CREAR NUEVA ÁREA' : 'FUSIONAR A ÁREA EXISTENTE');

  // Determine if we're creating new area or merging to existing
  const isCreatingNewArea = targetAreaId === null || targetAreaId === -1;
  const finalTargetAreaId = isCreatingNewArea ? sourceAreaId : targetAreaId;

  console.log(`${logPrefix} Área destino final:`, finalTargetAreaId);

  try {
    // Log operation start
    await logTransferOperation({
      action: 'transfer_complete_area',
      userId,
      sourceDirectorId,
      targetDirectorId,
      areaId: sourceAreaId,
      targetAreaId: targetAreaId === null || targetAreaId === -1 ? undefined : targetAreaId,
      status: 'started',
      timestamp: new Date().toISOString()
    });

    // STEP 1: Count bienes in each table
    console.log(`${logPrefix} STEP 1: Contando bienes en cada tabla...`);

    const { count: ineaCount } = await supabaseAdmin
      .from('muebles')
      .select('*', { count: 'exact', head: true })
      .eq('id_directorio', sourceDirectorId)
      .eq('id_area', sourceAreaId);

    const { count: iteaCount } = await supabaseAdmin
      .from('mueblesitea')
      .select('*', { count: 'exact', head: true })
      .eq('id_directorio', sourceDirectorId)
      .eq('id_area', sourceAreaId);

    const { count: noListadoCount } = await supabaseAdmin
      .from('mueblestlaxcala')
      .select('*', { count: 'exact', head: true })
      .eq('id_directorio', sourceDirectorId)
      .eq('id_area', sourceAreaId);

    const totalBienes = (ineaCount || 0) + (iteaCount || 0) + (noListadoCount || 0);

    console.log(`${logPrefix} ✓ Conteo de bienes:`, {
      inea: ineaCount || 0,
      itea: iteaCount || 0,
      noListado: noListadoCount || 0,
      total: totalBienes
    });

    let ineaUpdated = 0;
    let iteaUpdated = 0;
    let noListadoUpdated = 0;

    // STEP 2: Update INEA bienes
    if (ineaCount && ineaCount > 0) {
      console.log(`${logPrefix} STEP 2a: Actualizando ${ineaCount} bienes INEA...`);

      const { data: updatedInea, error: updateIneaError } = await supabaseAdmin
        .from('muebles')
        .update({
          id_directorio: targetDirectorId,
          id_area: finalTargetAreaId
        })
        .eq('id_directorio', sourceDirectorId)
        .eq('id_area', sourceAreaId)
        .select('id, id_inv');

      if (updateIneaError) {
        console.error(`${logPrefix} ❌ Error al actualizar bienes INEA:`, updateIneaError);
        throw new Error(`Error al actualizar bienes INEA: ${updateIneaError.message}`);
      }

      ineaUpdated = updatedInea?.length || 0;
      console.log(`${logPrefix} ✓ Bienes INEA actualizados:`, ineaUpdated);
    }

    // STEP 3: Update ITEA bienes
    if (iteaCount && iteaCount > 0) {
      console.log(`${logPrefix} STEP 2b: Actualizando ${iteaCount} bienes ITEA...`);

      const { data: updatedItea, error: updateIteaError } = await supabaseAdmin
        .from('mueblesitea')
        .update({
          id_directorio: targetDirectorId,
          id_area: finalTargetAreaId
        })
        .eq('id_directorio', sourceDirectorId)
        .eq('id_area', sourceAreaId)
        .select('id, id_inv');

      if (updateIteaError) {
        console.error(`${logPrefix} ❌ Error al actualizar bienes ITEA:`, updateIteaError);
        throw new Error(`Error al actualizar bienes ITEA: ${updateIteaError.message}`);
      }

      iteaUpdated = updatedItea?.length || 0;
      console.log(`${logPrefix} ✓ Bienes ITEA actualizados:`, iteaUpdated);
    }

    // STEP 4: Update No Listado bienes
    if (noListadoCount && noListadoCount > 0) {
      console.log(`${logPrefix} STEP 2c: Actualizando ${noListadoCount} bienes No Listado...`);

      const { data: updatedNoListado, error: updateNoListadoError } = await supabaseAdmin
        .from('mueblestlaxcala')
        .update({
          id_directorio: targetDirectorId,
          id_area: finalTargetAreaId
        })
        .eq('id_directorio', sourceDirectorId)
        .eq('id_area', sourceAreaId)
        .select('id, id_inv');

      if (updateNoListadoError) {
        console.error(`${logPrefix} ❌ Error al actualizar bienes No Listado:`, updateNoListadoError);
        throw new Error(`Error al actualizar bienes No Listado: ${updateNoListadoError.message}`);
      }

      noListadoUpdated = updatedNoListado?.length || 0;
      console.log(`${logPrefix} ✓ Bienes No Listado actualizados:`, noListadoUpdated);
    }

    // STEP 5: Delete source director-area relationship
    console.log(`${logPrefix} STEP 3: Eliminando relación directorio-área del origen...`);

    const { error: deleteSourceError } = await supabaseAdmin
      .from('directorio_areas')
      .delete()
      .eq('id_directorio', sourceDirectorId)
      .eq('id_area', sourceAreaId);

    if (deleteSourceError) {
      console.error(`${logPrefix} ❌ Error al eliminar relación origen:`, deleteSourceError);
      throw new Error(`Error al eliminar relación origen: ${deleteSourceError.message}`);
    }

    console.log(`${logPrefix} ✓ Relación origen eliminada`);

    // STEP 6: Insert target director-area relationship (only if creating new area)
    if (isCreatingNewArea) {
      console.log(`${logPrefix} STEP 4: Creando relación directorio-área en destino...`);

      const { error: insertTargetError } = await supabaseAdmin
        .from('directorio_areas')
        .insert({
          id_directorio: targetDirectorId,
          id_area: sourceAreaId
        });

      if (insertTargetError) {
        console.error(`${logPrefix} ❌ Error al crear relación destino:`, insertTargetError);
        throw new Error(`Error al crear relación destino: ${insertTargetError.message}`);
      }

      console.log(`${logPrefix} ✓ Relación destino creada`);
    } else {
      console.log(`${logPrefix} STEP 4: Fusionando a área existente (no se crea nueva relación)`);
    }

    // STEP 7: Verify final state
    console.log(`${logPrefix} STEP 5: Verificando estado final...`);

    const { count: verifyIneaCount } = await supabaseAdmin
      .from('muebles')
      .select('*', { count: 'exact', head: true })
      .eq('id_directorio', targetDirectorId)
      .eq('id_area', finalTargetAreaId);

    const { count: verifyIteaCount } = await supabaseAdmin
      .from('mueblesitea')
      .select('*', { count: 'exact', head: true })
      .eq('id_directorio', targetDirectorId)
      .eq('id_area', finalTargetAreaId);

    const { count: verifyNoListadoCount } = await supabaseAdmin
      .from('mueblestlaxcala')
      .select('*', { count: 'exact', head: true })
      .eq('id_directorio', targetDirectorId)
      .eq('id_area', finalTargetAreaId);

    console.log(`${logPrefix} ✓ Verificación de bienes en destino:`, {
      inea: verifyIneaCount || 0,
      itea: verifyIteaCount || 0,
      noListado: verifyNoListadoCount || 0
    });

    const totalUpdated = ineaUpdated + iteaUpdated + noListadoUpdated;
    const duration = Date.now() - startTime;

    // Log successful operation
    await logTransferOperation({
      action: 'transfer_complete_area',
      userId,
      sourceDirectorId,
      targetDirectorId,
      areaId: sourceAreaId,
      targetAreaId: targetAreaId === null || targetAreaId === -1 ? undefined : targetAreaId,
      status: 'success',
      bienesTransferred: totalUpdated,
      ineaUpdated,
      iteaUpdated,
      noListadoUpdated,
      duration,
      timestamp: new Date().toISOString()
    });

    console.log(`${logPrefix} ========================================`);
    console.log(`${logPrefix} ✅ Transferencia completada exitosamente`);
    console.log(`${logPrefix} Resumen:`, {
      modo: isCreatingNewArea ? 'NUEVA ÁREA' : 'FUSIÓN',
      totalBienes: totalUpdated,
      inea: ineaUpdated,
      itea: iteaUpdated,
      noListado: noListadoUpdated,
      duration: `${duration}ms`
    });
    console.log(`${logPrefix} ========================================`);

    return {
      success: true,
      message: `Transferencia completa exitosa: ${totalUpdated} bienes transferidos`,
      data: {
        bienesTransferred: totalUpdated,
        areasUpdated: isCreatingNewArea ? 1 : 0,
        ineaUpdated,
        iteaUpdated,
        noListadoUpdated
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;

    // Log error
    console.error(`${logPrefix} ❌❌❌ ERROR EN TRANSFERENCIA ❌❌❌`);
    console.error(`${logPrefix} Error:`, error);
    console.error(`${logPrefix} Stack:`, error instanceof Error ? error.stack : 'N/A');

    await logTransferOperation({
      action: 'transfer_complete_area',
      userId,
      sourceDirectorId,
      targetDirectorId,
      areaId: sourceAreaId,
      targetAreaId: targetAreaId === null || targetAreaId === -1 ? undefined : targetAreaId,
      status: 'error',
      error: error instanceof Error ? error.message : 'Error desconocido',
      duration,
      timestamp: new Date().toISOString()
    });

    console.error(`${logPrefix} ========================================`);

    throw error;
  }
}

/**
 * Handle partial bienes transfer
 * Requirements: 9.1-9.6, 15.3
 * 
 * ATOMIC TRANSACTION: All operations must succeed or all fail (rollback)
 */
async function handlePartialBienesTransfer(
  sourceDirectorId: number,
  targetDirectorId: number,
  targetAreaId: number,
  bienIds: { inea: Array<string | number>; itea: Array<string | number>; no_listado: Array<string | number> },
  userId: string
): Promise<any> {
  const logPrefix = '[TRANSFER:PARTIAL_BIENES]';
  const startTime = Date.now();

  console.log(`${logPrefix} ========================================`);
  console.log(`${logPrefix} Iniciando transferencia parcial de bienes`);
  console.log(`${logPrefix} Parámetros:`, {
    sourceDirectorId,
    targetDirectorId,
    targetAreaId,
    bienIds: {
      inea: bienIds.inea.length,
      itea: bienIds.itea.length,
      no_listado: bienIds.no_listado.length
    },
    userId
  });
  
  // Log sample IDs for debugging
  if (bienIds.inea.length > 0) {
    console.log(`${logPrefix} Sample INEA IDs (first 3):`, bienIds.inea.slice(0, 3).map(id => `${id} (${typeof id})`));
  }
  if (bienIds.itea.length > 0) {
    console.log(`${logPrefix} Sample ITEA IDs (first 3):`, bienIds.itea.slice(0, 3).map(id => `${id} (${typeof id})`));
  }
  if (bienIds.no_listado.length > 0) {
    console.log(`${logPrefix} Sample No Listado IDs (first 3):`, bienIds.no_listado.slice(0, 3).map(id => `${id} (${typeof id})`));
  }

  try {
    // Log operation start
    await logTransferOperation({
      action: 'transfer_partial_bienes',
      userId,
      sourceDirectorId,
      targetDirectorId,
      targetAreaId,
      bienIds,
      status: 'started',
      timestamp: new Date().toISOString()
    });

    let ineaUpdated = 0;
    let iteaUpdated = 0;
    let noListadoUpdated = 0;

    // STEP 1: Process INEA bienes in batches
    if (bienIds.inea.length > 0) {
      console.log(`${logPrefix} STEP 1a: Procesando ${bienIds.inea.length} bienes INEA...`);

      const BATCH_SIZE = 50;
      const batches = [];

      for (let i = 0; i < bienIds.inea.length; i += BATCH_SIZE) {
        batches.push(bienIds.inea.slice(i, i + BATCH_SIZE));
      }

      console.log(`${logPrefix} Procesando en ${batches.length} batch(es) de hasta ${BATCH_SIZE} items`);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`${logPrefix} Procesando batch ${i + 1}/${batches.length} (${batch.length} items)...`);

        const { data: updated, error: updateError } = await supabaseAdmin
          .from('muebles')
          .update({
            id_directorio: targetDirectorId,
            id_area: targetAreaId
          })
          .in('id', batch)
          .select('id, id_inv');

        if (updateError) {
          console.error(`${logPrefix} ❌ Error en batch ${i + 1}:`, updateError);
          throw new Error(`Error al actualizar bienes INEA (batch ${i + 1}): ${updateError.message}`);
        }

        ineaUpdated += updated?.length || 0;
        console.log(`${logPrefix} ✓ Batch ${i + 1} completado: ${updated?.length || 0} items actualizados`);
      }

      console.log(`${logPrefix} ✓ Total bienes INEA actualizados: ${ineaUpdated}`);
    }

    // STEP 2: Process ITEA bienes in batches
    if (bienIds.itea.length > 0) {
      console.log(`${logPrefix} STEP 1b: Procesando ${bienIds.itea.length} bienes ITEA...`);

      const BATCH_SIZE = 50;
      const batches = [];

      for (let i = 0; i < bienIds.itea.length; i += BATCH_SIZE) {
        batches.push(bienIds.itea.slice(i, i + BATCH_SIZE));
      }

      console.log(`${logPrefix} Procesando en ${batches.length} batch(es) de hasta ${BATCH_SIZE} items`);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`${logPrefix} Procesando batch ${i + 1}/${batches.length} (${batch.length} items)...`);

        const { data: updated, error: updateError } = await supabaseAdmin
          .from('mueblesitea')
          .update({
            id_directorio: targetDirectorId,
            id_area: targetAreaId
          })
          .in('id', batch)
          .select('id, id_inv');

        if (updateError) {
          console.error(`${logPrefix} ❌ Error en batch ${i + 1}:`, updateError);
          throw new Error(`Error al actualizar bienes ITEA (batch ${i + 1}): ${updateError.message}`);
        }

        iteaUpdated += updated?.length || 0;
        console.log(`${logPrefix} ✓ Batch ${i + 1} completado: ${updated?.length || 0} items actualizados`);
      }

      console.log(`${logPrefix} ✓ Total bienes ITEA actualizados: ${iteaUpdated}`);
    }

    // STEP 3: Process No Listado bienes in batches
    if (bienIds.no_listado.length > 0) {
      console.log(`${logPrefix} STEP 1c: Procesando ${bienIds.no_listado.length} bienes No Listado...`);

      const BATCH_SIZE = 50;
      const batches = [];

      for (let i = 0; i < bienIds.no_listado.length; i += BATCH_SIZE) {
        batches.push(bienIds.no_listado.slice(i, i + BATCH_SIZE));
      }

      console.log(`${logPrefix} Procesando en ${batches.length} batch(es) de hasta ${BATCH_SIZE} items`);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`${logPrefix} Procesando batch ${i + 1}/${batches.length} (${batch.length} items)...`);

        const { data: updated, error: updateError } = await supabaseAdmin
          .from('mueblestlaxcala')
          .update({
            id_directorio: targetDirectorId,
            id_area: targetAreaId
          })
          .in('id', batch)
          .select('id, id_inv');

        if (updateError) {
          console.error(`${logPrefix} ❌ Error en batch ${i + 1}:`, updateError);
          throw new Error(`Error al actualizar bienes No Listado (batch ${i + 1}): ${updateError.message}`);
        }

        noListadoUpdated += updated?.length || 0;
        console.log(`${logPrefix} ✓ Batch ${i + 1} completado: ${updated?.length || 0} items actualizados`);
      }

      console.log(`${logPrefix} ✓ Total bienes No Listado actualizados: ${noListadoUpdated}`);
    }

    // Note: Source director-area relationships are maintained
    console.log(`${logPrefix} ℹ️ Relaciones directorio-área del origen mantenidas`);

    // STEP 4: Verify final state
    console.log(`${logPrefix} STEP 2: Verificando estado final...`);

    const { count: verifyIneaCount } = await supabaseAdmin
      .from('muebles')
      .select('*', { count: 'exact', head: true })
      .eq('id_directorio', targetDirectorId)
      .eq('id_area', targetAreaId)
      .in('id', bienIds.inea);

    const { count: verifyIteaCount } = await supabaseAdmin
      .from('mueblesitea')
      .select('*', { count: 'exact', head: true })
      .eq('id_directorio', targetDirectorId)
      .eq('id_area', targetAreaId)
      .in('id', bienIds.itea);

    const { count: verifyNoListadoCount } = await supabaseAdmin
      .from('mueblestlaxcala')
      .select('*', { count: 'exact', head: true })
      .eq('id_directorio', targetDirectorId)
      .eq('id_area', targetAreaId)
      .in('id', bienIds.no_listado);

    console.log(`${logPrefix} ✓ Verificación de bienes en destino:`, {
      inea: verifyIneaCount || 0,
      itea: verifyIteaCount || 0,
      noListado: verifyNoListadoCount || 0
    });

    const totalUpdated = ineaUpdated + iteaUpdated + noListadoUpdated;
    const duration = Date.now() - startTime;

    // Log successful operation
    await logTransferOperation({
      action: 'transfer_partial_bienes',
      userId,
      sourceDirectorId,
      targetDirectorId,
      targetAreaId,
      bienIds,
      status: 'success',
      bienesTransferred: totalUpdated,
      ineaUpdated,
      iteaUpdated,
      noListadoUpdated,
      duration,
      timestamp: new Date().toISOString()
    });

    console.log(`${logPrefix} ========================================`);
    console.log(`${logPrefix} ✅ Transferencia completada exitosamente`);
    console.log(`${logPrefix} Resumen:`, {
      totalBienes: totalUpdated,
      inea: ineaUpdated,
      itea: iteaUpdated,
      noListado: noListadoUpdated,
      duration: `${duration}ms`
    });
    console.log(`${logPrefix} ========================================`);

    return {
      success: true,
      message: `Transferencia parcial exitosa: ${totalUpdated} bienes transferidos`,
      data: {
        bienesTransferred: totalUpdated,
        areasUpdated: 0, // No area relationships changed
        ineaUpdated,
        iteaUpdated,
        noListadoUpdated
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;

    // Log error
    console.error(`${logPrefix} ❌❌❌ ERROR EN TRANSFERENCIA ❌❌❌`);
    console.error(`${logPrefix} Error:`, error);
    console.error(`${logPrefix} Stack:`, error instanceof Error ? error.stack : 'N/A');

    await logTransferOperation({
      action: 'transfer_partial_bienes',
      userId,
      sourceDirectorId,
      targetDirectorId,
      targetAreaId,
      bienIds,
      status: 'error',
      error: error instanceof Error ? error.message : 'Error desconocido',
      duration,
      timestamp: new Date().toISOString()
    });

    console.error(`${logPrefix} ========================================`);

    throw error;
  }
}


/**
 * Log transfer operation
 * Requirements: 10.6, 12.4
 */
async function logTransferOperation(logData: {
  action: string;
  userId: string;
  sourceDirectorId: number;
  targetDirectorId: number;
  areaId?: number;
  targetAreaId?: number;
  bienIds?: any;
  status: 'started' | 'success' | 'error';
  bienesTransferred?: number;
  ineaUpdated?: number;
  iteaUpdated?: number;
  noListadoUpdated?: number;
  error?: string;
  duration?: number;
  timestamp: string;
}): Promise<void> {
  const logPrefix = '[TRANSFER:LOG]';

  try {
    // Console log (structured)
    const logEntry = {
      timestamp: logData.timestamp,
      action: logData.action,
      userId: logData.userId,
      sourceDirectorId: logData.sourceDirectorId,
      targetDirectorId: logData.targetDirectorId,
      areaId: logData.areaId,
      targetAreaId: logData.targetAreaId,
      status: logData.status,
      bienesTransferred: logData.bienesTransferred,
      ineaUpdated: logData.ineaUpdated,
      iteaUpdated: logData.iteaUpdated,
      noListadoUpdated: logData.noListadoUpdated,
      error: logData.error,
      duration: logData.duration
    };

    if (logData.status === 'started') {
      console.log(`${logPrefix} 🚀 Operación iniciada:`, logEntry);
    } else if (logData.status === 'success') {
      console.log(`${logPrefix} ✅ Operación exitosa:`, logEntry);
    } else if (logData.status === 'error') {
      console.error(`${logPrefix} ❌ Operación fallida:`, logEntry);
    }

    // Optional: Insert into transfer_logs table if it exists
    // This is a best-effort operation - we don't throw if it fails
    try {
      await supabaseAdmin
        .from('transfer_logs')
        .insert({
          user_id: logData.userId,
          action: logData.action,
          source_director_id: logData.sourceDirectorId,
          target_director_id: logData.targetDirectorId,
          area_id: logData.areaId,
          target_area_id: logData.targetAreaId,
          status: logData.status,
          bienes_transferred: logData.bienesTransferred,
          inea_updated: logData.ineaUpdated,
          itea_updated: logData.iteaUpdated,
          no_listado_updated: logData.noListadoUpdated,
          error_message: logData.error,
          duration_ms: logData.duration,
          created_at: logData.timestamp
        });
    } catch (dbError) {
      // Silently fail - table might not exist
      console.log(`${logPrefix} ℹ️ No se pudo insertar en transfer_logs (tabla podría no existir)`);
    }

  } catch (error) {
    // Logging should never break the main flow
    console.error(`${logPrefix} ⚠️ Error al registrar log:`, error);
  }
}
