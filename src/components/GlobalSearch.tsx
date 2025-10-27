"use client"
import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, ChevronRight, FileText, Archive } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useIneaIndexation } from '@/context/IneaIndexationContext';
import { useIteaIndexation } from '@/context/IteaIndexationContext';
import { useIneaObsoletosIndexation } from '@/context/IneaObsoletosIndexationContext';
import { useIteaObsoletosIndexation } from '@/context/IteaObsoletosIndexationContext';
import { useResguardosIndexation } from '@/context/ResguardosIndexationContext';
import { useResguardosBajasIndexation } from '@/context/ResguardosBajasIndexationContext';
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
    origen: 'INEA' | 'ITEA' | 'INEA_OBS' | 'ITEA_OBS' | 'RESGUARDO' | 'RESGUARDO_BAJA';
    // Campos específicos para resguardos
    folio?: string | null;
    folio_resguardo?: string | null;
    folio_baja?: string | null;
    f_resguardo?: string | null;
    f_baja?: string | null;
    dir_area?: string | null;
    area_resguardo?: string | null;
    usufinal?: string | null;
    num_inventario?: string | null;
    condicion?: string | null;
    motivo_baja?: string | null;
}

export default function GlobalSearch() {
    const { isDarkMode } = useTheme();
    const pathname = usePathname();
    const router = useRouter();
    const ineaContext = useIneaIndexation();
    const iteaContext = useIteaIndexation();
    const ineaObsContext = useIneaObsoletosIndexation();
    const iteaObsContext = useIteaObsoletosIndexation();
    const resguardosContext = useResguardosIndexation();
    const resguardosBajasContext = useResguardosBajasIndexation();
    
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

        // Agregar datos de resguardos
        const resguardosData: SearchResult[] = resguardosContext.resguardos.map(item => ({
            id: item.id,
            id_inv: item.num_inventario,
            descripcion: item.descripcion,
            rubro: item.rubro,
            valor: null,
            area: item.area_resguardo,
            estado: item.condicion,
            estatus: null,
            resguardante: item.usufinal,
            origen: 'RESGUARDO' as const,
            folio: item.folio,
            f_resguardo: item.f_resguardo,
            dir_area: item.dir_area,
            area_resguardo: item.area_resguardo,
            usufinal: item.usufinal,
            num_inventario: item.num_inventario,
            condicion: item.condicion
        }));

        // Agregar datos de resguardos de bajas
        const resguardosBajasData: SearchResult[] = resguardosBajasContext.resguardosBajas.map(item => ({
            id: item.id,
            id_inv: item.num_inventario,
            descripcion: item.descripcion,
            rubro: item.rubro,
            valor: null,
            area: item.area_resguardo,
            estado: item.condicion,
            estatus: null,
            resguardante: item.usufinal,
            origen: 'RESGUARDO_BAJA' as const,
            folio_resguardo: item.folio_resguardo,
            folio_baja: item.folio_baja,
            f_resguardo: item.f_resguardo,
            f_baja: item.f_baja,
            dir_area: item.dir_area,
            area_resguardo: item.area_resguardo,
            usufinal: item.usufinal,
            num_inventario: item.num_inventario,
            condicion: item.condicion,
            motivo_baja: item.motivo_baja
        }));

        return [...ineaData, ...iteaData, ...ineaObsData, ...iteaObsData, ...resguardosData, ...resguardosBajasData];
    }, [ineaContext.data, iteaContext.muebles, ineaObsContext.data, iteaObsContext.data, resguardosContext.resguardos, resguardosBajasContext.resguardosBajas]);

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
                item.resguardante?.toLowerCase().includes(term) ||
                // Campos específicos de resguardos
                item.folio?.toLowerCase().includes(term) ||
                item.folio_resguardo?.toLowerCase().includes(term) ||
                item.folio_baja?.toLowerCase().includes(term) ||
                item.dir_area?.toLowerCase().includes(term) ||
                item.area_resguardo?.toLowerCase().includes(term) ||
                item.usufinal?.toLowerCase().includes(term) ||
                item.num_inventario?.toLowerCase().includes(term) ||
                item.condicion?.toLowerCase().includes(term) ||
                item.motivo_baja?.toLowerCase().includes(term)
            );
        }).slice(0, 50); // Limitar a 50 resultados
    }, [searchTerm, allData]);

    // Separar resultados por origen
    const ineaResults = searchResults.filter(r => r.origen === 'INEA');
    const iteaResults = searchResults.filter(r => r.origen === 'ITEA');
    const ineaObsResults = searchResults.filter(r => r.origen === 'INEA_OBS');
    const iteaObsResults = searchResults.filter(r => r.origen === 'ITEA_OBS');
    const resguardosResults = searchResults.filter(r => r.origen === 'RESGUARDO');
    const resguardosBajasResults = searchResults.filter(r => r.origen === 'RESGUARDO_BAJA');

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
        } else if (result.origen === 'RESGUARDO') {
            // Para resguardos, usar el folio para navegar
            router.push(`/resguardos/consultar?folio=${result.folio}`);
        } else if (result.origen === 'RESGUARDO_BAJA') {
            // Para resguardos de bajas, usar el folio_resguardo para navegar
            router.push(`/resguardos/consultar/bajas?folio=${result.folio_resguardo}`);
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
                        title="Limpiar búsqueda"
                        className={`flex-shrink-0 transition-colors duration-200 ${
                            isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Resultados de búsqueda - Diseño Mejorado */}
            {showResults && (
                <div className={`absolute top-full right-0 mt-2 w-[420px] max-h-[500px] overflow-y-auto rounded-2xl shadow-2xl border transition-all duration-300 ${
                    isDarkMode 
                        ? 'bg-gradient-to-b from-black/98 to-black/95 border-white/10 backdrop-blur-3xl' 
                        : 'bg-gradient-to-b from-white/98 to-white/95 border-gray-200/50 backdrop-blur-3xl'
                } animate-in slide-in-from-top-4 fade-in-0 zoom-in-95 duration-300 scrollbar-thin ${
                    isDarkMode 
                        ? 'scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20' 
                        : 'scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400'
                }`}>
                    {searchResults.length === 0 ? (
                        <div className="p-12 text-center animate-in fade-in-0 zoom-in-95 duration-500">
                            <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                isDarkMode ? 'bg-white/5 shadow-lg shadow-white/5' : 'bg-gray-100 shadow-lg shadow-gray-200'
                            }`}>
                                <Search className={`w-7 h-7 transition-all duration-500 ${
                                    isDarkMode ? 'text-gray-600' : 'text-gray-400'
                                }`} />
                            </div>
                            <p className={`text-sm font-semibold mb-1 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                Sin resultados
                            </p>
                            <p className={`text-xs ${
                                isDarkMode ? 'text-gray-600' : 'text-gray-500'
                            }`}>
                                Intenta con otros términos de búsqueda
                            </p>
                        </div>
                    ) : (
                        <div className="p-3 space-y-3">
                            {/* Resultados INEA */}
                            {ineaResults.length > 0 && (
                                <div className="space-y-1.5 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                                    <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${
                                        isDarkMode ? 'bg-gradient-to-r from-blue-500/10 to-blue-500/5' : 'bg-gradient-to-r from-blue-50 to-blue-50/50'
                                    } backdrop-blur-sm`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                                            } animate-pulse`}></div>
                                            <span className={`text-[10px] font-bold tracking-wider uppercase ${
                                                isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                            }`}>
                                                INEA
                                            </span>
                                        </div>
                                        <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${
                                            isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-200 text-blue-700'
                                        }`}>
                                            {ineaResults.length}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {ineaResults.map((result, index) => (
                                            <div
                                                key={`inea-${result.id}`}
                                                onClick={() => handleResultClick(result)}
                                                style={{ animationDelay: `${index * 40}ms` }}
                                                className={`group px-3 py-2.5 rounded-xl transition-all duration-300 cursor-pointer animate-in fade-in-0 slide-in-from-left-2 ${
                                                    isDarkMode 
                                                        ? 'hover:bg-blue-500/10 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.97] border border-transparent hover:border-blue-500/20' 
                                                        : 'hover:bg-blue-50 hover:shadow-lg hover:shadow-blue-100/50 active:scale-[0.97] border border-transparent hover:border-blue-200'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex-1 min-w-0 space-y-1.5">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`text-xs font-mono font-bold transition-all duration-300 ${
                                                                isDarkMode ? 'text-blue-400 group-hover:text-blue-300' : 'text-blue-600 group-hover:text-blue-700'
                                                            }`}>
                                                                {result.id_inv}
                                                            </span>
                                                            {result.area && (
                                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold transition-all duration-300 ${
                                                                    isDarkMode ? 'bg-white/5 text-gray-400 group-hover:bg-white/10' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                                                }`}>
                                                                    {result.area}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-[10px] leading-relaxed truncate transition-colors duration-300 ${
                                                            isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-700'
                                                        }`}>
                                                            {result.descripcion || 'Sin descripción'}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-all duration-300 ease-out ${
                                                        isDarkMode ? 'text-gray-700 group-hover:text-blue-400 group-hover:scale-125' : 'text-gray-300 group-hover:text-blue-600 group-hover:scale-125'
                                                    } group-hover:translate-x-1`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Resultados ITEA */}
                            {iteaResults.length > 0 && (
                                <div className="space-y-1.5 animate-in fade-in-0 slide-in-from-top-2 duration-300" style={{ animationDelay: '50ms' }}>
                                    <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${
                                        isDarkMode ? 'bg-gradient-to-r from-purple-500/10 to-purple-500/5' : 'bg-gradient-to-r from-purple-50 to-purple-50/50'
                                    } backdrop-blur-sm`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                isDarkMode ? 'bg-purple-400' : 'bg-purple-600'
                                            } animate-pulse`}></div>
                                            <span className={`text-[10px] font-bold tracking-wider uppercase ${
                                                isDarkMode ? 'text-purple-400' : 'text-purple-600'
                                            }`}>
                                                ITEA
                                            </span>
                                        </div>
                                        <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${
                                            isDarkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-200 text-purple-700'
                                        }`}>
                                            {iteaResults.length}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {iteaResults.map((result, index) => (
                                            <div
                                                key={`itea-${result.id}`}
                                                onClick={() => handleResultClick(result)}
                                                style={{ animationDelay: `${index * 40}ms` }}
                                                className={`group px-3 py-2.5 rounded-xl transition-all duration-300 cursor-pointer animate-in fade-in-0 slide-in-from-left-2 ${
                                                    isDarkMode 
                                                        ? 'hover:bg-purple-500/10 hover:shadow-lg hover:shadow-purple-500/10 active:scale-[0.97] border border-transparent hover:border-purple-500/20' 
                                                        : 'hover:bg-purple-50 hover:shadow-lg hover:shadow-purple-100/50 active:scale-[0.97] border border-transparent hover:border-purple-200'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex-1 min-w-0 space-y-1.5">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`text-xs font-mono font-bold transition-all duration-300 ${
                                                                isDarkMode ? 'text-purple-400 group-hover:text-purple-300' : 'text-purple-600 group-hover:text-purple-700'
                                                            }`}>
                                                                {result.id_inv}
                                                            </span>
                                                            {result.area && (
                                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold transition-all duration-300 ${
                                                                    isDarkMode ? 'bg-white/5 text-gray-400 group-hover:bg-white/10' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                                                }`}>
                                                                    {result.area}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-[10px] leading-relaxed truncate transition-colors duration-300 ${
                                                            isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-700'
                                                        }`}>
                                                            {result.descripcion || 'Sin descripción'}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-all duration-300 ease-out ${
                                                        isDarkMode ? 'text-gray-700 group-hover:text-purple-400 group-hover:scale-125' : 'text-gray-300 group-hover:text-purple-600 group-hover:scale-125'
                                                    } group-hover:translate-x-1`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Resultados INEA Obsoletos */}
                            {ineaObsResults.length > 0 && (
                                <div className="space-y-1.5 animate-in fade-in-0 slide-in-from-top-2 duration-300" style={{ animationDelay: '100ms' }}>
                                    <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${
                                        isDarkMode ? 'bg-gradient-to-r from-orange-500/10 to-orange-500/5' : 'bg-gradient-to-r from-orange-50 to-orange-50/50'
                                    } backdrop-blur-sm`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                isDarkMode ? 'bg-orange-400' : 'bg-orange-600'
                                            } animate-pulse`}></div>
                                            <span className={`text-[10px] font-bold tracking-wider uppercase ${
                                                isDarkMode ? 'text-orange-400' : 'text-orange-600'
                                            }`}>
                                                INEA Obsoletos
                                            </span>
                                        </div>
                                        <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${
                                            isDarkMode ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-200 text-orange-700'
                                        }`}>
                                            {ineaObsResults.length}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {ineaObsResults.map((result, index) => (
                                            <div
                                                key={`inea-obs-${result.id}`}
                                                onClick={() => handleResultClick(result)}
                                                style={{ animationDelay: `${index * 40}ms` }}
                                                className={`group px-3 py-2.5 rounded-xl transition-all duration-300 cursor-pointer animate-in fade-in-0 slide-in-from-left-2 ${
                                                    isDarkMode 
                                                        ? 'hover:bg-orange-500/10 hover:shadow-lg hover:shadow-orange-500/10 active:scale-[0.97] border border-transparent hover:border-orange-500/20' 
                                                        : 'hover:bg-orange-50 hover:shadow-lg hover:shadow-orange-100/50 active:scale-[0.97] border border-transparent hover:border-orange-200'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex-1 min-w-0 space-y-1.5">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`text-xs font-mono font-bold transition-all duration-300 ${
                                                                isDarkMode ? 'text-orange-400 group-hover:text-orange-300' : 'text-orange-600 group-hover:text-orange-700'
                                                            }`}>
                                                                {result.id_inv}
                                                            </span>
                                                            {result.area && (
                                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold transition-all duration-300 ${
                                                                    isDarkMode ? 'bg-white/5 text-gray-400 group-hover:bg-white/10' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                                                }`}>
                                                                    {result.area}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-[10px] leading-relaxed truncate transition-colors duration-300 ${
                                                            isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-700'
                                                        }`}>
                                                            {result.descripcion || 'Sin descripción'}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-all duration-300 ease-out ${
                                                        isDarkMode ? 'text-gray-700 group-hover:text-orange-400 group-hover:scale-125' : 'text-gray-300 group-hover:text-orange-600 group-hover:scale-125'
                                                    } group-hover:translate-x-1`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Resultados ITEA Obsoletos */}
                            {iteaObsResults.length > 0 && (
                                <div className="space-y-1.5 animate-in fade-in-0 slide-in-from-top-2 duration-300" style={{ animationDelay: '150ms' }}>
                                    <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${
                                        isDarkMode ? 'bg-gradient-to-r from-red-500/10 to-red-500/5' : 'bg-gradient-to-r from-red-50 to-red-50/50'
                                    } backdrop-blur-sm`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                isDarkMode ? 'bg-red-400' : 'bg-red-600'
                                            } animate-pulse`}></div>
                                            <span className={`text-[10px] font-bold tracking-wider uppercase ${
                                                isDarkMode ? 'text-red-400' : 'text-red-600'
                                            }`}>
                                                ITEA Obsoletos
                                            </span>
                                        </div>
                                        <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${
                                            isDarkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-200 text-red-700'
                                        }`}>
                                            {iteaObsResults.length}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {iteaObsResults.map((result, index) => (
                                            <div
                                                key={`itea-obs-${result.id}`}
                                                onClick={() => handleResultClick(result)}
                                                style={{ animationDelay: `${index * 40}ms` }}
                                                className={`group px-3 py-2.5 rounded-xl transition-all duration-300 cursor-pointer animate-in fade-in-0 slide-in-from-left-2 ${
                                                    isDarkMode 
                                                        ? 'hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-500/10 active:scale-[0.97] border border-transparent hover:border-red-500/20' 
                                                        : 'hover:bg-red-50 hover:shadow-lg hover:shadow-red-100/50 active:scale-[0.97] border border-transparent hover:border-red-200'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex-1 min-w-0 space-y-1.5">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`text-xs font-mono font-bold transition-all duration-300 ${
                                                                isDarkMode ? 'text-red-400 group-hover:text-red-300' : 'text-red-600 group-hover:text-red-700'
                                                            }`}>
                                                                {result.id_inv}
                                                            </span>
                                                            {result.area && (
                                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold transition-all duration-300 ${
                                                                    isDarkMode ? 'bg-white/5 text-gray-400 group-hover:bg-white/10' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                                                }`}>
                                                                    {result.area}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-[10px] leading-relaxed truncate transition-colors duration-300 ${
                                                            isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-700'
                                                        }`}>
                                                            {result.descripcion || 'Sin descripción'}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-all duration-300 ease-out ${
                                                        isDarkMode ? 'text-gray-700 group-hover:text-red-400 group-hover:scale-125' : 'text-gray-300 group-hover:text-red-600 group-hover:scale-125'
                                                    } group-hover:translate-x-1`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Resultados Resguardos */}
                            {resguardosResults.length > 0 && (
                                <div className="space-y-1.5 animate-in fade-in-0 slide-in-from-top-2 duration-300" style={{ animationDelay: '200ms' }}>
                                    <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${
                                        isDarkMode ? 'bg-gradient-to-r from-green-500/10 to-green-500/5' : 'bg-gradient-to-r from-green-50 to-green-50/50'
                                    } backdrop-blur-sm`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                isDarkMode ? 'bg-green-400' : 'bg-green-600'
                                            } animate-pulse`}></div>
                                            <span className={`text-[10px] font-bold tracking-wider uppercase ${
                                                isDarkMode ? 'text-green-400' : 'text-green-600'
                                            }`}>
                                                Resguardos
                                            </span>
                                        </div>
                                        <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${
                                            isDarkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-200 text-green-700'
                                        }`}>
                                            {resguardosResults.length}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {resguardosResults.map((result, index) => (
                                            <div
                                                key={`resguardo-${result.id}`}
                                                onClick={() => handleResultClick(result)}
                                                style={{ animationDelay: `${index * 40}ms` }}
                                                className={`group px-3 py-2.5 rounded-xl transition-all duration-300 cursor-pointer animate-in fade-in-0 slide-in-from-left-2 ${
                                                    isDarkMode 
                                                        ? 'hover:bg-green-500/10 hover:shadow-lg hover:shadow-green-500/10 active:scale-[0.97] border border-transparent hover:border-green-500/20' 
                                                        : 'hover:bg-green-50 hover:shadow-lg hover:shadow-green-100/50 active:scale-[0.97] border border-transparent hover:border-green-200'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex-1 min-w-0 space-y-1.5">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <FileText className={`w-3.5 h-3.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                                                            <span className={`text-xs font-mono font-bold transition-all duration-300 ${
                                                                isDarkMode ? 'text-green-400 group-hover:text-green-300' : 'text-green-600 group-hover:text-green-700'
                                                            }`}>
                                                                {result.folio}
                                                            </span>
                                                            {result.area_resguardo && (
                                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold transition-all duration-300 ${
                                                                    isDarkMode ? 'bg-white/5 text-gray-400 group-hover:bg-white/10' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                                                }`}>
                                                                    {result.area_resguardo}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-[10px] leading-relaxed truncate transition-colors duration-300 ${
                                                            isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-700'
                                                        }`}>
                                                            {result.descripcion || 'Sin descripción'}
                                                        </p>
                                                        {(result.dir_area || result.usufinal) && (
                                                            <div className="flex items-center gap-1.5 text-[9px] flex-wrap">
                                                                {result.dir_area && (
                                                                    <span className={`px-2 py-0.5 rounded-full transition-all duration-300 ${
                                                                        isDarkMode ? 'bg-white/5 text-gray-500 group-hover:bg-white/10' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                                                    }`}>
                                                                        {result.dir_area}
                                                                    </span>
                                                                )}
                                                                {result.usufinal && (
                                                                    <span className={`px-2 py-0.5 rounded-full transition-all duration-300 ${
                                                                        isDarkMode ? 'bg-white/5 text-gray-500 group-hover:bg-white/10' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                                                    }`}>
                                                                        {result.usufinal}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-all duration-300 ease-out ${
                                                        isDarkMode ? 'text-gray-700 group-hover:text-green-400 group-hover:scale-125' : 'text-gray-300 group-hover:text-green-600 group-hover:scale-125'
                                                    } group-hover:translate-x-1`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Resultados Resguardos de Bajas */}
                            {resguardosBajasResults.length > 0 && (
                                <div className="space-y-1.5 animate-in fade-in-0 slide-in-from-top-2 duration-300" style={{ animationDelay: '250ms' }}>
                                    <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${
                                        isDarkMode ? 'bg-gradient-to-r from-gray-500/10 to-gray-500/5' : 'bg-gradient-to-r from-gray-50 to-gray-50/50'
                                    } backdrop-blur-sm`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                isDarkMode ? 'bg-gray-400' : 'bg-gray-600'
                                            } animate-pulse`}></div>
                                            <span className={`text-[10px] font-bold tracking-wider uppercase ${
                                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                                Resguardos de Bajas
                                            </span>
                                        </div>
                                        <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${
                                            isDarkMode ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-200 text-gray-700'
                                        }`}>
                                            {resguardosBajasResults.length}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {resguardosBajasResults.map((result, index) => (
                                            <div
                                                key={`resguardo-baja-${result.id}`}
                                                onClick={() => handleResultClick(result)}
                                                style={{ animationDelay: `${index * 40}ms` }}
                                                className={`group px-3 py-2.5 rounded-xl transition-all duration-300 cursor-pointer animate-in fade-in-0 slide-in-from-left-2 ${
                                                    isDarkMode 
                                                        ? 'hover:bg-gray-500/10 hover:shadow-lg hover:shadow-gray-500/10 active:scale-[0.97] border border-transparent hover:border-gray-500/20' 
                                                        : 'hover:bg-gray-50 hover:shadow-lg hover:shadow-gray-100/50 active:scale-[0.97] border border-transparent hover:border-gray-200'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex-1 min-w-0 space-y-1.5">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Archive className={`w-3.5 h-3.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                                            <span className={`text-xs font-mono font-bold transition-all duration-300 ${
                                                                isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-700'
                                                            }`}>
                                                                {result.folio_baja}
                                                            </span>
                                                            {result.area_resguardo && (
                                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold transition-all duration-300 ${
                                                                    isDarkMode ? 'bg-white/5 text-gray-400 group-hover:bg-white/10' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                                                }`}>
                                                                    {result.area_resguardo}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-[10px] leading-relaxed truncate transition-colors duration-300 ${
                                                            isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-700'
                                                        }`}>
                                                            {result.descripcion || 'Sin descripción'}
                                                        </p>
                                                        {(result.folio_resguardo || result.dir_area) && (
                                                            <div className="flex items-center gap-1.5 text-[9px] flex-wrap">
                                                                {result.folio_resguardo && (
                                                                    <span className={`px-2 py-0.5 rounded-full transition-all duration-300 ${
                                                                        isDarkMode ? 'bg-white/5 text-gray-500 group-hover:bg-white/10' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                                                    }`}>
                                                                        Resguardo: {result.folio_resguardo}
                                                                    </span>
                                                                )}
                                                                {result.dir_area && (
                                                                    <span className={`px-2 py-0.5 rounded-full transition-all duration-300 ${
                                                                        isDarkMode ? 'bg-white/5 text-gray-500 group-hover:bg-white/10' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                                                    }`}>
                                                                        {result.dir_area}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-all duration-300 ease-out ${
                                                        isDarkMode ? 'text-gray-700 group-hover:text-gray-400 group-hover:scale-125' : 'text-gray-300 group-hover:text-gray-600 group-hover:scale-125'
                                                    } group-hover:translate-x-1`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Footer mejorado */}
                            {searchResults.length === 50 && (
                                <div className={`pt-2 pb-1 text-center animate-in fade-in-0 duration-500`} style={{ animationDelay: '300ms' }}>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
                                        isDarkMode ? 'bg-white/5' : 'bg-gray-100'
                                    }`}>
                                        <div className={`w-1 h-1 rounded-full ${
                                            isDarkMode ? 'bg-gray-600' : 'bg-gray-400'
                                        } animate-pulse`}></div>
                                        <p className={`text-[10px] font-medium ${
                                            isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                        }`}>
                                            Mostrando primeros 50 resultados
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
