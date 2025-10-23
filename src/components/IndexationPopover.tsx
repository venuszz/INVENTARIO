"use client"
import { useIneaIndexation } from '@/context/IneaIndexationContext';
import { useIteaIndexation } from '@/context/IteaIndexationContext';
import { useIneaObsoletosIndexation } from '@/context/IneaObsoletosIndexationContext';
import { useIteaObsoletosIndexation } from '@/context/IteaObsoletosIndexationContext';
import { useResguardosIndexation } from '@/context/ResguardosIndexationContext';
import { useResguardosBajasIndexation } from '@/context/ResguardosBajasIndexationContext';
import { useTheme } from '@/context/ThemeContext';
import { CheckCircle2, Database, AlertCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function IndexationPopover() {
    const ineaState = useIneaIndexation();
    const iteaState = useIteaIndexation();
    const ineaObsState = useIneaObsoletosIndexation();
    const iteaObsState = useIteaObsoletosIndexation();
    const resguardosState = useResguardosIndexation();
    const resguardosBajasState = useResguardosBajasIndexation();
    const { isDarkMode } = useTheme();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [shouldHide, setShouldHide] = useState(false);

    // Determinar si están completos
    const isIneaComplete = ineaState.isComplete || (ineaState.progress >= ineaState.total && ineaState.total > 0);
    const isIteaComplete = iteaState.isComplete || (iteaState.progress >= iteaState.total && iteaState.total > 0);
    const isIneaObsComplete = !ineaObsState.isIndexing && ineaObsState.data.length >= 0;
    const isIteaObsComplete = !iteaObsState.isIndexing && iteaObsState.data.length >= 0;
    const isResguardosComplete = !resguardosState.loading && resguardosState.progress === 100;
    const isResguardosBajasComplete = !resguardosBajasState.loading && resguardosBajasState.progress === 100;
    const isAllComplete = isIneaComplete && isIteaComplete && isIneaObsComplete && isIteaObsComplete && isResguardosComplete && isResguardosBajasComplete;

    // Calcular progreso total combinado (incluyendo obsoletos y resguardos)
    const totalProgress = ineaState.progress + iteaState.progress + ineaObsState.data.length + iteaObsState.data.length + resguardosState.resguardos.length + resguardosBajasState.resguardosBajas.length;
    const totalItems = ineaState.total + iteaState.total + ineaObsState.data.length + iteaObsState.data.length + resguardosState.resguardos.length + resguardosBajasState.resguardosBajas.length;
    const combinedPercentage = totalItems > 0 ? Math.round((totalProgress / totalItems) * 100) : 0;

    // Determinar estado visual
    const getStatus = () => {
        if (ineaState.error || iteaState.error || ineaObsState.error || iteaObsState.error) return 'error';
        if (isAllComplete) return 'complete';
        if (ineaState.isIndexing || iteaState.isIndexing || ineaObsState.isIndexing || iteaObsState.isIndexing || resguardosState.loading || resguardosBajasState.loading) return 'indexing';
        if (ineaState.progress > 0 || iteaState.progress > 0 || ineaObsState.data.length > 0 || iteaObsState.data.length > 0 || resguardosState.resguardos.length > 0 || resguardosBajasState.resguardosBajas.length > 0) return 'loading';
        return 'ready';
    };

    const status = getStatus();

    // Lógica de visibilidad
    useEffect(() => {
        const hasActivity = 
            ineaState.isIndexing || ineaState.progress > 0 || ineaState.error !== null ||
            iteaState.isIndexing || iteaState.progress > 0 || iteaState.error !== null ||
            ineaObsState.isIndexing || ineaObsState.data.length > 0 || ineaObsState.error !== null ||
            iteaObsState.isIndexing || iteaObsState.data.length > 0 || iteaObsState.error !== null ||
            resguardosState.loading || resguardosState.resguardos.length > 0 ||
            resguardosBajasState.loading || resguardosBajasState.resguardosBajas.length > 0;
        setIsVisible(hasActivity);

        // Ocultar después de 3 segundos si todos están completos
        if (isAllComplete && !ineaState.isIndexing && !iteaState.isIndexing && !ineaObsState.isIndexing && !iteaObsState.isIndexing && !resguardosState.loading && !resguardosBajasState.loading) {
            const timer = setTimeout(() => {
                setShouldHide(true);
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            setShouldHide(false);
        }
    }, [ineaState.isIndexing, ineaState.progress, ineaState.error, iteaState.isIndexing, iteaState.progress, iteaState.error, ineaObsState.isIndexing, ineaObsState.data.length, ineaObsState.error, iteaObsState.isIndexing, iteaObsState.data.length, iteaObsState.error, resguardosState.loading, resguardosState.resguardos.length, resguardosBajasState.loading, resguardosBajasState.resguardosBajas.length, isAllComplete]);

    // No mostrar si no hay actividad o debe ocultarse
    if (!isVisible || shouldHide) return null;

    // Componente de barra de progreso mejorada
    const ProgressBar = ({ progress, total, color, gradient }: { progress: number; total: number; color: string; gradient: string }) => {
        const percent = total > 0 ? (progress / total) * 100 : 0;
        return (
            <div className={`relative w-full h-2 rounded-full overflow-hidden ${
                isDarkMode ? 'bg-white/5' : 'bg-gray-100'
            }`}>
                <div
                    className={`h-full transition-all duration-700 ease-out ${gradient} relative overflow-hidden`}
                    style={{ width: `${percent}%` }}
                >
                    {status === 'indexing' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    )}
                </div>
            </div>
        );
    };

    // Ícono según estado con mejor diseño
    const StatusIcon = () => {
        switch (status) {
            case 'error':
                return (
                    <div className="relative">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                );
            case 'complete':
                return (
                    <div className="relative">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                    </div>
                );
            case 'indexing':
                return (
                    <div className="relative flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
                    </div>
                );
            default:
                return <Database className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />;
        }
    };

    // Texto de estado
    const statusText = () => {
        switch (status) {
            case 'error':
                return 'Error en indexación';
            case 'complete':
                return 'Indexación completa';
            case 'indexing':
                return 'Indexando datos';
            default:
                return 'Cargando datos';
        }
    };

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 backdrop-blur-xl shadow-2xl transition-all duration-500 ease-in-out ${
                isExpanded ? 'w-96' : 'w-80'
            } rounded-2xl animate-fadeInRight ${
                isDarkMode 
                    ? 'bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-gray-800/95 border border-white/10' 
                    : 'bg-gradient-to-br from-white/98 via-white/95 to-gray-50/98 border border-gray-200/50'
            }`}
        >
            {/* Efecto de brillo superior */}
            <div className={`absolute top-0 left-0 right-0 h-px ${
                status === 'complete' ? 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent' :
                status === 'indexing' ? 'bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse' :
                status === 'error' ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent' :
                'bg-gradient-to-r from-transparent via-gray-500 to-transparent'
            }`} />

            {/* Header mejorado */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full px-5 py-4 flex items-center gap-4 transition-all duration-300 rounded-t-2xl group ${
                    isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                }`}
            >
                <div className="flex items-center justify-center">
                    <StatusIcon />
                </div>
                
                <div className="flex-1 flex flex-col items-start gap-1">
                    <span className={`text-sm font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                        {statusText()}
                    </span>
                    {status === 'indexing' && (
                        <span className={`text-xs font-medium tabular-nums transition-colors duration-300 ${
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                            {combinedPercentage}% completado
                        </span>
                    )}
                </div>

                <div className={`transition-all duration-300 ${
                    isDarkMode ? 'text-white/40 group-hover:text-white/60' : 'text-gray-400 group-hover:text-gray-600'
                }`}>
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
            </button>

            {/* Barra de progreso principal cuando está colapsado */}
            {!isExpanded && status === 'indexing' && (
                <div className="px-5 pb-4">
                    <ProgressBar 
                        progress={totalProgress} 
                        total={totalItems} 
                        color="bg-gradient-to-r from-blue-500 to-purple-500"
                        gradient="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"
                    />
                </div>
            )}

            {/* Contenido expandible mejorado */}
            {isExpanded && (
                <div className="px-5 pb-5 space-y-5 animate-fadeIn">
                    {/* Progreso de INEA */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className={`w-2 h-2 rounded-full ${
                                    isIneaComplete ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
                                }`} />
                                <span className={`text-sm font-semibold transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>INEA</span>
                            </div>
                            <span className={`text-xs font-medium tabular-nums transition-colors duration-300 ${
                                isDarkMode ? 'text-white/60' : 'text-gray-600'
                            }`}>
                                {ineaState.progress.toLocaleString()} / {ineaState.total.toLocaleString()}
                            </span>
                        </div>
                        <ProgressBar
                            progress={ineaState.progress}
                            total={ineaState.total}
                            color={isIneaComplete ? 'bg-emerald-500' : 'bg-blue-500'}
                            gradient={isIneaComplete ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-blue-500 to-blue-400'}
                        />
                    </div>

                    {/* Progreso de ITEA */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className={`w-2 h-2 rounded-full ${
                                    isIteaComplete ? 'bg-emerald-500 animate-pulse' : 'bg-purple-500'
                                }`} />
                                <span className={`text-sm font-semibold transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>ITEA</span>
                            </div>
                            <span className={`text-xs font-medium tabular-nums transition-colors duration-300 ${
                                isDarkMode ? 'text-white/60' : 'text-gray-600'
                            }`}>
                                {iteaState.progress.toLocaleString()} / {iteaState.total.toLocaleString()}
                            </span>
                        </div>
                        <ProgressBar
                            progress={iteaState.progress}
                            total={iteaState.total}
                            color={isIteaComplete ? 'bg-emerald-500' : 'bg-purple-500'}
                            gradient={isIteaComplete ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-purple-500 to-purple-400'}
                        />
                    </div>

                    {/* Progreso de Obsoletos INEA */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className={`w-2 h-2 rounded-full ${
                                    isIneaObsComplete ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'
                                }`} />
                                <span className={`text-sm font-semibold transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>INEA Obsoletos</span>
                            </div>
                            <span className={`text-xs font-medium tabular-nums transition-colors duration-300 ${
                                isDarkMode ? 'text-white/60' : 'text-gray-600'
                            }`}>
                                {ineaObsState.data.length.toLocaleString()}
                            </span>
                        </div>
                        <ProgressBar
                            progress={ineaObsState.data.length}
                            total={ineaObsState.data.length}
                            color={isIneaObsComplete ? 'bg-emerald-500' : 'bg-orange-500'}
                            gradient={isIneaObsComplete ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-orange-500 to-orange-400'}
                        />
                    </div>

                    {/* Progreso de Obsoletos ITEA */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className={`w-2 h-2 rounded-full ${
                                    isIteaObsComplete ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                                }`} />
                                <span className={`text-sm font-semibold transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>ITEA Obsoletos</span>
                            </div>
                            <span className={`text-xs font-medium tabular-nums transition-colors duration-300 ${
                                isDarkMode ? 'text-white/60' : 'text-gray-600'
                            }`}>
                                {iteaObsState.data.length.toLocaleString()}
                            </span>
                        </div>
                        <ProgressBar
                            progress={iteaObsState.data.length}
                            total={iteaObsState.data.length}
                            color={isIteaObsComplete ? 'bg-emerald-500' : 'bg-red-500'}
                            gradient={isIteaObsComplete ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-red-400'}
                        />
                    </div>

                    {/* Progreso de Resguardos */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className={`w-2 h-2 rounded-full ${
                                    isResguardosComplete ? 'bg-emerald-500 animate-pulse' : 'bg-cyan-500'
                                }`} />
                                <span className={`text-sm font-semibold transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>Resguardos</span>
                            </div>
                            <span className={`text-xs font-medium tabular-nums transition-colors duration-300 ${
                                isDarkMode ? 'text-white/60' : 'text-gray-600'
                            }`}>
                                {resguardosState.resguardos.length.toLocaleString()}
                            </span>
                        </div>
                        <ProgressBar
                            progress={resguardosState.resguardos.length}
                            total={resguardosState.resguardos.length}
                            color={isResguardosComplete ? 'bg-emerald-500' : 'bg-cyan-500'}
                            gradient={isResguardosComplete ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-cyan-500 to-cyan-400'}
                        />
                    </div>

                    {/* Progreso de Resguardos Bajas */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className={`w-2 h-2 rounded-full ${
                                    isResguardosBajasComplete ? 'bg-emerald-500 animate-pulse' : 'bg-pink-500'
                                }`} />
                                <span className={`text-sm font-semibold transition-colors duration-300 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>Resguardos Bajas</span>
                            </div>
                            <span className={`text-xs font-medium tabular-nums transition-colors duration-300 ${
                                isDarkMode ? 'text-white/60' : 'text-gray-600'
                            }`}>
                                {resguardosBajasState.resguardosBajas.length.toLocaleString()}
                            </span>
                        </div>
                        <ProgressBar
                            progress={resguardosBajasState.resguardosBajas.length}
                            total={resguardosBajasState.resguardosBajas.length}
                            color={isResguardosBajasComplete ? 'bg-emerald-500' : 'bg-pink-500'}
                            gradient={isResguardosBajasComplete ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-pink-500 to-pink-400'}
                        />
                    </div>

                    {/* Resumen mejorado */}
                    <div className={`pt-4 border-t transition-all duration-300 ${
                        isDarkMode ? 'border-white/10' : 'border-gray-200'
                    }`}>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-medium ${
                                    isDarkMode ? 'text-white/50' : 'text-gray-500'
                                }`}>Total de registros</span>
                                <span className={`text-sm font-bold tabular-nums ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                    {totalProgress.toLocaleString()} / {totalItems.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-medium ${
                                    isDarkMode ? 'text-white/50' : 'text-gray-500'
                                }`}>Estado del sistema</span>
                                <span className={`text-sm font-bold ${
                                    isAllComplete 
                                        ? 'text-emerald-500' 
                                        : status === 'error' 
                                            ? 'text-red-500' 
                                            : isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                }`}>
                                    {isAllComplete ? '✓ Completo' : status === 'error' ? '✕ Error' : '⟳ Cargando'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Mensajes de error mejorados */}
                    {ineaState.error && (
                        <div className={`px-4 py-3 rounded-xl border transition-all duration-300 ${
                            isDarkMode 
                                ? 'bg-red-500/10 border-red-500/30 backdrop-blur-sm' 
                                : 'bg-red-50 border-red-200'
                        }`}>
                            <p className={`text-xs font-medium transition-colors duration-300 ${
                                isDarkMode ? 'text-red-400' : 'text-red-700'
                            }`}>
                                <span className="font-bold">INEA:</span> {ineaState.error}
                            </p>
                        </div>
                    )}
                    {iteaState.error && (
                        <div className={`px-4 py-3 rounded-xl border transition-all duration-300 ${
                            isDarkMode 
                                ? 'bg-red-500/10 border-red-500/30 backdrop-blur-sm' 
                                : 'bg-red-50 border-red-200'
                        }`}>
                            <p className={`text-xs font-medium transition-colors duration-300 ${
                                isDarkMode ? 'text-red-400' : 'text-red-700'
                            }`}>
                                <span className="font-bold">ITEA:</span> {iteaState.error}
                            </p>
                        </div>
                    )}
                    {ineaObsState.error && (
                        <div className={`px-4 py-3 rounded-xl border transition-all duration-300 ${
                            isDarkMode 
                                ? 'bg-red-500/10 border-red-500/30 backdrop-blur-sm' 
                                : 'bg-red-50 border-red-200'
                        }`}>
                            <p className={`text-xs font-medium transition-colors duration-300 ${
                                isDarkMode ? 'text-red-400' : 'text-red-700'
                            }`}>
                                <span className="font-bold">INEA Obsoletos:</span> {ineaObsState.error}
                            </p>
                        </div>
                    )}
                    {iteaObsState.error && (
                        <div className={`px-4 py-3 rounded-xl border transition-all duration-300 ${
                            isDarkMode 
                                ? 'bg-red-500/10 border-red-500/30 backdrop-blur-sm' 
                                : 'bg-red-50 border-red-200'
                        }`}>
                            <p className={`text-xs font-medium transition-colors duration-300 ${
                                isDarkMode ? 'text-red-400' : 'text-red-700'
                            }`}>
                                <span className="font-bold">ITEA Obsoletos:</span> {iteaObsState.error}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
