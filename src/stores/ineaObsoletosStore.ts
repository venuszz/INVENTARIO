// ============================================================================
// INEA OBSOLETOS STORE
// ============================================================================
// Store de Zustand para gestionar los datos de muebles INEA obsoletos (estatus BAJA).
// Los datos se persisten en IndexedDB para mantenerlos entre sesiones sin llenar localStorage.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { indexedDBStorage } from '@/lib/indexedDBStorage';
import { useHydrationStore } from './hydrationStore';
import type { MuebleINEA } from '@/types/indexation';

// ============================================================================
// TIPOS
// ============================================================================

interface IneaObsoletosStore {
  // Estado
  muebles: MuebleINEA[];
  lastFetchedAt: string | null;
  
  // Acciones CRUD
  setMuebles: (muebles: MuebleINEA[]) => void;
  addMueble: (mueble: MuebleINEA) => void;
  updateMueble: (id: string, updates: Partial<MuebleINEA>) => void; // UUID
  removeMueble: (id: string) => void; // UUID
  
  // Utilidades
  isCacheValid: (maxAgeMinutes?: number) => boolean;
  clearCache: () => void;
  getMuebleById: (id: string) => MuebleINEA | undefined; // UUID
  getMueblesByArea: (area: string) => MuebleINEA[];
}

// ============================================================================
// CONSTANTES
// ============================================================================

const DEFAULT_CACHE_DURATION_MINUTES = 30;

// ============================================================================
// STORE
// ============================================================================

export const useIneaObsoletosStore = create<IneaObsoletosStore>()(
  persist(
    (set, get) => ({
  muebles: [],
  lastFetchedAt: null,
  
  setMuebles: (muebles) => {
    set({
      muebles,
      lastFetchedAt: new Date().toISOString(),
    });
  },
  
  addMueble: (mueble) => {
    set((state) => ({
      muebles: [...state.muebles, mueble],
      lastFetchedAt: new Date().toISOString(),
    }));
  },
  
  updateMueble: (id, updates) => {
    set((state) => ({
      muebles: state.muebles.map(mueble =>
        mueble.id === id ? { ...mueble, ...updates } : mueble
      ),
      lastFetchedAt: new Date().toISOString(),
    }));
  },
  
  removeMueble: (id) => {
    set((state) => ({
      muebles: state.muebles.filter(mueble => mueble.id !== id),
      lastFetchedAt: new Date().toISOString(),
    }));
  },
  
  isCacheValid: (maxAgeMinutes = DEFAULT_CACHE_DURATION_MINUTES) => {
    const { lastFetchedAt, muebles } = get();
    if (!lastFetchedAt || muebles.length === 0) return false;
    const lastFetchTime = new Date(lastFetchedAt).getTime();
    const now = Date.now();
    const ageMs = now - lastFetchTime;
    const maxAgeMs = maxAgeMinutes * 60 * 1000;
    return ageMs < maxAgeMs;
  },
  
  clearCache: () => {
    set({
      muebles: [],
      lastFetchedAt: null,
    });
  },
  
  getMuebleById: (id) => {
    const { muebles } = get();
    return muebles.find(mueble => mueble.id === id);
  },
  
  getMueblesByArea: (area) => {
    const { muebles } = get();
    return muebles.filter(mueble => mueble.area?.nombre === area);
  },
}),
    {
      name: 'inea-obsoletos-storage',
      storage: createJSONStorage(() => indexedDBStorage),
      onRehydrateStorage: () => (state) => {
        console.log('🔄 [INEA_OBSOLETOS Store] Hydration complete:', {
          mueblesCount: state?.muebles.length ?? 0,
        });
        useHydrationStore.getState().markAsHydrated('inea-obsoletos');
      },
    }
  )
);

// ============================================================================
// SELECTORES
// ============================================================================

export const selectMueblesCount = (state: IneaObsoletosStore) => state.muebles.length;

export const selectUniqueAreas = (state: IneaObsoletosStore) => {
  const areas = state.muebles
    .map(m => m.area)
    .filter((area): area is { id_area: number; nombre: string } => area !== null)
    .map(area => area.nombre);
  return Array.from(new Set(areas)).sort();
};

export const selectUniqueRubros = (state: IneaObsoletosStore) => {
  const rubros = state.muebles
    .map(m => m.rubro)
    .filter((rubro): rubro is string => rubro !== null);
  return Array.from(new Set(rubros)).sort();
};

export const selectHasData = (state: IneaObsoletosStore) => state.muebles.length > 0;
