/**
 * useUnifiedInventory Hook
 * 
 * Aggregates and manages data from three indexation sources:
 * - INEA (Instituto Nacional para la Educación de los Adultos)
 * - ITEJPA (Instituto Tlaxcalteca para la Educación de los Adultos - Jóvenes y Adultos)
 * - TLAXCALA (No Listado)
 * 
 * This hook combines data from all three sources, adds origin labels,
 * and provides unified loading, error, and connection states.
 */

import { useMemo, useCallback } from 'react';
import { useIneaIndexation } from '@/hooks/indexation/useIneaIndexation';
import { useIteaIndexation } from '@/hooks/indexation/useIteaIndexation';
import { useNoListadoIndexation } from '@/hooks/indexation/useNoListadoIndexation';
import { useIneaStore } from '@/stores/ineaStore';
import { useIteaStore } from '@/stores/iteaStore';
import { useNoListadoStore } from '@/stores/noListadoStore';
import { LevMueble } from '../types';

/**
 * Return type for useUnifiedInventory hook
 */
export interface UseUnifiedInventoryReturn {
  /** Combined data from all three sources with origin labels */
  muebles: LevMueble[];
  /** True if any source is currently indexing/loading */
  loading: boolean;
  /** Error message from any source (first non-null error) */
  error: string | null;
  /** True if any source has real-time connection active */
  realtimeConnected: boolean;
  /** Function to trigger reindexation of all three sources */
  reindex: () => Promise<void>;
  /** True if any source is currently syncing */
  isSyncing: boolean;
  /** Total count of records being synced across all sources */
  syncingCount: number;
  /** Array of source names that are currently syncing */
  syncingSources: string[];
  /** Combined array of all syncing IDs from all sources */
  syncingIds: string[];
}

/**
 * Custom hook to aggregate inventory data from three sources
 * 
 * @returns Unified inventory data and control functions
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { muebles, loading, error, reindex } = useUnifiedInventory();
 *   
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} onRetry={reindex} />;
 *   
 *   return <InventoryTable data={muebles} />;
 * }
 * ```
 */
export function useUnifiedInventory(): UseUnifiedInventoryReturn {
  // Get data from all three indexation contexts
  const ineaContext = useIneaIndexation();
  const iteaContext = useIteaIndexation();
  const tlaxcalaContext = useNoListadoIndexation();
  
  // Get sync state from all three stores
  const ineaSyncingIds = useIneaStore(state => state.syncingIds) || [];
  const ineaIsSyncing = useIneaStore(state => state.isSyncing);
  const iteaSyncingIds = useIteaStore(state => state.syncingIds) || [];
  const iteaIsSyncing = useIteaStore(state => state.isSyncing);
  const tlaxcalaSyncingIds = useNoListadoStore(state => state.syncingIds) || [];
  const tlaxcalaIsSyncing = useNoListadoStore(state => state.isSyncing);

  /**
   * Combine data from all three sources with origin labels
   * Uses useMemo to prevent unnecessary recalculations
   */
  const muebles = useMemo(() => {
    // Map INEA data - PRESERVE relational fields
    const ineaData = ineaContext.muebles.map(item => ({ 
      ...item,
      resguardante: (item as any).resguardante ?? null,
      // Preserve relational fields
      id_area: item.id_area,
      id_directorio: item.id_directorio,
      area: item.area,           // Keep nested object
      directorio: item.directorio, // Keep nested object
      // Color fields (INEA doesn't have colors)
      color: null,
      colores: null,
      origen: 'INEA' as const 
    }));
    
    // Map ITEA data - PRESERVE relational fields and color data
    const iteaData = iteaContext.muebles.map(item => ({ 
      ...item,
      resguardante: (item as any).resguardante ?? null,
      // Preserve relational fields
      id_area: item.id_area,
      id_directorio: item.id_directorio,
      area: item.area,           // Keep nested object
      directorio: item.directorio, // Keep nested object
      // Preserve color fields from ITEA
      color: (item as any).color ?? null,
      colores: (item as any).colores ?? null,
      origen: 'ITEJPA' as const 
    }));
    
    // Map TLAXCALA data - PRESERVE relational fields
    const tlaxcalaData = tlaxcalaContext.muebles.map(item => ({ 
      ...item,
      resguardante: (item as any).resguardante ?? null, // Ensure undefined becomes null
      image_path: item.image_path ?? null, // Ensure undefined becomes null
      // Preserve relational fields
      id_area: item.id_area,
      id_directorio: item.id_directorio,
      area: item.area,           // Keep nested object
      directorio: item.directorio, // Keep nested object
      // Color fields (TLAXCALA doesn't have colors)
      color: null,
      colores: null,
      origen: 'TLAXCALA' as const 
    }));

    // Combine all data into a single array
    return [...ineaData, ...iteaData, ...tlaxcalaData];
  }, [ineaContext.muebles, iteaContext.muebles, tlaxcalaContext.muebles]);

  /**
   * Aggregate loading states with OR logic
   * If any source is loading, the combined state is loading
   */
  const loading = ineaContext.isIndexing || iteaContext.isIndexing || tlaxcalaContext.isIndexing;

  /**
   * Aggregate error states (first non-null error)
   * Priority: INEA > ITEA > TLAXCALA
   */
  const error = ineaContext.error || iteaContext.error || tlaxcalaContext.error;

  /**
   * Aggregate real-time connection states with OR logic
   * If any source is connected, show as connected
   */
  const realtimeConnected = ineaContext.realtimeConnected || iteaContext.realtimeConnected || tlaxcalaContext.realtimeConnected;

  /**
   * Trigger reindexation of all three sources in parallel
   * Uses useCallback to maintain referential equality
   */
  const reindex = useCallback(async () => {
    await Promise.all([
      ineaContext.reindex(),
      iteaContext.reindex(),
      tlaxcalaContext.reindex()
    ]);
  }, [ineaContext, iteaContext, tlaxcalaContext]);
  
  /**
   * Aggregate sync state from all three sources
   * If any source is syncing, show as syncing
   */
  const isSyncing = ineaIsSyncing || iteaIsSyncing || tlaxcalaIsSyncing;
  
  /**
   * Calculate total count of syncing records across all sources
   */
  const syncingCount = ineaSyncingIds.length + iteaSyncingIds.length + tlaxcalaSyncingIds.length;
  
  /**
   * Get array of source names that are currently syncing
   */
  const syncingSources = useMemo(() => {
    const sources: string[] = [];
    if (ineaIsSyncing) sources.push('INEA');
    if (iteaIsSyncing) sources.push('ITEJPA');
    if (tlaxcalaIsSyncing) sources.push('TLAXCALA');
    return sources;
  }, [ineaIsSyncing, iteaIsSyncing, tlaxcalaIsSyncing]);
  
  /**
   * Combined array of all syncing IDs from all sources
   */
  const syncingIds = useMemo(() => {
    return [...ineaSyncingIds, ...iteaSyncingIds, ...tlaxcalaSyncingIds];
  }, [ineaSyncingIds, iteaSyncingIds, tlaxcalaSyncingIds]);

  return {
    muebles,
    loading,
    error,
    realtimeConnected,
    reindex,
    isSyncing,
    syncingCount,
    syncingSources,
    syncingIds
  };
}
