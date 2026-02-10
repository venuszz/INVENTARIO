import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { indexedDBStorage } from '@/lib/indexedDBStorage';
import { useHydrationStore } from './hydrationStore';
import type { MuebleINEA } from '@/types/indexation';

/**
 * Store de Zustand para gestionar los datos de muebles INEA
 * Los datos se persisten en IndexedDB para mantenerlos entre sesiones
 */
interface IneaStore {
  /** Array de muebles INEA */
  muebles: MuebleINEA[];
  
  /** Timestamp de la última actualización */
  lastFetchedAt: string | null;
  
  /** Array de IDs de muebles que están siendo sincronizados */
  syncingIds: string[];
  
  /** Indica si hay alguna sincronización en progreso */
  isSyncing: boolean;
  
  /** Establece todos los muebles */
  setMuebles: (muebles: MuebleINEA[]) => void;
  
  /** Agrega un mueble */
  addMueble: (mueble: MuebleINEA) => void;
  
  /** Actualiza un mueble por ID */
  updateMueble: (mueble: MuebleINEA) => void;
  
  /** Remueve un mueble por ID */
  removeMueble: (id: string) => void;
  
  /** Verifica si el caché es válido */
  isCacheValid: (maxAgeMinutes?: number) => boolean;
  
  /** Limpia el caché */
  clearCache: () => void;
  
  /** Obtiene un mueble por ID */
  getMuebleById: (id: string) => MuebleINEA | undefined;
  
  /** Agrega un ID a la lista de sincronización */
  addSyncingId: (id: string) => void;
  
  /** Remueve un ID de la lista de sincronización */
  removeSyncingId: (id: string) => void;
  
  /** Establece el estado general de sincronización */
  setSyncing: (syncing: boolean) => void;
  
  /** Actualiza múltiples muebles en batch */
  updateMuebleBatch: (muebles: MuebleINEA[]) => void;
  
  /** Establece múltiples IDs como sincronizando */
  setSyncingIds: (ids: string[]) => void;
  
  /** Remueve múltiples IDs de sincronización */
  removeSyncingIds: (ids: string[]) => void;
  
  /** Limpia todos los IDs de sincronización */
  clearSyncingIds: () => void;
  
  /** Establece el estado general de sincronización */
  setIsSyncing: (syncing: boolean) => void;
}

const DEFAULT_CACHE_DURATION_MINUTES = 30;

export const useIneaStore = create<IneaStore>()(
  persist(
    (set, get) => ({
      muebles: [],
      lastFetchedAt: null,
      syncingIds: [],
      isSyncing: false,
      
      setMuebles: (muebles) => set({
        muebles,
        lastFetchedAt: new Date().toISOString(),
      }),
      
      addMueble: (mueble) => set((state) => ({
        muebles: [...state.muebles, mueble],
        lastFetchedAt: new Date().toISOString(),
      })),
      
      updateMueble: (mueble) => set((state) => ({
        muebles: state.muebles.map(m => m.id === mueble.id ? mueble : m),
        lastFetchedAt: new Date().toISOString(),
      })),
      
      removeMueble: (id) => set((state) => ({
        muebles: state.muebles.filter(m => m.id !== id),
        lastFetchedAt: new Date().toISOString(),
      })),
      
      isCacheValid: (maxAgeMinutes = DEFAULT_CACHE_DURATION_MINUTES) => {
        const { lastFetchedAt, muebles } = get();
        if (!lastFetchedAt || muebles.length === 0) return false;
        const ageMs = Date.now() - new Date(lastFetchedAt).getTime();
        return ageMs < maxAgeMinutes * 60 * 1000;
      },
      
      clearCache: () => set({ muebles: [], lastFetchedAt: null }),
      
      getMuebleById: (id) => get().muebles.find(m => m.id === id),
      
      addSyncingId: (id) => set((state) => ({
        syncingIds: [...state.syncingIds, id],
        isSyncing: true
      })),
      
      removeSyncingId: (id) => set((state) => {
        const newIds = state.syncingIds.filter(i => i !== id);
        return {
          syncingIds: newIds,
          isSyncing: newIds.length > 0
        };
      }),
      
      setSyncing: (syncing) => set({ isSyncing: syncing }),
      
      updateMuebleBatch: (muebles) => set((state) => {
        const mueblesMap = new Map(state.muebles.map(m => [m.id, m]));
        muebles.forEach(mueble => {
          mueblesMap.set(mueble.id, mueble);
        });
        return {
          muebles: Array.from(mueblesMap.values()),
          lastFetchedAt: new Date().toISOString(),
        };
      }),
      
      setSyncingIds: (ids) => set({
        syncingIds: ids,
        isSyncing: ids.length > 0
      }),
      
      removeSyncingIds: (ids) => set((state) => {
        const newIds = state.syncingIds.filter(id => !ids.includes(id));
        return {
          syncingIds: newIds,
          isSyncing: newIds.length > 0
        };
      }),
      
      clearSyncingIds: () => set({
        syncingIds: [],
        isSyncing: false
      }),
      
      setIsSyncing: (syncing) => set({ isSyncing: syncing })
    }),
    {
      name: 'inea-storage',
      storage: createJSONStorage(() => indexedDBStorage),
      onRehydrateStorage: () => (state) => {
        useHydrationStore.getState().markAsHydrated('inea');
      },
    }
  )
);
