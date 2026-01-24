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
  } = useIndexationStore();
  
  const {
    muebles,
    setMuebles,
    addMueble,
    updateMueble,
    removeMueble,
    isCacheValid,
  } = useIneaStore();
  
  // ============================================================================
  // REFS
  // ============================================================================
  
  const isIndexingRef = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const hasHydratedRef = useRef(false);
  
  // ============================================================================
  // INDEXACIÓN POR ETAPAS
  // ============================================================================
  
  /**
   * Ejecuta el proceso completo de indexación por etapas
   */
  const indexData = useCallback(async () => {
    // Prevenir indexación concurrente
    if (isIndexingRef.current) {
      console.warn('⚠️ Indexation already in progress for INEA');
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
      
      console.log(`📦 Starting stage: ${stage1.label}`);
      
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
      
      console.log(`✅ Fetched ${fetchedMuebles.length} muebles in batches of ${BATCH_SIZE}`);
      
      setMuebles(fetchedMuebles);
      accumulatedProgress += stage1.weight;
      updateProgress(MODULE_KEY, accumulatedProgress, stage1.label);
      
      console.log(`✅ Stage completed: ${stage1.label} (${fetchedMuebles.length} muebles)`);
      
      // ========================================================================
      // ETAPA 2: Setup realtime
      // ========================================================================
      
      const stage2 = STAGES[1];
      updateProgress(MODULE_KEY, accumulatedProgress, stage2.label);
      
      console.log(`📡 Starting stage: ${stage2.label}`);
      
      await setupRealtimeSubscription();
      
      accumulatedProgress += stage2.weight;
      updateProgress(MODULE_KEY, accumulatedProgress, stage2.label);
      
      console.log(`✅ Stage completed: ${stage2.label}`);
      
      // ========================================================================
      // COMPLETAR INDEXACIÓN
      // ========================================================================
      
      completeIndexation(MODULE_KEY);
      console.log(`🎉 Indexation completed for INEA`);
      
    } catch (error) {
      console.error('❌ Error indexing INEA:', error);
      setError(MODULE_KEY, error instanceof Error ? error.message : 'Error al indexar datos');
    } finally {
      isIndexingRef.current = false;
    }
  }, [startIndexation, updateProgress, completeIndexation, setError, setMuebles]);
  
  // ============================================================================
  // TIEMPO REAL
  // ============================================================================
  
  /**
   * Configura la suscripción de tiempo real para la tabla de muebles
   */
  const setupRealtimeSubscription = useCallback(async () => {
    // Remover canal anterior si existe
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    console.log('📡 Setting up realtime subscription for INEA');
    
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
          
          console.log(`🔔 Realtime event: ${eventType} on ${TABLE}`, payload);
          
          updateLastEventReceived(MODULE_KEY);
          
          try {
            switch (eventType) {
              case 'INSERT': {
                // Delay para permitir que triggers de BD se completen
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Refetch registro completo con relaciones
                const { data: insertedData, error } = await supabase
                  .from(TABLE)
                  .select('*')
                  .eq('id', newRecord.id)
                  .single();
                
                if (error) {
                  console.error('Error fetching inserted record:', error);
                  break;
                }
                
                if (insertedData && insertedData.estatus !== 'BAJA') {
                  addMueble(insertedData);
                  ineaEmitter.emit({ type: 'INSERT', data: insertedData, timestamp: new Date().toISOString() });
                  console.log('✅ Mueble added:', insertedData.id_inv);
                }
                break;
              }
              
              case 'UPDATE': {
                // Refetch registro completo con relaciones
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
                    // Si cambió a BAJA, remover
                    removeMueble(updatedData.id);
                    console.log('🗑️ Mueble removed (BAJA):', updatedData.id_inv);
                  } else {
                    // Actualizar registro
                    updateMueble(updatedData);
                    console.log('✏️ Mueble updated:', updatedData.id_inv);
                  }
                  ineaEmitter.emit({ type: 'UPDATE', data: updatedData, timestamp: new Date().toISOString() });
                }
                break;
              }
              
              case 'DELETE': {
                if (oldRecord?.id) {
                  removeMueble(oldRecord.id);
                  ineaEmitter.emit({ type: 'DELETE', data: oldRecord, timestamp: new Date().toISOString() });
                  console.log('🗑️ Mueble deleted:', oldRecord.id);
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
        
        console.log(`📡 Realtime status changed: ${status}`);
        
        updateRealtimeConnection(MODULE_KEY, isConnected);
        
        // Detectar desconexión
        if (wasConnected && !isConnected) {
          console.warn('⚠️ Realtime disconnected');
          setDisconnectedAt(MODULE_KEY, new Date().toISOString());
          handleReconnection();
        }
        
        // Detectar reconexión
        if (!wasConnected && isConnected) {
          console.log('✅ Realtime reconnected');
          handleReconciliation();
        }
      })
      .subscribe();
    
    channelRef.current = channel;
  }, [indexationState?.realtimeConnected, updateRealtimeConnection, updateLastEventReceived, setDisconnectedAt, addMueble, updateMueble, removeMueble]);
  
  // ============================================================================
  // RECONEXIÓN AUTOMÁTICA
  // ============================================================================
  
  /**
   * Maneja el proceso de reconexión automática con exponential backoff
   */
  const handleReconnection = useCallback(async () => {
    const state = indexationState;
    if (!state) return;
    
    // Verificar si se alcanzó el límite de intentos
    if (state.reconnectionAttempts >= state.maxReconnectionAttempts) {
      console.error('❌ Max reconnection attempts reached');
      updateReconnectionStatus(MODULE_KEY, 'failed');
      return;
    }
    
    updateReconnectionStatus(MODULE_KEY, 'reconnecting');
    
    // Calcular delay con exponential backoff
    const delay = Math.min(
      RECONNECTION_CONFIG.baseDelay * Math.pow(RECONNECTION_CONFIG.multiplier, state.reconnectionAttempts),
      RECONNECTION_CONFIG.maxDelay
    );
    
    console.log(
      `🔄 Reconnecting INEA in ${delay}ms ` +
      `(attempt ${state.reconnectionAttempts + 1}/${state.maxReconnectionAttempts})`
    );
    
    // Programar reconexión
    reconnectionTimeoutRef.current = setTimeout(async () => {
      incrementReconnectionAttempts(MODULE_KEY);
      await setupRealtimeSubscription();
    }, delay);
  }, [indexationState, updateReconnectionStatus, incrementReconnectionAttempts, setupRealtimeSubscription]);
  
  /**
   * Maneja la reconciliación de datos después de reconexión exitosa
   */
  const handleReconciliation = useCallback(async () => {
    const state = indexationState;
    if (!state || !state.disconnectedAt) return;
    
    // Calcular duración de desconexión
    const disconnectionDuration = Date.now() - new Date(state.disconnectedAt).getTime();
    const disconnectionSeconds = Math.floor(disconnectionDuration / 1000);
    
    console.log(`🔄 Reconciling data after ${disconnectionSeconds}s disconnection`);
    
    // Si estuvo desconectado más de 5 segundos, considerar refetch
    if (disconnectionDuration > 5000) {
      updateReconnectionStatus(MODULE_KEY, 'reconciling');
      
      // Opcionalmente refetch datos modificados durante desconexión
      // Por ahora solo marcamos como reconciling y luego idle
      // En producción podrías implementar fetch incremental aquí
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateReconnectionStatus(MODULE_KEY, 'idle');
      console.log('✅ Reconciliation completed');
    } else {
      updateReconnectionStatus(MODULE_KEY, 'idle');
      console.log('✅ Reconnected (no reconciliation needed)');
    }
    
    // Resetear contador de intentos y timestamp
    resetReconnectionAttempts(MODULE_KEY);
    setDisconnectedAt(MODULE_KEY, null);
  }, [indexationState, updateReconnectionStatus, resetReconnectionAttempts, setDisconnectedAt]);
  
  // ============================================================================
  // INICIALIZACIÓN
  // ============================================================================
  
  // Esperar a que el store se hidrate desde IndexedDB
  const isStoreHydrated = useHydrationStore(state => state.isHydrated('inea'));
  
  useEffect(() => {
    if (isInitializedRef.current || !isStoreHydrated) return;
    
    const initialize = async () => {
      // Inicializar módulo en el store si no existe
      initializeModule(MODULE_KEY);
      
      // Verificar autenticación
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          console.warn('⚠️ Not authenticated, skipping indexation');
          return;
        }
        
        const sessionData = await response.json();
        if (!sessionData.isAuthenticated) {
          console.warn('⚠️ Not authenticated, skipping indexation');
          return;
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        return;
      }
      
      // Verificar si ya hay datos en IndexedDB (después de hidratación)
      const currentState = useIndexationStore.getState().modules[MODULE_KEY];
      const hasDataInIndexedDB = muebles.length > 0;
      const isAlreadyIndexed = currentState?.isIndexed && hasDataInIndexedDB;
      
      console.log('🔍 [INEA] Verificando estado de indexación:', {
        moduleKey: MODULE_KEY,
        isIndexed: currentState?.isIndexed,
        mueblesCount: muebles.length,
        hasDataInIndexedDB,
        isAlreadyIndexed,
        lastIndexedAt: currentState?.lastIndexedAt,
        isStoreHydrated,
      });
      
      if (isAlreadyIndexed) {
        console.log('✅ [INEA] Data found in IndexedDB, skipping indexation');
        // Marcar como indexado y solo conectar realtime
        completeIndexation(MODULE_KEY);
        await setupRealtimeSubscription();
      } else {
        console.log('⚠️ [INEA] No data in IndexedDB, starting full indexation');
        // Indexación completa
        await indexData();
      }
      
      isInitializedRef.current = true;
    };
    
    initialize();
    
    // Cleanup
    return () => {
      if (reconnectionTimeoutRef.current) {
        clearTimeout(reconnectionTimeoutRef.current);
      }
      // NO remover canal aquí para mantener conexión entre navegaciones
    };
  }, [initializeModule, indexData, setupRealtimeSubscription, completeIndexation, muebles.length, isStoreHydrated]);
  
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
