import { useState, useCallback, useMemo } from 'react';
import type { ResguardoBajaArticulo } from '../types';

interface UseItemSelectionReturn {
  selectedItems: { [key: string]: boolean };
  handleItemSelection: (articleId: number) => void;
  handleGroupSelection: (folioBaja: string, groupArticles: ResguardoBajaArticulo[]) => void;
  clearSelections: () => void;
  getSelectedItemsGroupedByFolio: (
    allArticles: ResguardoBajaArticulo[]
  ) => Array<{ folio_baja: string; articulos: ResguardoBajaArticulo[] }>;
  selectedCount: number;
  hasSelection: boolean;
}

/**
 * Hook for managing item selection state in the bajas list
 * Handles individual item selection, group selection, and selection clearing
 */
export const useItemSelection = (): UseItemSelectionReturn => {
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: boolean }>({});

  /**
   * Toggle selection for a single article
   */
  const handleItemSelection = useCallback((articleId: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [articleId]: !prev[articleId]
    }));
  }, []);

  /**
   * Toggle selection for all articles in a group (by folio_baja)
   */
  const handleGroupSelection = useCallback((folioBaja: string, groupArticles: ResguardoBajaArticulo[]) => {
    setSelectedItems(prev => {
      const newSelectedItems = { ...prev };
      const allSelected = groupArticles.every(article => prev[article.id]);

      groupArticles.forEach(article => {
        newSelectedItems[article.id] = !allSelected;
      });

      return newSelectedItems;
    });
  }, []);

  /**
   * Clear all selections
   */
  const clearSelections = useCallback(() => {
    setSelectedItems({});
  }, []);

  /**
   * Get selected articles grouped by folio_baja
   * If no items are selected, returns all articles in a single group
   */
  const getSelectedItemsGroupedByFolio = useCallback(
    (allArticles: ResguardoBajaArticulo[]) => {
      const selectedArticles = allArticles.filter(art => selectedItems[art.id]);

      if (selectedArticles.length === 0) {
        // If no selection, return all articles grouped by their folio_baja
        const grouped = allArticles.reduce((acc, art) => {
          const found = acc.find(g => g.folio_baja === art.folio_baja);
          if (found) {
            found.articulos.push(art);
          } else {
            acc.push({
              folio_baja: art.folio_baja,
              articulos: [art]
            });
          }
          return acc;
        }, [] as Array<{ folio_baja: string; articulos: ResguardoBajaArticulo[] }>);
        return grouped;
      }

      // Group selected articles by folio_baja
      const grouped = selectedArticles.reduce((acc, art) => {
        const found = acc.find(g => g.folio_baja === art.folio_baja);
        if (found) {
          found.articulos.push(art);
        } else {
          acc.push({
            folio_baja: art.folio_baja,
            articulos: [art]
          });
        }
        return acc;
      }, [] as Array<{ folio_baja: string; articulos: ResguardoBajaArticulo[] }>);

      return grouped;
    },
    [selectedItems]
  );

  /**
   * Count of selected items
   */
  const selectedCount = useMemo(() => {
    return Object.values(selectedItems).filter(Boolean).length;
  }, [selectedItems]);

  /**
   * Whether any items are selected
   */
  const hasSelection = useMemo(() => {
    return selectedCount > 0;
  }, [selectedCount]);

  return {
    selectedItems,
    handleItemSelection,
    handleGroupSelection,
    clearSelections,
    getSelectedItemsGroupedByFolio,
    selectedCount,
    hasSelection
  };
};
