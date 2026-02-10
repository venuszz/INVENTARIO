// ============================================================================
// RESGUARDOS CREAR STORE
// ============================================================================
// Store para gestionar el estado de sincronización de campos relacionales
// en el componente de creación de resguardos

import { create } from 'zustand';

interface ResguardosCrearStore {
  syncingIds: string[];
  isSyncing: boolean;
  setSyncingIds: (ids: string[]) => void;
  removeSyncingIds: (ids: string[]) => void;
  setIsSyncing: (syncing: boolean) => void;
}

export const useResguardosCrearStore = create<ResguardosCrearStore>((set) => ({
  syncingIds: [],
  isSyncing: false,
  
  setSyncingIds: (ids) => set((state) => {
    const currentIds = Array.isArray(state.syncingIds) ? state.syncingIds : [];
    const validIds = Array.isArray(ids) ? ids : [];
    return {
      syncingIds: [...new Set([...currentIds, ...validIds])],
    };
  }),
  
  removeSyncingIds: (ids) => set((state) => {
    const currentIds = Array.isArray(state.syncingIds) ? state.syncingIds : [];
    const validIds = Array.isArray(ids) ? ids : [];
    return {
      syncingIds: currentIds.filter(id => !validIds.includes(id)),
    };
  }),
  
  setIsSyncing: (syncing) => set({ isSyncing: syncing }),
}));
