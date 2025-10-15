"use client"
import { useIneaIndexation } from '@/context/IneaIndexationContext';
import { useIteaIndexation } from '@/context/IteaIndexationContext';
import { useTheme } from '@/context/ThemeContext';
import { Loader2, CheckCircle2, Database, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function IndexationPopover() {
    const ineaState = useIneaIndexation();
    const iteaState = useIteaIndexation();
    const { isDarkMode } = useTheme();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [shouldHide, setShouldHide] = useState(false);

    // Determinar si están completos
    const isIneaComplete = ineaState.isComplete || (ineaState.progress >= ineaState.total && ineaState.total > 0);
    const isIteaComplete = iteaState.isComplete || (iteaState.progress >= iteaState.total && iteaState.total > 0);
    const isBothComplete = isIneaComplete && isIteaComplete;

    // Calcular progreso total combinado
    const totalProgress = ineaState.progress + iteaState.progress;
    const totalItems = ineaState.total + iteaState.total;
    const combinedPercentage = totalItems > 0 ? Math.round((totalProgress / totalItems) * 100) : 0;

    // Determinar estado visual
    const getStatus = () => {
        if (ineaState.error || iteaState.error) return 'error';
        if (isBothComplete) return 'complete';
        if (ineaState.isIndexing || iteaState.isIndexing) return 'indexing';
        if (ineaState.progress > 0 || iteaState.progress > 0) return 'loading';
        return 'ready';
    };

    const status = getStatus();

    // Lógica de visibilidad
    useEffect(() => {
        const hasActivity = 
            ineaState.isIndexing || ineaState.progress > 0 || ineaState.error !== null ||
            iteaState.isIndexing || iteaState.progress > 0 || iteaState.error !== null;
        setIsVisible(hasActivity);

        // Ocultar después de 3 segundos si ambos están completos
        if (isBothComplete && !ineaState.isIndexing && !iteaState.isIndexing) {
            const timer = setTimeout(() => {
                setShouldHide(true);
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            setShouldHide(false);
        }
    }, [ineaState.isIndexing, ineaState.progress, ineaState.error, iteaState.isIndexing, iteaState.progress, iteaState.error, isBothComplete]);

    // No mostrar si no hay actividad o debe ocultarse
    if (!isVisible || shouldHide) return null;

    // Componente de barra de progreso
    const ProgressBar = ({ progress, total, color }: { progress: number; total: number; color: string }) => {
        const percent = total > 0 ? (progress / total) * 100 : 0;
        return (
            <div className={`relative w-full h-1.5 rounded-full overflow-hidden ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-200'
            }`}>
                <div
                    className={`h-full transition-all duration-500 ease-in-out ${color} ${
                        status === 'indexing' ? 'animate-shimmer' : ''
                    }`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        );
    };

    // Ícono según estado
    const StatusIcon = () => {
        const iconClass = "w-4 h-4 transition-colors duration-300";
        switch (status) {
            case 'error':
                return <Activity className={`${iconClass} text-red-500`} />;
            case 'complete':
                return <CheckCircle2 className={`${iconClass} text-emerald-500`} />;
            case 'indexing':
                return <Loader2 className={`${iconClass} text-blue-500 animate-spin`} />;
            case 'loading':
                return <Database className={`${iconClass} ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />;
            default:
                return <Database className={`${iconClass} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />;
        }
    };

    // Texto de estado
    const statusText = () => {
        switch (status) {
            case 'error':
                return 'Error';
            case 'complete':
                return 'Completo';
            case 'indexing':
                return 'Indexando';
            default:
                return 'Cargando';
        }
    };

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 backdrop-blur-2xl shadow-2xl transition-all duration-500 ease-in-out ${
                isExpanded ? 'w-80 rounded-2xl' : 'w-52 rounded-3xl'
            } animate-fadeInRight ${
                isDarkMode 
                    ? 'bg-black/90 border border-white/20' 
                    : 'bg-white/95 border border-gray-200'
            }`}
        >
            {/* Indicador de actividad pulsante */}
            {status === 'indexing' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg" />
            )}

            {/* Header compacto */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full px-4 py-3 flex items-center gap-3 transition-all duration-300 rounded-t-2xl ${
                    isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100'
                }`}
            >
                <StatusIcon />
                <span className={`flex-1 text-sm font-medium text-left transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                    {statusText()}
                </span>
                {status === 'indexing' && (
                    <span className={`text-xs tabular-nums transition-colors duration-300 ${
                        isDarkMode ? 'text-white/60' : 'text-gray-500'
                    }`}>{combinedPercentage}%</span>
                )}
                {isExpanded ? (
                    <ChevronUp className={`w-4 h-4 transition-all duration-300 ${
                        isDarkMode ? 'text-white/60' : 'text-gray-500'
                    }`} />
                ) : (
                    <ChevronDown className={`w-4 h-4 transition-all duration-300 ${
                        isDarkMode ? 'text-white/60' : 'text-gray-500'
                    }`} />
                )}
            </button>

            {/* Barra de progreso en header cuando está colapsado */}
            {!isExpanded && status === 'indexing' && (
                <div className="px-4 pb-3 transition-all duration-500">
                    <ProgressBar progress={totalProgress} total={totalItems} color="bg-gradient-to-r from-blue-500 to-purple-500" />
                </div>
            )}

            {/* Contenido expandible */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-4 animate-fadeIn">
                    {/* Progreso de INEA */}
                    <div className="space-y-2 transition-all duration-300">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 transition-all duration-300" />
                                <span className={`font-medium transition-colors duration-300 ${
                                    isDarkMode ? 'text-white/80' : 'text-gray-700'
                                }`}>INEA</span>
                            </div>
                            <span className={`tabular-nums transition-colors duration-300 ${
                                isDarkMode ? 'text-white/60' : 'text-gray-500'
                            }`}>
                                {ineaState.progress.toLocaleString()} / {ineaState.total.toLocaleString()}
                            </span>
                        </div>
                        <ProgressBar
                            progress={ineaState.progress}
                            total={ineaState.total}
                            color={isIneaComplete ? 'bg-emerald-500' : 'bg-blue-500'}
                        />
                    </div>

                    {/* Progreso de ITEA */}
                    <div className="space-y-2 transition-all duration-300">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 transition-all duration-300" />
                                <span className={`font-medium transition-colors duration-300 ${
                                    isDarkMode ? 'text-white/80' : 'text-gray-700'
                                }`}>ITEA</span>
                            </div>
                            <span className={`tabular-nums transition-colors duration-300 ${
                                isDarkMode ? 'text-white/60' : 'text-gray-500'
                            }`}>
                                {iteaState.progress.toLocaleString()} / {iteaState.total.toLocaleString()}
                            </span>
                        </div>
                        <ProgressBar
                            progress={iteaState.progress}
                            total={iteaState.total}
                            color={isIteaComplete ? 'bg-emerald-500' : 'bg-purple-500'}
                        />
                    </div>

                    {/* Resumen */}
                    <div className={`pt-2 border-t transition-all duration-300 ${
                        isDarkMode ? 'border-white/10' : 'border-gray-200'
                    }`}>
                        <div className={`text-xs space-y-1 transition-colors duration-300 ${
                            isDarkMode ? 'text-white/60' : 'text-gray-500'
                        }`}>
                            <div className="flex justify-between">
                                <span>Total:</span>
                                <span className={`tabular-nums transition-colors duration-300 ${
                                    isDarkMode ? 'text-white/80' : 'text-gray-700'
                                }`}>
                                    {totalProgress.toLocaleString()} / {totalItems.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Estado:</span>
                                <span className={`transition-colors duration-300 ${
                                    isDarkMode ? 'text-white/80' : 'text-gray-700'
                                }`}>
                                    {isBothComplete ? 'Completo' : 'Cargando'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Mensajes de error si existen */}
                    {ineaState.error && (
                        <div className={`px-3 py-2 rounded-lg border transition-all duration-300 ${
                            isDarkMode 
                                ? 'bg-red-500/20 border-red-500/30' 
                                : 'bg-red-50 border-red-200'
                        }`}>
                            <p className={`text-xs transition-colors duration-300 ${
                                isDarkMode ? 'text-red-400' : 'text-red-600'
                            }`}>
                                <span className="font-bold">INEA:</span> {ineaState.error}
                            </p>
                        </div>
                    )}
                    {iteaState.error && (
                        <div className={`px-3 py-2 rounded-lg border transition-all duration-300 ${
                            isDarkMode 
                                ? 'bg-red-500/20 border-red-500/30' 
                                : 'bg-red-50 border-red-200'
                        }`}>
                            <p className={`text-xs transition-colors duration-300 ${
                                isDarkMode ? 'text-red-400' : 'text-red-600'
                            }`}>
                                <span className="font-bold">ITEA:</span> {iteaState.error}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
