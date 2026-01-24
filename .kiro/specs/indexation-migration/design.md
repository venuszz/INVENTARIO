# Design Document: Indexation System Migration

## Overview

Este documento describe el diseño técnico para migrar el sistema de indexación actual basado en React Context API a una arquitectura moderna y robusta basada en Zustand. La nueva arquitectura proporcionará:

- **Gestión de estado centralizada** con Zustand stores
- **Indexación por etapas** con progreso calculado y pesos configurables
- **Retry automático** con exponential backoff para operaciones fallidas
- **Reconexión automática** con exponential backoff para WebSockets
- **Sincronización en tiempo real** mediante Supabase Realtime
- **Persistencia inteligente** con validación de caché
- **UI mejorada** con animaciones avanzadas usando Framer Motion
- **Event emitter pattern** para notificaciones reactivas

La migración se realizará de forma gradual, módulo por módulo, comenzando con INEA como piloto, para asegurar estabilidad y permitir rollback si es necesario.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      REACT COMPONENTS                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ IndexationPopover│  │ RealtimeIndicator│  │ Page Components│ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬───────┘ │
│           │                     │                     │          │
│           └─────────────────────┼─────────────────────┘          │
│                                 │                                │
└─────────────────────────────────┼────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CUSTOM HOOKS LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │useIneaIndex  │  │useIteaIndex  │  │useNoListadoIndex ... │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────────────┘  │
│         │                 │                  │                   │
│         └─────────────────┼──────────────────┘                   │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ZUSTAND STORES                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Global Indexation Store                        │   │
│  │  - Estado de indexación por módulo                       │   │
│  │  - Estado de conexión realtime                           │   │
│  │  - Manejo de reconexión                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │INEA Store│  │ITEA Store│  │NoListado │  │Resguardos... │   │
│  │          │  │          │  │Store     │  │              │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UTILITIES LAYER                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │Exponential       │  │Event Emitter     │  │Cache         │  │
│  │Backoff           │  │                  │  │Validation    │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Supabase Client                             │   │
│  │  - PostgreSQL Database                                   │   │
│  │  - Realtime WebSocket Channels                           │   │
│  │  - REST API                                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PERSISTENCE LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              localStorage                                │   │
│  │  - Module data (with timestamps)                         │   │
│  │  - Indexation state (selective)                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Component Mount** → Custom Hook → Verificar caché válido
2. **Caché válido** → Cargar desde localStorage → Conectar realtime
3. **Caché inválido** → Iniciar indexación → Guardar en stores → Persistir → Conectar realtime
4. **Evento realtime** → Handler → Actualizar store → Emitir evento → Actualizar UI
5. **Desconexión** → Detectar → Iniciar reconexión → Reconciliar datos

## Components and Interfaces

### 1. Type Definitions (src/types/indexation.ts)

```typescript
// Estado de reconexión
export type ReconnectionStatus = 'idle' | 'reconnecting' | 'reconciling' | 'failed';

// Tipo de evento de tiempo real
export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

// Etapa de indexación
export interface IndexationStage {
  key: string;
  label: string;
  weight: number; // Peso para calcular progreso (suma total = 100)
}

// Estado de indexación de un módulo
export interface ModuleIndexationState {
  isIndexed: boolean;
  isIndexing: boolean;
  progress: number; // 0-100
  currentStage: string | null;
  error: string | null;
  realtimeConnected: boolean;
  lastIndexedAt: string | null;
  lastEventReceivedAt: string | null;
  disconnectedAt: string | null;
  reconnectionAttempts: number;
  reconnectionStatus: ReconnectionStatus;
  maxReconnectionAttempts: number;
}

// Configuración de módulo
export interface ModuleConfig {
  key: string;
  name: string;
  table: string;
  stages: IndexationStage[];
  glowColor: string;
  icon: React.ComponentType;
}

// Callback de event emitter
export type EventCallback<T = any> = (data: T) => void;

// Configuración de exponential backoff
export interface ExponentialBackoffConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  multiplier: number;
}

// Datos de módulos (ejemplos)
export interface MuebleINEA {
  id: number;
  id_inv: string;
  rubro: string | null;
  descripcion: string | null;
  valor: string | null;
  // ... otros campos
}

export interface MuebleITEA {
  id: number;
  id_inv: string;
  rubro: string | null;
  descripcion: string | null;
  // ... otros campos
}

// ... tipos similares para otros módulos
```

