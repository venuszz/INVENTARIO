import { useCallback } from 'react';
import supabase from '@/app/lib/supabase/client';
import { useAdminIndexation } from '@/hooks/indexation/useAdminIndexation';
import type { Area } from '@/types/admin';

interface UseAreaManagementReturn {
  createAreaIfNeeded: (areaName: string) => Promise<number>;
  getAreasForDirector: (directorId: number) => Area[];
}

/**
 * Hook to handle area creation and management
 */
export function useAreaManagement(): UseAreaManagementReturn {
  const { areas, directorioAreas } = useAdminIndexation();

  /**
   * Create an area if it doesn't exist, return the area ID
   */
  const createAreaIfNeeded = useCallback(async (areaName: string): Promise<number> => {
    const normalizedName = areaName.trim().toUpperCase();

    // Check if area already exists (case-insensitive)
    const existingArea = areas.find(
      area => area.nombre.toUpperCase() === normalizedName
    );

    if (existingArea) {
      return existingArea.id_area;
    }

    // Create new area
    const { data: newArea, error } = await supabase
      .from('area')
      .insert({ nombre: normalizedName })
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear área: ${error.message}`);
    }

    if (!newArea) {
      throw new Error('No se pudo crear el área');
    }

    return newArea.id_area;
  }, [areas]);

  /**
   * Get all areas for a specific director
   */
  const getAreasForDirector = useCallback((directorId: number): Area[] => {
    // Get area IDs for this director
    const areaIds = directorioAreas
      .filter(rel => rel.id_directorio === directorId)
      .map(rel => rel.id_area);

    // Get area objects
    return areas.filter(area => areaIds.includes(area.id_area));
  }, [areas, directorioAreas]);

  return {
    createAreaIfNeeded,
    getAreasForDirector,
  };
}
