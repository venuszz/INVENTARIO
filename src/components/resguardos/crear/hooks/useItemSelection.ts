/**
 * Custom hook for managing item selection with validation
 * 
 * Handles selection logic, validates usufinal and area consistency,
 * and manages select-all functionality
 */

import { useState, useCallback } from 'react';
import type { Mueble } from '../types';

export interface UseItemSelectionReturn {
  selectedMuebles: Mueble[];
  toggleSelection: (mueble: Mueble) => void;
  removeItem: (mueble: Mueble) => void;
  clearSelection: () => void;
  updateItemResguardante: (itemId: string, resguardante: string) => void;
  selectAllPage: (items: Mueble[]) => { success: boolean; error?: string };
  areAllPageSelected: (items: Mueble[]) => boolean;
  isSomePageSelected: (items: Mueble[]) => boolean;
  canSelectAllPage: (items: Mueble[]) => boolean;
  // Conflict detection
  usufinalConflict: string | null;
  areaConflict: string | null;
  clearConflicts: () => void;
}

/**
 * Hook for managing item selection with validation
 * 
 * @returns Object containing selection state and functions
 */
export function useItemSelection(): UseItemSelectionReturn {
  const [selectedMuebles, setSelectedMuebles] = useState<Mueble[]>([]);
  const [usufinalConflict, setUsufinalConflict] = useState<string | null>(null);
  const [areaConflict, setAreaConflict] = useState<string | null>(null);

  const toggleSelection = useCallback((mueble: Mueble) => {
    const isAlreadySelected = selectedMuebles.some(m => m.id === mueble.id);

    if (isAlreadySelected) {
      setSelectedMuebles(prev => prev.filter(m => m.id !== mueble.id));
      return;
    }

    // Validate usufinal consistency
    const currentUsufinal = selectedMuebles[0]?.usufinal?.trim().toUpperCase();
    const newUsufinal = mueble.usufinal?.trim().toUpperCase();

    if (selectedMuebles.length > 0 && currentUsufinal && newUsufinal && currentUsufinal !== newUsufinal) {
      setUsufinalConflict(newUsufinal || '');
      return;
    }

    // Validate area consistency
    const currentArea = selectedMuebles[0]?.area?.trim().toUpperCase();
    const newArea = mueble.area?.trim().toUpperCase();

    if (selectedMuebles.length > 0 && currentArea && newArea && currentArea !== newArea) {
      setAreaConflict(newArea || '');
      return;
    }

    setSelectedMuebles(prev => [...prev, mueble]);
  }, [selectedMuebles]);

  const removeItem = useCallback((mueble: Mueble) => {
    setSelectedMuebles(prev => prev.filter(m => m.id !== mueble.id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedMuebles([]);
  }, []);

  const updateItemResguardante = useCallback((itemId: string, resguardante: string) => {
    setSelectedMuebles(prev => 
      prev.map(m => m.id === itemId ? { ...m, resguardanteAsignado: resguardante } : m)
    );
  }, []);

  const canSelectAllPage = useCallback((items: Mueble[]): boolean => {
    if (items.length === 0) return false;
    if (selectedMuebles.length === 0) return true;

    const currentUsufinal = selectedMuebles[0]?.usufinal?.trim().toUpperCase();
    const currentArea = selectedMuebles[0]?.area?.trim().toUpperCase();

    return items.every(m =>
      (!currentUsufinal || (m.usufinal?.trim().toUpperCase() === currentUsufinal)) &&
      (!currentArea || (m.area?.trim().toUpperCase() === currentArea))
    );
  }, [selectedMuebles]);

  const areAllPageSelected = useCallback((items: Mueble[]): boolean => {
    return items.length > 0 && items.every(m => selectedMuebles.some(s => s.id === m.id));
  }, [selectedMuebles]);

  const isSomePageSelected = useCallback((items: Mueble[]): boolean => {
    return items.some(m => selectedMuebles.some(s => s.id === m.id));
  }, [selectedMuebles]);

  const selectAllPage = useCallback((items: Mueble[]): { success: boolean; error?: string } => {
    if (areAllPageSelected(items)) {
      // Deselect all items on page
      setSelectedMuebles(prev => prev.filter(m => !items.some(p => p.id === m.id)));
      return { success: true };
    }

    // Select all items on page
    const newSelection = [...selectedMuebles];
    let constraintUsufinal = selectedMuebles[0]?.usufinal?.trim().toUpperCase();
    let constraintArea = selectedMuebles[0]?.area?.trim().toUpperCase();

    if (!constraintUsufinal && items.length > 0) {
      constraintUsufinal = items[0]?.usufinal?.trim().toUpperCase();
    }
    if (!constraintArea && items.length > 0) {
      constraintArea = items[0]?.area?.trim().toUpperCase();
    }

    const canAddAll = items.every(m =>
      (!constraintUsufinal || (m.usufinal?.trim().toUpperCase() === constraintUsufinal)) &&
      (!constraintArea || (m.area?.trim().toUpperCase() === constraintArea))
    );

    if (!canAddAll) {
      return {
        success: false,
        error: 'No puedes seleccionar todos los artículos de la página porque no pertenecen al mismo responsable o área.'
      };
    }

    items.forEach(m => {
      if (!newSelection.some(s => s.id === m.id)) {
        newSelection.push(m);
      }
    });

    setSelectedMuebles(newSelection);
    return { success: true };
  }, [selectedMuebles, areAllPageSelected]);

  const clearConflicts = useCallback(() => {
    setUsufinalConflict(null);
    setAreaConflict(null);
  }, []);

  return {
    selectedMuebles,
    toggleSelection,
    removeItem,
    clearSelection,
    updateItemResguardante,
    selectAllPage,
    areAllPageSelected,
    isSomePageSelected,
    canSelectAllPage,
    usufinalConflict,
    areaConflict,
    clearConflicts,
  };
}
