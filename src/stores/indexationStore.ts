// ============================================================================
// GLOBAL INDEXATION STORE
// ============================================================================
// Store global de Zustand que gestiona el estado de indexación para todos
// los módulos de la aplicación. Maneja progreso, errores, reconexión, etc.
// Persiste en IndexedDB para mantener el estado entre sesiones.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { indexedDBStorage } from '@/lib/indexedDBStorage';
import type { ModuleIndexationState, ReconnectionStatus } from '@/types/indexation';

// ============================================================================
// TIPOS
// ============================================================================

interface IndexationStore {
  // Estado por módulo
  modules: Record<string, ModuleIndexationState>;
  
  // Acciones de indexación
  startIndexation: (moduleKey: string) => void;
  updateProgress: (moduleKey: string, progress: number, stage: string) => void;
  completeIndexation: (moduleKey: string) => void;
  setError: (moduleKey: string, error: string) => void;
  
  // Acciones de conexión realtime
  updateRealtimeConnection: (moduleKey: string, connected: boolean) => void;
  updateLastEventReceived: (moduleKey: string) => void;
  
  // Acciones de reconexión
  updateReconnectionStatus: (moduleKey: string, status: ReconnectionStatus) => void;
  incrementReconnectionAttempts: (moduleKey: string) => void;
  resetReconnectionAttempts: (moduleKey: string) => void;
  setDisconnectedAt: (moduleKey: string, timestamp: string | null) => void;
  
  // Utilidades
  resetModule: (moduleKey: string) => void;
  initializeModule: (moduleKey: string) => void;
  reset: () => void; // Resetea completamente el store
}

// ============================================================================
// ESTADO INICIAL DE MÓDULO
// ============================================================================

const createInitialModuleState = (): ModuleIndexationState => ({
  isIndexed: false,
  isIndexing: false,
  progress: 0,
  currentStage: null,
  error: null,
  realtimeConnected: false,
  lastIndexedAt: null,
  lastEventReceivedAt: null,
  disconnectedAt: null,
  reconnectionAttempts: 0,
  reconnectionStatus: 'idle',
  maxReconnectionAttempts: 5,
});

// ============================================================================
// STORE
// ============================================================================

/**
 * Store global de indexación
 * 
 * Gestiona el estado de indexación para todos los módulos de la aplicación.
 * Usa persistencia selectiva: solo guarda datos esenciales en localStorage.
 * 
 * @example
 * ```typescript
 * const { startIndexation, updateProgress, completeIndexation } = useIndexationStore();
 * 
 * // Iniciar indexación
 * startIndexation('inea');
 * 
 * // Actualizar progreso
 * updateProgress('inea', 50, 'Cargando muebles');
 * 
 * // Completar
 * completeIndexation('inea');
 * ```
 */
