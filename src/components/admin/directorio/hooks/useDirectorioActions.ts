import { useState, useCallback } from 'react';
import supabase from '@/app/lib/supabase/client';
import type { DirectorioFormData, ReassignmentData } from '../types';

interface UseDirectorioActionsReturn {
  addEmployee: (data: DirectorioFormData) => Promise<void>;
  updateEmployee: (id: number, data: DirectorioFormData) => Promise<void>;
  deleteEmployee: (id: number) => Promise<void>;
  reassignGoods: (data: ReassignmentData) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to encapsulate all CRUD operations for directorio management
 */
export function useDirectorioActions(): UseDirectorioActionsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Add a new employee to the directory
   */
  const addEmployee = useCallback(async (data: DirectorioFormData) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Insert into directorio table
      const { data: newEmployee, error: insertError } = await supabase
        .from('directorio')
        .insert({
          nombre: data.nombre.toUpperCase(),
          puesto: data.puesto ? data.puesto.toUpperCase() : null,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      if (!newEmployee) throw new Error('No se pudo crear el empleado');

      // 2. For each area, check if exists and create if needed
      for (const areaId of data.selectedAreas) {
        // Insert into directorio_areas
        const { error: relationError } = await supabase
          .from('directorio_areas')
          .insert({
            id_directorio: newEmployee.id_directorio,
            id_area: areaId,
          });

        if (relationError) throw relationError;
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al agregar empleado';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update an existing employee
   */
  const updateEmployee = useCallback(async (id: number, data: DirectorioFormData) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Update directorio table
      const { error: updateError } = await supabase
        .from('directorio')
        .update({
          nombre: data.nombre.toUpperCase(),
          puesto: data.puesto ? data.puesto.toUpperCase() : null,
        })
        .eq('id_directorio', id);

      if (updateError) throw updateError;

      // 2. Delete old directorio_areas relationships
      const { error: deleteError } = await supabase
        .from('directorio_areas')
        .delete()
        .eq('id_directorio', id);

      if (deleteError) throw deleteError;

      // 3. Insert new directorio_areas relationships
      for (const areaId of data.selectedAreas) {
        const { error: insertError } = await supabase
          .from('directorio_areas')
          .insert({
            id_directorio: id,
            id_area: areaId,
          });

        if (insertError) throw insertError;
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar empleado';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete an employee from the directory
   * Note: Validation should be done before calling this function
   */
  const deleteEmployee = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      // Delete from directorio (CASCADE deletes directorio_areas)
      const { error: deleteError } = await supabase
        .from('directorio')
        .delete()
        .eq('id_directorio', id);

      if (deleteError) throw deleteError;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar empleado';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reassign goods from one resguardante to another
   * Returns true if all goods were successfully reassigned
   */
  const reassignGoods = useCallback(async (data: ReassignmentData): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Validate destination resguardante exists
      const { data: destExists, error: destError } = await supabase
        .from('directorio')
        .select('id_directorio')
        .eq('id_directorio', data.toResguardanteId)
        .single();

      if (destError || !destExists) {
        throw new Error('Resguardante destino no existe');
      }

      // 2. Validate goods exist
      const { data: goodsExist, error: goodsError } = await supabase
        .from('goods')
        .select('id')
        .in('id', data.goodIds);

      if (goodsError) throw goodsError;
      if (!goodsExist || goodsExist.length !== data.goodIds.length) {
        throw new Error('Algunos bienes no existen');
      }

      // 3. Execute batch update
      const { error: updateError } = await supabase
        .from('goods')
        .update({ key_resguardante: data.toResguardanteId })
        .in('id', data.goodIds);

      if (updateError) throw updateError;

      // 4. Verify all goods updated correctly
      const { data: verifiedGoods, error: verifyError } = await supabase
        .from('goods')
        .select('id, key_resguardante')
        .in('id', data.goodIds);

      if (verifyError) throw verifyError;

      const allUpdated = verifiedGoods?.every(
        (g: any) => g.key_resguardante === data.toResguardanteId
      ) ?? false;

      if (!allUpdated) {
        throw new Error('No todos los bienes se actualizaron correctamente');
      }

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al reasignar bienes';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    addEmployee,
    updateEmployee,
    deleteEmployee,
    reassignGoods,
    loading,
    error,
  };
}
