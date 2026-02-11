import { useState, useEffect, useCallback } from 'react';
import supabase from '@/app/lib/supabase/client';
import { useIneaObsoletosIndexation } from '@/hooks/indexation/useIneaObsoletosIndexation';
import type { Mueble, FilterState } from '../types';

interface UseObsoletosDataReturn {
  muebles: Mueble[];
  loading: boolean;
  error: string | null;
  filteredCount: number;
  totalValue: number;
  fetchMuebles: () => Promise<void>;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortField: keyof Mueble;
  setSortField: (field: keyof Mueble) => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (direction: 'asc' | 'desc') => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (rows: number) => void;
}

export function useObsoletosData(): UseObsoletosDataReturn {
  const { reindex: reindexObsoletos } = useIneaObsoletosIndexation();
  const [muebles, setMuebles] = useState<Mueble[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredCount, setFilteredCount] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Mueble>('id_inv');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<FilterState>({
    estado: '',
    area: '',
    rubro: ''
  });

  // Función para sumar el valor total de bajas filtradas
  const sumFilteredBajas = async (filters: FilterState) => {
    let total = 0;
    let from = 0;
    const pageSize = 1000;
    let keepGoing = true;
    while (keepGoing) {
      const { data, error } = await supabase
        .from('muebles')
        .select('valor')
        .match({
          estatus: 'BAJA',
          ...(filters.estado && { estado: filters.estado }),
          ...(filters.area && { area: filters.area }),
          ...(filters.rubro && { rubro: filters.rubro })
        })
        .range(from, from + pageSize - 1);
      if (error) break;
      if (data && data.length > 0) {
        total += data.reduce((sum, item) => sum + (item.valor || 0), 0);
        if (data.length < pageSize) {
          keepGoing = false;
        } else {
          from += pageSize;
        }
      } else {
        keepGoing = false;
      }
    }
    return total;
  };

  // Función para sumar el valor total de todas las bajas
  const sumAllBajas = async () => {
    let total = 0;
    let from = 0;
    const pageSize = 1000;
    let keepGoing = true;
    while (keepGoing) {
      const { data, error } = await supabase
        .from('muebles')
        .select('valor')
        .eq('estatus', 'BAJA')
        .range(from, from + pageSize - 1);
      if (error) break;
      if (data && data.length > 0) {
        total += data.reduce((sum, item) => sum + (item.valor || 0), 0);
        if (data.length < pageSize) {
          keepGoing = false;
        } else {
          from += pageSize;
        }
      } else {
        keepGoing = false;
      }
    }
    return total;
  };

  const fetchMuebles = useCallback(async () => {
    setLoading(true);

    try {
      let countQuery = supabase
        .from('muebles')
        .select('id, id_inv, rubro, descripcion, valor, f_adq, formadq, proveedor, factura, ubicacion_es, ubicacion_mu, ubicacion_no, estado, estatus, area, usufinal, fechabaja, causadebaja, resguardante, image_path', { count: 'exact', head: false })
        .eq('estatus', 'BAJA');

      let dataQuery = supabase.from('muebles').select('id, id_inv, rubro, descripcion, valor, f_adq, formadq, proveedor, factura, ubicacion_es, ubicacion_mu, ubicacion_no, estado, estatus, area, usufinal, fechabaja, causadebaja, resguardante, image_path')
        .eq('estatus', 'BAJA');

      if (searchTerm) {
        const searchFilter = `id_inv.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%,resguardante.ilike.%${searchTerm}%,usufinal.ilike.%${searchTerm}%`;
        countQuery = countQuery.or(searchFilter);
        dataQuery = dataQuery.or(searchFilter);
      }

      if (filters.estado) {
        countQuery = countQuery.eq('estado', filters.estado);
        dataQuery = dataQuery.eq('estado', filters.estado);
      }

      if (filters.area) {
        countQuery = countQuery.eq('area', filters.area);
        dataQuery = dataQuery.eq('area', filters.area);
      }

      if (filters.rubro) {
        countQuery = countQuery.eq('rubro', filters.rubro);
        dataQuery = dataQuery.eq('rubro', filters.rubro);
      }

      const { count } = await countQuery;
      setFilteredCount(count || 0);

      const { data, error } = await dataQuery
        .order(sortField, { ascending: sortDirection === 'asc' })
        .range((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage - 1);

      if (error) throw error;

      const mueblesData = (data as Mueble[]) || [];
      setMuebles(mueblesData);

      setError(null);

      // Calcular el total de valor de bajas
      let total;
      if (Object.values(filters).some(v => v)) {
        total = await sumFilteredBajas(filters);
      } else {
        total = await sumAllBajas();
      }
      setTotalValue(total);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error al cargar los datos. Por favor, intente nuevamente.');
      setMuebles([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, searchTerm, filters, sortField, sortDirection]);

  useEffect(() => {
    fetchMuebles();
  }, [fetchMuebles]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortField, sortDirection, rowsPerPage]);

  return {
    muebles,
    loading,
    error,
    filteredCount,
    totalValue,
    fetchMuebles,
    filters,
    setFilters,
    searchTerm,
    setSearchTerm,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
  };
}
