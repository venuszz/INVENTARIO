// ============================================================================
// ITEA STORE
// ============================================================================
// Store de Zustand para gestionar los datos de muebles ITEA (tabla: mueblesitea).
// Los datos se persisten en IndexedDB para mantenerlos entre sesiones sin llenar localStorage.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { indexedDBStorage } from '@/lib/indexedDBStorage';
import { useHydrationStore } from './hydrationStore';
import type { MuebleITEA } from '@/types/indexation';

interface IteaStore {
  muebles: MuebleITEA[];
  lastFetchedAt: string | null;
  syncingIds: string[];
  isSyncing: boolean;
  setMuebles: (muebles: MuebleITEA[]) => void;
  addMueble: (mueble: MuebleITEA) => void;
  updateMueble: (id: string, updates: Partial<MuebleITEA>) => void; // UUID
  updateMuebleBatch: (muebles: MuebleITEA[]) => void;
  removeMueble: (id: string) => void; // UUID
  isCacheValid: (maxAgeMinutes?: number) => boolean;
  clearCache: () => void;
  getMuebleById: (id: string) => MuebleITEA | undefined; // UUID
  setSyncingIds: (ids: string[]) => void;
  removeSyncingIds: (ids: string[]) => void;
  clearSyncingIds: () => void;
  setIsSyncing: (isSyncing: boolean) => void;
}

const DEFAULT_CACHE_DURATION_MINUTES = 30;

export const useIteaStore = create<IteaStore>()(
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
    muebles: state.muebles.map(m => m.id === id ? { ...m, ...updates } : m),
    lastFetchedAt: new Date().toISOString(),
  })),
  
  updateMuebleBatch: (muebles) => set((state) => {
    const mueblesMap = new Map(muebles.map(m => [m.id, m]));
    return {
      muebles: state.muebles.map(m => mueblesMap.get(m.id) || m),
      lastFetchedAt: new Date().toISOString(),
    };
  }),
  
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
  
  setSyncingIds: (ids) => set((state) => ({
    syncingIds: [...new Set([...state.syncingIds, ...ids])]
  })),
  
  removeSyncingIds: (ids) => set((state) => ({
    syncingIds: state.syncingIds.filter(id => !ids.includes(id))
  })),
  
  clearSyncingIds: () => set({ syncingIds: [] }),
  
  setIsSyncing: (isSyncing) => set({ isSyncing }),
}),
    {
      name: 'itea-storage',
      storage: createJSONStorage(() => indexedDBStorage),
      // Exclude syncingIds and isSyncing from persistence (they're runtime-only state)
      partialize: (state) => ({
        muebles: state.muebles,
        lastFetchedAt: state.lastFetchedAt,
      }),
      onRehydrateStorage: () => (state) => {
        console.log('🔄 [ITEA Store] Hydration complete:', {
          mueblesCount: state?.muebles.length ?? 0,
        });
        // Ensure syncingIds is always an array after hydration
        if (state) {
          state.syncingIds = [];
          state.isSyncing = false;
        }
        useHydrationStore.getState().markAsHydrated('itea');
      },
    }
  )
);
