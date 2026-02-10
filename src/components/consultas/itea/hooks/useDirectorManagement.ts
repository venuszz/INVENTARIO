import { useCallback } from 'react';
import supabase from '@/app/lib/supabase/client';
import type { FilterOptions } from '../types';

/**
 * Hook para gestionar directores y opciones de filtro
 * @returns Funciones para obtener directores y opciones de filtro
 */
export function useDirectorManagement() {
  /**
   * Obtiene la lista de directores desde la base de datos
   * @returns Array de objetos Directorio completos
   */
  const fetchDirectorio = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('directorio')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;

      if (data) {
        return data.map(item => ({
          id_directorio: item.id_directorio,
          nombre: item.nombre?.trim().toUpperCase() || null,
          area: item.area?.trim().toUpperCase() || null,
          puesto: item.puesto?.trim().toUpperCase() || null
        }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching directores:', error);
      return [];
    }
  }, []);

  /**
   * Obtiene las opciones de filtro desde la base de datos
   * @returns Objeto parcial con las opciones de filtro
   */
  const fetchFilterOptions = useCallback(async (): Promise<Partial<FilterOptions>> => {
    try {
      // Obtener estados desde mueblesitea
      const { data: estados } = await supabase
        .from('mueblesitea')
        .select('estado')
        .filter('estado', 'not.is', null)
        .limit(1000);

      // Obtener rubros desde config
      const { data: rubros } = await supabase
        .from('config')
        .select('concepto')
        .eq('tipo', 'rubro');

      // Obtener estatus desde config
      const { data: estatus } = await supabase
        .from('config')
        .select('concepto')
        .eq('tipo', 'estatus');

      // Obtener formas de adquisición desde config
      const { data: formasAdq } = await supabase
        .from('config')
        .select('concepto')
        .eq('tipo', 'formadq');

      return {
        estados: [...new Set(estados?.map(item => item.estado?.trim()).filter(Boolean))] as string[],
        rubros: rubros?.map(item => item.concepto?.trim()).filter(Boolean) || [],
        estatus: estatus?.map(item => item.concepto?.trim()).filter(Boolean) || [],
        formasAdq: formasAdq?.map(item => item.concepto?.trim()).filter(Boolean) || []
      };
    } catch (error) {
      console.error('Error al cargar opciones de filtro:', error);
      return {
        estados: [],
        rubros: [],
        estatus: [],
        formasAdq: []
      };
    }
  }, []);

  return { fetchDirectorio, fetchFilterOptions };
}
