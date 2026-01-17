"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import supabase from '@/app/lib/supabase/client';

// Interfaz del mueble ITEA
export interface MuebleItea {
    id: number;
    id_inv: string | null;
    rubro: string | null;
    descripcion: string | null;
    valor: number | null;
    f_adq: string | null;
    formadq: string | null;
    proveedor: string | null;
    factura: string | null;
    ubicacion_es: string | null;
    ubicacion_mu: string | null;
    ubicacion_no: string | null;
    estado: string | null;
    estatus: string | null;
    area: string | null;
    usufinal: string | null;
    fechabaja: string | null;
    causadebaja: string | null;
    resguardante: string | null;
    image_path: string | null;
}

interface IteaIndexationState {
    muebles: MuebleItea[];
    isIndexing: boolean;
    isComplete: boolean;
    progress: number;
    total: number;
    error: string | null;
    lastUpdated: Date | null;
}

interface IteaIndexationContextType extends IteaIndexationState {
    reindex: () => Promise<void>;
    clearCache: () => void;
}

const IteaIndexationContext = createContext<IteaIndexationContextType | undefined>(undefined);

const CACHE_KEY = 'itea_muebles_cache';
const CACHE_TIMESTAMP_KEY = 'itea_muebles_cache_timestamp';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos

export function IteaIndexationProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<IteaIndexationState>({
        muebles: [],
        isIndexing: false,
        isComplete: false,
        progress: 0,
        total: 0,
        error: null,
        lastUpdated: null,
    });

    // Función para cargar desde cache
    const loadFromCache = useCallback((): MuebleItea[] | null => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

            if (!cached || !timestamp) return null;

            const cacheAge = Date.now() - parseInt(timestamp);
            if (cacheAge > CACHE_TTL) {
                localStorage.removeItem(CACHE_KEY);
                localStorage.removeItem(CACHE_TIMESTAMP_KEY);
                return null;
            }

            return JSON.parse(cached);
        } catch (error) {
            console.error('Error loading ITEA cache:', error);
            return null;
        }
    }, []);

    // Función para guardar en cache
    const saveToCache = useCallback((data: MuebleItea[]) => {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        } catch (error) {
            console.error('Error saving ITEA cache:', error);
        }
    }, []);

    // Función para limpiar cache
    const clearCache = useCallback(() => {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        setState(prev => ({
            ...prev,
            muebles: [],
            isComplete: false,
            lastUpdated: null,
        }));
    }, []);

    // Función de indexación
    const indexMuebles = useCallback(async () => {
        setState(prev => ({ ...prev, isIndexing: true, error: null, progress: 0 }));

        try {
            // Primero obtenemos el total
            const { count, error: countError } = await supabase
                .from('mueblesitea')
                .select('*', { count: 'exact', head: true })
                .neq('estatus', 'BAJA');

            if (countError) throw countError;

            const totalRecords = count || 0;
            setState(prev => ({ ...prev, total: totalRecords }));

            // Indexación por lotes
            let allData: MuebleItea[] = [];
            let from = 0;
            const batchSize = 1000;
            let keepFetching = true;

            while (keepFetching) {
                const { data, error } = await supabase
                    .from('mueblesitea')
                    .select('*')
                    .neq('estatus', 'BAJA')
                    .range(from, from + batchSize - 1);

                if (error) throw error;

                if (data && data.length > 0) {
                    allData = allData.concat(data as MuebleItea[]);
                    setState(prev => ({ ...prev, progress: allData.length }));

                    if (data.length < batchSize) {
                        keepFetching = false;
                    } else {
                        from += batchSize;
                    }
                } else {
                    keepFetching = false;
                }
            }

            // Guardar en cache
            saveToCache(allData);

            setState(prev => ({
                ...prev,
                muebles: allData,
                isIndexing: false,
                isComplete: true,
                progress: allData.length,
                lastUpdated: new Date(),
                error: null,
            }));

        } catch (error) {
            console.error('Error indexing ITEA muebles:', error);
            setState(prev => ({
                ...prev,
                isIndexing: false,
                error: 'Error al indexar datos de ITEA',
            }));
        }
    }, [saveToCache]);

    // Función para reindexar (limpia cache y vuelve a indexar)
    const reindex = useCallback(async () => {
        clearCache();
        await indexMuebles();
    }, [clearCache, indexMuebles]);

    // Efecto para cargar datos al iniciar
    useEffect(() => {
        // Verificar si el usuario está autenticado
        const checkAuthAndInit = async () => {
            try {
                const response = await fetch('/api/auth/session', {
                    credentials: 'include',
                });
                
                if (!response.ok) return;
                
                const sessionData = await response.json();
                if (!sessionData.isAuthenticated) return;

                const cachedData = loadFromCache();

                if (cachedData && cachedData.length > 0) {
                    // Cargar desde cache
                    setState(prev => ({
                        ...prev,
                        muebles: cachedData,
                        isComplete: true,
                        progress: cachedData.length,
                        total: cachedData.length,
                        lastUpdated: new Date(parseInt(localStorage.getItem(CACHE_TIMESTAMP_KEY) || '0')),
                    }));
                } else {
                    // Indexar desde la base de datos
                    await indexMuebles();
                }
            } catch (error) {
                console.error('Error checking authentication:', error);
            }
        };

        checkAuthAndInit();
    }, [loadFromCache, indexMuebles]);

    // Suscripción a cambios en tiempo real
    useEffect(() => {
        // Verificar si el usuario está autenticado
        const checkAuthAndSubscribe = async () => {
            try {
                const response = await fetch('/api/auth/session', {
                    credentials: 'include',
                });
                
                if (!response.ok) return;
                
                const sessionData = await response.json();
                if (!sessionData.isAuthenticated) return;

                const channel = supabase
                    .channel('itea-muebles-changes')
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                    schema: 'public',
                    table: 'mueblesitea',
                },
                (payload) => {
                    setState(prev => {
                        let updatedMuebles = [...prev.muebles];

                        if (payload.eventType === 'INSERT') {
                            const newItem = payload.new as MuebleItea;
                            if (newItem.estatus !== 'BAJA') {
                                updatedMuebles.push(newItem);
                            }
                        } else if (payload.eventType === 'UPDATE') {
                            const updatedItem = payload.new as MuebleItea;
                            if (updatedItem.estatus === 'BAJA') {
                                // Eliminar si cambió a BAJA
                                updatedMuebles = updatedMuebles.filter(m => m.id !== updatedItem.id);
                            } else {
                                // Actualizar el item
                                const index = updatedMuebles.findIndex(m => m.id === updatedItem.id);
                                if (index !== -1) {
                                    updatedMuebles[index] = updatedItem;
                                } else {
                                    updatedMuebles.push(updatedItem);
                                }
                            }
                        } else if (payload.eventType === 'DELETE') {
                            const deletedItem = payload.old as MuebleItea;
                            updatedMuebles = updatedMuebles.filter(m => m.id !== deletedItem.id);
                        }

                        // Actualizar cache
                        saveToCache(updatedMuebles);

                        return {
                            ...prev,
                            muebles: updatedMuebles,
                            progress: updatedMuebles.length,
                            total: updatedMuebles.length,
                            lastUpdated: new Date(),
                        };
                    });
                }
            )
            .subscribe();

                return () => {
                    supabase.removeChannel(channel);
                };
            } catch (error) {
                console.error('Error setting up realtime subscription:', error);
            }
        };

        checkAuthAndSubscribe();
    }, [saveToCache]);

    return (
        <IteaIndexationContext.Provider value={{ ...state, reindex, clearCache }}>
            {children}
        </IteaIndexationContext.Provider>
    );
}

export function useIteaIndexation() {
    const context = useContext(IteaIndexationContext);
    if (context === undefined) {
        throw new Error('useIteaIndexation must be used within IteaIndexationProvider');
    }
    return context;
}
