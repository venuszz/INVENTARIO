import { useState, useEffect } from 'react';
import supabase from '@/app/lib/supabase/client';
import { Area } from '../types';

export function useAreaManagement() {
    const [areas, setAreas] = useState<Area[]>([]);
    const [directorAreasMap, setDirectorAreasMap] = useState<{ [id_directorio: number]: number[] }>({});

    useEffect(() => {
        async function fetchAreasAndRelations() {
            // Fetch areas
            const { data: areasData } = await supabase
                .from('area')
                .select('*')
                .order('nombre');
            setAreas(areasData || []);

            // Fetch director-area relationships
            const { data: rels } = await supabase
                .from('directorio_areas')
                .select('*');
                
            if (rels) {
                const map: { [id_directorio: number]: number[] } = {};
                rels.forEach((rel: { id_directorio: number, id_area: number }) => {
                    if (!map[rel.id_directorio]) map[rel.id_directorio] = [];
                    map[rel.id_directorio].push(rel.id_area);
                });
                setDirectorAreasMap(map);
            }
        }
        
        fetchAreasAndRelations();
    }, []);

    return {
        areas,
        setAreas,
        directorAreasMap,
        setDirectorAreasMap
    };
}
