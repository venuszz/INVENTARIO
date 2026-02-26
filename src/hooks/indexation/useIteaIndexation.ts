// ============================================================================
// USE ITEA INDEXATION HOOK
// ============================================================================

import { useEffect, useRef, useCallback } from 'react';
import { useIndexationStore } from '@/stores/indexationStore';
import { useIteaStore } from '@/stores/iteaStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { withExponentialBackoff, FETCH_RETRY_CONFIG, RECONNECTION_CONFIG } from '@/lib/indexation/exponentialBackoff';
import { iteaEmitter } from '@/lib/indexation/eventEmitter';
import { ITEA_CONFIG } from '@/config/modules';
import supabase from '@/app/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { MuebleITEA } from '@/types/indexation';

const MODULE_KEY = 'itea';
const { stages: STAGES, table: TABLE } = ITEA_CONFIG;

// Cache for colors to avoid repeated API calls
let colorsCache: { [id: string]: { id: string; nombre: string; significado: string | null } } = {};
let colorsCacheTime: number = 0;
const COLORS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch colors from API and cache them
 */
async function fetchColorsMap(): Promise<{ [id: string]: { id: string; nombre: string; significado: string | null } }> {
  const now = Date.now();
  
  // Return cached colors if still valid
  if (Object.keys(colorsCache).length > 0 && (now - colorsCacheTime) < COLORS_CACHE_TTL) {
    return colorsCache;
  }
  
  try {
    const response = await fetch('/api/colores');
    if (response.ok) {
      const { colors } = await response.json();
      colorsCache = colors.reduce((acc: any, color: any) => {
        acc[color.id] = color;
        return acc;
      }, {});
      colorsCacheTime = now;
      return colorsCache;
    }
  } catch (error) {
    console.warn('⚠️ Failed to fetch colors:', error);
  }
  
  return {};
}

/**
 * Attach color data to muebles based on color field
 */
function attachColorData(muebles: any[], colorsMap: { [id: string]: any }): MuebleITEA[] {
  return muebles.map(item => ({
    ...item,
    colores: item.color ? colorsMap[item.color] || null : null
  }));
}