### 2. Global Indexation Store (src/stores/indexationStore.ts)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModuleIndexationState, ReconnectionStatus } from '@/types/indexation';

interface IndexationStore {
  // Estado por módulo
  modules: Record<string, ModuleIndexationState>;
  
  // Acciones
  startIndexation: (moduleKey: string) => void;
  updateProgress: (moduleKey: string, progress: number, stage: string) => void;
  completeIndexation: (moduleKey: string) => void;
  setError: (moduleKey: string, error: string) => void;
  updateRealtimeConnection: (moduleKey: string, connected: boolean) => void;
  updateReconnectionStatus: (moduleKey: string, status: ReconnectionStatus) => void;
  incrementReconnectionAttempts: (moduleKey: string) => void;
  resetReconnectionAttempts: (moduleKey: string) => void;
  setDisconnectedAt: (moduleKey: string, timestamp: string | null) => void;
  updateLastEventReceived: (moduleKey: string) => void;
  resetModule: (moduleKey: string) => void;
}

export const useIndexationStore = create<IndexationStore>()(
  persist(
    (set) => ({
      modules: {},
      
      startIndexation: (moduleKey) => set((state) => ({
        modules: {
          ...state.modules,
          [moduleKey]: {
            ...state.modules[moduleKey],
            isIndexing: true,
            isIndexed: false,
            progress: 0,
            currentStage: null,
            error: null,
          }
        }
      })),
      
      updateProgress: (moduleKey, progress, stage) => set((state) => ({
        modules: {
          ...state.modules,
          [moduleKey]: {
            ...state.modules[moduleKey],
            progress,
            currentStage: stage,
          }
        }
      })),
      
      completeIndexation: (moduleKey) => set((state) => ({
        modules: {
          ...state.modules,
          [moduleKey]: {
            ...state.modules[moduleKey],
            isIndexing: false,
            isIndexed: true,
            progress: 100,
            currentStage: null,
            lastIndexedAt: new Date().toISOString(),
          }
        }
      })),
      
      // ... otras acciones
    }),
    {
      name: 'indexation-storage',
      // Persistencia selectiva: solo datos esenciales
      partialize: (state) => ({
        modules: Object.fromEntries(
          Object.entries(state.modules).map(([key, module]) => [
            key,
            {
              isIndexed: module.isIndexed,
              lastIndexedAt: module.lastIndexedAt,
              lastEventReceivedAt: module.lastEventReceivedAt,
            }
          ])
        )
      })
    }
  )
);
```

### 3. Module Store Example (src/stores/ineaStore.ts)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MuebleINEA } from '@/types/indexation';

interface IneaStore {
  muebles: MuebleINEA[];
  lastFetchedAt: string | null;
  
  // Acciones
  setMuebles: (muebles: MuebleINEA[]) => void;
  addMueble: (mueble: MuebleINEA) => void;
  updateMueble: (id: number, mueble: Partial<MuebleINEA>) => void;
  removeMueble: (id: number) => void;
  isCacheValid: (maxAgeMinutes?: number) => boolean;
  clearCache: () => void;
}

export const useIneaStore = create<IneaStore>()(
  persist(
    (set, get) => ({
      muebles: [],
      lastFetchedAt: null,
      
      setMuebles: (muebles) => set({
        muebles,
        lastFetchedAt: new Date().toISOString()
      }),
      
      addMueble: (mueble) => set((state) => ({
        muebles: [...state.muebles, mueble],
        lastFetchedAt: new Date().toISOString()
      })),
      
      updateMueble: (id, updates) => set((state) => ({
        muebles: state.muebles.map(m => 
          m.id === id ? { ...m, ...updates } : m
        ),
        lastFetchedAt: new Date().toISOString()
      })),
      
      removeMueble: (id) => set((state) => ({
        muebles: state.muebles.filter(m => m.id !== id),
        lastFetchedAt: new Date().toISOString()
      })),
      
      isCacheValid: (maxAgeMinutes = 30) => {
        const { lastFetchedAt } = get();
        if (!lastFetchedAt) return false;
        
        const ageMs = Date.now() - new Date(lastFetchedAt).getTime();
        const maxAgeMs = maxAgeMinutes * 60 * 1000;
        
        return ageMs < maxAgeMs;
      },
      
      clearCache: () => set({
        muebles: [],
        lastFetchedAt: null
      })
    }),
    {
      name: 'inea-storage'
    }
  )
);
```

