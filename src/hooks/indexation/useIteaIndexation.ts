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

export function useIteaIndexation() {
  const indexationState = useIndexationStore(state => state.modules[MODULE_KEY]);
  const {
    startIndexation, updateProgress, completeIndexation, setError,
    updateRealtimeConnection, updateReconnectionStatus,
    incrementReconnectionAttempts, resetReconnectionAttempts,
    setDisconnectedAt, updateLastEventReceived, initializeModule,
  } = useIndexationStore();
  
  const { muebles, setMuebles, addMueble, updateMueble, removeMueble, isCacheValid } = useIteaStore();
  
  const isIndexingRef = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  
  const indexData = useCallback(async () => {
    if (isIndexingRef.current) return;
    isIndexingRef.current = true;
    
    try {
      startIndexation(MODULE_KEY);
      let accumulatedProgress = 0;
      
      const stage1 = STAGES[0];
      updateProgress(MODULE_KEY, accumulatedProgress, stage1.label);
      
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
              .select('*')
              .neq('estatus', 'BAJA')
              .range(offset, offset + BATCH_SIZE - 1);
            if (error) throw error;
            return data as MuebleITEA[];
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
                const { data, error } = await supabase.from(TABLE).select('*').eq('id', newRecord.id).single();
                if (!error && data && data.estatus !== 'BAJA') {
                  addMueble(data);
                  iteaEmitter.emit({ type: 'INSERT', data, timestamp: new Date().toISOString() });
                }
                break;
              }
              case 'UPDATE': {
                const { data, error } = await supabase.from(TABLE).select('*').eq('id', newRecord.id).single();
                if (!error && data) {
                  if (data.estatus === 'BAJA') {
                    removeMueble(data.id);
                  } else {
                    updateMueble(data.id, data);
                  }
                  iteaEmitter.emit({ type: 'UPDATE', data, timestamp: new Date().toISOString() });
                }
                break;
              }
              case 'DELETE': {
                if (oldRecord?.id) {
                  removeMueble(oldRecord.id);
                  iteaEmitter.emit({ type: 'DELETE', data: oldRecord, timestamp: new Date().toISOString() });
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
      .subscribe();
    
    channelRef.current = channel;
  }, [indexationState?.realtimeConnected, updateRealtimeConnection, updateLastEventReceived, setDisconnectedAt, addMueble, updateMueble, removeMueble]);
  
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
      
      console.log('🔍 [ITEA] Verificando estado de indexación:', {
        moduleKey: MODULE_KEY,
        isIndexed: currentState?.isIndexed,
        mueblesCount: muebles.length,
        hasDataInIndexedDB,
        isAlreadyIndexed,
        lastIndexedAt: currentState?.lastIndexedAt,
        isStoreHydrated,
      });
      
      if (isAlreadyIndexed) {
        console.log('✅ [ITEA] Data found in IndexedDB, skipping indexation');
        completeIndexation(MODULE_KEY);
        await setupRealtimeSubscription();
      } else {
        console.log('⚠️ [ITEA] No data in IndexedDB, starting full indexation');
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
