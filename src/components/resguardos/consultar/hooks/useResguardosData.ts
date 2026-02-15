/**
 * useResguardosData - Hook for fetching and managing resguardos list
 * Handles search, filtering, sorting, and pagination
 */

import { useState, useEffect, useCallback, useDeferredValue } from 'react';
import { useResguardosStore } from '@/stores/resguardosStore';
import { useIneaStore } from '@/stores/ineaStore';
import { useIteaStore } from '@/stores/iteaStore';
import { useNoListadoStore } from '@/stores/noListadoStore';
import { useAdminStore } from '@/stores/adminStore';
import { Resguardo, ActiveFilter } from '../types';

export interface UseResguardosDataReturn {
  resguardos: Resguardo[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  // Filters
  activeFilters: ActiveFilter[];
  setActiveFilters: (filters: ActiveFilter[]) => void;
  clearFilters: () => void;
  // Sorting
  sortField: 'folio' | 'fecha' | 'director' | 'resguardantes';
  sortDirection: 'asc' | 'desc';
  setSort: (field: 'folio' | 'fecha' | 'director' | 'resguardantes') => void;
  // Pagination
  currentPage: number;
  setCurrentPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (rows: number) => void;
  totalPages: number;
  // Unique values for filters
  directores: string[];
  resguardantes: string[];
  // Refetch
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing resguardos data with filters and pagination
 */
export function useResguardosData(): UseResguardosDataReturn {
  // Get resguardos from store
  const resguardosFromStore = useResguardosStore(state => state.resguardos);
  
  // Get muebles stores for area lookup
  const ineaMuebles = useIneaStore(state => state.muebles);
  const iteaMuebles = useIteaStore(state => state.muebles);
  const noListadoMuebles = useNoListadoStore(state => state.muebles);
  
  // Get areas store for area name lookup
  const areas = useAdminStore(state => state.areas);
  
  const [resguardos, setResguardos] = useState<Resguardo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Filters - now using activeFilters array
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  // Sorting
  const [sortField, setSortField] = useState<'folio' | 'fecha' | 'director' | 'resguardantes'>('folio');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Unique values for filter dropdowns
  const [directores, setDirectores] = useState<string[]>([]);
  const [resguardantes, setResguardantes] = useState<string[]>([]);

  // Debounced active filters (100ms delay)
  const deferredActiveFilters = useDeferredValue(activeFilters);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setActiveFilters([]);
    setCurrentPage(1);
  }, []);

