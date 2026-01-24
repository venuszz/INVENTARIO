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
  setMuebles: (muebles: MuebleNoListado[]) => void;
  addMueble: (mueble: MuebleNoListado) => void;
  updateMueble: (id: number, updates: Partial<MuebleNoListado>) => void;
  removeMueble: (id: number) => void;
  isCacheValid: (maxAgeMinutes?: number) => boolean;
  clearCache: () => void;
  getMuebleById: (id: number) => MuebleNoListado | undefined;
}

const DEFAULT_CACHE_DURATION_MINUTES = 30;

export const useNoListadoStore = create<NoListadoStore>()(
  persist(
    (set, get) => ({
  muebles: [],
  lastFetchedAt: null,
  
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
}),
    {
      name: 'nolistado-storage',
      storage: createJSONStorage(() => indexedDBStorage),
      onRehydrateStorage: () => (state) => {
        console.log('🔄 [NO_LISTADO Store] Hydration complete:', {
          mueblesCount: state?.muebles.length ?? 0,
        });
        useHydrationStore.getState().markAsHydrated('nolistado');
      },
    }
  )
);