export const useIndexationStore = create<IndexationStore>()(
  persist(
    (set, get) => ({
      modules: {},
      
      // ========================================================================
      // ACCIONES DE INDEXACIÓN
      // ========================================================================
      
      /**
       * Inicia el proceso de indexación para un módulo
       */
      startIndexation: (moduleKey) => {
        set((state) => {
          const currentModule = state.modules[moduleKey] || createInitialModuleState();
          
          return {
            modules: {
              ...state.modules,
              [moduleKey]: {
                ...currentModule,
                isIndexing: true,
                isIndexed: false,
                progress: 0,
                currentStage: null,
                error: null,
              }
            }
          };
        });
      },
      
      /**
       * Actualiza el progreso de indexación de un módulo
       */
      updateProgress: (moduleKey, progress, stage) => {
        set((state) => {
          const currentModule = state.modules[moduleKey] || createInitialModuleState();
          
          return {
            modules: {
              ...state.modules,
              [moduleKey]: {
                ...currentModule,
                progress: Math.min(100, Math.max(0, progress)), // Clamp entre 0-100
                currentStage: stage,
              }
            }
          };
        });
      },
      
      /**
       * Marca la indexación de un módulo como completada
       */
      completeIndexation: (moduleKey) => {
        set((state) => {
          const currentModule = state.modules[moduleKey] || createInitialModuleState();
          
          return {
            modules: {
              ...state.modules,
              [moduleKey]: {
                ...currentModule,
                isIndexing: false,
                isIndexed: true,
                progress: 100,
                currentStage: null,
                error: null,
                lastIndexedAt: new Date().toISOString(),
              }
            }
          };
        });
      },
      
      /**
       * Establece un error en la indexación de un módulo
       */
      setError: (moduleKey, error) => {
        set((state) => {
          const currentModule = state.modules[moduleKey] || createInitialModuleState();
          
          return {
            modules: {
              ...state.modules,
              [moduleKey]: {
                ...currentModule,
                isIndexing: false,
                error,
              }
            }
          };
        });
      },
      
      // ========================================================================
      // ACCIONES DE CONEXIÓN REALTIME
      // ========================================================================
      
      /**
       * Actualiza el estado de conexión realtime de un módulo
       */
      updateRealtimeConnection: (moduleKey, connected) => {
        set((state) => {
          const currentModule = state.modules[moduleKey] || createInitialModuleState();
          
          return {
            modules: {
              ...state.modules,
              [moduleKey]: {
                ...currentModule,
                realtimeConnected: connected,
              }
            }
          };
        });
      },
      
      /**
       * Actualiza el timestamp del último evento recibido
       */
      updateLastEventReceived: (moduleKey) => {
        set((state) => {
          const currentModule = state.modules[moduleKey] || createInitialModuleState();
          
          return {
            modules: {
              ...state.modules,
              [moduleKey]: {
                ...currentModule,
                lastEventReceivedAt: new Date().toISOString(),
              }
            }
          };
        });
      },
      
      // ========================================================================
      // ACCIONES DE RECONEXIÓN
      // ========================================================================
      
      /**
       * Actualiza el estado de reconexión de un módulo
       */
      updateReconnectionStatus: (moduleKey, status) => {
        set((state) => {
          const currentModule = state.modules[moduleKey] || createInitialModuleState();
          
          return {
            modules: {
              ...state.modules,
              [moduleKey]: {
                ...currentModule,
                reconnectionStatus: status,
              }
            }
          };
        });
      },
      
      /**
       * Incrementa el contador de intentos de reconexión
       */
      incrementReconnectionAttempts: (moduleKey) => {
        set((state) => {
          const currentModule = state.modules[moduleKey] || createInitialModuleState();
          
          return {
            modules: {
              ...state.modules,
              [moduleKey]: {
                ...currentModule,
                reconnectionAttempts: currentModule.reconnectionAttempts + 1,
              }
            }
          };
        });
      },
      
      /**
       * Resetea el contador de intentos de reconexión
       */
      resetReconnectionAttempts: (moduleKey) => {
        set((state) => {
          const currentModule = state.modules[moduleKey] || createInitialModuleState();
          
          return {
            modules: {
              ...state.modules,
              [moduleKey]: {
                ...currentModule,
                reconnectionAttempts: 0,
              }
            }
          };
        });
      },
      
      /**
       * Establece el timestamp de desconexión
       */
      setDisconnectedAt: (moduleKey, timestamp) => {
        set((state) => {
          const currentModule = state.modules[moduleKey] || createInitialModuleState();
          
          return {
            modules: {
              ...state.modules,
              [moduleKey]: {
                ...currentModule,
                disconnectedAt: timestamp || new Date().toISOString(),
              }
            }
          };
        });
      },
      
      // ========================================================================
      // UTILIDADES
      // ========================================================================
      
      /**
       * Resetea completamente el estado de un módulo
       */
      resetModule: (moduleKey) => {
        set((state) => ({
          modules: {
            ...state.modules,
            [moduleKey]: createInitialModuleState(),
          }
        }));
      },
      
      /**
       * Inicializa un módulo si no existe
       */
      initializeModule: (moduleKey) => {
        set((state) => {
          if (state.modules[moduleKey]) {
            return state; // Ya existe, no hacer nada
          }
          
          return {
            modules: {
              ...state.modules,
              [moduleKey]: createInitialModuleState(),
            }
          };
        });
      },
      
      /**
       * Resetea completamente el store (usado al hacer logout)
       */
      reset: () => {
        set({ modules: {} });
      },
    }),
    {
      name: 'indexation-storage',
      storage: createJSONStorage(() => indexedDBStorage),
      
      // ========================================================================
      // PERSISTENCIA SELECTIVA
      // ========================================================================
      // Solo persistir datos esenciales, no estados transitorios
      
      partialize: (state) => ({
        modules: Object.fromEntries(
          Object.entries(state.modules).map(([key, module]) => [
            key,
            {
              // Persistir solo estado de indexación
              isIndexed: module.isIndexed,
              lastIndexedAt: module.lastIndexedAt,
              lastEventReceivedAt: module.lastEventReceivedAt,
              
              // NO persistir estados transitorios
              isIndexing: false,
              progress: 0,
              currentStage: null,
              error: null,
              realtimeConnected: false,
              reconnectionStatus: 'idle' as ReconnectionStatus,
              reconnectionAttempts: 0,
              maxReconnectionAttempts: 5,
              disconnectedAt: null,
            },
          ])
        ),
      }),
    }
  )
);
