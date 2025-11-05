"use client"
import { useIneaIndexation } from '@/context/IneaIndexationContext';
import { useIteaIndexation } from '@/context/IteaIndexationContext';
import { useIneaObsoletosIndexation } from '@/context/IneaObsoletosIndexationContext';
import { useIteaObsoletosIndexation } from '@/context/IteaObsoletosIndexationContext';
import { useResguardosIndexation } from '@/context/ResguardosIndexationContext';
import { useResguardosBajasIndexation } from '@/context/ResguardosBajasIndexationContext';
import { useTheme } from '@/context/ThemeContext';
import { CheckCircle2, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function IndexationPopover() {
    const pathname = usePathname();
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

    // Calcular progreso total combinado
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

    // No mostrar en la página de login o si no hay actividad o debe ocultarse
    if (pathname === '/login' || !isVisible || shouldHide) return null;

    // Componente de barra de progreso minimalista
    const ProgressBar = ({ progress, total }: { progress: number; total: number }) => {
        const percent = total > 0 ? (progress / total) * 100 : 0;
        return (
            <div className={`relative w-full h-1 rounded-full overflow-hidden ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-200'
            }`}>
                <div
                    className={`h-full transition-all duration-500 ease-out ${
                        isDarkMode ? 'bg-white' : 'bg-gray-900'
                    }`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        );
    };

    // Ícono según estado minimalista
    const StatusIcon = () => {
        switch (status) {
            case 'error':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'complete':
                return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'indexing':
                return <Loader2 className="w-4 h-4 animate-spin" />;
            default:
                return <Loader2 className="w-4 h-4" />;
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
            className={`fixed bottom-6 right-6 z-50 backdrop-blur-md shadow-lg transition-all duration-300 ease-out ${
                isExpanded ? 'w-80' : 'w-64'
            } rounded-xl ${
                isDarkMode 
                    ? 'bg-black/80 border border-white/10' 
                    : 'bg-white/90 border border-gray-200'
            }`}
            style={{
                animation: 'slideInUp 0.3s ease-out'
            }}
        >
            {/* Header minimalista */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full px-4 py-3 flex items-center gap-3 transition-all duration-200 rounded-t-xl ${
                    isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100/50'
                }`}
            >
                <StatusIcon />
                
                <div className="flex-1 flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                        {statusText()}
                    </span>
                    {status === 'indexing' && (
                        <span className={`text-xs tabular-nums ${
                            isDarkMode ? 'text-white/60' : 'text-gray-500'
                        }`}>
                            {combinedPercentage}%
                        </span>
                    )}
                </div>

                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                } ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`} />
            </button>

            {/* Barra de progreso principal cuando está colapsado */}
            {!isExpanded && status === 'indexing' && (
                <div className="px-4 pb-3">
                    <ProgressBar 
                        progress={totalProgress} 
                        total={totalItems}
                    />
                </div>
            )}

            {/* Contenido expandible minimalista */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                    {/* Progreso de INEA */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${
                                isDarkMode ? 'text-white/80' : 'text-gray-700'
                            }`}>INEA</span>
                            <span className={`text-xs tabular-nums ${
                                isDarkMode ? 'text-white/50' : 'text-gray-500'
                            }`}>
                                {ineaState.progress.toLocaleString()} / {ineaState.total.toLocaleString()}
                            </span>
                        </div>
                        <ProgressBar progress={ineaState.progress} total={ineaState.total} />
                    </div>

                    {/* Progreso de ITEA */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${
                                isDarkMode ? 'text-white/80' : 'text-gray-700'
                            }`}>ITEA</span>
                            <span className={`text-xs tabular-nums ${
                                isDarkMode ? 'text-white/50' : 'text-gray-500'
                            }`}>
                                {iteaState.progress.toLocaleString()} / {iteaState.total.toLocaleString()}
                            </span>
                        </div>
                        <ProgressBar progress={iteaState.progress} total={iteaState.total} />
                    </div>

                    {/* Progreso de Obsoletos INEA */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${
                                isDarkMode ? 'text-white/80' : 'text-gray-700'
                            }`}>INEA Obsoletos</span>
                            <span className={`text-xs tabular-nums ${
                                isDarkMode ? 'text-white/50' : 'text-gray-500'
                            }`}>
                                {ineaObsState.data.length.toLocaleString()}
                            </span>
                        </div>
                        <ProgressBar progress={ineaObsState.data.length} total={ineaObsState.data.length} />
                    </div>

                    {/* Progreso de Obsoletos ITEA */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${
                                isDarkMode ? 'text-white/80' : 'text-gray-700'
                            }`}>ITEA Obsoletos</span>
                            <span className={`text-xs tabular-nums ${
                                isDarkMode ? 'text-white/50' : 'text-gray-500'
                            }`}>
                                {iteaObsState.data.length.toLocaleString()}
                            </span>
                        </div>
                        <ProgressBar progress={iteaObsState.data.length} total={iteaObsState.data.length} />
                    </div>

                    {/* Progreso de Resguardos */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${
                                isDarkMode ? 'text-white/80' : 'text-gray-700'
                            }`}>Resguardos</span>
                            <span className={`text-xs tabular-nums ${
                                isDarkMode ? 'text-white/50' : 'text-gray-500'
                            }`}>
                                {resguardosState.resguardos.length.toLocaleString()}
                            </span>
                        </div>
                        <ProgressBar progress={resguardosState.resguardos.length} total={resguardosState.resguardos.length} />
                    </div>

                    {/* Progreso de Resguardos Bajas */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${
                                isDarkMode ? 'text-white/80' : 'text-gray-700'
                            }`}>Resguardos Bajas</span>
                            <span className={`text-xs tabular-nums ${
                                isDarkMode ? 'text-white/50' : 'text-gray-500'
                            }`}>
                                {resguardosBajasState.resguardosBajas.length.toLocaleString()}
                            </span>
                        </div>
                        <ProgressBar progress={resguardosBajasState.resguardosBajas.length} total={resguardosBajasState.resguardosBajas.length} />
                    </div>

                    {/* Resumen minimalista */}
                    <div className={`pt-3 mt-2 border-t ${
                        isDarkMode ? 'border-white/10' : 'border-gray-200'
                    }`}>
                        <div className="flex items-center justify-between">
                            <span className={`text-xs ${
                                isDarkMode ? 'text-white/50' : 'text-gray-500'
                            }`}>Total</span>
                            <span className={`text-xs font-medium tabular-nums ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                {totalProgress.toLocaleString()} / {totalItems.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Mensajes de error minimalistas */}
                    {(ineaState.error || iteaState.error || ineaObsState.error || iteaObsState.error) && (
                        <div className={`px-3 py-2 rounded-lg text-xs ${
                            isDarkMode 
                                ? 'bg-red-500/10 text-red-400' 
                                : 'bg-red-50 text-red-700'
                        }`}>
                            {ineaState.error && <div>INEA: {ineaState.error}</div>}
                            {iteaState.error && <div>ITEA: {iteaState.error}</div>}
                            {ineaObsState.error && <div>INEA Obs: {ineaObsState.error}</div>}
                            {iteaObsState.error && <div>ITEA Obs: {iteaObsState.error}</div>}
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