  /**
   * Toggle sort direction or change sort field
   */
  const setSort = useCallback((field: 'folio' | 'fecha' | 'director' | 'resguardantes') => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  /**
   * Process resguardos from store with filters, sorting, and pagination
   */
  const processResguardos = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Group by unique folio and aggregate resguardantes, area, and count
      const foliosMap = new Map<string, {
        folio: string;
        fecha: string;
        director: string;
        area: string;
        resguardantes: Set<string>;
        articulosCount: number;
      }>();

      resguardosFromStore.forEach(record => {
        if (!foliosMap.has(record.folio)) {
          // Get area from mueble based on origen and id_mueble
          let areaNombre = 'Sin área';
          let idArea: number | null = null;
          
          // Find the mueble to get id_area
          if (record.origen === 'INEA') {
            const mueble = ineaMuebles.find(m => m.id === record.id_mueble);
            idArea = mueble?.id_area ?? null;
          } else if (record.origen === 'ITEA') {
            const mueble = iteaMuebles.find(m => m.id === record.id_mueble);
            idArea = mueble?.id_area ?? null;
          } else if (record.origen === 'NO_LISTADO') {
            const mueble = noListadoMuebles.find(m => m.id === record.id_mueble);
            idArea = mueble?.id_area ?? null;
          }
          
          // Get area name from areas store
          if (idArea !== null) {
            const area = areas.find(a => a.id_area === idArea);
            areaNombre = area?.nombre ?? 'Sin área';
          }

          foliosMap.set(record.folio, {
            folio: record.folio,
            fecha: record.f_resguardo,
            director: record.director_nombre || 'Sin director',
            area: areaNombre,
            resguardantes: new Set(),
            articulosCount: 0
          });
        }
        const folioData = foliosMap.get(record.folio)!;
        if (record.resguardante) {
          folioData.resguardantes.add(record.resguardante);
        }
        folioData.articulosCount++;
      });

      // Convert to array and format
      let uniqueResguardos = Array.from(foliosMap.values()).map(item => ({
        folio: item.folio,
        fecha: item.fecha,
        director: item.director,
        area: item.area,
        resguardantes: Array.from(item.resguardantes).join(', '),
        articulosCount: item.articulosCount
      }));

      // 2. Apply filters
      if (deferredActiveFilters.length > 0) {
        uniqueResguardos = uniqueResguardos.filter(resguardo => {
          return deferredActiveFilters.every(filter => {
            if (!filter.term) return true;
            
            const term = filter.term.toLowerCase();
            
            switch (filter.type) {
              case 'folio':
                return resguardo.folio.toLowerCase().includes(term);
              case 'director':
                return resguardo.director.toLowerCase().includes(term);
              case 'resguardante':
                return resguardo.resguardantes.toLowerCase().includes(term);
              case 'fecha':
                return resguardo.fecha === filter.term;
              default:
                // If type is null, try to match any field
                return (
                  resguardo.folio.toLowerCase().includes(term) ||
                  resguardo.director.toLowerCase().includes(term) ||
                  resguardo.resguardantes.toLowerCase().includes(term)
                );
            }
          });
        });
      }

      setTotalCount(uniqueResguardos.length);

      // 3. Sort
      const sorted = [...uniqueResguardos].sort((a, b) => {
        const dir = sortDirection === 'asc' ? 1 : -1;
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (aVal < bVal) return -1 * dir;
        if (aVal > bVal) return 1 * dir;
        return 0;
      });

      // 4. Paginate
      const from = (currentPage - 1) * rowsPerPage;
      const to = from + rowsPerPage;
      const paginated = sorted.slice(from, to);

      setResguardos(paginated);
      setError(null);
    } catch (err) {
      setError('Error al procesar los resguardos');
      console.error('Error processing resguardos:', err);
    } finally {
      setLoading(false);
    }
  }, [
    resguardosFromStore,
    ineaMuebles,
    iteaMuebles,
    noListadoMuebles,
    areas,
    deferredActiveFilters,
    sortField,
    sortDirection,
    currentPage,
    rowsPerPage
  ]);

  /**
   * Extract unique directores and resguardantes from store
   */
  const extractUniqueValues = useCallback(() => {
    const uniqueDirectores = new Set<string>();
    const uniqueResguardantes = new Set<string>();

    resguardosFromStore.forEach(record => {
      if (record.director_nombre) {
        uniqueDirectores.add(record.director_nombre);
      }
      if (record.resguardante) {
        uniqueResguardantes.add(record.resguardante);
      }
    });

    setDirectores(Array.from(uniqueDirectores).sort());
    setResguardantes(Array.from(uniqueResguardantes).sort());
  }, [resguardosFromStore]);

  // Process data when dependencies change
  useEffect(() => {
    processResguardos();
  }, [processResguardos]);

  // Extract unique values when store changes
  useEffect(() => {
    extractUniqueValues();
  }, [extractUniqueValues]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredActiveFilters]);

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  return {
    resguardos,
    loading,
    error,
    totalCount,
    // Filters
    activeFilters,
    setActiveFilters,
    clearFilters,
    // Sorting
    sortField,
    sortDirection,
    setSort,
    // Pagination
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    totalPages,
    // Unique values
    directores,
    resguardantes,
    // Refetch
    refetch: async () => { await processResguardos(); }
  };
}
