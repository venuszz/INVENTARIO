// ============================================================================
// RESGUARDOS STORE
// ============================================================================
// Store de Zustand para gestionar los datos de resguardos (tabla: resguardos).
// Los datos se persisten en IndexedDB para mantenerlos entre sesiones sin llenar localStorage.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { indexedDBStorage } from '@/lib/indexedDBStorage';
import { useHydrationStore } from './hydrationStore';
import type { Resguardo } from '@/types/indexation';

interface ResguardosStore {
  resguardos: Resguardo[];
  lastFetchedAt: string | null;
  setResguardos: (resguardos: Resguardo[]) => void;
  addResguardo: (resguardo: Resguardo) => void;
  updateResguardo: (id: string, updates: Partial<Resguardo>) => void; // UUID
  removeResguardo: (id: string) => void; // UUID
  isCacheValid: (maxAgeMinutes?: number) => boolean;
  clearCache: () => void;
  getResguardoById: (id: string) => Resguardo | undefined; // UUID
}

const DEFAULT_CACHE_DURATION_MINUTES = 30;

export const useResguardosStore = create<ResguardosStore>()(
  persist(
    (set, get) => ({
  resguardos: [],
  lastFetchedAt: null,
  
  setResguardos: (resguardos) => set({
    resguardos,
    lastFetchedAt: new Date().toISOString(),
  }),
  
  addResguardo: (resguardo) => set((state) => ({
    resguardos: [...state.resguardos, resguardo],
    lastFetchedAt: new Date().toISOString(),
  })),
  
  updateResguardo: (id, updates) => set((state) => ({
    resguardos: state.resguardos.map(r => r.id === id ? { ...r, ...updates } : r),
    lastFetchedAt: new Date().toISOString(),
  })),
  
  removeResguardo: (id) => set((state) => ({
    resguardos: state.resguardos.filter(r => r.id !== id),
    lastFetchedAt: new Date().toISOString(),
  })),
  
  isCacheValid: (maxAgeMinutes = DEFAULT_CACHE_DURATION_MINUTES) => {
    const { lastFetchedAt, resguardos } = get();
    if (!lastFetchedAt || resguardos.length === 0) return false;
    const ageMs = Date.now() - new Date(lastFetchedAt).getTime();
    return ageMs < maxAgeMinutes * 60 * 1000;
  },
  
  clearCache: () => set({ resguardos: [], lastFetchedAt: null }),
  
  getResguardoById: (id) => get().resguardos.find(r => r.id === id),
}),
    {
      name: 'resguardos-storage',
      storage: createJSONStorage(() => indexedDBStorage),
      onRehydrateStorage: () => (state) => {
        console.log('🔄 [RESGUARDOS Store] Hydration complete:', {
          resguardosCount: state?.resguardos.length ?? 0,
        });
        useHydrationStore.getState().markAsHydrated('resguardos');
      },
    }
  )
);
