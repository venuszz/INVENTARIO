/**
 * IndexationPopover Component
 * 
 * Componente flotante que muestra el estado de indexación de todos los módulos
 * y las notificaciones de cambios en tiempo real.
 * Se posiciona en la esquina superior derecha debajo del header y muestra:
 * - Progreso de indexación con barra animada
 * - Estado de cada módulo (indexando, completado, error)
 * - Errores de conexión y reconexión
 * - Notificaciones de cambios en tiempo real (INSERT, UPDATE, DELETE)
 * - Auto-hide después de completar todos los módulos
 * - Animaciones de partículas al completar
 * 
 * @component
 */
"use client"
import { useIneaIndexation } from '@/hooks/indexation/useIneaIndexation';
import { useIteaIndexation } from '@/hooks/indexation/useIteaIndexation';
import { useNoListadoIndexation } from '@/hooks/indexation/useNoListadoIndexation';
import { useResguardosIndexation } from '@/hooks/indexation/useResguardosIndexation';
import { useIneaObsoletosIndexation } from '@/hooks/indexation/useIneaObsoletosIndexation';
import { useIteaObsoletosIndexation } from '@/hooks/indexation/useIteaObsoletosIndexation';
import { useResguardosBajasIndexation } from '@/hooks/indexation/useResguardosBajasIndexation';
import { useAdminIndexation } from '@/hooks/indexation/useAdminIndexation';
import { useIndexationStore } from '@/stores/indexationStore';
import { useTheme } from '@/context/ThemeContext';
import { Check, AlertTriangle, RefreshCw, WifiOff, Loader2, Database, Plus, Edit2, Trash2, Bell } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MODULE_CONFIGS } from '@/config/modules';

interface ModuleState {
    key: string;
    name: string;
    state: any;
    config: any;
    count: number;
}

