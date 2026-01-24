// ============================================================================
// INEA STORE
// ============================================================================
// Store de Zustand para gestionar los datos de muebles INEA (tabla: muebles).
// Los datos se persisten en IndexedDB para mantenerlos entre sesiones sin llenar localStorage.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { indexedDBStorage } from '@/lib/indexedDBStorage';
import { useHydrationStore } from './hydrationStore';
import type { MuebleINEA } from '@/types/indexation';

// ============================================================================
// TIPOS
// ============================================================================

interface IneaStore {
  // Estado
  muebles: MuebleINEA[];
  lastFetchedAt: number | null;
  
  // Acciones CRUD
  setMuebles: (muebles: MuebleINEA[]) => void;
  addMueble: (mueble: MuebleINEA) => void;
  updateMueble: (mueble: MuebleINEA) => void;
  removeMueble: (id: number) => void;
  
  // Utilidades
  isCacheValid: (maxAgeMinutes?: number) => boolean;
  clearCache: () => void;
  getMuebleById: (id: number) => MuebleINEA | undefined;
  getMueblesByArea: (area: string) => MuebleINEA[];
}

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Duración máxima del caché en minutos (30 minutos por defecto)
 */
const DEFAULT_CACHE_DURATION_MINUTES = 30;

// ============================================================================
// STORE
// ============================================================================

/**
 * Store de datos de INEA
 * 
 * Gestiona los muebles de INEA con persistencia en IndexedDB.
 * Incluye validación de caché para determinar si los datos son recientes.
 * 
 * @example
 * ```typescript
 * const { muebles, setMuebles, addMueble, isCacheValid } = useIneaStore();
 * 
 * // Verificar caché
 * if (!isCacheValid(30)) {
 *   // Fetch nuevos datos
 *   const data = await fetchMuebles();
 *   setMuebles(data);
 * }
 * 
 * // Agregar mueble
 * addMueble(newMueble);
 * ```
 */
export const useIneaStore = create<IneaStore>()(
  persist(
    (set, get) => ({
      // ========================================================================
      // ESTADO INICIAL
      // ========================================================================
      
      muebles: [],
      lastFetchedAt: null,
  
  // ========================================================================
  // ACCIONES CRUD
  // ========================================================================
  
  /**
   * Establece todos los muebles (reemplaza el array completo)
   * Actualiza el timestamp de última actualización
   */
  setMuebles: (muebles) => {
    set({
      muebles,
      lastFetchedAt: Date.now(),
    });
  },
  
  /**
   * Agrega un nuevo mueble al array
   * Actualiza el timestamp de última actualización
   */
  addMueble: (mueble) => {
    set((state) => ({
      muebles: [...state.muebles, mueble],
      lastFetchedAt: Date.now(),
    }));
  },
  
  /**
   * Actualiza un mueble existente
   * Actualiza el timestamp de última actualización
   */
  updateMueble: (mueble) => {
    set((state) => ({
      muebles: state.muebles.map(m =>
        m.id === mueble.id ? mueble : m
      ),
      lastFetchedAt: Date.now(),
    }));
  },
  
  /**
   * Remueve un mueble por ID
   * Actualiza el timestamp de última actualización
   */
  removeMueble: (id) => {
    set((state) => ({
      muebles: state.muebles.filter(mueble => mueble.id !== id),
      lastFetchedAt: Date.now(),
    }));
  },
  
  // ========================================================================
  // UTILIDADES
  // ========================================================================
  
  /**
   * Verifica si el caché es válido basado en el tiempo transcurrido
   * 
   * @param maxAgeMinutes - Edad máxima del caché en minutos (default: 30)
   * @returns true si el caché es válido, false si está expirado o no existe
   */
  isCacheValid: (maxAgeMinutes = DEFAULT_CACHE_DURATION_MINUTES) => {
    const { lastFetchedAt, muebles } = get();
    
    // Si no hay timestamp o no hay datos, caché inválido
    if (!lastFetchedAt || muebles.length === 0) {
      return false;
    }
    
    // Calcular tiempo transcurrido
    const now = Date.now();
    const ageMs = now - lastFetchedAt;
    
    // Convertir edad máxima a milisegundos
    const maxAgeMs = maxAgeMinutes * 60 * 1000;
    
    // Caché es válido si la edad es menor a la máxima
    return ageMs < maxAgeMs;
  },
  
  /**
   * Limpia completamente el caché
   * Resetea muebles y timestamp
   */
  clearCache: () => {
    set({
      muebles: [],
      lastFetchedAt: null,
    });
  },
  
  /**
   * Obtiene un mueble por ID
   * 
   * @param id - ID del mueble
   * @returns Mueble encontrado o undefined
   */
  getMuebleById: (id) => {
    const { muebles } = get();
    return muebles.find(mueble => mueble.id === id);
  },
  
  /**
   * Obtiene todos los muebles de un área específica
   * 
   * @param area - Nombre del área
   * @returns Array de muebles del área
   */
  getMueblesByArea: (area) => {
    const { muebles } = get();
    return muebles.filter(mueble => mueble.area === area);
  },
    }),
    {
      name: 'inea-storage',
      storage: createJSONStorage(() => indexedDBStorage),
      onRehydrateStorage: () => (state) => {
        console.log('🔄 [INEA Store] Hydration complete:', {
          mueblesCount: state?.muebles.length ?? 0,
          lastFetchedAt: state?.lastFetchedAt,
        });
        useHydrationStore.getState().markAsHydrated('inea');
      },
    }
  )
);

// ============================================================================
// SELECTORES
// ============================================================================
// Selectores útiles para acceder a datos derivados

/**
 * Selector para obtener el conteo total de muebles
 */
export const selectMueblesCount = (state: IneaStore) => state.muebles.length;

/**
 * Selector para obtener todas las áreas únicas
 */
export const selectUniqueAreas = (state: IneaStore) => {
  const areas = state.muebles
    .map(m => m.area)
    .filter((area): area is string => area !== null);
  return Array.from(new Set(areas)).sort();
};

/**
 * Selector para obtener todos los rubros únicos
 */
export const selectUniqueRubros = (state: IneaStore) => {
  const rubros = state.muebles
    .map(m => m.rubro)
    .filter((rubro): rubro is string => rubro !== null);
  return Array.from(new Set(rubros)).sort();
};

/**
 * Selector para verificar si hay datos cargados
 */
export const selectHasData = (state: IneaStore) => state.muebles.length > 0;
