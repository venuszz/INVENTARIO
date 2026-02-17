/**
 * Utility functions for Consultar Resguardos component
 */

import supabase from '@/app/lib/supabase/client';

/**
 * Get exact article data from muebles table by ID and other properties
 * @param id_inv - Inventory number
 * @param origen - Source (INEA, ITEA, or TLAXCALA)
 * @returns Article data or null if not found
 */
export async function getExactArticulo(
  id_inv: string,
  origen: string
): Promise<any | null> {
  try {
    // Determine which table to query based on origen
    const tabla = origen === 'INEA' ? 'muebles' : 'mueblesitea';
    
    const { data, error } = await supabase
      .from(tabla)
      .select('*')
      .eq('id_inv', id_inv)
      .single();

    if (error) {
      console.error('Error fetching article:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getExactArticulo:', error);
    return null;
  }
}

/**
 * Clear resguardo-related fields in muebles table
 * Sets id_area and id_directorio to null (clearing assignment)
 * @param id_inv - Inventory number
 * @param origen - Source (INEA, ITEA, or NO_LISTADO)
 */
export async function limpiarDatosArticulo(
  id_inv: string,
  origen: string
): Promise<void> {
  console.log('🧹 [LIMPIAR] Iniciando limpiarDatosArticulo');
  console.log('📋 [LIMPIAR] Parámetros:', { id_inv, origen });

  try {
    // Determine which table to update based on origen
    const tabla = origen === 'ITEA' ? 'itea' : 
                 origen === 'NO_LISTADO' || origen === 'TLAXCALA' ? 'mueblestlaxcala' : 
                 'inea';
    
    console.log('📊 [LIMPIAR] Tabla determinada:', tabla);
    console.log('🔄 [LIMPIAR] Actualizando registro con id_inv:', id_inv);
    
    const { data, error } = await supabase
      .from(tabla)
      .update({ 
        id_area: null,
        id_directorio: null
      })
      .eq('id_inv', id_inv)
      .select();

    if (error) {
      console.error('❌ [LIMPIAR] Error al actualizar:', error);
      console.error('📊 [LIMPIAR] Detalles del error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('✅ [LIMPIAR] Registro actualizado exitosamente');
    console.log('📦 [LIMPIAR] Datos actualizados:', data);
  } catch (error) {
    console.error('❌ [LIMPIAR] ERROR CRÍTICO en limpiarDatosArticulo:', error);
    throw error;
  }
}