export default function IndexationPopover() {
    const pathname = usePathname();
    const { isDarkMode } = useTheme();
    
    // No renderizar en el servidor
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
    }, []);
    
    // Hooks de indexación
    const ineaState = useIneaIndexation();
    const iteaState = useIteaIndexation();
    const noListadoState = useNoListadoIndexation();
    const resguardosState = useResguardosIndexation();
    const ineaObsState = useIneaObsoletosIndexation();
    const iteaObsState = useIteaObsoletosIndexation();
    const resguardosBajasState = useResguardosBajasIndexation();
    const adminState = useAdminIndexation();
    
    // Obtener eventos de cambios en tiempo real
    const realtimeChanges = useIndexationStore(state => state.realtimeChanges);
    const dismissRealtimeChange = useIndexationStore(state => state.dismissRealtimeChange);
    
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const [showSuccessFlash, setShowSuccessFlash] = useState<string | null>(null);
    const [isAbsorbing, setIsAbsorbing] = useState(false);
    
    const prevStatesRef = useRef<Record<string, { isIndexing: boolean; isIndexed: boolean }>>({});
    const absorbTimerRef = useRef<NodeJS.Timeout | null>(null);
    const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Módulos para iterar
    const modules: ModuleState[] = useMemo(() => [
        { key: 'inea', name: 'INEA', state: ineaState, config: MODULE_CONFIGS.inea, count: ineaState.muebles?.length || 0 },
        { key: 'itea', name: 'ITEA', state: iteaState, config: MODULE_CONFIGS.itea, count: iteaState.muebles?.length || 0 },
        { key: 'ineaObsoletos', name: 'INEA Obsoletos', state: ineaObsState, config: MODULE_CONFIGS.ineaObsoletos, count: ineaObsState.muebles?.length || 0 },
        { key: 'iteaObsoletos', name: 'ITEA Obsoletos', state: iteaObsState, config: MODULE_CONFIGS.iteaObsoletos, count: iteaObsState.muebles?.length || 0 },
        { key: 'noListado', name: 'No Listado', state: noListadoState, config: MODULE_CONFIGS.noListado, count: noListadoState.muebles?.length || 0 },
        { key: 'resguardos', name: 'Resguardos', state: resguardosState, config: MODULE_CONFIGS.resguardos, count: resguardosState.resguardos?.length || 0 },
        { key: 'resguardosBajas', name: 'Resguardos Bajas', state: resguardosBajasState, config: MODULE_CONFIGS.resguardosBajas, count: resguardosBajasState.resguardos?.length || 0 },
        { key: 'admin', name: 'Admin', state: adminState, config: MODULE_CONFIGS.admin, count: (adminState.directorio?.length || 0) + (adminState.areas?.length || 0) + (adminState.config?.length || 0) + (adminState.firmas?.length || 0) },
    ], [ineaState, iteaState, ineaObsState, iteaObsState, noListadoState, resguardosState, resguardosBajasState, adminState]);

    const activeModules = useMemo(() => {
        return modules.filter(module => {
            // Don't show if dismissed
            if (dismissed.has(module.key)) return false;
            
            // Show if indexing
            if (module.state.isIndexing) return true;
            
            // Show if has error
            if (module.state.error) return true;
            
            // Show if reconnecting or reconciling
            if (module.state.reconnectionStatus !== 'idle') return true;
            
            // IMPORTANTE: NO mostrar módulos indexados con 0 registros
            // Estos módulos vacíos no necesitan aparecer en el popover
            if (module.state.isIndexed && !module.state.isIndexing && module.count === 0) return false;
            
            // Show if indexed successfully with data (count > 0)
            if (module.state.isIndexed && !module.state.isIndexing && module.count > 0) return true;
            
            return false;
        });
    }, [modules, dismissed]);

    const stats = useMemo(() => {
        let indexing = 0;
        let indexed = 0;
        let errors = 0;
        activeModules.forEach(module => {
            if (module.state.isIndexing) indexing++;
            if (module.state.isIndexed && !module.state.isIndexing) indexed++;
            if (module.state.error) errors++;
        });
        
        return { indexing, indexed, errors };
    }, [activeModules]);

    // Detectar cuando un módulo completa la indexación
    useEffect(() => {
        modules.forEach(module => {
            const prev = prevStatesRef.current[module.key] || { isIndexing: false, isIndexed: false };
            if (prev.isIndexing && !module.state.isIndexing && module.state.isIndexed && !module.state.error) {
                setShowSuccessFlash(module.key);
                setIsAbsorbing(true);
                if (absorbTimerRef.current) clearTimeout(absorbTimerRef.current);
                absorbTimerRef.current = setTimeout(() => {
                    setShowSuccessFlash(null);
                    setIsAbsorbing(false);
                }, 800); // Reducido de 1200ms a 800ms para más estabilidad
            }
            prevStatesRef.current[module.key] = { isIndexing: module.state.isIndexing, isIndexed: module.state.isIndexed };
        });
    }, [modules]);

    // Auto-hide después de 5 segundos cuando todo está completo
    useEffect(() => {
        if (stats.indexing === 0 && stats.errors === 0 && stats.indexed > 0) {
            if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
            autoHideTimerRef.current = setTimeout(() => {
                setDismissed(prev => {
                    const next = new Set(prev);
                    activeModules.forEach(module => {
                        if (module.state.isIndexed && !module.state.isIndexing && !module.state.error) {
                            next.add(module.key);
                        }
                    });
                    return next;
                });
            }, 5000);
        }
        return () => {
            if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
        };
    }, [stats, activeModules]);

    // Mostrar módulos que están indexando aunque estén dismissed
    useEffect(() => {
        modules.forEach(module => {
            if (module.state.isIndexing && dismissed.has(module.key)) {
                setDismissed(prev => {
                    const next = new Set(prev);
                    next.delete(module.key);
                    return next;
                });
            }
        });
    }, [modules, dismissed]);

    useEffect(() => {
        return () => {
            if (absorbTimerRef.current) clearTimeout(absorbTimerRef.current);
            if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
        };
    }, []);

    // No mostrar en el servidor, en la página de login o si no hay módulos activos ni cambios
    if (!isMounted || pathname === '/login' || (activeModules.length === 0 && realtimeChanges.filter(c => !c.dismissed).length === 0)) return null;

    // Obtener el ícono según el tipo de evento
    const getEventIcon = (eventType: string) => {
        switch (eventType) {
            case 'INSERT': return Plus;
            case 'UPDATE': return Edit2;
            case 'DELETE': return Trash2;
            default: return Bell;
        }
    };

    // Obtener el color según el tipo de evento
    const getEventColor = (eventType: string) => {
        switch (eventType) {
            case 'INSERT': return '#10b981'; // green
            case 'UPDATE': return '#3b82f6'; // blue
            case 'DELETE': return '#ef4444'; // red
            default: return '#6b7280'; // gray
        }
    };

    // Obtener el texto según el tipo de evento
    const getEventText = (eventType: string) => {
        switch (eventType) {
            case 'INSERT': return 'Agregado';
            case 'UPDATE': return 'Actualizado';
            case 'DELETE': return 'Eliminado';
            default: return 'Cambio';
        }
    };

    return (
        <div className="fixed top-20 right-4 z-40 flex flex-col gap-2 max-w-sm">
            {/* Notificaciones de cambios en tiempo real */}
            <AnimatePresence>
                {realtimeChanges
                    .filter(change => !change.dismissed)
                    .slice(0, 3) // Mostrar solo las últimas 3
                    .map((change) => {
                        const EventIcon = getEventIcon(change.eventType);
                        const eventColor = getEventColor(change.eventType);
                        const eventText = getEventText(change.eventType);
                        
                        return (
                            <motion.div
                                key={change.id}
                                className={`${
                                    isDarkMode ? 'bg-black text-white border-white/10' : 'bg-white text-black border-black/10'
                                } shadow-2xl overflow-hidden select-none rounded-xl border backdrop-blur-sm`}
                                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 25,
                                }}
                            >
                                <div className="p-3 flex items-start gap-3">
                                    <motion.div
                                        className="p-2 rounded-xl flex-shrink-0"
                                        style={{ backgroundColor: `${eventColor}33` }}
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                    >
                                        <EventIcon className="w-4 h-4" style={{ color: eventColor }} />
                                    </motion.div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="text-xs font-semibold truncate" style={{ color: eventColor }}>
                                                {eventText}
                                            </span>
                                            <button
                                                onClick={() => dismissRealtimeChange(change.id)}
                                                className={`p-0.5 rounded hover:bg-opacity-20 transition-colors flex-shrink-0 ${
                                                    isDarkMode ? 'hover:bg-white' : 'hover:bg-black'
                                                }`}
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        
                                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            <div className="font-medium truncate">
                                                {change.table === 'config' ? 'CONFIGURACIÓN' : change.moduleName}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
            </AnimatePresence>

            {/* Popover de indexación (solo si hay módulos activos) */}
            {activeModules.length > 0 && (
                <>
                    {/* Success particles - simplificadas para estabilidad */}
                    <AnimatePresence>
                        {isAbsorbing && showSuccessFlash && (
                            <motion.div
                                className="absolute pointer-events-none z-10"
                                initial={{ x: -70, y: 5, scale: 1.2, opacity: 1 }}
                                animate={{ x: 15, y: 12, scale: 0, opacity: 0 }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                            >
                                {(() => {
                                    const module = modules.find(m => m.key === showSuccessFlash);
                                    const glowColor = module?.config.glowColor || '#3b82f6';
                                    return (
                                        <div 
                                            className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                                            style={{ 
                                                background: `linear-gradient(135deg, ${glowColor}, #10b981)`,
                                                boxShadow: `0 0 16px ${glowColor}`
                                            }}
                                        >
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    );
                                })()}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div
                        className={`${
                            isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
                        } shadow-2xl ${
                            isDarkMode ? 'shadow-black/25' : 'shadow-black/10'
                        } overflow-hidden select-none relative rounded-2xl border ${
                            isDarkMode ? 'border-white/10' : 'border-black/10'
                        }`}
                        initial={{ opacity: 0, x: 40, scale: 0.95 }}
                        animate={{ 
                            opacity: 1, 
                            x: 0, 
                            scale: 1,
                        }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 25,
                        }}
                    >
                {/* Flash overlay - simplificado */}
                <AnimatePresence>
                    {isAbsorbing && showSuccessFlash && (() => {
                        const module = modules.find(m => m.key === showSuccessFlash);
                        const glowColor = module?.config.glowColor || '#3b82f6';
                        return (
                            <motion.div
                                className="absolute inset-0 pointer-events-none z-20 rounded-2xl"
                                style={{ background: glowColor }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 0.2, 0] }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4, ease: 'easeInOut' }}
                            />
                        );
                    })()}
                </AnimatePresence>

                <div className="p-3 space-y-3">
                    {activeModules.map((module, index) => {
                        const Icon = module.config.icon;
                        const isSuccess = module.state.isIndexed && !module.state.isIndexing && !module.state.error;
                        const isError = !!module.state.error;
                        const isIndexing = module.state.isIndexing;
                        const isReconnecting = module.state.reconnectionStatus === 'reconnecting';
                        const isReconciling = module.state.reconnectionStatus === 'reconciling';
                        const reconnectionFailed = module.state.reconnectionStatus === 'failed';

                        return (
                            <motion.div
                                key={module.key}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                            >
                                {isIndexing ? (
                                    // Indexing state
                                    <div className="flex items-start gap-3">
                                        <motion.div
                                            className="p-2 rounded-xl"
                                            style={{ backgroundColor: `${module.config.glowColor}33` }}
                                            animate={{ opacity: [1, 0.5, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            <span style={{ color: module.config.glowColor }}>
                                                <Icon className="w-4 h-4" />
                                            </span>
                                        </motion.div>
                                        <div className="flex-1 pt-0.5 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] opacity-50 truncate max-w-[140px]">
                                                    {module.state.currentStage || 'Preparando...'}
                                                </span>
                                                <span className="text-xs font-bold tabular-nums opacity-70">
                                                    {Math.round(module.state.progress)}%
                                                </span>
                                            </div>
                                            <div className={`h-1.5 rounded-full overflow-hidden ${
                                                isDarkMode ? 'bg-white/10' : 'bg-black/10'
                                            }`}>
                                                <motion.div
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: module.config.glowColor, width: `${module.state.progress}%` }}
                                                    transition={{ duration: 0.2 }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : isSuccess && module.count > 0 ? (
                                    // Success state (only show if count > 0)
                                    <div className="flex items-center gap-3">
                                        <motion.div
                                            className="p-2 rounded-xl bg-gradient-to-br relative"
                                            style={{ 
                                                backgroundImage: `linear-gradient(to bottom right, ${module.config.glowColor}33, ${module.config.glowColor}1a)` 
                                            }}
                                            initial={{ scale: 0.8 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                        >
                                            <span style={{ color: module.config.glowColor }}>
                                                <Icon className="w-4 h-4" />
                                            </span>
                                            {/* Realtime connected indicator */}
                                            <motion.div
                                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center shadow-lg bg-emerald-500 shadow-emerald-500/40"
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
                                            >
                                                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                            </motion.div>
                                        </motion.div>
                                        <div className="flex items-center gap-2.5">
                                            <motion.div 
                                                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${
                                                    isDarkMode ? 'bg-white/5' : 'bg-black/5'
                                                }`}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.15 }}
                                            >
                                                <Database className="w-3 h-3 opacity-50" />
                                                <span className="text-xs font-semibold tabular-nums">{module.count}</span>
                                            </motion.div>
                                        </div>
                                    </div>
                                ) : isReconnecting || isReconciling ? (
                                    // Reconnecting/Reconciling state
                                    <div className="flex items-center gap-3">
                                        <motion.div
                                            className="p-2 rounded-xl relative"
                                            style={{ backgroundColor: `${module.config.glowColor}33` }}
                                            animate={{ opacity: [1, 0.6, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            <span style={{ color: module.config.glowColor }}>
                                                <Icon className="w-4 h-4" />
                                            </span>
                                            <motion.div
                                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center bg-yellow-500 shadow-lg shadow-yellow-500/40"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            >
                                                <Loader2 className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                            </motion.div>
                                        </motion.div>
                                        <div className="flex-1 flex flex-col gap-1">
                                            <span className="text-xs font-medium text-yellow-400">
                                                {isReconnecting ? 'Reconectando...' : 'Sincronizando...'}
                                            </span>
                                            <span className="text-[10px] opacity-50">
                                                {isReconnecting 
                                                    ? `Intento ${module.state.reconnectionAttempts + 1}/${module.state.maxReconnectionAttempts}`
                                                    : 'Recuperando datos perdidos'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                ) : reconnectionFailed ? (
                                    // Reconnection failed state
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-orange-500/20 relative">
                                            <span className="text-orange-400">
                                                <Icon className="w-4 h-4" />
                                            </span>
                                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center bg-orange-500 shadow-lg shadow-orange-500/40">
                                                <WifiOff className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                            </div>
                                        </div>
                                        <div className="flex-1 flex items-center justify-between">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs font-medium text-orange-400">Conexión perdida</span>
                                                <span className="text-[10px] opacity-50">Se recomienda reindexar</span>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => module.state.reindex?.()}
                                                className="p-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 transition-colors"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
                                            </motion.button>
                                        </div>
                                    </div>
                                ) : isError ? (
                                    // Error state
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-red-500/20">
                                            <span className="text-red-400">
                                                <Icon className="w-4 h-4" />
                                            </span>
                                        </div>
                                        <div className="flex-1 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                                                <span className="text-xs text-red-400/80 truncate max-w-[120px]">
                                                    {module.state.error || 'Error'}
                                                </span>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => module.state.reindex?.()}
                                                className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5 text-red-400" />
                                            </motion.button>
                                        </div>
                                    </div>
                                ) : null}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Auto-hide countdown */}
                {stats.indexing === 0 && stats.errors === 0 && stats.indexed > 0 && (
                    <div className="px-3 pb-2.5">
                        <motion.div
                            className={`h-0.5 rounded-full overflow-hidden ${
                                isDarkMode ? 'bg-white/5' : 'bg-black/5'
                            }`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <motion.div
                                className="h-full bg-blue-500/50 rounded-full"
                                initial={{ width: '100%' }}
                                animate={{ width: '0%' }}
                                transition={{ duration: 5, ease: 'linear' }}
                            />
                        </motion.div>
                    </div>
                )}
                    </motion.div>
                </>
            )}
        </div>
    );
}
