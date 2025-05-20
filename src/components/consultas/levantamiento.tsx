"use client";
import { generateExcel } from '@/components/reportes/excelgenerator';
import { generatePDF } from '@/components/consultas/PDFLevantamiento';
import { generatePDF as generatePDFPerArea } from '@/components/consultas/PDFLevantamientoPerArea';
import { useUserRole } from "@/hooks/useUserRole";
import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
    Search, RefreshCw, ChevronLeft, ChevronRight,
    ArrowUpDown, AlertCircle, X, FileUp, File
} from 'lucide-react';
import supabase from '@/app/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { BadgeCheck } from 'lucide-react';
import ReactDOM from 'react-dom';

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

const ORIGEN_COLORS = {
    INEA: 'bg-blue-900/70 text-blue-200 border border-blue-700',
    ITEA: 'bg-purple-900/70 text-purple-200 border border-purple-700',
};

const ESTATUS_COLORS = {
    ACTIVO: 'bg-green-900/70 text-green-200 border border-green-700',
    INACTIVO: 'bg-red-900/70 text-red-200 border border-red-700',
    'NO LOCALIZADO': 'bg-yellow-900/70 text-yellow-200 border border-yellow-700',
    DEFAULT: 'bg-gray-700 text-gray-300 border border-gray-600'
};

