import { useState, useCallback } from 'react';
import supabase from '@/app/lib/supabase/client';
import type { Area } from '../types';

interface UseAreaManagementReturn {
  areas: Area[];
  directorAreasMap: Record<number, number[]>;
  fetchAreas: () => Promise<void>;
}

export function useAreaManagement(): UseAreaManagementReturn {
  const [areas, setAreas] = useState<Area[]>([]);
  const [directorAreasMap, setDirectorAreasMap] = useState<Record<number, number[]>>({});

  const fetchAreas = useCallback(async () => {
    try {
      // Fetch all areas
      const { data: areasData, error: areasError } = await supabase
        .from('area')
        .select('id_area, nombre');
      
      if (areasError) throw areasError;
      
      setAreas(areasData || []);

      // Fetch director-area relationships
      const { data: relacionesData, error: relacionesError } = await supabase
        .from('directorio_areas')
        .select('id_directorio, id_area');
      
      if (relacionesError) throw relacionesError;

      // Build director-area map
      const map: Record<number, number[]> = {};
      (relacionesData || []).forEach(rel => {
        if (!map[rel.id_directorio]) {
          map[rel.id_directorio] = [];
        }
        map[rel.id_directorio].push(rel.id_area);
      });
      
      setDirectorAreasMap(map);
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  }, []);

  return {
    areas,
    directorAreasMap,
    fetchAreas,
  };
}