### 4. Exponential Backoff Utility (src/lib/indexation/exponentialBackoff.ts)

```typescript
import type { ExponentialBackoffConfig } from '@/types/indexation';

export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  config: ExponentialBackoffConfig
): Promise<T> {
  const { maxAttempts, baseDelay, maxDelay, multiplier } = config;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Si es el último intento, lanzar error
      if (attempt === maxAttempts - 1) {
        throw lastError;
      }
      
      // Calcular delay con exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(multiplier, attempt),
        maxDelay
      );
      
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
```

### 5. Event Emitter Utility (src/lib/indexation/eventEmitter.ts)

```typescript
import type { EventCallback } from '@/types/indexation';

class EventEmitter<T = any> {
  private listeners = new Set<EventCallback<T>>();
  
  subscribe(callback: EventCallback<T>): () => void {
    this.listeners.add(callback);
    
    // Retornar función de cleanup
    return () => {
      this.listeners.delete(callback);
    };
  }
  
  emit(data: T): void {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }
  
  clear(): void {
    this.listeners.clear();
  }
}

// Crear emitters por módulo
export const ineaEmitter = new EventEmitter();
export const iteaEmitter = new EventEmitter();
export const noListadoEmitter = new EventEmitter();
export const resguardosEmitter = new EventEmitter();
// ... otros emitters
```

### 6. Custom Hook Example (src/hooks/indexation/useIneaIndexation.ts)

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { useIndexationStore } from '@/stores/indexationStore';
import { useIneaStore } from '@/stores/ineaStore';
import { withExponentialBackoff } from '@/lib/indexation/exponentialBackoff';
import { ineaEmitter } from '@/lib/indexation/eventEmitter';
import supabase from '@/app/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

const MODULE_KEY = 'inea';

const STAGES = [
  { key: 'fetch_muebles', label: 'Cargando muebles', weight: 90 },
  { key: 'setup_realtime', label: 'Configurando tiempo real', weight: 10 },
];