export function useIteaIndexation() {
  const indexationState = useIndexationStore(state => state.modules[MODULE_KEY]);
  const {
    startIndexation, updateProgress, completeIndexation, setError,
    updateRealtimeConnection, updateReconnectionStatus,
    incrementReconnectionAttempts, resetReconnectionAttempts,
    setDisconnectedAt, updateLastEventReceived, initializeModule,
    addRealtimeChange,
  } = useIndexationStore();
  
  const { muebles, setMuebles, addMueble, updateMueble, removeMueble, isCacheValid, updateMuebleBatch, setSyncingIds, removeSyncingIds, clearSyncingIds, setIsSyncing } = useIteaStore();
  
  const isIndexingRef = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const syncQueueRef = useRef<{ ids: string[]; type: 'area' | 'directorio' | 'estatus'; refId: number } | null>(null);
  const isSyncingRef = useRef(false);
  const configUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingConfigUpdatesRef = useRef<Set<number>>(new Set());
  
  /**
   * Process updates in batches to avoid UI lag and handle Supabase 1000-record limit
   */
  const processBatchUpdates = useCallback(async (
    _ids: string[],
    type: 'area' | 'directorio' | 'estatus',
    refId: number
  ) => {
    if (isSyncingRef.current) {
      syncQueueRef.current = { ids: _ids, type, refId };
      return;
    }
    
    isSyncingRef.current = true;
    setIsSyncing(true);
    
    const BATCH_SIZE = 1000;
    const allFetchedMuebles: MuebleITEA[] = [];
    const filterField = type === 'area' ? 'id_area' : type === 'directorio' ? 'id_directorio' : 'id_estatus';
    
    // Get colors map
    const colorsMap = await fetchColorsMap();
    
    // Get BAJA status ID from config table to exclude it
    const { data: bajaStatus } = await supabase
      .from('config')
      .select('id')
      .eq('tipo', 'estatus')
      .eq('concepto', 'BAJA')
      .single();
    
    if (!bajaStatus) {
      console.error('No se pudo obtener el estatus BAJA');
      setIsSyncing(false);
      isSyncingRef.current = false;
      return;
    }
    
    // Fetch all affected records in batches of 1000
    let hasMore = true;
    let offset = 0;
    
    while (hasMore) {
      try {
        const { data: affectedMuebles, error } = await supabase
          .from(TABLE)
          .select(`
            *,
            area:area(id_area, nombre),
            directorio:directorio(id_directorio, nombre, puesto),
            config_estatus:config!id_estatus(id, concepto)
          `)
          .eq(filterField, refId)
          .neq('id_estatus', bajaStatus.id)
          .range(offset, offset + BATCH_SIZE - 1);
        
        if (error) {
          console.error(`Error fetching batch at offset ${offset}:`, error);
          break;
        }
        
        if (affectedMuebles && affectedMuebles.length > 0) {
          // Fetch resguardos for these muebles
          const muebleIds = affectedMuebles.map(m => m.id);
          const { data: resguardos } = await supabase
            .from('resguardos')
            .select('id_mueble, resguardante, f_resguardo')
            .in('id_mueble', muebleIds)
            .eq('origen', 'ITEA')
            .order('f_resguardo', { ascending: false });
          
          // Create map of most recent resguardo per mueble
          const resguardoMap = new Map<string, string | null>();
          if (resguardos) {
            resguardos.forEach(r => {
              if (!resguardoMap.has(r.id_mueble)) {
                resguardoMap.set(r.id_mueble, r.resguardante || null);
              }
            });
          }
          
          // Attach color data and extract resguardante
          const mueblesWithColorsAndResguardante = affectedMuebles.map(item => ({
            ...item,
            resguardante: resguardoMap.get(item.id) || null,
            colores: item.color ? colorsMap[item.color] || null : null
          }));
          allFetchedMuebles.push(...mueblesWithColorsAndResguardante);
          
          // Set syncing IDs for skeleton display
          const ids = mueblesWithColorsAndResguardante.map(m => m.id);
          setSyncingIds(ids);
          
          hasMore = affectedMuebles.length === BATCH_SIZE;
          offset += BATCH_SIZE;
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error(`Error processing batch at offset ${offset}:`, error);
        break;
      }
    }
    
    // Update store in batches of 50 to avoid UI lag
    const UI_BATCH_SIZE = 50;
    for (let i = 0; i < allFetchedMuebles.length; i += UI_BATCH_SIZE) {
      const batch = allFetchedMuebles.slice(i, i + UI_BATCH_SIZE);
      updateMuebleBatch(batch);
      
      const syncedIds = batch.map(m => m.id);
      removeSyncingIds(syncedIds);
      
      await new Promise(resolve => {
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => resolve(undefined), { timeout: 100 });
        } else {
          setTimeout(resolve, 16);
        }
      });
    }
    
    clearSyncingIds();
    setIsSyncing(false);
    isSyncingRef.current = false;
    
    if (syncQueueRef.current) {
      const queued = syncQueueRef.current;
      syncQueueRef.current = null;
      await processBatchUpdates(queued.ids, queued.type, queued.refId);
    }
  }, [updateMuebleBatch, setSyncingIds, removeSyncingIds, clearSyncingIds, setIsSyncing]);
  
  const indexData = useCallback(async () => {
    if (isIndexingRef.current) return;
    isIndexingRef.current = true;
    
    try {
      startIndexation(MODULE_KEY);
      let accumulatedProgress = 0;
      
      const stage1 = STAGES[0];
      updateProgress(MODULE_KEY, accumulatedProgress, stage1.label);
      
      // Get BAJA status ID from config table to exclude it
      const { data: bajaStatus, error: bajaError } = await supabase
        .from('config')
        .select('id')
        .eq('tipo', 'estatus')
        .eq('concepto', 'BAJA')
        .single();
      
      if (bajaError || !bajaStatus) {
        throw new Error('No se pudo obtener el estatus BAJA');
      }
      
      // Fetch colors from API first (bypasses RLS)
      console.log('🎨 [ITEA Indexation] Fetching colors from API...');
      let coloresMap: { [id: string]: { id: string; nombre: string; significado: string | null } } = {};
      
      try {
        const coloresResponse = await fetch('/api/colores');
        if (coloresResponse.ok) {
          const { colors } = await coloresResponse.json();
          coloresMap = colors.reduce((acc: any, color: any) => {
            acc[color.id] = color;
            return acc;
          }, {});
          console.log('🎨 [ITEA Indexation] Colors loaded:', {
            count: colors.length,
            sample: colors[0]
          });
        } else {
          console.warn('⚠️ [ITEA Indexation] Failed to fetch colors, continuing without them');
        }
      } catch (colorError) {
        console.warn('⚠️ [ITEA Indexation] Error fetching colors:', colorError);
      }
      
      // Fetch data in batches of 1000
      const fetchedMuebles: MuebleITEA[] = [];
      let hasMore = true;
      let offset = 0;
      const BATCH_SIZE = 1000;
      
      while (hasMore) {
        const batch = await withExponentialBackoff(
          async () => {
            // Step 1: Fetch muebles without resguardo JOIN
            const { data, error } = await supabase
              .from(TABLE)
              .select(`
                *,
                area:area(id_area, nombre),
                directorio:directorio(id_directorio, nombre, puesto),
                config_estatus:config!id_estatus(id, concepto)
              `)
              .neq('id_estatus', bajaStatus.id)
              .range(offset, offset + BATCH_SIZE - 1);
            
            if (error) {
              console.error('❌ [ITEA Indexation] Query failed:', error);
              throw error;
            }
            
            if (!data || data.length === 0) return [];
            
            // Step 2: Fetch resguardos for these muebles (in batches to avoid URL length limits)
            const muebleIds = data.map(m => m.id);
            let allResguardos: any[] = [];
            const RESGUARDO_BATCH_SIZE = 100;
            
            for (let i = 0; i < muebleIds.length; i += RESGUARDO_BATCH_SIZE) {
              const batchIds = muebleIds.slice(i, i + RESGUARDO_BATCH_SIZE);
              const { data: resguardosBatch, error: resguardosError } = await supabase
                .from('resguardos')
                .select('id_mueble, resguardante, f_resguardo')
                .in('id_mueble', batchIds)
                .eq('origen', 'ITEA')
                .order('f_resguardo', { ascending: false });
              
              if (!resguardosError && resguardosBatch) {
                allResguardos.push(...resguardosBatch);
              }
            }
            
            const resguardos = allResguardos;
            
            // Step 3: Create a map of most recent resguardo per mueble
            const resguardoMap = new Map<string, string | null>();
            if (resguardos) {
              resguardos.forEach(r => {
                if (!resguardoMap.has(r.id_mueble)) {
                  resguardoMap.set(r.id_mueble, r.resguardante || null);
                }
              });
            }
            
            // Step 4: Combine data with resguardante and colors
            const dataWithColorsAndResguardante = data.map((item: any) => ({
              ...item,
              resguardante: resguardoMap.get(item.id) || null,
              colores: item.color ? coloresMap[item.color] || null : null
            }));
            
            console.log('✅ [ITEA Indexation] Batch fetched:', {
              records: dataWithColorsAndResguardante.length,
              with_colors: dataWithColorsAndResguardante.filter((i: any) => i.colores).length
            });
            
            return dataWithColorsAndResguardante as MuebleITEA[];
          },
          FETCH_RETRY_CONFIG
        );
        
        fetchedMuebles.push(...batch);
        hasMore = batch.length === BATCH_SIZE;
        offset += BATCH_SIZE;
        
        // Update progress during fetch
        const fetchProgress = Math.min(stage1.weight * 0.9, (offset / 10000) * stage1.weight);
        updateProgress(MODULE_KEY, accumulatedProgress + fetchProgress, `${stage1.label} (${fetchedMuebles.length} registros)`);
      }
      
      setMuebles(fetchedMuebles);
      accumulatedProgress += stage1.weight;
      updateProgress(MODULE_KEY, accumulatedProgress, stage1.label);
      
      const stage2 = STAGES[1];
      updateProgress(MODULE_KEY, accumulatedProgress, stage2.label);
      await setupRealtimeSubscription();
      accumulatedProgress += stage2.weight;
      updateProgress(MODULE_KEY, accumulatedProgress, stage2.label);
      
      completeIndexation(MODULE_KEY);
    } catch (error) {
      console.error('Error indexing ITEA:', error);
      setError(MODULE_KEY, error instanceof Error ? error.message : 'Error al indexar datos');
    } finally {
      isIndexingRef.current = false;
    }
  }, [startIndexation, updateProgress, completeIndexation, setError, setMuebles]);
  
  const setupRealtimeSubscription = useCallback(async () => {
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    const channel = supabase
      .channel(`${TABLE}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE },
        async (payload: RealtimePostgresChangesPayload<MuebleITEA>) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          updateLastEventReceived(MODULE_KEY);
          
          try {
            switch (eventType) {
              case 'INSERT': {
                await new Promise(resolve => setTimeout(resolve, 300));
                const colorsMap = await fetchColorsMap();
                
                const { data, error } = await supabase
                  .from(TABLE)
                  .select(`
                    *,
                    area:area(id_area, nombre),
                    directorio:directorio(id_directorio, nombre, puesto),
                    config_estatus:config!id_estatus(id, concepto)
                  `)
                  .eq('id', newRecord.id)
                  .single();
                
                if (!error && data) {
                  if (data.config_estatus?.concepto !== 'BAJA') {
                    // Fetch resguardo separately
                    const { data: resguardos } = await supabase
                      .from('resguardos')
                      .select('resguardante, f_resguardo')
                      .eq('id_mueble', data.id)
                      .eq('origen', 'ITEA')
                      .order('f_resguardo', { ascending: false })
                      .limit(1);
                    
                    const dataWithColorAndResguardante = {
                      ...data,
                      resguardante: resguardos?.[0]?.resguardante || null,
                      colores: data.color ? colorsMap[data.color] || null : null
                    };
                    
                    addMueble(dataWithColorAndResguardante);
                    iteaEmitter.emit({ type: 'INSERT', data: dataWithColorAndResguardante, timestamp: new Date().toISOString() });
                    addRealtimeChange({
                      moduleKey: MODULE_KEY,
                      moduleName: 'ITEA',
                      table: TABLE,
                      eventType: 'INSERT',
                      recordId: dataWithColorAndResguardante.id,
                      recordName: dataWithColorAndResguardante.id_inv,
                    });
                  }
                }
                break;
              }
              case 'UPDATE': {
                const colorsMap = await fetchColorsMap();
                
                const { data, error } = await supabase
                  .from(TABLE)
                  .select(`
                    *,
                    area:area(id_area, nombre),
                    directorio:directorio(id_directorio, nombre, puesto),
                    config_estatus:config!id_estatus(id, concepto)
                  `)
                  .eq('id', newRecord.id)
                  .single();
                  
                if (!error && data) {
                  // Fetch resguardo separately
                  const { data: resguardos } = await supabase
                    .from('resguardos')
                    .select('resguardante, f_resguardo')
                    .eq('id_mueble', data.id)
                    .eq('origen', 'ITEA')
                    .order('f_resguardo', { ascending: false })
                    .limit(1);
                  
                  const dataWithColorAndResguardante = {
                    ...data,
                    resguardante: resguardos?.[0]?.resguardante || null,
                    colores: data.color ? colorsMap[data.color] || null : null
                  };
                  
                  if (dataWithColorAndResguardante.config_estatus?.concepto === 'BAJA') {
                    removeMueble(dataWithColorAndResguardante.id);
                  } else {
                    updateMueble(dataWithColorAndResguardante.id, dataWithColorAndResguardante);
                    addRealtimeChange({
                      moduleKey: MODULE_KEY,
                      moduleName: 'ITEA',
                      table: TABLE,
                      eventType: 'UPDATE',
                      recordId: dataWithColorAndResguardante.id,
                      recordName: dataWithColorAndResguardante.id_inv,
                    });
                  }
                  iteaEmitter.emit({ type: 'UPDATE', data: dataWithColorAndResguardante, timestamp: new Date().toISOString() });
                }
                break;
              }
              case 'DELETE': {
                if (oldRecord?.id) {
                  removeMueble(oldRecord.id);
                  iteaEmitter.emit({ type: 'DELETE', data: oldRecord, timestamp: new Date().toISOString() });
                  addRealtimeChange({
                    moduleKey: MODULE_KEY,
                    moduleName: 'ITEA',
                    table: TABLE,
                    eventType: 'DELETE',
                    recordId: oldRecord.id,
                    recordName: oldRecord.id_inv,
                  });
                }
                break;
              }
            }
          } catch (error) {
            console.error('Error handling realtime event:', error);
          }
        }
      )
      // Listen to area table changes
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'area' },
        async (payload: any) => {
          const { new: updatedArea } = payload;
          updateLastEventReceived(MODULE_KEY);
          
          try {
            processBatchUpdates([], 'area', updatedArea.id_area);
          } catch (error) {
            console.error('Error handling area update:', error);
          }
        }
      )
      // Listen to directorio table changes
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'directorio' },
        async (payload: any) => {
          const { new: updatedDirector } = payload;
          updateLastEventReceived(MODULE_KEY);
          
          try {
            processBatchUpdates([], 'directorio', updatedDirector.id_directorio);
          } catch (error) {
            console.error('Error handling director update:', error);
          }
        }
      )
      // Listen to config table changes (for estatus updates)
      // Use debouncing to handle mass updates efficiently
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'config',
        filter: 'tipo=eq.estatus'
      },
        async (payload: any) => {
          const { new: updatedConfig } = payload;
          updateLastEventReceived(MODULE_KEY);
          
          try {
            if (updatedConfig.tipo === 'estatus') {
              // Add to pending updates set
              pendingConfigUpdatesRef.current.add(updatedConfig.id);
              
              // Clear existing timeout
              if (configUpdateTimeoutRef.current) {
                clearTimeout(configUpdateTimeoutRef.current);
              }
              
              // Set new timeout to process all pending updates after 2 seconds of inactivity
              configUpdateTimeoutRef.current = setTimeout(async () => {
                const configIds = Array.from(pendingConfigUpdatesRef.current);
                pendingConfigUpdatesRef.current.clear();
                
                // Process each unique config ID
                for (const configId of configIds) {
                  await processBatchUpdates([], 'estatus', configId);
                }
              }, 2000);
            }
          } catch (error) {
            console.error('Error handling config estatus update:', error);
          }
        }
      )
      .on('system', {}, (payload) => {
        const { status } = payload;
        const wasConnected = indexationState?.realtimeConnected ?? false;
        const isConnected = status === 'SUBSCRIBED' || status === 'ok';
        updateRealtimeConnection(MODULE_KEY, isConnected);
        if (wasConnected && !isConnected) {
          setDisconnectedAt(MODULE_KEY, new Date().toISOString());
          handleReconnection();
        }
        if (!wasConnected && isConnected) {
          handleReconciliation();
        }
      })
      // Listen to resguardos table changes
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'resguardos', filter: 'origen=eq.ITEA' },
        async (payload: any) => {
          updateLastEventReceived(MODULE_KEY);
          
          try {
            const affectedMuebleId = payload.new?.id_mueble || payload.old?.id_mueble;
            if (!affectedMuebleId) return;
            
            const colorsMap = await fetchColorsMap();
            
            // Refetch the affected mueble with its updated resguardante
            const { data: updatedMueble, error } = await supabase
              .from(TABLE)
              .select(`
                *,
                area:area(id_area, nombre),
                directorio:directorio(id_directorio, nombre, puesto),
                config_estatus:config!id_estatus(id, concepto)
              `)
              .eq('id', affectedMuebleId)
              .single();
            
            if (!error && updatedMueble && updatedMueble.config_estatus?.concepto !== 'BAJA') {
              // Fetch resguardo separately
              const { data: resguardos } = await supabase
                .from('resguardos')
                .select('resguardante, f_resguardo')
                .eq('id_mueble', affectedMuebleId)
                .eq('origen', 'ITEA')
                .order('f_resguardo', { ascending: false })
                .limit(1);
              
              const transformed = {
                ...updatedMueble,
                resguardante: resguardos?.[0]?.resguardante || null,
                colores: updatedMueble.color ? colorsMap[updatedMueble.color] || null : null
              };
              updateMueble(transformed.id, transformed);
            }
          } catch (error) {
            console.error('Error handling resguardo change:', error);
          }
        }
      )
      .subscribe();
    
    channelRef.current = channel;
  }, [indexationState?.realtimeConnected, updateRealtimeConnection, updateLastEventReceived, setDisconnectedAt, addMueble, updateMueble, removeMueble, processBatchUpdates, addRealtimeChange]);
  
  const handleReconnection = useCallback(async () => {
    const state = indexationState;
    if (!state || state.reconnectionAttempts >= state.maxReconnectionAttempts) {
      updateReconnectionStatus(MODULE_KEY, 'failed');
      return;
    }
    updateReconnectionStatus(MODULE_KEY, 'reconnecting');
    const delay = Math.min(
      RECONNECTION_CONFIG.baseDelay * Math.pow(RECONNECTION_CONFIG.multiplier, state.reconnectionAttempts),
      RECONNECTION_CONFIG.maxDelay
    );
    reconnectionTimeoutRef.current = setTimeout(async () => {
      incrementReconnectionAttempts(MODULE_KEY);
      await setupRealtimeSubscription();
    }, delay);
  }, [indexationState, updateReconnectionStatus, incrementReconnectionAttempts, setupRealtimeSubscription]);
  
  const handleReconciliation = useCallback(async () => {
    const state = indexationState;
    if (!state || !state.disconnectedAt) return;
    const disconnectionDuration = Date.now() - new Date(state.disconnectedAt).getTime();
    if (disconnectionDuration > 5000) {
      updateReconnectionStatus(MODULE_KEY, 'reconciling');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateReconnectionStatus(MODULE_KEY, 'idle');
    } else {
      updateReconnectionStatus(MODULE_KEY, 'idle');
    }
    resetReconnectionAttempts(MODULE_KEY);
    setDisconnectedAt(MODULE_KEY, null);
  }, [indexationState, updateReconnectionStatus, resetReconnectionAttempts, setDisconnectedAt]);
  
  // ============================================================================
  // INICIALIZACIÓN
  // ============================================================================
  
  // Esperar a que el store se hidrate desde IndexedDB
  const isStoreHydrated = useHydrationStore(state => state.isHydrated('itea'));
  
  useEffect(() => {
    if (isInitializedRef.current || !isStoreHydrated) return;
    
    // Solo ejecutar en el cliente (navegador)
    if (typeof window === 'undefined') return;
    
    const initialize = async () => {
      initializeModule(MODULE_KEY);
      try {
        const response = await fetch('/api/auth/session', { credentials: 'include' });
        if (!response.ok) return;
        const sessionData = await response.json();
        if (!sessionData.isAuthenticated) return;
      } catch (error) {
        console.error('Error checking authentication:', error);
        return;
      }
      
      // Verificar si ya hay datos en IndexedDB (después de hidratación)
      const currentState = useIndexationStore.getState().modules[MODULE_KEY];
      const currentMuebles = useIteaStore.getState().muebles;
      const hasDataInIndexedDB = currentMuebles.length > 0;
      const isAlreadyIndexed = currentState?.isIndexed && hasDataInIndexedDB;
      
      if (isAlreadyIndexed) {
        completeIndexation(MODULE_KEY);
        await setupRealtimeSubscription();
      } else {
        await indexData();
      }
      isInitializedRef.current = true;
    };
    initialize();
    return () => {
      if (reconnectionTimeoutRef.current) clearTimeout(reconnectionTimeoutRef.current);
      if (configUpdateTimeoutRef.current) clearTimeout(configUpdateTimeoutRef.current);
    };
  }, [initializeModule, indexData, setupRealtimeSubscription, isStoreHydrated]);
  
  return {
    isIndexing: indexationState?.isIndexing ?? false,
    isIndexed: indexationState?.isIndexed ?? false,
    progress: indexationState?.progress ?? 0,
    currentStage: indexationState?.currentStage ?? null,
    error: indexationState?.error ?? null,
    realtimeConnected: indexationState?.realtimeConnected ?? false,
    reconnectionStatus: indexationState?.reconnectionStatus ?? 'idle',
    reconnectionAttempts: indexationState?.reconnectionAttempts ?? 0,
    maxReconnectionAttempts: indexationState?.maxReconnectionAttempts ?? 5,
    muebles,
    reindex: indexData,
  };
}
