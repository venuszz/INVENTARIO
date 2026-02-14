/**
 * Hook for managing resguardante editing operations
 * Handles editing state, updates, and saving to database
 */

import { useState, useCallback } from 'react';
import supabase from '@/app/lib/supabase/client';

interface UseResguardantesEditReturn {
  editingResguardante: { [id: number]: boolean };
  editedResguardantes: { [id: number]: string };
  toggleEdit: (articuloId: number, currentValue: string) => void;
  updateResguardante: (articuloId: number, value: string) => void;
  saveResguardante: (articuloId: number, numInventario: string, origen: string) => Promise<void>;
  cancelEdit: (articuloId: number, originalValue: string) => void;
  saving: boolean;
  error: string | null;
  success: string | null;
  clearMessages: () => void;
}

/**
 * Custom hook for managing resguardante field editing
 * @param onSuccess - Callback to execute after successful save
 * @returns Object with editing state and handler functions
 */
export function useResguardantesEdit(
  onSuccess: () => void
): UseResguardantesEditReturn {
  const [editingResguardante, setEditingResguardante] = useState<{ [id: number]: boolean }>({});
  const [editedResguardantes, setEditedResguardantes] = useState<{ [id: number]: string }>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Toggle edit mode for a specific article
   */
  const toggleEdit = useCallback((articuloId: number, currentValue: string) => {
    setEditingResguardante(prev => ({
      ...prev,
      [articuloId]: !prev[articuloId]
    }));
    
    // Initialize edited value with current value
    setEditedResguardantes(prev => ({
      ...prev,
      [articuloId]: currentValue || ''
    }));
  }, []);

  /**
   * Update the edited resguardante value
   */
  const updateResguardante = useCallback((articuloId: number, value: string) => {
    setEditedResguardantes(prev => ({
      ...prev,
      [articuloId]: value
    }));
  }, []);

  /**
   * Save resguardante changes to database
   * Updates resguardos table and appropriate muebles table
   */
  const saveResguardante = useCallback(async (
    articuloId: number,
    numInventario: string,
    origen: string
  ) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const nuevoResguardante = editedResguardantes[articuloId] || '';

      // 1. Update resguardos table using id
      const { error: resguardosError } = await supabase
        .from('resguardos')
        .update({ resguardante: nuevoResguardante })
        .eq('id', articuloId);

      if (resguardosError) throw resguardosError;

      // 2. Update muebles/itea/no_listado table based on origen
      const tabla = origen === 'ITEA' ? 'itea' : 
                   origen === 'NO_LISTADO' ? 'no_listado' : 
                   'inea';
      
      const { error: mueblesError } = await supabase
        .from(tabla)
        .update({ resguardante: nuevoResguardante })
        .eq('id_inv', numInventario);

      if (mueblesError) throw mueblesError;

      // Clear editing state for this article
      setEditingResguardante(prev => ({
        ...prev,
        [articuloId]: false
      }));

      setSuccess('Resguardante actualizado correctamente');
      
      // Call success callback to refetch data
      onSuccess();
    } catch (err) {
      console.error('Error al guardar resguardante:', err);
      setError('Error al actualizar el resguardante');
    } finally {
      setSaving(false);
    }
  }, [editedResguardantes, onSuccess]);

  /**
   * Cancel edit and revert to original value
   */
  const cancelEdit = useCallback((articuloId: number, originalValue: string) => {
    setEditingResguardante(prev => ({
      ...prev,
      [articuloId]: false
    }));
    
    setEditedResguardantes(prev => ({
      ...prev,
      [articuloId]: originalValue || ''
    }));
  }, []);

  /**
   * Clear error and success messages
   */
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    editingResguardante,
    editedResguardantes,
    toggleEdit,
    updateResguardante,
    saveResguardante,
    cancelEdit,
    saving,
    error,
    success,
    clearMessages
  };
}