export function useIneaIndexation() {
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
  } = useIndexationStore();
  
  const {
    muebles,
    setMuebles,
    addMueble,
    updateMueble,
    removeMueble,
    isCacheValid,
  } = useIneaStore();
  
  const isIndexingRef = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Función de indexación por etapas
  const indexData = useCallback(async () => {
    if (isIndexingRef.current) return;
    isIndexingRef.current = true;
    
    try {
      startIndexation(MODULE_KEY);
      
      let accumulatedProgress = 0;
      
      // Etapa 1: Fetch muebles
      const stage1 = STAGES[0];
      updateProgress(MODULE_KEY, accumulatedProgress, stage1.label);
      
      const fetchedMuebles = await withExponentialBackoff(
        async () => {
          const { data, error } = await supabase
            .from('muebles')
            .select('*')
            .neq('estatus', 'BAJA');
          
          if (error) throw error;
          return data;
        },
        {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          multiplier: 2,
        }
      );
      
      setMuebles(fetchedMuebles);
      accumulatedProgress += stage1.weight;
      updateProgress(MODULE_KEY, accumulatedProgress, stage1.label);
      
      // Etapa 2: Setup realtime
      const stage2 = STAGES[1];
      updateProgress(MODULE_KEY, accumulatedProgress, stage2.label);
      
      await setupRealtimeSubscription();
      
      accumulatedProgress += stage2.weight;
      updateProgress(MODULE_KEY, accumulatedProgress, stage2.label);
      
      // Completar
      completeIndexation(MODULE_KEY);
      
    } catch (error) {
      console.error('Error indexing INEA:', error);
      setError(MODULE_KEY, 'Error al indexar datos');
    } finally {
      isIndexingRef.current = false;
    }
  }, []);
  
  // Configurar suscripción de tiempo real
  const setupRealtimeSubscription = useCallback(async () => {
    // Remover canal anterior si existe
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
    }
    
    const channel = supabase
      .channel('muebles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'muebles',
        },
        async (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          updateLastEventReceived(MODULE_KEY);
          
          switch (eventType) {
            case 'INSERT':
              // Delay para permitir que triggers se completen
              await new Promise(resolve => setTimeout(resolve, 300));
              
              // Refetch registro completo
              const { data: insertedData } = await supabase
                .from('muebles')
                .select('*')
                .eq('id', newRecord.id)
                .single();
              
              if (insertedData && insertedData.estatus !== 'BAJA') {
                addMueble(insertedData);
                ineaEmitter.emit({ type: 'INSERT', data: insertedData });
              }
              break;
              
            case 'UPDATE':
              // Refetch registro completo
              const { data: updatedData } = await supabase
                .from('muebles')
                .select('*')
                .eq('id', newRecord.id)
                .single();
              
              if (updatedData) {
                if (updatedData.estatus === 'BAJA') {
                  removeMueble(updatedData.id);
                } else {
                  updateMueble(updatedData.id, updatedData);
                }
                ineaEmitter.emit({ type: 'UPDATE', data: updatedData });
              }
              break;
              
            case 'DELETE':
              removeMueble(oldRecord.id);
              ineaEmitter.emit({ type: 'DELETE', data: oldRecord });
              break;
          }
        }
      )
      .on('system', {}, (payload) => {
        const { status } = payload;
        const wasConnected = indexationState?.realtimeConnected;
        const isConnected = status === 'SUBSCRIBED';
        
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
      .subscribe();
    
    channelRef.current = channel;
  }, [indexationState?.realtimeConnected]);
  
  // Manejar reconexión automática
  const handleReconnection = useCallback(async () => {
    const state = indexationState;
    if (!state) return;
    
    // Verificar si se alcanzó el límite
    if (state.reconnectionAttempts >= state.maxReconnectionAttempts) {
      updateReconnectionStatus(MODULE_KEY, 'failed');
      return;
    }
    
    updateReconnectionStatus(MODULE_KEY, 'reconnecting');
    
    // Calcular delay con exponential backoff
    const delay = Math.min(
      2000 * Math.pow(2, state.reconnectionAttempts),
      30000
    );
    
    console.log(`Reconnecting INEA in ${delay}ms (attempt ${state.reconnectionAttempts + 1}/${state.maxReconnectionAttempts})`);
    
    // Programar reconexión
    reconnectionTimeoutRef.current = setTimeout(async () => {
      incrementReconnectionAttempts(MODULE_KEY);
      await setupRealtimeSubscription();
    }, delay);
  }, [indexationState]);
  
  // Manejar reconciliación de datos
  const handleReconciliation = useCallback(async () => {
    const state = indexationState;
    if (!state || !state.disconnectedAt) return;
    
    // Calcular duración de desconexión
    const disconnectionDuration = Date.now() - new Date(state.disconnectedAt).getTime();
    
    // Si estuvo desconectado más de 5 segundos, reconciliar
    if (disconnectionDuration > 5000) {
      updateReconnectionStatus(MODULE_KEY, 'reconciling');
      
      // Refetch datos (opcional, dependiendo de la lógica de negocio)
      // await indexData();
      
      updateReconnectionStatus(MODULE_KEY, 'idle');
    } else {
      updateReconnectionStatus(MODULE_KEY, 'idle');
    }
    
    // Resetear contador de intentos
    resetReconnectionAttempts(MODULE_KEY);
    setDisconnectedAt(MODULE_KEY, null);
  }, [indexationState]);
  
  // Inicializar al montar
  useEffect(() => {
    const initialize = async () => {
      // Verificar caché válido
      if (isCacheValid(30)) {
        // Solo conectar realtime
        await setupRealtimeSubscription();
      } else {
        // Indexación completa
        await indexData();
      }
    };
    
    initialize();
    
    // Cleanup
    return () => {
      if (reconnectionTimeoutRef.current) {
        clearTimeout(reconnectionTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    // Estados
    isIndexing: indexationState?.isIndexing ?? false,
    isIndexed: indexationState?.isIndexed ?? false,
    progress: indexationState?.progress ?? 0,
    currentStage: indexationState?.currentStage ?? null,
    error: indexationState?.error ?? null,
    realtimeConnected: indexationState?.realtimeConnected ?? false,
    reconnectionStatus: indexationState?.reconnectionStatus ?? 'idle',
    reconnectionAttempts: indexationState?.reconnectionAttempts ?? 0,
    
    // Datos
    muebles,
    
    // Funciones
    reindex: indexData,
  };
}
```

### 7. IndexationPopover Component (src/components/IndexationPopover.tsx)

El componente será refactorizado para usar los nuevos hooks y mostrar los 7 estados visuales descritos en la arquitectura:

1. Estado de indexación (cargando)
2. Estado indexado (éxito con contadores)
3. Estado de reconexión
4. Estado de error de conexión
5. Estado de error de indexación
6. Notificación de sincronización en tiempo real
7. Animación de éxito (partículas)

```typescript
import { motion, AnimatePresence } from 'framer-motion';
import { useIneaIndexation } from '@/hooks/indexation/useIneaIndexation';
// ... otros hooks
import { Check, Loader2, AlertTriangle, WifiOff, Zap, RefreshCw } from 'lucide-react';

export default function IndexationPopover() {
  // Estados de todos los módulos
  const ineaState = useIneaIndexation();
  const iteaState = useIteaIndexation();
  // ... otros módulos
  
  // Lógica de visualización según estados
  // Implementar los 7 estados visuales con Framer Motion
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 right-6 z-50"
    >
      {/* Contenido del popover con estados visuales */}
    </motion.div>
  );
}
```

### 8. RealtimeIndicator Component (src/components/RealtimeIndicator.tsx)

Componente minimalista para mostrar estado de conexión en el topbar:

```typescript
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';

interface RealtimeIndicatorProps {
  variant?: 'minimal' | 'default' | 'detailed';
  isConnected: boolean;
}

export default function RealtimeIndicator({ 
  variant = 'default', 
  isConnected 
}: RealtimeIndicatorProps) {
  // Implementar 3 variantes visuales
  
  return (
    <div className="flex items-center gap-2">
      {/* Contenido según variante */}
    </div>
  );
}
```

## Data Models

### Module Configuration

Cada módulo tendrá una configuración que define:

```typescript
export const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  inea: {
    key: 'inea',
    name: 'INEA',
    table: 'muebles',
    stages: [
      { key: 'fetch_muebles', label: 'Cargando muebles', weight: 90 },
      { key: 'setup_realtime', label: 'Configurando tiempo real', weight: 10 },
    ],
    glowColor: '#3b82f6',
    icon: Database,
  },
  itea: {
    key: 'itea',
    name: 'ITEA',
    table: 'mueblestlax',
    stages: [
      { key: 'fetch_muebles', label: 'Cargando muebles', weight: 90 },
      { key: 'setup_realtime', label: 'Configurando tiempo real', weight: 10 },
    ],
    glowColor: '#10b981',
    icon: Database,
  },
  // ... otros módulos
};
```

### Persistence Strategy

**Datos a persistir en localStorage:**
- Datos de módulos (arrays completos)
- Timestamps de última actualización
- Estado de indexación completada

**Datos NO persistir:**
- Progreso actual
- Estado de indexación en curso
- Errores
- Estado de reconexión
- Estado de conexión realtime

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas del sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre especificaciones legibles por humanos y garantías de correctitud verificables por máquinas.*

### Property Reflection

Después de analizar los acceptance criteria, he identificado las siguientes propiedades testables. Algunas propiedades redundantes han sido consolidadas:

- **Propiedades 3.9 y 3.10** (persistencia selectiva) se combinan en una sola propiedad que verifica qué se persiste y qué no
- **Propiedades de exponential backoff** (7.2, 7.5, 8.5, 11.5) se consolidan en una propiedad general sobre el cálculo correcto
- **Propiedades de eventos de tiempo real** (8.3, 8.4, 8.5) se mantienen separadas porque validan comportamientos distintos

### Correctness Properties

Property 1: Iniciar indexación actualiza estado
*For any* módulo, cuando se inicia indexación, el estado isIndexing debe ser true y progress debe ser 0
**Validates: Requirements 3.2**

Property 2: Cálculo de progreso basado en pesos
*For any* conjunto de etapas con pesos que sumen 100, el progreso calculado después de completar N etapas debe ser igual a la suma de los pesos de esas N etapas
**Validates: Requirements 3.3, 6.3**

Property 3: Completar indexación actualiza estado
*For any* módulo, cuando se completa indexación, isIndexed debe ser true, isIndexing debe ser false, y progress debe ser 100
**Validates: Requirements 3.4**

Property 4: Almacenamiento de errores
*For any* módulo y mensaje de error, cuando se establece un error, el estado error del módulo debe contener ese mensaje
**Validates: Requirements 3.5**

Property 5: Persistencia selectiva
*For any* estado de módulo persistido en localStorage, solo deben estar presentes los campos isIndexed, lastIndexedAt y lastEventReceivedAt, y NO deben estar presentes progress, isIndexing, error, reconnectionStatus ni realtimeConnected
**Validates: Requirements 3.9, 3.10, 16.1-16.9**

Property 6: Timestamp de actualización en stores
*For any* operación de modificación de datos en un Module_Store (agregar, actualizar, eliminar), el campo lastFetchedAt debe actualizarse con un timestamp reciente
**Validates: Requirements 4.8**

Property 7: Persistencia de datos en localStorage
*For any* datos almacenados en un Module_Store, esos datos deben estar presentes en localStorage bajo la clave correspondiente
**Validates: Requirements 4.10**

Property 8: Cálculo de tiempo transcurrido
*For any* timestamp válido en el pasado, el tiempo transcurrido calculado debe ser igual a la diferencia entre el tiempo actual y ese timestamp
**Validates: Requirements 5.2**

Property 9: Validación de caché por antigüedad
*For any* timestamp con más de 30 minutos de antigüedad, la función isCacheValid debe retornar false; para timestamps con menos de 30 minutos, debe retornar true
**Validates: Requirements 5.3**

Property 10: Suma de pesos de etapas
*For any* configuración de módulo, la suma de los pesos de todas sus etapas debe ser exactamente 100
**Validates: Requirements 6.4**

Property 11: Número de reintentos
*For any* operación que falla consistentemente, el sistema debe realizar exactamente 3 intentos antes de reportar error final
**Validates: Requirements 7.1**

Property 12: Exponential backoff correcto
*For any* intento N de una operación con configuración de exponential backoff (baseDelay, multiplier, maxDelay), el delay calculado debe ser min(baseDelay * (multiplier ^ N), maxDelay)
**Validates: Requirements 7.2, 7.5, 8.5, 11.5**

Property 13: Evento INSERT agrega registro
*For any* evento INSERT de tiempo real con un registro válido, ese registro debe aparecer en el store del módulo correspondiente
**Validates: Requirements 8.3**

Property 14: Evento UPDATE actualiza registro
*For any* evento UPDATE de tiempo real con un registro válido, el registro correspondiente en el store debe actualizarse con los nuevos datos
**Validates: Requirements 8.4**

Property 15: Evento DELETE remueve registro
*For any* evento DELETE de tiempo real con un ID válido, el registro con ese ID debe ser removido del store del módulo correspondiente
**Validates: Requirements 8.5**

Property 16: Timestamp de desconexión
*For any* desconexión detectada, el campo disconnectedAt del módulo debe contener un timestamp válido del momento de la desconexión
**Validates: Requirements 8.2**

Property 17: Número de intentos de reconexión
*For any* desconexión, el sistema debe realizar hasta 5 intentos de reconexión antes de marcar el estado como "failed"
**Validates: Requirements 8.4**

Property 18: Reconciliación después de desconexión larga
*For any* reconexión exitosa después de una desconexión de más de 5 segundos, el sistema debe iniciar el proceso de reconciliación (reconnectionStatus = "reconciling")
**Validates: Requirements 9.2**

Property 19: Event emitter retorna cleanup
*For any* listener registrado en un event emitter, la función de registro debe retornar una función de cleanup que, al ejecutarse, remueva el listener
**Validates: Requirements 10.3**

Property 20: Event emitter notifica a todos los listeners
*For any* evento emitido y conjunto de listeners registrados, todos los listeners deben ser invocados con los datos del evento
**Validates: Requirements 10.4**

## Error Handling

### Estrategia General

El sistema implementa múltiples capas de manejo de errores:

1. **Retry automático con exponential backoff**: Operaciones de red fallan temporalmente
2. **Reconexión automática**: Pérdida de conexión WebSocket
3. **Reconciliación de datos**: Sincronización después de desconexión larga
4. **Feedback visual**: Errores mostrados claramente en UI
5. **Logging**: Errores registrados para debugging

### Tipos de Errores

**Errores de Indexación**:
- Fallo en fetch de datos → Retry automático (3 intentos)
- Fallo después de reintentos → Mostrar error en UI con botón de retry manual
- Error de parsing de datos → Reportar error y detener indexación

**Errores de Conexión**:
- Pérdida de conexión WebSocket → Reconexión automática (5 intentos)
- Fallo de reconexión → Mostrar indicador de desconexión con opción de reindexar
- Timeout de conexión → Incrementar delay y reintentar

**Errores de Persistencia**:
- Fallo al guardar en localStorage → Log error pero continuar operación
- localStorage lleno → Limpiar datos antiguos y reintentar
- Datos corruptos en caché → Invalidar caché e iniciar indexación completa

### Recuperación

**Estrategias de recuperación**:
1. Retry automático para errores transitorios
2. Fallback a indexación completa si caché falla
3. Reconexión automática para WebSockets
4. Botones de retry manual en UI para errores persistentes
5. Opción de limpiar caché y reindexar desde cero

## Testing Strategy

### Dual Testing Approach

El sistema utilizará tanto unit tests como property-based tests para asegurar correctitud completa:

**Unit Tests**:
- Casos específicos de uso
- Edge cases (caché vacío, datos corruptos, etc.)
- Integración entre componentes
- Comportamiento de UI (snapshots, interacciones)

**Property-Based Tests**:
- Propiedades universales (las 20 propiedades definidas arriba)
- Generación de datos aleatorios para cada test
- Mínimo 100 iteraciones por propiedad
- Cada test debe referenciar su propiedad en el diseño

### Configuración de Property Tests

```typescript
// Ejemplo de configuración
import { fc } from 'fast-check';

describe('Property 2: Cálculo de progreso basado en pesos', () => {
  it('Feature: indexation-migration, Property 2: Progress calculation based on stage weights', () => {
    fc.assert(
      fc.property(
        // Generador de etapas con pesos que sumen 100
        fc.array(fc.record({
          key: fc.string(),
          label: fc.string(),
          weight: fc.integer({ min: 1, max: 100 })
        }), { minLength: 1, maxLength: 10 })
          .filter(stages => {
            const sum = stages.reduce((acc, s) => acc + s.weight, 0);
            return sum === 100;
          }),
        (stages) => {
          // Test de la propiedad
          const completedStages = stages.slice(0, Math.floor(stages.length / 2));
          const expectedProgress = completedStages.reduce((acc, s) => acc + s.weight, 0);
          const actualProgress = calculateProgress(stages, completedStages);
          
          expect(actualProgress).toBe(expectedProgress);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Librería de Property Testing

Para TypeScript/JavaScript, utilizaremos **fast-check**:
- Generación automática de datos de prueba
- Shrinking automático para encontrar casos mínimos que fallan
- Integración con Jest/Vitest
- Soporte para generadores personalizados

### Cobertura de Tests

**Stores**:
- Unit tests para cada acción del store
- Property tests para invariantes (persistencia, timestamps, etc.)
- Tests de integración con localStorage

**Hooks**:
- Unit tests para flujos principales (indexación, reconexión)
- Property tests para comportamiento de retry y exponential backoff
- Tests de integración con Supabase (mocked)

**Componentes UI**:
- Unit tests para renderizado de estados
- Snapshot tests para regresión visual
- Tests de interacción (clicks, hovers)
- Tests de animaciones (Framer Motion)

**Utilidades**:
- Property tests para exponential backoff
- Property tests para event emitter
- Unit tests para casos edge

### Simulación de Condiciones

**Desconexiones**:
```typescript
// Simular desconexión
const mockChannel = {
  subscribe: jest.fn(),
  on: jest.fn((event, config, callback) => {
    if (event === 'system') {
      // Simular desconexión después de 1 segundo
      setTimeout(() => {
        callback({ status: 'CHANNEL_ERROR' });
      }, 1000);
    }
  })
};
```

**Eventos de Tiempo Real**:
```typescript
// Simular evento INSERT
const mockInsertEvent = {
  eventType: 'INSERT',
  new: { id: 1, descripcion: 'Test' },
  old: null
};

// Trigger callback
realtimeCallback(mockInsertEvent);
```

**Fallos de Red**:
```typescript
// Simular fallo de fetch
jest.spyOn(supabase, 'from').mockImplementation(() => ({
  select: jest.fn().mockRejectedValue(new Error('Network error'))
}));
```

