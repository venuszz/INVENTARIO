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
  addResguardoBatch: (resguardos: Resguardo[]) => void;
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
  
  addResguardo: (resguardo) => set((state) => {
    const exists = state.resguardos.some(r => r.id === resguardo.id);
    if (exists) {
      console.log('[ResguardosStore] Resguardo already exists, skipping:', resguardo.id);
      return state;
    }
    
    console.log('[ResguardosStore] Adding resguardo:', resguardo.id);
    return {
      resguardos: [...state.resguardos, resguardo],
      lastFetchedAt: new Date().toISOString(),
    };
  }),
  
  addResguardoBatch: (resguardos) => set((state) => {
    const existingIds = new Set(state.resguardos.map(r => r.id));
    const newResguardos = resguardos.filter(r => !existingIds.has(r.id));
    
    if (newResguardos.length === 0) {
      console.log('[ResguardosStore] All resguardos already exist, skipping batch');
      return state;
    }
    
    console.log('[ResguardosStore] Adding batch:', newResguardos.length, 'new resguardos');
    return {
      resguardos: [...state.resguardos, ...newResguardos],
      lastFetchedAt: new Date().toISOString(),
    };
  }),
  
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
        useHydrationStore.getState().markAsHydrated('resguardos');
      },
    }
  )
);
