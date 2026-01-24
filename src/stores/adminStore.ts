// ============================================================================
// ADMIN STORE
// ============================================================================
// Store unificado para todas las tablas administrativas

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { indexedDBStorage } from '@/lib/indexedDBStorage';
import { useHydrationStore } from '@/stores/hydrationStore';
import type { Directorio, Area, DirectorioArea, ConfigItem, Firma } from '@/types/admin';

interface AdminState {
    // Directorio
    directorio: Directorio[];
    setDirectorio: (directorio: Directorio[]) => void;
    addDirectorio: (item: Directorio) => void;
    updateDirectorio: (id: number, item: Directorio) => void;
    removeDirectorio: (id: number) => void;
    
    // Areas
    areas: Area[];
    setAreas: (areas: Area[]) => void;
    addArea: (item: Area) => void;
    updateArea: (id: number, item: Area) => void;
    removeArea: (id: number) => void;
    
    // Directorio Areas (relaciones)
    directorioAreas: DirectorioArea[];
    setDirectorioAreas: (items: DirectorioArea[]) => void;
    addDirectorioArea: (item: DirectorioArea) => void;
    removeDirectorioArea: (id: number) => void;
    removeDirectorioAreasByDirectorio: (id_directorio: number) => void;
    
    // Config
    config: ConfigItem[];
    setConfig: (config: ConfigItem[]) => void;
    addConfig: (item: ConfigItem) => void;
    updateConfig: (id: number, item: ConfigItem) => void;
    removeConfig: (id: number) => void;
    
    // Firmas
    firmas: Firma[];
    setFirmas: (firmas: Firma[]) => void;
    addFirma: (item: Firma) => void;
    updateFirma: (id: number, item: Firma) => void;
    removeFirma: (id: number) => void;
    
    // Cache validation
    lastFetchedAt: number | null;
    isCacheValid: () => boolean;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useAdminStore = create<AdminState>()(
    persist(
        (set, get) => ({
            // Directorio
            directorio: [],
            setDirectorio: (directorio) => set({ directorio, lastFetchedAt: Date.now() }),
            addDirectorio: (item) => set((state) => ({ directorio: [...state.directorio, item] })),
            updateDirectorio: (id, item) => set((state) => ({
                directorio: state.directorio.map((d) => d.id_directorio === id ? item : d)
            })),
            removeDirectorio: (id) => set((state) => ({
                directorio: state.directorio.filter((d) => d.id_directorio !== id)
            })),
            
            // Areas
            areas: [],
            setAreas: (areas) => set({ areas }),
            addArea: (item) => set((state) => ({ areas: [...state.areas, item] })),
            updateArea: (id, item) => set((state) => ({
                areas: state.areas.map((a) => a.id_area === id ? item : a)
            })),
            removeArea: (id) => set((state) => ({
                areas: state.areas.filter((a) => a.id_area !== id)
            })),
            
            // Directorio Areas
            directorioAreas: [],
            setDirectorioAreas: (items) => set({ directorioAreas: items }),
            addDirectorioArea: (item) => set((state) => ({ 
                directorioAreas: [...state.directorioAreas, item] 
            })),
            removeDirectorioArea: (id) => set((state) => ({
                directorioAreas: state.directorioAreas.filter((da) => da.id !== id)
            })),
            removeDirectorioAreasByDirectorio: (id_directorio) => set((state) => ({
                directorioAreas: state.directorioAreas.filter((da) => da.id_directorio !== id_directorio)
            })),
            
            // Config
            config: [],
            setConfig: (config) => set({ config }),
            addConfig: (item) => set((state) => ({ config: [...state.config, item] })),
            updateConfig: (id, item) => set((state) => ({
                config: state.config.map((c) => c.id === id ? item : c)
            })),
            removeConfig: (id) => set((state) => ({
                config: state.config.filter((c) => c.id !== id)
            })),
            
            // Firmas
            firmas: [],
            setFirmas: (firmas) => set({ firmas }),
            addFirma: (item) => set((state) => ({ firmas: [...state.firmas, item] })),
            updateFirma: (id, item) => set((state) => ({
                firmas: state.firmas.map((f) => f.id === id ? item : f)
            })),
            removeFirma: (id) => set((state) => ({
                firmas: state.firmas.filter((f) => f.id !== id)
            })),
            
            // Cache
            lastFetchedAt: null,
            isCacheValid: () => {
                const { lastFetchedAt } = get();
                if (!lastFetchedAt) return false;
                return Date.now() - lastFetchedAt < CACHE_DURATION;
            },
        }),
        {
            name: 'admin-storage',
            storage: indexedDBStorage as any,
            // Solo persistir datos, NO funciones
            partialize: (state) => ({
                directorio: state.directorio,
                areas: state.areas,
                directorioAreas: state.directorioAreas,
                config: state.config,
                firmas: state.firmas,
                lastFetchedAt: state.lastFetchedAt,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    console.log('🔄 [ADMIN Store] Hydration complete:', {
                        directorioCount: state.directorio.length,
                        areasCount: state.areas.length,
                        directorioAreasCount: state.directorioAreas.length,
                        configCount: state.config.length,
                        firmasCount: state.firmas.length,
                        lastFetchedAt: state.lastFetchedAt
                    });
                    useHydrationStore.getState().markAsHydrated('admin');
                }
            },
        }
    )
);
