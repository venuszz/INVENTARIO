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

            // Return directores for filter options with full data
            if (directorioData) {
                const directores = directorioData.map(item => ({
                    id_directorio: item.id_directorio,
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

            // Obtener estatus desde la tabla config con id y concepto
            const { data: estatusData } = await supabase
                .from('config')
                .select('id, concepto')
                .eq('tipo', 'estatus');

            // Obtener áreas desde la tabla area con id y nombre
            const { data: areasData } = await supabase
                .from('area')
                .select('id_area, nombre')
                .not('nombre', 'is', null);

            const filterOptions: Partial<FilterOptions> = {
                estados: [...new Set(estados?.map(item => item.estado).filter(Boolean))] as string[],
                rubros: rubrosData?.map(item => item.concepto).filter(Boolean) || [],
                formadq: formadqData?.map(item => item.concepto).filter(Boolean) || [],
                estatus: estatusData?.map(item => ({ id: item.id, concepto: item.concepto?.trim() })).filter(item => item.concepto) || [],
                areas: areasData?.map(item => ({ id_area: item.id_area, nombre: item.nombre })).filter(item => item.nombre) || []
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
