/**
 * useUnifiedInventory Hook
 * 
 * Aggregates and manages data from three indexation sources:
 * - INEA (Instituto Nacional para la Educación de los Adultos)
 * - ITEA (Instituto Tlaxcalteca para la Educación de los Adultos)
 * - TLAXCALA (No Listado)
 * 
 * This hook combines data from all three sources, adds origin labels,
 * and provides unified loading, error, and connection states.
 */

import { useMemo, useCallback } from 'react';
import { useIneaIndexation } from '@/hooks/indexation/useIneaIndexation';
import { useIteaIndexation } from '@/hooks/indexation/useIteaIndexation';
import { useNoListadoIndexation } from '@/hooks/indexation/useNoListadoIndexation';
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

  /**
   * Combine data from all three sources with origin labels
   * Uses useMemo to prevent unnecessary recalculations
   */
  const muebles = useMemo(() => {
    // Map each source's data and add origin label
    const ineaData = ineaContext.muebles.map(item => ({ 
      ...item, 
      origen: 'INEA' as const 
    }));
    
    const iteaData = iteaContext.muebles.map(item => ({ 
      ...item, 
      origen: 'ITEA' as const 
    }));
    
    const tlaxcalaData = tlaxcalaContext.muebles.map(item => ({ 
      ...item,
      resguardante: item.resguardante ?? null, // Ensure undefined becomes null
      image_path: item.image_path ?? null, // Ensure undefined becomes null
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

  return {
    muebles,
    loading,
    error,
    realtimeConnected,
    reindex
  };
}
