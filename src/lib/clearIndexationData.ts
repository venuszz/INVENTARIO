// ============================================================================
// CLEAR INDEXATION DATA
// ============================================================================
// Función utilitaria para limpiar completamente todos los datos de indexación
// al hacer logout. Esto incluye:
// - Todos los stores de Zustand (IndexedDB)
// - IndexationStore (estado de indexación)
// - HydrationStore (estado de hidratación)
// - Todos los módulos de datos (INEA, ITEA, Resguardos, Admin, etc.)

import { useIndexationStore } from '@/stores/indexationStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useIneaStore } from '@/stores/ineaStore';
import { useIteaStore } from '@/stores/iteaStore';
import { useNoListadoStore } from '@/stores/noListadoStore';
import { useIneaObsoletosStore } from '@/stores/ineaObsoletosStore';
import { useIteaObsoletosStore } from '@/stores/iteaObsoletosStore';
import { useResguardosStore } from '@/stores/resguardosStore';
import { useResguardosBajasStore } from '@/stores/resguardosBajasStore';
import { useAdminStore } from '@/stores/adminStore';

/**
 * Limpia completamente todos los datos de indexación del sistema.
 * Esta función debe ser llamada al hacer logout para asegurar que
 * no queden datos residuales en el navegador.
 * 
 * Limpia:
 * - IndexedDB (todos los stores persistidos)
 * - Estado de indexación
 * - Estado de hidratación
 * - Todos los módulos de datos
 */
export async function clearAllIndexationData(): Promise<void> {
    console.log('🧹 Iniciando limpieza completa de datos de indexación...');
    
    try {
        // 1. Limpiar IndexedDB directamente
        await clearIndexedDB();
        
        // 2. Resetear todos los stores de Zustand
        resetAllStores();
        
        console.log('✅ Limpieza completa de datos de indexación finalizada');
    } catch (error) {
        console.error('❌ Error al limpiar datos de indexación:', error);
        throw error;
    }
}

/**
 * Limpia todas las bases de datos de IndexedDB relacionadas con la indexación
 */
async function clearIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            // Lista de nombres de bases de datos que usa el sistema
            const dbNames = [
                'inea-storage',
                'itea-storage',
                'no-listado-storage',
                'inea-obsoletos-storage',
                'itea-obsoletos-storage',
                'resguardos-storage',
                'resguardosBajas-storage',
                'admin-storage',
                'indexation-storage',
            ];
            
            let deletedCount = 0;
            let errorCount = 0;
            
            dbNames.forEach((dbName) => {
                const deleteRequest = indexedDB.deleteDatabase(dbName);
                
                deleteRequest.onsuccess = () => {
                    deletedCount++;
                    console.log(`✅ Base de datos eliminada: ${dbName}`);
                    
                    if (deletedCount + errorCount === dbNames.length) {
                        resolve();
                    }
                };
                
                deleteRequest.onerror = () => {
                    errorCount++;
                    console.warn(`⚠️ Error al eliminar base de datos: ${dbName}`);
                    
                    if (deletedCount + errorCount === dbNames.length) {
                        resolve(); // Resolvemos de todas formas para no bloquear el logout
                    }
                };
                
                deleteRequest.onblocked = () => {
                    console.warn(`⚠️ Eliminación bloqueada para: ${dbName}`);
                };
            });
            
            // Si no hay bases de datos, resolver inmediatamente
            if (dbNames.length === 0) {
                resolve();
            }
        } catch (error) {
            console.error('Error al limpiar IndexedDB:', error);
            reject(error);
        }
    });
}

/**
 * Resetea todos los stores de Zustand a su estado inicial
 */
function resetAllStores(): void {
    console.log('🔄 Reseteando todos los stores de Zustand...');
    
    // Resetear IndexationStore
    try {
        const indexationStore = useIndexationStore.getState();
        if ('reset' in indexationStore && typeof indexationStore.reset === 'function') {
            indexationStore.reset();
            console.log('✅ IndexationStore reseteado');
        }
    } catch (error) {
        console.warn('⚠️ Error al resetear IndexationStore:', error);
    }
    
    // Resetear HydrationStore
    try {
        const hydrationStore = useHydrationStore.getState();
        if ('reset' in hydrationStore && typeof hydrationStore.reset === 'function') {
            hydrationStore.reset();
            console.log('✅ HydrationStore reseteado');
        }
    } catch (error) {
        console.warn('⚠️ Error al resetear HydrationStore:', error);
    }
    
    // Resetear stores de datos
    const stores = [
        { name: 'IneaStore', store: useIneaStore },
        { name: 'IteaStore', store: useIteaStore },
        { name: 'NoListadoStore', store: useNoListadoStore },
        { name: 'IneaObsoletosStore', store: useIneaObsoletosStore },
        { name: 'IteaObsoletosStore', store: useIteaObsoletosStore },
        { name: 'ResguardosStore', store: useResguardosStore },
        { name: 'ResguardosBajasStore', store: useResguardosBajasStore },
        { name: 'AdminStore', store: useAdminStore },
    ];
    
    stores.forEach(({ name, store }) => {
        try {
            const state = store.getState() as any;
            
            // Intentar llamar a un método reset si existe
            if ('reset' in state && typeof state.reset === 'function') {
                state.reset();
                console.log(`✅ ${name} reseteado`);
            } else {
                // Si no hay método reset, limpiar manualmente los datos principales
                if ('setMuebles' in state && typeof state.setMuebles === 'function') {
                    state.setMuebles([]);
                }
                if ('setResguardos' in state && typeof state.setResguardos === 'function') {
                    state.setResguardos([]);
                }
                if ('setDirectorio' in state && typeof state.setDirectorio === 'function') {
                    state.setDirectorio([]);
                }
                if ('setAreas' in state && typeof state.setAreas === 'function') {
                    state.setAreas([]);
                }
                if ('setDirectorioAreas' in state && typeof state.setDirectorioAreas === 'function') {
                    state.setDirectorioAreas([]);
                }
                if ('setConfig' in state && typeof state.setConfig === 'function') {
                    state.setConfig([]);
                }
                if ('setFirmas' in state && typeof state.setFirmas === 'function') {
                    state.setFirmas([]);
                }
                console.log(`✅ ${name} limpiado manualmente`);
            }
        } catch (error) {
            console.warn(`⚠️ Error al resetear ${name}:`, error);
        }
    });
}
