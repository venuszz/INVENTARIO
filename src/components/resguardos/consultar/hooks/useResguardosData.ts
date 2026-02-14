/**
 * useResguardosData - Hook for fetching and managing resguardos list
 * Handles search, filtering, sorting, and pagination
 */

import { useState, useEffect, useCallback, useDeferredValue } from 'react';
import supabase from '@/app/lib/supabase/client';
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
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
   * Fetch resguardos with filters, sorting, and pagination
   */
  const fetchResguardos = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Build query with filters and relational data
      let query = supabase
        .from('resguardos')
        .select(`
          folio, 
          f_resguardo, 
          id_directorio,
          directorio!inner (
            nombre,
            puesto
          ),
          id_mueble,
          origen,
          puesto_resguardo,
          resguardante,
          created_by
        `, { count: 'exact' });

      // Apply filters from activeFilters array
      for (const filter of deferredActiveFilters) {
        if (!filter.term) continue;
        
        switch (filter.type) {
          case 'folio':
            query = query.ilike('folio', `%${filter.term}%`);
            break;
          case 'director':
            query = query.or(`directorio.nombre.ilike.%${filter.term.trim().toUpperCase()}%`);
            break;
          case 'resguardante':
            query = query.ilike('resguardante', `%${filter.term.trim().toUpperCase()}%`);
            break;
          case 'fecha':
            query = query.eq('f_resguardo::date', filter.term);
            break;
          default:
            // If type is null, try to match any field
            if (filter.type === null) {
              query = query.or(`folio.ilike.%${filter.term}%,resguardante.ilike.%${filter.term}%,directorio.nombre.ilike.%${filter.term}%`);
            }
            break;
        }
      }

      // Fetch all matching records
      const { data: allData, error: queryError } = await query;
      if (queryError) throw queryError;

      // 2. Group by unique folio and aggregate resguardantes
      const foliosMap = new Map<string, {
        folio: string;
        fecha: string;
        director: string;
        resguardantes: Set<string>;
      }>();

      (allData || []).forEach(record => {
        if (!foliosMap.has(record.folio)) {
          // Get director name from relational data
          const directorNombre = (record.directorio as any)?.nombre || '';
          
          foliosMap.set(record.folio, {
            folio: record.folio,
            fecha: record.f_resguardo,
            director: directorNombre,
            resguardantes: new Set()
          });
        }
        const folioData = foliosMap.get(record.folio)!;
        if (record.resguardante) {
          folioData.resguardantes.add(record.resguardante);
        }
      });

      // Convert to array and format
      const uniqueResguardos = Array.from(foliosMap.values()).map(item => ({
        folio: item.folio,
        fecha: item.fecha,
        director: item.director,
        resguardantes: Array.from(item.resguardantes).join(', ')
      }));

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
      setError('Error al cargar los resguardos');
      console.error('Error fetching resguardos:', err);
    } finally {
      setLoading(false);
    }
  }, [
    deferredActiveFilters,
    sortField,
    sortDirection,
    currentPage,
    rowsPerPage
  ]);

  /**
   * Fetch unique directores and resguardantes for filter dropdowns
   */
  const fetchUniqueValues = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('resguardos')
        .select(`
          directorio!inner (
            nombre
          ),
          resguardante
        `);

      if (error) throw error;

      const uniqueDirectores = new Set<string>();
      const uniqueResguardantes = new Set<string>();

      (data || []).forEach(record => {
        const directorNombre = (record.directorio as any)?.nombre;
        if (directorNombre) uniqueDirectores.add(directorNombre);
        if (record.resguardante) uniqueResguardantes.add(record.resguardante);
      });

      setDirectores(Array.from(uniqueDirectores).sort());
      setResguardantes(Array.from(uniqueResguardantes).sort());
    } catch (err) {
      console.error('Error fetching unique values:', err);
    }
  }, []);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchResguardos();
  }, [fetchResguardos]);

  // Fetch unique values on mount
  useEffect(() => {
    fetchUniqueValues();
  }, [fetchUniqueValues]);

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
    refetch: fetchResguardos
  };
}
