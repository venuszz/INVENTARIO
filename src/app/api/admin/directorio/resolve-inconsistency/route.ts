import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function POST(request: NextRequest) {
  const logPrefix = '[API:RESOLVE_INCONSISTENCY]';
  console.log(`${logPrefix} ========================================`);
  console.log(`${logPrefix} Nueva solicitud de resolución`);

  try {
    const body = await request.json();
    const { action, areaId, directorId, directorIdToKeep } = body;

    console.log(`${logPrefix} Acción:`, action);
    console.log(`${logPrefix} Parámetros:`, { areaId, directorId, directorIdToKeep });

    switch (action) {
      case 'keep_one_director':
        return await handleKeepOneDirector(areaId, directorIdToKeep);
      
      case 'delete_director':
        return await handleDeleteDirector(directorId);
      
      case 'reassign_areas':
        return await handleReassignAreas(directorId, body.targetDirectorId);
      
      case 'remove_area_from_director':
        return await handleRemoveAreaFromDirector(areaId, directorId);
      
      case 'delete_area':
        return await handleDeleteArea(areaId);
      
      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error(`${logPrefix} ❌❌❌ ERROR CRÍTICO ❌❌❌`);
    console.error(`${logPrefix} Error:`, error);
    console.error(`${logPrefix} ========================================`);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

async function handleKeepOneDirector(areaId: number, directorIdToKeep: number) {
  const logPrefix = '[API:KEEP_ONE_DIRECTOR]';
  console.log(`${logPrefix} ========================================`);
  console.log(`${logPrefix} Iniciando resolución de área duplicada`);
  console.log(`${logPrefix} Parámetros:`, { areaId, directorIdToKeep });

  try {
    // STEP 1: Fetch directors to remove
    console.log(`${logPrefix} STEP 1: Obteniendo directores a eliminar...`);
    const { data: directorsToRemove, error: fetchError } = await supabaseAdmin
      .from('directorio_areas')
      .select('id_directorio')
      .eq('id_area', areaId)
      .neq('id_directorio', directorIdToKeep);

    if (fetchError) {
      console.error(`${logPrefix} ❌ Error al obtener directores:`, fetchError);
      throw new Error(`Error al obtener directores: ${fetchError.message}`);
    }

    console.log(`${logPrefix} ✓ Directores encontrados:`, directorsToRemove);

    if (!directorsToRemove || directorsToRemove.length === 0) {
      console.log(`${logPrefix} ⚠️ No hay directores para eliminar. Operación completada.`);
      return NextResponse.json({ 
        success: true, 
        message: 'No hay directores para eliminar',
        bienesTransferidos: 0
      });
    }

    const directorIdsToRemove = directorsToRemove.map(d => d.id_directorio);
    console.log(`${logPrefix} IDs a procesar:`, directorIdsToRemove);

    // STEP 2: Count bienes to transfer
    console.log(`${logPrefix} STEP 2: Contando bienes a transferir...`);
    
    const { count: ineaCount } = await supabaseAdmin
      .from('muebles')
      .select('*', { count: 'exact', head: true })
      .in('id_directorio', directorIdsToRemove)
      .eq('id_area', areaId);

    const { count: iteaCount } = await supabaseAdmin
      .from('mueblesitea')
      .select('*', { count: 'exact', head: true })
      .in('id_directorio', directorIdsToRemove)
      .eq('id_area', areaId);

    const { count: noListadoCount } = await supabaseAdmin
      .from('mueblestlaxcala')
      .select('*', { count: 'exact', head: true })
      .in('id_directorio', directorIdsToRemove)
      .eq('id_area', areaId);

    console.log(`${logPrefix} ✓ Conteo de bienes:`, {
      inea: ineaCount || 0,
      itea: iteaCount || 0,
      noListado: noListadoCount || 0,
      total: (ineaCount || 0) + (iteaCount || 0) + (noListadoCount || 0)
    });

    let totalUpdated = 0;

    // STEP 3: Update INEA bienes
    if (ineaCount && ineaCount > 0) {
      console.log(`${logPrefix} STEP 3a: Actualizando ${ineaCount} bienes INEA...`);
      const { data: updatedInea, error: updateIneaError } = await supabaseAdmin
        .from('muebles')
        .update({ id_directorio: directorIdToKeep })
        .in('id_directorio', directorIdsToRemove)
        .eq('id_area', areaId)
        .select('id, id_inv');

      if (updateIneaError) {
        console.error(`${logPrefix} ❌ Error al actualizar bienes INEA:`, updateIneaError);
        throw new Error(`Error al actualizar bienes INEA: ${updateIneaError.message}`);
      }

      totalUpdated += updatedInea?.length || 0;
      console.log(`${logPrefix} ✓ Bienes INEA actualizados:`, updatedInea?.length || 0);
    }

    // STEP 4: Update ITEA bienes
    if (iteaCount && iteaCount > 0) {
      console.log(`${logPrefix} STEP 3b: Actualizando ${iteaCount} bienes ITEA...`);
      const { data: updatedItea, error: updateIteaError } = await supabaseAdmin
        .from('mueblesitea')
        .update({ id_directorio: directorIdToKeep })
        .in('id_directorio', directorIdsToRemove)
        .eq('id_area', areaId)
        .select('id, id_inv');

      if (updateIteaError) {
        console.error(`${logPrefix} ❌ Error al actualizar bienes ITEA:`, updateIteaError);
        throw new Error(`Error al actualizar bienes ITEA: ${updateIteaError.message}`);
      }

      totalUpdated += updatedItea?.length || 0;
      console.log(`${logPrefix} ✓ Bienes ITEA actualizados:`, updatedItea?.length || 0);
    }

    // STEP 5: Update NO_LISTADO bienes
    if (noListadoCount && noListadoCount > 0) {
      console.log(`${logPrefix} STEP 3c: Actualizando ${noListadoCount} bienes NO_LISTADO...`);
      const { data: updatedNoListado, error: updateNoListadoError } = await supabaseAdmin
        .from('mueblestlaxcala')
        .update({ id_directorio: directorIdToKeep })
        .in('id_directorio', directorIdsToRemove)
        .eq('id_area', areaId)
        .select('id, id_inv');

      if (updateNoListadoError) {
        console.error(`${logPrefix} ❌ Error al actualizar bienes NO_LISTADO:`, updateNoListadoError);
        throw new Error(`Error al actualizar bienes NO_LISTADO: ${updateNoListadoError.message}`);
      }

      totalUpdated += updatedNoListado?.length || 0;
      console.log(`${logPrefix} ✓ Bienes NO_LISTADO actualizados:`, updatedNoListado?.length || 0);
    }

    // STEP 6: Delete area relationships
    console.log(`${logPrefix} STEP 4: Eliminando relaciones de área...`);
    const { data: deletedRelations, error: deleteError } = await supabaseAdmin
      .from('directorio_areas')
      .delete()
      .eq('id_area', areaId)
      .neq('id_directorio', directorIdToKeep)
      .select('id_directorio');

    if (deleteError) {
      console.error(`${logPrefix} ❌ Error al eliminar relaciones:`, deleteError);
      throw new Error(`Error al eliminar relaciones: ${deleteError.message}`);
    }

    console.log(`${logPrefix} ✓ Relaciones eliminadas:`, deletedRelations?.length || 0);

    // STEP 7: Verify final state
    console.log(`${logPrefix} STEP 5: Verificando estado final...`);
    const { count: remainingRelations } = await supabaseAdmin
      .from('directorio_areas')
      .select('*', { count: 'exact', head: true })
      .eq('id_area', areaId);

    console.log(`${logPrefix} ✓ Relaciones restantes para área ${areaId}:`, remainingRelations);

    if (remainingRelations !== 1) {
      console.warn(`${logPrefix} ⚠️ ADVERTENCIA: Se esperaba 1 relación, pero hay ${remainingRelations}`);
    }

    console.log(`${logPrefix} ========================================`);
    console.log(`${logPrefix} ✅ Resolución completada exitosamente`);
    console.log(`${logPrefix} Resumen:`, {
      areaId,
      directorMantenido: directorIdToKeep,
      directoresEliminados: directorIdsToRemove.length,
      bienesTransferidos: totalUpdated
    });
    console.log(`${logPrefix} ========================================`);

    return NextResponse.json({
      success: true,
      message: 'Área duplicada resuelta exitosamente',
      bienesTransferidos: totalUpdated,
      directoresEliminados: directorIdsToRemove.length
    });

  } catch (error) {
    console.error(`${logPrefix} ❌❌❌ ERROR CRÍTICO ❌❌❌`);
    console.error(`${logPrefix} Error:`, error);
    console.error(`${logPrefix} ========================================`);
    throw error;
  }
}

async function handleDeleteDirector(directorId: number) {
  const logPrefix = '[API:DELETE_DIRECTOR]';
  console.log(`${logPrefix} ========================================`);
  console.log(`${logPrefix} Eliminando director ${directorId}...`);

  try {
    // STEP 1: Get areas assigned to this director
    console.log(`${logPrefix} STEP 1: Obteniendo áreas del director...`);
    const { data: directorAreas, error: fetchAreasError } = await supabaseAdmin
      .from('directorio_areas')
      .select('id_area')
      .eq('id_directorio', directorId);

    if (fetchAreasError) {
      console.error(`${logPrefix} ❌ Error al obtener áreas:`, fetchAreasError);
      throw new Error(`Error al obtener áreas: ${fetchAreasError.message}`);
    }

    const areaIds = directorAreas?.map(a => a.id_area) || [];
    console.log(`${logPrefix} ✓ Áreas encontradas:`, areaIds);

    // STEP 2: Delete area assignments for this director
    console.log(`${logPrefix} STEP 2: Eliminando relaciones de áreas...`);
    const { error: deleteAreasError } = await supabaseAdmin
      .from('directorio_areas')
      .delete()
      .eq('id_directorio', directorId);

    if (deleteAreasError) {
      console.error(`${logPrefix} ❌ Error al eliminar relaciones:`, deleteAreasError);
      throw new Error(`Error al eliminar relaciones: ${deleteAreasError.message}`);
    }

    console.log(`${logPrefix} ✓ Relaciones eliminadas`);

    // STEP 3: Delete areas that are not assigned to any other director
    if (areaIds.length > 0) {
      console.log(`${logPrefix} STEP 3: Eliminando áreas sin otros directores...`);
      
      for (const areaId of areaIds) {
        // Check if this area is assigned to any other director
        const { count: otherDirectorsCount } = await supabaseAdmin
          .from('directorio_areas')
          .select('*', { count: 'exact', head: true })
          .eq('id_area', areaId);

        if (otherDirectorsCount === 0) {
          // No other directors have this area, safe to delete
          const { error: deleteAreaError } = await supabaseAdmin
            .from('area')
            .delete()
            .eq('id_area', areaId);

          if (deleteAreaError) {
            console.error(`${logPrefix} ⚠️ Error al eliminar área ${areaId}:`, deleteAreaError);
            // Continue with other areas even if one fails
          } else {
            console.log(`${logPrefix} ✓ Área ${areaId} eliminada`);
          }
        } else {
          console.log(`${logPrefix} ℹ️ Área ${areaId} conservada (asignada a ${otherDirectorsCount} otros directores)`);
        }
      }
    }

    // STEP 4: Delete director
    console.log(`${logPrefix} STEP 4: Eliminando director...`);
    const { error: deleteDirectorError } = await supabaseAdmin
      .from('directorio')
      .delete()
      .eq('id_directorio', directorId);

    if (deleteDirectorError) {
      console.error(`${logPrefix} ❌ Error al eliminar director:`, deleteDirectorError);
      throw new Error(`Error al eliminar director: ${deleteDirectorError.message}`);
    }

    console.log(`${logPrefix} ✓ Director eliminado`);
    console.log(`${logPrefix} ========================================`);
    console.log(`${logPrefix} ✅ Eliminación completada exitosamente`);
    console.log(`${logPrefix} ========================================`);

    return NextResponse.json({
      success: true,
      message: 'Director eliminado exitosamente'
    });
  } catch (error) {
    console.error(`${logPrefix} ❌❌❌ ERROR CRÍTICO ❌❌❌`);
    console.error(`${logPrefix} Error:`, error);
    console.error(`${logPrefix} ========================================`);
    throw error;
  }
}

async function handleRemoveAreaFromDirector(areaId: number, directorId: number) {
  const logPrefix = '[API:REMOVE_AREA]';
  console.log(`${logPrefix} Removiendo área ${areaId} del director ${directorId}...`);

  try {
    const { error: deleteError } = await supabaseAdmin
      .from('directorio_areas')
      .delete()
      .eq('id_area', areaId)
      .eq('id_directorio', directorId);

    if (deleteError) throw deleteError;

    console.log(`${logPrefix} ✅ Área removida exitosamente`);

    return NextResponse.json({
      success: true,
      message: 'Área removida del director exitosamente'
    });
  } catch (error) {
    console.error(`${logPrefix} ❌ Error:`, error);
    throw error;
  }
}

async function handleReassignAreas(sourceDirectorId: number, targetDirectorId: number) {
  const logPrefix = '[API:REASSIGN_AREAS]';
  console.log(`${logPrefix} ========================================`);
  console.log(`${logPrefix} Iniciando reasignación de áreas`);
  console.log(`${logPrefix} Parámetros:`, { sourceDirectorId, targetDirectorId });

  try {
    // STEP 1: Fetch areas assigned to source director
    console.log(`${logPrefix} STEP 1: Obteniendo áreas del director origen...`);
    const { data: areasToReassign, error: fetchAreasError } = await supabaseAdmin
      .from('directorio_areas')
      .select('id_area, area:id_area(nombre)')
      .eq('id_directorio', sourceDirectorId);

    if (fetchAreasError) {
      console.error(`${logPrefix} ❌ Error al obtener áreas:`, fetchAreasError);
      throw new Error(`Error al obtener áreas: ${fetchAreasError.message}`);
    }

    console.log(`${logPrefix} ✓ Áreas encontradas:`, areasToReassign?.length || 0);

    if (!areasToReassign || areasToReassign.length === 0) {
      console.log(`${logPrefix} ⚠️ No hay áreas para reasignar. Procediendo a eliminar director.`);
      return await handleDeleteDirector(sourceDirectorId);
    }

    const areaIds = areasToReassign.map(a => a.id_area);
    console.log(`${logPrefix} IDs de áreas a reasignar:`, areaIds);

    // STEP 2: Check if target director already has any of these areas
    console.log(`${logPrefix} STEP 2: Verificando áreas existentes en director destino...`);
    const { data: existingAreas, error: checkExistingError } = await supabaseAdmin
      .from('directorio_areas')
      .select('id_area')
      .eq('id_directorio', targetDirectorId)
      .in('id_area', areaIds);

    if (checkExistingError) {
      console.error(`${logPrefix} ❌ Error al verificar áreas existentes:`, checkExistingError);
      throw new Error(`Error al verificar áreas existentes: ${checkExistingError.message}`);
    }

    const existingAreaIds = existingAreas?.map(a => a.id_area) || [];
    console.log(`${logPrefix} ✓ Áreas que ya tiene el director destino:`, existingAreaIds);

    // STEP 3: Delete relationships for areas that target director already has
    if (existingAreaIds.length > 0) {
      console.log(`${logPrefix} STEP 3a: Eliminando relaciones duplicadas (${existingAreaIds.length})...`);
      const { error: deleteDuplicatesError } = await supabaseAdmin
        .from('directorio_areas')
        .delete()
        .eq('id_directorio', sourceDirectorId)
        .in('id_area', existingAreaIds);

      if (deleteDuplicatesError) {
        console.error(`${logPrefix} ❌ Error al eliminar duplicados:`, deleteDuplicatesError);
        throw new Error(`Error al eliminar duplicados: ${deleteDuplicatesError.message}`);
      }

      console.log(`${logPrefix} ✓ Relaciones duplicadas eliminadas`);
    }

    // STEP 4: Update remaining areas to target director
    const areasToUpdate = areaIds.filter(id => !existingAreaIds.includes(id));
    
    if (areasToUpdate.length > 0) {
      console.log(`${logPrefix} STEP 3b: Actualizando ${areasToUpdate.length} áreas al director destino...`);
      const { data: updatedAreas, error: updateAreasError } = await supabaseAdmin
        .from('directorio_areas')
        .update({ id_directorio: targetDirectorId })
        .eq('id_directorio', sourceDirectorId)
        .in('id_area', areasToUpdate)
        .select('id_area');

      if (updateAreasError) {
        console.error(`${logPrefix} ❌ Error al actualizar áreas:`, updateAreasError);
        throw new Error(`Error al actualizar áreas: ${updateAreasError.message}`);
      }

      console.log(`${logPrefix} ✓ Áreas actualizadas:`, updatedAreas?.length || 0);
    }

    // STEP 5: Delete source director
    console.log(`${logPrefix} STEP 4: Eliminando director origen...`);
    const { error: deleteDirectorError } = await supabaseAdmin
      .from('directorio')
      .delete()
      .eq('id_directorio', sourceDirectorId);

    if (deleteDirectorError) {
      console.error(`${logPrefix} ❌ Error al eliminar director:`, deleteDirectorError);
      throw new Error(`Error al eliminar director: ${deleteDirectorError.message}`);
    }

    console.log(`${logPrefix} ✓ Director origen eliminado`);

    // STEP 6: Verify final state
    console.log(`${logPrefix} STEP 5: Verificando estado final...`);
    const { count: remainingRelations } = await supabaseAdmin
      .from('directorio_areas')
      .select('*', { count: 'exact', head: true })
      .eq('id_directorio', sourceDirectorId);

    console.log(`${logPrefix} ✓ Relaciones restantes del director origen:`, remainingRelations);

    if (remainingRelations !== 0) {
      console.warn(`${logPrefix} ⚠️ ADVERTENCIA: Se esperaban 0 relaciones, pero hay ${remainingRelations}`);
    }

    console.log(`${logPrefix} ========================================`);
    console.log(`${logPrefix} ✅ Reasignación completada exitosamente`);
    console.log(`${logPrefix} Resumen:`, {
      directorOrigen: sourceDirectorId,
      directorDestino: targetDirectorId,
      areasReasignadas: areasToUpdate.length,
      areasDuplicadasEliminadas: existingAreaIds.length,
      totalAreas: areaIds.length
    });
    console.log(`${logPrefix} ========================================`);

    return NextResponse.json({
      success: true,
      message: 'Áreas reasignadas exitosamente',
      areasReasignadas: areasToUpdate.length,
      areasDuplicadasEliminadas: existingAreaIds.length
    });

  } catch (error) {
    console.error(`${logPrefix} ❌❌❌ ERROR CRÍTICO ❌❌❌`);
    console.error(`${logPrefix} Error:`, error);
    console.error(`${logPrefix} ========================================`);
    throw error;
  }
}

async function handleDeleteArea(areaId: number) {
  const logPrefix = '[API:DELETE_AREA]';
  console.log(`${logPrefix} Eliminando área ${areaId}...`);

  try {
    // Delete director assignments
    const { error: deleteAssignmentsError } = await supabaseAdmin
      .from('directorio_areas')
      .delete()
      .eq('id_area', areaId);

    if (deleteAssignmentsError) throw deleteAssignmentsError;

    // Delete area
    const { error: deleteAreaError } = await supabaseAdmin
      .from('area')
      .delete()
      .eq('id_area', areaId);

    if (deleteAreaError) throw deleteAreaError;

    console.log(`${logPrefix} ✅ Área eliminada exitosamente`);

    return NextResponse.json({
      success: true,
      message: 'Área eliminada exitosamente'
    });
  } catch (error) {
    console.error(`${logPrefix} ❌ Error:`, error);
    throw error;
  }
}
