"use client";
import { generateExcel } from '@/components/reportes/excelgenerator';
import { generatePDF } from '@/components/consultas/PDFLevantamiento';
import { generatePDF as generatePDFPerArea } from '@/components/consultas/PDFLevantamientoPerArea';
import { useUserRole } from "@/hooks/useUserRole";
import React from 'react';
import { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react';
import {
    Search, RefreshCw, ChevronLeft, ChevronRight,
    ArrowUpDown, AlertCircle, X, FileUp, File
} from 'lucide-react';
import supabase from '@/app/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { BadgeCheck } from 'lucide-react';
import ReactDOM from 'react-dom';
import { useTheme } from '@/context/ThemeContext';
import { useIneaIndexation } from '@/hooks/indexation/useIneaIndexation';
import { useIteaIndexation } from '@/hooks/indexation/useIteaIndexation';

// Tipo unificado para INEA/ITEA
interface LevMueble {
    id: number;
    id_inv: string;
    rubro: string | null;
    descripcion: string | null;
    valor: number | string | null;
    f_adq: string | null;
    formadq: string | null;
    proveedor: string | null;
    factura: string | null;
    ubicacion_es: string | null;
    ubicacion_mu: string | null;
    ubicacion_no: string | null;
    estado: string | null;
    estatus: string | null;
    area: string | null;
    usufinal: string | null;
    fechabaja: string | null;
    causadebaja: string | null;
    resguardante: string | null;
    image_path: string | null;
    origen: 'INEA' | 'ITEA';
}

interface Message {
    type: 'success' | 'error' | 'info' | 'warning';
    text: string;
}

const getOrigenColors = (isDarkMode: boolean) => ({
    INEA: isDarkMode ? 'bg-white/90 text-gray-900 border border-white/80' : 'bg-blue-50 text-blue-900 border border-blue-200',
    ITEA: isDarkMode ? 'bg-white/80 text-gray-900 border border-white/70' : 'bg-green-50 text-green-900 border border-green-200',
});

const getEstatusColors = (isDarkMode: boolean) => ({
    ACTIVO: isDarkMode ? 'bg-white/90 text-gray-900 border border-white/80' : 'bg-green-50 text-green-900 border border-green-200',
    INACTIVO: isDarkMode ? 'bg-white/80 text-gray-900 border border-white/70' : 'bg-red-50 text-red-900 border border-red-200',
    'NO LOCALIZADO': isDarkMode ? 'bg-white/70 text-gray-900 border border-white/60' : 'bg-yellow-50 text-yellow-900 border border-yellow-200',
    DEFAULT: isDarkMode ? 'bg-white/60 text-gray-900 border border-white/50' : 'bg-gray-50 text-gray-900 border border-gray-200'
});

// Utilidad para limpiar texto
function clean(str: string) {
    return (str || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export default function LevantamientoUnificado() {
    // Usar los contextos de indexación
    const ineaContext = useIneaIndexation();
    const iteaContext = useIteaIndexation();

    // Combinar datos de ambos contextos
    const muebles = useMemo(() => {
        const ineaData = ineaContext.muebles.map(item => ({ ...item, origen: 'INEA' as const }));
        const iteaData = iteaContext.muebles.map(item => ({ ...item, origen: 'ITEA' as const }));
        return [...ineaData, ...iteaData];
    }, [ineaContext.muebles, iteaContext.muebles]);

    // Estado de carga combinado
    const loading = ineaContext.isIndexing || iteaContext.isIndexing;
    const error = ineaContext.error || iteaContext.error;

    const role = useUserRole();
    const isAdmin = role === "admin" || role === "superadmin";
    const { isDarkMode } = useTheme();
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [showDirectorDataModal, setShowDirectorDataModal] = useState(false);
    const [directorToUpdate, setDirectorToUpdate] = useState<DirectorioOption | null>(null);
    const [savingDirectorData, setSavingDirectorData] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const deferredSearchTerm = useDeferredValue(searchTerm);

    // Pre-calculate searchable vectors
    const searchableData = useMemo(() => {
        if (!muebles || muebles.length === 0) return null;
        return {
            id: muebles.map(m => m.id_inv || '').filter(Boolean),
            area: muebles.map(m => m.area || '').filter(Boolean),
            usufinal: muebles.map(m => m.usufinal || '').filter(Boolean),
            resguardante: muebles.map(m => m.resguardante || '').filter(Boolean),
            descripcion: muebles.map(m => m.descripcion || '').filter(Boolean),
            rubro: muebles.map(m => m.rubro || '').filter(Boolean),
            estado: muebles.map(m => m.estado || '').filter(Boolean),
            estatus: muebles.map(m => m.estatus || '').filter(Boolean),
        };
    }, [muebles]);

    const [sortField, setSortField] = useState<keyof LevMueble>('id_inv');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const handleSort = (field: keyof LevMueble) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };
    const [message, setMessage] = useState<Message | null>(null);
    const [exportType, setExportType] = useState<'excel' | 'pdf' | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);

    // Estado para PDF por área/usuario
    const [showAreaPDFModal, setShowAreaPDFModal] = useState(false);
    const [areaPDFLoading, setAreaPDFLoading] = useState(false);
    const [areaPDFError, setAreaPDFError] = useState<string | null>(null);
    const [areaDirectorForm, setAreaDirectorForm] = useState<{ nombre: string, puesto: string }>({ nombre: '', puesto: '' });
    interface DirectorioOption {
        id_directorio: number;
        nombre: string;
        puesto: string;
        area: string;
    }
    const [areaDirectorOptions, setAreaDirectorOptions] = useState<DirectorioOption[]>([]);
    const [areaPDFTarget, setAreaPDFTarget] = useState<{ area: string, usufinal: string }>({ area: '', usufinal: '' });

    // Estado para coincidencia de búsqueda
    const [searchMatchType, setSearchMatchType] = useState<null | 'id' | 'descripcion' | 'usufinal' | 'area' | 'resguardante' | 'rubro' | 'estado' | 'estatus'>(null);

    // --- AUTOCOMPLETADO OMNIBOX ---
    const [suggestions, setSuggestions] = useState<{ value: string; type: ActiveFilter['type'] }[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [dropdownClass, setDropdownClass] = useState<string>('');

    // Calcular posición del dropdown y crear clase CSS dinámica
    useEffect(() => {
        if (showSuggestions && inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            const className = `omnibox-dropdown-float`;
            // Eliminar clase previa si existe
            const prev = document.getElementById('omnibox-dropdown-style');
            if (prev) prev.remove();
            // Crear nueva clase
            const style = document.createElement('style');
            style.id = 'omnibox-dropdown-style';
            style.innerHTML = `
                .${className} {
                    position: fixed !important;
                    left: ${rect.left}px !important;
                    top: ${rect.bottom + window.scrollY}px !important;
                    width: ${rect.width}px !important;
                    z-index: 10000 !important;
                }
            `;
            document.head.appendChild(style);
            setDropdownClass(className);
        } else {
            setDropdownClass('');
            const prev = document.getElementById('omnibox-dropdown-style');
            if (prev) prev.remove();
        }
    }, [showSuggestions, suggestions.length]);

    function getTypeLabel(type: ActiveFilter['type']) {
        switch (type) {
            case 'id': return 'ID';
            case 'area': return 'ÁREA';
            case 'usufinal': return 'DIRECTOR';
            case 'resguardante': return 'RESGUARDANTE';
            case 'descripcion': return 'DESCRIPCIÓN';
            case 'rubro': return 'RUBRO';
            case 'estado': return 'ESTADO';
            case 'estatus': return 'ESTATUS';
            default: return '';
        }
    }
    function getTypeIcon(type: ActiveFilter['type']) {
        const baseClass = "h-4 w-6 inline-flex items-center justify-center font-medium text-[10px] opacity-80";
        switch (type) {
            case 'id': return <span className={baseClass}>ID</span>;
            case 'area': return <span className={baseClass}>AR</span>;
            case 'usufinal': return <span className={baseClass}>US</span>;
            case 'resguardante': return <span className={baseClass}>RE</span>;
            case 'descripcion': return <span className={baseClass}>DE</span>;
            case 'rubro': return <span className={baseClass}>RU</span>;
            case 'estado': return <span className={baseClass}>ED</span>;
            case 'estatus': return <span className={baseClass}>ES</span>;
            default: return null;
        }
    }

    function SuggestionDropdown() {
        if (!showSuggestions || !dropdownClass || suggestions.length === 0) return null;
        return ReactDOM.createPortal(
            <ul
                id="omnibox-suggestions"
                role="listbox"
                title="Sugerencias de búsqueda"
                className={`animate-fadeInUp max-h-60 overflow-y-auto rounded-lg shadow-sm border transition-all duration-200 ${isDarkMode ? 'border-white/10 bg-black/95' : 'border-gray-200 bg-white/95'} backdrop-blur-xl ${dropdownClass}`}
            >
                {suggestions.map((s, i) => {
                    const isSelected = highlightedIndex === i;
                    return (
                        <li
                            key={`${s.type}-${s.value}`}
                            id={`omnibox-suggestion-${i}`}
                            role="option"
                            {...(isSelected && { 'aria-selected': 'true' })}
                            tabIndex={-1}
                            className={`flex items-center gap-1.5 px-2 py-1.5 cursor-pointer select-none text-xs
                                        transition-colors duration-150 ease-in-out
                                        ${isSelected
                                    ? isDarkMode ? 'bg-white/5 text-white' : 'bg-blue-50 text-blue-900'
                                    : isDarkMode ? 'hover:bg-white/5 text-white/70' : 'hover:bg-gray-50 text-gray-700'}`}
                            onMouseDown={e => {
                                e.preventDefault();
                                setActiveFilters(prev => [...prev, { term: s.value, type: s.type }]);
                                setSearchTerm('');
                                setSearchMatchType(null);
                                setShowSuggestions(false);
                                inputRef.current?.focus();
                            }}
                            onMouseEnter={() => setHighlightedIndex(i)}
                        >
                            <span className={`shrink-0 ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                                {getTypeIcon(s.type)}
                            </span>
                            <span className="flex-1 font-normal truncate tracking-wide">
                                {s.value}
                            </span>
                            <span className={`ml-auto text-[10px] font-mono ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
                                {getTypeLabel(s.type)}
                            </span>
                        </li>
                    );
                })}
            </ul>,
            document.body
        );
    }

    // Estado para filtros activos tipo omnibox
    interface ActiveFilter {
        term: string;
        type: 'id' | 'descripcion' | 'area' | 'usufinal' | 'resguardante' | 'rubro' | 'estado' | 'estatus' | null;
    }
    const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
    // Ahora depende de los filtros activos tipo omnibox

    // Función para eliminar un filtro
    const removeFilter = (index: number) => {
        setActiveFilters(prev => prev.filter((_, i) => i !== index));
    };

    // Determinar si el PDF personalizado debe estar habilitado
    const isCustomPDFEnabled = (() => {
        const areaFilter = activeFilters.find(f => f.type === 'area');
        const directorFilter = activeFilters.find(f => f.type === 'usufinal');
        if (!areaFilter || !directorFilter) return false;
        const cleanVal = (v: string) => (v || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        // Solo strings, no nulls
        const uniqueAreas = Array.from(new Set(muebles.map(m => m.area).filter((a): a is string => !!a))).map(cleanVal);
        const uniqueDirectores = Array.from(new Set(muebles.map(m => m.usufinal).filter((u): u is string => !!u))).map(cleanVal);
        const areaIsValid = uniqueAreas.includes(cleanVal(areaFilter.term));
        const directorIsValid = uniqueDirectores.includes(cleanVal(directorFilter.term));
        return areaIsValid && directorIsValid;
    })();

    // Mejorar analyzeMatch para todos los campos relevantes
    // Mejorar analyzeMatch para todos los campos relevantes
    useEffect(() => {
        if (!deferredSearchTerm || !muebles.length) {
            setSearchMatchType(null);
            return;
        }

        const term = deferredSearchTerm.toLowerCase().trim();
        let bestMatch = { type: null, value: '', score: 0 } as { type: typeof searchMatchType, value: string, score: number };

        const isMatch = (val: string | null | undefined) => val && val.toLowerCase().includes(term);
        const isExact = (val: string | null | undefined) => val && val.toLowerCase() === term;

        for (const item of muebles) {
            // Coincidencia por ID (alta prioridad)
            if (isMatch(item.id_inv)) {
                const exact = isExact(item.id_inv);
                const score = exact ? 6 : 4;
                if (score > bestMatch.score) bestMatch = { type: 'id', value: item.id_inv!, score };
            }
            // Coincidencia por área
            else if (isMatch(item.area)) {
                const exact = isExact(item.area);
                const score = exact ? 5 : 3;
                if (score > bestMatch.score) bestMatch = { type: 'area', value: item.area!, score };
            }
            // Coincidencia por usufinal/resguardante
            else if (isMatch(item.usufinal) || isMatch(item.resguardante)) {
                const exact = isExact(item.usufinal) || isExact(item.resguardante);
                const score = exact ? 4 : 2;
                if (score > bestMatch.score) bestMatch = { type: 'usufinal', value: item.usufinal || item.resguardante || '', score };
            }

            if (bestMatch.score >= 6) break;
        }

        // Fallback simples
        if (!bestMatch.type) {
            for (const item of muebles) {
                if (isMatch(item.descripcion)) { setSearchMatchType('descripcion'); return; }
                if (isMatch(item.rubro)) { setSearchMatchType('rubro'); return; }
                if (isMatch(item.estado)) { setSearchMatchType('estado'); return; }
                if (isMatch(item.estatus)) { setSearchMatchType('estatus'); return; }
            }
        } else {
            setSearchMatchType(bestMatch.type);
        }
    }, [deferredSearchTerm, muebles]);

    // Filtrado por filtros activos (Optimizado con useMemo y deferredValue)
    const filteredMuebles = useMemo(() => {
        const term = deferredSearchTerm.toLowerCase().trim();
        let result = muebles;

        if (activeFilters.length > 0 || term) {
            result = muebles.filter(item => {
                // Aplicar filtros activos (optimizados)
                const passesActiveFilters = activeFilters.every(filter => {
                    const filterTerm = filter.term.toLowerCase();
                    if (!filterTerm) return true;

                    switch (filter.type) {
                        case 'id': return (item.id_inv?.toLowerCase() || '').includes(filterTerm);
                        case 'descripcion': return (item.descripcion?.toLowerCase() || '').includes(filterTerm);
                        case 'rubro': return (item.rubro?.toLowerCase() || '').includes(filterTerm);
                        case 'estado': return (item.estado?.toLowerCase() || '').includes(filterTerm);
                        case 'estatus': return (item.estatus?.toLowerCase() || '').includes(filterTerm);
                        case 'area': return (item.area?.toLowerCase() || '').includes(filterTerm);
                        case 'usufinal': return (item.usufinal?.toLowerCase() || '').includes(filterTerm);
                        case 'resguardante': return (item.resguardante?.toLowerCase() || '').includes(filterTerm);
                        default: return true;
                    }
                });

                if (!passesActiveFilters) return false;

                // Búsqueda general
                if (!term) return true;

                return (
                    (item.id_inv?.toLowerCase() || '').includes(term) ||
                    (item.descripcion?.toLowerCase() || '').includes(term) ||
                    (item.area?.toLowerCase() || '').includes(term) ||
                    (item.usufinal?.toLowerCase() || '').includes(term) ||
                    (item.resguardante?.toLowerCase() || '').includes(term) ||
                    (item.rubro?.toLowerCase() || '').includes(term) ||
                    (item.estado?.toLowerCase() || '').includes(term) ||
                    (item.estatus?.toLowerCase() || '').includes(term)
                );
            });
        }

        // Sorting
        return [...result].sort((a, b) => {
            if (!sortField) return 0;
            const aVal = a[sortField];
            const bVal = b[sortField];

            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            const compareResult = aVal > bVal ? 1 : -1;
            return sortDirection === 'asc' ? compareResult : -compareResult;
        });

    }, [muebles, activeFilters, deferredSearchTerm, sortField, sortDirection]);
    const totalFilteredCount = filteredMuebles.length;
    const totalPages = Math.ceil(totalFilteredCount / rowsPerPage);

    // Paginador sobre el array filtrado
    const paginatedMuebles = filteredMuebles.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    // Resetear página al cambiar filtros activos o término de búsqueda
    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilters, searchTerm, rowsPerPage]);

    // Buscar directorio por área o usuario
    const fetchDirectorFromDirectorio = async (area: string) => {
        setAreaPDFLoading(true);
        setAreaDirectorForm({ nombre: '', puesto: '' });
        setAreaPDFError(null);
        try {
            // Obtener todos los directores de la tabla directorio
            const { data, error } = await supabase.from('directorio').select('*');
            if (error) throw error;
            if (!data) throw new Error('No se pudo obtener el directorio');
            setAreaDirectorOptions(data); // Todos los directores disponibles para el select
            // Buscar coincidencia exacta por área
            const areaClean = clean(area);
            const matches = data.filter((d: DirectorioOption) => clean(d.area) === areaClean);
            if (matches.length === 1) {
                setAreaDirectorForm({ nombre: matches[0].nombre, puesto: matches[0].puesto });
                setAreaPDFTarget(t => ({ ...t, area: matches[0].area }));
            } else {
                setAreaPDFTarget(t => ({ ...t, area: area })); // Prellenar área aunque no exista
                setAreaDirectorForm({ nombre: '', puesto: '' });
            }
        } catch {
            setAreaPDFError('Error al buscar en directorio.');
        } finally {
            setAreaPDFLoading(false);
        }
    };

    // Manejar click en botón PDF por área/usuario
    const handleAreaPDFClick = async () => {
        // Buscar el filtro activo de área y de director (usufinal)
        const areaFilter = activeFilters.find(f => f.type === 'area');
        const usufinalFilter = activeFilters.find(f => f.type === 'usufinal');
        const areaTerm = areaFilter?.term || '';
        const directorTerm = usufinalFilter?.term || '';
        setAreaPDFTarget({ area: areaTerm, usufinal: directorTerm });

        // Buscar en la tabla directorio el director más adecuado (aproximado)
        setAreaPDFLoading(true);
        setAreaDirectorForm({ nombre: directorTerm, puesto: '' });
        setAreaPDFError(null);
        try {
            const { data, error } = await supabase.from('directorio').select('*');
            if (error) throw error;
            if (!data) throw new Error('No se pudo obtener el directorio');
            setAreaDirectorOptions(data);
            // Buscar coincidencia más cercana por nombre (ignorando tildes y mayúsculas)
            const clean = (str: string) => (str || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
            const directorClean = clean(directorTerm);
            // Buscar primero coincidencia exacta, luego parcial
            let bestMatch = data.find((d: DirectorioOption) => clean(d.nombre) === directorClean && clean(d.area) === clean(areaTerm));
            if (!bestMatch) {
                bestMatch = data.find((d: DirectorioOption) => clean(d.nombre) === directorClean);
            }
            if (!bestMatch) {
                bestMatch = data.find((d: DirectorioOption) => clean(d.nombre).includes(directorClean));
            }
            if (bestMatch) {
                setAreaDirectorForm({ nombre: bestMatch.nombre, puesto: bestMatch.puesto });
            } else {
                setAreaDirectorForm({ nombre: directorTerm, puesto: '' });
            }
        } catch {
            setAreaPDFError('Error al buscar en directorio.');
        } finally {
            setAreaPDFLoading(false);
            setShowAreaPDFModal(true);
        }
    };

    // Generar PDF por área/usuario

    // Obtener opciones de filtro unificadas
    const fetchFilterOptions = useCallback(async () => {
        try {
            // Elimino la obtención de estados, estatus, áreas, rubros, formadq, resguardantes
        } catch (error) {
            console.error('Error al cargar opciones de filtro:', error);
        }
    }, []);

    // Función para obtener datos filtrados para exportación

    // Función para manejar la exportación
    const handleExport = async () => {
        try {
            // Usar los datos filtrados actualmente en la tabla
            const exportData = filteredMuebles;

            if (!exportData || exportData.length === 0) {
                setMessage({ type: 'error', text: 'No hay datos para exportar.' });
                return;
            }

            const fileName = `levantamiento_unificado_${new Date().toISOString().slice(0, 10)}`;

            // --- OBTENER FIRMAS DE LA BD COMO EN pdfgenerator.tsx ---
            let firmas: { concepto: string; nombre: string; puesto: string }[] = [];
            try {
                const { data: firmasData, error: firmasError } = await supabase
                    .from('firmas')
                    .select('*')
                    .order('id', { ascending: true });
                if (firmasError) throw firmasError;
                if (firmasData && firmasData.length > 0) {
                    firmas = firmasData.map(f => ({
                        concepto: f.concepto,
                        nombre: f.nombre,
                        puesto: f.puesto
                    }));
                }
            } catch {
                setMessage({ type: 'error', text: 'Error al obtener las firmas. Se usarán firmas por defecto.' });
            }

            if (exportType === 'excel') {
                const worksheetName = 'Levantamiento';
                const formattedData = exportData.map((item, index) => ({
                    ...item,
                    _counter: index + 1,
                    valor: item.valor?.toString() || '',
                    f_adq: item.f_adq || '',
                    fechabaja: item.fechabaja || ''
                }));
                await generateExcel({ data: formattedData, fileName, worksheetName });
            } else if (exportType === 'pdf') {
                const columns = [
                    { header: 'ID INVENTARIO', key: 'id_inv', width: 60 },
                    { header: 'DESCRIPCIÓN', key: 'descripcion', width: 120 },
                    { header: 'ESTADO', key: 'estado', width: 50 },
                    { header: 'ESTATUS', key: 'estatus', width: 50 },
                    { header: 'ÁREA', key: 'area', width: 60 },
                    { header: 'USUARIO FINAL', key: 'usufinal', width: 70 },
                ];
                const formattedData = exportData.map((item, index) => ({
                    ...item,
                    _counter: index + 1,
                }));
                await generatePDF({
                    data: formattedData,
                    columns,
                    title: 'LEVANTAMIENTO DE INVENTARIO',
                    fileName,
                    firmas,
                });
            }

            setMessage({ type: 'success', text: 'Archivo generado exitosamente.' });
            setShowExportModal(false);
        } catch (error) {
            console.error('Error al exportar:', error);
            setMessage({ type: 'error', text: 'Error al generar el archivo.' });
        }
    };

    // Función para reindexar ambos contextos
    const handleReindex = useCallback(async () => {
        await Promise.all([
            ineaContext.reindex(),
            iteaContext.reindex()
        ]);
    }, [ineaContext, iteaContext]);

    useEffect(() => {
        fetchFilterOptions();
    }, [fetchFilterOptions]);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // useEffect para autocompletar directorio al cambiar el filtro de usuario final
    useEffect(() => {
        if (activeFilters.some(f => f.type === 'resguardante')) {
            fetchDirectorFromDirectorio(activeFilters.find(f => f.type === 'area')?.term || '');
        }
        // Solo autocompletar si hay filtro de usuario
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFilters.some(f => f.type === 'resguardante')]);

    const changePage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const truncateText = (text: string | null, length: number = 50) => {
        if (!text) return '';
        return text.length > length ? `${text.substring(0, length)}...` : text;
    };

    const router = useRouter();
    // Estado para folios de resguardo por id_inv
    const [foliosResguardo, setFoliosResguardo] = useState<{ [id_inv: string]: string }>({});

    // Buscar folio de resguardo para los artículos mostrados
    useEffect(() => {
        async function fetchFolios() {
            if (!muebles.length) return;
            // Buscar todos los folios de resguardo para los id_inv actuales
            // NUEVO: Buscar en la tabla resguardos todos los registros y agrupar por num_inventario
            const { data, error } = await supabase
                .from('resguardos')
                .select('num_inventario, folio');
            if (!error && data) {
                const map: { [id_inv: string]: string } = {};
                data.forEach(r => {
                    if (r.num_inventario && r.folio) {
                        map[r.num_inventario] = r.folio;
                    }
                });
                setFoliosResguardo(map);
            } else {
                setFoliosResguardo({});
            }
        }
        fetchFolios();
    }, [muebles]);

    // Función para manejar el clic en el folio
    const handleFolioClick = (folio: string) => {
        router.push(`/resguardos/consultar?folio=${folio}`);
    };

    // Generar sugerencias al escribir
    // Generar sugerencias al escribir (Optimizado con useDeferredValue y vectores)
    useEffect(() => {
        if (!deferredSearchTerm || !searchableData) {
            setSuggestions([]);
            setShowSuggestions(false);
            setHighlightedIndex(-1);
            return;
        }

        const term = deferredSearchTerm.toLowerCase().trim();
        if (term.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const seen = new Set<string>();
        const fields = [
            { type: 'id' as ActiveFilter['type'], label: 'ID', data: searchableData.id },
            { type: 'area' as ActiveFilter['type'], label: 'Área', data: searchableData.area },
            { type: 'usufinal' as ActiveFilter['type'], label: 'Director', data: searchableData.usufinal },
            { type: 'resguardante' as ActiveFilter['type'], label: 'Resguardante', data: searchableData.resguardante },
            { type: 'descripcion' as ActiveFilter['type'], label: 'Descripción', data: searchableData.descripcion },
            { type: 'rubro' as ActiveFilter['type'], label: 'Rubro', data: searchableData.rubro },
            { type: 'estado' as ActiveFilter['type'], label: 'Estado', data: searchableData.estado },
            { type: 'estatus' as ActiveFilter['type'], label: 'Estatus', data: searchableData.estatus },
        ];

        let allSuggestions: { value: string; type: ActiveFilter['type'] }[] = [];
        let count = 0;
        const maxSuggestions = 10;

        for (const f of fields) {
            if (count >= maxSuggestions) break;

            for (const v of f.data) {
                const vLower = v.toLowerCase();
                if (vLower.includes(term)) {
                    const key = f.type + ':' + vLower;
                    if (!seen.has(key)) {
                        allSuggestions.push({ value: v, type: f.type });
                        seen.add(key);
                        count++;
                        if (count >= maxSuggestions) break;
                    }
                }
            }
        }

        // Prioridad: exactos primero
        allSuggestions.sort((a, b) => {
            const aStarts = a.value.toLowerCase().startsWith(term);
            const bStarts = b.value.toLowerCase().startsWith(term);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return 0;
        });

        setSuggestions(allSuggestions.slice(0, 7));
        setShowSuggestions(allSuggestions.length > 0);
        setHighlightedIndex(allSuggestions.length > 0 ? 0 : -1);
    }, [deferredSearchTerm, searchableData]);

    // Manejo de teclado en el input
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || suggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(i => (i + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(i => (i - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
                const s = suggestions[highlightedIndex];
                setActiveFilters(prev => [...prev, { term: s.value, type: s.type }]);
                setSearchTerm('');
                setSearchMatchType(null);
                setShowSuggestions(false);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };
    // Cerrar sugerencias al perder foco
    const handleInputBlur = () => {
        setTimeout(() => setShowSuggestions(false), 100); // Permite click en sugerencia
    };

    // --- Lógica para búsqueda de director en el modal ---
    const [searchDirectorTerm, setSearchDirectorTerm] = useState('');
    // Sugerido: el que más coincide por nombre y área
    const directorSugerido = React.useMemo(() => {
        const clean = (str: string) => (str || '').normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
        if (!areaPDFTarget.usufinal) return null;

        const targetNombre = clean(areaPDFTarget.usufinal);
        const targetArea = clean(areaPDFTarget.area);

        // 1. Coincidencia exacta nombre+área
        let match = areaDirectorOptions.find(opt =>
            clean(opt.nombre) === targetNombre && clean(opt.area || '') === targetArea
        );

        // 2. Coincidencia exacta solo por nombre
        if (!match) {
            match = areaDirectorOptions.find(opt => clean(opt.nombre) === targetNombre);
        }

        // 3. Coincidencia parcial por nombre (más flexible)
        if (!match) {
            // Split nombre en palabras y buscar coincidencias parciales
            const nombreParts = targetNombre.split(/\s+/);

            // Encontrar el que más palabras coincide
            const matches = areaDirectorOptions
                .map(opt => {
                    const optNombre = clean(opt.nombre);
                    const matchCount = nombreParts.filter(part =>
                        optNombre.includes(part) || part.length > 3 && optNombre.includes(part.slice(0, -1))
                    ).length;
                    return { opt, matchCount };
                })
                .filter(({ matchCount }) => matchCount > 0)
                .sort((a, b) => b.matchCount - a.matchCount);

            if (matches.length > 0) {
                match = matches[0].opt;
            }
        }

        return match || null;
    }, [areaPDFTarget, areaDirectorOptions]);
    const filteredDirectorOptions: DirectorioOption[] = React.useMemo(() => {
        const clean = (str: string) => (str || '').normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
        let options = areaDirectorOptions;
        if (searchDirectorTerm) {
            options = options.filter(opt => clean(opt.nombre).includes(clean(searchDirectorTerm)));
        }
        // Sugerido primero
        if (directorSugerido) {
            options = [directorSugerido, ...options.filter(opt => opt.id_directorio !== directorSugerido.id_directorio)];
        }
        return options;
    }, [searchDirectorTerm, areaDirectorOptions, directorSugerido]);

    // --- FUNCIÓN AUXILIAR PARA EXPORTACIÓN PDF POR ÁREA/DIRECTOR ---
    const getFilteredMueblesForExportPDF = () => {
        if (showAreaPDFModal && areaPDFTarget.area && areaPDFTarget.usufinal) {
            const forcedFilters = [
                { term: areaPDFTarget.area, type: 'area' },
                { term: areaPDFTarget.usufinal, type: 'usufinal' },
                ...activeFilters.filter(f => f.type !== 'area' && f.type !== 'usufinal')
            ];
            return muebles.filter(item => {
                if (!item || typeof item !== 'object') return false;
                // Validar que los campos requeridos existan y sean string
                if (!item.id_inv || !item.area || !item.usufinal) return false;
                return forcedFilters.every(filter => {
                    const filterTerm = clean(filter.term);
                    if (!filterTerm) return true;
                    switch (filter.type) {
                        case 'id':
                            return clean(item.id_inv || '').includes(filterTerm);
                        case 'descripcion':
                            return clean(item.descripcion || '').includes(filterTerm);
                        case 'area':
                            return clean(item.area || '') === filterTerm;
                        case 'usufinal':
                            return clean(item.usufinal || '') === filterTerm;
                        case 'resguardante':
                            return clean(item.resguardante || '').includes(filterTerm);
                        case 'rubro':
                            return clean(item.rubro || '').includes(filterTerm);
                        case 'estado':
                            return clean(item.estado || '').includes(filterTerm);
                        case 'estatus':
                            return clean(item.estatus || '').includes(filterTerm);
                        default:
                            return true;
                    }
                });
            });
        }
        return filteredMuebles.filter(item => item && typeof item === 'object' && item.id_inv && item.area && item.usufinal);
    };

    // Modal para completar datos del director (solo admin, estilo PDF personalizado mejorado)
    // --- Modal para completar datos del director (fucsia, moderno, z-[110]) ---
    function renderDirectorDataModal() {
        return (
            showDirectorDataModal && !!directorToUpdate && isAdmin && (
                <div className={`fixed inset-0 z-[110] flex items-center justify-center backdrop-blur-sm px-4 animate-fadeIn ${isDarkMode ? 'bg-black/90' : 'bg-black/50'}`}>
                    <div className={`border-2 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transition-all duration-300 transform ${isDarkMode ? 'bg-black border-white/30' : 'bg-white border-yellow-200'}`}>
                        <div className="relative p-7 sm:p-8">
                            <div className={`absolute top-0 left-0 w-full h-1 ${isDarkMode ? 'bg-white/30' : 'bg-yellow-200'}`} />
                            <h2 className={`text-2xl font-extrabold mb-2 flex items-center gap-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                <FileUp className={`h-6 w-6 ${isDarkMode ? 'text-white' : 'text-yellow-600'}`} /> Completar datos del director
                            </h2>
                            <p className={`text-base mb-6 font-medium flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <AlertCircle className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-yellow-500'}`} />
                                El director seleccionado no tiene todos sus datos completos. Por favor, completa la información faltante.
                            </p>
                            {directorToUpdate && (
                                <div className="flex flex-col gap-6">
                                    <div>
                                        <label className={`block text-xs uppercase tracking-wider mb-1 font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Nombre</label>
                                        <input
                                            type="text"
                                            className={`w-full border-2 rounded-xl px-4 py-3 text-lg font-semibold shadow-inner focus:outline-none transition-all duration-200 ${isDarkMode ? 'bg-gray-900 border-white/30 focus:border-white/60 text-white placeholder:text-gray-400/60' : 'bg-white border-yellow-300 focus:border-yellow-500 text-gray-900 placeholder:text-gray-500'}`}
                                            value={directorToUpdate.nombre ?? ''}
                                            onChange={e => setDirectorToUpdate(prev => prev ? { ...prev, nombre: e.target.value.toUpperCase() } : null)}
                                            placeholder="Ej: JUAN PÉREZ GÓMEZ"
                                            autoFocus
                                            maxLength={80}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-xs uppercase tracking-wider mb-1 font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cargo</label>
                                        <input
                                            type="text"
                                            className={`w-full border-2 rounded-xl px-4 py-3 text-lg font-semibold shadow-inner focus:outline-none transition-all duration-200 ${isDarkMode ? 'bg-gray-900 border-white/30 focus:border-white/60 text-white placeholder:text-gray-400/60' : 'bg-white border-yellow-300 focus:border-yellow-500 text-gray-900 placeholder:text-gray-500'}`}
                                            value={directorToUpdate.puesto ?? ''}
                                            onChange={e => setDirectorToUpdate(prev => prev ? { ...prev, puesto: e.target.value.toUpperCase() } : null)}
                                            placeholder="Ej: DIRECTOR, JEFE DE ÁREA..."
                                            maxLength={60}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-end gap-2 mt-8">
                                <button
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-200 shadow ${isDarkMode ? 'border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800' : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    onClick={() => setShowDirectorDataModal(false)}
                                >Cancelar</button>
                                <button
                                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-200 shadow border
                            ${isDarkMode ? 'bg-white/10 text-white border-white/30' : 'bg-yellow-600 text-white border-yellow-600'}
                            ${savingDirectorData || !directorToUpdate || !(directorToUpdate.nombre || '').trim() || !(directorToUpdate.puesto || '').trim() ? 'opacity-60 cursor-not-allowed' : isDarkMode ? 'hover:bg-white/20' : 'hover:bg-yellow-700'}`}
                                    onClick={() => saveDirectorData()}
                                    disabled={savingDirectorData || !directorToUpdate || !(directorToUpdate.nombre || '').trim() || !(directorToUpdate.puesto || '').trim()}
                                >
                                    {savingDirectorData ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        );
    }

    // Cambia la función de guardado para usar directorio_areas y area
    function saveDirectorData() {
        if (!directorToUpdate) return;
        setSavingDirectorData(true);
        (async () => {
            try {
                const nombre = directorToUpdate?.nombre?.trim().toUpperCase() || '';
                const puesto = directorToUpdate?.puesto?.trim().toUpperCase() || '';
                if (!nombre || !puesto) throw new Error('El nombre y el cargo son obligatorios');
                // Actualizar solo nombre y puesto
                const { error: updateError } = await supabase
                    .from('directorio')
                    .update({ nombre, puesto })
                    .eq('id_directorio', directorToUpdate.id_directorio);
                if (updateError) throw updateError;
                setAreaDirectorOptions(prev => prev.map(opt =>
                    opt.id_directorio === directorToUpdate.id_directorio
                        ? { ...opt, nombre, puesto }
                        : opt
                ));
                setShowDirectorDataModal(false);
                setMessage({ type: 'success', text: 'Datos del director actualizados correctamente' });
            } catch (error) {
                console.error('Error al actualizar datos del director:', error);
                setMessage({ type: 'error', text: 'Error al actualizar los datos del director' });
            } finally {
                setSavingDirectorData(false);
            }
        })();
    }

    return (
        <>
            {renderDirectorDataModal()}
            <div className={`min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className={`w-full mx-auto rounded-lg sm:rounded-xl shadow-2xl overflow-hidden border ${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
                    <div className={`p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b gap-2 sm:gap-0 ${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
                        <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            <span className={`mr-2 sm:mr-3 p-1 sm:p-2 rounded-lg border text-sm sm:text-base ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-gray-100 text-gray-900 border-gray-300'}`}>LEV</span>
                            Levantamiento de Inventario (INEA + ITEA)
                        </h1>
                        <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Vista unificada de todos los bienes registrados</p>
                    </div>
                    <div className="flex flex-col gap-4 p-4">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                            <div className="flex gap-4 flex-grow">
                                {/* Barra de búsqueda y filtros activos brutalmente mejorados */}
                                <div className="w-full flex flex-col gap-2">
                                    <div className="relative flex items-center w-full">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-300 group-focus-within:scale-110">
                                            <Search className={`h-5 w-5 transition-colors duration-300 ${isDarkMode ? 'text-white/70 group-focus-within:text-white' : 'text-gray-400 group-focus-within:text-gray-600'}`} />
                                        </div>
                                        <input
                                            ref={inputRef}
                                            spellCheck="false"
                                            type="text"
                                            value={searchTerm}
                                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); setShowSuggestions(true); }}
                                            onKeyDown={handleInputKeyDown}
                                            onBlur={handleInputBlur}
                                            placeholder="Buscar por ID, área, director, descripción, etc..."
                                            className={`
                                            pl-14 pr-32 py-3 w-full transition-all duration-300
                                            text-lg font-semibold tracking-wide backdrop-blur-xl
                                            focus:outline-none focus:ring-2 rounded-2xl shadow-2xl
                                            ${isDarkMode
                                                    ? 'bg-black/80 text-white placeholder-neutral-500 focus:ring-white/50 focus:border-white/50 border-neutral-800 hover:shadow-white/10 focus:scale-[1.03] focus:bg-black/90' + (searchMatchType ? ' border-white/80 shadow-white/20' : '')
                                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 focus:scale-[1.02]' + (searchMatchType ? ' border-blue-400 shadow-blue-100' : '')}
                                        `}
                                            title="Buscar"
                                            aria-autocomplete="list"
                                            aria-controls="omnibox-suggestions"
                                            aria-activedescendant={highlightedIndex >= 0 ? `omnibox-suggestion-${highlightedIndex}` : undefined}
                                            autoComplete="off"
                                        />
                                        {/* Dropdown de sugerencias omnibox flotante */}
                                        <SuggestionDropdown />
                                    </div>
                                    {/* Chips de filtros activos brutalmente mejorados */}
                                    {activeFilters.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-1 px-1">
                                            {activeFilters.map((filter, index) => {
                                                const colorClass = isDarkMode
                                                    ? 'bg-white/10 border-white/30 text-white/90'
                                                    : 'bg-blue-50 border-blue-200 text-blue-800';

                                                return (
                                                    <div
                                                        key={index}
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full ${colorClass} text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200 border`}
                                                    >
                                                        <span className="uppercase font-semibold opacity-70 mr-1 text-[10px]">{
                                                            filter.type === 'id' ? 'ID' :
                                                                filter.type === 'descripcion' ? 'Desc' :
                                                                    filter.type === 'rubro' ? 'Rubro' :
                                                                        filter.type === 'estado' ? 'Edo' :
                                                                            filter.type === 'estatus' ? 'Est' :
                                                                                filter.type === 'area' ? 'Área' :
                                                                                    filter.type === 'usufinal' ? 'Usu' :
                                                                                        filter.type === 'resguardante' ? 'Resg' :
                                                                                            filter.type
                                                        }</span>
                                                        <span className="truncate max-w-[120px]">{filter.term}</span>
                                                        <button
                                                            onClick={() => removeFilter(index)}
                                                            className={`ml-1 p-0.5 rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors ${isDarkMode
                                                                ? 'text-white/60 hover:text-white'
                                                                : 'text-blue-600/60 hover:text-blue-800'
                                                                }`}
                                                            title="Eliminar filtro"
                                                            tabIndex={0}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {/* Excel Export Button */}
                                <button
                                    onClick={() => {
                                        setExportType('excel');
                                        setShowExportModal(true);
                                    }}
                                    className={`group relative px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-all duration-300 shadow-lg border
                                        ${isDarkMode ? 'bg-white text-gray-900 border-white/80 hover:bg-white/90 hover:border-white' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700'}`}
                                    title="Exportar a Excel"
                                >
                                    <FileUp className="h-4 w-4 transition-transform group-hover:scale-110 group-hover:-translate-y-0.5 duration-300" />
                                    <span className="hidden sm:flex items-center gap-1">
                                        Excel
                                        <span className="text-xs opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                                            .xlsx
                                        </span>
                                    </span>
                                </button>

                                {/* PDF Export Button */}
                                <button
                                    onClick={() => {
                                        if (isCustomPDFEnabled) {
                                            handleAreaPDFClick();
                                        } else {
                                            setExportType('pdf');
                                            setShowExportModal(true);
                                        }
                                    }}
                                    className={`group relative px-4 py-2.5 rounded-lg font-medium 
                                    flex items-center gap-2.5 transition-all duration-300
                                    ${isCustomPDFEnabled
                                            ? isDarkMode
                                                ? 'bg-gradient-to-r from-white/90 to-white/70 text-gray-900 hover:from-white hover:to-white/80 border border-white/80 hover:border-white shadow-lg shadow-white/10'
                                                : 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 border border-green-600 hover:border-green-700 shadow-lg shadow-green-100'
                                            : isDarkMode
                                                ? 'bg-white/80 text-gray-900 hover:bg-white/70 border border-white/70 hover:border-white'
                                                : 'bg-red-600 text-white hover:bg-red-700 border border-red-600 hover:border-red-700'
                                        }`}
                                    title={isCustomPDFEnabled ? 'Exportar PDF personalizado por área y director (solo si ambos filtros son exactos)' : 'Exportar a PDF'}
                                >
                                    <FileUp className="h-4 w-4 transition-transform group-hover:scale-110 group-hover:-translate-y-0.5 duration-300" />
                                    <span className="hidden sm:flex items-center gap-1">
                                        {isCustomPDFEnabled ? (
                                            <>
                                                PDF Personalizado
                                                <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-full border border-white/30 text-gray-900 font-semibold">Área+Director</span>
                                            </>
                                        ) : (
                                            'PDF'
                                        )}
                                    </span>
                                </button>
                                {/* Refresh Button */}
                                <button
                                    onClick={handleReindex}
                                    className={`
                                    group relative px-4 py-2.5 rounded-lg font-medium 
                                    flex items-center gap-2.5 transition-all duration-300
                                    shadow-lg border overflow-hidden
                                    hover:scale-[1.02] active:scale-[0.98]
                                    ${isDarkMode
                                            ? 'bg-white/70 hover:bg-white/80 text-gray-900 border-white/60 hover:border-white/70'
                                            : 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600 hover:border-gray-700'
                                        }
                                `}
                                    title="Actualizar datos"
                                    disabled={loading}
                                >

                                    {/* Icon wrapper with animation */}
                                    <div className="relative">
                                        <RefreshCw className={`
                                        h-4 w-4 transition-transform duration-500 
                                        ${loading ? 'animate-spin' : 'group-hover:rotate-180 group-hover:scale-110'}
                                    `} />
                                    </div>

                                    {/* Text with underline animation */}
                                    <span className="relative hidden sm:block">
                                        Actualizar
                                        <span className="absolute inset-x-0 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                                    </span>

                                    {/* Loading ripple effect */}
                                    {loading && (
                                        <span className="absolute inset-0 flex items-center justify-center">
                                            <span className={`absolute w-full h-full animate-ping rounded-lg ${isDarkMode ? 'bg-cyan-400/20' : 'bg-blue-400/20'}`}></span>
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    {message && (
                        <div className={`p-3 rounded-md border ${isDarkMode
                            ? message.type === 'success' ? 'bg-green-900/50 text-green-300 border-green-800' :
                                message.type === 'error' ? 'bg-red-900/50 text-red-300 border-red-800' :
                                    message.type === 'warning' ? 'bg-yellow-900/50 text-yellow-300 border-yellow-800' :
                                        message.type === 'info' ? 'bg-blue-900/50 text-blue-300 border-blue-800' : ''
                            : message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
                                message.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
                                    message.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                                        message.type === 'info' ? 'bg-blue-50 text-blue-800 border-blue-200' : ''
                            }`}>
                            {message.text}
                        </div>
                    )}
                    {showExportModal && (
                        <div className={`fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn ${isDarkMode ? 'bg-black/90' : 'bg-black/50'}`}>
                            <div className={`rounded-2xl shadow-2xl border w-full max-w-md overflow-hidden transition-all duration-300 transform ${isDarkMode ? 'bg-black border-white/30' : 'bg-white border-gray-200'}`}>
                                <div className={`relative p-6 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                                    <div className={`absolute top-0 left-0 w-full h-1 ${isDarkMode ? 'bg-white/30' : 'bg-blue-200'}`}></div>

                                    <button
                                        onClick={() => setShowExportModal(false)}
                                        className={`absolute top-3 right-3 p-2 rounded-full border transition-colors ${isDarkMode ? 'bg-black/60 hover:bg-white/10 text-white border-white/30' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-300'}`}
                                        title="Cerrar"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>

                                    <div className="flex flex-col items-center text-center mb-4">
                                        <div className={`p-3 rounded-full border mb-3 ${isDarkMode ? 'border-white/30 bg-white/10' : 'bg-blue-200 bg-blue-50'}`}>
                                            {exportType === 'excel' ? (
                                                <FileUp className={`h-8 w-8 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
                                            ) : (
                                                <File className={`h-8 w-8 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
                                            )}
                                        </div>
                                        <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            Exportar a {exportType === 'excel' ? 'Excel' : 'PDF'}
                                        </h3>
                                        <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Exportar los datos a un archivo {exportType === 'excel' ? 'Excel para su análisis' : 'PDF para su visualización'}
                                        </p>
                                    </div>

                                    <div className="space-y-5 mt-6">
                                        <div className={`rounded-lg border p-4 ${isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
                                            <label className={`block text-xs uppercase tracking-wider mb-1 font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Documento a generar</label>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-blue-100'}`}>
                                                    {exportType === 'excel' ? (
                                                        <FileUp className={`h-4 w-4 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
                                                    ) : (
                                                        <File className={`h-4 w-4 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
                                                    )}
                                                </div>
                                                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {`Reporte_inventario_${new Date().toISOString().slice(0, 10)}.${exportType === 'excel' ? 'xlsx' : 'pdf'}`}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-full flex flex-col items-center gap-4">
                                            <div className="w-full">
                                                <button
                                                    onClick={handleExport}
                                                    className={`w-full py-3 px-4 font-medium rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg border ${isDarkMode ? 'bg-white/20 hover:bg-white/30 text-white border-white/30' : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'}`}
                                                >
                                                    {loading ? (
                                                        <>
                                                            <RefreshCw className="h-5 w-5 animate-spin" />
                                                            {`Generando ${exportType === 'excel' ? 'Excel' : 'PDF'}...`}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {exportType === 'excel' ? (
                                                                <FileUp className="h-5 w-5" />
                                                            ) : (
                                                                <File className="h-5 w-5" />
                                                            )}
                                                            {`Descargar ${exportType === 'excel' ? 'Excel' : 'PDF'}`}
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {showAreaPDFModal && (
                        <div className={`fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn ${isDarkMode ? 'bg-black/90' : 'bg-black/50'}`}>
                            <div className={`rounded-2xl shadow-2xl border w-full max-w-lg overflow-hidden ${isDarkMode ? 'bg-black border-white/20' : 'bg-white border-gray-200'}`}>
                                <div className="p-6">
                                    <h2 className={`text-xl font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        <FileUp className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} /> Exportar PDF por Área y Director
                                    </h2>
                                    <div className={`mb-3 flex items-center gap-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        <span>Registros a exportar</span>
                                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold shadow border min-w-[32px] text-center ${isDarkMode ? 'bg-white/10 text-white border-white/30' : 'bg-blue-100 text-blue-900 border-blue-300'}`}>
                                            {getFilteredMueblesForExportPDF().length}
                                        </span>
                                    </div>
                                    <div className="mb-4">
                                        <div className="flex flex-col gap-2">
                                            <div>
                                                <label className={`block text-xs uppercase tracking-wider mb-1 font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Área seleccionada</label>
                                                <input
                                                    type="text"
                                                    className={`w-full border-2 rounded-xl px-4 py-3 text-lg font-semibold shadow-inner focus:outline-none transition-all duration-200 ${isDarkMode ? 'bg-gray-800 border-white/30 focus:border-white/60 text-white placeholder:text-gray-400/60' : 'bg-gray-100 border-gray-300 focus:border-blue-500 text-gray-900 placeholder:text-gray-500'}`}
                                                    value={areaPDFTarget.area}
                                                    readOnly
                                                    title="Área seleccionada para el PDF"
                                                />
                                            </div>
                                            <div>
                                                {/* Mostrar el nombre del director buscado si no se encontró exactamente */}
                                                {areaPDFTarget.usufinal && !directorSugerido && (
                                                    <div className={`mb-3 p-3 border rounded-lg ${isDarkMode ? 'bg-amber-900/30 border-amber-700/50' : 'bg-amber-50 border-amber-200'}`}>
                                                        <p className={`font-medium flex items-center gap-2 ${isDarkMode ? 'text-amber-200' : 'text-amber-800'}`}>
                                                            <AlertCircle className="h-4 w-4" />
                                                            Director buscado no encontrado
                                                        </p>
                                                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-amber-100/90' : 'text-amber-700'}`}>
                                                            &quot;{areaPDFTarget.usufinal}&quot;
                                                        </p>
                                                    </div>
                                                )}
                                                <label className={`block text-xs uppercase tracking-wider mb-1 font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Buscar director</label>
                                                <input
                                                    type="text"
                                                    className={`w-full border-2 rounded-xl px-4 py-3 text-lg font-semibold shadow-inner focus:outline-none transition-all duration-200 ${isDarkMode ? 'bg-gray-800 border-white/30 focus:border-white/60 text-white placeholder:text-gray-400/60' : 'bg-white border-gray-300 focus:border-blue-500 text-gray-900 placeholder:text-gray-500'}`}
                                                    placeholder="Buscar director por nombre..."
                                                    value={searchDirectorTerm || ''}
                                                    onChange={e => setSearchDirectorTerm(e.target.value)}
                                                    title="Buscar director por nombre"
                                                    autoFocus
                                                />
                                                <div className={`max-h-48 overflow-y-auto rounded-lg border shadow-inner divide-y ${isDarkMode ? 'border-white/20 bg-gray-900/80 divide-white/10' : 'border-gray-200 bg-gray-50 divide-gray-200'}`}>
                                                    {filteredDirectorOptions.length === 0 ? (
                                                        <div className={`text-sm p-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No se encontraron directores.</div>
                                                    ) : (
                                                        filteredDirectorOptions.map(opt => (
                                                            <button
                                                                key={opt.id_directorio}
                                                                className={`w-full text-left px-4 py-2 flex flex-col gap-0.5 transition-all duration-150 border-l-4
                                                            ${directorSugerido && opt.id_directorio === directorSugerido.id_directorio ?
                                                                        isDarkMode ? 'border-white bg-white/10 text-white font-bold shadow-lg' : 'border-blue-500 bg-blue-50 text-blue-900 font-bold shadow-lg' :
                                                                        areaDirectorForm.nombre === opt.nombre ?
                                                                            isDarkMode ? 'border-white/60 bg-white/5 text-white font-semibold' : 'border-blue-300 bg-blue-25 text-blue-800 font-semibold' :
                                                                            isDarkMode ? 'border-transparent hover:bg-white/5 text-white' : 'border-transparent hover:bg-gray-100 text-gray-900'}
        `}
                                                                onClick={() => {
                                                                    setAreaDirectorForm({ nombre: opt.nombre, puesto: opt.puesto });
                                                                    setSearchDirectorTerm(opt.nombre);
                                                                    if ((!opt.nombre || !opt.puesto) && isAdmin) {
                                                                        setDirectorToUpdate(opt);
                                                                        setShowDirectorDataModal(true);
                                                                    }
                                                                }}
                                                                type="button"
                                                                title={`Seleccionar ${opt.nombre}`}
                                                            >
                                                                <span className="text-base font-semibold flex items-center gap-2">
                                                                    {opt.nombre}
                                                                    {directorSugerido && opt.id_directorio === directorSugerido.id_directorio && (
                                                                        <BadgeCheck className={`inline h-4 w-4 ml-1 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
                                                                    )}
                                                                    {areaDirectorForm.nombre === opt.nombre && (
                                                                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isDarkMode ? 'bg-white/20 text-white' : 'bg-blue-200 text-blue-800'}`}>Seleccionado</span>
                                                                    )}
                                                                </span>
                                                                <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{opt.puesto}</span>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <label className={`block text-xs uppercase tracking-wider mb-1 font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Puesto</label>
                                                <input
                                                    type="text"
                                                    className={`w-full border-2 rounded-xl px-4 py-3 text-lg font-semibold shadow-inner focus:outline-none transition-all duration-200 ${isDarkMode ? 'bg-gray-800 border-white/30 focus:border-white/60 text-white placeholder:text-gray-400/60' : 'bg-gray-100 border-gray-300 focus:border-blue-500 text-gray-900 placeholder:text-gray-500'}`}
                                                    value={areaDirectorForm.puesto || ''}
                                                    readOnly
                                                    title="Puesto del director o jefe de área"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {areaPDFError && <div className={`mb-2 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{areaPDFError}</div>}
                                    <div className="flex justify-end gap-2 mt-4">
                                        <button
                                            className={`px-4 py-2 rounded border transition-colors ${isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-gray-300'}`}
                                            onClick={() => setShowAreaPDFModal(false)}
                                        >Cancelar</button>
                                        <button
                                            className={`px-4 py-2 rounded font-bold border disabled:opacity-50 transition-colors ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20 border-white/30' : 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600'}`}
                                            disabled={
                                                areaPDFLoading ||
                                                getFilteredMueblesForExportPDF().length === 0 ||
                                                !(areaPDFTarget.area || '').trim() ||
                                                !(areaDirectorForm.nombre || '').trim() ||
                                                !(areaDirectorForm.puesto || '').trim()
                                            }
                                            onClick={async () => {
                                                setAreaPDFLoading(true);
                                                setAreaPDFError(null);
                                                try {
                                                    // Construir la firma a partir del director y puesto seleccionados en el modal
                                                    const firmas = [
                                                        {
                                                            concepto: 'DIRECTOR DE ÁREA',
                                                            nombre: areaDirectorForm.nombre,
                                                            puesto: areaDirectorForm.puesto
                                                        }
                                                    ];
                                                    const dataToExport = getFilteredMueblesForExportPDF();
                                                    if (!Array.isArray(dataToExport) || dataToExport.length === 0) {
                                                        setAreaPDFError('No hay datos para exportar.');
                                                        setAreaPDFLoading(false);
                                                        return;
                                                    }
                                                    // Validar que todos los elementos sean objetos planos y tengan los campos requeridos
                                                    const plainData = dataToExport.map(item => ({ ...item }));
                                                    if (!plainData.every(obj => obj && typeof obj === 'object' && obj.id_inv && obj.area && obj.usufinal)) {
                                                        setAreaPDFError('Error: Hay registros corruptos o incompletos.');
                                                        setAreaPDFLoading(false);
                                                        return;
                                                    }
                                                    try {
                                                        await generatePDFPerArea({
                                                            data: plainData,
                                                            firmas,
                                                            columns: [
                                                                { header: 'ID INVENTARIO', key: 'id_inv', width: 60 },
                                                                { header: 'DESCRIPCIÓN', key: 'descripcion', width: 120 },
                                                                { header: 'ESTADO', key: 'estado', width: 50 },
                                                                { header: 'ESTATUS', key: 'estatus', width: 50 },
                                                                { header: 'ÁREA', key: 'area', width: 60 },
                                                                { header: 'USUARIO FINAL', key: 'usufinal', width: 70 },
                                                            ],
                                                            title: 'LEVANTAMIENTO DE INVENTARIO',
                                                            fileName: `levantamiento_area_${new Date().toISOString().slice(0, 10)}`
                                                        });
                                                        setShowAreaPDFModal(false);
                                                        setMessage({ type: 'success', text: 'PDF generado exitosamente.' });
                                                    } catch (err) {
                                                        const msg = err instanceof Error ? err.message : 'Error al generar el PDF.';
                                                        setAreaPDFError(msg);
                                                    }
                                                } catch (err: unknown) {
                                                    const msg = err instanceof Error ? err.message : 'Error al generar el PDF.';
                                                    setAreaPDFError(msg);
                                                } finally {
                                                    setAreaPDFLoading(false);
                                                }
                                            }}
                                        >{areaPDFLoading ? 'Generando...' : 'Exportar PDF'}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Modal para completar datos del director */}
                    {/* Modal para completar datos del director (fucsia, moderno) se renderiza con renderDirectorDataModal() */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="w-full">
                            {/* Spinner de carga mejorado con contador de registros */}

                            {loading ? (
                                <div className={`flex flex-col items-center justify-center min-h-[300px] w-full rounded-lg animate-fadeIn ${isDarkMode ? 'bg-black/80' : 'bg-gray-100'}`}>
                                    <div className="relative flex flex-col items-center justify-center gap-4 py-12">
                                        {/* Spinner animado */}
                                        <div className="relative">
                                            <span className="relative flex h-20 w-20">
                                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-20 ${isDarkMode ? 'bg-white' : 'bg-blue-500'}`}></span>
                                                <span className={`relative inline-flex rounded-full h-20 w-20 border-4 border-t-transparent animate-spin ${isDarkMode ? 'border-white' : 'border-blue-500'}`}></span>
                                            </span>

                                            {/* Contador numérico en el centro del spinner */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className={`text-sm font-mono font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    Cargando inventario...
                                                </span>
                                            </div>
                                        </div>

                                        {/* Mensaje de carga con efecto de typing */}
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`text-2xl font-bold drop-shadow-md ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                Cargando inventario...
                                            </span>
                                            <span className={`text-sm mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                Por favor espera, esto puede tardar unos segundos.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className={`flex flex-col items-center justify-center min-h-[300px] w-full rounded-lg animate-fadeIn ${isDarkMode ? 'bg-black/80' : 'bg-gray-100'}`}>
                                    <div className="flex flex-col items-center gap-4 py-12">
                                        <AlertCircle className={`h-14 w-14 animate-bounce ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                        <span className={`text-2xl font-bold ${isDarkMode ? 'text-white drop-shadow-white/30' : 'text-gray-900'}`}>Error al cargar los datos</span>
                                        <span className={`text-base mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{error}</span>
                                        <button
                                            onClick={handleReindex}
                                            className={`px-6 py-3 rounded-xl font-bold text-lg shadow-lg border transition-all duration-200 flex items-center gap-2 mt-2 ${isDarkMode ? 'bg-white/10 text-white border-white/30 hover:bg-white/20' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'}`}
                                        >
                                            <RefreshCw className="h-5 w-5 animate-spin-slow" />
                                            Reintentar
                                        </button>
                                    </div>
                                </div>
                            ) : totalFilteredCount === 0 ? (
                                <div className={`flex flex-col items-center justify-center min-h-[300px] w-full rounded-lg animate-fadeIn ${isDarkMode ? 'bg-black/80' : 'bg-gray-100'}`}>
                                    <div className="flex flex-col items-center gap-4 py-12">
                                        <Search className={`h-14 w-14 animate-pulse ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                        <span className={`text-2xl font-bold ${isDarkMode ? 'text-white drop-shadow-white/30' : 'text-gray-900'}`}>No se encontraron resultados</span>
                                        <span className={`text-base mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Intenta ajustar los filtros o la búsqueda.</span>
                                        <button
                                            onClick={handleReindex}
                                            className={`px-6 py-3 rounded-xl font-bold text-lg shadow-lg border transition-all duration-200 flex items-center gap-2 mt-2 ${isDarkMode ? 'bg-white/10 text-white border-white/30 hover:bg-white/20' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'}`}
                                        >
                                            <RefreshCw className="h-5 w-5 animate-spin-slow" />
                                            Recargar inventario
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className={`rounded-lg border overflow-x-auto overflow-y-auto flex flex-col flex-grow max-h-[70vh] ${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
                                    <table className={`min-w-full ${isDarkMode ? 'divide-y divide-gray-800' : 'divide-y divide-gray-200'}`}>
                                        <thead className={`sticky top-0 z-10 border-b ${isDarkMode ? 'bg-black/80 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                            <tr>
                                                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Origen</th>
                                                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Resguardo</th>
                                                <th
                                                    onClick={() => handleSort('id_inv')}
                                                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'}`}
                                                >
                                                    <div className="flex items-center gap-1">ID Inventario<ArrowUpDown className="h-3 w-3" /></div>
                                                </th>
                                                <th
                                                    onClick={() => handleSort('descripcion')}
                                                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'}`}
                                                >
                                                    <div className="flex items-center gap-1">Descripción<ArrowUpDown className="h-3 w-3" /></div>
                                                </th>
                                                <th
                                                    onClick={() => handleSort('area')}
                                                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'}`}
                                                >
                                                    <div className="flex items-center gap-1">Área<ArrowUpDown className="h-3 w-3" /></div>
                                                </th>
                                                <th
                                                    onClick={() => handleSort('usufinal')}
                                                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'}`}
                                                >
                                                    <div className="flex items-center gap-1">Jefe/Director de Área<ArrowUpDown className="h-3 w-3" /></div>
                                                </th>
                                                <th
                                                    onClick={() => handleSort('estatus')}
                                                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'}`}
                                                >
                                                    <div className="flex items-center gap-1">Estatus<ArrowUpDown className="h-3 w-3" /></div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${isDarkMode ? 'bg-black/60 divide-gray-800' : 'bg-white divide-gray-200'}`}>
                                            {error ? (
                                                <tr className="h-96">
                                                    <td colSpan={6} className={`px-6 py-24 text-center ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                                                        <AlertCircle className="h-12 w-12" />
                                                        <p className="text-lg font-medium">{error}</p>
                                                    </td>
                                                </tr>
                                            ) : totalFilteredCount === 0 ? (
                                                <tr className="h-96">
                                                    <td colSpan={6} className={`px-6 py-24 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        <Search className={`h-12 w-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                                        <p className="text-lg font-medium">No se encontraron resultados</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedMuebles.map((item) => (
                                                    <tr
                                                        key={`${item.origen}-${item.id}`}
                                                        className={`transition-colors ${isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}
                                                    >
                                                        <td className="px-4 py-3 text-xs">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold ${getOrigenColors(isDarkMode)[item.origen]}`}>
                                                                {item.origen}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs">
                                                            {item.id_inv && foliosResguardo[item.id_inv as string] ? (
                                                                <button
                                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold border shadow-sm hover:scale-105 transition-all duration-200 ${isDarkMode ? 'bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}
                                                                    title={`Ver resguardo ${foliosResguardo[item.id_inv as string]}`}
                                                                    onClick={() => handleFolioClick(foliosResguardo[item.id_inv as string])}
                                                                >
                                                                    <BadgeCheck className={`h-4 w-4 mr-1 ${isDarkMode ? 'text-white/80' : 'text-blue-600'}`} />
                                                                    {foliosResguardo[item.id_inv as string]}
                                                                </button>
                                                            ) : (
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold border ${isDarkMode ? 'bg-gray-900/60 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>Sin resguardo</span>
                                                            )}
                                                        </td>
                                                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                            {item.id_inv}
                                                        </td>
                                                        <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            {truncateText(item.descripcion, 40)}
                                                        </td>
                                                        <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            {truncateText(item.area, 20)}
                                                        </td>
                                                        <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            <div className="flex flex-col gap-1">
                                                                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                    {truncateText(item.usufinal, 20) || <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>Sin director</span>}
                                                                </span>
                                                                {item.resguardante && (
                                                                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border shadow-sm ${isDarkMode ? 'bg-white/10 text-white border-white/20' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                                                        {truncateText(item.resguardante, 20)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${item.estatus === 'ACTIVO' ? getEstatusColors(isDarkMode).ACTIVO :
                                                                item.estatus === 'INACTIVO' ? getEstatusColors(isDarkMode).INACTIVO :
                                                                    item.estatus === 'NO LOCALIZADO' ? getEstatusColors(isDarkMode)['NO LOCALIZADO'] :
                                                                        getEstatusColors(isDarkMode).DEFAULT
                                                                }`}>
                                                                {item.estatus}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {/* Resumen de registros mostrados y total */}
                            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mt-4 mb-3 px-2">
                                {/* Contador de registros con diseño mejorado */}
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-inner ${isDarkMode ? 'bg-neutral-900/50 border-neutral-800' : 'bg-gray-100 border-gray-200'}`}>
                                    {totalFilteredCount === 0 ? (
                                        <span className={`flex items-center gap-2 ${isDarkMode ? 'text-neutral-400' : 'text-gray-600'}`}>
                                            <AlertCircle className={`h-4 w-4 ${isDarkMode ? 'text-neutral-500' : 'text-gray-500'}`} />
                                            No hay registros para mostrar
                                        </span>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className={isDarkMode ? 'text-neutral-300' : 'text-gray-700'}>Mostrando</span>
                                            <span className={`px-2 py-0.5 rounded-lg font-mono border ${isDarkMode ? 'bg-white/10 text-white border-white/30' : 'bg-white text-gray-900 border-gray-300'}`}>
                                                {((currentPage - 1) * rowsPerPage) + 1}–{Math.min(currentPage * rowsPerPage, totalFilteredCount)}
                                            </span>
                                            <span className={isDarkMode ? 'text-neutral-300' : 'text-gray-700'}>de</span>
                                            <span className={`px-2 py-0.5 rounded-lg font-mono border ${isDarkMode ? 'bg-neutral-900 text-neutral-300 border-neutral-800' : 'bg-gray-200 text-gray-700 border-gray-300'}`}>
                                                {totalFilteredCount}
                                            </span>
                                            <span className={isDarkMode ? 'text-neutral-400' : 'text-gray-600'}>registros</span>
                                            {/* Selector de filas por página */}
                                            <span className={`ml-4 ${isDarkMode ? 'text-neutral-400' : 'text-gray-500'}`}>|</span>
                                            <label htmlFor="rows-per-page" className={`ml-2 text-xs ${isDarkMode ? 'text-neutral-400' : 'text-gray-600'}`}>Filas por página:</label>
                                            <select
                                                id="rows-per-page"
                                                value={rowsPerPage}
                                                onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                                className={`ml-1 px-2 py-1 rounded-lg border font-mono text-xs focus:outline-none focus:ring-2 transition ${isDarkMode ? 'bg-neutral-900 border-neutral-700 text-white focus:ring-white/50 focus:border-white/50' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
                                            >
                                                {[10, 20, 30, 50, 100].map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* Indicador de página actual con animación */}
                                {totalPages > 1 && (
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-inner ${isDarkMode ? 'bg-neutral-900/50 border-neutral-800' : 'bg-gray-100 border-gray-200'}`}>
                                        <span className={isDarkMode ? 'text-neutral-400' : 'text-gray-600'}>Página</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`px-2.5 py-0.5 rounded-lg font-mono font-bold border min-w-[2rem] text-center transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-white/20 text-white border-white/40 hover:bg-white/30' : 'bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200'}`}>
                                                {currentPage}
                                            </span>
                                            <span className={isDarkMode ? 'text-neutral-500' : 'text-gray-500'}>/</span>
                                            <span className={`px-2.5 py-0.5 rounded-lg font-mono min-w-[2rem] text-center border ${isDarkMode ? 'bg-neutral-900 text-neutral-400 border-neutral-800' : 'bg-gray-200 text-gray-700 border-gray-300'}`}>
                                                {totalPages}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Barra de paginación elegante y numerada */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-6 select-none">
                                    <button
                                        onClick={() => changePage(1)}
                                        disabled={currentPage === 1}
                                        className={`px-2 py-1 rounded-lg border transition disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode ? 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800' : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
                                        title="Primera página"
                                    >
                                        <ChevronLeft className="inline h-4 w-4 -mr-1" />
                                        <ChevronLeft className="inline h-4 w-4 -ml-2" />
                                    </button>
                                    <button
                                        onClick={() => changePage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`px-2 py-1 rounded-lg border transition disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode ? 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800' : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
                                        title="Página anterior"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    {/* Botones numerados dinámicos */}
                                    {(() => {
                                        const pageButtons = [];
                                        const maxButtons = 5; // cantidad máxima de botones numerados visibles
                                        let start = Math.max(1, currentPage - 2);
                                        let end = Math.min(totalPages, currentPage + 2);
                                        if (currentPage <= 3) {
                                            end = Math.min(totalPages, maxButtons);
                                        } else if (currentPage >= totalPages - 2) {
                                            start = Math.max(1, totalPages - maxButtons + 1);
                                        }
                                        if (start > 1) {
                                            pageButtons.push(
                                                <span key="start-ellipsis" className={`px-2 ${isDarkMode ? 'text-neutral-500' : 'text-gray-500'}`}>...</span>
                                            );
                                        }
                                        for (let i = start; i <= end; i++) {
                                            pageButtons.push(
                                                <button
                                                    key={i}
                                                    onClick={() => changePage(i)}
                                                    className={`mx-0.5 px-3 py-1.5 rounded-lg border text-sm font-semibold transition
                                                ${i === currentPage
                                                            ? isDarkMode ? 'bg-white/10 text-white border-white/30 shadow' : 'bg-blue-600 text-white border-blue-600 shadow'
                                                            : isDarkMode ? 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-white/5 hover:text-white hover:border-white/20' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:text-gray-900 hover:border-gray-400'}
                                            `}
                                                    aria-current={i === currentPage ? 'page' : undefined}
                                                >
                                                    {i}
                                                </button>
                                            );
                                        }
                                        if (end < totalPages) {
                                            pageButtons.push(
                                                <span key="end-ellipsis" className={`px-2 ${isDarkMode ? 'text-neutral-500' : 'text-gray-500'}`}>...</span>
                                            );
                                        }
                                        return pageButtons;
                                    })()}
                                    <button
                                        onClick={() => changePage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`px-2 py-1 rounded-lg border transition disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode ? 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800' : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
                                        title="Página siguiente"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => changePage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className={`px-2 py-1 rounded-lg border transition disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode ? 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800' : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
                                        title="Última página"
                                    >
                                        <ChevronRight className="inline h-4 w-4 -mr-2" />
                                        <ChevronRight className="inline h-4 w-4 -ml-1" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <style jsx>{`
            .flip-card {
                perspective: 600px;
                position: relative;
                    overflow: visible;
                }
                .flip-card-inner {
                    display: inline-block;
                    transition: transform 0.6s cubic-bezier(0.4,0.2,0.2,1);
                    transform-style: preserve-3d;
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
                .flip-card-inner.flipped {
                    transform: rotateY(180deg);
                }
                .flip-card-front, .flip-card-back {
                    backface-visibility: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    top: 0;
                    left: 0;
                }
                .flip-card-front {
                    z-index: 2;
                    transform: rotateY(0deg);
                }
                .flip-card-back {
                    z-index:  1;
                    transform: rotateY(180deg);
                }
                }
            `}</style>
                </div>
            </div>
        </>
    );
}