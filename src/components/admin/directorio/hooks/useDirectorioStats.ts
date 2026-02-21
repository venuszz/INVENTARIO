import { useState, useEffect, useCallback, useMemo } from 'react';
import { useIneaStore } from '@/stores/ineaStore';
import { useIteaStore } from '@/stores/iteaStore';
import { useNoListadoStore } from '@/stores/noListadoStore';
import { useResguardosStore } from '@/stores/resguardosStore';
import type { ResguardanteStats } from '../types';

export interface AreaStats {
  bienesCount: number;
  resguardosCount: number;
}

export interface DirectorWithAreaStats {
  directorId: number;
  areaId: number;
  areaName: string;
  stats: AreaStats;
}

interface UseDirectorioStatsReturn {
  stats: Map<number, ResguardanteStats>;
  areaStats: Map<string, DirectorWithAreaStats[]>; // key: `${directorId}-${areaId}`
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
  const [areaStats, setAreaStats] = useState<Map<string, DirectorWithAreaStats[]>>(new Map());
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
      setAreaStats(new Map());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const statsMap = new Map<number, ResguardanteStats>();
      const areaStatsTemp = new Map<string, { directorId: number; areaId: number; areaName: string; bienesCount: number; resguardosCount: number }>();
      
      // Initialize all directors with 0 counts
      memoizedIds.forEach(id => {
        statsMap.set(id, {
          resguardos: 0,
          bienesACargo: 0,
        });
      });
      
      // Helper to update area stats
      const updateAreaStats = (directorId: number, areaId: number, areaName: string, type: 'bienes' | 'resguardo') => {
        const key = `${directorId}-${areaId}`;
        if (!areaStatsTemp.has(key)) {
          areaStatsTemp.set(key, {
            directorId,
            areaId,
            areaName,
            bienesCount: 0,
            resguardosCount: 0
          });
        }
        const stats = areaStatsTemp.get(key)!;
        if (type === 'bienes') {
          stats.bienesCount++;
        } else {
          stats.resguardosCount++;
        }
      };
      
      // Count bienes a cargo from all 3 tables
      // INEA muebles
      ineaMuebles.forEach(mueble => {
        if (mueble.id_directorio && memoizedIds.includes(mueble.id_directorio)) {
          const current = statsMap.get(mueble.id_directorio);
          if (current) {
            current.bienesACargo++;
          }
          if (mueble.id_area && mueble.area) {
            updateAreaStats(mueble.id_directorio, mueble.id_area, mueble.area.nombre, 'bienes');
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
          if (mueble.id_area && mueble.area) {
            updateAreaStats(mueble.id_directorio, mueble.id_area, mueble.area.nombre, 'bienes');
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
          if (mueble.id_area && mueble.area) {
            updateAreaStats(mueble.id_directorio, mueble.id_area, mueble.area.nombre, 'bienes');
          }
        }
      });
      
      // Count unique resguardo folios per director
      // Resguardos table now uses id_directorio FK
      const resguardosByDirector = new Map<number, Set<string>>();
      
      resguardos.forEach(resguardo => {
        if (resguardo.id_directorio && memoizedIds.includes(resguardo.id_directorio)) {
          if (!resguardosByDirector.has(resguardo.id_directorio)) {
            resguardosByDirector.set(resguardo.id_directorio, new Set());
          }
          // Add folio to the set (automatically handles uniqueness)
          resguardosByDirector.get(resguardo.id_directorio)!.add(resguardo.folio);
          
          // Update area stats for resguardos
          if (resguardo.id_area && resguardo.area_nombre) {
            updateAreaStats(resguardo.id_directorio, resguardo.id_area, resguardo.area_nombre, 'resguardo');
          }
        }
      });
      
      // Update stats with unique folio counts
      resguardosByDirector.forEach((folios, id_directorio) => {
        const current = statsMap.get(id_directorio);
        if (current) {
          current.resguardos = folios.size;
        }
      });
      
      // Convert areaStatsTemp to final format grouped by area
      const finalAreaStats = new Map<string, DirectorWithAreaStats[]>();
      areaStatsTemp.forEach((data) => {
        const areaKey = `area-${data.areaId}`;
        if (!finalAreaStats.has(areaKey)) {
          finalAreaStats.set(areaKey, []);
        }
        
        finalAreaStats.get(areaKey)!.push({
          directorId: data.directorId,
          areaId: data.areaId,
          areaName: data.areaName,
          stats: {
            bienesCount: data.bienesCount,
            resguardosCount: data.resguardosCount
          }
        });
      });
      
      setStats(statsMap);
      setAreaStats(finalAreaStats);
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
    areaStats,
    loading, 
    error, 
    refetch: async () => calculateStats() 
  };
}
