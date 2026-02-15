import { useState, useCallback, useMemo, useEffect } from 'react';
import supabase from '@/app/lib/supabase/client';
import type { ResguardoBaja, SortField, SortDirection, ActiveFilter } from '../types';

interface UseBajasDataProps {
  activeFilters?: ActiveFilter[];
}

export function useBajasData({ activeFilters = [] }: UseBajasDataProps) {
  const [bajas, setBajas] = useState<ResguardoBaja[]>([]);
  const [allBajas, setAllBajas] = useState<ResguardoBaja[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchBajas = useCallback(async () => {
    setLoading(true);
    try {
      let baseQuery = supabase
        .from('resguardos_bajas')
        .select('*');

      // Apply filters from activeFilters
      activeFilters.forEach(filter => {
        const term = filter.term.trim().toUpperCase();
        switch (filter.type) {
          case 'folioResguardo':
            baseQuery = baseQuery.ilike('folio_resguardo', `%${term}%`);
            break;
          case 'folioBaja':
            baseQuery = baseQuery.ilike('folio_baja', `%${term}%`);
            break;
          case 'director':
            baseQuery = baseQuery.ilike('dir_area', `%${term}%`);
            break;
          case 'resguardante':
            baseQuery = baseQuery.ilike('usufinal', `%${term}%`);
            break;
          case 'fecha':
            baseQuery = baseQuery.eq('f_resguardo::date', term);
            break;
        }
      });

      const { data: allData, error: queryError } = await baseQuery;

      if (queryError) throw queryError;

      // Set allBajas for search suggestions
      setAllBajas(allData || []);

      const uniqueFolios = Array.from(
        new Map(
          allData?.map(item => [item.folio_resguardo, item])
        ).values()
      );

      const totalUniqueFolios = uniqueFolios.length;
      setTotalCount(totalUniqueFolios);

      const totalPages = Math.ceil(totalUniqueFolios / rowsPerPage);
      const adjustedCurrentPage = Math.min(currentPage, totalPages || 1);
      if (adjustedCurrentPage !== currentPage) {
        setCurrentPage(adjustedCurrentPage);
      }

      const from = (adjustedCurrentPage - 1) * rowsPerPage;

      const paginatedData = uniqueFolios
        .sort((a, b) => {
          if (sortField === 'id') {
            return sortDirection === 'asc' ? a.id - b.id : b.id - a.id;
          }
          if (sortField === 'f_resguardo') {
            return sortDirection === 'asc'
              ? new Date(a.f_resguardo).getTime() - new Date(b.f_resguardo).getTime()
              : new Date(b.f_resguardo).getTime() - new Date(a.f_resguardo).getTime();
          }
          if (sortField === 'dir_area' || sortField === 'folio_resguardo') {
            const aValue = a[sortField]?.toLowerCase() || '';
            const bValue = b[sortField]?.toLowerCase() || '';
            return sortDirection === 'asc'
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }
          return 0;
        })
        .slice(from, from + rowsPerPage);

      setBajas(paginatedData || []);
      setError(null);
    } catch (err) {
      setError('Error al cargar los resguardos dados de baja');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, sortField, sortDirection, activeFilters]);

  const setSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  }, [sortField, sortDirection]);

  const totalPages = useMemo(() => Math.ceil(totalCount / rowsPerPage), [totalCount, rowsPerPage]);
  
  const foliosUnicos = useMemo(() => 
    Array.from(new Map(bajas.map(r => [r.folio_resguardo, r])).values()),
    [bajas]
  );

  return {
    bajas,
    allBajas,
    loading,
    error,
    currentPage,
    rowsPerPage,
    totalCount,
    sortField,
    sortDirection,
    totalPages,
    foliosUnicos,
    fetchBajas,
    setCurrentPage,
    setRowsPerPage,
    setSort,
    refetch: fetchBajas,
    setAllBajas,
  };
}
