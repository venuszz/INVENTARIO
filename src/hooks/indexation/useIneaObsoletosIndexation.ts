// ============================================================================
// USE INEA OBSOLETOS INDEXATION HOOK
// ============================================================================
// Hook personalizado para gestionar la indexación de muebles INEA obsoletos (estatus BAJA).

import { useEffect, useRef, useCallback } from 'react';
import { useIndexationStore } from '@/stores/indexationStore';
import { useIneaObsoletosStore } from '@/stores/ineaObsoletosStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { withExponentialBackoff, FETCH_RETRY_CONFIG, RECONNECTION_CONFIG } from '@/lib/indexation/exponentialBackoff';
import { INEA_CONFIG } from '@/config/modules';
import supabase from '@/app/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { MuebleINEA } from '@/types/indexation';

const MODULE_KEY = 'inea-obsoletos';
const { stages: STAGES, table: TABLE } = INEA_CONFIG;

export function useIneaObsoletosIndexation() {
  const indexationState = useIndexationStore(state => state.modules[MODULE_KEY]);
  const {
    startIndexation,
    updateProgress,
    completeIndexation,
    setError,
    updateRealtimeConnection,
    updateReconnectionStatus,
    incrementReconnectionAttempts,
    resetReconnectionAttempts,
    setDisconnectedAt,
    updateLastEventReceived,
    initializeModule,
  } = useIndexationStore();
  
  const {
    muebles,
    setMuebles,
    addMueble,
    updateMueble,
    removeMueble,
    isCacheValid,
    updateMuebleBatch,
    setSyncingIds,
    removeSyncingIds,
    clearSyncingIds,
    setIsSyncing,
  } = useIneaObsoletosStore();
  
  const isIndexingRef = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const hasHydratedRef = useRef(false);
  const syncQueueRef = useRef<{ ids: string[]; type: 'area' | 'directorio' | 'estatus'; refId: number } | null>(null);
  const isSyncingRef = useRef(false);
  
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
    const allFetchedMuebles: MuebleINEA[] = [];
    const filterField = type === 'area' ? 'id_area' : type === 'directorio' ? 'id_directorio' : 'id_estatus';
    
    // Get BAJA status ID from config table
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
            area:id_area(id_area, nombre),
            directorio:id_directorio(id_directorio, nombre, puesto),
            config_estatus:config!id_estatus(id, concepto)
          `)
          .eq(filterField, refId)
          .eq('id_estatus', bajaStatus.id)
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
            .eq('origen', 'INEA')
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
          
          // Transform data to extract resguardante
          const transformed = affectedMuebles.map(item => ({
            ...item,
            resguardante: resguardoMap.get(item.id) || null
          }));
          allFetchedMuebles.push(...transformed);
          
          // Set syncing IDs for skeleton display - THIS TRIGGERS RE-RENDER
          const ids = affectedMuebles.map(m => m.id);
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
    
    // Ensure minimum skeleton display time of 800ms
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Update store in batches of 50 to avoid UI lag
    const UI_BATCH_SIZE = 50;
    for (let i = 0; i < allFetchedMuebles.length; i += UI_BATCH_SIZE) {
      const batch = allFetchedMuebles.slice(i, i + UI_BATCH_SIZE);
      updateMuebleBatch(batch);
      
      const syncedIds = batch.map(m => m.id);
      removeSyncingIds(syncedIds);
      
      // Small delay between batches to show progressive update
      await new Promise(resolve => setTimeout(resolve, 100));
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
    if (isIndexingRef.current) {
      return;
    }
    
    isIndexingRef.current = true;
    
    try {
      startIndexation(MODULE_KEY);
      
      let accumulatedProgress = 0;
      
      const stage1 = STAGES[0];
      updateProgress(MODULE_KEY, accumulatedProgress, stage1.label);
      
      // Get BAJA status ID from config table
      const { data: bajaStatus, error: bajaError } = await supabase
        .from('config')
        .select('id')
        .eq('tipo', 'estatus')
        .eq('concepto', 'BAJA')
        .single();
      
      if (bajaError || !bajaStatus) {
        throw new Error('No se pudo obtener el estatus BAJA');
      }
      
      // Fetch data in batches of 1000
      const fetchedMuebles: MuebleINEA[] = [];
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
                area:id_area(id_area, nombre),
                directorio:id_directorio(id_directorio, nombre, puesto),
                config_estatus:config!id_estatus(id, concepto)
              `)
              .eq('id_estatus', bajaStatus.id)
              .range(offset, offset + BATCH_SIZE - 1);
            
            if (error) throw error;
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
                .eq('origen', 'INEA')
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
            
            // Step 4: Combine data
            return data.map(item => ({
              ...item,
              resguardante: resguardoMap.get(item.id) || null
            })) as MuebleINEA[];
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
      console.error('❌ Error indexing INEA Obsoletos:', error);
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
      .channel(`${TABLE}-obsoletos-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLE,
        },
        async (payload: RealtimePostgresChangesPayload<MuebleINEA>) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          updateLastEventReceived(MODULE_KEY);
          
          try {
            switch (eventType) {
              case 'INSERT': {
                await new Promise(resolve => setTimeout(resolve, 300));
                
                const { data: insertedData, error } = await supabase
                  .from(TABLE)
                  .select(`
                    *,
                    area:id_area(id_area, nombre),
                    directorio:id_directorio(id_directorio, nombre, puesto),
                    config_estatus:config!id_estatus(id, concepto)
                  `)
                  .eq('id', newRecord.id)
                  .single();
                
                if (error) {
                  console.error('Error fetching inserted record:', error);
                  break;
                }
                
                if (insertedData && insertedData.config_estatus?.concepto === 'BAJA') {
                  // Fetch resguardo separately
                  const { data: resguardos } = await supabase
                    .from('resguardos')
                    .select('resguardante, f_resguardo')
                    .eq('id_mueble', insertedData.id)
                    .eq('origen', 'INEA')
                    .order('f_resguardo', { ascending: false })
                    .limit(1);
                  
                  const transformed = {
                    ...insertedData,
                    resguardante: resguardos?.[0]?.resguardante || null
                  };
                  addMueble(transformed);
                }
                break;
              }
              
              case 'UPDATE': {
                const { data: updatedData, error } = await supabase
                  .from(TABLE)
                  .select(`
                    *,
                    area:id_area(id_area, nombre),
                    directorio:id_directorio(id_directorio, nombre, puesto),
                    config_estatus:config!id_estatus(id, concepto)
                  `)
                  .eq('id', newRecord.id)
                  .single();
                
                if (error) {
                  console.error('Error fetching updated record:', error);
                  break;
                }
                
                if (updatedData) {
                  // Fetch resguardo separately
                  const { data: resguardos } = await supabase
                    .from('resguardos')
                    .select('resguardante, f_resguardo')
                    .eq('id_mueble', updatedData.id)
                    .eq('origen', 'INEA')
                    .order('f_resguardo', { ascending: false })
                    .limit(1);
                  
                  const transformed = {
                    ...updatedData,
                    resguardante: resguardos?.[0]?.resguardante || null
                  };
                  
                  if (transformed.config_estatus?.concepto === 'BAJA') {
                    updateMueble(transformed.id, transformed);
                  } else {
                    removeMueble(transformed.id);
                  }
                }
                break;
              }
              
              case 'DELETE': {
                if (oldRecord?.id) {
                  removeMueble(oldRecord.id);
                }
                break;
              }
            }
          } catch (error) {
            console.error('Error handling realtime event:', error);
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
              processBatchUpdates([], 'estatus', updatedConfig.id);
            }
          } catch (error) {
            console.error('Error handling config estatus update:', error);
          }
        }
      )
      // Listen to resguardos table changes
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'resguardos', filter: 'origen=eq.INEA' },
        async (payload: any) => {
          updateLastEventReceived(MODULE_KEY);
          
          try {
            const affectedMuebleId = payload.new?.id_mueble || payload.old?.id_mueble;
            if (!affectedMuebleId) return;
            
            // Refetch the affected mueble with its updated resguardante
            const { data: updatedMueble, error } = await supabase
              .from(TABLE)
              .select(`
                *,
                area:id_area(id_area, nombre),
                directorio:id_directorio(id_directorio, nombre, puesto),
                config_estatus:config!id_estatus(id, concepto)
              `)
              .eq('id', affectedMuebleId)
              .single();
            
            if (!error && updatedMueble && updatedMueble.config_estatus?.concepto === 'BAJA') {
              // Fetch resguardo separately
              const { data: resguardos } = await supabase
                .from('resguardos')
                .select('resguardante, f_resguardo')
                .eq('id_mueble', affectedMuebleId)
                .eq('origen', 'INEA')
                .order('f_resguardo', { ascending: false })
                .limit(1);
              
              const transformed = {
                ...updatedMueble,
                resguardante: resguardos?.[0]?.resguardante || null
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
  }, [indexationState?.realtimeConnected, updateRealtimeConnection, updateLastEventReceived, setDisconnectedAt, addMueble, updateMueble, removeMueble, processBatchUpdates]);
  
  const handleReconnection = useCallback(async () => {
    const state = indexationState;
    if (!state) return;
    
    if (state.reconnectionAttempts >= state.maxReconnectionAttempts) {
      console.error('❌ Max reconnection attempts reached (INEA Obsoletos)');
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
    const disconnectionSeconds = Math.floor(disconnectionDuration / 1000);
    
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
  const isStoreHydrated = useHydrationStore(state => state.isHydrated('inea-obsoletos'));
  
  useEffect(() => {
    if (isInitializedRef.current || !isStoreHydrated) return;
    
    // Solo ejecutar en el cliente (navegador)
    if (typeof window === 'undefined') return;
    
    const initialize = async () => {
      initializeModule(MODULE_KEY);
      
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          return;
        }
        
        const sessionData = await response.json();
        if (!sessionData.isAuthenticated) {
          return;
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        return;
      }
      
      // Verificar si ya hay datos en IndexedDB (después de hidratación)
      const currentState = useIndexationStore.getState().modules[MODULE_KEY];
      const currentMuebles = useIneaObsoletosStore.getState().muebles;
      
      // Si el módulo ya fue indexado (incluso con 0 registros), no reindexar
      // Esto previene loops infinitos en módulos vacíos
      const isAlreadyIndexed = currentState?.isIndexed && currentState?.lastIndexedAt;
      
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
      if (reconnectionTimeoutRef.current) {
        clearTimeout(reconnectionTimeoutRef.current);
      }
    };
  }, [initializeModule, indexData, setupRealtimeSubscription, isStoreHydrated, completeIndexation]);
  
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
