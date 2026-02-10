// ============================================================================
// USE ADMIN INDEXATION HOOK
// ============================================================================
// Hook unificado para indexar todas las tablas administrativas:
// - directorio
// - area
// - directorio_areas
// - config
// - firmas

import { useEffect, useRef, useCallback } from 'react';
import { useIndexationStore } from '@/stores/indexationStore';
import { useAdminStore } from '@/stores/adminStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { withExponentialBackoff, FETCH_RETRY_CONFIG, RECONNECTION_CONFIG } from '@/lib/indexation/exponentialBackoff';
import supabase, { updateSupabaseAuth } from '@/app/lib/supabase/client';
import { fetchFromSupabase } from '@/lib/supabaseDataFetch';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Directorio, Area, DirectorioArea, ConfigItem, Firma } from '@/types/admin';

const MODULE_KEY = 'admin';

// Configuración de etapas
const STAGES = [
    { label: 'Cargando directorio', weight: 20 },
    { label: 'Cargando áreas', weight: 15 },
    { label: 'Cargando relaciones', weight: 15 },
    { label: 'Cargando configuración', weight: 20 },
    { label: 'Cargando firmas', weight: 10 },
    { label: 'Configurando tiempo real', weight: 20 },
];

export function useAdminIndexation() {
    const indexationState = useIndexationStore(state => state.modules[MODULE_KEY]);
    const {
        startIndexation,
        updateProgress,
        completeIndexation,
        setError,
        updateRealtimeConnection,
        updateReconnectionStatus,
        incrementReconnectionAttempts,
        resetReconnectionAttempts,
        setDisconnectedAt,
        updateLastEventReceived,
        initializeModule,
        addRealtimeChange,
    } = useIndexationStore();
    
    const {
        directorio,
        areas,
        directorioAreas,
        config,
        firmas,
        setDirectorio,
        setAreas,
        setDirectorioAreas,
        setConfig,
        setFirmas,
        addDirectorio,
        updateDirectorio,
        removeDirectorio,
        addArea,
        updateArea,
        removeArea,
        addDirectorioArea,
        removeDirectorioArea,
        removeDirectorioAreasByDirectorio,
        addConfig,
        updateConfig,
        removeConfig,
        addFirma,
        updateFirma,
        removeFirma,
    } = useAdminStore();
    
    const isIndexingRef = useRef(false);
    const channelsRef = useRef<RealtimeChannel[]>([]);
    const reconnectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isInitializedRef = useRef(false);
    const isSettingUpChannelsRef = useRef(false);
    
    const indexData = useCallback(async () => {
        if (isIndexingRef.current) return;
        
        isIndexingRef.current = true;
        
        try {
            startIndexation(MODULE_KEY);
            let accumulatedProgress = 0;
            
            // Stage 1: Cargar directorio
            const stage1 = STAGES[0];
            updateProgress(MODULE_KEY, accumulatedProgress, stage1.label);
            
            const fetchedDirectorio = await withExponentialBackoff(
                async () => {
                    return await fetchFromSupabase<Directorio>({
                        table: 'directorio',
                        select: '*',
                        order: { column: 'id_directorio', ascending: true }
                    });
                },
                FETCH_RETRY_CONFIG
            );
            
            setDirectorio(fetchedDirectorio);
            accumulatedProgress += stage1.weight;
            updateProgress(MODULE_KEY, accumulatedProgress, stage1.label);
            
            // Stage 2: Cargar áreas
            const stage2 = STAGES[1];
            updateProgress(MODULE_KEY, accumulatedProgress, stage2.label);
            
            const fetchedAreas = await withExponentialBackoff(
                async () => {
                    return await fetchFromSupabase<Area>({
                        table: 'area',
                        select: '*',
                        order: { column: 'nombre', ascending: true }
                    });
                },
                FETCH_RETRY_CONFIG
            );
            
            setAreas(fetchedAreas);
            accumulatedProgress += stage2.weight;
            updateProgress(MODULE_KEY, accumulatedProgress, stage2.label);
            
            // Stage 3: Cargar relaciones directorio_areas
            const stage3 = STAGES[2];
            updateProgress(MODULE_KEY, accumulatedProgress, stage3.label);
            
            const fetchedDirectorioAreas = await withExponentialBackoff(
                async () => {
                    return await fetchFromSupabase<DirectorioArea>({
                        table: 'directorio_areas',
                        select: '*'
                    });
                },
                FETCH_RETRY_CONFIG
            );
            
            setDirectorioAreas(fetchedDirectorioAreas);
            accumulatedProgress += stage3.weight;
            updateProgress(MODULE_KEY, accumulatedProgress, stage3.label);
            
            // Stage 4: Cargar config
            const stage4 = STAGES[3];
            updateProgress(MODULE_KEY, accumulatedProgress, stage4.label);
            
            const fetchedConfig = await withExponentialBackoff(
                async () => {
                    return await fetchFromSupabase<ConfigItem>({
                        table: 'config',
                        select: '*',
                        order: { column: 'id', ascending: true }
                    });
                },
                FETCH_RETRY_CONFIG
            );
            
            setConfig(fetchedConfig);
            accumulatedProgress += stage4.weight;
            updateProgress(MODULE_KEY, accumulatedProgress, stage4.label);
            
            // Stage 5: Cargar firmas
            const stage5 = STAGES[4];
            updateProgress(MODULE_KEY, accumulatedProgress, stage5.label);
            
            const fetchedFirmas = await withExponentialBackoff(
                async () => {
                    return await fetchFromSupabase<Firma>({
                        table: 'firmas',
                        select: '*',
                        order: { column: 'id', ascending: true }
                    });
                },
                FETCH_RETRY_CONFIG
            );
            
            setFirmas(fetchedFirmas);
            accumulatedProgress += stage5.weight;
            updateProgress(MODULE_KEY, accumulatedProgress, stage5.label);
            
            // Stage 6: Configurar realtime
            const stage6 = STAGES[5];
            updateProgress(MODULE_KEY, accumulatedProgress, stage6.label);
            
            if (channelsRef.current.length === 0) {
                await setupRealtimeSubscriptions();
            }
            
            accumulatedProgress += stage6.weight;
            updateProgress(MODULE_KEY, accumulatedProgress, stage6.label);
            
            completeIndexation(MODULE_KEY);
            
        } catch (error) {
            console.error('Error indexing Admin:', error);
            setError(MODULE_KEY, error instanceof Error ? error.message : 'Error al indexar datos administrativos');
        } finally {
            isIndexingRef.current = false;
        }
    }, [startIndexation, updateProgress, completeIndexation, setError, setDirectorio, setAreas, setDirectorioAreas, setConfig, setFirmas]);
    
    const handleSystemEvent = useCallback((payload: any) => {
        const { status } = payload;
        const wasConnected = indexationState?.realtimeConnected ?? false;
        const isConnected = status === 'SUBSCRIBED' || status === 'ok';
        
        updateRealtimeConnection(MODULE_KEY, isConnected);
        
        if (wasConnected && !isConnected) {
            setDisconnectedAt(MODULE_KEY, new Date().toISOString());
        }
    }, [indexationState?.realtimeConnected, updateRealtimeConnection, setDisconnectedAt]);
    
    const setupRealtimeSubscriptions = useCallback(async () => {
        if (isSettingUpChannelsRef.current) {
            return;
        }
        
        isSettingUpChannelsRef.current = true;
        
        try {
            // Actualizar el token de autenticación para Realtime
            updateSupabaseAuth();
            
            // Limpiar canales existentes
            for (const channel of channelsRef.current) {
                await supabase.removeChannel(channel);
            }
            channelsRef.current = [];
        
        // Canal para directorio
        const directorioChannel = supabase
            .channel('admin-directorio-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'directorio' },
                async (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;
                    updateLastEventReceived(MODULE_KEY);
                    
                    try {
                        switch (eventType) {
                            case 'INSERT':
                                if (newRecord) {
                                    addDirectorio(newRecord as Directorio);
                                    addRealtimeChange({
                                        moduleKey: MODULE_KEY,
                                        moduleName: 'Admin',
                                        table: 'directorio',
                                        eventType: 'INSERT',
                                        recordId: (newRecord as Directorio).id_directorio,
                                        recordName: (newRecord as Directorio).nombre ?? undefined,
                                    });
                                }
                                break;
                            case 'UPDATE':
                                if (newRecord) {
                                    updateDirectorio((newRecord as Directorio).id_directorio, newRecord as Directorio);
                                    addRealtimeChange({
                                        moduleKey: MODULE_KEY,
                                        moduleName: 'Admin',
                                        table: 'directorio',
                                        eventType: 'UPDATE',
                                        recordId: (newRecord as Directorio).id_directorio,
                                        recordName: (newRecord as Directorio).nombre ?? undefined,
                                    });
                                }
                                break;
                            case 'DELETE':
                                if (oldRecord) {
                                    const deletedId = (oldRecord as Directorio).id_directorio;
                                    removeDirectorio(deletedId);
                                    // También eliminar las relaciones directorio_areas asociadas
                                    removeDirectorioAreasByDirectorio(deletedId);
                                    addRealtimeChange({
                                        moduleKey: MODULE_KEY,
                                        moduleName: 'Admin',
                                        table: 'directorio',
                                        eventType: 'DELETE',
                                        recordId: deletedId,
                                        recordName: (oldRecord as Directorio).nombre ?? undefined,
                                    });
                                }
                                break;
                        }
                    } catch (error) {
                        console.error('Error handling directorio realtime event:', error);
                    }
                }
            )
            .on('system', {}, handleSystemEvent)
            .subscribe();
        
        channelsRef.current.push(directorioChannel);
        
        // Canal para area
        const areaChannel = supabase
            .channel('admin-area-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'area' },
                async (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;
                    updateLastEventReceived(MODULE_KEY);
                    
                    try {
                        switch (eventType) {
                            case 'INSERT':
                                if (newRecord) {
                                    addArea(newRecord as Area);
                                    addRealtimeChange({
                                        moduleKey: MODULE_KEY,
                                        moduleName: 'Admin',
                                        table: 'area',
                                        eventType: 'INSERT',
                                        recordId: (newRecord as Area).id_area,
                                        recordName: (newRecord as Area).nombre ?? undefined,
                                    });
                                }
                                break;
                            case 'UPDATE':
                                if (newRecord) {
                                    updateArea((newRecord as Area).id_area, newRecord as Area);
                                    addRealtimeChange({
                                        moduleKey: MODULE_KEY,
                                        moduleName: 'Admin',
                                        table: 'area',
                                        eventType: 'UPDATE',
                                        recordId: (newRecord as Area).id_area,
                                        recordName: (newRecord as Area).nombre ?? undefined,
                                    });
                                }
                                break;
                            case 'DELETE':
                                if (oldRecord) {
                                    removeArea((oldRecord as Area).id_area);
                                    addRealtimeChange({
                                        moduleKey: MODULE_KEY,
                                        moduleName: 'Admin',
                                        table: 'area',
                                        eventType: 'DELETE',
                                        recordId: (oldRecord as Area).id_area,
                                        recordName: (oldRecord as Area).nombre ?? undefined,
                                    });
                                }
                                break;
                        }
                    } catch (error) {
                        console.error('Error handling area realtime event:', error);
                    }
                }
            )
            .on('system', {}, handleSystemEvent)
            .subscribe();
        
        channelsRef.current.push(areaChannel);
        
        // Canal para directorio_areas
        const directorioAreasChannel = supabase
            .channel('admin-directorio-areas-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'directorio_areas' },
                async (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;
                    updateLastEventReceived(MODULE_KEY);
                    
                    try {
                        switch (eventType) {
                            case 'INSERT':
                                if (newRecord) {
                                    addDirectorioArea(newRecord as DirectorioArea);
                                }
                                break;
                            case 'DELETE':
                                if (oldRecord) {
                                    removeDirectorioArea((oldRecord as DirectorioArea).id);
                                }
                                break;
                        }
                    } catch (error) {
                        console.error('Error handling directorio_areas realtime event:', error);
                    }
                }
            )
            .on('system', {}, handleSystemEvent)
            .subscribe();
        
        channelsRef.current.push(directorioAreasChannel);
        
        // Canal para config
        const configChannel = supabase
            .channel('admin-config-changes')
            .on('postgres_changes', 
                { 
                    event: '*',  // Escuchar TODOS los eventos
                    schema: 'public', 
                    table: 'config' 
                },
                async (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;
                    updateLastEventReceived(MODULE_KEY);
                    
                    try {
                        switch (eventType) {
                            case 'INSERT':
                                if (newRecord) {
                                    // Refetch completo del registro desde Supabase
                                    const { data, error } = await supabase
                                        .from('config')
                                        .select('*')
                                        .eq('id', (newRecord as ConfigItem).id)
                                        .single();
                                    
                                    if (error) {
                                        throw error;
                                    }
                                    
                                    if (data) {
                                        addConfig(data as ConfigItem);
                                        addRealtimeChange({
                                            moduleKey: MODULE_KEY,
                                            moduleName: 'Configuración',
                                            table: 'config',
                                            eventType: 'INSERT',
                                            recordId: data.id,
                                            recordName: data.concepto,
                                        });
                                    }
                                }
                                break;
                                
                            case 'UPDATE':
                                if (newRecord) {
                                    // Refetch completo del registro desde Supabase
                                    const { data, error } = await supabase
                                        .from('config')
                                        .select('*')
                                        .eq('id', (newRecord as ConfigItem).id)
                                        .single();
                                    
                                    if (error) {
                                        throw error;
                                    }
                                    
                                    if (data) {
                                        updateConfig(data.id, data as ConfigItem);
                                        addRealtimeChange({
                                            moduleKey: MODULE_KEY,
                                            moduleName: 'Configuración',
                                            table: 'config',
                                            eventType: 'UPDATE',
                                            recordId: data.id,
                                            recordName: data.concepto,
                                        });
                                    }
                                }
                                break;
                                
                            case 'DELETE':
                                if (oldRecord) {
                                    removeConfig((oldRecord as ConfigItem).id);
                                    addRealtimeChange({
                                        moduleKey: MODULE_KEY,
                                        moduleName: 'Configuración',
                                        table: 'config',
                                        eventType: 'DELETE',
                                        recordId: (oldRecord as ConfigItem).id,
                                        recordName: (oldRecord as ConfigItem).concepto,
                                    });
                                }
                                break;
                        }
                    } catch (error) {
                        console.error('Error handling config realtime event:', error);
                    }
                }
            )
            .on('system', {}, handleSystemEvent)
            .subscribe();
        
        channelsRef.current.push(configChannel);
        
        // Canal para firmas
        const firmasChannel = supabase
            .channel('admin-firmas-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'firmas' },
                async (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;
                    updateLastEventReceived(MODULE_KEY);
                    
                    try {
                        switch (eventType) {
                            case 'INSERT':
                                if (newRecord) {
                                    addFirma(newRecord as Firma);
                                    addRealtimeChange({
                                        moduleKey: MODULE_KEY,
                                        moduleName: 'Admin',
                                        table: 'firmas',
                                        eventType: 'INSERT',
                                        recordId: (newRecord as Firma).id,
                                        recordName: (newRecord as Firma).nombre ?? undefined,
                                    });
                                }
                                break;
                            case 'UPDATE':
                                if (newRecord) {
                                    updateFirma((newRecord as Firma).id, newRecord as Firma);
                                    addRealtimeChange({
                                        moduleKey: MODULE_KEY,
                                        moduleName: 'Admin',
                                        table: 'firmas',
                                        eventType: 'UPDATE',
                                        recordId: (newRecord as Firma).id,
                                        recordName: (newRecord as Firma).nombre ?? undefined,
                                    });
                                }
                                break;
                            case 'DELETE':
                                if (oldRecord) {
                                    removeFirma((oldRecord as Firma).id);
                                    addRealtimeChange({
                                        moduleKey: MODULE_KEY,
                                        moduleName: 'Admin',
                                        table: 'firmas',
                                        eventType: 'DELETE',
                                        recordId: (oldRecord as Firma).id,
                                        recordName: (oldRecord as Firma).nombre ?? undefined,
                                    });
                                }
                                break;
                        }
                    } catch (error) {
                        console.error('Error handling firmas realtime event:', error);
                    }
                }
            )
            .on('system', {}, handleSystemEvent)
            .subscribe();
        
        channelsRef.current.push(firmasChannel);
        
        } finally {
            isSettingUpChannelsRef.current = false;
        }
        
    }, [updateLastEventReceived, addDirectorio, updateDirectorio, removeDirectorio, addArea, updateArea, removeArea, addDirectorioArea, removeDirectorioArea, addConfig, updateConfig, removeConfig, addFirma, updateFirma, removeFirma, addRealtimeChange, handleSystemEvent]);
    
    const handleReconnection = useCallback(async () => {
        const state = indexationState;
        if (!state) return;
        
        if (state.reconnectionAttempts >= state.maxReconnectionAttempts) {
            updateReconnectionStatus(MODULE_KEY, 'failed');
            return;
        }
        
        updateReconnectionStatus(MODULE_KEY, 'reconnecting');
        
        const delay = Math.min(
            RECONNECTION_CONFIG.baseDelay * Math.pow(RECONNECTION_CONFIG.multiplier, state.reconnectionAttempts),
            RECONNECTION_CONFIG.maxDelay
        );
        
        reconnectionTimeoutRef.current = setTimeout(async () => {
            incrementReconnectionAttempts(MODULE_KEY);
            await setupRealtimeSubscriptions();
        }, delay);
    }, [indexationState, updateReconnectionStatus, incrementReconnectionAttempts, setupRealtimeSubscriptions]);
    
    const handleReconciliation = useCallback(async () => {
        const state = indexationState;
        if (!state || !state.disconnectedAt) return;
        
        const disconnectionDuration = Date.now() - new Date(state.disconnectedAt).getTime();
        
        if (disconnectionDuration > 5000) {
            updateReconnectionStatus(MODULE_KEY, 'reconciling');
            await new Promise(resolve => setTimeout(resolve, 1000));
            updateReconnectionStatus(MODULE_KEY, 'idle');
        } else {
            updateReconnectionStatus(MODULE_KEY, 'idle');
        }
        
        resetReconnectionAttempts(MODULE_KEY);
        setDisconnectedAt(MODULE_KEY, null);
    }, [indexationState, updateReconnectionStatus, resetReconnectionAttempts, setDisconnectedAt]);
    
    // ============================================================================
    // INICIALIZACIÓN
    // ============================================================================
    
    const isStoreHydrated = useHydrationStore(state => state.isHydrated('admin'));
    
    useEffect(() => {
        if (isInitializedRef.current || !isStoreHydrated) return;
        
        if (typeof window === 'undefined') return;
        
        const initialize = async () => {
            initializeModule(MODULE_KEY);
            
            try {
                const response = await fetch('/api/auth/session', {
                    credentials: 'include',
                });
                
                if (!response.ok) return;
                
                const sessionData = await response.json();
                if (!sessionData.isAuthenticated) return;
            } catch (error) {
                console.error('Error checking authentication:', error);
                return;
            }
            
            const currentState = useIndexationStore.getState().modules[MODULE_KEY];
            const currentDirectorio = useAdminStore.getState().directorio;
            const currentAreas = useAdminStore.getState().areas;
            const currentConfig = useAdminStore.getState().config;
            const currentFirmas = useAdminStore.getState().firmas;
            
            const hasDataInIndexedDB = 
                currentDirectorio.length > 0 || 
                currentAreas.length > 0 || 
                currentConfig.length > 0 || 
                currentFirmas.length > 0;
            
            const isAlreadyIndexed = currentState?.isIndexed && currentState?.lastIndexedAt;
            
            if (isAlreadyIndexed) {
                completeIndexation(MODULE_KEY);
                if (channelsRef.current.length === 0) {
                    await setupRealtimeSubscriptions();
                }
            } else {
                await indexData();
            }
            
            isInitializedRef.current = true;
        };
        
        initialize();
        
        return () => {
            if (reconnectionTimeoutRef.current) {
                clearTimeout(reconnectionTimeoutRef.current);
            }
            for (const channel of channelsRef.current) {
                supabase.removeChannel(channel);
            }
            channelsRef.current = [];
            isSettingUpChannelsRef.current = false;
        };
    }, [initializeModule, indexData, isStoreHydrated, completeIndexation]);
    
    return {
        isIndexing: indexationState?.isIndexing ?? false,
        isIndexed: indexationState?.isIndexed ?? false,
        progress: indexationState?.progress ?? 0,
        currentStage: indexationState?.currentStage ?? null,
        error: indexationState?.error ?? null,
        realtimeConnected: indexationState?.realtimeConnected ?? false,
        reconnectionStatus: indexationState?.reconnectionStatus ?? 'idle',
        reconnectionAttempts: indexationState?.reconnectionAttempts ?? 0,
        maxReconnectionAttempts: indexationState?.maxReconnectionAttempts ?? 5,
        directorio,
        areas,
        directorioAreas,
        config,
        firmas,
        reindex: indexData,
    };
}
