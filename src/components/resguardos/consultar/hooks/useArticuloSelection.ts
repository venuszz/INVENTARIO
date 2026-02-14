/**
 * Hook for managing multiple article selection
 * Handles selection state for batch operations
 */

import { useState, useCallback, useMemo } from 'react';

interface UseArticuloSelectionReturn {
  selectedArticulos: string[];
  toggleSelection: (articuloId: string) => void;
  clearSelection: () => void;
  selectAll: (articuloIds: string[]) => void;
  isSelected: (articuloId: string) => boolean;
  selectedCount: number;
}

/**
 * Custom hook for managing article selection
 * @returns Object with selection state and handler functions
 */
export function useArticuloSelection(): UseArticuloSelectionReturn {
  const [selectedArticulos, setSelectedArticulos] = useState<string[]>([]);

  /**
   * Toggle selection for a specific article
   */
  const toggleSelection = useCallback((articuloId: string) => {
    setSelectedArticulos(prev =>
      prev.includes(articuloId)
        ? prev.filter(id => id !== articuloId)
        : [...prev, articuloId]
    );
  }, []);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedArticulos([]);
  }, []);

  /**
   * Select all articles
   */
  const selectAll = useCallback((articuloIds: string[]) => {
    setSelectedArticulos(articuloIds);
  }, []);

  /**
   * Check if an article is selected
   */
  const isSelected = useCallback((articuloId: string): boolean => {
    return selectedArticulos.includes(articuloId);
  }, [selectedArticulos]);

  /**
   * Get count of selected articles
   */
  const selectedCount = useMemo(() => {
    return selectedArticulos.length;
  }, [selectedArticulos]);

  return {
    selectedArticulos,
    toggleSelection,
    clearSelection,
    selectAll,
    isSelected,
    selectedCount
  };
}
