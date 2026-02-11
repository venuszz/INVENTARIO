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
  const syncQueueRef = useRef<{ ids: string[]; type: 'area' | 'directorio'; refId: number } | null>(null);
  const isSyncingRef = useRef(false);
  
  /**
   * Process updates in batches to avoid UI lag and handle Supabase 1000-record limit
   */
  const processBatchUpdates = useCallback(async (
    _ids: string[],
    type: 'area' | 'directorio',
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
    const filterField = type === 'area' ? 'id_area' : 'id_directorio';
    
    // Get colors map
    const colorsMap = await fetchColorsMap();
    
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
            directorio:directorio(id_directorio, nombre, puesto)
          `)
          .eq(filterField, refId)
          .neq('estatus', 'BAJA')
          .range(offset, offset + BATCH_SIZE - 1);
        
        if (error) {
          console.error(`Error fetching batch at offset ${offset}:`, error);
          break;
        }
        
        if (affectedMuebles && affectedMuebles.length > 0) {
          // Attach color data
          const mueblesWithColors = attachColorData(affectedMuebles, colorsMap);
          allFetchedMuebles.push(...mueblesWithColors);
          
          // Set syncing IDs for skeleton display
          const ids = mueblesWithColors.map(m => m.id);
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
            const { data, error } = await supabase
              .from(TABLE)
              .select(`
                *,
                area:area(id_area, nombre),
                directorio:directorio(id_directorio, nombre, puesto)
              `)
              .neq('estatus', 'BAJA')
              .range(offset, offset + BATCH_SIZE - 1);
            
            if (error) {
              console.error('❌ [ITEA Indexation] Query failed:', error);
              throw error;
            }
            
            // Manually attach color data
            const dataWithColors = (data || []).map((item: any) => ({
              ...item,
              colores: item.color ? coloresMap[item.color] || null : null
            }));
            
            console.log('✅ [ITEA Indexation] Batch fetched:', {
              records: dataWithColors.length,
              with_colors: dataWithColors.filter((i: any) => i.colores).length
            });
            
            return dataWithColors as MuebleITEA[];
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
                    directorio:directorio(id_directorio, nombre, puesto)
                  `)
                  .eq('id', newRecord.id)
                  .single();
                
                if (!error && data) {
                  const dataWithColor = attachColorData([data], colorsMap)[0];
                  
                  if (dataWithColor.estatus !== 'BAJA') {
                    addMueble(dataWithColor);
                    iteaEmitter.emit({ type: 'INSERT', data: dataWithColor, timestamp: new Date().toISOString() });
                    addRealtimeChange({
                      moduleKey: MODULE_KEY,
                      moduleName: 'ITEA',
                      table: TABLE,
                      eventType: 'INSERT',
                      recordId: dataWithColor.id,
                      recordName: dataWithColor.id_inv,
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
                    directorio:directorio(id_directorio, nombre, puesto)
                  `)
                  .eq('id', newRecord.id)
                  .single();
                  
                if (!error && data) {
                  const dataWithColor = attachColorData([data], colorsMap)[0];
                  
                  if (dataWithColor.estatus === 'BAJA') {
                    removeMueble(dataWithColor.id);
                  } else {
                    updateMueble(dataWithColor.id, dataWithColor);
                    addRealtimeChange({
                      moduleKey: MODULE_KEY,
                      moduleName: 'ITEA',
                      table: TABLE,
                      eventType: 'UPDATE',
                      recordId: dataWithColor.id,
                      recordName: dataWithColor.id_inv,
                    });
                  }
                  iteaEmitter.emit({ type: 'UPDATE', data: dataWithColor, timestamp: new Date().toISOString() });
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
