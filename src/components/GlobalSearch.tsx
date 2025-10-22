"use client"
import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useIneaIndexation } from '@/context/IneaIndexationContext';
import { useIteaIndexation } from '@/context/IteaIndexationContext';
import { useIneaObsoletosIndexation } from '@/context/IneaObsoletosIndexationContext';
import { useIteaObsoletosIndexation } from '@/context/IteaObsoletosIndexationContext';
import { usePathname, useRouter } from 'next/navigation';

interface SearchResult {
    id: number;
    id_inv: string | null;
    descripcion: string | null;
    rubro: string | null;
    valor: number | null;
    area: string | null;
    estado: string | null;
    estatus: string | null;
    resguardante: string | null;
    origen: 'INEA' | 'ITEA' | 'INEA_OBS' | 'ITEA_OBS';
}

export default function GlobalSearch() {
    const { isDarkMode } = useTheme();
    const pathname = usePathname();
    const router = useRouter();
    const ineaContext = useIneaIndexation();
    const iteaContext = useIteaIndexation();
    const ineaObsContext = useIneaObsoletosIndexation();
    const iteaObsContext = useIteaObsoletosIndexation();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Combinar datos indexados de INEA, ITEA y Obsoletos
    const allData = useMemo(() => {
        const ineaData: SearchResult[] = ineaContext.data.map(item => ({
            id: item.id,
            id_inv: item.id_inv,
            descripcion: item.descripcion,
            rubro: item.rubro,
            valor: item.valor,
            area: item.area,
            estado: item.estado,
            estatus: item.estatus,
            resguardante: item.resguardante,
            origen: 'INEA' as const
        }));

        const iteaData: SearchResult[] = iteaContext.muebles.map(item => ({
            id: item.id,
            id_inv: item.id_inv,
            descripcion: item.descripcion,
            rubro: item.rubro,
            valor: item.valor,
            area: item.area,
            estado: item.estado,
            estatus: item.estatus,
            resguardante: item.resguardante,
            origen: 'ITEA' as const
        }));

        const ineaObsData: SearchResult[] = ineaObsContext.data.map(item => ({
            id: item.id,
            id_inv: item.id_inv,
            descripcion: item.descripcion,
            rubro: item.rubro,
            valor: item.valor,
            area: item.area,
            estado: item.estado,
            estatus: item.estatus,
            resguardante: item.resguardante,
            origen: 'INEA_OBS' as const
        }));

        const iteaObsData: SearchResult[] = iteaObsContext.data.map(item => ({
            id: item.id,
            id_inv: item.id_inv,
            descripcion: item.descripcion,
            rubro: item.rubro,
            valor: item.valor,
            area: item.area,
            estado: item.estado,
            estatus: item.estatus,
            resguardante: item.resguardante,
            origen: 'ITEA_OBS' as const
        }));

        return [...ineaData, ...iteaData, ...ineaObsData, ...iteaObsData];
    }, [ineaContext.data, iteaContext.muebles, ineaObsContext.data, iteaObsContext.data]);

    // Búsqueda en tiempo real
    const searchResults = useMemo(() => {
        if (!searchTerm.trim()) return [];

        const term = searchTerm.toLowerCase().trim();
        
        return allData.filter(item => {
            return (
                item.id_inv?.toLowerCase().includes(term) ||
                item.descripcion?.toLowerCase().includes(term) ||
                item.rubro?.toLowerCase().includes(term) ||
                item.area?.toLowerCase().includes(term) ||
                item.estado?.toLowerCase().includes(term) ||
                item.estatus?.toLowerCase().includes(term) ||
                item.resguardante?.toLowerCase().includes(term)
            );
        }).slice(0, 50); // Limitar a 50 resultados
    }, [searchTerm, allData]);

    // Separar resultados por origen
    const ineaResults = searchResults.filter(r => r.origen === 'INEA');
    const iteaResults = searchResults.filter(r => r.origen === 'ITEA');
    const ineaObsResults = searchResults.filter(r => r.origen === 'INEA_OBS');
    const iteaObsResults = searchResults.filter(r => r.origen === 'ITEA_OBS');

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
                setIsExpanded(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Mostrar resultados cuando hay búsqueda
    useEffect(() => {
        setShowResults(searchTerm.trim().length > 0);
    }, [searchTerm]);

    const handleClear = () => {
        setSearchTerm('');
        setShowResults(false);
    };

    const handleResultClick = (result: SearchResult) => {
        // Redirigir al componente correspondiente según el origen usando el ID numérico
        if (result.origen === 'INEA') {
            router.push(`/consultas/inea/general?id=${result.id}`);
        } else if (result.origen === 'ITEA') {
            router.push(`/consultas/itea/general?id=${result.id}`);
        } else if (result.origen === 'INEA_OBS') {
            router.push(`/consultas/inea/obsoletos?id=${result.id}`);
        } else if (result.origen === 'ITEA_OBS') {
            router.push(`/consultas/itea/obsoletos?id=${result.id}`);
        }
        // Limpiar búsqueda y cerrar
        setSearchTerm('');
        setShowResults(false);
        setIsExpanded(false);
    };

    return (
        <div ref={searchRef} className="relative">
            <div 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-500 ease-in-out ${
                    pathname === '/' 
                        ? isDarkMode 
                            ? 'bg-white/5 border border-white/10 hover:border-white/20' 
                            : 'bg-black/5 border border-gray-300/50 hover:border-gray-400/50'
                        : isDarkMode 
                            ? 'bg-white/5 border border-white/10 hover:border-white/20' 
                            : 'bg-gray-100/30 border border-gray-300/50 hover:border-gray-400/50'
                } backdrop-blur-sm ${
                    isExpanded ? 'w-64' : 'w-36'
                }`}
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => !searchTerm && setIsExpanded(false)}
            >
                <Search className={`w-3.5 h-3.5 flex-shrink-0 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsExpanded(true)}
                    className={`bg-transparent border-none outline-none text-xs transition-all duration-500 w-full ${
                        isDarkMode 
                            ? 'text-white placeholder:text-gray-500' 
                            : 'text-gray-900 placeholder:text-gray-500'
                    }`}
                />
                {searchTerm && (
                    <button
                        onClick={handleClear}
                        className={`flex-shrink-0 transition-colors duration-200 ${
                            isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Resultados de búsqueda - Ultra Minimalista */}
            {showResults && (
                <div className={`absolute top-full right-0 mt-1.5 w-[380px] max-h-[420px] overflow-y-auto rounded-xl shadow-2xl border transition-all duration-300 ${
                    isDarkMode 
                        ? 'bg-black/95 border-white/5 backdrop-blur-3xl' 
                        : 'bg-white/95 border-gray-200/30 backdrop-blur-3xl'
                } animate-in slide-in-from-top-2 fade-in-0 duration-300 scrollbar-thin ${isDarkMode ? 'scrollbar-thumb-white/5 scrollbar-track-transparent hover:scrollbar-thumb-white/10' : 'scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300'}`}>
                    {searchResults.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                                isDarkMode ? 'bg-white/5' : 'bg-gray-100'
                            }`}>
                                <Search className={`w-5 h-5 ${
                                    isDarkMode ? 'text-gray-600' : 'text-gray-400'
                                }`} />
                            </div>
                            <p className={`text-xs font-medium ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-600'
                            }`}>
                                Sin resultados
                            </p>
                        </div>
                    ) : (
                        <div className="p-2.5 space-y-2.5">
                            {/* Resultados INEA */}
                            {ineaResults.length > 0 && (
                                <div className="space-y-1">
                                    <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg ${
                                        isDarkMode ? 'bg-blue-500/5' : 'bg-blue-50/50'
                                    }`}>
                                        <span className={`text-[9px] font-bold tracking-widest uppercase ${
                                            isDarkMode ? 'text-blue-400/80' : 'text-blue-600/80'
                                        }`}>
                                            INEA
                                        </span>
                                        <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full ${
                                            isDarkMode ? 'bg-blue-500/10 text-blue-400/60' : 'bg-blue-100 text-blue-600/60'
                                        }`}>
                                            {ineaResults.length}
                                        </span>
                                    </div>
                                    <div className="space-y-0.5">
                                        {ineaResults.map((result, index) => (
                                            <div
                                                key={`inea-${result.id}`}
                                                onClick={() => handleResultClick(result)}
                                                style={{ animationDelay: `${index * 30}ms` }}
                                                className={`group px-2.5 py-2 rounded-lg transition-all duration-500 cursor-pointer animate-in fade-in-0 slide-in-from-left-1 ${
                                                    isDarkMode 
                                                        ? 'hover:bg-blue-500/5 hover:shadow-lg hover:shadow-blue-500/5 active:scale-[0.98]' 
                                                        : 'hover:bg-blue-50/80 hover:shadow-md hover:shadow-blue-100 active:scale-[0.98]'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2.5">
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-mono font-bold transition-colors duration-300 ${
                                                                isDarkMode ? 'text-blue-400 group-hover:text-blue-300' : 'text-blue-600 group-hover:text-blue-700'
                                                            }`}>
                                                                {result.id_inv}
                                                            </span>
                                                            {result.area && (
                                                                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${
                                                                    isDarkMode ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                    {result.area}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-[9px] leading-relaxed truncate transition-colors duration-300 ${
                                                            isDarkMode ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-600 group-hover:text-gray-700'
                                                        }`}>
                                                            {result.descripcion || 'Sin descripción'}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-all duration-500 ease-out ${
                                                        isDarkMode ? 'text-gray-700 group-hover:text-blue-400 group-hover:scale-110' : 'text-gray-300 group-hover:text-blue-600 group-hover:scale-110'
                                                    } group-hover:translate-x-1`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Resultados ITEA */}
                            {iteaResults.length > 0 && (
                                <div className="space-y-1">
                                    <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg ${
                                        isDarkMode ? 'bg-purple-500/5' : 'bg-purple-50/50'
                                    }`}>
                                        <span className={`text-[9px] font-bold tracking-widest uppercase ${
                                            isDarkMode ? 'text-purple-400/80' : 'text-purple-600/80'
                                        }`}>
                                            ITEA
                                        </span>
                                        <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full ${
                                            isDarkMode ? 'bg-purple-500/10 text-purple-400/60' : 'bg-purple-100 text-purple-600/60'
                                        }`}>
                                            {iteaResults.length}
                                        </span>
                                    </div>
                                    <div className="space-y-0.5">
                                        {iteaResults.map((result, index) => (
                                            <div
                                                key={`itea-${result.id}`}
                                                onClick={() => handleResultClick(result)}
                                                style={{ animationDelay: `${index * 30}ms` }}
                                                className={`group px-2.5 py-2 rounded-lg transition-all duration-500 cursor-pointer animate-in fade-in-0 slide-in-from-left-1 ${
                                                    isDarkMode 
                                                        ? 'hover:bg-purple-500/5 hover:shadow-lg hover:shadow-purple-500/5 active:scale-[0.98]' 
                                                        : 'hover:bg-purple-50/80 hover:shadow-md hover:shadow-purple-100 active:scale-[0.98]'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2.5">
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-mono font-bold transition-colors duration-300 ${
                                                                isDarkMode ? 'text-purple-400 group-hover:text-purple-300' : 'text-purple-600 group-hover:text-purple-700'
                                                            }`}>
                                                                {result.id_inv}
                                                            </span>
                                                            {result.area && (
                                                                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${
                                                                    isDarkMode ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                    {result.area}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-[9px] leading-relaxed truncate transition-colors duration-300 ${
                                                            isDarkMode ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-600 group-hover:text-gray-700'
                                                        }`}>
                                                            {result.descripcion || 'Sin descripción'}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-all duration-500 ease-out ${
                                                        isDarkMode ? 'text-gray-700 group-hover:text-purple-400 group-hover:scale-110' : 'text-gray-300 group-hover:text-purple-600 group-hover:scale-110'
                                                    } group-hover:translate-x-1`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Resultados INEA Obsoletos */}
                            {ineaObsResults.length > 0 && (
                                <div className="space-y-1">
                                    <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg ${
                                        isDarkMode ? 'bg-orange-500/5' : 'bg-orange-50/50'
                                    }`}>
                                        <span className={`text-[9px] font-bold tracking-widest uppercase ${
                                            isDarkMode ? 'text-orange-400/80' : 'text-orange-600/80'
                                        }`}>
                                            INEA Obsoletos
                                        </span>
                                        <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full ${
                                            isDarkMode ? 'bg-orange-500/10 text-orange-400/60' : 'bg-orange-100 text-orange-600/60'
                                        }`}>
                                            {ineaObsResults.length}
                                        </span>
                                    </div>
                                    <div className="space-y-0.5">
                                        {ineaObsResults.map((result, index) => (
                                            <div
                                                key={`inea-obs-${result.id}`}
                                                onClick={() => handleResultClick(result)}
                                                style={{ animationDelay: `${index * 30}ms` }}
                                                className={`group px-2.5 py-2 rounded-lg transition-all duration-500 cursor-pointer animate-in fade-in-0 slide-in-from-left-1 ${
                                                    isDarkMode 
                                                        ? 'hover:bg-orange-500/5 hover:shadow-lg hover:shadow-orange-500/5 active:scale-[0.98]' 
                                                        : 'hover:bg-orange-50/80 hover:shadow-md hover:shadow-orange-100 active:scale-[0.98]'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2.5">
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-mono font-bold transition-colors duration-300 ${
                                                                isDarkMode ? 'text-orange-400 group-hover:text-orange-300' : 'text-orange-600 group-hover:text-orange-700'
                                                            }`}>
                                                                {result.id_inv}
                                                            </span>
                                                            {result.area && (
                                                                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${
                                                                    isDarkMode ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                    {result.area}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-[9px] leading-relaxed truncate transition-colors duration-300 ${
                                                            isDarkMode ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-600 group-hover:text-gray-700'
                                                        }`}>
                                                            {result.descripcion || 'Sin descripción'}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-all duration-500 ease-out ${
                                                        isDarkMode ? 'text-gray-700 group-hover:text-orange-400 group-hover:scale-110' : 'text-gray-300 group-hover:text-orange-600 group-hover:scale-110'
                                                    } group-hover:translate-x-1`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Resultados ITEA Obsoletos */}
                            {iteaObsResults.length > 0 && (
                                <div className="space-y-1">
                                    <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg ${
                                        isDarkMode ? 'bg-red-500/5' : 'bg-red-50/50'
                                    }`}>
                                        <span className={`text-[9px] font-bold tracking-widest uppercase ${
                                            isDarkMode ? 'text-red-400/80' : 'text-red-600/80'
                                        }`}>
                                            ITEA Obsoletos
                                        </span>
                                        <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full ${
                                            isDarkMode ? 'bg-red-500/10 text-red-400/60' : 'bg-red-100 text-red-600/60'
                                        }`}>
                                            {iteaObsResults.length}
                                        </span>
                                    </div>
                                    <div className="space-y-0.5">
                                        {iteaObsResults.map((result, index) => (
                                            <div
                                                key={`itea-obs-${result.id}`}
                                                onClick={() => handleResultClick(result)}
                                                style={{ animationDelay: `${index * 30}ms` }}
                                                className={`group px-2.5 py-2 rounded-lg transition-all duration-500 cursor-pointer animate-in fade-in-0 slide-in-from-left-1 ${
                                                    isDarkMode 
                                                        ? 'hover:bg-red-500/5 hover:shadow-lg hover:shadow-red-500/5 active:scale-[0.98]' 
                                                        : 'hover:bg-red-50/80 hover:shadow-md hover:shadow-red-100 active:scale-[0.98]'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2.5">
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-mono font-bold transition-colors duration-300 ${
                                                                isDarkMode ? 'text-red-400 group-hover:text-red-300' : 'text-red-600 group-hover:text-red-700'
                                                            }`}>
                                                                {result.id_inv}
                                                            </span>
                                                            {result.area && (
                                                                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${
                                                                    isDarkMode ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                    {result.area}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-[9px] leading-relaxed truncate transition-colors duration-300 ${
                                                            isDarkMode ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-600 group-hover:text-gray-700'
                                                        }`}>
                                                            {result.descripcion || 'Sin descripción'}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-all duration-500 ease-out ${
                                                        isDarkMode ? 'text-gray-700 group-hover:text-red-400 group-hover:scale-110' : 'text-gray-300 group-hover:text-red-600 group-hover:scale-110'
                                                    } group-hover:translate-x-1`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Footer minimalista */}
                            {searchResults.length === 50 && (
                                <div className="pt-2 text-center">
                                    <p className={`text-[9px] ${
                                        isDarkMode ? 'text-gray-600' : 'text-gray-500'
                                    }`}>
                                        Mostrando primeros 50 resultados
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
