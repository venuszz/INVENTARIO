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
  } = useIneaObsoletosStore();
  
  const isIndexingRef = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const hasHydratedRef = useRef(false);
  
  const indexData = useCallback(async () => {
    if (isIndexingRef.current) {
      console.warn('⚠️ Indexation already in progress for INEA Obsoletos');
      return;
    }
    
    isIndexingRef.current = true;
    
    try {
      startIndexation(MODULE_KEY);
      
      let accumulatedProgress = 0;
      
      const stage1 = STAGES[0];
      updateProgress(MODULE_KEY, accumulatedProgress, stage1.label);
      
      console.log(`📦 Starting stage: ${stage1.label} (INEA Obsoletos)`);
      
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
              .select('*')
              .eq('estatus', 'BAJA')
              .range(offset, offset + BATCH_SIZE - 1);
            
            if (error) throw error;
            return data as MuebleINEA[];
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
      
      console.log(`✅ Fetched ${fetchedMuebles.length} obsolete muebles in batches of ${BATCH_SIZE}`);
      
      setMuebles(fetchedMuebles);
      accumulatedProgress += stage1.weight;
      updateProgress(MODULE_KEY, accumulatedProgress, stage1.label);
      
      console.log(`✅ Stage completed: ${stage1.label} (${fetchedMuebles.length} muebles obsoletos)`);
      
      const stage2 = STAGES[1];
      updateProgress(MODULE_KEY, accumulatedProgress, stage2.label);
      
      console.log(`📡 Starting stage: ${stage2.label} (INEA Obsoletos)`);
      
      await setupRealtimeSubscription();
      
      accumulatedProgress += stage2.weight;
      updateProgress(MODULE_KEY, accumulatedProgress, stage2.label);
      
      console.log(`✅ Stage completed: ${stage2.label} (INEA Obsoletos)`);
      
      completeIndexation(MODULE_KEY);
      console.log(`🎉 Indexation completed for INEA Obsoletos`);
      
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
    
    console.log('📡 Setting up realtime subscription for INEA Obsoletos');
    
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
          
          console.log(`🔔 Realtime event: ${eventType} on ${TABLE} (Obsoletos)`, payload);
          
          updateLastEventReceived(MODULE_KEY);
          
          try {
            switch (eventType) {
              case 'INSERT': {
                await new Promise(resolve => setTimeout(resolve, 300));
                
                const { data: insertedData, error } = await supabase
                  .from(TABLE)
                  .select('*')
                  .eq('id', newRecord.id)
                  .single();
                
                if (error) {
                  console.error('Error fetching inserted record:', error);
                  break;
                }
                
                if (insertedData && insertedData.estatus === 'BAJA') {
                  addMueble(insertedData);
                  console.log('✅ Mueble obsoleto added:', insertedData.id_inv);
                }
                break;
              }
              
              case 'UPDATE': {
                const { data: updatedData, error } = await supabase
                  .from(TABLE)
                  .select('*')
                  .eq('id', newRecord.id)
                  .single();
                
                if (error) {
                  console.error('Error fetching updated record:', error);
                  break;
                }
                
                if (updatedData) {
                  if (updatedData.estatus === 'BAJA') {
                    updateMueble(updatedData.id, updatedData);
                    console.log('✏️ Mueble obsoleto updated:', updatedData.id_inv);
                  } else {
                    removeMueble(updatedData.id);
                    console.log('🗑️ Mueble removed (no longer BAJA):', updatedData.id_inv);
                  }
                }
                break;
              }
              
              case 'DELETE': {
                if (oldRecord?.id) {
                  removeMueble(oldRecord.id);
                  console.log('🗑️ Mueble obsoleto deleted:', oldRecord.id);
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
        const isConnected = status === 'SUBSCRIBED';
        
        console.log(`📡 Realtime status changed: ${status} (INEA Obsoletos)`);
        
        updateRealtimeConnection(MODULE_KEY, isConnected);
        
        if (wasConnected && !isConnected) {
          console.warn('⚠️ Realtime disconnected (INEA Obsoletos)');
          setDisconnectedAt(MODULE_KEY, new Date().toISOString());
          handleReconnection();
        }
        
        if (!wasConnected && isConnected) {
          console.log('✅ Realtime reconnected (INEA Obsoletos)');
          handleReconciliation();
        }
      })
      .subscribe();
    
    channelRef.current = channel;
  }, [indexationState?.realtimeConnected, updateRealtimeConnection, updateLastEventReceived, setDisconnectedAt, addMueble, updateMueble, removeMueble]);
  
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
    
    console.log(
      `🔄 Reconnecting INEA Obsoletos in ${delay}ms ` +
      `(attempt ${state.reconnectionAttempts + 1}/${state.maxReconnectionAttempts})`
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
    
    console.log(`🔄 Reconciling data after ${disconnectionSeconds}s disconnection (INEA Obsoletos)`);
    
    if (disconnectionDuration > 5000) {
      updateReconnectionStatus(MODULE_KEY, 'reconciling');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateReconnectionStatus(MODULE_KEY, 'idle');
      console.log('✅ Reconciliation completed (INEA Obsoletos)');
    } else {
      updateReconnectionStatus(MODULE_KEY, 'idle');
      console.log('✅ Reconnected (no reconciliation needed) (INEA Obsoletos)');
    }
    
    resetReconnectionAttempts(MODULE_KEY);
    setDisconnectedAt(MODULE_KEY, null);
  }, [indexationState, updateReconnectionStatus, resetReconnectionAttempts, setDisconnectedAt]);
  
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    const initialize = async () => {
      initializeModule(MODULE_KEY);
      
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          console.warn('⚠️ Not authenticated, skipping indexation (INEA Obsoletos)');
          return;
        }
        
        const sessionData = await response.json();
        if (!sessionData.isAuthenticated) {
          console.warn('⚠️ Not authenticated, skipping indexation (INEA Obsoletos)');
          return;
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        return;
      }
      
      // Verificar si ya está indexado en esta sesión (sessionStorage)
      const currentState = useIndexationStore.getState().modules[MODULE_KEY];
      const isAlreadyIndexed = currentState?.isIndexed && muebles.length > 0;
      
      console.log('🔍 [INEA OBSOLETOS] Verificando estado de indexación:', {
        moduleKey: MODULE_KEY,
        isIndexed: currentState?.isIndexed,
        mueblesCount: muebles.length,
        isAlreadyIndexed,
        lastIndexedAt: currentState?.lastIndexedAt,
      });
      
      if (isAlreadyIndexed) {
        console.log('✅ [INEA OBSOLETOS] Already indexed in this session, skipping indexation');
        await setupRealtimeSubscription();
      } else {
        console.log('⚠️ [INEA OBSOLETOS] Not indexed in this session, starting indexation');
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
  }, [initializeModule, indexData, setupRealtimeSubscription, completeIndexation, muebles.length]);
  
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
