"use client"
import { useState, useEffect, useMemo, useRef, useDeferredValue, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { useIneaIndexation } from '@/hooks/indexation/useIneaIndexation';
import { useIteaIndexation } from '@/hooks/indexation/useIteaIndexation';
import { useResguardosIndexation } from '@/hooks/indexation/useResguardosIndexation';
import { useIneaObsoletosIndexation } from '@/hooks/indexation/useIneaObsoletosIndexation';
import { useIteaObsoletosIndexation } from '@/hooks/indexation/useIteaObsoletosIndexation';
import { useResguardosBajasIndexation } from '@/hooks/indexation/useResguardosBajasIndexation';
import { useRouter } from 'next/navigation';
import { SearchResult } from './types';
import SearchLoadingState from './SearchLoadingState';
import SearchEmptyState from './SearchEmptyState';
import SearchResultGroup from './SearchResultGroup';
import SearchHistory from './SearchHistory';

interface SearchHistoryItem {
    query: string;
    timestamp: number;
    resultsCount: number;
}

interface UniversalSearchBarProps {
    isDarkMode: boolean;
    userRoles: string[];
    onExpandChange?: (isExpanded: boolean) => void;
}

export default function UniversalSearchBar({ isDarkMode, userRoles, onExpandChange }: UniversalSearchBarProps) {
    const router = useRouter();
    const ineaContext = useIneaIndexation();
    const iteaContext = useIteaIndexation();
    const resguardosContext = useResguardosIndexation();
    const ineaObsContext = useIneaObsoletosIndexation();
    const iteaObsContext = useIteaObsoletosIndexation();
    const resguardosBajasContext = useResguardosBajasIndexation();

    const [searchTerm, setSearchTerm] = useState('');
    const deferredSearchTerm = useDeferredValue(searchTerm);
    const [isExpanded, setIsExpanded] = useState(false);
    const [autocompleteSuggestion, setAutocompleteSuggestion] = useState('');
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Cargar historial desde localStorage
    useEffect(() => {
        const savedHistory = localStorage.getItem('searchHistory');
        if (savedHistory) {
            try {
                setSearchHistory(JSON.parse(savedHistory));
            } catch (error) {
                console.error('Error loading search history:', error);
            }
        }
    }, []);

    // Listener global para tecla F
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInputFocused = 
                target.tagName === 'INPUT' || 
                target.tagName === 'TEXTAREA' || 
                target.isContentEditable;

            if (e.key.toLowerCase() === 'f' && !isInputFocused && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                setIsExpanded(true);
                // Usar setTimeout para asegurar que el input esté disponible después de la expansión
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 50);
            }
        };

        document.addEventListener('keydown', handleGlobalKeyDown);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    // Guardar historial en localStorage
    const saveHistory = (history: SearchHistoryItem[]) => {
        localStorage.setItem('searchHistory', JSON.stringify(history));
        setSearchHistory(history);
    };

    // Agregar al historial
    const addToHistory = (query: string, resultsCount: number) => {
        const newHistory = [
            { query, timestamp: Date.now(), resultsCount },
            ...searchHistory.filter(item => item.query !== query)
        ].slice(0, 10); // Mantener solo los últimos 10
        saveHistory(newHistory);
    };

    // Eliminar del historial
    const removeFromHistory = (query: string) => {
        const newHistory = searchHistory.filter(item => item.query !== query);
        saveHistory(newHistory);
    };

    // Limpiar historial
    const clearHistory = () => {
        saveHistory([]);
    };

    // Combinar datos indexados
    const allData = useMemo(() => {
        const ineaData: SearchResult[] = ineaContext.muebles.map(item => ({
            id: item.id,
            id_inv: item.id_inv,
            descripcion: item.descripcion,
            rubro: item.rubro,
            valor: item.valor !== null ? String(item.valor) : null,
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

        const ineaObsData: SearchResult[] = ineaObsContext.muebles.map(item => ({
            id: item.id,
            id_inv: item.id_inv,
            descripcion: item.descripcion,
            rubro: item.rubro,
            valor: item.valor !== null ? String(item.valor) : null,
            area: item.area,
            estado: item.estado,
            estatus: item.estatus,
            resguardante: item.resguardante,
            origen: 'INEA_OBS' as const
        }));

        const iteaObsData: SearchResult[] = iteaObsContext.muebles.map(item => ({
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

        const resguardosBajasData: SearchResult[] = resguardosBajasContext.resguardos.map(item => ({
            id: item.id,
            id_inv: item.num_inventario as string | null,
            descripcion: item.descripcion as string | null,
            rubro: (item.rubro as string | null) ?? null,
            valor: null,
            area: (item.area_resguardo as string | null) ?? null,
            estado: (item.condicion as string | null) ?? null,
            estatus: null,
            resguardante: (item.usufinal as string | null) ?? null,
            origen: 'RESGUARDO_BAJA' as const,
            folio_resguardo: (item.folio_resguardo as string | null) ?? null,
            folio_baja: (item.folio_baja as string | null) ?? null,
            f_resguardo: (item.f_resguardo as string | null) ?? null,
            f_baja: item.f_baja as string | null,
            dir_area: (item.dir_area as string | null) ?? null,
            area_resguardo: (item.area_resguardo as string | null) ?? null,
            usufinal: (item.usufinal as string | null) ?? null,
            num_inventario: item.num_inventario as string | null,
            condicion: (item.condicion as string | null) ?? null,
            motivo_baja: (item.motivo as string | null) ?? null
        }));

        return [...ineaData, ...iteaData, ...ineaObsData, ...iteaObsData, ...resguardosData, ...resguardosBajasData];
    }, [ineaContext.muebles, iteaContext.muebles, ineaObsContext.muebles, iteaObsContext.muebles, resguardosContext.resguardos, resguardosBajasContext.resguardos]);

    // Búsqueda en tiempo real
    const searchResults = useMemo(() => {
        if (!deferredSearchTerm.trim()) return [];

        const term = deferredSearchTerm.toLowerCase().trim();

        return allData.filter(item => {
            return (
                item.id_inv?.toLowerCase().includes(term) ||
                item.descripcion?.toLowerCase().includes(term) ||
                item.rubro?.toLowerCase().includes(term) ||
                item.area?.toLowerCase().includes(term) ||
                item.estado?.toLowerCase().includes(term) ||
                item.estatus?.toLowerCase().includes(term) ||
                item.resguardante?.toLowerCase().includes(term) ||
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
        }).slice(0, 50);
    }, [deferredSearchTerm, allData]);

    // Actualizar sugerencia inline
    useEffect(() => {
        if (!deferredSearchTerm.trim() || deferredSearchTerm.length < 2) {
            setAutocompleteSuggestion('');
            return;
        }

        const term = deferredSearchTerm.toLowerCase().trim();

        const match = allData.find(item => {
            return (
                item.id_inv?.toLowerCase().startsWith(term) ||
                item.folio?.toLowerCase().startsWith(term) ||
                item.folio_resguardo?.toLowerCase().startsWith(term) ||
                item.folio_baja?.toLowerCase().startsWith(term) ||
                item.num_inventario?.toLowerCase().startsWith(term)
            );
        });

        if (match) {
            const matchedField =
                match.id_inv?.toLowerCase().startsWith(term) ? match.id_inv :
                    match.folio?.toLowerCase().startsWith(term) ? match.folio :
                        match.folio_resguardo?.toLowerCase().startsWith(term) ? match.folio_resguardo :
                            match.folio_baja?.toLowerCase().startsWith(term) ? match.folio_baja :
                                match.num_inventario?.toLowerCase().startsWith(term) ? match.num_inventario : '';

            if (matchedField) {
                setAutocompleteSuggestion(matchedField);
            } else {
                setAutocompleteSuggestion('');
            }
        } else {
            setAutocompleteSuggestion('');
        }
    }, [deferredSearchTerm, allData]);

    // Separar resultados por origen
    const ineaResults = searchResults.filter(r => r.origen === 'INEA');
    const iteaResults = searchResults.filter(r => r.origen === 'ITEA');
    const ineaObsResults = searchResults.filter(r => r.origen === 'INEA_OBS');
    const iteaObsResults = searchResults.filter(r => r.origen === 'ITEA_OBS');
    const resguardosResults = searchResults.filter(r => r.origen === 'RESGUARDO');
    const resguardosBajasResults = searchResults.filter(r => r.origen === 'RESGUARDO_BAJA');

    // Aplanar resultados para navegación por teclado
    const flatResults = useMemo(() => {
        return searchResults;
    }, [searchResults]);

    // Resetear índice cuando cambian los resultados
    useEffect(() => {
        setSelectedIndex(-1);
    }, [deferredSearchTerm]);

    // Scroll automático del elemento seleccionado
    useEffect(() => {
        if (selectedIndex >= 0 && dropdownRef.current) {
            const selectedElement = dropdownRef.current.querySelector(`[data-search-index="${selectedIndex}"]`);
            if (selectedElement) {
                selectedElement.scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth'
                });
            }
        }
    }, [selectedIndex]);

    // Notificar cambios de expansión
    useEffect(() => {
        onExpandChange?.(isExpanded);
    }, [isExpanded, onExpandChange]);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsExpanded(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClear = () => {
        setSearchTerm('');
        setAutocompleteSuggestion('');
        setSelectedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const totalItems = flatResults.length;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => prev < totalItems - 1 ? prev + 1 : 0);
                break;

            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : totalItems - 1);
                break;

            case 'Tab':
                if (autocompleteSuggestion && autocompleteSuggestion !== searchTerm && !e.shiftKey) {
                    e.preventDefault();
                    setSearchTerm(autocompleteSuggestion);
                }
                break;

            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && flatResults[selectedIndex]) {
                    handleResultClick(flatResults[selectedIndex]);
                } else if (flatResults.length > 0) {
                    handleResultClick(flatResults[0]);
                }
                break;

            case 'Escape':
                e.preventDefault();
                handleClear();
                setIsExpanded(false);
                inputRef.current?.blur();
                break;
        }
    };

    const handleResultClick = (result: SearchResult) => {
        // Agregar al historial antes de navegar
        if (searchTerm.trim().length >= 2) {
            addToHistory(searchTerm, searchResults.length);
        }

        if (result.origen === 'INEA') {
            router.push(`/consultas/inea/general?id=${result.id}`);
        } else if (result.origen === 'ITEA') {
            router.push(`/consultas/itea/general?id=${result.id}`);
        } else if (result.origen === 'INEA_OBS') {
            router.push(`/consultas/inea/obsoletos?id=${result.id}`);
        } else if (result.origen === 'ITEA_OBS') {
            router.push(`/consultas/itea/obsoletos?id=${result.id}`);
        } else if (result.origen === 'RESGUARDO') {
            router.push(`/resguardos/consultar?folio=${result.folio}`);
        } else if (result.origen === 'RESGUARDO_BAJA') {
            router.push(`/resguardos/consultar/bajas?folio=${result.folio_resguardo}`);
        }
        setSearchTerm('');
        setAutocompleteSuggestion('');
        setIsExpanded(false);
    };

    const handleHistorySelect = (query: string) => {
        setSearchTerm(query);
        inputRef.current?.focus();
    };

    const isSearching = deferredSearchTerm !== searchTerm;

    return (
        <div ref={searchRef} className="relative">
            <motion.div 
                animate={{ width: isExpanded ? 240 : 180 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
            >
                {/* Background layer */}
                <div className={`absolute inset-0 rounded-lg ${
                    isDarkMode ? 'bg-neutral-900' : 'bg-neutral-100'
                }`} />

                {/* Search Icon */}
                <div className="absolute top-1/2 left-2.5 -translate-y-1/2 z-10 pointer-events-none">
                    <Search className={`w-4 h-4 transition-colors duration-200 ${
                        isExpanded 
                            ? (isDarkMode ? 'text-white/50' : 'text-black/50') 
                            : (isDarkMode ? 'text-white/30' : 'text-black/30')
                    }`} />
                </div>

                {/* Ghost text layer for autocomplete */}
                {autocompleteSuggestion && autocompleteSuggestion !== searchTerm && isExpanded && searchTerm && (
                    <div className="absolute inset-0 pl-9 pr-9 py-1.5 flex items-center pointer-events-none z-[1] overflow-hidden">
                        <div className="flex items-center whitespace-nowrap overflow-hidden">
                            <span className="text-sm font-light opacity-0 flex-shrink-0">{searchTerm}</span>
                            <span className={`text-sm font-light truncate ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                                {autocompleteSuggestion.slice(searchTerm.length)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Input - Transparent background */}
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsExpanded(true)}
                    onBlur={() => setTimeout(() => !searchTerm && setIsExpanded(false), 150)}
                    onKeyDown={handleKeyDown}
                    className={`relative w-full pl-9 pr-9 py-1.5 rounded-lg text-sm font-light focus:outline-none transition-all duration-200 bg-transparent z-[2] ${
                        isDarkMode
                            ? 'text-white placeholder-white/40'
                            : 'text-black placeholder-black/40'
                    }`}
                    style={{ 
                        caretColor: isDarkMode ? 'white' : 'black'
                    }}
                />

                {/* Dynamic Keyboard Hints */}
                <AnimatePresence mode="wait">
                    {!searchTerm && (
                        <>
                            {/* Hint when collapsed - Show "F" key */}
                            {!isExpanded && (
                                <motion.div
                                    key="f-hint"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-1/2 right-2 -translate-y-1/2 z-10 pointer-events-none"
                                >
                                    <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                        isDarkMode 
                                            ? 'bg-white/5 border-white/10 text-white/40' 
                                            : 'bg-black/5 border-black/10 text-black/40'
                                    }`}>
                                        F
                                    </div>
                                </motion.div>
                            )}
                        </>
                    )}

                    {/* Hint when autocomplete is available - Show "Tab" key */}
                    {autocompleteSuggestion && autocompleteSuggestion !== searchTerm && isExpanded && (
                        <motion.div
                            key="tab-hint"
                            initial={{ opacity: 0, x: 5 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 5 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-1/2 right-2 -translate-y-1/2 z-10 pointer-events-none"
                        >
                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${
                                isDarkMode 
                                    ? 'bg-white/10 border-white/20 text-white/60' 
                                    : 'bg-black/10 border-black/20 text-black/60'
                            }`}>
                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                Tab
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Clear button */}
                <AnimatePresence>
                    {searchTerm && !autocompleteSuggestion && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={handleClear}
                            className={`absolute top-1/2 right-2 -translate-y-1/2 z-10 p-1 rounded-full transition-colors ${
                                isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
                            }`}
                        >
                            <X className={`w-3.5 h-3.5 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
                        </motion.button>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Dropdown */}
            <AnimatePresence>
                {isExpanded && (deferredSearchTerm.trim().length >= 2 || searchHistory.length > 0) && (
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className={`absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto shadow-2xl ${
                            isDarkMode
                                ? 'bg-neutral-900 border border-white/10'
                                : 'bg-neutral-100 border border-black/5'
                        }`}
                    >
                        {deferredSearchTerm.trim().length >= 2 ? (
                            // Mostrar resultados de búsqueda
                            isSearching ? (
                                <SearchLoadingState isDarkMode={isDarkMode} />
                            ) : searchResults.length === 0 ? (
                                <SearchEmptyState query={deferredSearchTerm} isDarkMode={isDarkMode} />
                            ) : (
                                <div className="p-1.5">
                                    {/* Header with keyboard hints */}
                                    <div className="px-2 py-1 mb-1 flex items-center justify-between">
                                        <span className={`text-[10px] font-medium ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                                            {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                                isDarkMode 
                                                    ? 'bg-white/5 border-white/10 text-white/30' 
                                                    : 'bg-black/5 border-black/10 text-black/30'
                                            }`}>
                                                ↑↓
                                            </div>
                                            <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                                isDarkMode 
                                                    ? 'bg-white/5 border-white/10 text-white/30' 
                                                    : 'bg-black/5 border-black/10 text-black/30'
                                            }`}>
                                                ↵
                                            </div>
                                            <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                                isDarkMode 
                                                    ? 'bg-white/5 border-white/10 text-white/30' 
                                                    : 'bg-black/5 border-black/10 text-black/30'
                                            }`}>
                                                Esc
                                            </div>
                                        </div>
                                    </div>

                                    {(() => {
                                        let currentIndex = 0;
                                        return (
                                            <>
                                                {ineaResults.length > 0 && (
                                                    <>
                                                        <SearchResultGroup 
                                                            title="INEA" 
                                                            results={ineaResults} 
                                                            onResultClick={handleResultClick} 
                                                            isDarkMode={isDarkMode}
                                                            startIndex={currentIndex}
                                                            selectedIndex={selectedIndex}
                                                            onMouseEnter={setSelectedIndex}
                                                        />
                                                        {(() => { currentIndex += ineaResults.length; return null; })()}
                                                    </>
                                                )}
                                                {iteaResults.length > 0 && (
                                                    <>
                                                        <SearchResultGroup 
                                                            title="ITEA" 
                                                            results={iteaResults} 
                                                            onResultClick={handleResultClick} 
                                                            isDarkMode={isDarkMode}
                                                            startIndex={currentIndex}
                                                            selectedIndex={selectedIndex}
                                                            onMouseEnter={setSelectedIndex}
                                                        />
                                                        {(() => { currentIndex += iteaResults.length; return null; })()}
                                                    </>
                                                )}
                                                {ineaObsResults.length > 0 && (
                                                    <>
                                                        <SearchResultGroup 
                                                            title="INEA Obsoletos" 
                                                            results={ineaObsResults} 
                                                            onResultClick={handleResultClick} 
                                                            isDarkMode={isDarkMode}
                                                            startIndex={currentIndex}
                                                            selectedIndex={selectedIndex}
                                                            onMouseEnter={setSelectedIndex}
                                                        />
                                                        {(() => { currentIndex += ineaObsResults.length; return null; })()}
                                                    </>
                                                )}
                                                {iteaObsResults.length > 0 && (
                                                    <>
                                                        <SearchResultGroup 
                                                            title="ITEA Obsoletos" 
                                                            results={iteaObsResults} 
                                                            onResultClick={handleResultClick} 
                                                            isDarkMode={isDarkMode}
                                                            startIndex={currentIndex}
                                                            selectedIndex={selectedIndex}
                                                            onMouseEnter={setSelectedIndex}
                                                        />
                                                        {(() => { currentIndex += iteaObsResults.length; return null; })()}
                                                    </>
                                                )}
                                                {resguardosResults.length > 0 && (
                                                    <>
                                                        <SearchResultGroup 
                                                            title="Resguardos" 
                                                            results={resguardosResults} 
                                                            onResultClick={handleResultClick} 
                                                            isDarkMode={isDarkMode}
                                                            startIndex={currentIndex}
                                                            selectedIndex={selectedIndex}
                                                            onMouseEnter={setSelectedIndex}
                                                        />
                                                        {(() => { currentIndex += resguardosResults.length; return null; })()}
                                                    </>
                                                )}
                                                {resguardosBajasResults.length > 0 && (
                                                    <SearchResultGroup 
                                                        title="Resguardos de Bajas" 
                                                        results={resguardosBajasResults} 
                                                        onResultClick={handleResultClick} 
                                                        isDarkMode={isDarkMode}
                                                        startIndex={currentIndex}
                                                        selectedIndex={selectedIndex}
                                                        onMouseEnter={setSelectedIndex}
                                                    />
                                                )}
                                            </>
                                        );
                                    })()}

                                    {searchResults.length === 50 && (
                                        <div className="pt-2 pb-1 text-center">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                                                <p className={`text-[10px] font-medium ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                                                    Mostrando primeros 50 resultados
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        ) : (
                            // Mostrar historial cuando no hay búsqueda
                            <SearchHistory
                                history={searchHistory}
                                onSelect={handleHistorySelect}
                                onRemove={removeFromHistory}
                                onClear={clearHistory}
                                isDarkMode={isDarkMode}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
