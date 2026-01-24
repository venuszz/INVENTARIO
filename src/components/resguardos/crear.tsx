"use client";
import { useState, useEffect, useCallback, useRef, useMemo, useDeferredValue } from 'react';
import {
    Search, ChevronLeft, ChevronRight, ArrowUpDown,
    AlertCircle, X, Save, ActivitySquare,
    LayoutGrid, TagIcon, Building2,
    User, AlertTriangle, Calendar, Info,
    CheckCircle, RefreshCw, UserCheck, Briefcase,
    Trash2, ListChecks, FileDigit, Users, FileText, Download,
    Plus
} from 'lucide-react';
import supabase from '@/app/lib/supabase/client';
import { generateResguardoPDF } from './ResguardoPDFReport';
import { useUserRole } from "@/hooks/useUserRole";
import { useSession } from "@/hooks/useSession";
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/context/ThemeContext';
import { useIneaIndexation } from '@/hooks/indexation/useIneaIndexation';
import { useIteaIndexation } from '@/hooks/indexation/useIteaIndexation';
import { useNoListadoIndexation } from '@/hooks/indexation/useNoListadoIndexation';
import SectionRealtimeToggle from '@/components/SectionRealtimeToggle';

interface Mueble {
    id: number;
    id_inv: string | null;
    descripcion: string | null;
    estado: string | null;
    estatus: string | null;
    resguardante?: string | null;
    rubro: string | null;
    usufinal: string | null;
    area?: string | null;
    origen?: string;
    resguardanteAsignado?: string;
}

interface Directorio {
    id_directorio: number;
    nombre: string;
    area: string | null;
    puesto: string | null;
}

interface ResguardoForm {
    folio: string;
    directorId: string;
    area: string;
    puesto: string;
    resguardante: string;
}

interface PdfFirma {
    concepto: string;
    nombre: string;
    puesto: string;
    cargo: string;
    firma?: string;
}

interface PdfData {
    folio: string;
    fecha: string;
    director: string | undefined;
    area: string;
    puesto: string;
    resguardante: string;
    articulos: Array<{
        id_inv: string | null;
        descripcion: string | null;
        rubro: string | null;
        estado: string | null;
        origen?: string | null;
        resguardante: string;
    }>;
    firmas?: PdfFirma[];
}

interface ActiveFilter {
    term: string;
    type: 'id' | 'descripcion' | 'rubro' | 'estado' | 'estatus' | 'area' | 'usufinal' | 'resguardante' | null;
}

const colorPaletteDark = [
    'bg-gray-900/30 text-white border-white hover:bg-gray-900/40 transition-colors',
    'bg-green-900/30 text-green-200 border-green-700 hover:bg-green-900/40 transition-colors',
    'bg-yellow-900/30 text-yellow-200 border-yellow-700 hover:bg-yellow-900/40 transition-colors',
    'bg-purple-900/30 text-purple-200 border-purple-700 hover:bg-purple-900/40 transition-colors',
    'bg-pink-900/30 text-pink-200 border-pink-700 hover:bg-pink-900/40 transition-colors',
    'bg-red-900/30 text-red-200 border-red-700 hover:bg-red-900/40 transition-colors',
    'bg-cyan-900/30 text-cyan-200 border-cyan-700 hover:bg-cyan-900/40 transition-colors',
    'bg-orange-900/30 text-orange-200 border-orange-700 hover:bg-orange-900/40 transition-colors',
    'bg-teal-900/30 text-teal-200 border-teal-700 hover:bg-teal-900/40 transition-colors',
    'bg-indigo-900/30 text-indigo-200 border-indigo-700 hover:bg-indigo-900/40 transition-colors',
    'bg-gray-900/30 text-gray-200 border-gray-700 hover:bg-gray-900/40 transition-colors',
];

const colorPaletteLight = [
    'bg-gray-100 text-gray-800 border-gray-400 hover:bg-gray-200 transition-colors',
    'bg-green-100 text-green-800 border-green-400 hover:bg-green-200 transition-colors',
    'bg-yellow-100 text-yellow-800 border-yellow-400 hover:bg-yellow-200 transition-colors',
    'bg-purple-100 text-purple-800 border-purple-400 hover:bg-purple-200 transition-colors',
    'bg-pink-100 text-pink-800 border-pink-400 hover:bg-pink-200 transition-colors',
    'bg-red-100 text-red-800 border-red-400 hover:bg-red-200 transition-colors',
    'bg-cyan-100 text-cyan-800 border-cyan-400 hover:bg-cyan-200 transition-colors',
    'bg-orange-100 text-orange-800 border-orange-400 hover:bg-orange-200 transition-colors',
    'bg-teal-100 text-teal-800 border-teal-400 hover:bg-teal-200 transition-colors',
    'bg-indigo-100 text-indigo-800 border-indigo-400 hover:bg-indigo-200 transition-colors',
    'bg-gray-100 text-gray-700 border-gray-400 hover:bg-gray-200 transition-colors',
];

function getColorClass(value: string | null | undefined, isDarkMode: boolean) {
    if (!value) {
        return isDarkMode
            ? 'bg-gray-900/20 text-gray-300 border border-gray-900 hover:bg-gray-900/30'
            : 'bg-gray-100 text-gray-600 border border-gray-400 hover:bg-gray-200';
    }
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = value.charCodeAt(i) + ((hash << 5) - hash);
    }
    const palette = isDarkMode ? colorPaletteDark : colorPaletteLight;
    const idx = Math.abs(hash) % palette.length;
    return palette[idx];
}

