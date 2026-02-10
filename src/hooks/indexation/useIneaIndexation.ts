// ============================================================================
// USE INEA INDEXATION HOOK
// ============================================================================
// Hook personalizado para gestionar la indexación de muebles INEA.
// Incluye indexación por etapas, tiempo real, reconexión automática y caché.

import { useEffect, useRef, useCallback } from 'react';
import { useIndexationStore } from '@/stores/indexationStore';
import { useIneaStore } from '@/stores/ineaStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { withExponentialBackoff, FETCH_RETRY_CONFIG, RECONNECTION_CONFIG } from '@/lib/indexation/exponentialBackoff';
import { ineaEmitter } from '@/lib/indexation/eventEmitter';
import { INEA_CONFIG } from '@/config/modules';
import supabase from '@/app/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { MuebleINEA } from '@/types/indexation';

const MODULE_KEY = 'inea';
const { stages: STAGES, table: TABLE } = INEA_CONFIG;

/**
 * Hook de indexación para módulo INEA
 * 
 * Gestiona el ciclo completo de indexación:
 * - Verificación de caché
 * - Indexación por etapas con retry
 * - Conexión de tiempo real
 * - Reconexión automática
 * - Reconciliación de datos
 * 
 * @returns Estado y funciones de control de indexación
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const {
 *     isIndexing,
 *     isIndexed,
 *     progress,
 *     muebles,
 *     reindex
 *   } = useIneaIndexation();
 *   
 *   if (isIndexing) return <Loading progress={progress} />;
 *   return <MueblesList muebles={muebles} />;
 * }
 * ```
 */
