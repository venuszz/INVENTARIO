// ============================================================================
// RESGUARDOS BAJAS STORE
// ============================================================================
// Store de Zustand para gestionar los datos de resguardos bajas (tabla: resguardos_bajas).
// Los datos se persisten en IndexedDB para mantenerlos entre sesiones sin llenar localStorage.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { indexedDBStorage } from '@/lib/indexedDBStorage';
import { useHydrationStore } from './hydrationStore';
import type { ResguardoBaja } from '@/types/indexation';

interface ResguardosBajasStore {
  resguardos: ResguardoBaja[];
  lastFetchedAt: string | null;
  setResguardos: (resguardos: ResguardoBaja[]) => void;
  addResguardo: (resguardo: ResguardoBaja) => void;
  updateResguardo: (id: string, updates: Partial<ResguardoBaja>) => void; // UUID
  removeResguardo: (id: string) => void; // UUID
  isCacheValid: (maxAgeMinutes?: number) => boolean;
  clearCache: () => void;
  getResguardoById: (id: string) => ResguardoBaja | undefined; // UUID
}

const DEFAULT_CACHE_DURATION_MINUTES = 30;

export const useResguardosBajasStore = create<ResguardosBajasStore>()(
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
      name: 'resguardos-bajas-storage',
      storage: createJSONStorage(() => indexedDBStorage),
      onRehydrateStorage: () => (state) => {
        console.log('🔄 [RESGUARDOS_BAJAS Store] Hydration complete:', {
          resguardosCount: state?.resguardos.length ?? 0,
        });
        useHydrationStore.getState().markAsHydrated('resguardos-bajas');
      },
    }
  )
);
