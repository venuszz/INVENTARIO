// ============================================================================
// USE RESGUARDOS BAJAS INDEXATION HOOK
// ============================================================================

import { useEffect, useRef, useCallback } from 'react';
import { useIndexationStore } from '@/stores/indexationStore';
import { useResguardosBajasStore } from '@/stores/resguardosBajasStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { withExponentialBackoff, FETCH_RETRY_CONFIG, RECONNECTION_CONFIG } from '@/lib/indexation/exponentialBackoff';
import { RESGUARDOS_BAJAS_CONFIG } from '@/config/modules';
import supabase from '@/app/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { ResguardoBaja } from '@/types/indexation';

const MODULE_KEY = 'resguardos-bajas';
const { stages: STAGES, table: TABLE } = RESGUARDOS_BAJAS_CONFIG;

export function useResguardosBajasIndexation() {
  const indexationState = useIndexationStore(state => state.modules[MODULE_KEY]);
  const {
    startIndexation, updateProgress, completeIndexation, setError,
    updateRealtimeConnection, updateReconnectionStatus,
    incrementReconnectionAttempts, resetReconnectionAttempts,
    setDisconnectedAt, updateLastEventReceived, initializeModule,
  } = useIndexationStore();
  
  const { resguardos, setResguardos, addResguardo, updateResguardo, removeResguardo, isCacheValid } = useResguardosBajasStore();
  
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
      const fetchedResguardos: ResguardoBaja[] = [];
      let hasMore = true;
      let offset = 0;
      const BATCH_SIZE = 1000;
      
      while (hasMore) {
        const batch = await withExponentialBackoff(
          async () => {
            const { data, error } = await supabase
              .from(TABLE)
              .select('*')
              .range(offset, offset + BATCH_SIZE - 1);
            if (error) throw error;
            return data as ResguardoBaja[];
          },
          FETCH_RETRY_CONFIG
        );
        
        fetchedResguardos.push(...batch);
        hasMore = batch.length === BATCH_SIZE;
        offset += BATCH_SIZE;
        
        // Update progress during fetch
        const fetchProgress = Math.min(stage1.weight * 0.9, (offset / 10000) * stage1.weight);
        updateProgress(MODULE_KEY, accumulatedProgress + fetchProgress, `${stage1.label} (${fetchedResguardos.length} registros)`);
      }
      
      setResguardos(fetchedResguardos);
      accumulatedProgress += stage1.weight;
      updateProgress(MODULE_KEY, accumulatedProgress, stage1.label);
      
      const stage2 = STAGES[1];
      updateProgress(MODULE_KEY, accumulatedProgress, stage2.label);
      await setupRealtimeSubscription();
      accumulatedProgress += stage2.weight;
      updateProgress(MODULE_KEY, accumulatedProgress, stage2.label);
      
      completeIndexation(MODULE_KEY);
    } catch (error) {
      console.error('Error indexing Resguardos Bajas:', error);
      setError(MODULE_KEY, error instanceof Error ? error.message : 'Error al indexar datos');
    } finally {
      isIndexingRef.current = false;
    }
  }, [startIndexation, updateProgress, completeIndexation, setError, setResguardos]);
  
  const setupRealtimeSubscription = useCallback(async () => {
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    const channel = supabase
      .channel(`${TABLE}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE },
        async (payload: RealtimePostgresChangesPayload<ResguardoBaja>) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          updateLastEventReceived(MODULE_KEY);
          
          try {
            switch (eventType) {
              case 'INSERT': {
                await new Promise(resolve => setTimeout(resolve, 300));
                const { data, error } = await supabase.from(TABLE).select('*').eq('id', newRecord.id).single();
                if (!error && data) {
                  addResguardo(data);
                }
                break;
              }
              case 'UPDATE': {
                const { data, error } = await supabase.from(TABLE).select('*').eq('id', newRecord.id).single();
                if (!error && data) {
                  updateResguardo(data.id, data);
                }
                break;
              }
              case 'DELETE': {
                if (oldRecord?.id) {
                  removeResguardo(oldRecord.id);
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
  }, [indexationState?.realtimeConnected, updateRealtimeConnection, updateLastEventReceived, setDisconnectedAt, addResguardo, updateResguardo, removeResguardo]);
  
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
  const isStoreHydrated = useHydrationStore(state => state.isHydrated('resguardos-bajas'));
  
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
      const currentResguardos = useResguardosBajasStore.getState().resguardos;
      
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
    resguardos,
    reindex: indexData,
  };
}
