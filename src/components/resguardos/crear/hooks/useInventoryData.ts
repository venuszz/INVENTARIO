/**
 * Custom hook for fetching and managing inventory data from multiple sources
 * 
 * Combines data from INEA, ITEA, and TLAXCALA sources and filters out
 * items that are already resguarded
 */

import { useState, useEffect, useCallback } from 'react';
import supabase from '@/app/lib/supabase/client';
import { useIneaIndexation } from '@/hooks/indexation/useIneaIndexation';
import { useIneaObsoletosIndexation } from '@/hooks/indexation/useIneaObsoletosIndexation';
import { useIteaIndexation } from '@/hooks/indexation/useIteaIndexation';
import { useNoListadoIndexation } from '@/hooks/indexation/useNoListadoIndexation';
import type { Mueble } from '../types';

export interface UseInventoryDataReturn {
  allMuebles: Mueble[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  stats: {
    ineaTotal: number;
    ineaTotalWithBaja: number;
    ineaActive: number;
    ineaBaja: number;
    iteaTotal: number;
    iteaActive: number;
    iteaInactive: number;
    tlaxcalaTotal: number;
    totalRaw: number;
    excludedByStatus: number;
    excludedByResguardo: number;
    availableCount: number;
  };
}

/**
 * Hook for fetching and managing inventory data
 * 
 * @param sortField - Field to sort by
 * @param sortDirection - Sort direction ('asc' or 'desc')
 * @returns Object containing inventory data, loading state, error state, and refetch function
 */
export function useInventoryData(
  sortField: keyof Mueble = 'id_inv',
  sortDirection: 'asc' | 'desc' = 'asc'
): UseInventoryDataReturn {
  const { muebles: ineaData } = useIneaIndexation();
  const { muebles: ineaObsoletosData } = useIneaObsoletosIndexation();
  const { muebles: iteaData } = useIteaIndexation();
  const { muebles: noListadoData } = useNoListadoIndexation();

  const [allMuebles, setAllMuebles] = useState<Mueble[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    ineaTotal: 0,
    ineaTotalWithBaja: 0,
    ineaActive: 0,
    ineaBaja: 0,
    iteaTotal: 0,
    iteaActive: 0,
    iteaInactive: 0,
    tlaxcalaTotal: 0,
    totalRaw: 0,
    excludedByStatus: 0,
    excludedByResguardo: 0,
    availableCount: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // INEA data comes from two sources:
      // 1. useIneaIndexation: Active items (without BAJA)
      // 2. useIneaObsoletosIndexation: BAJA items
      const ineaActiveCount = ineaData.length;
      const ineaBajaCount = ineaObsoletosData.length;
      const ineaTotalWithBaja = ineaActiveCount + ineaBajaCount;
      
      // Count ITEA items by status
      const iteaActiveCount = iteaData.filter((item: any) => item.estatus === 'ACTIVO').length;
      const iteaInactiveCount = iteaData.length - iteaActiveCount;
      
      // TLAXCALA count
      const tlaxcalaTotal = noListadoData.length;

      // Fetch already resguarded items
      const { data: resguardados } = await supabase
        .from('resguardos')
        .select('num_inventario, descripcion, rubro, condicion, area_resguardo');

      const resguardadosSet = new Set(
        (resguardados || []).map(r => 
          `${r.num_inventario}-${r.descripcion}-${r.rubro}-${r.condicion}-${r.area_resguardo}`.toLowerCase()
        )
      );

      // Combine data from all sources with their specific filters
      let combinedData: Mueble[] = [
        // INEA: Already filtered (no BAJA items from hook)
        ...(ineaData.map((item: any) => ({ ...item, origen: 'INEA' as const }))),
        // ITEA: Only ACTIVO items
        ...(iteaData.filter((item: any) => item.estatus === 'ACTIVO').map((item: any) => ({ ...item, origen: 'ITEA' as const }))),
        // TLAXCALA: All items
        ...(noListadoData.map((item: any) => ({ ...item, origen: 'TLAXCALA' as const }))),
      ];

      const totalAfterStatusFilter = combinedData.length;

      // Filter out resguarded items
      combinedData = combinedData.filter(item => {
        const itemKey = `${item.id_inv}-${item.descripcion}-${item.rubro}-${item.estado}-${item.area}`.toLowerCase();
        return !resguardadosSet.has(itemKey);
      });

      const excludedByResguardo = totalAfterStatusFilter - combinedData.length;

      // Sort data
      combinedData.sort((a, b) => {
        const aValue = String(a[sortField as keyof typeof a] ?? '').toLowerCase();
        const bValue = String(b[sortField as keyof typeof b] ?? '').toLowerCase();
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      });

      setAllMuebles(combinedData);
      setStats({
        // INEA: Active count (BAJA items are filtered at hook level)
        ineaTotal: ineaActiveCount,
        ineaTotalWithBaja,
        ineaActive: ineaActiveCount,
        ineaBaja: ineaBajaCount,
        iteaTotal: iteaData.length,
        iteaActive: iteaActiveCount,
        iteaInactive: iteaInactiveCount,
        tlaxcalaTotal,
        totalRaw: ineaActiveCount + iteaData.length + tlaxcalaTotal,
        excludedByStatus: ineaBajaCount + iteaInactiveCount, // Both INEA BAJA and ITEA inactive
        excludedByResguardo,
        availableCount: combinedData.length,
      });
      setError(null);
    } catch (err) {
      console.error('Error al cargar los datos:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [ineaData, ineaObsoletosData, iteaData, noListadoData, sortField, sortDirection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    allMuebles,
    loading,
    error,
    refetch: fetchData,
    stats,
  };
}
