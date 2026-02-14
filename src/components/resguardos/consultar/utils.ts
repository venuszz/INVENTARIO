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
 * Sets resguardante to empty string (not null)
 * @param id_inv - Inventory number
 * @param origen - Source (INEA, ITEA, or NO_LISTADO)
 */
export async function limpiarDatosArticulo(
  id_inv: string,
  origen: string
): Promise<void> {
  try {
    // Determine which table to update based on origen
    const tabla = origen === 'ITEA' ? 'itea' : 
                 origen === 'NO_LISTADO' ? 'no_listado' : 
                 'inea';
    
    const { error } = await supabase
      .from(tabla)
      .update({ 
        resguardante: '' 
      })
      .eq('id_inv', id_inv);

    if (error) {
      console.error('Error clearing article data:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in limpiarDatosArticulo:', error);
    throw error;
  }
}
