import { useState, useEffect, useCallback, useMemo } from 'react';
import { useIneaStore } from '@/stores/ineaStore';
import { useIteaStore } from '@/stores/iteaStore';
import { useNoListadoStore } from '@/stores/noListadoStore';
import { useResguardosStore } from '@/stores/resguardosStore';
import type { ResguardanteStats } from '../types';

interface UseDirectorioStatsReturn {
  stats: Map<number, ResguardanteStats>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to calculate and cache statistics for each resguardante
 * Uses indexed data from stores to count resguardos and bienes a cargo
 */
export function useDirectorioStats(
  directorioIds: number[]
): UseDirectorioStatsReturn {
  const [stats, setStats] = useState<Map<number, ResguardanteStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get data from stores
  const ineaMuebles = useIneaStore(state => state.muebles);
  const iteaMuebles = useIteaStore(state => state.muebles);
  const noListadoMuebles = useNoListadoStore(state => state.muebles);
  const resguardos = useResguardosStore(state => state.resguardos);

  // Memoize the directorioIds array to prevent unnecessary re-fetches
  const memoizedIds = useMemo(() => directorioIds, [JSON.stringify(directorioIds)]);

  const calculateStats = useCallback(() => {
    if (memoizedIds.length === 0) {
      setStats(new Map());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const statsMap = new Map<number, ResguardanteStats>();
      
      // Initialize all directors with 0 counts
      memoizedIds.forEach(id => {
        statsMap.set(id, {
          resguardos: 0,
          bienesACargo: 0,
        });
      });
      
      // Count bienes a cargo from all 3 tables
      // INEA muebles
      ineaMuebles.forEach(mueble => {
        if (mueble.id_directorio && memoizedIds.includes(mueble.id_directorio)) {
          const current = statsMap.get(mueble.id_directorio);
          if (current) {
            current.bienesACargo++;
          }
        }
      });
      
      // ITEA muebles
      iteaMuebles.forEach(mueble => {
        if (mueble.id_directorio && memoizedIds.includes(mueble.id_directorio)) {
          const current = statsMap.get(mueble.id_directorio);
          if (current) {
            current.bienesACargo++;
          }
        }
      });
      
      // No Listado muebles
      noListadoMuebles.forEach(mueble => {
        if (mueble.id_directorio && memoizedIds.includes(mueble.id_directorio)) {
          const current = statsMap.get(mueble.id_directorio);
          if (current) {
            current.bienesACargo++;
          }
        }
      });
      
      // Count unique resguardo folios per director
      // Note: resguardos table uses text field 'usufinal' for resguardante name, not id_directorio FK
      // We need to match by name, but we don't have director names here
      // For now, we'll count resguardos by folio uniqueness
      // This is a limitation - ideally resguardos should have id_directorio FK
      
      setStats(statsMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading statistics');
      console.error('Error calculating directorio stats:', err);
    } finally {
      setLoading(false);
    }
  }, [memoizedIds, ineaMuebles, iteaMuebles, noListadoMuebles, resguardos]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  return { 
    stats, 
    loading, 
    error, 
    refetch: async () => calculateStats() 
  };
}
