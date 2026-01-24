// ============================================================================
// HYDRATION STORE
// ============================================================================
// Store para rastrear el estado de hidratación de todos los stores con persist.
// Permite a los hooks esperar a que IndexedDB termine de cargar antes de decidir
// si necesitan indexar o no.

import { create } from 'zustand';

interface HydrationStore {
  hydrated: Record<string, boolean>;
  markAsHydrated: (storeName: string) => void;
  isHydrated: (storeName: string) => boolean;
  areAllHydrated: (storeNames: string[]) => boolean;
}

export const useHydrationStore = create<HydrationStore>((set, get) => ({
  hydrated: {},
  
  markAsHydrated: (storeName: string) => {
    set((state) => ({
      hydrated: {
        ...state.hydrated,
        [storeName]: true,
      },
    }));
    console.log(`✅ [Hydration] ${storeName} hydrated`);
  },
  
  isHydrated: (storeName: string) => {
    return get().hydrated[storeName] ?? false;
  },
  
  areAllHydrated: (storeNames: string[]) => {
    const { hydrated } = get();
    return storeNames.every(name => hydrated[name] === true);
  },
}));