export default function CrearResguardos() {
    const { muebles: ineaData, realtimeConnected: ineaConnected } = useIneaIndexation();
    const { muebles: iteaData, realtimeConnected: iteaConnected } = useIteaIndexation();
    const { muebles: noListadoData, realtimeConnected: noListadoConnected } = useNoListadoIndexation();
    const { user } = useSession(); // ← AGREGADO: Obtener usuario de la sesión
    const [allMuebles, setAllMuebles] = useState<Mueble[]>([]);
    const [directorio, setDirectorio] = useState<Directorio[]>([]);
    const [selectedMuebles, setSelectedMuebles] = useState<Mueble[]>([]);
    const [showPDFButton, setShowPDFButton] = useState(false);
    const [formData, setFormData] = useState<ResguardoForm>({
        folio: '',
        directorId: '',
        area: '',
        puesto: '',
        resguardante: ''
    });
    const [showDirectorModal, setShowDirectorModal] = useState(false);
    const [incompleteDirector, setIncompleteDirector] = useState<Directorio | null>(null);
    const [directorFormData, setDirectorFormData] = useState({ area: '', puesto: '' });
    const [searchTerm, setSearchTerm] = useState('');
    // Defer search term to avoid blocking input
    const deferredSearchTerm = useDeferredValue(searchTerm);

    // Pre-calculate searchable vectors
    const searchableData = useMemo(() => {
        if (!allMuebles || allMuebles.length === 0) return null;
        return {
            id: allMuebles.map(m => m.id_inv || '').filter(Boolean),
            area: allMuebles.map(m => m.area || '').filter(Boolean),
            usufinal: allMuebles.map(m => m.usufinal || '').filter(Boolean),
            resguardante: allMuebles.map(m => m.resguardante || '').filter(Boolean),
            descripcion: allMuebles.map(m => m.descripcion || '').filter(Boolean),
            rubro: allMuebles.map(m => m.rubro || '').filter(Boolean),
            estado: allMuebles.map(m => m.estado || '').filter(Boolean),
            estatus: allMuebles.map(m => m.estatus || '').filter(Boolean),
        };
    }, [allMuebles]);

    const [searchMatchType, setSearchMatchType] = useState<null | 'id' | 'descripcion' | 'rubro' | 'estado' | 'estatus' | 'area' | 'usufinal' | 'resguardante'>(null);

    const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

    // Función para guardar el filtro actual
    const saveCurrentFilter = () => {
        if (searchTerm && searchMatchType) {
            setActiveFilters(prev => [...prev, { term: searchTerm, type: searchMatchType }]);
            setSearchTerm('');
            setSearchMatchType(null);
        }
    };

    // Función para eliminar un filtro
    const removeFilter = (index: number) => {
        setActiveFilters(prev => prev.filter((_, i) => i !== index));
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortField, setSortField] = useState<keyof Mueble>('id_inv');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [loading, setLoading] = useState(false);
    const [savingDirector, setSavingDirector] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoadingMore] = useState(false);
    const detailRef = useRef<HTMLDivElement>(null);
    const [showUsufinalModal, setShowUsufinalModal] = useState(false);
    const [conflictUsufinal, setConflictUsufinal] = useState<string | null>(null);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [directorInputDisabled, setDirectorInputDisabled] = useState(false);
    const [generatingPDF, setGeneratingPDF] = useState(false);
    const [pdfData, setPdfData] = useState<PdfData | null>(null);
    const role = useUserRole();
    const isUsuario = role === "usuario";
    const { createNotification } = useNotifications();
    const { isDarkMode } = useTheme();

    // NUEVO: Estado para áreas y relaciones N:M
    const [areas, setAreas] = useState<{ id_area: number; nombre: string }[]>([]);
    const [directorAreasMap, setDirectorAreasMap] = useState<{ [id_directorio: number]: number[] }>({});

    // Estado para autocompletado de director (solo exacto)
    // Si hay artículos seleccionados, sugerir automáticamente el director en base al usufinal
    const initialDirectorSuggestion = selectedMuebles.length > 0 ? (selectedMuebles[0]?.usufinal || '') : '';
    const [directorSearchTerm, setDirectorSearchTerm] = useState('');
    const [showDirectorSuggestions, setShowDirectorSuggestions] = useState(false);
    const [highlightedDirectorIndex, setHighlightedDirectorIndex] = useState(-1);
    const [forceShowAllDirectors, setForceShowAllDirectors] = useState(false);
    const directorInputRef = useRef<HTMLInputElement>(null);

    const [conflictArea, setConflictArea] = useState<string | null>(null);
    const [showAreaConflictModal, setShowAreaConflictModal] = useState(false);

    // Estado para mostrar mensaje de error por datos faltantes del director
    const [showMissingDirectorDataError, setShowMissingDirectorDataError] = useState(false);

    // Estado para modal de error de select-all
    const [showSelectAllErrorModal, setShowSelectAllErrorModal] = useState(false);
    const [selectAllErrorMsg, setSelectAllErrorMsg] = useState('');

    const isFormValid =
        selectedMuebles.length > 0 &&
        formData.directorId.trim() !== '' &&
        formData.area.trim() !== '' &&
        formData.puesto.trim() !== '';

    // Filtrado maestro (omnibox) y paginación
    // Filtrado maestro (omnibox) y paginación
    const filteredMueblesOmni = useMemo(() => {
        const term = deferredSearchTerm.toLowerCase().trim();

        return allMuebles.filter(item => {
            if (activeFilters.length === 0 && !term) return true;

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
                    case 'usufinal':
                    case 'resguardante':
                        return (item.usufinal?.toLowerCase() || '').includes(filterTerm) ||
                            (item.resguardante?.toLowerCase() || '').includes(filterTerm);
                    default: return true;
                }
            });

            if (!passesActiveFilters) return false;

            // Si hay término de búsqueda actual, aplicarlo también
            if (!term) return true;

            return (
                (item.id_inv?.toLowerCase() || '').includes(term) ||
                (item.descripcion?.toLowerCase() || '').includes(term) ||
                (item.rubro?.toLowerCase() || '').includes(term) ||
                (item.estado?.toLowerCase() || '').includes(term) ||
                (item.estatus?.toLowerCase() || '').includes(term) ||
                (item.area?.toLowerCase() || '').includes(term) ||
                (item.usufinal?.toLowerCase() || '').includes(term) ||
                (item.resguardante?.toLowerCase() || '').includes(term)
            );
        });
    }, [allMuebles, activeFilters, deferredSearchTerm]);
    const totalCount = filteredMueblesOmni.length;
    const totalPages = Math.ceil(totalCount / rowsPerPage);
    const paginatedMuebles = filteredMueblesOmni.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    // 1. STATE for select-all indeterminate
    const selectAllRef = useRef<HTMLInputElement>(null);

    // 2. SELECT-ALL LOGIC
    const canSelectAllPage = () => {
        if (paginatedMuebles.length === 0) return false;
        // If nothing is selected, any group is valid
        if (selectedMuebles.length === 0) return true;
        // Get current selection constraints
        const currentUsufinal = selectedMuebles[0]?.usufinal?.trim().toUpperCase();
        const currentArea = selectedMuebles[0]?.area?.trim().toUpperCase();
        // All items on page must match
        return paginatedMuebles.every(m =>
            (!currentUsufinal || (m.usufinal?.trim().toUpperCase() === currentUsufinal)) &&
            (!currentArea || (m.area?.trim().toUpperCase() === currentArea))
        );
    };
    const areAllPageSelected = paginatedMuebles.length > 0 && paginatedMuebles.every(m => selectedMuebles.some(s => s.id === m.id));
    const isSomePageSelected = paginatedMuebles.some(m => selectedMuebles.some(s => s.id === m.id));

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = !areAllPageSelected && isSomePageSelected;
        }
    }, [areAllPageSelected, isSomePageSelected]);

    const handleSelectAllPage = () => {
        if (areAllPageSelected) {
            setSelectedMuebles(prev => prev.filter(m => !paginatedMuebles.some(p => p.id === m.id)));
        } else {
            const newSelection = [...selectedMuebles];
            let constraintUsufinal = selectedMuebles[0]?.usufinal?.trim().toUpperCase();
            let constraintArea = selectedMuebles[0]?.area?.trim().toUpperCase();
            if (!constraintUsufinal && paginatedMuebles.length > 0) {
                constraintUsufinal = paginatedMuebles[0]?.usufinal?.trim().toUpperCase();
            }
            if (!constraintArea && paginatedMuebles.length > 0) {
                constraintArea = paginatedMuebles[0]?.area?.trim().toUpperCase();
            }
            const canAddAll = paginatedMuebles.every(m =>
                (!constraintUsufinal || (m.usufinal?.trim().toUpperCase() === constraintUsufinal)) &&
                (!constraintArea || (m.area?.trim().toUpperCase() === constraintArea))
            );
            if (!canAddAll) {
                setSelectAllErrorMsg('No puedes seleccionar todos los artículos de la página porque no pertenecen al mismo responsable o área.');
                setShowSelectAllErrorModal(true);
                return;
            }
            paginatedMuebles.forEach(m => {
                if (!newSelection.some(s => s.id === m.id)) {
                    newSelection.push(m);
                }
            });
            setSelectedMuebles(newSelection);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Usar el proxy para acceder a las tablas protegidas
                const [directorioResponse, firmasResponse] = await Promise.all([
                    fetch('/api/supabase-proxy?target=/rest/v1/directorio?select=*', {
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' }
                    }),
                    fetch('/api/supabase-proxy?target=/rest/v1/firmas?select=*&order=id.asc', {
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' }
                    })
                ]);

                if (!directorioResponse.ok) {
                    const errorData = await directorioResponse.json();
                    throw new Error(`Error directorio: ${errorData.error || directorioResponse.statusText}`);
                }
                
                if (!firmasResponse.ok) {
                    const errorData = await firmasResponse.json();
                    throw new Error(`Error firmas: ${errorData.error || firmasResponse.statusText}`);
                }

                const directorioData = await directorioResponse.json();
                const firmasData = await firmasResponse.json();
                
                setDirectorio(directorioData || []);

                return firmasData;
            } catch (err) {
                setError('Error al cargar los datos');
                return null;
            }
        };
        fetchData();
    }, []);

    // Cargar áreas y relaciones N:M al montar
    useEffect(() => {
        async function fetchAreasAndRelations() {
            try {
                // Usar el proxy para acceder a las tablas protegidas
                const [areasResponse, relsResponse] = await Promise.all([
                    fetch('/api/supabase-proxy?target=/rest/v1/area?select=*&order=nombre.asc', {
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' }
                    }),
                    fetch('/api/supabase-proxy?target=/rest/v1/directorio_areas?select=*', {
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' }
                    })
                ]);

                if (areasResponse.ok) {
                    const areasData = await areasResponse.json();
                    setAreas(areasData || []);
                }

                if (relsResponse.ok) {
                    const rels = await relsResponse.json();
                    
                    if (rels) {
                        const map: { [id_directorio: number]: number[] } = {};
                        rels.forEach((rel: { id_directorio: number, id_area: number }) => {
                            if (!map[rel.id_directorio]) map[rel.id_directorio] = [];
                            map[rel.id_directorio].push(rel.id_area);
                        });
                        setDirectorAreasMap(map);
                    }
                }
            } catch (error) {
                // Error silencioso
            }
        }
        fetchAreasAndRelations();
    }, []);

    const fetchData = useCallback(async (
        sortField = 'id_inv',
        sortDir = 'asc'
    ) => {
        setLoading(true);
        try {
            const { data: resguardados } = await supabase
                .from('resguardos')
                .select('num_inventario, descripcion, rubro, condicion, area_resguardo');

            const resguardadosSet = new Set(
                (resguardados || []).map(r => `${r.num_inventario}-${r.descripcion}-${r.rubro}-${r.condicion}-${r.area_resguardo}`.toLowerCase())
            );

            // Usar datos indexados en lugar de consultar la base de datos
            let combinedData: Mueble[] = [
                ...(ineaData.map((item: Mueble) => ({ ...item, origen: 'INEA' as const }))),
                ...(iteaData.filter((item: Mueble) => item.estatus === 'ACTIVO').map((item: Mueble) => ({ ...item, origen: 'ITEA' as const }))),
                ...(noListadoData.map((item: Mueble) => ({ ...item, origen: 'TLAXCALA' as const }))),
            ];

            combinedData = combinedData.filter(item => {
                const itemKey = `${item.id_inv}-${item.descripcion}-${item.rubro}-${item.estado}-${item.area}`.toLowerCase();
                return !resguardadosSet.has(itemKey);
            });

            combinedData.sort((a, b) => {
                const aValue = String(a[sortField as keyof typeof a] ?? '').toLowerCase();
                const bValue = String(b[sortField as keyof typeof b] ?? '').toLowerCase();
                return sortDir === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            });

            setAllMuebles(combinedData);
            setError(null);
        } catch (err) {
            setError('Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    }, [ineaData, iteaData, noListadoData]);

    useEffect(() => {
        fetchData(sortField, sortDirection);
    }, [fetchData, sortField, sortDirection]);

    // Efecto para analizar coincidencia más cercana
    // Efecto para analizar coincidencia más cercana (Optimizado)
    useEffect(() => {
        if (!deferredSearchTerm || !allMuebles.length) {
            setSearchMatchType(null);
            return;
        }

        const term = deferredSearchTerm.toLowerCase().trim();
        let bestMatch = { type: null, value: '', score: 0 } as { type: typeof searchMatchType, value: string, score: number };

        const isMatch = (val: string | null | undefined) => val && val.toLowerCase().includes(term);
        const isExact = (val: string | null | undefined) => val && val.toLowerCase() === term;

        for (const item of allMuebles) {
            // Coincidencia por responsable
            if (isMatch(item.usufinal) || isMatch(item.resguardante)) {
                const exact = isExact(item.usufinal) || isExact(item.resguardante);
                const score = exact ? 6 : 5;
                if (score > bestMatch.score) bestMatch = { type: 'usufinal', value: item.usufinal || item.resguardante || '', score };
            }
            // Coincidencia por área
            else if (isMatch(item.area)) {
                const exact = isExact(item.area);
                const score = exact ? 5 : 4;
                if (score > bestMatch.score) bestMatch = { type: 'area', value: item.area!, score };
            }
            // Coincidencia por ID
            else if (isMatch(item.id_inv)) {
                const exact = isExact(item.id_inv);
                const score = exact ? 4 : 3;
                if (score > bestMatch.score) bestMatch = { type: 'id', value: item.id_inv!, score };
            }
            // Coincidencia por descripción
            else if (isMatch(item.descripcion)) {
                const exact = isExact(item.descripcion);
                const score = exact ? 3 : 2;
                if (score > bestMatch.score) bestMatch = { type: 'descripcion', value: item.descripcion!, score };
            }

            // Short-circuit si encontramos un match exacto de alta prioridad
            if (bestMatch.score >= 6) break;
        }
        setSearchMatchType(bestMatch.type);
    }, [deferredSearchTerm, allMuebles]);

    const generateFolio = useCallback(async () => {
        try {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const datePart = `${year}${month}${day}`;

            const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
            const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

            const { data, error } = await supabase
                .from('resguardos')
                .select('folio')
                .gte('f_resguardo', startOfDay)
                .lte('f_resguardo', endOfDay);

            if (error) throw error;

            const foliosUnicos = Array.from(new Set((data || []).map(r => r.folio)));
            const sequential = String(foliosUnicos.length + 1).padStart(3, '0');
            const newFolio = `RES-${datePart}-${sequential}`;

            setFormData(prev => ({ ...prev, folio: newFolio }));
            return newFolio;
        } catch (err) {
            setError('Error al generar el folio');
            return null;
        }
    }, []);

    useEffect(() => {
        if (!formData.folio) {
            generateFolio();
        }
    }, [formData.folio, generateFolio]);

    const toggleMuebleSelection = (mueble: Mueble) => {
        const isAlreadySelected = selectedMuebles.some(m => m.id === mueble.id);

        let newSelectedMuebles: Mueble[];
        if (isAlreadySelected) {
            newSelectedMuebles = selectedMuebles.filter(m => m.id !== mueble.id);
        } else {
            const currentUsufinal = selectedMuebles[0]?.usufinal?.trim().toUpperCase();
            const newUsufinal = mueble.usufinal?.trim().toUpperCase();
            const currentArea = selectedMuebles[0]?.area?.trim().toUpperCase();
            const newArea = mueble.area?.trim().toUpperCase();
            if (selectedMuebles.length > 0 && currentUsufinal && newUsufinal && currentUsufinal !== newUsufinal) {
                setConflictUsufinal(newUsufinal || '');
                setShowUsufinalModal(true);
                return;
            }
            // Validación de área
            if (selectedMuebles.length > 0 && currentArea && newArea && currentArea !== newArea) {
                setConflictArea(newArea || '');
                setShowAreaConflictModal(true);
                return;
            }
            newSelectedMuebles = [...selectedMuebles, mueble];
        }

        setSelectedMuebles(newSelectedMuebles);

        if (newSelectedMuebles.length === 0) {
            setFormData({ folio: formData.folio, directorId: '', area: '', puesto: '', resguardante: '' });
            setDirectorInputDisabled(false);
        } else if (!isAlreadySelected && newSelectedMuebles.length === 1) {
            const matchingDirector = directorio.find(dir => dir.nombre.toLowerCase() === mueble.usufinal?.toLowerCase());
            
            if (matchingDirector) {
                const areasForDirector = getAreasForDirector(matchingDirector.id_directorio.toString());
                
                if (!matchingDirector.puesto || !areasForDirector.length) {
                    setIncompleteDirector(matchingDirector);
                    setDirectorFormData({ area: matchingDirector.area || '', puesto: matchingDirector.puesto || '' });
                    setShowDirectorModal(true);
                    setShowMissingDirectorDataError(false);
                    setFormData(prev => ({ ...prev, directorId: matchingDirector.id_directorio.toString(), area: '', puesto: '' }));
                    setDirectorInputDisabled(true);
                    return;
                }
                setFormData(prev => ({
                    ...prev,
                    directorId: matchingDirector.id_directorio.toString(),
                    area: matchingDirector.area || '',
                    puesto: matchingDirector.puesto || ''
                }));
                setDirectorInputDisabled(true);
                setShowMissingDirectorDataError(false);
            } else {
                setFormData(prev => ({ ...prev, directorId: '', area: '', puesto: '' }));
                setDirectorInputDisabled(false);
                setShowMissingDirectorDataError(false);
            }
        }

        if (window.innerWidth < 768 && detailRef.current) {
            setTimeout(() => {
                detailRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    const saveDirectorInfo = async () => {
        if (!incompleteDirector) return;
        setSavingDirector(true);
        try {
            // 1. Buscar o crear el área
            const areaNombre = directorFormData.area.trim();
            let id_area: number | null = null;
            
            // Buscar área por nombre usando el proxy
            const areaSearchResponse = await fetch(
                `/api/supabase-proxy?target=/rest/v1/area?select=id_area&nombre=eq.${encodeURIComponent(areaNombre)}`,
                {
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            
            if (!areaSearchResponse.ok) throw new Error('Error buscando área');
            
            const areaData = await areaSearchResponse.json();
            
            if (!areaData || areaData.length === 0) {
                // Si no existe, crearla
                const createAreaResponse = await fetch(
                    '/api/supabase-proxy?target=/rest/v1/area',
                    {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({ nombre: areaNombre })
                    }
                );
                
                if (!createAreaResponse.ok) throw new Error('Error creando área');
                
                const newArea = await createAreaResponse.json();
                id_area = newArea[0].id_area;
            } else {
                id_area = areaData[0].id_area;
            }

            // 2. Actualizar solo el puesto
            const updateDirectorResponse = await fetch(
                `/api/supabase-proxy?target=/rest/v1/directorio?id_directorio=eq.${incompleteDirector.id_directorio}`,
                {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ puesto: directorFormData.puesto })
                }
            );
            
            if (!updateDirectorResponse.ok) throw new Error('Error actualizando director');

            // 3. Eliminar relaciones viejas
            await fetch(
                `/api/supabase-proxy?target=/rest/v1/directorio_areas?id_directorio=eq.${incompleteDirector.id_directorio}`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            // 4. Insertar nueva relación
            const createRelResponse = await fetch(
                '/api/supabase-proxy?target=/rest/v1/directorio_areas',
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ 
                        id_directorio: incompleteDirector.id_directorio, 
                        id_area 
                    })
                }
            );
            
            if (!createRelResponse.ok) throw new Error('Error creando relación');

            // 5. Actualizar estado local
            setDirectorio(prev => prev.map(d =>
                d.id_directorio === incompleteDirector.id_directorio
                    ? { ...d, puesto: directorFormData.puesto }
                    : d
            ));
            setFormData(prev => ({
                ...prev,
                directorId: incompleteDirector.id_directorio.toString(),
                area: areaNombre,
                puesto: directorFormData.puesto
            }));
            setShowDirectorModal(false);
            setSuccessMessage('Información del director actualizada correctamente');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError('Error al actualizar la información del director');
        } finally {
            setSavingDirector(false);
        }
    };

    const handleSubmit = async () => {
        console.log('🚀 [RESGUARDO] Iniciando handleSubmit');
        console.log('📋 [RESGUARDO] Validación de formulario:', { isFormValid, formData, selectedMueblesCount: selectedMuebles.length });
        
        if (!isFormValid) {
            console.error('❌ [RESGUARDO] Formulario inválido');
            setError('Complete todos los campos obligatorios');
            return;
        }

        let folioToUse = formData.folio;
        console.log('📄 [RESGUARDO] Folio inicial:', folioToUse);
        
        if (!folioToUse) {
            console.log('⚠️ [RESGUARDO] Generando nuevo folio...');
            folioToUse = await generateFolio() || '';
            console.log('📄 [RESGUARDO] Folio generado:', folioToUse);
            if (!folioToUse) {
                console.error('❌ [RESGUARDO] No se pudo generar el folio');
                return;
            }
        }

        try {
            setLoading(true);
            console.log('⏳ [RESGUARDO] Loading activado');

            // Validar que tengamos el usuario de la sesión
            if (!user || !user.id) {
                console.error('❌ [RESGUARDO] No hay usuario en sesión');
                throw new Error('No se pudo obtener el usuario actual. Por favor, inicia sesión nuevamente.');
            }
            console.log('✅ [RESGUARDO] Usuario de sesión:', { id: user.id, email: user.email, provider: user.oauthProvider });

            console.log('📝 [RESGUARDO] Consultando firmas...');
            const { data: firmasData, error: firmasError } = await supabase
                .from('firmas')
                .select('*')
                .order('id', { ascending: true });

            if (firmasError) {
                console.error('❌ [RESGUARDO] Error al consultar firmas:', firmasError);
                throw firmasError;
            }
            console.log('✅ [RESGUARDO] Firmas obtenidas:', firmasData?.length || 0);

            setShowPDFButton(true);
            console.log('📄 [RESGUARDO] Botón PDF activado');

            const directorNombre = directorio.find(d => d.id_directorio.toString() === formData.directorId)?.nombre?.toUpperCase() || '';
            console.log('👤 [RESGUARDO] Director encontrado:', directorNombre);

            const pdfDataToSet = {
                folio: folioToUse,
                fecha: new Date().toLocaleDateString(),
                director: directorNombre,
                area: formData.area.trim().toUpperCase(),
                puesto: formData.puesto.trim().toUpperCase(),
                resguardante: formData.resguardante,
                articulos: selectedMuebles.map(m => ({
                    id_inv: m.id_inv,
                    descripcion: m.descripcion,
                    rubro: m.rubro,
                    estado: m.estado,
                    origen: m.origen || null,
                    resguardante: m.resguardanteAsignado || ''
                })),
                firmas: firmasData || []
            };
            console.log('📦 [RESGUARDO] PDF Data preparado:', pdfDataToSet);
            setPdfData(pdfDataToSet);

            console.log('💾 [RESGUARDO] Iniciando guardado de artículos...');
            const resguardoPromises = selectedMuebles.map(async (mueble, index) => {
                const tableName = mueble.origen === 'ITEA' ? 'mueblesitea' : mueble.origen === 'TLAXCALA' ? 'mueblestlaxcala' : 'muebles';
                const resguardanteToUse = mueble.resguardanteAsignado || formData.resguardante;

                console.log(`📦 [RESGUARDO] Artículo ${index + 1}/${selectedMuebles.length}:`, {
                    id: mueble.id,
                    id_inv: mueble.id_inv,
                    tableName,
                    resguardante: resguardanteToUse,
                    director: directorNombre,
                    area: formData.area
                });

                // UPDATE del mueble
                console.log(`🔄 [RESGUARDO] Actualizando ${tableName} id=${mueble.id}...`);
                const { error: updateError } = await supabase
                    .from(tableName)
                    .update({
                        resguardante: resguardanteToUse,
                        usufinal: directorNombre,
                        area: formData.area
                    })
                    .eq('id', mueble.id);

                if (updateError) {
                    console.error(`❌ [RESGUARDO] Error UPDATE ${tableName}:`, updateError);
                    throw updateError;
                }
                console.log(`✅ [RESGUARDO] UPDATE exitoso en ${tableName}`);

                // INSERT en resguardos
                const resguardoData = {
                    folio: folioToUse,
                    f_resguardo: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString(),
                    area_resguardo: formData.area,
                    dir_area: directorNombre,
                    num_inventario: mueble.id_inv,
                    descripcion: mueble.descripcion,
                    rubro: mueble.rubro,
                    condicion: mueble.estado,
                    usufinal: resguardanteToUse,
                    puesto: formData.puesto,
                    origen: mueble.origen || '',
                    created_by: user.id, // ← AGREGADO: ID del usuario que crea el resguardo
                };
                console.log(`➕ [RESGUARDO] Insertando en resguardos:`, resguardoData);

                const { error: insertError } = await supabase.from('resguardos').insert(resguardoData);

                if (insertError) {
                    console.error(`❌ [RESGUARDO] Error INSERT resguardos:`, insertError);
                    throw insertError;
                }
                console.log(`✅ [RESGUARDO] INSERT exitoso en resguardos`);
            });

            console.log('⏳ [RESGUARDO] Esperando todas las promesas...');
            await Promise.all(resguardoPromises);
            console.log('✅ [RESGUARDO] Todos los artículos guardados exitosamente');

            sessionStorage.setItem('pdfDownloaded', 'false');
            console.log('💾 [RESGUARDO] SessionStorage actualizado');

            try {
                console.log('🔔 [RESGUARDO] Creando notificación...');
                const notificationDescription = `Se ha creado un nuevo resguardo para el área "${formData.area}" bajo la dirección de "${directorNombre}" con ${selectedMuebles.length} artículo(s).`;
                await createNotification({
                    title: `Nuevo resguardo creado: ${folioToUse}`,
                    description: notificationDescription,
                    type: 'success',
                    category: 'system',
                    device: navigator.userAgent,
                    importance: 'high',
                    data: {
                        changes: [
                            `Área: ${formData.area}`,
                            `Puesto: ${formData.puesto}`,
                            `Resguardante: ${formData.resguardante}`,
                            `Artículos: ${selectedMuebles.map(m => m.id_inv).join(', ')}`
                        ],
                        affectedTables: ['resguardos', 'muebles', 'mueblesitea']
                    }
                });
                console.log('✅ [RESGUARDO] Notificación creada');
            } catch (notifErr) {
                console.warn('⚠️ [RESGUARDO] Error en notificación (no crítico):', notifErr);
            }

            console.log('🧹 [RESGUARDO] Limpiando formulario...');
            setFormData(prev => ({
                ...prev,
                resguardante: ''
            }));
            setSelectedMuebles([]);
            setSuccessMessage(`Resguardo ${folioToUse} creado correctamente con ${selectedMuebles.length} artículo(s)`);
            setTimeout(() => setSuccessMessage(null), 3000);

            console.log('🔄 [RESGUARDO] Regenerando folio y recargando datos...');
            await generateFolio();
            fetchData(sortField, sortDirection);
            console.log('✅ [RESGUARDO] Proceso completado exitosamente');

        } catch (err) {
            console.error('❌ [RESGUARDO] ERROR CRÍTICO:', err);
            console.error('📊 [RESGUARDO] Detalles del error:', {
                message: err instanceof Error ? err.message : 'Error desconocido',
                stack: err instanceof Error ? err.stack : undefined,
                error: err
            });
            setError('Error al guardar el resguardo');
        } finally {
            setLoading(false);
            console.log('🏁 [RESGUARDO] handleSubmit finalizado');
        }
    };

    const handleSort = (field: keyof Mueble) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    const removeSelectedMueble = (mueble: Mueble) => {
        setSelectedMuebles(prev => prev.filter(m => m.id !== mueble.id));
    };

    const resetFolio = () => {
        generateFolio();
    };

    const inputsDisabled = selectedMuebles.length === 0;

    const handleGeneratePDF = async () => {
        setGeneratingPDF(true);
        try {
            if (pdfData) {
                await generateResguardoPDF(pdfData);
                sessionStorage.setItem('pdfDownloaded', 'true');
            }
        } catch (error) {
            setError('Error al generar el PDF');
        } finally {
            setGeneratingPDF(false);
            setShowPDFButton(false);
        }
    };

    // Función para obtener áreas válidas para un director
    const getAreasForDirector = (directorId: string) => {
        if (!directorId) return [];
        const areaIds = directorAreasMap[parseInt(directorId)] || [];
        return areas.filter(a => areaIds.includes(a.id_area));
    };

    // Autocompletar área al seleccionar director
    useEffect(() => {
        if (formData.directorId) {
            const validAreas = getAreasForDirector(formData.directorId);
            if (validAreas.length > 0) {
                setFormData(prev => ({ ...prev, area: validAreas[0].nombre }));
            } else {
                setFormData(prev => ({ ...prev, area: '' }));
            }
        } else {
            setFormData(prev => ({ ...prev, area: '' }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.directorId, areas, directorAreasMap]);

    // --- DIRECTOR SUGGESTIONS LOGIC (tipo omnibox) ---
    // Sugerido: el que más coincide por nombre y área
    const clean = (str: string) => (str || '').normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
    const directorSugerido = (() => {
        // Si el usuario no ha escrito nada, sugerir en base al usufinal de los artículos seleccionados
        const term = directorSearchTerm || initialDirectorSuggestion;
        if (!term) return null;
        const targetNombre = clean(term);
        // 1. Coincidencia exacta nombre
        let match = directorio.find(opt => clean(opt.nombre) === targetNombre);
        // 2. Coincidencia parcial por nombre (más flexible)
        if (!match) {
            // Split nombre en palabras y buscar coincidencias parciales
            const nombreParts = targetNombre.split(/\s+/);
            // Encontrar el que más palabras coincide
            const matches = directorio
                .map(opt => {
                    const optNombre = clean(opt.nombre);
                    const matchCount = nombreParts.filter(part =>
                        optNombre.includes(part) || (part.length > 3 && optNombre.includes(part.slice(0, -1)))
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
    })();

    const filteredDirectorOptions = (() => {
        let options = directorio;
        const filterTerm = forceShowAllDirectors ? '' : (directorSearchTerm || initialDirectorSuggestion);
        if (filterTerm) {
            options = options.filter(opt => clean(opt.nombre).includes(clean(filterTerm)));
        }
        // Sugerido primero
        if (!forceShowAllDirectors && directorSugerido) {
            options = [directorSugerido, ...options.filter(opt => opt.id_directorio !== directorSugerido.id_directorio)];
        }
        return options;
    })();

    const handleDirectorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDirectorSearchTerm(e.target.value);
        setShowDirectorSuggestions(true);
        setHighlightedDirectorIndex(-1);
        setForceShowAllDirectors(false);
    };

    const handleDirectorSuggestionClick = (opt: Directorio) => {
        const areasForDirector = getAreasForDirector(opt.id_directorio.toString());
        if (!opt.puesto || !areasForDirector.length) {
            setIncompleteDirector(opt);
            setDirectorFormData({ area: opt.area || '', puesto: opt.puesto || '' });
            setShowDirectorModal(true);
            setShowMissingDirectorDataError(false);
            setFormData(prev => ({ ...prev, directorId: opt.id_directorio.toString(), area: '', puesto: '' }));
            setDirectorInputDisabled(true);
            setShowDirectorSuggestions(false);
            return;
        }
        setFormData(prev => ({
            ...prev,
            directorId: opt.id_directorio.toString(),
            area: areasForDirector[0]?.nombre || '',
            puesto: opt.puesto || ''
        }));
        setDirectorInputDisabled(true);
        setShowMissingDirectorDataError(false);
        setDirectorSearchTerm(opt.nombre);
        setShowDirectorSuggestions(false);
    };

    const handleDirectorInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showDirectorSuggestions || filteredDirectorOptions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedDirectorIndex(i => (i + 1) % filteredDirectorOptions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedDirectorIndex(i => (i - 1 + filteredDirectorOptions.length) % filteredDirectorOptions.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedDirectorIndex >= 0 && filteredDirectorOptions[highlightedDirectorIndex]) {
                handleDirectorSuggestionClick(filteredDirectorOptions[highlightedDirectorIndex]);
            }
        } else if (e.key === 'Escape') {
            setShowDirectorSuggestions(false);
        }
    };
    const handleDirectorInputBlur = () => {
        setTimeout(() => setShowDirectorSuggestions(false), 100);
    };

    function DirectorSuggestionDropdown() {
        if (!showDirectorSuggestions || filteredDirectorOptions.length === 0) return null;
        return (
            <ul
                role="listbox"
                aria-label="Lista de directores sugeridos"
                className={`absolute left-0 top-full w-full mt-1 animate-fadeInUp max-h-80 overflow-y-auto rounded-lg shadow-2xl border backdrop-blur-xl ring-1 ring-inset transition-all duration-200 z-50 ${isDarkMode
                    ? 'border-gray-800 bg-black/95 ring-gray-900/60'
                    : 'border-gray-300 bg-white/95 ring-gray-200/60'
                    }`}
            >
                {filteredDirectorOptions.map((opt, i) => {
                    const isSelected = highlightedDirectorIndex === i;
                    const isSugerido = !forceShowAllDirectors && directorSugerido && opt.id_directorio === directorSugerido.id_directorio;
                    return (
                        <li
                            key={opt.id_directorio}
                            role="option"
                            aria-selected={isSelected}
                            onMouseDown={() => handleDirectorSuggestionClick(opt)}
                            onMouseEnter={() => setHighlightedDirectorIndex(i)}
                            className={`flex flex-col px-3 py-2 cursor-pointer select-none text-xs whitespace-normal break-words w-full border-b last:border-b-0 transition-colors ${isDarkMode
                                ? `border-gray-800 ${isSelected ? 'bg-gray-800/80 text-white' : 'text-gray-300'} hover:bg-gray-800/80`
                                : `border-gray-200 ${isSelected ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`
                                } ${isSugerido ? (isDarkMode ? 'font-bold text-white' : 'font-bold text-gray-900') : ''
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <span className="font-semibold">{opt.nombre}</span>
                                {isSugerido && <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-700/60 text-xs text-white">Sugerido</span>}
                            </span>
                            <span className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>{opt.puesto || <span className="italic text-yellow-400">Sin puesto</span>}</span>
                        </li>
                    );
                })}
            </ul>
        );
    }

    const handleCloseDirectorModal = () => {
        if (!directorFormData.area.trim() || !directorFormData.puesto.trim()) {
            setShowMissingDirectorDataError(true);
        }
        setShowDirectorModal(false);
    };

    // OMNIBOX SUGERENCIAS
    const [suggestions, setSuggestions] = useState<{ value: string; type: ActiveFilter['type'] }[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Generar sugerencias al escribir
    // Generar sugerencias al escribir (Optimizado con vectores)
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
            { type: 'usufinal' as ActiveFilter['type'], label: 'Usuario Final', data: searchableData.usufinal },
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
    function getTypeLabel(type: ActiveFilter['type']) {
        switch (type) {
            case 'id': return 'ID';
            case 'area': return 'ÁREA';
            case 'usufinal': return 'USUARIO FINAL';
            case 'resguardante': return 'RESGUARDANTE';
            case 'descripcion': return 'DESCRIPCIÓN';
            case 'rubro': return 'RUBRO';
            case 'estado': return 'ESTADO';
            case 'estatus': return 'ESTATUS';
            default: return '';
        }
    }
    function handleSuggestionClick(index: number) {
        const s = suggestions[index];
        if (!s) return;
        setActiveFilters(prev => [...prev, { term: s.value, type: s.type }]);
        setSearchTerm('');
        setSearchMatchType(null);
        setShowSuggestions(false);
        inputRef.current?.focus();
    }
    function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
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
                handleSuggestionClick(highlightedIndex);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    }
    function handleInputBlur() {
        setTimeout(() => setShowSuggestions(false), 100); // Permite click en sugerencia
    }
    function SuggestionDropdown() {
        if (!showSuggestions || suggestions.length === 0) return null;
        return (
            <ul
                id="omnibox-suggestions"
                role="listbox"
                title="Sugerencias de búsqueda"
                className={`absolute left-0 top-full w-full mt-1 animate-fadeInUp max-h-80 overflow-y-auto rounded-lg shadow-sm border backdrop-blur-xl transition-all duration-200 z-50 ${isDarkMode
                    ? 'border-white/10 bg-black/90'
                    : 'border-gray-200 bg-white/95'
                    }`}
            >
                {suggestions.map((s, i) => {
                    const isSelected = highlightedIndex === i;
                    return (
                        <li
                            key={s.value + s.type}
                            role="option"
                            {...(isSelected && { 'aria-selected': 'true' })}
                            onMouseDown={() => handleSuggestionClick(i)}
                            onMouseEnter={() => setHighlightedIndex(i)}
                            className={`flex items-center gap-1.5 px-2 py-1 cursor-pointer select-none text-xs whitespace-normal break-words w-full transition-colors ${isSelected
                                ? (isDarkMode ? 'bg-white/5 text-white' : 'bg-blue-50 text-blue-900')
                                : (isDarkMode ? 'text-white/80 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50')
                                }`}
                        >
                            <span className={`shrink-0 ${isDarkMode ? 'text-white/70' : 'text-gray-600'
                                }`}>{getTypeIcon(s.type)}</span>
                            <span className="font-normal whitespace-normal break-words w-full truncate">{s.value}</span>
                            <span className={`ml-auto text-[10px] font-mono ${isDarkMode ? 'text-white/60' : 'text-gray-500'
                                }`}>{getTypeLabel(s.type)}</span>
                        </li>
                    );
                })}
            </ul>
        );
    }

    // Skeleton para la tabla de muebles
    const TableSkeleton = () => (
        <tr>
            <td colSpan={6} className={`px-6 py-24 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                <div className="flex flex-col items-center justify-center space-y-4 animate-pulse">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex gap-4 w-full max-w-3xl mx-auto">
                            <div className={`h-6 w-10 rounded ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'
                                }`} />
                            <div className={`h-6 w-32 rounded ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'
                                }`} />
                            <div className={`h-6 w-40 rounded ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'
                                }`} />
                            <div className={`h-6 w-28 rounded ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'
                                }`} />
                            <div className={`h-6 w-28 rounded ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'
                                }`} />
                            <div className={`h-6 w-16 rounded ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'
                                }`} />
                        </div>
                    ))}
                </div>
            </td>
        </tr>
    );

    // Sugerencia de área para el director seleccionado
    let areaSuggestion = '';
    if (formData.directorId) {
        const directorAreas = getAreasForDirector(formData.directorId);
        if (selectedMuebles.length > 0 && selectedMuebles[0].area) {
            const clean = (str: string) => (str || '').normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
            const selectedArea = clean(selectedMuebles[0].area);
            const match = directorAreas.find((a: { nombre: string }) => clean(a.nombre) === selectedArea);
            areaSuggestion = match ? match.nombre : (directorAreas[0]?.nombre || '');
        } else {
            areaSuggestion = directorAreas[0]?.nombre || '';
        }
    }

    // Detectar si hay conflicto entre el área del director y el área de los bienes
    const hasAreaMismatch = useMemo(() => {
        if (!formData.area || selectedMuebles.length === 0) return false;
        const directorArea = formData.area.trim().toUpperCase();
        return selectedMuebles.some(m => {
            const muebleArea = (m.area || '').trim().toUpperCase();
            return muebleArea && muebleArea !== directorArea;
        });
    }, [formData.area, selectedMuebles]);

    return (
        <div className={`min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 transition-colors duration-500 ${isDarkMode
            ? 'bg-black text-white'
            : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
            }`}>
            {/* Success message toast */}
            {successMessage && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg border backdrop-blur-sm animate-fade-in ${isDarkMode
                    ? 'bg-green-900/80 text-green-100 border-green-700'
                    : 'bg-green-50 text-green-800 border-green-200'
                    }`}>
                    <CheckCircle className={`h-5 w-5 animate-pulse ${isDarkMode ? 'text-green-400' : 'text-green-600'
                        }`} />
                    <span className="animate-bounce">{successMessage}</span>
                </div>
            )}

            <div className={`w-full mx-auto rounded-lg sm:rounded-xl shadow-2xl overflow-hidden transition-all duration-500 transform border ${isDarkMode
                ? 'bg-black border-gray-800 hover:border-gray-700'
                : 'bg-white border-gray-200'
                }`}>
                {/* Header */}
                <div className={`p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b gap-2 sm:gap-0 ${isDarkMode
                    ? 'bg-black border-gray-800'
                    : 'bg-gray-50/50 border-gray-200'
                    }`}>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
                        <span className={`mr-2 sm:mr-3 p-1 sm:p-2 rounded-lg border text-sm sm:text-base shadow-lg ${isDarkMode
                            ? 'bg-gray-800 text-white border-white'
                            : 'bg-gray-900 text-white border-gray-900'
                            }`}>RES</span>
                        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                            Creación de Resguardos
                        </span>
                    </h1>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <SectionRealtimeToggle 
                            sectionName="Inventarios" 
                            isConnected={ineaConnected || iteaConnected || noListadoConnected} 
                        />
                        <p className={`text-sm sm:text-base flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            <ListChecks className={`h-4 w-4 animate-pulse ${isDarkMode ? 'text-white' : 'text-gray-900'
                                }`} />
                            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>{selectedMuebles.length}</span> artículos seleccionados
                        </p>
                        <p className={`text-sm sm:text-base flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            <Info className={`h-4 w-4 animate-pulse ${isDarkMode ? 'text-white' : 'text-gray-900'
                                }`} />
                            Seleccione artículos para el resguardo
                        </p>
                    </div>
                </div>

                {/* Main container */}
                <div className="grid grid-cols-1 lg:grid-cols-5 h-full flex-1">
                    {/* Left panel - Muebles table */}
                    <div className="flex-1 min-w-0 flex flex-col p-4 lg:col-span-3">
                        {/* Folio and director information */}
                        <div className={`mb-6 p-4 rounded-xl border shadow-inner hover:shadow-lg transition-shadow ${isDarkMode
                            ? 'bg-gray-900/30 border-gray-800'
                            : 'bg-gray-50/50 border-gray-200'
                            }`}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className={`p-3 rounded-lg border flex flex-col transition-colors ${isDarkMode
                                    ? 'bg-black border-gray-800 hover:border-white'
                                    : 'bg-white border-gray-200 hover:border-blue-400'
                                    }`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-xs uppercase font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                            }`}>Folio</span>
                                        <button
                                            onClick={resetFolio}
                                            className={`text-xs flex items-center gap-1 px-2 py-1 rounded border transition-all ${isDarkMode
                                                ? 'bg-gray-900/20 hover:bg-gray-900/30 text-white hover:text-gray-300 border-white/50'
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border-gray-300'
                                                }`}
                                        >
                                            <RefreshCw className="h-3 w-3" />
                                            Nuevo
                                        </button>
                                    </div>
                                    <div className="flex items-center">
                                        <FileDigit className={`h-4 w-4 mr-2 animate-pulse ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`} />
                                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>{formData.folio || 'Generando...'}</span>
                                    </div>
                                </div>

                                <div className={`p-3 rounded-lg border flex flex-col transition-colors ${isDarkMode
                                    ? 'bg-black border-gray-800 hover:border-white'
                                    : 'bg-white border-gray-200 hover:border-blue-400'
                                    }`}>
                                    <span className={`text-xs uppercase font-medium mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                        }`}>Director de Área</span>
                                    <div className="flex items-center">
                                        <Building2 className={`h-4 w-4 mr-2 animate-pulse ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`} />
                                        <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>
                                            {formData.directorId ?
                                                directorio.find(d => d.id_directorio.toString() === formData.directorId)?.nombre || 'Seleccionar' :
                                                'Seleccionar'}
                                        </span>
                                    </div>
                                </div>

                                <div className={`p-3 rounded-lg border flex flex-col transition-colors ${isDarkMode
                                    ? 'bg-black border-gray-800 hover:border-white'
                                    : 'bg-white border-gray-200 hover:border-blue-400'
                                    }`}>
                                    <span className={`text-xs uppercase font-medium mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                        }`}>Fecha</span>
                                    <div className="flex items-center">
                                        <Calendar className={`h-4 w-4 mr-2 animate-pulse ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`} />
                                        <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>{new Date().toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search and filters */}
                        <div className={`mb-6 p-4 rounded-xl border shadow-inner hover:shadow-lg transition-shadow ${isDarkMode
                            ? 'bg-gray-900/30 border-gray-800'
                            : 'bg-gray-50/50 border-gray-200'
                            }`}>
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
                                <div className="relative flex-1">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={searchTerm}
                                                onChange={e => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
                                                onKeyDown={handleInputKeyDown}
                                                onBlur={handleInputBlur}
                                                placeholder="Buscar por cualquier campo..."
                                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${isDarkMode
                                                    ? 'bg-black/50 border-gray-800 text-white placeholder-gray-500 focus:ring-white hover:border-white/50'
                                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 hover:border-blue-400'
                                                    }`}
                                                aria-autocomplete="list"
                                                aria-controls="omnibox-suggestions"
                                                {...(highlightedIndex >= 0 && { 'aria-activedescendant': `omnibox-suggestion-${highlightedIndex}` })}
                                                autoComplete="off"
                                            />
                                            <SuggestionDropdown />
                                        </div>
                                        <button
                                            onClick={saveCurrentFilter}
                                            disabled={!searchTerm || !searchMatchType}
                                            className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all duration-200 hover:scale-105 ${searchTerm && searchMatchType
                                                ? (isDarkMode
                                                    ? 'bg-gray-600 hover:bg-gray-700 border-white text-white'
                                                    : 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white'
                                                )
                                                : (isDarkMode
                                                    ? 'bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed'
                                                    : 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
                                                )
                                                }`}
                                            title="Agregar filtro actual a la lista de filtros activos"
                                        >
                                            <Plus className="h-4 w-4" />
                                            <span>Agregar Filtro</span>
                                        </button>
                                    </div>                                    {/* Filtros activos */}
                                    {activeFilters.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2 w-full">
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
                                            {activeFilters.length > 1 && (
                                                <button
                                                    onClick={() => setActiveFilters([])}
                                                    className={`px-2 py-0.5 rounded-full border text-xs bg-transparent transition-colors ${isDarkMode
                                                        ? 'border-gray-700 text-gray-400 hover:text-white hover:border-white'
                                                        : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
                                                        }`}
                                                    title="Limpiar todos los filtros"
                                                >
                                                    Limpiar
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                <RefreshCw
                                    className={`h-4 w-4 cursor-pointer transition-colors ${loading ? 'animate-spin' : ''} ${isDarkMode
                                        ? 'text-white hover:text-gray-300'
                                        : 'text-gray-900 hover:text-gray-700'
                                        }`}
                                    onClick={() => fetchData(sortField, sortDirection)}
                                />
                                <span>Total: <span className={isDarkMode ? 'text-white' : 'text-gray-900'
                                }>{totalCount}</span> registros</span>
                            </div>
                        </div>

                        {/* Table */}
                        <div className={`rounded-xl border overflow-hidden mb-6 flex flex-col flex-grow max-h-[60vh] shadow-lg hover:shadow-xl transition-all duration-300 transform ${isDarkMode
                            ? 'bg-gray-900/30 border-gray-800 hover:border-gray-700'
                            : 'bg-white border-gray-200'
                            }`}>
                            <div className={`flex-grow min-w-[800px] overflow-x-auto overflow-y-auto scrollbar-thin ${isDarkMode
                                ? 'scrollbar-track-gray-900 scrollbar-thumb-gray-800 hover:scrollbar-thumb-gray-700'
                                : 'scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400'
                                }`}>
                                <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-800/50' : 'divide-gray-200'
                                    }`}>
                                    <thead className={`backdrop-blur-sm sticky top-0 z-10 ${isDarkMode ? 'bg-black/90' : 'bg-gray-50/90'
                                        }`}>
                                        <tr className={`divide-x ${isDarkMode ? 'divide-gray-800/30' : 'divide-gray-200/30'
                                            }`}>
                                            <th className="px-2 py-3 w-10">
                                                <div className="flex justify-center">
                                                    {/* Select All Checkbox - Custom visual, fondo negro, checkmark azul, sin estilo nativo */}
                                                    <div className="relative group flex items-center justify-center">
                                                        <input
                                                            ref={selectAllRef}
                                                            type="checkbox"
                                                            checked={areAllPageSelected}
                                                            onChange={handleSelectAllPage}
                                                            disabled={paginatedMuebles.length === 0 || !canSelectAllPage()}
                                                            className={`appearance-none h-6 w-6 rounded-md border-2 transition-all duration-200 focus:ring-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md ${isDarkMode
                                                                ? 'border-white bg-black focus:ring-white focus:border-white hover:border-white hover:shadow-white/30'
                                                                : 'border-gray-400 bg-white focus:ring-blue-500 focus:border-blue-500 hover:border-blue-500 hover:shadow-blue-500/30'
                                                                }`}
                                                            aria-label="Seleccionar todos los artículos de la página"
                                                        />
                                                        {/* Custom checkmark icon overlay, solo visible si checked */}
                                                        {areAllPageSelected && (
                                                            <span className="pointer-events-none absolute left-0 top-0 h-6 w-6 flex items-center justify-center">
                                                                <CheckCircle className={`h-5 w-5 drop-shadow-lg animate-pulse ${isDarkMode ? 'text-white' : 'text-blue-600'
                                                                    }`} />
                                                            </span>
                                                        )}
                                                        {/* Tooltip visual mejorado */}
                                                        <span
                                                            className={`absolute left-0 top-8 z-40 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xl border opacity-0 group-hover:opacity-100 group-hover:translate-y-1 transition-all pointer-events-none whitespace-nowrap w-auto min-w-[180px] ${isDarkMode
                                                                ? 'bg-black text-white border-white'
                                                                : 'bg-white text-gray-900 border-gray-300'
                                                                }`}
                                                        >
                                                            Seleccionar todos los aríticulos de la página
                                                        </span>
                                                    </div>
                                                </div>
                                            </th>
                                            {[
                                                { field: 'id_inv', label: 'ID Inventario' },
                                                { field: 'descripcion', label: 'Descripción' },
                                                { field: 'area', label: 'Área' },
                                                { field: 'usufinal', label: 'Responsable' },
                                                { field: 'estado', label: 'Estado' },
                                            ].map(({ field, label }) => (
                                                <th
                                                    key={field}
                                                    onClick={() => handleSort(field as keyof Mueble)}
                                                    className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-all duration-200 group relative ${isDarkMode
                                                        ? 'text-gray-400 hover:bg-gray-900/50'
                                                        : 'text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {label}
                                                        <ArrowUpDown className={`h-3.5 w-3.5 transition-all duration-200 transform ${sortField === field
                                                            ? (isDarkMode ? 'text-white scale-110 animate-pulse' : 'text-gray-900 scale-110 animate-pulse')
                                                            : (isDarkMode ? 'text-gray-600 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-gray-600')
                                                            }`}
                                                        />
                                                    </div>
                                                    {sortField === field && (
                                                        <div className={`absolute bottom-0 left-0 right-0 h-0.5 animate-pulse ${isDarkMode ? 'bg-white/50' : 'bg-gray-900/50'
                                                            }`} />
                                                    )}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className={`bg-transparent divide-y ${isDarkMode ? 'divide-gray-800/30' : 'divide-gray-200/30'
                                        }`}>
                                        {loading && !isLoadingMore ? (
                                            <TableSkeleton />
                                        ) : error ? (
                                            <tr className="h-96">
                                                <td colSpan={6} className="px-6 py-24 text-center">
                                                    <div className="flex flex-col items-center justify-center space-y-4 animate-fadeIn">
                                                        <div className="relative">
                                                            <AlertCircle className="h-16 w-16 text-red-500" />
                                                            <div className="absolute inset-0 w-16 h-16 border-4 border-red-500/20 rounded-full animate-ping" />
                                                        </div>
                                                        <p className="text-lg font-medium text-red-400">Error al cargar datos</p>
                                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                            }`}>{error}</p>
                                                        <button
                                                            onClick={() => fetchData(sortField, sortDirection)}
                                                            className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 border hover:scale-105 transform ${isDarkMode
                                                                ? 'bg-black text-white hover:bg-gray-900 border-gray-800 hover:border-white'
                                                                : 'bg-white text-gray-900 hover:bg-gray-50 border-gray-300 hover:border-blue-400'
                                                                }`}
                                                        >
                                                            Intentar nuevamente
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : paginatedMuebles.length === 0 ? (
                                            <tr className="h-96">
                                                <td colSpan={6} className={`px-6 py-24 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>
                                                    <div className="flex flex-col items-center justify-center space-y-4 animate-fadeIn">
                                                        <div className="relative">
                                                            <Search className={`h-16 w-16 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                                                }`} />
                                                            <div className={`absolute inset-0 w-16 h-16 border-4 rounded-full animate-ping opacity-20 ${isDarkMode ? 'border-gray-800' : 'border-gray-300'
                                                                }`} />
                                                        </div>
                                                        <p className="text-lg font-medium">No se encontraron resultados</p>
                                                        {searchTerm && (
                                                            <button
                                                                onClick={() => setSearchTerm('')}
                                                                className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 flex items-center gap-2 border hover:scale-105 transform group ${isDarkMode
                                                                    ? 'bg-black text-white hover:bg-gray-900 border-gray-800 hover:border-white'
                                                                    : 'bg-white text-gray-900 hover:bg-gray-50 border-gray-300 hover:border-blue-400'
                                                                    }`}
                                                            >
                                                                <X className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                                                                Limpiar búsqueda
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedMuebles.map((mueble, index) => {
                                                const isSelected = selectedMuebles.some(m => m.id === mueble.id);
                                                return (
                                                    <tr
                                                        key={`${mueble.id}`}
                                                        className={`group transition-all duration-200 animate-fadeIn border-l-2 ${isSelected
                                                            ? (isDarkMode
                                                                ? 'bg-gray-900/10 hover:bg-gray-900/20 border-white'
                                                                : 'bg-blue-50 hover:bg-blue-100 border-blue-500'
                                                            )
                                                            : (isDarkMode
                                                                ? 'hover:bg-gray-900/40 border-transparent hover:border-gray-700'
                                                                : 'hover:bg-gray-50 border-transparent hover:border-gray-300'
                                                            )
                                                            }`}
                                                        onClick={() => toggleMuebleSelection(mueble)}
                                                        style={{ animationDelay: `${index * 50}ms` }}
                                                    >
                                                        <td className="px-2 py-4">
                                                            <div className="flex justify-center">
                                                                <div className={`h-5 w-5 rounded-md border transform transition-all duration-300 flex items-center justify-center ${isSelected
                                                                    ? (isDarkMode
                                                                        ? 'bg-white border-gray-300 scale-110'
                                                                        : 'bg-blue-600 border-blue-600 scale-110'
                                                                    )
                                                                    : (isDarkMode
                                                                        ? 'border-gray-700 group-hover:border-white'
                                                                        : 'border-gray-300 group-hover:border-blue-500'
                                                                    )
                                                                    }`}
                                                                >
                                                                    {isSelected && (
                                                                        <CheckCircle className={`h-4 w-4 animate-scale-check ${isDarkMode ? 'text-black' : 'text-white'
                                                                            }`} />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex flex-col space-y-1">
                                                                <div className={`text-sm font-medium transition-colors ${isDarkMode
                                                                    ? 'text-white group-hover:text-gray-300'
                                                                    : 'text-gray-900 group-hover:text-gray-700'
                                                                    }`}>
                                                                    {mueble.id_inv}
                                                                </div>
                                                                <div className={`text-xs transition-colors ${isDarkMode
                                                                    ? 'text-gray-500 group-hover:text-gray-400'
                                                                    : 'text-gray-600 group-hover:text-gray-500'
                                                                    }`}>
                                                                    {mueble.rubro}
                                                                </div>
                                                                <div className={`text-[10px] font-mono px-2 py-0.5 rounded-full border inline-block w-fit transition-all duration-300
                                                                    ${mueble.origen === 'INEA' ?
                                                                        (isDarkMode ? 'bg-gray-900/30 text-white border-white group-hover:bg-gray-900/40' : 'bg-blue-100 text-blue-800 border-blue-400 group-hover:bg-blue-200') :
                                                                        mueble.origen === 'ITEA' ?
                                                                            (isDarkMode ? 'bg-pink-900/30 text-pink-200 border-pink-700 group-hover:bg-pink-900/40' : 'bg-pink-100 text-pink-800 border-pink-400 group-hover:bg-pink-200') :
                                                                            mueble.origen === 'TLAXCALA' ?
                                                                                (isDarkMode ? 'bg-purple-900/30 text-purple-200 border-purple-700 group-hover:bg-purple-900/40' : 'bg-purple-100 text-purple-800 border-purple-400 group-hover:bg-purple-200') :
                                                                                (isDarkMode ? 'bg-gray-900/40 text-gray-400 border-gray-800 group-hover:bg-gray-900/60' : 'bg-gray-100 text-gray-600 border-gray-400 group-hover:bg-gray-200')}`}
                                                                >
                                                                    {mueble.origen}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className={`text-sm transition-colors line-clamp-2 ${isDarkMode
                                                                ? 'text-white group-hover:text-gray-300'
                                                                : 'text-gray-900 group-hover:text-gray-700'
                                                                }`}>
                                                                {mueble.descripcion}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all duration-300 
                                                                ${getColorClass(mueble.area, isDarkMode)} transform group-hover:scale-105`}>
                                                                {mueble.area || 'No especificada'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border gap-1 
                                                                ${getColorClass(mueble.usufinal, isDarkMode)} transform group-hover:scale-105 transition-all duration-300`}>
                                                                <User className={`h-3.5 w-3.5 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} />
                                                                {mueble.usufinal || 'No asignado'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transform group-hover:scale-105 transition-all duration-300
                                                                ${mueble.estado === 'B' ?
                                                                    (isDarkMode ? 'bg-green-900/20 text-green-300 border-green-900 group-hover:bg-green-900/30' : 'bg-green-100 text-green-800 border-green-400 group-hover:bg-green-200') :
                                                                    mueble.estado === 'R' ?
                                                                        (isDarkMode ? 'bg-yellow-900/20 text-yellow-300 border-yellow-900 group-hover:bg-yellow-900/30' : 'bg-yellow-100 text-yellow-800 border-yellow-400 group-hover:bg-yellow-200') :
                                                                        mueble.estado === 'M' ?
                                                                            (isDarkMode ? 'bg-red-900/20 text-red-300 border-red-900 group-hover:bg-red-900/30' : 'bg-red-100 text-red-800 border-red-400 group-hover:bg-red-200') :
                                                                            mueble.estado === 'N' ?
                                                                                (isDarkMode ? 'bg-gray-900/20 text-white border-gray-900 group-hover:bg-gray-900/30' : 'bg-gray-100 text-gray-800 border-gray-400 group-hover:bg-gray-200') :
                                                                                (isDarkMode ? 'bg-gray-900/20 text-gray-300 border-gray-900 group-hover:bg-gray-900/30' : 'bg-gray-100 text-gray-600 border-gray-400 group-hover:bg-gray-200')}`}
                                                            >
                                                                {mueble.estado}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                        {isLoadingMore && (
                                            <tr>
                                                <td colSpan={6} className={`px-6 py-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>
                                                    <div className="flex justify-center items-center space-x-2">
                                                        <RefreshCw className={`h-5 w-5 animate-spin ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                            }`} />
                                                        <span>Cargando más resultados...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {paginatedMuebles.length > 0 && (
                            <div className={`flex items-center justify-between p-4 rounded-xl border shadow-inner mb-4 hover:shadow-lg transition-shadow ${isDarkMode
                                ? 'bg-gray-900/30 border-gray-800'
                                : 'bg-gray-50/50 border-gray-200'
                                }`}>
                                <div className="flex items-center space-x-4">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        Página <span className={isDarkMode ? 'text-white' : 'text-gray-900'
                                        }>{currentPage}</span> de <span className={isDarkMode ? 'text-white' : 'text-gray-900'
                                        }>{totalPages}</span>
                                    </span>
                                    <select
                                        title='Artículos por página'
                                        value={rowsPerPage}
                                        onChange={(e) => {
                                            setRowsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className={`border rounded-lg text-sm py-1.5 px-3 focus:outline-none focus:ring-2 transition-colors ${isDarkMode
                                            ? 'bg-black border-gray-800 text-white focus:ring-white hover:border-white'
                                            : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 hover:border-blue-400'
                                            }`}
                                    >
                                        <option value={10}>10 por página</option>
                                        <option value={25}>25 por página</option>
                                        <option value={50}>50 por página</option>
                                        <option value={100}>100 por página</option>
                                    </select>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        title='Anterior'
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className={`p-2 rounded-lg transition-colors ${currentPage === 1
                                            ? (isDarkMode
                                                ? 'text-gray-600 bg-black cursor-not-allowed'
                                                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                            )
                                            : (isDarkMode
                                                ? 'text-white bg-black hover:bg-gray-900 border border-gray-800 hover:border-white'
                                                : 'text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 hover:border-blue-400'
                                            )
                                            }`}
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button
                                        title='Siguiente'
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage >= totalPages}
                                        className={`p-2 rounded-lg transition-colors ${currentPage >= totalPages
                                            ? (isDarkMode
                                                ? 'text-gray-600 bg-black cursor-not-allowed'
                                                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                            )
                                            : (isDarkMode
                                                ? 'text-white bg-black hover:bg-gray-900 border border-gray-800 hover:border-white'
                                                : 'text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 hover:border-blue-400'
                                            )
                                            }`}
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right panel - Details */}
                    <div ref={detailRef} className={`flex-1 p-4 border-t lg:border-t-0 lg:border-l flex flex-col lg:col-span-2 ${isDarkMode
                        ? 'bg-black border-gray-800'
                        : 'bg-gray-50/30 border-gray-200'
                        }`}>
                        <div className={`rounded-xl border p-4 mb-4 shadow-inner hover:shadow-lg transition-shadow ${isDarkMode
                            ? 'bg-gray-900/30 border-gray-800'
                            : 'bg-white border-gray-200'
                            }`}>
                            <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'
                                }`}>
                                <ActivitySquare className={`h-5 w-5 animate-pulse ${isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`} />
                                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                                    Información del Resguardo
                                </span>
                            </h2>

                            {/* Director selection */}
                            <div className="mb-4">
                                <label className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>Director de Área</label>
                                <div className="relative">
                                    <input
                                        ref={directorInputRef}
                                        type="text"
                                        value={
                                            formData.directorId
                                                ? directorio.find(d => d.id_directorio.toString() === formData.directorId)?.nombre || directorSearchTerm
                                                : directorSearchTerm
                                        }
                                        onChange={handleDirectorInputChange}
                                        onFocus={() => { setShowDirectorSuggestions(true); setForceShowAllDirectors(false); }}
                                        onKeyDown={handleDirectorInputKeyDown}
                                        onBlur={handleDirectorInputBlur}
                                        placeholder={initialDirectorSuggestion ? `Buscar director...` : 'Buscar director por nombre...'}
                                        className={`w-full border rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 transition-colors ${isDarkMode
                                            ? 'bg-black border-gray-800 text-white placeholder-gray-500 focus:ring-blue-500 hover:border-blue-500'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 hover:border-blue-400'
                                            }`}
                                        disabled={inputsDisabled || directorInputDisabled}
                                        autoComplete="off"
                                    />
                                    <DirectorSuggestionDropdown />
                                </div>
                                {/* Chip de sugerencia debajo del input */}
                                {(!directorSearchTerm && !formData.directorId && directorSugerido && initialDirectorSuggestion) && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onMouseDown={e => { e.preventDefault(); handleDirectorSuggestionClick(directorSugerido); }}
                                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow transition-all ${isDarkMode
                                                ? 'bg-blue-900/30 text-blue-200 border-blue-700 hover:bg-blue-900/50 hover:text-white'
                                                : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 hover:text-blue-800'
                                                }`}
                                            title={`Usar sugerencia: ${directorSugerido.nombre}`}
                                        >
                                            <span className="font-bold">Sugerido:</span> {directorSugerido.nombre}
                                        </button>
                                    </div>
                                )}
                                {/* Botón Ver todo el directorio solo si hay sugerencia de director y el campo está vacío */}
                                {(!directorSearchTerm && !formData.directorId && directorSugerido && initialDirectorSuggestion) && (
                                    <div className="mt-2">
                                        <button
                                            type="button"
                                            className={`px-4 py-1.5 rounded-lg border text-xs font-semibold shadow transition-all ${isDarkMode
                                                ? 'bg-gray-900 text-gray-200 border-gray-700 hover:bg-gray-900/30 hover:text-white'
                                                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:text-gray-900'
                                                }`}
                                            onMouseDown={e => { e.preventDefault(); setShowDirectorSuggestions(true); setForceShowAllDirectors(true); setHighlightedDirectorIndex(-1); }}
                                        >
                                            Ver todo el directorio
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="mb-4 flex gap-4">
                                <div className="flex-1">
                                    <label className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>Puesto</label>
                                    <input
                                        type="text"
                                        value={formData.puesto}
                                        onChange={e => setFormData(prev => ({ ...prev, puesto: e.target.value }))}
                                        placeholder="Puesto del director"
                                        className={`w-full border rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 transition-colors ${isDarkMode
                                            ? 'bg-black border-gray-800 text-white placeholder-gray-500 focus:ring-blue-500 hover:border-blue-500'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 hover:border-blue-400'
                                            }`}
                                        disabled={inputsDisabled}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>Área</label>
                                    <select
                                        title="Selecciona un área"
                                        value={formData.area}
                                        onChange={e => setFormData(prev => ({ ...prev, area: e.target.value }))}
                                        disabled={!formData.directorId}
                                        className={`w-full border rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 transition-colors ${isDarkMode
                                            ? 'bg-black border-gray-800 text-white focus:ring-blue-500 hover:border-blue-500'
                                            : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 hover:border-blue-400'
                                            }`}
                                    >
                                        <option value="">Selecciona un área</option>
                                        {getAreasForDirector(formData.directorId).map(a => (
                                            <option key={a.id_area} value={a.nombre}>{a.nombre}</option>
                                        ))}
                                    </select>
                                    {/* Badge de advertencia por área no coincidente */}
                                    {hasAreaMismatch && (
                                        <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border ${isDarkMode
                                            ? 'bg-yellow-900/20 border-yellow-700/50 text-yellow-300'
                                            : 'bg-yellow-50 border-yellow-300 text-yellow-800'
                                            }`}>
                                            <AlertTriangle className="h-4 w-4 flex-shrink-0 animate-pulse" />
                                            <span className="text-xs font-medium">
                                                El área del director no coincide con el área de algunos bienes seleccionados
                                            </span>
                                        </div>
                                    )}
                                    {/* Chip de sugerencia de área debajo del select */}
                                    {formData.directorId && selectedMuebles.length > 0 && areaSuggestion && formData.area !== areaSuggestion && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onMouseDown={e => { e.preventDefault(); setFormData(prev => ({ ...prev, area: areaSuggestion })); }}
                                                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow transition-all ${isDarkMode
                                                    ? 'bg-blue-900/30 text-blue-200 border-blue-700 hover:bg-blue-900/50 hover:text-white'
                                                    : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 hover:text-blue-800'
                                                    }`}
                                                title={`Usar sugerencia: ${areaSuggestion}`}
                                            >
                                                <span className="font-bold">Sugerido:</span> {areaSuggestion}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Resguardante */}
                            <div className="mb-4">
                                <label className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>Resguardante</label>
                                <input
                                    type="text"
                                    value={formData.resguardante}
                                    onChange={(e) => setFormData({ ...formData, resguardante: e.target.value })}
                                    placeholder="Nombre del resguardante"
                                    className={`block w-full border rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 transition-colors ${isDarkMode
                                        ? 'bg-black border-gray-800 text-white placeholder-gray-500 focus:ring-blue-500 hover:border-blue-500'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 hover:border-blue-400'
                                        }`}
                                    disabled={inputsDisabled}
                                />
                            </div>
                        </div>

                        {/* Selected Items */}
                        <div className={`rounded-xl border p-4 flex-grow overflow-y-hidden shadow-inner relative max-h-[70vh] hover:shadow-lg transition-shadow ${isDarkMode
                            ? 'bg-gray-900/30 border-gray-800'
                            : 'bg-white border-gray-200'
                            }`}>
                            <div className={`flex items-center gap-2 mb-2 sticky top-0 z-30 p-2 -m-2 backdrop-blur-md ${isDarkMode ? 'bg-black/80' : 'bg-white/80'
                                }`}>
                                <LayoutGrid className={`h-5 w-5 animate-pulse ${isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`} />
                                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                                    Artículos Seleccionados ({selectedMuebles.length})
                                </span>
                                {/* Eliminar todos button */}
                                {selectedMuebles.length > 0 && (
                                    <button
                                        onClick={() => {
                                            setSelectedMuebles([]);
                                            setFormData(prev => ({
                                                ...prev,
                                                resguardante: '',
                                                area: '',
                                                puesto: '',
                                                directorId: ''
                                            }));
                                            setDirectorInputDisabled(false);
                                        }}
                                        className={`ml-2 px-3 py-1 rounded text-xs font-semibold transition-colors border flex items-center gap-1 ${isDarkMode
                                            ? 'bg-red-700/80 text-white hover:bg-red-600 border-red-900'
                                            : 'bg-red-600 text-white hover:bg-red-700 border-red-700'
                                            }`}
                                        title="Eliminar todos los artículos seleccionados"
                                    >
                                        <Trash2 className="h-3 w-3" /> Eliminar todos
                                    </button>
                                )}
                            </div>
                            {selectedMuebles.length === 0 ? (
                                <div className={`flex flex-col items-center justify-center h-full min-h-[200px] ${isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                    }`}>
                                    <TagIcon className={`h-12 w-12 mb-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'
                                        }`} />
                                    <p className="text-sm">No hay artículos seleccionados</p>
                                    <p className="text-xs mt-1">Haga clic en un artículo para agregarlo</p>
                                </div>
                            ) : (
                                <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto pr-1">
                                    {selectedMuebles.map((mueble) => (
                                        <div key={`selected-${mueble.id}`} className={`rounded-lg p-3 flex justify-between items-start border shadow-sm hover:shadow-md transition-all ${isDarkMode
                                            ? 'bg-black border-gray-800 hover:border-blue-500'
                                            : 'bg-gray-50 border-gray-200 hover:border-blue-400'
                                            }`}>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                        }`}>
                                                        {mueble.id_inv}
                                                    </div>
                                                    <div className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium 
                                                        ${mueble.estado === 'B' ?
                                                            (isDarkMode ? 'bg-green-900/20 text-green-300 border border-green-900' : 'bg-green-100 text-green-800 border border-green-400') :
                                                            mueble.estado === 'R' ?
                                                                (isDarkMode ? 'bg-yellow-900/20 text-yellow-300 border border-yellow-900' : 'bg-yellow-100 text-yellow-800 border border-yellow-400') :
                                                                mueble.estado === 'M' ?
                                                                    (isDarkMode ? 'bg-red-900/20 text-red-300 border border-red-900' : 'bg-red-100 text-red-800 border border-red-400') :
                                                                    mueble.estado === 'N' ?
                                                                        (isDarkMode ? 'bg-blue-900/20 text-blue-300 border border-blue-900' : 'bg-blue-100 text-blue-800 border border-blue-400') :
                                                                        (isDarkMode ? 'bg-gray-900/20 text-gray-300 border border-gray-900' : 'bg-gray-100 text-gray-600 border border-gray-400')}`}>
                                                        {mueble.estado}
                                                    </div>
                                                </div>
                                                <p className={`text-sm mt-1 truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>
                                                    {mueble.descripcion}
                                                </p>
                                                <div className={`text-xs mt-1 flex items-center gap-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                                    }`}>
                                                    <Briefcase className="h-3 w-3" />
                                                    {mueble.rubro}
                                                </div>
                                                <div className={`text-[10px] mt-1 font-mono px-2 py-0.5 rounded-full border inline-block
                                                    ${mueble.origen === 'INEA' ?
                                                        (isDarkMode ? 'bg-blue-900/30 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-800 border-blue-400') :
                                                        mueble.origen === 'ITEA' ?
                                                            (isDarkMode ? 'bg-pink-900/30 text-pink-200 border-pink-700' : 'bg-pink-100 text-pink-800 border-pink-400') :
                                                            mueble.origen === 'TLAXCALA' ?
                                                                (isDarkMode ? 'bg-purple-900/30 text-purple-200 border-purple-700' : 'bg-purple-100 text-purple-800 border-purple-400') :
                                                                (isDarkMode ? 'bg-gray-900/40 text-gray-400 border-gray-800' : 'bg-gray-100 text-gray-600 border-gray-400')}`}
                                                >
                                                    {mueble.origen}
                                                </div>

                                                {/* Campo de resguardante individual */}
                                                <div className="mt-3 flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={mueble.resguardanteAsignado || ''}
                                                        onChange={(e) => {
                                                            const newSelectedMuebles = selectedMuebles.map(m =>
                                                                m.id === mueble.id ? { ...m, resguardanteAsignado: e.target.value } : m
                                                            );
                                                            setSelectedMuebles(newSelectedMuebles);
                                                        }}
                                                        placeholder="Resguardante individual (opcional)"
                                                        className={`block w-full border rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-1 focus:border-blue-500 transition-colors ${isDarkMode
                                                            ? 'bg-gray-900/50 border-gray-800 text-white placeholder-gray-500 focus:ring-blue-500 hover:border-blue-500'
                                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 hover:border-blue-400'
                                                            }`}
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                title='Eliminar artículo'
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeSelectedMueble(mueble);
                                                }}
                                                className={`ml-2 p-1 rounded-full transition-colors ${isDarkMode
                                                    ? 'text-gray-400 hover:text-red-400 hover:bg-gray-900/50'
                                                    : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'
                                                    }`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-between">
                            <button
                                onClick={() => {
                                    setSelectedMuebles([]);
                                    setFormData(prev => ({
                                        ...prev,
                                        resguardante: '',
                                        area: '',
                                        puesto: '',
                                        directorId: ''
                                    }));
                                    setDirectorInputDisabled(false);
                                }}
                                disabled={selectedMuebles.length === 0 || loading}
                                className={`px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-all border ${selectedMuebles.length === 0 || loading
                                    ? (isDarkMode
                                        ? 'bg-black text-gray-600 border-gray-800 cursor-not-allowed'
                                        : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                    )
                                    : (isDarkMode
                                        ? 'bg-black text-gray-300 border-gray-700 hover:bg-gray-900 hover:border-blue-500 hover:text-blue-300'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600'
                                    )
                                    }`}
                            >
                                <X className="h-4 w-4" />
                                Limpiar Selección
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!isFormValid || loading}
                                className={`px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 flex-grow sm:flex-grow-0 transition-all transform hover:scale-[1.02] ${!isFormValid || loading
                                    ? (isDarkMode
                                        ? 'bg-blue-900/10 text-blue-300/50 border border-blue-900/20 cursor-not-allowed'
                                        : 'bg-blue-100 text-blue-400 border border-blue-200 cursor-not-allowed'
                                    )
                                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg hover:shadow-blue-500/30'
                                    }`}
                            >
                                {loading ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Guardar Resguardo ({selectedMuebles.length})
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 px-4 py-3 rounded-lg shadow-lg border z-50 backdrop-blur-sm animate-fade-in ${isDarkMode
                    ? 'bg-red-900/80 text-red-100 border-red-800'
                    : 'bg-red-50 text-red-900 border-red-200'
                    }`}>
                    <div className="flex items-center">
                        <AlertTriangle className={`h-5 w-5 mr-3 flex-shrink-0 animate-pulse ${isDarkMode ? 'text-red-400' : 'text-red-600'
                            }`} />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                        <button
                            title='Cerrar alerta'
                            onClick={() => setError(null)}
                            className={`ml-4 flex-shrink-0 p-1 rounded-full transition-colors ${isDarkMode
                                ? 'text-red-200 hover:text-white hover:bg-red-800'
                                : 'text-red-600 hover:text-red-800 hover:bg-red-100'
                                }`}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Missing Director Data Error Alert */}
            {showMissingDirectorDataError && (
                <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-lg shadow-lg border flex items-center gap-4 animate-fade-in ${isDarkMode
                    ? 'bg-yellow-900/90 text-yellow-100 border-yellow-700'
                    : 'bg-yellow-50 text-yellow-800 border-yellow-200'
                    }`}>
                    <AlertTriangle className={`h-5 w-5 animate-pulse ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                        }`} />
                    <span className="font-medium">Faltan datos del director. Debes completar el área y el puesto para continuar.</span>
                    <button
                        onClick={() => setShowDirectorModal(true)}
                        className={`ml-4 px-3 py-1 rounded font-semibold transition-colors ${isDarkMode
                            ? 'bg-yellow-600 text-black hover:bg-yellow-500'
                            : 'bg-yellow-600 text-white hover:bg-yellow-700'
                            }`}
                    >
                        Completar datos
                    </button>
                </div>
            )}

            {/* Director Modal */}
            {showDirectorModal && (
                <div className={`fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn ${isDarkMode ? 'bg-black/90' : 'bg-gray-900/50'
                    }`}>
                    <div className={`rounded-2xl shadow-2xl border w-full max-w-md overflow-hidden transition-all duration-300 transform ${isDarkMode
                        ? 'bg-black border-yellow-600/30 hover:border-yellow-500/50'
                        : 'bg-white border-yellow-300'
                        }`}>
                        <div className={`relative p-6 ${isDarkMode ? 'bg-black' : 'bg-white'
                            }`}>
                            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500/40 animate-pulse"></div>

                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="p-3 bg-yellow-500/10 rounded-full border border-yellow-500/30 mb-3 animate-pulse">
                                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                                </div>
                                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>¡Ups! Falta información</h3>
                                <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    Necesitamos algunos datos adicionales del director seleccionado para Continuar
                                </p>
                            </div>

                            <div className="space-y-5 mt-6">
                                <div className={`rounded-lg border p-4 transition-colors ${isDarkMode
                                    ? 'border-gray-800 bg-gray-900/50 hover:border-yellow-500'
                                    : 'border-gray-200 bg-gray-50 hover:border-yellow-400'
                                    }`}>
                                    <label className={`block text-xs uppercase tracking-wider mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                        }`}>Director seleccionado</label>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                                            }`}>
                                            <UserCheck className="h-4 w-4 text-yellow-400 animate-pulse" />
                                        </div>
                                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>{incompleteDirector?.nombre || 'Director'}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>
                                        <Briefcase className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                            }`} />
                                        Área
                                    </label>
                                    <input
                                        type="text"
                                        value={directorFormData.area}
                                        onChange={e => setDirectorFormData(prev => ({ ...prev, area: e.target.value }))}
                                        placeholder="Escribe el área asignada al director"
                                        className={`block w-full border rounded-lg py-3 px-4 focus:outline-none focus:ring-1 transition-colors ${isDarkMode
                                            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-yellow-500 focus:ring-yellow-500'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500'
                                            }`}
                                    />
                                </div>

                                <div>
                                    <label className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>
                                        <Users className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                            }`} />
                                        Puesto
                                    </label>
                                    <input
                                        type="text"
                                        value={directorFormData.puesto}
                                        onChange={(e) => setDirectorFormData({ ...directorFormData, puesto: e.target.value })}
                                        placeholder="Ej: Director General, Gerente, Supervisor..."
                                        className={`block w-full border rounded-lg py-3 px-4 focus:outline-none focus:ring-1 transition-colors ${isDarkMode
                                            ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-yellow-500 focus:ring-yellow-500'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500'
                                            }`}
                                        disabled={isUsuario}
                                    />
                                    {isUsuario && (
                                        <div className="text-xs text-yellow-400 mt-1">Solo un administrador puede editar estos campos</div>
                                    )}
                                    {(!directorFormData.area || !directorFormData.puesto) && !isUsuario && (
                                        <p className="text-xs text-yellow-500/80 mt-2 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3 animate-pulse" />
                                            Ambos campos son requeridos para continuar
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={`p-5 border-t flex justify-end gap-3 ${isDarkMode
                            ? 'bg-black border-gray-800'
                            : 'bg-gray-50 border-gray-200'
                            }`}>
                            <button
                                onClick={handleCloseDirectorModal}
                                className={`px-5 py-2.5 rounded-lg text-sm border transition-colors flex items-center gap-2 ${isDarkMode
                                    ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-800 hover:border-yellow-500'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-yellow-400'
                                    }`}
                            >
                                <X className="h-4 w-4" />
                                Cancelar
                            </button>
                            <button
                                onClick={saveDirectorInfo}
                                disabled={savingDirector || !directorFormData.area || !directorFormData.puesto || isUsuario}
                                className={`px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all duration-300 transform hover:scale-[1.02] ${savingDirector || !directorFormData.area || !directorFormData.puesto || isUsuario
                                    ? (isDarkMode
                                        ? 'bg-gray-900 text-gray-500 cursor-not-allowed border border-gray-800'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                                    )
                                    : 'bg-yellow-600 text-black font-medium hover:shadow-lg hover:shadow-yellow-500/20'
                                    }`}
                            >
                                {savingDirector ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                {savingDirector ? 'Guardando...' : 'Guardar y Continuar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de advertencia por usufinal diferente */}
            {showUsufinalModal && (
                <div className={`fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn ${isDarkMode ? 'bg-black/90' : 'bg-gray-900/50'
                    }`}>
                    <div className={`rounded-2xl shadow-2xl border w-full max-w-md overflow-hidden transition-all duration-300 transform ${isDarkMode
                        ? 'bg-black border-red-600/30 hover:border-red-500/50'
                        : 'bg-white border-red-300'
                        }`}>
                        <div className={`relative p-6 ${isDarkMode ? 'bg-black' : 'bg-white'
                            }`}>
                            <div className="absolute top-0 left-0 w-full h-1 bg-red-500/40 animate-pulse"></div>
                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="p-3 bg-red-500/10 rounded-full border border-red-500/30 mb-3 animate-pulse">
                                    <AlertTriangle className="h-8 w-8 text-red-500" />
                                </div>
                                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>No se puede agregar</h3>
                                <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    Solo puedes seleccionar bienes que pertenezcan al mismo responsable.
                                </p>
                                <p className={`mt-2 text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'
                                    }`}>
                                    El bien que intentas agregar actualmente pertenece a: <span className="font-semibold">{conflictUsufinal}</span>
                                </p>
                                <p className={`text-xs italic pt-3 ${isDarkMode ? 'text-gray-700' : 'text-gray-500'
                                    }`}>Te sugerimos editar las características del bien.</p>
                            </div>
                        </div>
                        <div className={`p-5 border-t flex justify-end gap-3 ${isDarkMode
                            ? 'bg-black border-gray-800'
                            : 'bg-gray-50 border-gray-200'
                            }`}>
                            <button
                                onClick={() => setShowUsufinalModal(false)}
                                className={`px-5 py-2.5 rounded-lg text-sm border transition-colors flex items-center gap-2 ${isDarkMode
                                    ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-800 hover:border-red-500'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-red-400'
                                    }`}
                            >
                                <X className="h-4 w-4" />
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de conflicto de área */}
            {showAreaConflictModal && (
                <div className={`fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn ${isDarkMode ? 'bg-black/90' : 'bg-gray-900/50'
                    }`}>
                    <div className={`rounded-2xl shadow-2xl border w-full max-w-md overflow-hidden transition-all duration-300 transform ${isDarkMode
                        ? 'bg-black border-blue-600/30 hover:border-blue-500/50'
                        : 'bg-white border-blue-300'
                        }`}>
                        <div className={`relative p-6 ${isDarkMode ? 'bg-black' : 'bg-white'
                            }`}>
                            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/40 animate-pulse"></div>

                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/30 mb-3 animate-pulse">
                                    <AlertTriangle className="h-8 w-8 text-blue-500" />
                                </div>
                                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>Conflicto de Área</h3>
                                <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    No es posible agregar artículos de diferentes áreas en un mismo resguardo
                                </p>
                            </div>

                            <div className="space-y-5 mt-6">
                                <div className={`rounded-lg border p-4 transition-colors ${isDarkMode
                                    ? 'border-gray-800 bg-gray-900/50 hover:border-blue-500'
                                    : 'border-gray-200 bg-gray-50 hover:border-blue-400'
                                    }`}>
                                    <label className={`block text-xs uppercase tracking-wider mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                        }`}>Área en Conflicto</label>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                                            }`}>
                                            <Building2 className={`h-4 w-4 animate-pulse ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                }`} />
                                        </div>
                                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>{conflictArea || 'Sin especificar'}</span>
                                    </div>
                                </div>

                                <div className={`border rounded-lg p-4 ${isDarkMode
                                    ? 'bg-blue-950/30 border-blue-900/50'
                                    : 'bg-blue-50 border-blue-200'
                                    }`}>
                                    <div className="flex items-start gap-3">
                                        <Info className={`h-5 w-5 mt-0.5 ${isDarkMode ? 'text-white' : 'text-blue-600'
                                            }`} />
                                        <p className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-700'
                                            }`}>
                                            Los artículos en un resguardo deben pertenecer a la misma área para mantener la organización y trazabilidad.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`p-5 border-t flex justify-end gap-3 ${isDarkMode
                            ? 'bg-black border-gray-800'
                            : 'bg-gray-50 border-gray-200'
                            }`}>
                            <button
                                onClick={() => setShowAreaConflictModal(false)}
                                className="px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-500 font-medium transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-blue-500/30"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para descargar PDF tras guardar */}
            {showPDFButton && pdfData && (
                <div
                    className={`fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn ${isDarkMode ? 'bg-black/90' : 'bg-gray-900/50'
                        }`}
                    tabIndex={-1}
                    onKeyDown={e => {
                        if (e.key === 'Escape') {
                            e.stopPropagation();
                            e.preventDefault();
                        }
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <div
                        className={`rounded-2xl shadow-2xl border w-full max-w-md overflow-hidden transition-all duration-300 transform ${isDarkMode
                            ? 'bg-black border-green-600/30 hover:border-green-500/50'
                            : 'bg-white border-green-300'
                            }`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={`relative p-6 ${isDarkMode ? 'bg-black' : 'bg-white'
                            }`}>
                            <div className="absolute top-0 left-0 w-full h-1 bg-green-500/40 animate-pulse"></div>

                            <button
                                onClick={() => {
                                    const hasPdfBeenDownloaded = sessionStorage.getItem('pdfDownloaded') === 'true';
                                    if (!hasPdfBeenDownloaded) {
                                        setShowWarningModal(true);
                                    } else {
                                        setShowPDFButton(false);
                                    }
                                }}
                                className={`absolute top-3 right-3 p-2 rounded-full border transition-colors ${isDarkMode
                                    ? 'bg-black/60 hover:bg-gray-900 text-green-400 hover:text-green-500 border-green-500/30'
                                    : 'bg-gray-100 hover:bg-gray-200 text-green-600 hover:text-green-700 border-green-300'
                                    }`}
                                title="Cerrar"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="p-3 bg-green-500/10 rounded-full border border-green-500/30 mb-3 animate-pulse">
                                    <FileDigit className="h-8 w-8 text-green-500" />
                                </div>
                                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>Resguardo generado</h3>
                                <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    Descarga el PDF del resguardo para imprimir o compartir
                                </p>
                            </div>

                            <div className="space-y-5 mt-6">
                                <div className={`rounded-lg border p-4 transition-colors ${isDarkMode
                                    ? 'border-gray-800 bg-gray-900/50 hover:border-green-500'
                                    : 'border-gray-200 bg-gray-50 hover:border-green-400'
                                    }`}>
                                    <label className={`block text-xs uppercase tracking-wider mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                        }`}>Documento generado</label>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                                            }`}>
                                            <FileText className="h-4 w-4 text-green-400 animate-pulse" />
                                        </div>
                                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>Resguardo {pdfData.folio}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleGeneratePDF}
                                    disabled={generatingPDF}
                                    className="w-full py-3 px-4 bg-green-600 hover:bg-green-500 text-black font-medium rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-green-500/30"
                                >
                                    <Download className="h-4 w-4" />
                                    {generatingPDF ? 'Generando PDF...' : 'Descargar PDF'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de advertencia personalizado */}
            {showWarningModal && (
                <div className={`fixed inset-0 flex items-center justify-center z-[60] px-4 animate-fadeIn ${isDarkMode ? 'bg-black/95' : 'bg-gray-900/50'
                    }`}>
                    <div className={`rounded-xl shadow-2xl border w-full max-w-sm p-6 transition-colors ${isDarkMode
                        ? 'bg-gray-900 border-red-500/30 hover:border-red-500/50'
                        : 'bg-white border-red-300'
                        }`}>
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="p-3 bg-red-500/10 rounded-full border border-red-500/30 animate-pulse">
                                <AlertTriangle className="h-7 w-7 text-red-500" />
                            </div>

                            <div>
                                <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>¿Cerrar sin descargar?</h3>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    No has descargado el PDF. Si cierras esta ventana, no podrás volver a generar este documento por ahora.
                                </p>
                            </div>

                            <div className="flex gap-3 w-full mt-2">
                                <button
                                    onClick={() => setShowWarningModal(false)}
                                    className={`flex-1 py-2 px-4 border rounded-lg transition-colors ${isDarkMode
                                        ? 'border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-blue-500'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-blue-400'
                                        }`}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        setShowWarningModal(false);
                                        setShowPDFButton(false);
                                    }}
                                    className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors hover:border-red-500 border border-transparent"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE ERROR SELECT-ALL */}
            {showSelectAllErrorModal && (
                <div className={`fixed inset-0 flex items-center justify-center z-[100] px-4 animate-fadeIn ${isDarkMode ? 'bg-black/90' : 'bg-gray-900/50'
                    }`}>
                    <div className={`rounded-2xl shadow-2xl border-2 w-full max-w-md overflow-hidden transition-all duration-300 ${isDarkMode
                        ? 'bg-black border-blue-700/40 hover:border-blue-500/60'
                        : 'bg-white border-blue-300'
                        }`}>
                        <div className={`relative p-7 flex flex-col items-center text-center ${isDarkMode ? 'bg-black' : 'bg-white'
                            }`}>
                            <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/30 mb-3 animate-pulse">
                                <ListChecks className="h-8 w-8 text-blue-400 animate-pulse" />
                            </div>
                            <h3 className={`text-2xl font-bold mb-2 tracking-tight ${isDarkMode ? 'text-blue-200' : 'text-blue-800'
                                }`}>No se puede seleccionar todo</h3>
                            <p className={`text-base mb-6 max-w-xs ${isDarkMode ? 'text-blue-100' : 'text-blue-700'
                                }`}>{selectAllErrorMsg}</p>
                            <button
                                onClick={() => setShowSelectAllErrorModal(false)}
                                className={`mt-2 px-6 py-2.5 rounded-lg font-semibold shadow-lg border transition-all flex items-center gap-2 ${isDarkMode
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-700'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                                    }`}
                            >
                                <X className="h-4 w-4" />
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}