import { useState, useCallback } from 'react';
import supabase from '@/app/lib/supabase/client';
import { Directorio, FilterOptions } from '../types';

export function useDirectorManagement() {
    const [directorio, setDirectorio] = useState<Directorio[]>([]);

    const fetchDirectorio = useCallback(async () => {
        try {
            const { data: directorioData, error } = await supabase
                .from('directorio')
                .select('*');
                
            if (error) throw error;

            setDirectorio(directorioData || []);

            // Return directores for filter options
            if (directorioData) {
                const directores = directorioData.map(item => ({
                    nombre: item.nombre?.trim().toUpperCase() || ''
                }));
                return directores;
            }
            return [];
        } catch (err) {
            console.error('Error al cargar directorio:', err);
            return [];
        }
    }, []);

    const fetchFilterOptions = useCallback(async () => {
        try {
            // Obtener estados únicos desde mueblestlaxcala
            const { data: estados } = await supabase
                .from('mueblestlaxcala')
                .select('estado')
                .filter('estado', 'not.is', null)
                .limit(1000);

            // Obtener rubros desde la tabla config
            const { data: rubrosData } = await supabase
                .from('config')
                .select('concepto')
                .eq('tipo', 'rubro');

            // Obtener formas de adquisición desde la tabla config
            const { data: formadqData } = await supabase
                .from('config')
                .select('concepto')
                .eq('tipo', 'formadq');

            // Obtener estatus desde la tabla config
            const { data: estatusData } = await supabase
                .from('config')
                .select('concepto')
                .eq('tipo', 'estatus');

            // Obtener áreas desde la tabla area
            const { data: areasData } = await supabase
                .from('area')
                .select('nombre')
                .not('nombre', 'is', null);

            const filterOptions: Partial<FilterOptions> = {
                estados: [...new Set(estados?.map(item => item.estado).filter(Boolean))] as string[],
                rubros: rubrosData?.map(item => item.concepto).filter(Boolean) || [],
                formadq: formadqData?.map(item => item.concepto).filter(Boolean) || [],
                estatus: estatusData?.map(item => item.concepto).filter(Boolean) || [],
                areas: [...new Set(areasData?.map(item => item.nombre).filter(Boolean))] as string[]
            };

            return filterOptions;
        } catch (error) {
            console.error('Error al cargar opciones de filtro:', error);
            return {};
        }
    }, []);

    return {
        directorio,
        setDirectorio,
        fetchDirectorio,
        fetchFilterOptions
    };
}
