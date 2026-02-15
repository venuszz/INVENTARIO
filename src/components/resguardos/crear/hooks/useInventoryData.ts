/**
 * Custom hook for fetching and managing inventory data from multiple sources
 * 
 * Combines data from INEA, ITEA, and TLAXCALA sources and filters out
 * items that are already resguarded. Also handles realtime sync for relational fields.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import supabase from '@/app/lib/supabase/client';
import { useIneaIndexation } from '@/hooks/indexation/useIneaIndexation';
import { useIneaObsoletosIndexation } from '@/hooks/indexation/useIneaObsoletosIndexation';
import { useIteaIndexation } from '@/hooks/indexation/useIteaIndexation';
import { useNoListadoIndexation } from '@/hooks/indexation/useNoListadoIndexation';
import { useResguardosCrearStore } from '@/stores/resguardosCrearStore';
import { useResguardosStore } from '@/stores/resguardosStore';
import type { Mueble } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
  
  // Get resguardos from store instead of fetching directly
  const resguardos = useResguardosStore(state => state.resguardos);
  
  const { setSyncingIds, removeSyncingIds, setIsSyncing } = useResguardosCrearStore();

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
  
  const areaChannelRef = useRef<RealtimeChannel | null>(null);
  const directorioChannelRef = useRef<RealtimeChannel | null>(null);

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

      // Use resguardos from store instead of fetching
      console.log('📦 [INVENTORY DATA] Using resguardos from store:', resguardos.length);
      
      const resguardadosSet = new Set(
        resguardos.map(r => 
          `${r.id_mueble}`.toLowerCase()
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

      // Filter out resguarded items by matching id_mueble (UUID)
      combinedData = combinedData.filter(item => {
        const isResguarded = resguardadosSet.has(item.id.toLowerCase());
        return !isResguarded;
      });

      const excludedByResguardo = totalAfterStatusFilter - combinedData.length;
      
      console.log('📊 [INVENTORY DATA] Filtered:', {
        total: totalAfterStatusFilter,
        excluded: excludedByResguardo,
        available: combinedData.length
      });

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
  }, [ineaData, ineaObsoletosData, iteaData, noListadoData, resguardos, sortField, sortDirection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================================
  // REALTIME SYNC FOR RELATIONAL FIELDS
  // ============================================================================
  
  /**
   * Sync relational field changes in batches to prevent UI lag
   * Uses a ref to avoid dependency on allMuebles state
   */
  const allMueblesRef = useRef<Mueble[]>([]);
  
  // Keep ref in sync with state
  useEffect(() => {
    allMueblesRef.current = allMuebles;
  }, [allMuebles]);
  
  const syncRelationalFieldChanges = useCallback(async (
    changedId: number,
    fieldType: 'area' | 'directorio',
    newData: { nombre: string; id_area?: number; id_directorio?: number }
  ) => {
    // Use ref to get current data without triggering re-renders
    const currentMuebles = allMueblesRef.current;
    
    // Find all muebles that reference this changed entity
    const affectedMuebles = currentMuebles.filter(m => {
      if (fieldType === 'area') {
        return m.area?.id_area === changedId;
      } else {
        return m.directorio?.id_directorio === changedId;
      }
    });
    
    if (affectedMuebles.length === 0) return;
    
    console.log(`🔄 [RESGUARDOS CREAR] Syncing ${affectedMuebles.length} records for ${fieldType} change`);
    
    // Mark all affected IDs as syncing
    const affectedIds = affectedMuebles.map(m => m.id);
    setSyncingIds(affectedIds);
    setIsSyncing(true);
    
    // For small updates, do it all at once
    if (affectedMuebles.length <= 100) {
      setAllMuebles(prev => prev.map(m => {
        const shouldUpdate = affectedIds.includes(m.id);
        if (!shouldUpdate) return m;
        
        if (fieldType === 'area') {
          return {
            ...m,
            area: { nombre: newData.nombre, id_area: newData.id_area! }
          };
        } else {
          return {
            ...m,
            directorio: { nombre: newData.nombre, id_directorio: newData.id_directorio!, puesto: '' }
          };
        }
      }));
      
      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 100));
      removeSyncingIds(affectedIds);
      setIsSyncing(false);
      console.log(`✅ [RESGUARDOS CREAR] Sync complete for ${fieldType}`);
      return;
    }
    
    // For large updates, process in batches of 100
    const BATCH_SIZE = 100;
    const batches = [];
    for (let i = 0; i < affectedMuebles.length; i += BATCH_SIZE) {
      batches.push(affectedMuebles.slice(i, i + BATCH_SIZE));
    }
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchIds = batch.map(m => m.id);
      
      // Update the batch using functional update to avoid stale closure
      setAllMuebles(prev => prev.map(m => {
        const shouldUpdate = batchIds.includes(m.id);
        if (!shouldUpdate) return m;
        
        if (fieldType === 'area') {
          return {
            ...m,
            area: { nombre: newData.nombre, id_area: newData.id_area! }
          };
        } else {
          return {
            ...m,
            directorio: { nombre: newData.nombre, id_directorio: newData.id_directorio!, puesto: '' }
          };
        }
      }));
      
      // Remove syncing state for this batch
      removeSyncingIds(batchIds);
      
      // Very small delay between batches
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    setIsSyncing(false);
    console.log(`✅ [RESGUARDOS CREAR] Sync complete for ${fieldType}`);
  }, [setSyncingIds, removeSyncingIds, setIsSyncing]);
  
  /**
   * Setup realtime listeners for area and directorio tables
   */
  useEffect(() => {
    // Area changes listener
    if (areaChannelRef.current) {
      supabase.removeChannel(areaChannelRef.current);
    }
    
    const areaChannel = supabase
      .channel('resguardos-crear-area-changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'area' },
        async (payload: any) => {
          const { new: newRecord } = payload;
          if (newRecord?.id_area && newRecord?.nombre) {
            await syncRelationalFieldChanges(newRecord.id_area, 'area', {
              nombre: newRecord.nombre,
              id_area: newRecord.id_area
            });
          }
        }
      )
      .subscribe();
    
    areaChannelRef.current = areaChannel;
    
    // Directorio changes listener
    if (directorioChannelRef.current) {
      supabase.removeChannel(directorioChannelRef.current);
    }
    
    const directorioChannel = supabase
      .channel('resguardos-crear-directorio-changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'directorio' },
        async (payload: any) => {
          const { new: newRecord } = payload;
          if (newRecord?.id_directorio && newRecord?.nombre) {
            await syncRelationalFieldChanges(newRecord.id_directorio, 'directorio', {
              nombre: newRecord.nombre,
              id_directorio: newRecord.id_directorio
            });
          }
        }
      )
      .subscribe();
    
    directorioChannelRef.current = directorioChannel;
    
    // Cleanup on unmount
    return () => {
      if (areaChannelRef.current) {
        supabase.removeChannel(areaChannelRef.current);
      }
      if (directorioChannelRef.current) {
        supabase.removeChannel(directorioChannelRef.current);
      }
    };
  }, [syncRelationalFieldChanges]);

  return {
    allMuebles,
    loading,
    error,
    refetch: fetchData,
    stats,
  };
}
