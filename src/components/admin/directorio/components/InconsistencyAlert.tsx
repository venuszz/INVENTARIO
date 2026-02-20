import { useTheme } from '@/context/ThemeContext';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Inconsistency } from '../hooks/useDirectorioInconsistencies';

interface InconsistencyAlertProps {
    inconsistencies: Inconsistency[];
    isInDirectorioPage?: boolean;
}

export function InconsistencyAlert({ inconsistencies, isInDirectorioPage = false }: InconsistencyAlertProps) {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);
    const [shouldShowDetails, setShouldShowDetails] = useState(false);
    
    // Detectar parámetro en URL para mostrar indicador
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const searchParams = new URLSearchParams(window.location.search);
        const showInconsistencies = searchParams.get('showInconsistencies');
        
        if (showInconsistencies === 'true' && isInDirectorioPage) {
            setShouldShowDetails(true);
            // NO auto-expandir, solo marcar que hay que mostrar indicador
        }
    }, [isInDirectorioPage]);
    
    // Limpiar URL cuando se expande manualmente
    const handleManualExpand = () => {
        setIsHovered(true);
        
        // Si hay parámetro URL, limpiarlo al expandir
        if (shouldShowDetails && isInDirectorioPage) {
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
            setShouldShowDetails(false);
        }
    };
    
    if (inconsistencies.length === 0) return null;
    
    // Contar tipos de inconsistencias
    const duplicateAreasCount = inconsistencies.filter(i => i.type === 'duplicate_area').length;
    const emptyDirectorsCount = inconsistencies.filter(i => i.type === 'empty_director').length;
    const emptyAreasCount = inconsistencies.filter(i => i.type === 'empty_area').length;
    const totalCount = duplicateAreasCount + emptyDirectorsCount + emptyAreasCount;
    
    const handleNavigateToDirectorio = () => {
        router.push('/admin/personal?showInconsistencies=true');
    };
    
    // Expandir cuando se hace hover (incluso si shouldShowDetails está activo)
    const showExpandedView = isInDirectorioPage && isHovered;
    
    return (
        <motion.div
            className="fixed top-20 right-4 z-40"
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ 
                duration: 0.4, 
                ease: [0.16, 1, 0.3, 1]
            }}
            onMouseEnter={handleManualExpand}
            onMouseLeave={() => setIsHovered(false)}
        >
            <motion.div
                className={`overflow-hidden select-none shadow-2xl ${
                    isDarkMode ? 'bg-neutral-900' : 'bg-neutral-100'
                }`}
                animate={{ 
                    borderRadius: showExpandedView || (!isInDirectorioPage && isHovered) ? '12px' : shouldShowDetails && !isHovered ? '12px' : '9999px',
                    width: showExpandedView || (!isInDirectorioPage && isHovered) ? '360px' : 'auto',
                }}
                transition={{ 
                    duration: 0.3,
                    ease: [0.16, 1, 0.3, 1]
                }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {!showExpandedView && !(!isInDirectorioPage && isHovered) ? (
                        /* Estado contraído - Píldora minimalista */
                        <motion.div
                            key="collapsed"
                            className={`${
                                shouldShowDetails && !isHovered ? 'flex flex-col items-center gap-2 px-6 py-4' : 'flex items-center gap-2 px-3 py-2'
                            } ${
                                !isInDirectorioPage ? 'cursor-pointer' : shouldShowDetails ? 'cursor-pointer' : ''
                            }`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={!isInDirectorioPage ? handleNavigateToDirectorio : shouldShowDetails ? handleManualExpand : undefined}
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <AlertTriangle 
                                        className={`flex-shrink-0 ${
                                            shouldShowDetails && !isHovered ? 'w-7 h-7' : 'w-3.5 h-3.5'
                                        } ${
                                            isDarkMode ? 'text-red-400' : 'text-red-600'
                                        }`}
                                    />
                                    {/* Pulsing dot - más prominente cuando shouldShowDetails es true */}
                                    <motion.div
                                        className={`absolute rounded-full ${
                                            shouldShowDetails 
                                                ? 'w-2.5 h-2.5 -top-1 -right-1' 
                                                : 'w-1.5 h-1.5 -top-0.5 -right-0.5'
                                        } ${
                                            isDarkMode ? 'bg-red-400' : 'bg-red-600'
                                        }`}
                                        animate={{
                                            scale: shouldShowDetails ? [1, 1.5, 1] : [1, 1.3, 1],
                                            opacity: [1, 0.5, 1]
                                        }}
                                        transition={{
                                            duration: shouldShowDetails ? 1.5 : 2,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    />
                                </div>
                                <span className={`font-medium whitespace-nowrap ${
                                    shouldShowDetails && !isHovered ? 'text-base' : 'text-xs'
                                } ${
                                    isDarkMode ? 'text-red-400' : 'text-red-600'
                                }`}>
                                    {totalCount} {totalCount === 1 ? 'inconsistencia' : 'inconsistencias'}
                                </span>
                                {!isInDirectorioPage && (
                                    <ExternalLink className={`w-3 h-3 ml-1 ${
                                        isDarkMode ? 'text-red-400' : 'text-red-600'
                                    }`} />
                                )}
                            </div>
                            {shouldShowDetails && isInDirectorioPage && !isHovered && (
                                <motion.span
                                    className={`text-xs ${
                                        isDarkMode ? 'text-white/50' : 'text-black/50'
                                    }`}
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: 0.1 }}
                                >
                                    Click para ver detalles
                                </motion.span>
                            )}
                        </motion.div>
                    ) : (
                        /* Estado expandido */
                        <motion.div
                            key="expanded"
                            className="flex flex-col"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {isInDirectorioPage ? (
                                /* Vista completa con detalles - Solo en página de directorio */
                                <>
                                    {/* Header minimalista */}
                                    <div className="px-3 py-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle 
                                                className={`w-3.5 h-3.5 ${
                                                    isDarkMode ? 'text-red-400' : 'text-red-600'
                                                }`}
                                            />
                                            <span className={`text-xs font-medium ${
                                                isDarkMode ? 'text-white/60' : 'text-black/60'
                                            }`}>
                                                Inconsistencias detectadas
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-medium ${
                                            isDarkMode ? 'text-white/30' : 'text-black/30'
                                        }`}>
                                            {totalCount}
                                        </span>
                                    </div>

                                    {/* Lista con scroll - Minimalista */}
                                    <div 
                                        className={`overflow-y-auto ${
                                            isDarkMode 
                                                ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/10' 
                                                : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/10'
                                        }`}
                                        style={{ maxHeight: '320px' }}
                                    >
                                        <div className="px-1.5 pb-1.5 space-y-0.5">
                                            {/* Áreas duplicadas */}
                                            {duplicateAreasCount > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.2, delay: 0.05 }}
                                                >
                                                    <div className="px-2 py-1">
                                                        <span className={`text-[10px] font-medium uppercase tracking-wide ${
                                                            isDarkMode ? 'text-white/30' : 'text-black/30'
                                                        }`}>
                                                            Áreas duplicadas
                                                        </span>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        {inconsistencies
                                                            .filter(i => i.type === 'duplicate_area')
                                                            .map((issue, index) => {
                                                                if (issue.type !== 'duplicate_area') return null;
                                                                return (
                                                                    <motion.div
                                                                        key={`dup-${issue.id_area}`}
                                                                        className={`px-2 py-2 rounded-lg transition-colors cursor-default ${
                                                                            isDarkMode 
                                                                                ? 'hover:bg-white/5' 
                                                                                : 'hover:bg-black/5'
                                                                        }`}
                                                                        initial={{ opacity: 0, x: -5 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        transition={{ 
                                                                            duration: 0.2, 
                                                                            delay: 0.1 + (index * 0.03)
                                                                        }}
                                                                    >
                                                                        <div className="flex items-start gap-2">
                                                                            <div className={`w-1 h-1 rounded-full flex-shrink-0 mt-1.5 ${
                                                                                isDarkMode ? 'bg-red-400' : 'bg-red-600'
                                                                            }`} />
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className={`text-xs font-medium ${
                                                                                    isDarkMode ? 'text-white/80' : 'text-black/80'
                                                                                }`}>
                                                                                    {issue.areaName}
                                                                                </p>
                                                                                <p className={`text-[10px] mt-1 ${
                                                                                    isDarkMode ? 'text-white/50' : 'text-black/50'
                                                                                }`}>
                                                                                    Asignada a:
                                                                                </p>
                                                                                <div className="mt-1 space-y-0.5">
                                                                                    {issue.directors.map((director) => (
                                                                                        <p 
                                                                                            key={director.id_directorio}
                                                                                            className={`text-[10px] pl-2 ${
                                                                                                isDarkMode ? 'text-white/60' : 'text-black/60'
                                                                                            }`}
                                                                                        >
                                                                                            • {director.nombre}
                                                                                        </p>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                );
                                                            })}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Directores sin bienes */}
                                            {emptyDirectorsCount > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.2, delay: 0.1 }}
                                                >
                                                    <div className="px-2 py-1 mt-1">
                                                        <span className={`text-[10px] font-medium uppercase tracking-wide ${
                                                            isDarkMode ? 'text-white/30' : 'text-black/30'
                                                        }`}>
                                                            Directores sin bienes
                                                        </span>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        {inconsistencies
                                                            .filter(i => i.type === 'empty_director')
                                                            .map((issue, index) => {
                                                                if (issue.type !== 'empty_director') return null;
                                                                return (
                                                                    <motion.div
                                                                        key={`dir-${issue.id_directorio}`}
                                                                        className={`px-2 py-2 rounded-lg transition-colors cursor-default ${
                                                                            isDarkMode 
                                                                                ? 'hover:bg-white/5' 
                                                                                : 'hover:bg-black/5'
                                                                        }`}
                                                                        initial={{ opacity: 0, x: -5 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        transition={{ 
                                                                            duration: 0.2, 
                                                                            delay: 0.15 + (index * 0.03)
                                                                        }}
                                                                    >
                                                                        <div className="flex items-start gap-2">
                                                                            <div className={`w-1 h-1 rounded-full flex-shrink-0 mt-1.5 ${
                                                                                isDarkMode ? 'bg-red-400' : 'bg-red-600'
                                                                            }`} />
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className={`text-xs font-medium ${
                                                                                    isDarkMode ? 'text-white/80' : 'text-black/80'
                                                                                }`}>
                                                                                    {issue.directorName}
                                                                                </p>
                                                                                <p className={`text-[10px] mt-0.5 ${
                                                                                    isDarkMode ? 'text-white/50' : 'text-black/50'
                                                                                }`}>
                                                                                    Tiene {issue.areaCount} {issue.areaCount === 1 ? 'área asignada' : 'áreas asignadas'} pero sin bienes a cargo
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                );
                                                            })}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Áreas sin bienes */}
                                            {emptyAreasCount > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.2, delay: 0.15 }}
                                                >
                                                    <div className="px-2 py-1 mt-1">
                                                        <span className={`text-[10px] font-medium uppercase tracking-wide ${
                                                            isDarkMode ? 'text-white/30' : 'text-black/30'
                                                        }`}>
                                                            Áreas sin bienes
                                                        </span>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        {inconsistencies
                                                            .filter(i => i.type === 'empty_area')
                                                            .map((issue, index) => {
                                                                if (issue.type !== 'empty_area') return null;
                                                                return (
                                                                    <motion.div
                                                                        key={`area-${issue.id_area}`}
                                                                        className={`px-2 py-2 rounded-lg transition-colors cursor-default ${
                                                                            isDarkMode 
                                                                                ? 'hover:bg-white/5' 
                                                                                : 'hover:bg-black/5'
                                                                        }`}
                                                                        initial={{ opacity: 0, x: -5 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        transition={{ 
                                                                            duration: 0.2, 
                                                                            delay: 0.2 + (index * 0.03)
                                                                        }}
                                                                    >
                                                                        <div className="flex items-start gap-2">
                                                                            <div className={`w-1 h-1 rounded-full flex-shrink-0 mt-1.5 ${
                                                                                isDarkMode ? 'bg-red-400' : 'bg-red-600'
                                                                            }`} />
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className={`text-xs font-medium ${
                                                                                    isDarkMode ? 'text-white/80' : 'text-black/80'
                                                                                }`}>
                                                                                    {issue.areaName}
                                                                                </p>
                                                                                <p className={`text-[10px] mt-0.5 ${
                                                                                    isDarkMode ? 'text-white/50' : 'text-black/50'
                                                                                }`}>
                                                                                    Tiene {issue.directorCount} {issue.directorCount === 1 ? 'director asignado' : 'directores asignados'} pero sin bienes
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                );
                                                            })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* Vista resumida con botón - Fuera de página de directorio */
                                <>
                                    {/* Header */}
                                    <div className="px-3 py-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle 
                                                className={`w-3.5 h-3.5 ${
                                                    isDarkMode ? 'text-red-400' : 'text-red-600'
                                                }`}
                                            />
                                            <span className={`text-xs font-medium ${
                                                isDarkMode ? 'text-white/60' : 'text-black/60'
                                            }`}>
                                                Inconsistencias detectadas
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-medium ${
                                            isDarkMode ? 'text-white/30' : 'text-black/30'
                                        }`}>
                                            {totalCount}
                                        </span>
                                    </div>

                                    {/* Resumen de inconsistencias */}
                                    <div className="px-3 pb-3 space-y-2">
                                        {duplicateAreasCount > 0 && (
                                            <motion.div
                                                className={`px-2 py-2 rounded-lg ${
                                                    isDarkMode ? 'bg-white/5' : 'bg-black/5'
                                                }`}
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2, delay: 0.05 }}
                                            >
                                                <p className={`text-xs font-medium ${
                                                    isDarkMode ? 'text-white/80' : 'text-black/80'
                                                }`}>
                                                    {duplicateAreasCount} {duplicateAreasCount === 1 ? 'área duplicada' : 'áreas duplicadas'}
                                                </p>
                                                <p className={`text-[10px] mt-0.5 ${
                                                    isDarkMode ? 'text-white/50' : 'text-black/50'
                                                }`}>
                                                    Misma área asignada a múltiples responsables
                                                </p>
                                            </motion.div>
                                        )}

                                        {emptyDirectorsCount > 0 && (
                                            <motion.div
                                                className={`px-2 py-2 rounded-lg ${
                                                    isDarkMode ? 'bg-white/5' : 'bg-black/5'
                                                }`}
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2, delay: 0.1 }}
                                            >
                                                <p className={`text-xs font-medium ${
                                                    isDarkMode ? 'text-white/80' : 'text-black/80'
                                                }`}>
                                                    {emptyDirectorsCount} {emptyDirectorsCount === 1 ? 'responsable sin bienes' : 'responsables sin bienes'}
                                                </p>
                                                <p className={`text-[10px] mt-0.5 ${
                                                    isDarkMode ? 'text-white/50' : 'text-black/50'
                                                }`}>
                                                    Tienen áreas asignadas pero sin bienes a cargo
                                                </p>
                                            </motion.div>
                                        )}

                                        {emptyAreasCount > 0 && (
                                            <motion.div
                                                className={`px-2 py-2 rounded-lg ${
                                                    isDarkMode ? 'bg-white/5' : 'bg-black/5'
                                                }`}
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2, delay: 0.15 }}
                                            >
                                                <p className={`text-xs font-medium ${
                                                    isDarkMode ? 'text-white/80' : 'text-black/80'
                                                }`}>
                                                    {emptyAreasCount} {emptyAreasCount === 1 ? 'área sin bienes' : 'áreas sin bienes'}
                                                </p>
                                                <p className={`text-[10px] mt-0.5 ${
                                                    isDarkMode ? 'text-white/50' : 'text-black/50'
                                                }`}>
                                                    Tienen responsables asignados pero sin bienes
                                                </p>
                                            </motion.div>
                                        )}

                                        {/* Botón para ir al directorio */}
                                        <motion.button
                                            onClick={handleNavigateToDirectorio}
                                            className={`w-full mt-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                                isDarkMode
                                                    ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                                                    : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                            }`}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: 0.2 }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            Ver detalles en Directorio
                                        </motion.button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
