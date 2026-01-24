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
import supabase from '@/app/lib/supabase/client';
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
    
    const indexData = useCallback(async () => {
        if (isIndexingRef.current) {
            console.warn('⚠️ Indexation already in progress for Admin');
            return;
        }
        
        isIndexingRef.current = true;
        
        try {
            startIndexation(MODULE_KEY);
            let accumulatedProgress = 0;
            
            // Stage 1: Cargar directorio
            const stage1 = STAGES[0];
            updateProgress(MODULE_KEY, accumulatedProgress, stage1.label);
            console.log(`📦 Starting stage: ${stage1.label}`);
            
            const fetchedDirectorio = await withExponentialBackoff(
                async () => {
                    const { data, error } = await supabase
                        .from('directorio')
                        .select('*')
                        .order('id_directorio', { ascending: true });
                    if (error) throw error;
                    return data as Directorio[];
                },
                FETCH_RETRY_CONFIG
            );
            
            setDirectorio(fetchedDirectorio);
            accumulatedProgress += stage1.weight;
            updateProgress(MODULE_KEY, accumulatedProgress, stage1.label);
            console.log(`✅ Stage completed: ${stage1.label} (${fetchedDirectorio.length} registros)`);
            
            // Stage 2: Cargar áreas
            const stage2 = STAGES[1];
            updateProgress(MODULE_KEY, accumulatedProgress, stage2.label);
            console.log(`📦 Starting stage: ${stage2.label}`);
            
            const fetchedAreas = await withExponentialBackoff(
                async () => {
                    const { data, error } = await supabase
                        .from('area')
                        .select('*')
                        .order('nombre', { ascending: true });
                    if (error) throw error;
                    return data as Area[];
                },
                FETCH_RETRY_CONFIG
            );
            
            setAreas(fetchedAreas);
            accumulatedProgress += stage2.weight;
            updateProgress(MODULE_KEY, accumulatedProgress, stage2.label);
            console.log(`✅ Stage completed: ${stage2.label} (${fetchedAreas.length} registros)`);
            
            // Stage 3: Cargar relaciones directorio_areas
            const stage3 = STAGES[2];
            updateProgress(MODULE_KEY, accumulatedProgress, stage3.label);
            console.log(`📦 Starting stage: ${stage3.label}`);
            
            const fetchedDirectorioAreas = await withExponentialBackoff(
                async () => {
                    const { data, error } = await supabase
                        .from('directorio_areas')
                        .select('*');
                    if (error) throw error;
                    return data as DirectorioArea[];
                },
                FETCH_RETRY_CONFIG
            );
            
            setDirectorioAreas(fetchedDirectorioAreas);
            accumulatedProgress += stage3.weight;
            updateProgress(MODULE_KEY, accumulatedProgress, stage3.label);
            console.log(`✅ Stage completed: ${stage3.label} (${fetchedDirectorioAreas.length} registros)`);
            
            // Stage 4: Cargar config
            const stage4 = STAGES[3];
            updateProgress(MODULE_KEY, accumulatedProgress, stage4.label);
            console.log(`📦 Starting stage: ${stage4.label}`);
            
            const fetchedConfig = await withExponentialBackoff(
                async () => {
                    const { data, error } = await supabase
                        .from('config')
                        .select('*')
                        .order('id', { ascending: true });
                    if (error) throw error;
                    return data as ConfigItem[];
                },
                FETCH_RETRY_CONFIG
            );
            
            setConfig(fetchedConfig);
            accumulatedProgress += stage4.weight;
            updateProgress(MODULE_KEY, accumulatedProgress, stage4.label);
            console.log(`✅ Stage completed: ${stage4.label} (${fetchedConfig.length} registros)`);
            
            // Stage 5: Cargar firmas
            const stage5 = STAGES[4];
            updateProgress(MODULE_KEY, accumulatedProgress, stage5.label);
            console.log(`📦 Starting stage: ${stage5.label}`);
            
            const fetchedFirmas = await withExponentialBackoff(
                async () => {
                    const { data, error } = await supabase
                        .from('firmas')
                        .select('*')
                        .order('id', { ascending: true });
                    if (error) throw error;
                    return data as Firma[];
                },
                FETCH_RETRY_CONFIG
            );
            
            setFirmas(fetchedFirmas);
            accumulatedProgress += stage5.weight;
            updateProgress(MODULE_KEY, accumulatedProgress, stage5.label);
            console.log(`✅ Stage completed: ${stage5.label} (${fetchedFirmas.length} registros)`);
            
            // Stage 6: Configurar realtime
            const stage6 = STAGES[5];
            updateProgress(MODULE_KEY, accumulatedProgress, stage6.label);
            console.log(`📡 Starting stage: ${stage6.label}`);
            
            await setupRealtimeSubscriptions();
            
            accumulatedProgress += stage6.weight;
            updateProgress(MODULE_KEY, accumulatedProgress, stage6.label);
            console.log(`✅ Stage completed: ${stage6.label}`);
            
            completeIndexation(MODULE_KEY);
            console.log(`🎉 Indexation completed for Admin`);
            
        } catch (error) {
            console.error('❌ Error indexing Admin:', error);
            setError(MODULE_KEY, error instanceof Error ? error.message : 'Error al indexar datos administrativos');
        } finally {
            isIndexingRef.current = false;
        }
    }, [startIndexation, updateProgress, completeIndexation, setError, setDirectorio, setAreas, setDirectorioAreas, setConfig, setFirmas]);
    
    const setupRealtimeSubscriptions = useCallback(async () => {
        // Limpiar canales existentes
        for (const channel of channelsRef.current) {
            await supabase.removeChannel(channel);
        }
        channelsRef.current = [];
        
        console.log('📡 Setting up realtime subscriptions for Admin tables');
        
        // Canal para directorio
        const directorioChannel = supabase
            .channel('directorio-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'directorio' },
                async (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;
                    console.log(`🔔 Realtime event: ${eventType} on directorio`, payload);
                    updateLastEventReceived(MODULE_KEY);
                    
                    try {
                        switch (eventType) {
                            case 'INSERT':
                                if (newRecord) addDirectorio(newRecord as Directorio);
                                break;
                            case 'UPDATE':
                                if (newRecord) updateDirectorio((newRecord as Directorio).id_directorio, newRecord as Directorio);
                                break;
                            case 'DELETE':
                                if (oldRecord) removeDirectorio((oldRecord as Directorio).id_directorio);
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
            .channel('area-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'area' },
                async (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;
                    console.log(`🔔 Realtime event: ${eventType} on area`, payload);
                    updateLastEventReceived(MODULE_KEY);
                    
                    try {
                        switch (eventType) {
                            case 'INSERT':
                                if (newRecord) addArea(newRecord as Area);
                                break;
                            case 'UPDATE':
                                if (newRecord) updateArea((newRecord as Area).id_area, newRecord as Area);
                                break;
                            case 'DELETE':
                                if (oldRecord) removeArea((oldRecord as Area).id_area);
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
            .channel('directorio-areas-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'directorio_areas' },
                async (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;
                    console.log(`🔔 Realtime event: ${eventType} on directorio_areas`, payload);
                    updateLastEventReceived(MODULE_KEY);
                    
                    try {
                        switch (eventType) {
                            case 'INSERT':
                                if (newRecord) addDirectorioArea(newRecord as DirectorioArea);
                                break;
                            case 'DELETE':
                                if (oldRecord) removeDirectorioArea((oldRecord as DirectorioArea).id);
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
            .channel('config-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'config' },
                async (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;
                    console.log(`🔔 Realtime event: ${eventType} on config`, payload);
                    updateLastEventReceived(MODULE_KEY);
                    
                    try {
                        switch (eventType) {
                            case 'INSERT':
                                if (newRecord) addConfig(newRecord as ConfigItem);
                                break;
                            case 'UPDATE':
                                if (newRecord) updateConfig((newRecord as ConfigItem).id, newRecord as ConfigItem);
                                break;
                            case 'DELETE':
                                if (oldRecord) removeConfig((oldRecord as ConfigItem).id);
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
            .channel('firmas-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'firmas' },
                async (payload) => {
                    const { eventType, new: newRecord, old: oldRecord } = payload;
                    console.log(`🔔 Realtime event: ${eventType} on firmas`, payload);
                    updateLastEventReceived(MODULE_KEY);
                    
                    try {
                        switch (eventType) {
                            case 'INSERT':
                                if (newRecord) addFirma(newRecord as Firma);
                                break;
                            case 'UPDATE':
                                if (newRecord) updateFirma((newRecord as Firma).id, newRecord as Firma);
                                break;
                            case 'DELETE':
                                if (oldRecord) removeFirma((oldRecord as Firma).id);
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
        
    }, [updateLastEventReceived, addDirectorio, updateDirectorio, removeDirectorio, addArea, updateArea, removeArea, addDirectorioArea, removeDirectorioArea, addConfig, updateConfig, removeConfig, addFirma, updateFirma, removeFirma]);
    
    const handleSystemEvent = useCallback((payload: any) => {
        const { status } = payload;
        const wasConnected = indexationState?.realtimeConnected ?? false;
        const isConnected = status === 'SUBSCRIBED' || status === 'ok';
        
        console.log(`📡 Realtime status changed: ${status} (Admin)`);
        
        updateRealtimeConnection(MODULE_KEY, isConnected);
        
        if (wasConnected && !isConnected) {
            console.warn('⚠️ Realtime disconnected (Admin)');
            setDisconnectedAt(MODULE_KEY, new Date().toISOString());
            handleReconnection();
        }
        
        if (!wasConnected && isConnected) {
            console.log('✅ Realtime reconnected (Admin)');
            handleReconciliation();
        }
    }, [indexationState?.realtimeConnected, updateRealtimeConnection, setDisconnectedAt]);
    
    const handleReconnection = useCallback(async () => {
        const state = indexationState;
        if (!state) return;
        
        if (state.reconnectionAttempts >= state.maxReconnectionAttempts) {
            console.error('❌ Max reconnection attempts reached (Admin)');
            updateReconnectionStatus(MODULE_KEY, 'failed');
            return;
        }
        
        updateReconnectionStatus(MODULE_KEY, 'reconnecting');
        
        const delay = Math.min(
            RECONNECTION_CONFIG.baseDelay * Math.pow(RECONNECTION_CONFIG.multiplier, state.reconnectionAttempts),
            RECONNECTION_CONFIG.maxDelay
        );
        
        console.log(
            `🔄 Reconnecting Admin in ${delay}ms ` +
            `(attempt ${state.reconnectionAttempts + 1}/${state.maxReconnectionAttempts})`
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
        const disconnectionSeconds = Math.floor(disconnectionDuration / 1000);
        
        console.log(`🔄 Reconciling data after ${disconnectionSeconds}s disconnection (Admin)`);
        
        if (disconnectionDuration > 5000) {
            updateReconnectionStatus(MODULE_KEY, 'reconciling');
            await new Promise(resolve => setTimeout(resolve, 1000));
            updateReconnectionStatus(MODULE_KEY, 'idle');
            console.log('✅ Reconciliation completed (Admin)');
        } else {
            updateReconnectionStatus(MODULE_KEY, 'idle');
            console.log('✅ Reconnected (no reconciliation needed) (Admin)');
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
        
        // Solo ejecutar en el cliente (navegador)
        if (typeof window === 'undefined') return;
        
        const initialize = async () => {
            initializeModule(MODULE_KEY);
            
            try {
                const response = await fetch('/api/auth/session', {
                    credentials: 'include',
                });
                
                if (!response.ok) {
                    console.warn('⚠️ Not authenticated, skipping indexation (Admin)');
                    return;
                }
                
                const sessionData = await response.json();
                if (!sessionData.isAuthenticated) {
                    console.warn('⚠️ Not authenticated, skipping indexation (Admin)');
                    return;
                }
            } catch (error) {
                console.error('Error checking authentication:', error);
                return;
            }
            
            // Verificar si ya hay datos en IndexedDB
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
            
            console.log('🔍 [ADMIN] Verificando estado de indexación:', {
                moduleKey: MODULE_KEY,
                isIndexed: currentState?.isIndexed,
                directorioCount: currentDirectorio.length,
                areasCount: currentAreas.length,
                configCount: currentConfig.length,
                firmasCount: currentFirmas.length,
                hasDataInIndexedDB,
                isAlreadyIndexed,
                lastIndexedAt: currentState?.lastIndexedAt,
                isStoreHydrated,
            });
            
            if (isAlreadyIndexed) {
                console.log('✅ [ADMIN] Already indexed, skipping indexation');
                completeIndexation(MODULE_KEY);
                await setupRealtimeSubscriptions();
            } else {
                console.log('⚠️ [ADMIN] Not indexed yet, starting full indexation');
                await indexData();
            }
            
            isInitializedRef.current = true;
        };
        
        initialize();
        
        return () => {
            if (reconnectionTimeoutRef.current) {
                clearTimeout(reconnectionTimeoutRef.current);
            }
            // Limpiar canales al desmontar
            for (const channel of channelsRef.current) {
                supabase.removeChannel(channel);
            }
        };
    }, [initializeModule, indexData, setupRealtimeSubscriptions, isStoreHydrated, completeIndexation]);
    
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
