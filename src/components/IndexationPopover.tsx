/**
 * IndexationPopover Component
 * 
 * Componente flotante que muestra el estado de indexación de todos los módulos.
 * Se posiciona en la esquina superior derecha debajo del header y muestra:
 * - Progreso de indexación con barra animada
 * - Estado de cada módulo (indexando, completado, error)
 * - Errores de conexión y reconexión
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
import { useTheme } from '@/context/ThemeContext';
import { Check, AlertTriangle, RefreshCw, WifiOff, Loader2, Database } from 'lucide-react';
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
    
    // Solo llamar hooks si no estamos en login
    const shouldIndex = pathname !== '/login';
    
    // Hooks de indexación - solo se ejecutan si shouldIndex es true
    const ineaState = useIneaIndexation();
    const iteaState = useIteaIndexation();
    const noListadoState = useNoListadoIndexation();
    const resguardosState = useResguardosIndexation();
    const ineaObsState = useIneaObsoletosIndexation();
    const iteaObsState = useIteaObsoletosIndexation();
    const resguardosBajasState = useResguardosBajasIndexation();
    
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());
    const [showSuccessFlash, setShowSuccessFlash] = useState<string | null>(null);
    const [isAbsorbing, setIsAbsorbing] = useState(false);
    
    const prevStatesRef = useRef<Record<string, { isIndexing: boolean; isIndexed: boolean }>>({});
    const absorbTimerRef = useRef<NodeJS.Timeout | null>(null);
    const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Módulos para iterar
    const modules: ModuleState[] = useMemo(() => [
        { key: 'inea', name: 'INEA', state: ineaState, config: MODULE_CONFIGS.inea, count: ineaState.muebles.length },
        { key: 'itea', name: 'ITEA', state: iteaState, config: MODULE_CONFIGS.itea, count: iteaState.muebles.length },
        { key: 'ineaObsoletos', name: 'INEA Obsoletos', state: ineaObsState, config: MODULE_CONFIGS.ineaObsoletos, count: ineaObsState.muebles.length },
        { key: 'iteaObsoletos', name: 'ITEA Obsoletos', state: iteaObsState, config: MODULE_CONFIGS.iteaObsoletos, count: iteaObsState.muebles.length },
        { key: 'noListado', name: 'No Listado', state: noListadoState, config: MODULE_CONFIGS.noListado, count: noListadoState.muebles.length },
        { key: 'resguardos', name: 'Resguardos', state: resguardosState, config: MODULE_CONFIGS.resguardos, count: resguardosState.resguardos.length },
        { key: 'resguardosBajas', name: 'Resguardos Bajas', state: resguardosBajasState, config: MODULE_CONFIGS.resguardosBajas, count: resguardosBajasState.resguardos.length },
    ], [ineaState, iteaState, ineaObsState, iteaObsState, noListadoState, resguardosState, resguardosBajasState]);

    const activeModules = useMemo(() => {
        return modules.filter(module => {
            // Don't show if dismissed
            if (dismissed.has(module.key)) return false;
            
            // Don't show success state if count is 0
            if (module.state.isIndexed && !module.state.isIndexing && !module.state.error && module.count === 0) {
                return false;
            }
            
            // Show if indexing, has error, is indexed (with count > 0), or reconnecting
            return module.state.isIndexing || 
                   module.state.error || 
                   module.state.isIndexed || 
                   module.state.reconnectionStatus !== 'idle';
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
        
        // Debug para producción
        if (process.env.NODE_ENV === 'production') {
            console.log('📊 [IndexationPopover] Stats:', {
                activeModules: activeModules.map(m => ({
                    key: m.key,
                    name: m.name,
                    isIndexing: m.state.isIndexing,
                    isIndexed: m.state.isIndexed,
                    error: m.state.error,
                    count: m.count,
                })),
                stats: { indexing, indexed, errors }
            });
        }
        
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
                }, 1200);
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

    // No mostrar en la página de login o si no hay módulos activos
    if (pathname === '/login' || activeModules.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 z-40">
            {/* Success particles */}
            <AnimatePresence>
                {isAbsorbing && showSuccessFlash && (
                    <>
                        {[...Array(8)].map((_, i) => {
                            const module = modules.find(m => m.key === showSuccessFlash);
                            const glowColor = module?.config.glowColor || '#3b82f6';
                            return (
                                <motion.div
                                    key={`p-${i}`}
                                    className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
                                    style={{ background: glowColor }}
                                    initial={{ x: -60 - (i * 12), y: -25 + Math.sin(i) * 35, scale: 1.2, opacity: 1 }}
                                    animate={{ x: 10, y: 15, scale: 0, opacity: 0 }}
                                    transition={{ duration: 0.5, delay: i * 0.03, ease: [0.32, 0.72, 0, 1] }}
                                />
                            );
                        })}
                        <motion.div
                            className="absolute pointer-events-none z-10"
                            initial={{ x: -70, y: 5, scale: 1.3, opacity: 1 }}
                            animate={{ x: 15, y: 12, scale: 0, opacity: 0 }}
                            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
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
                    </>
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
                    scale: isAbsorbing ? [1, 1.05, 0.97, 1.01, 1] : 1,
                }}
                transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                    scale: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] },
                }}
            >
                {/* Flash overlay */}
                <AnimatePresence>
                    {isAbsorbing && showSuccessFlash && (() => {
                        const module = modules.find(m => m.key === showSuccessFlash);
                        const glowColor = module?.config.glowColor || '#3b82f6';
                        return (
                            <motion.div
                                className="absolute inset-0 pointer-events-none z-20 rounded-2xl"
                                style={{ background: glowColor }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 0.35, 0] }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.45 }}
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
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.08 }}
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
        </div>
    );
}
