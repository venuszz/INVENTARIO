import { useState, useMemo, useDeferredValue } from 'react';
import type { DirectorioWithStats } from '../types';

interface UseDirectorioSearchReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredDirectorio: DirectorioWithStats[];
  highlightedAreas: Set<number>;
}

/**
 * Hook to handle search and filtering logic for directorio
 * Implements debounced search with area highlighting
 */
export function useDirectorioSearch(
  directorio: DirectorioWithStats[]
): UseDirectorioSearchReturn {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Use deferred value for automatic debouncing (React 18+)
  const debouncedSearchTerm = useDeferredValue(searchTerm);

  // Filter directorio and track highlighted areas
  const { filteredDirectorio, highlightedAreas } = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return {
        filteredDirectorio: directorio,
        highlightedAreas: new Set<number>(),
      };
    }

    const searchLower = debouncedSearchTerm.toLowerCase().trim();
    const highlighted = new Set<number>();
    
    const filtered = directorio.filter(employee => {
      // Search by nombre
      if (employee.nombre?.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search by puesto
      if (employee.puesto?.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Search by id_directorio (exact match or starts with)
      if (employee.id_directorio.toString().includes(searchLower)) {
        return true;
      }

      // Search by area names
      const matchingAreas = employee.areas.filter(area =>
        area.nombre.toLowerCase().includes(searchLower)
      );

      if (matchingAreas.length > 0) {
        // Add matching area IDs to highlighted set
        matchingAreas.forEach(area => highlighted.add(area.id_area));
        return true;
      }

      return false;
    });

    return {
      filteredDirectorio: filtered,
      highlightedAreas: highlighted,
    };
  }, [directorio, debouncedSearchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    filteredDirectorio,
    highlightedAreas,
  };
}