// Utilidad para limpiar texto
function clean(str: string) {
    return (str || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export default function LevantamientoUnificado() {
    const [muebles, setMuebles] = useState<LevMueble[]>([]);
    const [loading, setLoading] = useState(false);
    const role = useUserRole();
    const isAdmin = role === "admin" || role === "superadmin";
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [showDirectorDataModal, setShowDirectorDataModal] = useState(false);
    const [directorToUpdate, setDirectorToUpdate] = useState<DirectorioOption | null>(null);
    const [savingDirectorData, setSavingDirectorData] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [, setSortField] = useState<keyof LevMueble>('id_inv');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
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

    // Componente para el dropdown flotante
    function getTypeColor(type: ActiveFilter['type']) {
        switch (type) {
            case 'id': return 'blue';
            case 'area': return 'purple';
            case 'usufinal': return 'amber';
            case 'resguardante': return 'cyan';
            case 'descripcion': return 'fuchsia';
            case 'rubro': return 'green';
            case 'estado': return 'cyan';
            case 'estatus': return 'pink';
            default: return 'gray';
        }
    }
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
        switch (type) {
            case 'id': return <Search className="h-4 w-4 text-blue-400" />;
            case 'area': return <span title="Área" className="font-bold text-purple-400">A</span>;
            case 'usufinal': return <span title="Director" className="font-bold text-amber-400">D</span>;
            case 'resguardante': return <span title="Resguardante" className="font-bold text-cyan-400">R</span>;
            case 'descripcion': return <span title="Descripción" className="font-bold text-fuchsia-400">Desc</span>;
            case 'rubro': return <span title="Rubro" className="font-bold text-green-400">Ru</span>;
            case 'estado': return <span title="Estado" className="font-bold text-cyan-400">Edo</span>;
            case 'estatus': return <span title="Estatus" className="font-bold text-pink-400">Est</span>;
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
                className={`animate-fadeInUp max-h-80 overflow-y-auto rounded-2xl shadow-2xl border border-neutral-800 bg-black/95 backdrop-blur-xl ring-1 ring-inset ring-neutral-900/60 transition-all duration-200 ${dropdownClass}`}
            >
                {suggestions.map((s, i) => {
                    const itemColor = getTypeColor(s.type);
                    const isSelected = highlightedIndex === i;
                    return (
                        <li
                            key={`${s.type}-${s.value}`}
                            id={`omnibox-suggestion-${i}`}
                            role="option"
                            {...(isSelected && { 'aria-selected': 'true' })}
                            tabIndex={-1}
                            className={`group flex items-center gap-3 px-5 py-3 cursor-pointer select-none
                                        transition-all duration-150 ease-in-out
                                        ${isSelected
                                    ? `bg-neutral-900/80 shadow-[0_0_0_2px] shadow-${itemColor}-500/30 text-${itemColor}-200`
                                    : 'hover:bg-neutral-800/80 text-neutral-200'}
                                        border-b border-neutral-800 last:border-b-0`}
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
                            {/* Icono minimalista */}
                            <span
                                className={`flex items-center justify-center w-8 h-8 rounded-xl
                                    transition-colors duration-200 bg-neutral-800/60
                                    group-hover:bg-${itemColor}-900/20 text-${itemColor}-300
                                    group-hover:text-${itemColor}-200 font-bold text-lg`}
                            >
                                {getTypeIcon(s.type)}
                            </span>

                            {/* Texto principal */}
                            <span className="flex-1 text-base font-medium truncate tracking-wide" title={s.value}>
                                {s.value}
                            </span>

                            {/* Etiqueta de tipo */}
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg bg-neutral-900/70 text-${itemColor}-300 border border-${itemColor}-800 ml-2 tracking-wider`}
                            >
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
    useEffect(() => {
        const analyzeMatch = () => {
            if (!searchTerm || !muebles.length) {
                setSearchMatchType(null);
                return;
            }
            const clean = (str: string) => (str || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
            const term = clean(searchTerm);

            // 1. Coincidencia exacta por prioridad
            for (const item of muebles) {
                if (item.id_inv && clean(item.id_inv) === term) {
                    setSearchMatchType('id');
                    return;
                }
                if (item.area && clean(item.area) === term) {
                    setSearchMatchType('area');
                    return;
                }
                if ((item.usufinal && clean(item.usufinal) === term) || (item.resguardante && clean(item.resguardante) === term)) {
                    setSearchMatchType('usufinal');
                    return;
                }
                if (item.descripcion && clean(item.descripcion) === term) {
                    setSearchMatchType('descripcion');
                    return;
                }
                if (item.rubro && clean(item.rubro) === term) {
                    setSearchMatchType('rubro');
                    return;
                }
                if (item.estado && clean(item.estado) === term) {
                    setSearchMatchType('estado');
                    return;
                }
                if (item.estatus && clean(item.estatus) === term) {
                    setSearchMatchType('estatus');
                    return;
                }
            }
            // 2. Coincidencia parcial por prioridad
            for (const item of muebles) {
                if (item.id_inv && clean(item.id_inv).includes(term)) {
                    setSearchMatchType('id');
                    return;
                }
                if (item.area && clean(item.area).includes(term)) {
                    setSearchMatchType('area');
                    return;
                }
                if ((item.usufinal && clean(item.usufinal).includes(term)) || (item.resguardante && clean(item.resguardante).includes(term))) {
                    setSearchMatchType('usufinal');
                    return;
                }
                if (item.descripcion && clean(item.descripcion).includes(term)) {
                    setSearchMatchType('descripcion');
                    return;
                }
                if (item.rubro && clean(item.rubro).includes(term)) {
                    setSearchMatchType('rubro');
                    return;
                }
                if (item.estado && clean(item.estado).includes(term)) {
                    setSearchMatchType('estado');
                    return;
                }
                if (item.estatus && clean(item.estatus).includes(term)) {
                    setSearchMatchType('estatus');
                    return;
                }
            }
            setSearchMatchType(null);
        };
        const debounceTimeout = setTimeout(analyzeMatch, 200);
        return () => clearTimeout(debounceTimeout);
    }, [searchTerm, muebles]);

    // Filtrado por filtros activos (aproximado, insensible a tildes/mayúsculas)
    const filteredMuebles = muebles.filter(item => {
        if (activeFilters.length === 0 && !searchTerm) return true;
        const passesActiveFilters = activeFilters.every(filter => {
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
        const currentTerm = clean(searchTerm);
        const passesCurrentSearch = !currentTerm ||
            clean(item.id_inv || '').includes(currentTerm) ||
            clean(item.descripcion || '').includes(currentTerm) ||
            clean(item.area || '').includes(currentTerm) ||
            clean(item.usufinal || '').includes(currentTerm) ||
            clean(item.resguardante || '').includes(currentTerm) ||
            clean(item.rubro || '').includes(currentTerm) ||
            clean(item.estado || '').includes(currentTerm) ||
            clean(item.estatus || '').includes(currentTerm);
        return passesActiveFilters && passesCurrentSearch;
    });
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
            setError('Error al cargar opciones de filtro');
        }
    }, []);

    // Función para obtener datos filtrados para exportación

    // Función para manejar la exportación
    const handleExport = async () => {
        try {
            setLoading(true);
            // Usar los datos filtrados actualmente en la tabla
            const exportData = filteredMuebles;

            if (!exportData || exportData.length === 0) {
                setMessage({ type: 'error', text: 'No hay datos para exportar.' });
                setLoading(false);
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
        } finally {
            setLoading(false);
        }
    };

    // Modificar fetchMuebles para traer todos los datos de ambas tablas sin paginación backend
    const fetchMuebles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Helper para traer todos los datos en lotes grandes
            const fetchAllRows = async (table: 'muebles' | 'mueblesitea') => {
                let allRows: LevMueble[] = [];
                let from = 0;
                const pageSize = 1000;
                let keepGoing = true;
                while (keepGoing) {
                    const { data, error } = await supabase.from(table).select('*').range(from, from + pageSize - 1);
                    if (error) throw error;
                    if (data && data.length > 0) {
                        allRows = allRows.concat(data);
                        if (data.length < pageSize) {
                            keepGoing = false;
                        } else {
                            from += pageSize;
                        }
                    } else {
                        keepGoing = false;
                    }
                }
                return allRows;
            };
            // Traer todos los datos de ambas tablas
            const [ineaRows, iteaRows] = await Promise.all([
                fetchAllRows('muebles'),
                fetchAllRows('mueblesitea')
            ]);
            // Combinar y procesar los resultados
            const allData = [
                ...ineaRows.map(item => ({ ...item, origen: 'INEA' as const })),
                ...iteaRows.map(item => ({ ...item, origen: 'ITEA' as const }))
            ];
            setMuebles(allData);
        } catch (error) {
            console.error('Error al cargar muebles:', error);
            setError('Error al cargar los datos. Por favor, intente nuevamente.');
            setMuebles([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFilterOptions();
        fetchMuebles();
    }, [fetchFilterOptions, fetchMuebles]);

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
    const [foliosResguardo, setFoliosResguardo] = useState<{ [id_inv: string]: string | null }>({});

    // Buscar folio de resguardo para los artículos mostrados
    useEffect(() => {
        async function fetchFolios() {
            if (!muebles.length) return;
            const ids = muebles.map(m => m.id_inv);
            // Buscar todos los folios de resguardo para los id_inv actuales
            const { data, error } = await supabase
                .from('resguardos')
                .select('num_inventario, folio')
                .in('num_inventario', ids);
            if (!error && data) {
                const map: { [id_inv: string]: string } = {};
                data.forEach(r => {
                    map[r.num_inventario] = r.folio;
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
    useEffect(() => {
        if (!searchTerm || !muebles.length) {
            setSuggestions([]);
            setShowSuggestions(false);
            setHighlightedIndex(-1);
            return;
        }
        const clean = (str: string) => (str || '').normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
        const term = clean(searchTerm);
        // Recolectar valores únicos por campo
        const seen = new Set<string>();
        const fields = [
            { type: 'id' as ActiveFilter['type'], label: 'ID', icon: <Search className="h-4 w-4 text-blue-400" /> },
            { type: 'area' as ActiveFilter['type'], label: 'Área', icon: <span className="h-4 w-4 text-purple-400 font-bold">A</span> },
            { type: 'usufinal' as ActiveFilter['type'], label: 'Director', icon: <span className="h-4 w-4 text-amber-400 font-bold">D</span> },
            { type: 'resguardante' as ActiveFilter['type'], label: 'Resguardante', icon: <span className="h-4 w-4 text-cyan-400 font-bold">R</span> },
            { type: 'descripcion' as ActiveFilter['type'], label: 'Descripción', icon: <span className="h-4 w-4 text-fuchsia-400 font-bold">Desc</span> },
            { type: 'rubro' as ActiveFilter['type'], label: 'Rubro', icon: <span className="h-4 w-4 text-green-400 font-bold">Ru</span> },
            { type: 'estado' as ActiveFilter['type'], label: 'Estado', icon: <span className="h-4 w-4 text-cyan-400 font-bold">Edo</span> },
            { type: 'estatus' as ActiveFilter['type'], label: 'Estatus', icon: <span className="h-4 w-4 text-pink-400 font-bold">Est</span> },
        ];
        let allSuggestions: { value: string; type: ActiveFilter['type'] }[] = [];
        for (const f of fields) {
            let values: string[] = [];
            switch (f.type) {
                case 'id': values = muebles.map(m => m.id_inv).filter(Boolean) as string[]; break;
                case 'area': values = muebles.map(m => m.area).filter(Boolean) as string[]; break;
                case 'usufinal': values = muebles.map(m => m.usufinal).filter(Boolean) as string[]; break;
                case 'resguardante': values = muebles.map(m => m.resguardante).filter(Boolean) as string[]; break;
                case 'descripcion': values = muebles.map(m => m.descripcion).filter(Boolean) as string[]; break;
                case 'rubro': values = muebles.map(m => m.rubro).filter(Boolean) as string[]; break;
                case 'estado': values = muebles.map(m => m.estado).filter(Boolean) as string[]; break;
                case 'estatus': values = muebles.map(m => m.estatus).filter(Boolean) as string[]; break;
                default: values = [];
            }
            for (const v of values) {
                if (!v) continue;
                const vClean = clean(v);
                if (vClean.includes(term) && !seen.has(f.type + ':' + vClean)) {
                    allSuggestions.push({ value: v, type: f.type });
                    seen.add(f.type + ':' + vClean);
                }
            }
        }
        // Prioridad: exactos primero, luego parciales, máx 7
        allSuggestions = [
            ...allSuggestions.filter(s => clean(s.value) === term),
            ...allSuggestions.filter(s => clean(s.value) !== term)
        ].slice(0, 7);
        setSuggestions(allSuggestions);
        setShowSuggestions(allSuggestions.length > 0);
        setHighlightedIndex(allSuggestions.length > 0 ? 0 : -1);
    }, [searchTerm, muebles]);

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
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm px-4 animate-fadeIn">
                    <div className="bg-gradient-to-br from-fuchsia-900/90 via-black/95 to-fuchsia-800/90 border-2 border-fuchsia-700/80 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transition-all duration-300 transform">
                        <div className="relative p-7 sm:p-8">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500/60 via-fuchsia-400 to-fuchsia-500/60" />
                            <h2 className="text-2xl font-extrabold mb-2 text-fuchsia-200 flex items-center gap-2 tracking-tight drop-shadow-fuchsia-700/30">
                                <FileUp className="h-6 w-6 text-fuchsia-400" /> Completar datos del director
                            </h2>
                            <p className="text-fuchsia-100/80 text-base mb-6 font-medium flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-amber-400" />
                                El director seleccionado no tiene todos sus datos completos. Por favor, completa la información faltante.
                            </p>
                            {directorToUpdate && (
                                <div className="flex flex-col gap-6">
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-fuchsia-400 mb-1 font-bold">Nombre</label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-900 border-2 border-fuchsia-700 focus:border-fuchsia-400 rounded-xl px-4 py-3 text-lg text-white font-semibold shadow-inner focus:outline-none transition-all duration-200 placeholder:text-fuchsia-300/40"
                                            value={directorToUpdate.nombre ?? ''}
                                            onChange={e => setDirectorToUpdate(prev => prev ? { ...prev, nombre: e.target.value.toUpperCase() } : null)}
                                            placeholder="Ej: JUAN PÉREZ GÓMEZ"
                                            autoFocus
                                            maxLength={80}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-fuchsia-400 mb-1 font-bold">Cargo</label>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-900 border-2 border-fuchsia-700 focus:border-fuchsia-400 rounded-xl px-4 py-3 text-lg text-white font-semibold shadow-inner focus:outline-none transition-all duration-200 placeholder:text-fuchsia-300/40"
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
                                    className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800 transition-all duration-200 shadow"
                                    onClick={() => setShowDirectorDataModal(false)}
                                >Cancelar</button>
                                <button
                                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-200
                            bg-gradient-to-r from-fuchsia-700 to-fuchsia-500 text-white shadow border border-fuchsia-400/60
                            ${savingDirectorData || !directorToUpdate || !(directorToUpdate.nombre || '').trim() || !(directorToUpdate.puesto || '').trim() ? 'opacity-60 cursor-not-allowed' : 'hover:from-fuchsia-800 hover:to-fuchsia-600'}`}
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
            <div className="bg-black text-white min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
                <div className="w-full mx-auto bg-black rounded-lg sm:rounded-xl shadow-2xl overflow-hidden border border-gray-800">
                    <div className="bg-black p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 gap-2 sm:gap-0">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
                            <span className="mr-2 sm:mr-3 bg-gray-900 text-white p-1 sm:p-2 rounded-lg border border-gray-700 text-sm sm:text-base">LEV</span>
                            Levantamiento de Inventario (INEA + ITEA)
                        </h1>
                        <p className="text-gray-400 text-sm sm:text-base">Vista unificada de todos los bienes registrados</p>
                    </div>
                    <div className="flex flex-col gap-4 p-4">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                            <div className="flex gap-4 flex-grow">
                                {/* Barra de búsqueda y filtros activos brutalmente mejorados */}
                                <div className="w-full flex flex-col gap-2">
                                    <div className="relative flex items-center w-full">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-300 group-focus-within:scale-110">
                                            <Search className="h-5 w-5 text-blue-400 group-focus-within:text-blue-500 transition-colores duration-300" />
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
                                            pl-14 pr-32 py-3 w-full bg-black/80 text-white placeholder-neutral-500
                                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                            rounded-2xl border border-neutral-800 shadow-2xl transition-all duration-300
                                            text-lg font-semibold tracking-wide
                                            backdrop-blur-xl
                                            hover:shadow-blue-500/10
                                            focus:scale-[1.03]
                                            focus:bg-black/90
                                            ${searchMatchType === 'id' ? 'border-blue-500/80 shadow-blue-500/20' : ''}
                                            ${searchMatchType === 'area' ? 'border-purple-500/80 shadow-purple-500/20' : ''}
                                            ${searchMatchType === 'usufinal' ? 'border-amber-500/80 shadow-amber-500/20' : ''}
                                            ${searchMatchType === 'descripcion' ? 'border-fuchsia-500/80 shadow-fuchsia-500/20' : ''}
                                            ${searchMatchType === 'rubro' ? 'border-green-500/80 shadow-green-500/20' : ''}
                                            ${searchMatchType === 'estado' ? 'border-cyan-500/80 shadow-cyan-500/20' : ''}
                                            ${searchMatchType === 'estatus' ? 'border-pink-500/80 shadow-pink-500/20' : ''}
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
                                            {activeFilters.map((filter, index) => (
                                                <span
                                                    key={index}
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border border-neutral-700 shadow-sm animate-fadeIn transition-all duration-200
                                                    bg-neutral-900/80 text-neutral-200 group relative hover:scale-[1.04] hover:shadow-lg hover:shadow-black/10`}
                                                >
                                                    <span className="mr-1">
                                                        {getTypeIcon(filter.type)}
                                                    </span>
                                                    <span className="font-medium text-xs mr-1 truncate max-w-[90px]" title={filter.term}>{filter.term}</span>
                                                    <span className="ml-1 text-[10px] opacity-60 font-bold">{getTypeLabel(filter.type)}</span>
                                                    <button
                                                        onClick={() => removeFilter(index)}
                                                        className="ml-2 p-0.5 rounded-full bg-neutral-800 hover:bg-red-700/60 text-neutral-400 hover:text-white transition-colores duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                        title="Eliminar filtro"
                                                        tabIndex={0}
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                        </svg>
                                                    </button>
                                                </span>
                                            ))}
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
                                    className="group relative px-4 py-2 bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-md font-medium flex items-center gap-2 hover:from-emerald-600 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 border border-emerald-700/50 hover:border-emerald-500"
                                    title="Exportar a Excel"
                                >
                                    <div className={`
                                    absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-transparent
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md
                                `}></div>
                                    <FileUp className="h-4 w-4 transition-transform group-hover:scale-110 group-hover:-translate-y-0.5 duration-300" />
                                    <span className="hidden sm:flex items-center gap-1">
                                        Excel
                                        <span className="text-xs text-emerald-300 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
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
                                    className={
                                        `group relative px-4 py-2.5 rounded-lg font-medium 
                                    flex items-center gap-2.5 transition-all duration-300
                                    ${isCustomPDFEnabled
                                            ? 'bg-gradient-to-br from-fuchsia-600 to-purple-600 hover:from-purple-600 hover:to-fuchsia-600 text-white hover:shadow-fuchsia-500/30 border-fuchsia-700/50 hover:border-fuchsia-500'
                                            : 'bg-gradient-to-br from-red-600 to-rose-600 hover:from-rose-600 hover:to-red-600 text-white hover:shadow-red-500/30 border-red-700/50 hover:border-red-500'
                                    }`}
                                    title={isCustomPDFEnabled ? 'Exportar PDF personalizado por área y director (solo si ambos filtros son exactos)' : 'Exportar a PDF'}
                                >
                                    <FileUp className="h-4 w-4 transition-transform group-hover:scale-110 group-hover:-translate-y-0.5 duration-300" />
                                    <span className="hidden sm:flex items-center gap-1">
                                        {isCustomPDFEnabled ? 'PDF Personalizado' : 'PDF'}
                                    </span>
                                </button>
                                {/* Refresh Button */}
                                <button
                                    onClick={() => { setLoading(true); fetchMuebles(); }}
                                    className={`
                                    group relative px-4 py-2.5 rounded-lg font-medium 
                                    flex items-center gap-2.5 transition-all duration-300
                                    bg-gradient-to-br from-cyan-600/20 to-blue-600/20 
                                    hover:from-cyan-500/30 hover:to-blue-500/30
                                    text-cyan-300 hover:text-cyan-200
                                    border border-cyan-500/30 hover:border-cyan-400/50
                                    shadow-lg hover:shadow-cyan-500/20
                                    hover:scale-[1.02] active:scale-[0.98]
                                    overflow-hidden
                                `}
                                    title="Actualizar datos"
                                    disabled={loading}
                                >
                                    {/* Animated gradient background */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-x"></div>

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
                                            <span className="absolute w-full h-full animate-ping rounded-lg bg-cyan-400/20"></span>
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    {message && (
                        <div className={`p-3 rounded-md ${message.type === 'success' ? 'bg-green-900/50 text-green-300 border border-green-800' :
                            message.type === 'error' ? 'bg-red-900/50 text-red-300 border border-red-800' :
                                message.type === 'warning' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-800' :
                                    message.type === 'info' ? 'bg-blue-900/50 text-blue-300 border border-blue-800' : ''
                            }`}>
                            {message.text}
                        </div>
                    )}
                    {showExportModal && (
                        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 animate-fadeIn">
                            <div className={`bg-black rounded-2xl shadow-2xl border w-full max-w-md overflow-hidden transition-all duration-300 transform ${exportType === 'excel' ? 'border-green-600/30' : 'border-red-600/30'
                                }`}>
                                <div className={`relative p-6 bg-gradient-to-b from-black to-gray-900 ${exportType === 'excel' ? 'from-green-950 to-green-900' : 'from-red-950 to-red-900'
                                    }`}>
                                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${exportType === 'excel'
                                        ? 'from-green-500/60 via-green-400 to-green-500/60'
                                        : 'from-red-500/60 via-red-400 to-red-500/60'
                                        }`}></div>

                                    <button
                                        onClick={() => setShowExportModal(false)}
                                        className={`absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-gray-900 ${exportType === 'excel' ? 'text-green-400 hover:text-green-500 border-green-500/30' : 'text-red-400 hover:text-red-500 border-red-500/30'
                                            } border transition-colores`}
                                        title="Cerrar"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>

                                    <div className="flex flex-col items-center text-center mb-4">
                                        <div className={`p-3 rounded-full border mb-3 ${exportType === 'excel' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                                            }`}>
                                            {exportType === 'excel' ? (
                                                <FileUp className="h-8 w-8 text-green-500" />
                                            ) : (
                                                <File className="h-8 w-8 text-red-500" />
                                            )}
                                        </div>
                                        <h3 className={`text-2xl font-bold ${exportType === 'excel' ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                            Exportar a {exportType === 'excel' ? 'Excel' : 'PDF'}
                                        </h3>
                                        <p className="text-gray-400 mt-2">
                                            Exportar los datos a un archivo {exportType === 'excel' ? 'Excel para su análisis' : 'PDF para su visualización'}
                                        </p>
                                    </div>

                                    <div className="space-y-5 mt-6">
                                        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                                            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-bold">Documento a generar</label>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-800 rounded-lg">
                                                    {exportType === 'excel' ? (
                                                        <FileUp className="h-4 w-4 text-green-400" />
                                                    ) : (
                                                        <File className="h-4 w-4 text-red-400" />
                                                    )}
                                                </div>
                                                <span className="text-white font-medium">
                                                    {`Reporte_inventario_${new Date().toISOString().slice(0, 10)}.${exportType === 'excel' ? 'xlsx' : 'pdf'}`}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-full flex flex-col items-center gap-4">
                                            <div className="w-full">
                                                <button
                                                    onClick={handleExport}
                                                    className={`w-full py-3 px-4 font-medium rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg ${exportType === 'excel'
                                                        ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400'
                                                        : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400'
                                                        } text-black`}
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
                        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 animate-fadeIn">
                            <div className="bg-black rounded-2xl shadow-2xl border w-full max-w-lg overflow-hidden border-fuchsia-700/40">
                                <div className="p-6">
                                    <h2 className="text-xl font-bold mb-2 text-fuchsia-300 flex items-center gap-2">
                                        <FileUp className="h-5 w-5 text-fuchsia-400" /> Exportar PDF por Área y Director
                                    </h2>
                                    <div className="mb-3 flex items-center gap-2 text-xs text-gray-400">
                                        <span>Registros a exportar</span>
                                        <span className="inline-block px-2 py-0.5 rounded-full bg-gradient-to-r from-fuchsia-700 via-purple-700 to-amber-600 text-white font-bold shadow border border-fuchsia-400/60 min-w-[32px] text-center">
                                            {getFilteredMueblesForExportPDF().length}
                                        </span>
                                    </div>
                                    <div className="mb-4">
                                        <div className="flex flex-col gap-2">
                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Área seleccionada</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-gray-800 border-2 border-fuchsia-700 focus:border-fuchsia-400 rounded-xl px-4 py-3 text-lg text-white font-semibold shadow-inner focus:outline-none transition-all duration-200 placeholder:text-fuchsia-300/40"
                                                    value={areaPDFTarget.area}
                                                    readOnly
                                                    title="Área seleccionada para el PDF"
                                                />
                                            </div>
                                            <div>
                                                {/* Mostrar el nombre del director buscado si no se encontró exactamente */}
                                                {areaPDFTarget.usufinal && !directorSugerido && (
                                                    <div className="mb-3 p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg">
                                                        <p className="text-amber-200 font-medium flex items-center gap-2">
                                                            <AlertCircle className="h-4 w-4" />
                                                            Director buscado no encontrado
                                                        </p>
                                                        <p className="text-amber-100/90 text-sm mt-1">
                                                            &quot;{areaPDFTarget.usufinal}&quot;
                                                        </p>
                                                    </div>
                                                )}
                                                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Buscar director</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-gray-800 border-2 border-fuchsia-700 focus:border-fuchsia-400 rounded-xl px-4 py-3 text-lg text-white font-semibold shadow-inner focus:outline-none transition-all duration-200 placeholder:text-fuchsia-300/40"
                                                    placeholder="Buscar director por nombre..."
                                                    value={searchDirectorTerm || ''}
                                                    onChange={e => setSearchDirectorTerm(e.target.value)}
                                                    title="Buscar director por nombre"
                                                    autoFocus
                                                />
                                                <div className="max-h-48 overflow-y-auto rounded-lg border border-fuchsia-700/30 bg-gray-900/80 shadow-inner divide-y divide-fuchsia-800/30">
                                                    {filteredDirectorOptions.length === 0 ? (
                                                        <div className="text-gray-400 text-sm p-3">No se encontraron directores.</div>
                                                    ) : (
                                                        filteredDirectorOptions.map(opt => (
                                                            <button
                                                                key={opt.id_directorio}
                                                                className={`w-full text-left px-4 py-2 flex flex-col gap-0.5 transition-all duration-150
                                                            border-l-4
                                                            ${directorSugerido && opt.id_directorio === directorSugerido.id_directorio ? 'border-fuchsia-400 bg-fuchsia-900/30 text-fuchsia-200 font-bold shadow-lg' :
                                                                    areaDirectorForm.nombre === opt.nombre ? 'border-fuchsia-600 bg-fuchsia-800/40 text-fuchsia-100 font-semibold' :
                                                                        'border-transparent hover:bg-fuchsia-800/20 text-white'}
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
                                                                        <BadgeCheck className="inline h-4 w-4 text-fuchsia-400 ml-1" />
                                                                    )}
                                                                    {areaDirectorForm.nombre === opt.nombre && (
                                                                        <span className="ml-2 px-2 py-0.5 rounded-full bg-fuchsia-700/60 text-xs text-white">Seleccionado</span>
                                                                    )}
                                                                </span>
                                                                <span className="text-xs text-fuchsia-300">{opt.puesto}</span>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1 font-bold">Puesto</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-gray-800 border-2 border-fuchsia-700 focus:border-fuchsia-400 rounded-xl px-4 py-3 text-lg text-white font-semibold shadow-inner focus:outline-none transition-all duration-200 placeholder:text-fuchsia-300/40"
                                                    value={areaDirectorForm.puesto || ''}
                                                    readOnly
                                                    title="Puesto del director o jefe de área"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {areaPDFError && <div className="text-red-400 mb-2 text-sm">{areaPDFError}</div>}
                                    <div className="flex justify-end gap-2 mt-4">
                                        <button
                                            className="px-4 py-2 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                                            onClick={() => setShowAreaPDFModal(false)}
                                        >Cancelar</button>
                                        <button
                                            className="px-4 py-2 rounded bg-fuchsia-700 text-white font-bold hover:bg-fuchsia-600 border border-fuchsia-800 disabled:opacity-50"
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
                            {/* Spinner de carga */}

                            {loading ? (
                                <div className="flex flex-col items-center justify-center min-h-[300px] w-full bg-black/80 rounded-lg animate-fadeIn">
                                    <div className="relative flex flex-col items-center justify-center gap-4 py-12">
                                        <span className="relative flex h-16 w-16">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-500 opacity-40"></span>
                                            <span className="relative inline-flex rounded-full h-16 w-16 border-4 border-fuchsia-600 border-t-transparent animate-spin"></span>
                                        </span>
                                        <span className="text-xl font-bold text-fuchsia-300 drop-shadow-fuchsia-700/30">Cargando inventario...</span>
                                        <span className="text-sm text-fuchsia-100/70">Por favor espera, esto puede tardar unos segundos.</span>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center min-h-[300px] w-full bg-black/80 rounded-lg animate-fadeIn">
                                    <div className="flex flex-col items-center gap-4 py-12">
                                        <AlertCircle className="h-14 w-14 text-rose-400 animate-bounce" />
                                        <span className="text-2xl font-bold text-rose-300 drop-shadow-rose-700/30">Error al cargar los datos</span>
                                        <span className="text-base text-rose-100/80 mb-2">{error}</span>
                                        <button
                                            onClick={() => fetchMuebles()}
                                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-700 to-fuchsia-500 text-white font-bold text-lg shadow-lg border border-fuchsia-400/60 hover:from-fuchsia-800 hover:to-fuchsia-600 transition-all duration-200 flex items-center gap-2 mt-2"
                                        >
                                            <RefreshCw className="h-5 w-5 animate-spin-slow" />
                                            Reintentar
                                        </button>
                                    </div>
                                </div>
                            ) : totalFilteredCount === 0 ? (
                                <div className="flex flex-col items-center justify-center min-h-[300px] w-full bg-black/80 rounded-lg animate-fadeIn">
                                    <div className="flex flex-col items-center gap-4 py-12">
                                        <Search className="h-14 w-14 text-fuchsia-400 animate-pulse" />
                                        <span className="text-2xl font-bold text-fuchsia-200 drop-shadow-fuchsia-700/30">No se encontraron resultados</span>
                                        <span className="text-base text-fuchsia-100/80 mb-2">Intenta ajustar los filtros o la búsqueda.</span>
                                        <button
                                            onClick={() => fetchMuebles()}
                                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-700 to-fuchsia-500 text-white font-bold text-lg shadow-lg border border-fuchsia-400/60 hover:from-fuchsia-800 hover:to-fuchsia-600 transition-all duration-200 flex items-center gap-2 mt-2"
                                        >
                                            <RefreshCw className="h-5 w-5 animate-spin-slow" />
                                            Recargar inventario
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-black rounded-lg border border-gray-800 overflow-x-auto overflow-y-auto flex flex-col flex-grow max-h-[70vh]">
                                    <table className="min-w-full divide-y divide-gray-800">
                                        <thead className="bg-black sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Origen</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Resguardo</th>
                                                <th
                                                    onClick={() => {
                                                        setSortField('id_inv');
                                                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                                    }}
                                                    className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                                >
                                                    <div className="flex items-center gap-1">ID Inventario<ArrowUpDown className="h-3 w-3" /></div>
                                                </th>
                                                <th
                                                    onClick={() => {
                                                        setSortField('descripcion');
                                                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                                    }}
                                                    className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                                >
                                                    <div className="flex items-center gap-1">Descripción<ArrowUpDown className="h-3 w-3" /></div>
                                                </th>
                                                <th
                                                    onClick={() => {
                                                        setSortField('area');
                                                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                                    }}
                                                    className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                                >
                                                    <div className="flex items-center gap-1">Área<ArrowUpDown className="h-3 w-3" /></div>
                                                </th>
                                                <th
                                                    onClick={() => {
                                                        setSortField('usufinal');
                                                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                                    }}
                                                    className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                                >
                                                    <div className="flex items-center gap-1">Jefe/Director de Área<ArrowUpDown className="h-3 w-3" /></div>
                                                </th>
                                                <th
                                                    onClick={() => {
                                                        setSortField('estatus');
                                                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                                                    }}
                                                    className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                                >
                                                    <div className="flex items-center gap-1">Estatus<ArrowUpDown className="h-3 w-3" /></div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-black divide-y divide-gray-800">
                                            {error ? (
                                                <tr className="h-96">
                                                    <td colSpan={6} className="px-6 py-24 text-center text-red-400">
                                                        <AlertCircle className="h-12 w-12" />
                                                        <p className="text-lg font-medium">{error}</p>
                                                    </td>
                                                </tr>
                                            ) : totalFilteredCount === 0 ? (
                                                <tr className="h-96">
                                                    <td colSpan={6} className="px-6 py-24 text-center text-gray-400">
                                                        <Search className="h-12 w-12 text-gray-500" />
                                                        <p className="text-lg font-medium">No se encontraron resultados</p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedMuebles.map((item) => (
                                                    <tr
                                                        key={`${item.origen}-${item.id}`}
                                                        className={
                                                            `transition-colors`
                                                        }
                                                    >
                                                        <td className="px-4 py-3 text-xs">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold ${ORIGEN_COLORS[item.origen]}`}>
                                                                {item.origen}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs">
                                                            {foliosResguardo[item.id_inv] ? (
                                                                <button
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold bg-gradient-to-r from-blue-900/60 to-blue-700/60 text-blue-200 border border-blue-700 hover:from-blue-800 hover:to-blue-600 hover:text-white shadow-sm hover:scale-105 transition-all duration-200"
                                                                    title={`Ver resguardo ${foliosResguardo[item.id_inv]}`}
                                                                    onClick={() => handleFolioClick(foliosResguardo[item.id_inv]!)}
                                                                >
                                                                    <BadgeCheck className="h-4 w-4 mr-1 text-blue-300" />
                                                                    {foliosResguardo[item.id_inv]}
                                                                </button>
                                                            ) : (
                                                                <span className="text-gray-600 italic">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                                                            {item.id_inv}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-300">
                                                            {truncateText(item.descripcion, 40)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-300">
                                                            {truncateText(item.area, 20)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-300">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="font-medium text-white">
                                                                    {truncateText(item.usufinal, 20) || <span className="text-gray-500">Sin director</span>}
                                                                </span>
                                                                {item.resguardante && (
                                                                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-cyan-900/50 to-blue-900/50 text-cyan-200 rounded-full border border-cyan-500/30 shadow-sm">
                                                                        {truncateText(item.resguardante, 20)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${item.estatus === 'ACTIVO' ? ESTATUS_COLORS.ACTIVO :
                                                                item.estatus === 'INACTIVO' ? ESTATUS_COLORS.INACTIVO :
                                                                    item.estatus === 'NO LOCALIZADO' ? ESTATUS_COLORS['NO LOCALIZADO'] :
                                                                        ESTATUS_COLORS.DEFAULT
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
                                <div className="flex items-center gap-2 bg-neutral-900/50 px-4 py-2 rounded-xl border border-neutral-800 shadow-inner">
                                    {totalFilteredCount === 0 ? (
                                        <span className="text-neutral-400 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-neutral-500" />
                                            No hay registros para mostrar
                                        </span>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-neutral-300">Mostrando</span>
                                            <span className="px-2 py-0.5 rounded-lg bg-blue-900/30 text-blue-300 font-mono border border-blue-800/50">
                                                {((currentPage - 1) * rowsPerPage) + 1}–{Math.min(currentPage * rowsPerPage, totalFilteredCount)}
                                            </span>
                                            <span className="text-neutral-300">de</span>
                                            <span className="px-2 py-0.5 rounded-lg bg-neutral-900 text-neutral-300 font-mono border border-neutral-800">
                                                {totalFilteredCount}
                                            </span>
                                            <span className="text-neutral-400">registros</span>
                                            {/* Selector de filas por página */}
                                            <span className="ml-4 text-neutral-400">|</span>
                                            <label htmlFor="rows-per-page" className="ml-2 text-xs text-neutral-400">Filas por página:</label>
                                            <select
                                                id="rows-per-page"
                                                value={rowsPerPage}
                                                onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                                className="ml-1 px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-blue-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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
                                    <div className="flex items-center gap-2 bg-neutral-900/50 px-4 py-2 rounded-xl border border-neutral-800 shadow-inner">
                                        <span className="text-neutral-400">Página</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="px-2.5 py-0.5 rounded-lg bg-blue-900/40 text-blue-300 font-mono font-bold border border-blue-700/50 min-w-[2rem] text-center transition-all duration-300 hover:scale-105 hover:bg-blue-900/60">
                                                {currentPage}
                                            </span>
                                            <span className="text-neutral-500">/</span>
                                            <span className="px-2.5 py-0.5 rounded-lg bg-neutral-900 text-neutral-400 font-mono min-w-[2rem] text-center border border-neutral-800">
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
                                        className="px-2 py-1 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                        title="Primera página"
                                    >
                                        <ChevronLeft className="inline h-4 w-4 -mr-1" />
                                        <ChevronLeft className="inline h-4 w-4 -ml-2" />
                                    </button>
                                    <button
                                        onClick={() => changePage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-2 py-1 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
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
                                                <span key="start-ellipsis" className="px-2 text-neutral-500">...</span>
                                            );
                                        }
                                        for (let i = start; i <= end; i++) {
                                            pageButtons.push(
                                                <button
                                                    key={i}
                                                    onClick={() => changePage(i)}
                                                    className={`mx-0.5 px-3 py-1.5 rounded-lg border text-sm font-semibold transition
                                                ${i === currentPage
                                                        ? 'bg-blue-900/80 text-blue-300 border-blue-700 shadow'
                                                        : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-blue-900/40 hover:text-blue-200 hover:border-blue-600'}
                                            `}
                                                    aria-current={i === currentPage ? 'page' : undefined}
                                                >
                                                    {i}
                                                </button>
                                            );
                                        }
                                        if (end < totalPages) {
                                            pageButtons.push(
                                                <span key="end-ellipsis" className="px-2 text-neutral-500">...</span>
                                            );
                                        }
                                        return pageButtons;
                                    })()}
                                    <button
                                        onClick={() => changePage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-2 py-1 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                        title="Página siguiente"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => changePage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="px-2 py-1 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
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