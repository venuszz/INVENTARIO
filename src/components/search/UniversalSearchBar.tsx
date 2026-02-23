"use client"
import { useState, useEffect, useMemo, useRef, useDeferredValue } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIneaStore } from '@/stores/ineaStore';
import { useIteaStore } from '@/stores/iteaStore';
import { useNoListadoStore } from '@/stores/noListadoStore';
import { useIneaObsoletosStore } from '@/stores/ineaObsoletosStore';
import { useIteaObsoletosStore } from '@/stores/iteaObsoletosStore';
import { useResguardosIndexation } from '@/hooks/indexation/useResguardosIndexation';
import { useResguardosBajasIndexation } from '@/hooks/indexation/useResguardosBajasIndexation';
import { useAdminStore } from '@/stores/adminStore';
import { useRouter } from 'next/navigation';
import { SearchResult } from './types';
import { normalizedIncludes, normalizedStartsWith } from '@/lib/textNormalization';
import SearchLoadingState from './SearchLoadingState';
import SearchEmptyState from './SearchEmptyState';
import SearchResultGroup from './SearchResultGroup';
import SearchHistory from './SearchHistory';
import QuickActions from './QuickActions';

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

    // Use stores directly for all inventory data
    const ineaMuebles = useIneaStore(state => state.muebles);
    const iteaMuebles = useIteaStore(state => state.muebles);
    const noListadoMuebles = useNoListadoStore(state => state.muebles);
    const ineaObsMuebles = useIneaObsoletosStore(state => state.muebles);
    const iteaObsMuebles = useIteaObsoletosStore(state => state.muebles);

    // Use indexation hooks only for resguardos
    const resguardosContext = useResguardosIndexation();
    const resguardosBajasContext = useResguardosBajasIndexation();

    // Use admin store for areas and directorio
    const areas = useAdminStore(state => state.areas);
    const directorio = useAdminStore(state => state.directorio);
    const directorioAreas = useAdminStore(state => state.directorioAreas);

    const [searchTerm, setSearchTerm] = useState('');
    const deferredSearchTerm = useDeferredValue(searchTerm);
    const [isExpanded, setIsExpanded] = useState(false);
    const [autocompleteSuggestion, setAutocompleteSuggestion] = useState('');
    const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isDropdownHovered, setIsDropdownHovered] = useState(false);
    const [searchBarWidth, setSearchBarWidth] = useState(180);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLSpanElement>(null);

    // Calcular ancho dinámico de la barra
    useEffect(() => {
        if (!isExpanded) {
            setSearchBarWidth(180);
            onExpandChange?.(false);
            return;
        }

        if (!searchTerm) {
            setSearchBarWidth(240);
            onExpandChange?.(false);
            return;
        }

        // Calcular ancho basado en el contenido
        const displayText = autocompleteSuggestion || searchTerm;
        const textWidth = measureRef.current ? measureRef.current.getBoundingClientRect().width : displayText.length * 7;

        // Padding interno del input y espacio del indicador
        const leftPadding = 36; // pl-9
        const rightSpace = autocompleteSuggestion && autocompleteSuggestion !== searchTerm ? 45 : 32;

        const minWidth = 240;
        const maxWidth = 900; // Ancho máximo para permitir expansión
        const calculatedWidth = Math.min(Math.max(minWidth, textWidth + leftPadding + rightSpace), maxWidth);

        setSearchBarWidth(calculatedWidth);
        // Notificar al Header cuando la barra es ancha (más de 350px)
        onExpandChange?.(calculatedWidth > 350);
    }, [isExpanded, searchTerm, autocompleteSuggestion, onExpandChange]);

    // Cargar historial desde localStorage
    useEffect(() => {
        const savedHistory = localStorage.getItem('searchHistory');
        if (savedHistory) {
            try {
                setSearchHistory(JSON.parse(savedHistory));
            } catch (error) {
                // Silent error
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
        ].slice(0, 10);
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
        const ineaData: SearchResult[] = (ineaMuebles || []).map((item: any) => ({
            id: item.id,
            id_inv: item.id_inv,
            descripcion: item.descripcion,
            rubro: item.rubro,
            valor: item.valor !== null ? String(item.valor) : null,
            area: item.area?.nombre || null,
            estado: item.estado,
            estatus: item.estatus,
            resguardante: item.resguardante,
            origen: 'INEA' as const
        }));

        const iteaData: SearchResult[] = (iteaMuebles || []).map((item: any) => ({
            id: item.id,
            id_inv: item.id_inv,
            descripcion: item.descripcion,
            rubro: item.rubro,
            valor: item.valor,
            area: item.area?.nombre || null,
            estado: item.estado,
            estatus: item.estatus,
            resguardante: item.resguardante,
            origen: 'ITEA' as const
        }));

        const noListadoData: SearchResult[] = (noListadoMuebles || []).map((item: any) => ({
            id: item.id,
            id_inv: item.id_inv,
            descripcion: item.descripcion,
            rubro: item.rubro,
            valor: item.valor,
            area: item.area?.nombre || null,
            estado: item.estado,
            estatus: item.estatus,
            resguardante: item.resguardante,
            origen: 'NO_LISTADO' as const
        }));

        const ineaObsData: SearchResult[] = (ineaObsMuebles || []).map((item: any) => ({
            id: item.id,
            id_inv: item.id_inv,
            descripcion: item.descripcion,
            rubro: item.rubro,
            valor: item.valor !== null ? String(item.valor) : null,
            area: item.area?.nombre || null,
            estado: item.estado,
            estatus: item.estatus,
            resguardante: item.resguardante,
            origen: 'INEA_OBS' as const
        }));

        const iteaObsData: SearchResult[] = (iteaObsMuebles || []).map((item: any) => ({
            id: item.id,
            id_inv: item.id_inv,
            descripcion: item.descripcion,
            rubro: item.rubro,
            valor: item.valor,
            area: item.area?.nombre || null,
            estado: item.estado,
            estatus: item.estatus,
            resguardante: item.resguardante,
            origen: 'ITEA_OBS' as const
        }));

        // Agrupar resguardos por folio único para evitar duplicados
        const resguardosByFolio = new Map<string, any>();
        (resguardosContext.resguardos || []).forEach(item => {
            if (!resguardosByFolio.has(item.folio)) {
                resguardosByFolio.set(item.folio, item);
            }
        });

        const resguardosData: SearchResult[] = Array.from(resguardosByFolio.values()).map(item => ({
            id: item.id.toString(),
            id_inv: null, // No mostrar num_inventario individual, solo folio
            descripcion: `Resguardo ${item.folio}`,
            rubro: null,
            valor: null,
            area: item.area_nombre || null,
            estado: null,
            estatus: null,
            resguardante: item.resguardante || null,
            origen: 'RESGUARDO' as const,
            folio: item.folio,
            folio_resguardo: item.folio,
            f_resguardo: item.f_resguardo,
            dir_area: item.director_nombre || null,
            area_resguardo: item.area_nombre || null,
            created_by_nombre: item.created_by_nombre || null
        }));

        const resguardosBajasData: SearchResult[] = (resguardosBajasContext.resguardos || []).map(item => ({
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

        // Mapear áreas
        const areasData: SearchResult[] = (areas || []).map(item => ({
            id: item.id_area.toString(),
            id_inv: null,
            descripcion: null,
            rubro: null,
            valor: null,
            area: null,
            estado: null,
            estatus: null,
            resguardante: null,
            origen: 'AREA' as const,
            nombre: item.nombre
        }));

        // Mapear directores con sus áreas asignadas
        const directoresData: SearchResult[] = (directorio || []).map(item => {
            const areasAsignadas = directorioAreas
                .filter(da => da.id_directorio === item.id_directorio)
                .map(da => {
                    const area = areas.find(a => a.id_area === da.id_area);
                    return area?.nombre || '';
                })
                .filter(Boolean);

            return {
                id: item.id_directorio.toString(),
                id_inv: null,
                descripcion: null,
                rubro: null,
                valor: null,
                area: null,
                estado: null,
                estatus: null,
                resguardante: null,
                origen: 'DIRECTOR' as const,
                nombre: item.nombre,
                puesto: item.puesto,
                areas_asignadas: areasAsignadas
            };
        });

        // Priorizar resguardos, áreas y directores sobre artículos en los resultados
        return [...resguardosData, ...resguardosBajasData, ...areasData, ...directoresData, ...ineaData, ...iteaData, ...noListadoData, ...ineaObsData, ...iteaObsData];
    }, [ineaMuebles, iteaMuebles, noListadoMuebles, ineaObsMuebles, iteaObsMuebles, resguardosContext.resguardos, resguardosBajasContext.resguardos, areas, directorio, directorioAreas]);

    // Búsqueda en tiempo real con normalización y búsqueda relacional
    const searchResults = useMemo(() => {
        if (!deferredSearchTerm.trim() || deferredSearchTerm.trim().length < 2) return [];

        const term = deferredSearchTerm.trim();
        const results: SearchResult[] = [];

        // Primero, buscar directores que coincidan
        const matchedDirectors = allData
            .filter(item => item.origen === 'DIRECTOR')
            .filter(item =>
                normalizedIncludes(item.nombre, term) ||
                normalizedIncludes(item.puesto, term) ||
                item.areas_asignadas?.some(area => normalizedIncludes(area, term))
            );

        // Búsqueda directa en todos los campos
        allData.forEach(item => {
            const isDirectMatch =
                normalizedIncludes(item.id_inv, term) ||
                normalizedIncludes(item.descripcion, term) ||
                normalizedIncludes(item.rubro, term) ||
                normalizedIncludes(item.area, term) ||
                normalizedIncludes(item.estado, term) ||
                normalizedIncludes(item.estatus, term) ||
                normalizedIncludes(item.resguardante, term) ||
                normalizedIncludes(item.folio, term) ||
                normalizedIncludes(item.folio_resguardo, term) ||
                normalizedIncludes(item.folio_baja, term) ||
                normalizedIncludes(item.dir_area, term) ||
                normalizedIncludes(item.area_resguardo, term) ||
                normalizedIncludes(item.usufinal, term) ||
                normalizedIncludes(item.num_inventario, term) ||
                normalizedIncludes(item.condicion, term) ||
                normalizedIncludes(item.motivo_baja, term) ||
                normalizedIncludes(item.nombre, term) ||
                normalizedIncludes(item.puesto, term) ||
                item.areas_asignadas?.some(area => normalizedIncludes(area, term));

            if (isDirectMatch) {
                results.push({ ...item, matchType: 'direct' });
            }
        });

        // Búsqueda relacional: Encontrar bienes y resguardos por director
        if (matchedDirectors.length > 0) {
            matchedDirectors.forEach(director => {
                // Buscar bienes con este director como resguardante
                allData.forEach(item => {
                    if (
                        (item.origen === 'INEA' ||
                            item.origen === 'ITEA' ||
                            item.origen === 'NO_LISTADO' ||
                            item.origen === 'INEA_OBS' ||
                            item.origen === 'ITEA_OBS') &&
                        normalizedIncludes(item.resguardante, director.nombre || '')
                    ) {
                        // Evitar duplicados
                        if (!results.find(r => r.id === item.id && r.origen === item.origen)) {
                            results.push({
                                ...item,
                                matchType: 'by_resguardante',
                                matchedDirector: director.nombre
                            });
                        }
                    }
                });

                // Buscar resguardos con este director
                allData.forEach(item => {
                    if (
                        (item.origen === 'RESGUARDO' || item.origen === 'RESGUARDO_BAJA') &&
                        normalizedIncludes(item.dir_area, director.nombre || '')
                    ) {
                        // Evitar duplicados
                        if (!results.find(r => r.id === item.id && r.origen === item.origen)) {
                            results.push({
                                ...item,
                                matchType: 'by_director',
                                matchedDirector: director.nombre
                            });
                        }
                    }
                });
            });
        }

        // Aplicar límites por categoría
        const categorizedResults: SearchResult[] = [];
        const limits = {
            DIRECTOR: 25,
            AREA: 25,
            RESGUARDO: 25,
            RESGUARDO_BAJA: 25,
            INEA: 50,
            ITEA: 50,
            NO_LISTADO: 50,
            INEA_OBS: 50,
            ITEA_OBS: 50
        };

        const counts: Record<string, number> = {};

        results.forEach(result => {
            const count = counts[result.origen] || 0;
            const limit = limits[result.origen as keyof typeof limits] || 50;

            if (count < limit) {
                categorizedResults.push(result);
                counts[result.origen] = count + 1;
            }
        });

        return categorizedResults;
    }, [deferredSearchTerm, allData]);

    // Actualizar sugerencia inline con normalización - Mejorado para todos los campos
    useEffect(() => {
        if (!deferredSearchTerm.trim() || deferredSearchTerm.length < 2) {
            setAutocompleteSuggestion('');
            return;
        }

        const term = deferredSearchTerm.trim();

        // Buscar coincidencias que empiecen con el término en TODOS los campos relevantes
        const match = allData.find(item => {
            return (
                // IDs y folios (prioridad alta)
                normalizedStartsWith(item.id_inv, term) ||
                normalizedStartsWith(item.folio, term) ||
                normalizedStartsWith(item.folio_resguardo, term) ||
                normalizedStartsWith(item.folio_baja, term) ||
                normalizedStartsWith(item.num_inventario, term) ||
                // Nombres (directores, áreas)
                normalizedStartsWith(item.nombre, term) ||
                // Descripciones y otros campos
                normalizedStartsWith(item.descripcion, term) ||
                normalizedStartsWith(item.rubro, term) ||
                normalizedStartsWith(item.area, term) ||
                normalizedStartsWith(item.resguardante, term) ||
                normalizedStartsWith(item.dir_area, term) ||
                normalizedStartsWith(item.puesto, term)
            );
        });

        if (match) {
            // Determinar qué campo coincidió para mostrar la sugerencia correcta
            const matchedField =
                normalizedStartsWith(match.id_inv, term) ? match.id_inv :
                    normalizedStartsWith(match.folio, term) ? match.folio :
                        normalizedStartsWith(match.folio_resguardo, term) ? match.folio_resguardo :
                            normalizedStartsWith(match.folio_baja, term) ? match.folio_baja :
                                normalizedStartsWith(match.num_inventario, term) ? match.num_inventario :
                                    normalizedStartsWith(match.nombre, term) ? match.nombre :
                                        normalizedStartsWith(match.descripcion, term) ? match.descripcion :
                                            normalizedStartsWith(match.rubro, term) ? match.rubro :
                                                normalizedStartsWith(match.area, term) ? match.area :
                                                    normalizedStartsWith(match.resguardante, term) ? match.resguardante :
                                                        normalizedStartsWith(match.dir_area, term) ? match.dir_area :
                                                            normalizedStartsWith(match.puesto, term) ? match.puesto : '';

            if (matchedField) {
                setAutocompleteSuggestion(matchedField);
            } else {
                setAutocompleteSuggestion('');
            }
        } else {
            setAutocompleteSuggestion('');
        }
    }, [deferredSearchTerm, allData]);

    // Separar resultados por origen y tipo de coincidencia
    const directoresResults = searchResults.filter(r => r.origen === 'DIRECTOR' && r.matchType === 'direct');
    const areasResults = searchResults.filter(r => r.origen === 'AREA' && r.matchType === 'direct');
    const resguardosResults = searchResults.filter(r => r.origen === 'RESGUARDO' && r.matchType === 'direct');
    const resguardosBajasResults = searchResults.filter(r => r.origen === 'RESGUARDO_BAJA' && r.matchType === 'direct');
    const ineaResults = searchResults.filter(r => r.origen === 'INEA' && r.matchType === 'direct');
    const iteaResults = searchResults.filter(r => r.origen === 'ITEA' && r.matchType === 'direct');
    const noListadoResults = searchResults.filter(r => r.origen === 'NO_LISTADO' && r.matchType === 'direct');
    const ineaObsResults = searchResults.filter(r => r.origen === 'INEA_OBS' && r.matchType === 'direct');
    const iteaObsResults = searchResults.filter(r => r.origen === 'ITEA_OBS' && r.matchType === 'direct');

    // Resultados relacionales
    const resguardosByDirector = searchResults.filter(r => r.origen === 'RESGUARDO' && r.matchType === 'by_director');
    const resguardosBajasByDirector = searchResults.filter(r => r.origen === 'RESGUARDO_BAJA' && r.matchType === 'by_director');
    const bienesByResguardante = searchResults.filter(r =>
        (r.origen === 'INEA' || r.origen === 'ITEA' || r.origen === 'NO_LISTADO' ||
            r.origen === 'INEA_OBS' || r.origen === 'ITEA_OBS') &&
        r.matchType === 'by_resguardante'
    );

    // Aplanar resultados para navegación por teclado
    const flatResults = useMemo(() => {
        return searchResults;
    }, [searchResults]);

    // Resetear índice cuando cambian los resultados o cuando el mouse sale del dropdown
    useEffect(() => {
        if (!isDropdownHovered) {
            setSelectedIndex(-1);
        }
    }, [deferredSearchTerm, isDropdownHovered]);

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
        // Si hay resultados de búsqueda, navegar por ellos
        if (deferredSearchTerm.trim().length >= 2) {
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
        } else if (!deferredSearchTerm.trim() && (searchHistory.length > 0 || userRoles.length > 0)) {
            // Si no hay búsqueda pero hay historial o acciones rápidas
            const totalItems = searchHistory.length > 0 ? searchHistory.length : (userRoles.includes('admin') || userRoles.includes('superadmin') ? 9 : 5);

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => prev < totalItems - 1 ? prev + 1 : 0);
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => prev > 0 ? prev - 1 : totalItems - 1);
                    break;

                case 'Enter':
                    e.preventDefault();
                    if (searchHistory.length > 0 && selectedIndex >= 0 && searchHistory[selectedIndex]) {
                        handleHistorySelect(searchHistory[selectedIndex].query);
                    }
                    // Las acciones rápidas se manejan con su propio onClick
                    break;

                case 'Escape':
                    e.preventDefault();
                    handleClear();
                    setIsExpanded(false);
                    inputRef.current?.blur();
                    break;
            }
        } else {
            // Sin resultados ni historial, solo manejar Escape
            if (e.key === 'Escape') {
                e.preventDefault();
                handleClear();
                setIsExpanded(false);
                inputRef.current?.blur();
            }
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
        } else if (result.origen === 'NO_LISTADO') {
            router.push(`/consultas/no-listado?id=${result.id}`);
        } else if (result.origen === 'INEA_OBS') {
            router.push(`/consultas/inea/obsoletos?id=${result.id}`);
        } else if (result.origen === 'ITEA_OBS') {
            router.push(`/consultas/itea/obsoletos?id=${result.id}`);
        } else if (result.origen === 'RESGUARDO') {
            router.push(`/resguardos/consultar?folio=${result.folio}`);
        } else if (result.origen === 'RESGUARDO_BAJA') {
            router.push(`/resguardos/consultar/bajas?folio=${result.folio_resguardo}`);
        } else if (result.origen === 'AREA') {
            router.push(`/admin/personal?area=${encodeURIComponent(result.nombre || '')}`);
        } else if (result.origen === 'DIRECTOR') {
            router.push(`/admin/personal?director=${encodeURIComponent(result.nombre || '')}`);
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
            {/* Elemento oculto para medir el ancho real del texto */}
            <span
                ref={measureRef}
                className="absolute opacity-0 pointer-events-none whitespace-pre text-sm font-light"
                aria-hidden="true"
            >
                {autocompleteSuggestion || searchTerm}
            </span>
            <motion.div
                animate={{
                    width: searchBarWidth
                }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
            >
                {/* Background layer */}
                <div className={`absolute inset-0 rounded-lg ${isDarkMode ? 'bg-neutral-900' : 'bg-neutral-100'
                    }`} />

                {/* Search Icon */}
                <div className="absolute top-1/2 left-2.5 -translate-y-1/2 z-10 pointer-events-none">
                    <Search className={`w-4 h-4 transition-colors duration-200 ${isExpanded
                        ? (isDarkMode ? 'text-white/50' : 'text-black/50')
                        : (isDarkMode ? 'text-white/30' : 'text-black/30')
                        }`} />
                </div>

                {/* Ghost text layer for autocomplete - Mejorado con padding dinámico */}
                {autocompleteSuggestion && autocompleteSuggestion !== searchTerm && isExpanded && searchTerm && (
                    <div
                        className="absolute inset-0 pl-9 py-1.5 flex items-center pointer-events-none z-[1]"
                        style={{
                            paddingRight: '60px'
                        }}
                    >
                        <div className="flex items-center w-full overflow-hidden">
                            <span className="text-sm font-light opacity-0 flex-shrink-0 whitespace-pre">{searchTerm}</span>
                            <span className={`text-sm font-light flex-shrink-0 whitespace-pre ${isDarkMode ? 'text-white/25' : 'text-black/25'}`}>
                                {autocompleteSuggestion.slice(searchTerm.length)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Input - Transparent background con padding dinámico */}
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsExpanded(true)}
                    onBlur={() => setTimeout(() => !searchTerm && setIsExpanded(false), 150)}
                    onKeyDown={handleKeyDown}
                    className={`relative w-full pl-9 py-1.5 rounded-lg text-sm font-light focus:outline-none transition-all duration-200 bg-transparent z-[2] ${isDarkMode
                        ? 'text-white placeholder-white/40'
                        : 'text-black placeholder-black/40'
                        }`}
                    style={{
                        caretColor: isDarkMode ? 'white' : 'black',
                        paddingRight: autocompleteSuggestion && autocompleteSuggestion !== searchTerm && searchTerm ? '60px' : searchTerm && !autocompleteSuggestion ? '36px' : '36px'
                    }}
                />

                {/* Dynamic Keyboard Hints - Mejorados sin espacio reservado */}
                <div className="absolute top-1/2 right-2.5 -translate-y-1/2 z-10 pointer-events-none">
                    <AnimatePresence mode="wait">
                        {/* Hint when collapsed - Show "F" key */}
                        {!isExpanded && !searchTerm && (
                            <motion.div
                                key="f-hint"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${isDarkMode
                                    ? 'bg-white/5 text-white/30'
                                    : 'bg-black/5 text-black/30'
                                    }`}>
                                    F
                                </div>
                            </motion.div>
                        )}

                        {/* Hint when expanded without search - Show "Esc" key */}
                        {isExpanded && !searchTerm && (
                            <motion.div
                                key="esc-hint"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${isDarkMode
                                    ? 'bg-white/5 text-white/30'
                                    : 'bg-black/5 text-black/30'
                                    }`}>
                                    Esc
                                </div>
                            </motion.div>
                        )}

                        {/* Hint when autocomplete is available - Show "Tab" key - Mejorado */}
                        {autocompleteSuggestion && autocompleteSuggestion !== searchTerm && isExpanded && searchTerm && (
                            <motion.div
                                key="tab-hint"
                                initial={{ opacity: 0, x: 5 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 5 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${isDarkMode
                                    ? 'bg-white/10 text-white/50'
                                    : 'bg-black/10 text-black/50'
                                    }`}>
                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                    <span>Tab</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Clear button - Solo cuando hay texto y NO hay autocompletado - Con pointer-events */}
                {searchTerm && !autocompleteSuggestion && (
                    <motion.button
                        key="clear-button"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={handleClear}
                        className={`absolute top-1/2 right-2.5 -translate-y-1/2 z-10 p-1 rounded-full transition-colors pointer-events-auto ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
                            }`}
                    >
                        <X className={`w-3.5 h-3.5 ${isDarkMode ? 'text-white/40 hover:text-white/60' : 'text-black/40 hover:text-black/60'}`} />
                    </motion.button>
                )}
            </motion.div>

            {/* Dropdown */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        onMouseEnter={() => setIsDropdownHovered(true)}
                        onMouseLeave={() => {
                            setIsDropdownHovered(false);
                            setSelectedIndex(-1);
                        }}
                        className={`absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto shadow-2xl ${isDarkMode
                            ? 'bg-neutral-900 border border-white/10'
                            : 'bg-neutral-100 border border-black/5'
                            }`}
                        style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch'
                        }}
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
                                            <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${isDarkMode
                                                ? 'bg-white/5 border-white/10 text-white/30'
                                                : 'bg-black/5 border-black/10 text-black/30'
                                                }`}>
                                                ↑↓
                                            </div>
                                            <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${isDarkMode
                                                ? 'bg-white/5 border-white/10 text-white/30'
                                                : 'bg-black/5 border-black/10 text-black/30'
                                                }`}>
                                                ↵
                                            </div>
                                            <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${isDarkMode
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
                                                {/* Resultados Directos */}
                                                {directoresResults.length > 0 && (
                                                    <>
                                                        <SearchResultGroup
                                                            title="Directores"
                                                            results={directoresResults}
                                                            onResultClick={handleResultClick}
                                                            isDarkMode={isDarkMode}
                                                            startIndex={currentIndex}
                                                            selectedIndex={selectedIndex}
                                                            onMouseEnter={setSelectedIndex}
                                                        />
                                                        {(() => { currentIndex += directoresResults.length; return null; })()}
                                                    </>
                                                )}
                                                {areasResults.length > 0 && (
                                                    <>
                                                        <SearchResultGroup
                                                            title="Áreas"
                                                            results={areasResults}
                                                            onResultClick={handleResultClick}
                                                            isDarkMode={isDarkMode}
                                                            startIndex={currentIndex}
                                                            selectedIndex={selectedIndex}
                                                            onMouseEnter={setSelectedIndex}
                                                        />
                                                        {(() => { currentIndex += areasResults.length; return null; })()}
                                                    </>
                                                )}
                                                {resguardosResults.length > 0 && (
                                                    <>
                                                        <SearchResultGroup
                                                            title="Resguardos (Coincidencia Directa)"
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
                                                    <>
                                                        <SearchResultGroup
                                                            title="Bajas de Resguardos (Coincidencia Directa)"
                                                            results={resguardosBajasResults}
                                                            onResultClick={handleResultClick}
                                                            isDarkMode={isDarkMode}
                                                            startIndex={currentIndex}
                                                            selectedIndex={selectedIndex}
                                                            onMouseEnter={setSelectedIndex}
                                                        />
                                                        {(() => { currentIndex += resguardosBajasResults.length; return null; })()}
                                                    </>
                                                )}
                                                {ineaResults.length > 0 && (
                                                    <>
                                                        <SearchResultGroup
                                                            title="Artículos INEA (Coincidencia Directa)"
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
                                                            title="Artículos ITEA (Coincidencia Directa)"
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
                                                {noListadoResults.length > 0 && (
                                                    <>
                                                        <SearchResultGroup
                                                            title="Artículos TLAXCALA (Coincidencia Directa)"
                                                            results={noListadoResults}
                                                            onResultClick={handleResultClick}
                                                            isDarkMode={isDarkMode}
                                                            startIndex={currentIndex}
                                                            selectedIndex={selectedIndex}
                                                            onMouseEnter={setSelectedIndex}
                                                        />
                                                        {(() => { currentIndex += noListadoResults.length; return null; })()}
                                                    </>
                                                )}
                                                {ineaObsResults.length > 0 && (
                                                    <>
                                                        <SearchResultGroup
                                                            title="INEA Obsoletos (Coincidencia Directa)"
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
                                                            title="ITEA Obsoletos (Coincidencia Directa)"
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

                                                {/* Resultados Relacionales */}
                                                {resguardosByDirector.length > 0 && (
                                                    <>
                                                        <SearchResultGroup
                                                            title="Resguardos por Director"
                                                            results={resguardosByDirector}
                                                            onResultClick={handleResultClick}
                                                            isDarkMode={isDarkMode}
                                                            startIndex={currentIndex}
                                                            selectedIndex={selectedIndex}
                                                            onMouseEnter={setSelectedIndex}
                                                        />
                                                        {(() => { currentIndex += resguardosByDirector.length; return null; })()}
                                                    </>
                                                )}
                                                {resguardosBajasByDirector.length > 0 && (
                                                    <>
                                                        <SearchResultGroup
                                                            title="Bajas de Resguardos por Director/Resguardante"
                                                            results={resguardosBajasByDirector}
                                                            onResultClick={handleResultClick}
                                                            isDarkMode={isDarkMode}
                                                            startIndex={currentIndex}
                                                            selectedIndex={selectedIndex}
                                                            onMouseEnter={setSelectedIndex}
                                                        />
                                                        {(() => { currentIndex += resguardosBajasByDirector.length; return null; })()}
                                                    </>
                                                )}
                                                {bienesByResguardante.length > 0 && (
                                                    <>
                                                        <SearchResultGroup
                                                            title="Artículos por Resguardante"
                                                            results={bienesByResguardante}
                                                            onResultClick={handleResultClick}
                                                            isDarkMode={isDarkMode}
                                                            startIndex={currentIndex}
                                                            selectedIndex={selectedIndex}
                                                            onMouseEnter={setSelectedIndex}
                                                        />
                                                        {(() => { currentIndex += bienesByResguardante.length; return null; })()}
                                                    </>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            )
                        ) : searchHistory.length > 0 ? (
                            // Mostrar historial cuando no hay búsqueda
                            <SearchHistory
                                history={searchHistory}
                                onSelect={handleHistorySelect}
                                onRemove={removeFromHistory}
                                onClear={clearHistory}
                                isDarkMode={isDarkMode}
                                selectedIndex={selectedIndex}
                                onMouseEnter={setSelectedIndex}
                            />
                        ) : (
                            // Mostrar acciones rápidas cuando no hay búsqueda ni historial
                            <QuickActions
                                isDarkMode={isDarkMode}
                                userRoles={userRoles}
                                selectedIndex={selectedIndex}
                                onMouseEnter={setSelectedIndex}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
