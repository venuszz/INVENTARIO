// ============================================================================
// NO LISTADO STORE
// ============================================================================
// Store de Zustand para gestionar los datos de muebles No Listado (tabla: mueblestlaxcala).
// Los datos se persisten en IndexedDB para mantenerlos entre sesiones sin llenar localStorage.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { indexedDBStorage } from '@/lib/indexedDBStorage';
import { useHydrationStore } from './hydrationStore';
import type { MuebleNoListado } from '@/types/indexation';

interface NoListadoStore {
  muebles: MuebleNoListado[];
  lastFetchedAt: string | null;
  syncingIds: string[]; // IDs of muebles being synced
  isSyncing: boolean; // Global syncing state
  setMuebles: (muebles: MuebleNoListado[]) => void;
  addMueble: (mueble: MuebleNoListado) => void;
  updateMueble: (id: string, updates: Partial<MuebleNoListado>) => void; // UUID
  updateMuebleBatch: (updates: MuebleNoListado[]) => void; // Batch update
  removeMueble: (id: string) => void; // UUID
  setSyncingIds: (ids: string[]) => void;
  removeSyncingIds: (ids: string[]) => void;
  clearSyncingIds: () => void;
  setIsSyncing: (syncing: boolean) => void;
  isCacheValid: (maxAgeMinutes?: number) => boolean;
  clearCache: () => void;
  getMuebleById: (id: string) => MuebleNoListado | undefined; // UUID
  isMuebleSyncing: (id: string) => boolean;
}

const DEFAULT_CACHE_DURATION_MINUTES = 30;

export const useNoListadoStore = create<NoListadoStore>()(
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
  
  updateMueble: (id, updates) => set((state) => ({
    muebles: state.muebles.map(m => {
      if (m.id === id) {
        // If updates is a complete MuebleNoListado object (has all required fields),
        // replace entirely. Otherwise, merge with existing.
        const isCompleteObject = 'id' in updates && 'id_inv' in updates;
        return isCompleteObject ? updates as MuebleNoListado : { ...m, ...updates };
      }
      return m;
    }),
    lastFetchedAt: new Date().toISOString(),
  })),
  
  updateMuebleBatch: (updates) => set((state) => {
    const updateMap = new Map(updates.map(u => [u.id, u]));
    return {
      muebles: state.muebles.map(m => updateMap.get(m.id) || m),
      lastFetchedAt: new Date().toISOString(),
    };
  }),
  
  removeMueble: (id) => set((state) => ({
    muebles: state.muebles.filter(m => m.id !== id),
    lastFetchedAt: new Date().toISOString(),
  })),
  
  setSyncingIds: (ids) => set((state) => {
    // Ensure both state.syncingIds and ids are arrays
    const currentIds = Array.isArray(state.syncingIds) ? state.syncingIds : [];
    const newIds = Array.isArray(ids) ? ids : [];
    
    // Create unique set and convert back to array
    const uniqueIds = Array.from(new Set([...currentIds, ...newIds]));
    
    return {
      syncingIds: uniqueIds,
    };
  }),
  
  removeSyncingIds: (ids) => set((state) => {
    // Ensure both are arrays
    const currentIds = Array.isArray(state.syncingIds) ? state.syncingIds : [];
    const idsToRemove = Array.isArray(ids) ? ids : [];
    
    return {
      syncingIds: currentIds.filter(id => !idsToRemove.includes(id)),
    };
  }),
  
  clearSyncingIds: () => set({
    syncingIds: [],
  }),
  
  setIsSyncing: (syncing) => set({ isSyncing: syncing }),
  
  isCacheValid: (maxAgeMinutes = DEFAULT_CACHE_DURATION_MINUTES) => {
    const { lastFetchedAt, muebles } = get();
    if (!lastFetchedAt || muebles.length === 0) return false;
    const ageMs = Date.now() - new Date(lastFetchedAt).getTime();
    return ageMs < maxAgeMinutes * 60 * 1000;
  },
  
  clearCache: () => set({ muebles: [], lastFetchedAt: null, syncingIds: [], isSyncing: false }),
  
  getMuebleById: (id) => get().muebles.find(m => m.id === id),
  
  isMuebleSyncing: (id) => {
    const ids = get().syncingIds;
    return Array.isArray(ids) ? ids.includes(id) : false;
  },
}),
    {
      name: 'nolistado-storage',
      storage: createJSONStorage(() => indexedDBStorage),
      // Exclude syncingIds and isSyncing from persistence (they're runtime-only state)
      partialize: (state) => ({
        muebles: state.muebles,
        lastFetchedAt: state.lastFetchedAt,
      }),
      onRehydrateStorage: () => (state) => {
        console.log('🔄 [NO_LISTADO Store] Hydration complete:', {
          mueblesCount: state?.muebles.length ?? 0,
        });
        // Ensure syncingIds is always an array after hydration
        if (state) {
          state.syncingIds = [];
          state.isSyncing = false;
        }
        useHydrationStore.getState().markAsHydrated('nolistado');
      },
    }
  )
);
