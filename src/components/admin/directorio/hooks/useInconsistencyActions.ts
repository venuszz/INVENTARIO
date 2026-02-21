import { useState } from 'react';
import supabase from '@/app/lib/supabase/client';

interface UseInconsistencyActionsReturn {
  keepOneDirector: (areaId: number, directorId: number) => Promise<void>;
  removeAreaFromDirector: (areaId: number, directorId: number) => Promise<void>;
  deleteDirector: (directorId: number) => Promise<void>;
  deleteArea: (areaId: number) => Promise<void>;
  isExecuting: boolean;
  error: string | null;
}

export function useInconsistencyActions(): UseInconsistencyActionsReturn {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const keepOneDirector = async (areaId: number, directorIdToKeep: number) => {
    setIsExecuting(true);
    setError(null);

    try {
      // Remove area from all directors except the one to keep
      const { error: deleteError } = await supabase
        .from('directorio_area')
        .delete()
        .eq('id_area', areaId)
        .neq('id_directorio', directorIdToKeep);

      if (deleteError) throw deleteError;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al mantener director';
      setError(message);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  const removeAreaFromDirector = async (areaId: number, directorId: number) => {
    setIsExecuting(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('directorio_area')
        .delete()
        .eq('id_area', areaId)
        .eq('id_directorio', directorId);

      if (deleteError) throw deleteError;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al remover área';
      setError(message);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  const deleteDirector = async (directorId: number) => {
    setIsExecuting(true);
    setError(null);

    try {
      // First, delete all area assignments
      const { error: deleteAreasError } = await supabase
        .from('directorio_area')
        .delete()
        .eq('id_directorio', directorId);

      if (deleteAreasError) throw deleteAreasError;

      // Then, delete the director
      const { error: deleteDirectorError } = await supabase
        .from('directorio')
        .delete()
        .eq('id_directorio', directorId);

      if (deleteDirectorError) throw deleteDirectorError;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar director';
      setError(message);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  const deleteArea = async (areaId: number) => {
    setIsExecuting(true);
    setError(null);

    try {
      // First, delete all director assignments
      const { error: deleteAssignmentsError } = await supabase
        .from('directorio_area')
        .delete()
        .eq('id_area', areaId);

      if (deleteAssignmentsError) throw deleteAssignmentsError;

      // Then, delete the area
      const { error: deleteAreaError } = await supabase
        .from('area')
        .delete()
        .eq('id_area', areaId);

      if (deleteAreaError) throw deleteAreaError;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar área';
      setError(message);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    keepOneDirector,
    removeAreaFromDirector,
    deleteDirector,
    deleteArea,
    isExecuting,
    error,
  };
}
