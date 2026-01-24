// ============================================================================
// INDEXEDDB STORAGE ADAPTER
// ============================================================================
// Adapter personalizado para usar IndexedDB con Zustand persist middleware.
// Usa localforage como wrapper sobre IndexedDB para simplificar la API.

import localforage from 'localforage';
import type { StateStorage } from 'zustand/middleware';

// ============================================================================
// CONFIGURACIÓN DE LOCALFORAGE
// ============================================================================

/**
 * Configura localforage para usar IndexedDB con nombre personalizado
 */
localforage.config({
  driver: localforage.INDEXEDDB,
  name: 'inventario-db',
  version: 1.0,
  storeName: 'muebles_store',
  description: 'Base de datos local para almacenar datos de muebles',
});

// ============================================================================
// STORAGE ADAPTER
// ============================================================================

/**
 * Storage adapter que implementa la interfaz StateStorage de Zustand
 * usando IndexedDB a través de localforage.
 * 
 * IndexedDB permite almacenar mucho más datos que localStorage (50-100MB+)
 * y es ideal para grandes volúmenes de registros.
 * 
 * @example
 * ```typescript
 * import { create } from 'zustand';
 * import { persist, createJSONStorage } from 'zustand/middleware';
 * import { indexedDBStorage } from '@/lib/indexedDBStorage';
 * 
 * const useStore = create(
 *   persist(
 *     (set) => ({ ... }),
 *     {
 *       name: 'my-store',
 *       storage: createJSONStorage(() => indexedDBStorage),
 *     }
 *   )
 * );
 * ```
 */
export const indexedDBStorage: StateStorage = {
  /**
   * Obtiene un item de IndexedDB
   * 
   * @param name - Clave del item
   * @returns Promise con el valor parseado o null si no existe
   */
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await localforage.getItem<string>(name);
      console.log(`📦 [IndexedDB] GET "${name}":`, value ? `${value.length} chars` : 'null');
      return value || null;
    } catch (error) {
      console.error(`❌ [IndexedDB] Error getting "${name}":`, error);
      return null;
    }
  },

  /**
   * Guarda un item en IndexedDB
   * 
   * @param name - Clave del item
   * @param value - Valor a guardar (string JSON)
   */
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await localforage.setItem(name, value);
      console.log(`💾 [IndexedDB] SET "${name}":`, `${value.length} chars`);
    } catch (error) {
      console.error(`❌ [IndexedDB] Error setting "${name}":`, error);
      // Si falla, intentar limpiar stores antiguos
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('⚠️ [IndexedDB] Quota exceeded, consider clearing old data');
      }
    }
  },

  /**
   * Elimina un item de IndexedDB
   * 
   * @param name - Clave del item a eliminar
   */
  removeItem: async (name: string): Promise<void> => {
    try {
      await localforage.removeItem(name);
      console.log(`🗑️ [IndexedDB] REMOVE "${name}"`);
    } catch (error) {
      console.error(`❌ [IndexedDB] Error removing "${name}":`, error);
    }
  },
};

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Limpia completamente IndexedDB (útil para debugging o reset)
 */
export const clearIndexedDB = async (): Promise<void> => {
  try {
    await localforage.clear();
    console.log('🧹 [IndexedDB] Database cleared');
  } catch (error) {
    console.error('❌ [IndexedDB] Error clearing database:', error);
  }
};

/**
 * Obtiene el tamaño aproximado de IndexedDB
 * (solo funciona en navegadores que soportan StorageManager API)
 */
export const getIndexedDBSize = async (): Promise<{ usage: number; quota: number } | null> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      console.log(`📊 [IndexedDB] Usage: ${(usage / 1024 / 1024).toFixed(2)}MB / ${(quota / 1024 / 1024).toFixed(2)}MB`);
      return { usage, quota };
    } catch (error) {
      console.error('❌ [IndexedDB] Error getting size:', error);
    }
  }
  return null;
};

/**
 * Lista todas las claves almacenadas en IndexedDB
 */
export const listIndexedDBKeys = async (): Promise<string[]> => {
  try {
    const keys = await localforage.keys();
    console.log('🔑 [IndexedDB] Keys:', keys);
    return keys;
  } catch (error) {
    console.error('❌ [IndexedDB] Error listing keys:', error);
    return [];
  }
};