export function useIneaIndexation() {
  // ============================================================================
  // STORES
  // ============================================================================
  
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
    addRealtimeChange,
  } = useIndexationStore();
  
  const muebles = useIneaStore(state => state.muebles);
  const setMuebles = useIneaStore(state => state.setMuebles);
  const addMueble = useIneaStore(state => state.addMueble);
  const updateMueble = useIneaStore(state => state.updateMueble);
  const removeMueble = useIneaStore(state => state.removeMueble);
  const { updateMuebleBatch, setSyncingIds, removeSyncingIds, clearSyncingIds, setIsSyncing } = useIneaStore();
  
  // ============================================================================
  // REFS
  // ============================================================================
  
  const isIndexingRef = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const hasHydratedRef = useRef(false);
  const syncQueueRef = useRef<{ ids: string[]; type: 'area' | 'directorio'; refId: number } | null>(null);
  const isSyncingRef = useRef(false);
  
  // ============================================================================
  // TIEMPO REAL
  // ============================================================================
  
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
    const allFetchedMuebles: MuebleINEA[] = [];
    const filterField = type === 'area' ? 'id_area' : 'id_directorio';
    
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
            directorio:id_directorio(id_directorio, nombre, puesto)
          `)
          .eq(filterField, refId)
          .neq('estatus', 'BAJA')
          .range(offset, offset + BATCH_SIZE - 1);
        
        if (error) {
          console.error(`Error fetching batch at offset ${offset}:`, error);
          break;
        }
        
        if (affectedMuebles && affectedMuebles.length > 0) {
          allFetchedMuebles.push(...affectedMuebles);
          
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
  
  /**
   * Configura la suscripción de tiempo real para la tabla de muebles
   */
  const setupRealtimeSubscription = useCallback(async () => {
      // Remover canal anterior si existe
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel = supabase
        .channel(`${TABLE}-changes`)
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
                  // Delay para permitir que triggers de BD se completen
                  await new Promise(resolve => setTimeout(resolve, 300));

                  // Refetch registro completo con relaciones
                  const { data: insertedData, error } = await supabase
                    .from(TABLE)
                    .select(`
                      *,
                      area:id_area(id_area, nombre),
                      directorio:id_directorio(id_directorio, nombre, puesto)
                    `)
                    .eq('id', newRecord.id)
                    .single();

                  if (error) {
                    console.error('Error fetching inserted record:', error);
                    break;
                  }

                  if (insertedData && insertedData.estatus !== 'BAJA') {
                    addMueble(insertedData);
                    ineaEmitter.emit({ type: 'INSERT', data: insertedData, timestamp: new Date().toISOString() });
                    addRealtimeChange({
                      moduleKey: MODULE_KEY,
                      moduleName: 'INEA',
                      table: TABLE,
                      eventType: 'INSERT',
                      recordId: insertedData.id,
                      recordName: insertedData.id_inv,
                    });
                  }
                  break;
                }

                case 'UPDATE': {
                  // Refetch registro completo con relaciones
                  const { data: updatedData, error } = await supabase
                    .from(TABLE)
                    .select(`
                      *,
                      area:id_area(id_area, nombre),
                      directorio:id_directorio(id_directorio, nombre, puesto)
                    `)
                    .eq('id', newRecord.id)
                    .single();

                  if (error) {
                    console.error('Error fetching updated record:', error);
                    break;
                  }

                  if (updatedData) {
                    if (updatedData.estatus === 'BAJA') {
                      // Si cambió a BAJA, remover
                      removeMueble(updatedData.id);
                    } else {
                      // Actualizar registro
                      updateMueble(updatedData);
                      addRealtimeChange({
                        moduleKey: MODULE_KEY,
                        moduleName: 'INEA',
                        table: TABLE,
                        eventType: 'UPDATE',
                        recordId: updatedData.id,
                        recordName: updatedData.id_inv,
                      });
                    }
                    ineaEmitter.emit({ type: 'UPDATE', data: updatedData, timestamp: new Date().toISOString() });
                  }
                  break;
                }

                case 'DELETE': {
                  if (oldRecord?.id) {
                    removeMueble(oldRecord.id);
                    ineaEmitter.emit({ type: 'DELETE', data: oldRecord, timestamp: new Date().toISOString() });
                    addRealtimeChange({
                      moduleKey: MODULE_KEY,
                      moduleName: 'INEA',
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
        .on('system', {}, (payload) => {
          const { status } = payload;
          const wasConnected = indexationState?.realtimeConnected ?? false;
          const isConnected = status === 'SUBSCRIBED' || status === 'ok';

          updateRealtimeConnection(MODULE_KEY, isConnected);

          // Detectar desconexión
          if (wasConnected && !isConnected) {
            setDisconnectedAt(MODULE_KEY, new Date().toISOString());
            handleReconnection();
          }

          // Detectar reconexión
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
        .subscribe();

      channelRef.current = channel;
    }, [indexationState?.realtimeConnected, updateRealtimeConnection, updateLastEventReceived, setDisconnectedAt, addMueble, updateMueble, removeMueble, addRealtimeChange, processBatchUpdates])
  
  // ============================================================================
  // RECONEXIÓN Y RECONCILIACIÓN
  // ============================================================================
  
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
  // INDEXACIÓN POR ETAPAS
  // ============================================================================
  
  /**
   * Ejecuta el proceso completo de indexación por etapas
   */
  const indexData = useCallback(async () => {
    // Prevenir indexación concurrente
    if (isIndexingRef.current) {
      return;
    }
    
    isIndexingRef.current = true;
    
    try {
      startIndexation(MODULE_KEY);
      
      let accumulatedProgress = 0;
      
      // ========================================================================
      // ETAPA 1: Fetch muebles con retry
      // ========================================================================
      
      const stage1 = STAGES[0];
      updateProgress(MODULE_KEY, accumulatedProgress, stage1.label);
      
      // Fetch data in batches of 1000
      const fetchedMuebles: MuebleINEA[] = [];
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
                area:id_area(id_area, nombre),
                directorio:id_directorio(id_directorio, nombre, puesto)
              `)
              .neq('estatus', 'BAJA')
              .range(offset, offset + BATCH_SIZE - 1);
            
            if (error) throw error;
            return data as MuebleINEA[];
          },
          FETCH_RETRY_CONFIG
        );
        
        fetchedMuebles.push(...batch);
        hasMore = batch.length === BATCH_SIZE;
        offset += BATCH_SIZE;
        
        // Update progress during fetch (use 90% of stage weight for fetching)
        const fetchProgress = Math.min(stage1.weight * 0.9, (offset / 10000) * stage1.weight);
        updateProgress(MODULE_KEY, accumulatedProgress + fetchProgress, `${stage1.label} (${fetchedMuebles.length} registros)`);
      }
      
      setMuebles(fetchedMuebles);
      accumulatedProgress += stage1.weight;
      updateProgress(MODULE_KEY, accumulatedProgress, stage1.label);
      
      // ========================================================================
      // ETAPA 2: Setup realtime
      // ========================================================================
      
      const stage2 = STAGES[1];
      updateProgress(MODULE_KEY, accumulatedProgress, stage2.label);
      
      await setupRealtimeSubscription();
      
      accumulatedProgress += stage2.weight;
      updateProgress(MODULE_KEY, accumulatedProgress, stage2.label);
      
      // ========================================================================
      // COMPLETAR INDEXACIÓN
      // ========================================================================
      
      completeIndexation(MODULE_KEY);
      
    } catch (error) {
      console.error('❌ Error indexing INEA:', error);
      setError(MODULE_KEY, error instanceof Error ? error.message : 'Error al indexar datos');
    } finally {
      isIndexingRef.current = false;
    }
  }, [startIndexation, updateProgress, completeIndexation, setError, setMuebles, setupRealtimeSubscription]);
  
  // ============================================================================
  // INICIALIZACIÓN
  // ============================================================================
  
  // Esperar a que el store se hidrate desde IndexedDB
  const isStoreHydrated = useHydrationStore(state => state.isHydrated('inea'));
  
  useEffect(() => {
    if (isInitializedRef.current || !isStoreHydrated) return;
    
    // Solo ejecutar en el cliente (navegador)
    if (typeof window === 'undefined') return;
    
    const initialize = async () => {
      // Mark as initialized IMMEDIATELY to prevent concurrent executions
      if (isInitializedRef.current) return;
      isInitializedRef.current = true;
      
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
      const currentMuebles = useIneaStore.getState().muebles;
      const hasDataInIndexedDB = currentMuebles.length > 0;
      const isAlreadyIndexed = currentState?.isIndexed && hasDataInIndexedDB;
      
      if (isAlreadyIndexed) {
        completeIndexation(MODULE_KEY);
        await setupRealtimeSubscription();
      } else {
        await indexData();
      }
    };
    initialize();
    return () => {
      if (reconnectionTimeoutRef.current) clearTimeout(reconnectionTimeoutRef.current);
    };
  }, [initializeModule, indexData, setupRealtimeSubscription, isStoreHydrated]);
  
  // ============================================================================
  // RETORNO
  // ============================================================================
  
  return {
    // Estados de indexación
    isIndexing: indexationState?.isIndexing ?? false,
    isIndexed: indexationState?.isIndexed ?? false,
    progress: indexationState?.progress ?? 0,
    currentStage: indexationState?.currentStage ?? null,
    error: indexationState?.error ?? null,
    
    // Estados de conexión
    realtimeConnected: indexationState?.realtimeConnected ?? false,
    reconnectionStatus: indexationState?.reconnectionStatus ?? 'idle',
    reconnectionAttempts: indexationState?.reconnectionAttempts ?? 0,
    maxReconnectionAttempts: indexationState?.maxReconnectionAttempts ?? 5,
    
    // Datos
    muebles,
    
    // Funciones
    reindex: indexData,
  };
}
