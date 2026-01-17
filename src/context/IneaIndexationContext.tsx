"use client"
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import supabase from '@/app/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Interface para los datos de muebles INEA
export interface MuebleInea {
    id: number;
    id_inv: string;
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

// Estado del contexto
interface IneaIndexationState {
    data: MuebleInea[];
    isIndexing: boolean;
    isComplete: boolean;
    progress: number;
    total: number;
    error: string | null;
    lastUpdated: string | null;
}

// Acciones del contexto
interface IneaIndexationActions {
    reindex: () => Promise<void>;
    clearCache: () => void;
}

type IneaIndexationContextType = IneaIndexationState & IneaIndexationActions;

const IneaIndexationContext = createContext<IneaIndexationContextType | undefined>(undefined);

const CACHE_KEY = 'inea_muebles_cache';
const CACHE_TIMESTAMP_KEY = 'inea_muebles_cache_timestamp';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días

export const IneaIndexationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<IneaIndexationState>({
        data: [],
        isIndexing: false,
        isComplete: false,
        progress: 0,
        total: 0,
        error: null,
        lastUpdated: null,
    });

    const isInitialized = useRef(false);
    const subscriptionRef = useRef<RealtimeChannel | null>(null);

    // Función para guardar en cache
    const saveToCache = useCallback((data: MuebleInea[]) => {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().toISOString());
        } catch (error) {
            console.error('Error guardando en cache:', error);
        }
    }, []);

    // Función para cargar desde cache
    const loadFromCache = useCallback((): MuebleInea[] | null => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

            if (!cached || !timestamp) return null;

            const cacheAge = Date.now() - new Date(timestamp).getTime();
            if (cacheAge > CACHE_DURATION) {
                localStorage.removeItem(CACHE_KEY);
                localStorage.removeItem(CACHE_TIMESTAMP_KEY);
                return null;
            }

            return JSON.parse(cached);
        } catch (error) {
            console.error('Error cargando desde cache:', error);
            return null;
        }
    }, []);

    // Función para limpiar cache
    const clearCache = useCallback(() => {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        setState(prev => ({
            ...prev,
            data: [],
            isComplete: false,
            progress: 0,
            total: 0,
            lastUpdated: null,
        }));
    }, []);

    // Función principal de indexación
    const indexData = useCallback(async (showProgress = true) => {
        if (showProgress) {
            setState(prev => ({ ...prev, isIndexing: true, error: null, progress: 0 }));
        }

        try {
            let allData: MuebleInea[] = [];
            let from = 0;
            const batchSize = 1000;
            let keepFetching = true;

            // Primero obtener el total para mostrar progreso
            const { count } = await supabase
                .from('muebles')
                .select('*', { count: 'exact', head: true })
                .neq('estatus', 'BAJA');

            const totalRecords = count || 0;
            setState(prev => ({ ...prev, total: totalRecords }));

            while (keepFetching) {
                const { data, error } = await supabase
                    .from('muebles')
                    .select('*')
                    .neq('estatus', 'BAJA')
                    .range(from, from + batchSize - 1);

                if (error) throw error;

                if (data && data.length > 0) {
                    allData = allData.concat(data as MuebleInea[]);

                    if (showProgress) {
                        setState(prev => ({
                            ...prev,
                            progress: allData.length,
                            data: allData
                        }));
                    }

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
                data: allData,
                isIndexing: false,
                isComplete: true,
                progress: allData.length,
                total: allData.length,
                error: null,
                lastUpdated: new Date().toISOString(),
            }));

            return allData;
        } catch (error) {
            console.error('Error indexando datos INEA:', error);
            setState(prev => ({
                ...prev,
                isIndexing: false,
                error: 'Error al indexar datos',
            }));
            throw error;
        }
    }, [saveToCache]);

    // Función para reindexar
    const reindex = useCallback(async () => {
        clearCache();
        await indexData();
    }, [clearCache, indexData]);

    // Función para manejar actualizaciones en tiempo real
    const handleRealtimeUpdate = useCallback(async (payload: RealtimePostgresChangesPayload<MuebleInea>) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        setState(prev => {
            let updatedData = [...prev.data];

            switch (eventType) {
                case 'INSERT':
                    // Solo agregar si no es BAJA
                    if (newRecord.estatus !== 'BAJA') {
                        updatedData.push(newRecord as MuebleInea);
                    }
                    break;

                case 'UPDATE':
                    const index = updatedData.findIndex(item => item.id === newRecord.id);
                    if (index !== -1) {
                        // Si cambió a BAJA, remover
                        if (newRecord.estatus === 'BAJA') {
                            updatedData.splice(index, 1);
                        } else {
                            // Actualizar el registro
                            updatedData[index] = newRecord as MuebleInea;
                        }
                    } else if (newRecord.estatus !== 'BAJA') {
                        // Si no existía y no es BAJA, agregarlo
                        updatedData.push(newRecord as MuebleInea);
                    }
                    break;

                case 'DELETE':
                    updatedData = updatedData.filter(item => item.id !== oldRecord.id);
                    break;
            }

            // Actualizar cache
            saveToCache(updatedData);

            return {
                ...prev,
                data: updatedData,
                total: updatedData.length,
                lastUpdated: new Date().toISOString(),
            };
        });
    }, [saveToCache]);

    // Inicializar datos al montar
    useEffect(() => {
        if (isInitialized.current) return;

        const initializeData = async () => {
            // Verificar si el usuario está autenticado
            try {
                const response = await fetch('/api/auth/session', {
                    credentials: 'include',
                });
                
                if (!response.ok) {
                    // No está autenticado, no inicializar
                    return;
                }
                
                const sessionData = await response.json();
                if (!sessionData.isAuthenticated) {
                    // No está autenticado, no inicializar
                    return;
                }
            } catch (error) {
                console.error('Error checking authentication:', error);
                return;
            }

            // Intentar cargar desde cache primero
            const cachedData = loadFromCache();

            if (cachedData && cachedData.length > 0) {
                // Datos en cache válidos
                setState(prev => ({
                    ...prev,
                    data: cachedData,
                    isComplete: true,
                    progress: cachedData.length,
                    total: cachedData.length,
                    lastUpdated: localStorage.getItem(CACHE_TIMESTAMP_KEY),
                }));
            } else {
                // No hay cache o está expirado, indexar
                await indexData();
            }

            isInitialized.current = true;
        };

        initializeData();
    }, [indexData, loadFromCache]);

    // Suscribirse a cambios en tiempo real
    useEffect(() => {
        // Solo suscribirse si los datos están completos
        if (!state.isComplete) return;

        // Verificar autenticación de manera asíncrona
        const checkAuthAndSubscribe = async () => {
            try {
                const response = await fetch('/api/auth/session', {
                    credentials: 'include',
                });
                
                if (!response.ok) return;
                
                const sessionData = await response.json();
                if (!sessionData.isAuthenticated) return;

                // Crear suscripción
                const channel = supabase
                    .channel('muebles-changes')
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'muebles'
                        },
                        handleRealtimeUpdate
                    )
                    .subscribe();

                subscriptionRef.current = channel;
            } catch (error) {
                console.error('Error setting up realtime subscription:', error);
            }
        };

        checkAuthAndSubscribe();

        return () => {
            if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
            }
        };
    }, [state.isComplete, handleRealtimeUpdate]);

    const value: IneaIndexationContextType = {
        ...state,
        reindex,
        clearCache,
    };

    return (
        <IneaIndexationContext.Provider value={value}>
            {children}
        </IneaIndexationContext.Provider>
    );
};

// Hook para usar el contexto
export const useIneaIndexation = () => {
    const context = useContext(IneaIndexationContext);
    if (context === undefined) {
        throw new Error('useIneaIndexation debe ser usado dentro de IneaIndexationProvider');
    }
    return context;
};
