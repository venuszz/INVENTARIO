import { useState, useEffect, useCallback } from 'react';
import supabase from '@/app/lib/supabase/client';
import { FilterOptions } from '../types';

interface UseFilterOptionsReturn {
  filterOptions: FilterOptions;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const initialFilterOptions: FilterOptions = {
  estados: [],
  estatus: [],
  areas: [],
  rubros: [],
  formasAdquisicion: ['Compra', 'Donación', 'Transferencia', 'Comodato'],
  causasBaja: ['Obsolescencia', 'Daño irreparable', 'Robo o extravío', 'Transferencia', 'Donación'],
  usuarios: []
};

export function useFilterOptions(): UseFilterOptionsReturn {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(initialFilterOptions);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFilterOptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Helper function to fetch unique values from a table
      const fetchUniqueValues = async (table: string, column: string): Promise<string[]> => {
        const { data } = await supabase
          .from(table)
          .select(column)
          .not(column, 'is', null);

        return data?.map((item) =>
          (item[column as keyof typeof item] as string)?.trim().toUpperCase()
        ).filter(Boolean) || [];
      };

      // Helper function to fetch config values
      const fetchConfigValues = async (tipo: string): Promise<string[]> => {
        const { data } = await supabase
          .from('config')
          .select('concepto')
          .eq('tipo', tipo);

        return data?.map(item => item.concepto?.trim().toUpperCase()).filter(Boolean) || [];
      };

      // Fetch estados from both tables
      const estadosMuebles = await fetchUniqueValues('muebles', 'estado');
      const estadosMueblesItea = await fetchUniqueValues('mueblesitea', 'estado');
      const estadosUnicos = [...new Set([...estadosMuebles, ...estadosMueblesItea])];

      // Fetch estatus from config table or fallback to table values
      const estatusConfig = await fetchConfigValues('estatus');
      const estatusUnicos = estatusConfig.length > 0
        ? estatusConfig
        : [...new Set([
            ...(await fetchUniqueValues('muebles', 'estatus')),
            ...(await fetchUniqueValues('mueblesitea', 'estatus'))
          ])];

      // Fetch rubros from config table or fallback to table values
      const rubrosConfig = await fetchConfigValues('rubro');
      const rubrosUnicos = rubrosConfig.length > 0
        ? rubrosConfig
        : [...new Set(await fetchUniqueValues('mueblesitea', 'rubro'))];

      // Fetch formas de adquisición from config table or use defaults
      const formasConfig = await fetchConfigValues('formadq');
      const formasAdquisicion = formasConfig.length > 0
        ? formasConfig
        : ['Compra', 'Donación', 'Transferencia', 'Comodato'];

      // Fetch areas from areas table
      const { data: areasData } = await supabase
        .from('areas')
        .select('itea')
        .not('itea', 'is', null);

      const areasUnicas = [...new Set(
        areasData?.map(item => item.itea?.trim().toUpperCase()).filter(Boolean) || []
      )];

      // Fetch usuarios from directorio table
      const { data: directorioData } = await supabase.from('directorio').select('*');
      const usuarios = directorioData?.map(item => ({
        nombre: item.nombre?.trim().toUpperCase() || '',
        area: item.area?.trim().toUpperCase() || ''
      })) || [];

      setFilterOptions({
        estados: estadosUnicos,
        estatus: estatusUnicos,
        areas: areasUnicas,
        rubros: rubrosUnicos,
        formasAdquisicion: formasAdquisicion,
        causasBaja: initialFilterOptions.causasBaja,
        usuarios: usuarios
      });
    } catch (err) {
      console.error('Error loading filter options:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  return {
    filterOptions,
    isLoading,
    error,
    refetch: fetchFilterOptions
  };
}
