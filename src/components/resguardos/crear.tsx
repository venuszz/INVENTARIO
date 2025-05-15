"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
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
import Cookies from 'js-cookie';
import { generateResguardoPDF } from './ResguardoPDFReport';
import { useUserRole } from "@/hooks/useUserRole";
import { useNotifications } from '@/hooks/useNotifications';

interface Mueble {
    id: number;
    id_inv: string | null;
    descripcion: string | null;
    estado: string | null;
    estatus: string | null;
    resguardante: string | null;
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

const colorPalette = [
    'bg-blue-900/30 text-blue-200 border-blue-700 hover:bg-blue-900/40 transition-colors',
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

function getColorClass(value: string | null | undefined) {
    if (!value) return 'bg-gray-900/20 text-gray-300 border border-gray-900 hover:bg-gray-900/30';
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = value.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colorPalette.length;
    return colorPalette[idx];
}

function truncateText(text: string | null | undefined, length: number = 40) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
}

export default function CrearResguardos() {
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

    // NUEVO: Estado para áreas y relaciones N:M
    const [areas, setAreas] = useState<{ id_area: number; nombre: string }[]>([]);
    const [directorAreasMap, setDirectorAreasMap] = useState<{ [id_directorio: number]: number[] }>({});

    // Estado para autocompletado de director (solo exacto)
    const [directorSearchTerm, setDirectorSearchTerm] = useState('');

    const [conflictArea, setConflictArea] = useState<string | null>(null);
    const [showAreaConflictModal, setShowAreaConflictModal] = useState(false);

    // Estado para mostrar mensaje de error por datos faltantes del director
    const [showMissingDirectorDataError, setShowMissingDirectorDataError] = useState(false);

    const isFormValid =
        selectedMuebles.length > 0 &&
        formData.directorId.trim() !== '' &&
        formData.area.trim() !== '' &&
        formData.puesto.trim() !== '';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [directorioResult, firmasResult, allMueblesInea, allMueblesItea] = await Promise.all([
                    supabase.from('directorio').select('*'),
                    supabase.from('firmas').select('*').order('id', { ascending: true }),
                    supabase.from('muebles').select('area,usufinal').eq('estatus', 'ACTIVO'),
                    supabase.from('mueblesitea').select('area,usufinal').eq('estatus', 'ACTIVO')
                ]);

                if (directorioResult.error) throw directorioResult.error;
                if (firmasResult.error) throw firmasResult.error;
                if (allMueblesInea.error) throw allMueblesInea.error;
                if (allMueblesItea.error) throw allMueblesItea.error;

                setDirectorio(directorioResult.data || []);

                return firmasResult.data;
            } catch (err) {
                setError('Error al cargar los datos');
                console.error(err);
                return null;
            }
        };
        fetchData();
    }, []);

    // Cargar áreas y relaciones N:M al montar
    useEffect(() => {
        async function fetchAreasAndRelations() {
            const { data: areasData } = await supabase.from('area').select('*').order('nombre');
            setAreas(areasData || []);
            const { data: rels } = await supabase.from('directorio_areas').select('*');
            if (rels) {
                const map: { [id_directorio: number]: number[] } = {};
                rels.forEach((rel: { id_directorio: number, id_area: number }) => {
                    if (!map[rel.id_directorio]) map[rel.id_directorio] = [];
                    map[rel.id_directorio].push(rel.id_area);
                });
                setDirectorAreasMap(map);
            }
        }
        fetchAreasAndRelations();
    }, []);

    async function fetchAllRows<T = unknown>(table: string, filter: object = {}, batchSize = 1000): Promise<T[]> {
        let allRows: T[] = [];
        let from = 0;
        let to = batchSize - 1;
        let keepFetching = true;
        while (keepFetching) {
            let query = supabase.from(table).select('*').range(from, to);
            Object.entries(filter).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
            const { data, error } = await query;
            if (error) throw error;
            allRows = allRows.concat(data || []);
            if (!data || data.length < batchSize) {
                keepFetching = false;
            } else {
                from += batchSize;
                to += batchSize;
            }
        }
        return allRows;
    }

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

            const [dataInea, dataItea] = await Promise.all([
                fetchAllRows('muebles', {}),
                fetchAllRows('mueblesitea', { estatus: 'ACTIVO' })
            ]);
            let combinedData = [
                ...((Array.isArray(dataInea) ? dataInea as Mueble[] : [] as Mueble[]).map((item: Mueble) => ({ ...item, origen: 'INEA' }))),
                ...((Array.isArray(dataItea) ? dataItea as Mueble[] : [] as Mueble[]).map((item: Mueble) => ({ ...item, origen: 'ITEA' }))),
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
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(sortField, sortDirection);
    }, [fetchData, sortField, sortDirection]);

    // Efecto para analizar coincidencia más cercana
    useEffect(() => {
        const analyzeMatch = () => {
            if (!searchTerm || !allMuebles.length) {
                setSearchMatchType(null);
                return;
            }
            const clean = (str: string) => (str || '').normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
            const term = clean(searchTerm);
            let bestMatch = { type: null, value: '', score: 0 } as { type: typeof searchMatchType, value: string, score: number };
            for (const item of allMuebles) {
                // Coincidencia por responsable
                if ((item.usufinal && clean(item.usufinal).includes(term)) || (item.resguardante && clean(item.resguardante).includes(term))) {
                    const exact = clean(item.usufinal || '') === term || clean(item.resguardante || '') === term;
                    const score = exact ? 6 : 5;
                    if (score > bestMatch.score) bestMatch = { type: 'usufinal', value: item.usufinal || item.resguardante || '', score };
                }
                // Coincidencia por área
                if (item.area && clean(item.area).includes(term)) {
                    const exact = clean(item.area) === term;
                    const score = exact ? 5 : 4;
                    if (score > bestMatch.score) bestMatch = { type: 'area', value: item.area, score };
                }
                // Coincidencia por ID
                if (item.id_inv && clean(item.id_inv).includes(term)) {
                    const exact = clean(item.id_inv) === term;
                    const score = exact ? 4 : 3;
                    if (score > bestMatch.score) bestMatch = { type: 'id', value: item.id_inv, score };
                }
                // Coincidencia por descripción
                if (item.descripcion && clean(item.descripcion).includes(term)) {
                    const exact = clean(item.descripcion) === term;
                    const score = exact ? 3 : 2;
                    if (score > bestMatch.score) bestMatch = { type: 'descripcion', value: item.descripcion, score };
                }
                // Coincidencia por rubro
                if (item.rubro && clean(item.rubro).includes(term)) {
                    const exact = clean(item.rubro) === term;
                    const score = exact ? 2 : 1;
                    if (score > bestMatch.score) bestMatch = { type: 'rubro', value: item.rubro, score };
                }
                // Coincidencia por estado
                if (item.estado && clean(item.estado).includes(term)) {
                    const score = 1;
                    if (score > bestMatch.score) bestMatch = { type: 'estado', value: item.estado, score };
                }
                // Coincidencia por estatus
                if (item.estatus && clean(item.estatus).includes(term)) {
                    const score = 1;
                    if (score > bestMatch.score) bestMatch = { type: 'estatus', value: item.estatus, score };
                }
            }
            setSearchMatchType(bestMatch.type);
        };
        const debounce = setTimeout(analyzeMatch, 200);
        return () => clearTimeout(debounce);
    }, [searchTerm, allMuebles]);

    // Filtrado maestro (omnibox) y paginación
    const filteredMueblesOmni = allMuebles.filter(item => {
        if (activeFilters.length === 0 && !searchTerm) return true;
        
        const clean = (str: string) => (str || '').normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase();
        const currentTerm = clean(searchTerm);
        
        // Aplicar filtros activos
        const passesActiveFilters = activeFilters.every(filter => {
            const filterTerm = clean(filter.term);
            if (!filterTerm) return true;
            
            switch (filter.type) {
                case 'id':
                    return clean(item.id_inv || '').includes(filterTerm);
                case 'descripcion':
                    return clean(item.descripcion || '').includes(filterTerm);
                case 'rubro':
                    return clean(item.rubro || '').includes(filterTerm);
                case 'estado':
                    return clean(item.estado || '').includes(filterTerm);
                case 'estatus':
                    return clean(item.estatus || '').includes(filterTerm);
                case 'area':
                    return clean(item.area || '').includes(filterTerm);
                case 'usufinal':
                case 'resguardante':
                    return clean(item.usufinal || '').includes(filterTerm) || 
                           clean(item.resguardante || '').includes(filterTerm);
                default:
                    return true;
            }
        });

        // Si hay término de búsqueda actual, aplicarlo también
        const passesCurrentSearch = !currentTerm || 
            clean(item.id_inv || '').includes(currentTerm) ||
            clean(item.descripcion || '').includes(currentTerm) ||
            clean(item.rubro || '').includes(currentTerm) ||
            clean(item.estado || '').includes(currentTerm) ||
            clean(item.estatus || '').includes(currentTerm) ||
            clean(item.area || '').includes(currentTerm) ||
            clean(item.usufinal || '').includes(currentTerm) ||
            clean(item.resguardante || '').includes(currentTerm);

        return passesActiveFilters && passesCurrentSearch;
    });

    const totalCount = filteredMueblesOmni.length;
    const totalPages = Math.ceil(totalCount / rowsPerPage);
    const paginatedMuebles = filteredMueblesOmni.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

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
            console.error(err);
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
            // Buscar área por nombre
            const { data: areaData, error: areaError } = await supabase
                .from('area')
                .select('id_area')
                .eq('nombre', areaNombre)
                .maybeSingle();
            if (areaError) throw areaError;
            if (!areaData) {
                // Si no existe, crearla
                const { data: newArea, error: insertAreaError } = await supabase
                    .from('area')
                    .insert({ nombre: areaNombre })
                    .select('id_area')
                    .single();
                if (insertAreaError) throw insertAreaError;
                id_area = newArea.id_area;
            } else {
                id_area = areaData.id_area;
            }

            // 2. Actualizar solo el puesto
            const { error: updateError } = await supabase
                .from('directorio')
                .update({ puesto: directorFormData.puesto })
                .eq('id_directorio', incompleteDirector.id_directorio);
            if (updateError) throw updateError;

            // 3. Eliminar relaciones viejas
            await supabase
                .from('directorio_areas')
                .delete()
                .eq('id_directorio', incompleteDirector.id_directorio);

            // 4. Insertar nueva relación
            const { error: relError } = await supabase
                .from('directorio_areas')
                .insert({ id_directorio: incompleteDirector.id_directorio, id_area });
            if (relError) throw relError;

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
            console.error(err);
        } finally {
            setSavingDirector(false);
        }
    };

    const handleSubmit = async () => {
        if (!isFormValid) {
            setError('Complete todos los campos obligatorios');
            return;
        }

        let folioToUse = formData.folio;
        if (!folioToUse) {
            folioToUse = await generateFolio() || '';
            if (!folioToUse) return;
        }

        let createdBy = '';
        try {
            const userDataCookie = Cookies.get('userData');
            if (userDataCookie) {
                const userData = JSON.parse(userDataCookie);
                createdBy = `${userData.firstName || ''}${userData.lastName ? ' ' + userData.lastName : ''}`.trim();
            }
        } catch { }

        try {
            setLoading(true);

            const { data: firmasData, error: firmasError } = await supabase
                .from('firmas')
                .select('*')
                .order('id', { ascending: true });

            if (firmasError) throw firmasError;

            setShowPDFButton(true);

            setPdfData({
                folio: folioToUse,
                fecha: new Date().toLocaleDateString(),
                director: directorio.find(d => d.id_directorio.toString() === formData.directorId)?.nombre?.toUpperCase() || '',
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
            });

            const resguardoPromises = selectedMuebles.map(async (mueble) => {
                const tableName = mueble.origen === 'ITEA' ? 'mueblesitea' : 'muebles';
                const directorNombre = directorio.find(dir => dir.id_directorio.toString() === formData.directorId)?.nombre;
                const resguardanteToUse = mueble.resguardanteAsignado || formData.resguardante;

                const { error: updateError } = await supabase
                    .from(tableName)
                    .update({
                        resguardante: resguardanteToUse,
                        usufinal: directorNombre,
                        area: formData.area
                    })
                    .eq('id', mueble.id);

                if (updateError) throw updateError;

                const { error: insertError } = await supabase.from('resguardos').insert({
                    folio: folioToUse,
                    f_resguardo: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString(),
                    area_resguardo: formData.area,
                    dir_area: directorNombre,
                    num_inventario: mueble.id_inv,
                    descripcion: mueble.descripcion,
                    rubro: mueble.rubro,
                    condicion: mueble.estado,
                    usufinal: resguardanteToUse,
                    created_by: createdBy,
                    puesto: formData.puesto,
                    origen: mueble.origen || '',
                });

                if (insertError) throw insertError;
            });

            await Promise.all(resguardoPromises);

            sessionStorage.setItem('pdfDownloaded', 'false');

            try {
                const notificationDescription = `Se ha creado un nuevo resguardo para el área "${formData.area}" bajo la dirección de "${directorio.find(d => d.id_directorio.toString() === formData.directorId)?.nombre || ''}" con ${selectedMuebles.length} artículo(s).`;
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
            } catch (notifErr) {
                console.error('No se pudo crear la notificación:', notifErr);
            }

            setFormData(prev => ({
                ...prev,
                resguardante: ''
            }));
            setSelectedMuebles([]);
            setSuccessMessage(`Resguardo ${folioToUse} creado correctamente con ${selectedMuebles.length} artículo(s)`);
            setTimeout(() => setSuccessMessage(null), 3000);

            await generateFolio();
            fetchData(sortField, sortDirection);

        } catch (err) {
            setError('Error al guardar el resguardo');
            console.error(err);
        } finally {
            setLoading(false);
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
            console.error(error);
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

    // Autocompletado exacto director
    const handleDirectorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setDirectorSearchTerm(value);
        const match = directorio.find(d => d.nombre.trim().toLowerCase() === value.trim().toLowerCase());
        if (match) {
            const areasForDirector = getAreasForDirector(match.id_directorio.toString());
            if (!match.puesto || !areasForDirector.length) {
                setIncompleteDirector(match);
                setDirectorFormData({ area: match.area || '', puesto: match.puesto || '' });
                setShowDirectorModal(true);
                setShowMissingDirectorDataError(false);
                setFormData(prev => ({ ...prev, directorId: match.id_directorio.toString(), area: '', puesto: '' }));
                return;
            }
            setFormData(prev => ({
                ...prev,
                directorId: match.id_directorio.toString(),
                area: match.area || '',
                puesto: match.puesto || ''
            }));
            setShowMissingDirectorDataError(false);
        } else {
            setFormData(prev => ({ ...prev, directorId: '', area: '', puesto: '' }));
            setShowMissingDirectorDataError(false);
        }
    };

    const handleCloseDirectorModal = () => {
        if (!directorFormData.area.trim() || !directorFormData.puesto.trim()) {
            setShowMissingDirectorDataError(true);
        }
        setShowDirectorModal(false);
    };

    return (
        <div className="bg-black text-white min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
            {/* Success message toast */}
            {successMessage && (
                <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-green-900/80 text-green-100 px-4 py-2 rounded-lg shadow-lg border border-green-700 backdrop-blur-sm animate-fade-in">
                    <CheckCircle className="h-5 w-5 text-green-400 animate-pulse" />
                    <span className="animate-bounce">{successMessage}</span>
                </div>
            )}

            <div className="w-full mx-auto bg-black rounded-lg sm:rounded-xl shadow-2xl overflow-hidden transition-all duration-500 transform border border-gray-800 hover:border-gray-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-black to-gray-900 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 gap-2 sm:gap-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
                        <span className="mr-2 sm:mr-3 bg-gradient-to-br from-blue-600 to-blue-800 text-white p-1 sm:p-2 rounded-lg border border-blue-700 text-sm sm:text-base shadow-lg">RES</span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-blue-100">
                            Creación de Resguardos
                        </span>
                    </h1>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <p className="text-gray-400 text-sm sm:text-base flex items-center gap-2">
                            <ListChecks className="h-4 w-4 text-blue-400 animate-pulse" />
                            <span className="font-medium text-blue-300">{selectedMuebles.length}</span> artículos seleccionados
                        </p>
                        <p className="text-gray-400 text-sm sm:text-base flex items-center gap-2">
                            <Info className="h-4 w-4 text-blue-400 animate-pulse" />
                            Seleccione artículos para el resguardo
                        </p>
                    </div>
                </div>

                {/* Main container */}
                <div className="grid grid-cols-1 lg:grid-cols-5 h-full flex-1">
                    {/* Left panel - Muebles table */}
                    <div className="flex-1 min-w-0 flex flex-col p-4 lg:col-span-3">
                        {/* Folio and director information */}
                        <div className="mb-6 bg-gradient-to-br from-gray-900/20 to-gray-900/40 p-4 rounded-xl border border-gray-800 shadow-inner hover:shadow-lg transition-shadow">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-black to-gray-900 p-3 rounded-lg border border-gray-800 flex flex-col hover:border-blue-500 transition-colors">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs uppercase text-gray-500 font-medium">Folio</span>
                                        <button
                                            onClick={resetFolio}
                                            className="text-xs bg-blue-900/20 hover:bg-blue-900/30 text-blue-400 hover:text-blue-300 flex items-center gap-1 px-2 py-1 rounded border border-blue-800/50 transition-all"
                                        >
                                            <RefreshCw className="h-3 w-3" />
                                            Nuevo
                                        </button>
                                    </div>
                                    <div className="flex items-center">
                                        <FileDigit className="h-4 w-4 text-blue-400 mr-2 animate-pulse" />
                                        <span className="text-sm font-medium text-white">{formData.folio || 'Generando...'}</span>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-black to-gray-900 p-3 rounded-lg border border-gray-800 flex flex-col hover:border-blue-500 transition-colors">
                                    <span className="text-xs uppercase text-gray-500 font-medium mb-1">Director de Área</span>
                                    <div className="flex items-center">
                                        <Building2 className="h-4 w-4 text-blue-400 mr-2 animate-pulse" />
                                        <span className="text-sm text-white">
                                            {formData.directorId ?
                                                directorio.find(d => d.id_directorio.toString() === formData.directorId)?.nombre || 'Seleccionar' :
                                                'Seleccionar'}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-black to-gray-900 p-3 rounded-lg border border-gray-800 flex flex-col hover:border-blue-500 transition-colors">
                                    <span className="text-xs uppercase text-gray-500 font-medium mb-1">Fecha</span>
                                    <div className="flex items-center">
                                        <Calendar className="h-4 w-4 text-blue-400 mr-2 animate-pulse" />
                                        <span className="text-sm text-white">{new Date().toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search and filters */}
                        <div className="mb-6 bg-gradient-to-br from-gray-900/20 to-gray-900/40 p-4 rounded-xl border border-gray-800 shadow-inner hover:shadow-lg transition-shadow">                            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
                                <div className="flex-1 relative">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Buscar por cualquier campo..."
                                                className="w-full px-4 py-2 bg-black/50 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                                            />
                                            {searchMatchType && (                                                <span className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 ${
                                                        searchMatchType === 'id' ? 'bg-blue-900/70 text-blue-200 border border-blue-700' :
                                                        searchMatchType === 'descripcion' ? 'bg-purple-900/70 text-purple-200 border border-purple-700' :
                                                        searchMatchType === 'rubro' ? 'bg-green-900/70 text-green-200 border border-green-700' :
                                                        searchMatchType === 'estado' ? 'bg-yellow-900/70 text-yellow-200 border border-yellow-700' :
                                                        searchMatchType === 'estatus' ? 'bg-teal-900/70 text-teal-200 border border-teal-700' :
                                                        searchMatchType === 'area' ? 'bg-red-900/70 text-red-200 border border-red-700' :
                                                        searchMatchType === 'usufinal' || searchMatchType === 'resguardante' ? 'bg-orange-900/70 text-orange-200 border border-orange-700' :
                                                        'bg-gray-700 text-gray-300 border border-gray-600'
                                                    } rounded-md text-xs font-medium flex items-center gap-2`}>
                                                    <span>{
                                                        searchMatchType === 'id' ? 'ID' :
                                                        searchMatchType === 'descripcion' ? 'Descripción' :
                                                        searchMatchType === 'rubro' ? 'Rubro' :
                                                        searchMatchType === 'estado' ? 'Estado' :
                                                        searchMatchType === 'estatus' ? 'Estatus' :
                                                        searchMatchType === 'area' ? 'Área' :
                                                        searchMatchType === 'usufinal' ? 'Usuario Final' :
                                                        searchMatchType === 'resguardante' ? 'Resguardante' :
                                                        searchMatchType
                                                    }</span>
                                                </span>
                                            )}</div>
                                        <button
                                            onClick={saveCurrentFilter}
                                            disabled={!searchTerm || !searchMatchType}
                                            className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                                                searchTerm && searchMatchType
                                                    ? 'bg-blue-600 hover:bg-blue-700 border-blue-500 text-white'
                                                    : 'bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed'
                                            } transition-all duration-200 hover:scale-105`}
                                            title="Agregar filtro actual a la lista de filtros activos"
                                        >
                                            <Plus className="h-4 w-4" />
                                            <span>Agregar Filtro</span>
                                        </button>
                                    </div>                                    {/* Filtros activos */}
                                    {activeFilters.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {activeFilters.map((filter, index) => (                                                <div
                                                    key={index}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm animate-fadeIn transition-colors group ${
                                                        filter.type === 'id' ? 'bg-blue-900/70 text-blue-200 border border-blue-700' :
                                                        filter.type === 'descripcion' ? 'bg-purple-900/70 text-purple-200 border border-purple-700' :
                                                        filter.type === 'rubro' ? 'bg-green-900/70 text-green-200 border border-green-700' :
                                                        filter.type === 'estado' ? 'bg-yellow-900/70 text-yellow-200 border border-yellow-700' :
                                                        filter.type === 'estatus' ? 'bg-teal-900/70 text-teal-200 border border-teal-700' :
                                                        filter.type === 'area' ? 'bg-red-900/70 text-red-200 border border-red-700' :
                                                        filter.type === 'usufinal' || filter.type === 'resguardante' ? 'bg-orange-900/70 text-orange-200 border border-orange-700' :
                                                        'bg-gray-700 text-gray-300 border border-gray-600'
                                                    }`}
                                                >
                                                    <span className="font-medium">{
                                                        filter.type === 'id' ? 'ID' :
                                                        filter.type === 'descripcion' ? 'Descripción' :
                                                        filter.type === 'rubro' ? 'Rubro' :
                                                        filter.type === 'estado' ? 'Estado' :
                                                        filter.type === 'estatus' ? 'Estatus' :
                                                        filter.type === 'area' ? 'Área' :
                                                        filter.type === 'usufinal' ? 'Usuario Final' :
                                                        filter.type === 'resguardante' ? 'Resguardante' :
                                                        filter.type
                                                    }:</span>
                                                    <span>{filter.term}</span>
                                                    <button
                                                        onClick={() => removeFilter(index)}
                                                        className="hover:text-red-400 transition-colors p-1 rounded-full hover:bg-red-900/30"
                                                        title="Eliminar este filtro"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                            
                                            {activeFilters.length > 1 && (
                                                <button
                                                    onClick={() => setActiveFilters([])}
                                                    className="px-3 py-1.5 bg-red-900/30 rounded-lg border border-red-700/30 text-sm text-red-200 hover:bg-red-900/50 transition-all duration-200 flex items-center gap-2 hover:scale-105"
                                                    title="Eliminar todos los filtros activos"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                    <span>Limpiar filtros</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <RefreshCw
                                    className={`h-4 w-4 text-blue-400 cursor-pointer hover:text-blue-300 ${loading ? 'animate-spin' : ''}`}
                                    onClick={() => fetchData(sortField, sortDirection)}
                                />
                                <span>Total: <span className="text-blue-300">{totalCount}</span> registros</span>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-gradient-to-br from-gray-900/20 to-gray-900/40 rounded-xl border border-gray-800 overflow-x-auto overflow-y-auto mb-6 flex flex-col flex-grow max-h-[60vh] shadow-lg hover:shadow-xl transition-shadow">
                            <div className="flex-grow min-w-[800px]">
                                <table className="min-w-full divide-y divide-gray-800">
                                    <thead className="bg-black sticky top-0 z-10">
                                        <tr>
                                            <th className="px-2 py-3 w-10">
                                                <div className="flex justify-center">
                                                    <span className="sr-only">Seleccionar</span>
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('id_inv')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900 transition-colors group"
                                            >
                                                <div className="flex items-center gap-1">
                                                    ID Inventario
                                                    <ArrowUpDown className={`h-3.5 w-3.5 ${sortField === 'id_inv' ? 'text-blue-400 animate-pulse' : 'text-gray-500'} group-hover:text-blue-300 transition-colors`} />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('descripcion')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900 transition-colors group"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Descripción
                                                    <ArrowUpDown className={`h-3.5 w-3.5 ${sortField === 'descripcion' ? 'text-blue-400 animate-pulse' : 'text-gray-500'} group-hover:text-blue-300 transition-colors`} />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('area')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900 transition-colors group"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Área
                                                    <ArrowUpDown className={`h-3.5 w-3.5 ${sortField === 'area' ? 'text-blue-400 animate-pulse' : 'text-gray-500'} group-hover:text-blue-300 transition-colors`} />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('usufinal')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900 transition-colors group"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Responsable
                                                    <ArrowUpDown className={`h-3.5 w-3.5 ${sortField === 'usufinal' ? 'text-blue-400 animate-pulse' : 'text-gray-500'} group-hover:text-blue-300 transition-colors`} />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('estado')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900 transition-colors group"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Estado
                                                    <ArrowUpDown className={`h-3.5 w-3.5 ${sortField === 'estado' ? 'text-blue-400 animate-pulse' : 'text-gray-500'} group-hover:text-blue-300 transition-colors`} />
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-transparent divide-y divide-gray-800/50">
                                        {loading && !isLoadingMore ? (
                                            <tr className="h-96">
                                                <td colSpan={6} className="px-6 py-24 text-center text-gray-400">
                                                    <div className="flex flex-col items-center justify-center space-y-4">
                                                        <RefreshCw className="h-12 w-12 animate-spin text-blue-500" />
                                                        <p className="text-lg font-medium">Cargando datos...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : error ? (
                                            <tr className="h-96">
                                                <td colSpan={6} className="px-6 py-24 text-center">
                                                    <div className="flex flex-col items-center justify-center space-y-4 text-red-400">
                                                        <AlertCircle className="h-12 w-12" />
                                                        <p className="text-lg font-medium">Error al cargar datos</p>
                                                        <p className="text-sm text-gray-400">{error}</p>
                                                        <button
                                                            onClick={() => fetchData(sortField, sortDirection)}
                                                            className="px-4 py-2 bg-black text-blue-300 rounded-lg text-sm hover:bg-gray-900 transition-colors border border-gray-800 hover:border-blue-500"
                                                        >
                                                            Intentar nuevamente
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : paginatedMuebles.length === 0 ? (
                                            <tr className="h-96">
                                                <td colSpan={6} className="px-6 py-24 text-center text-gray-400">
                                                    <div className="flex flex-col items-center justify-center space-y-4">
                                                        <Search className="h-12 w-12 text-gray-500" />
                                                        <p className="text-lg font-medium">No se encontraron resultados</p>
                                                        {searchTerm && (
                                                            <button
                                                                onClick={() => setSearchTerm('')}
                                                                className="px-4 py-2 bg-black text-blue-400 rounded-lg text-sm hover:bg-gray-900 transition-colors flex items-center gap-2 border border-gray-800 hover:border-blue-500"
                                                            >
                                                                <X className="h-4 w-4" />
                                                                Limpiar búsqueda
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedMuebles.map((mueble) => {
                                                const isSelected = selectedMuebles.some(m => m.id === mueble.id);
                                                return (
                                                    <tr
                                                        key={`${mueble.id}`}
                                                        className={`hover:bg-gray-900/50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-900/10 border-l-2 border-blue-500' : ''}`}
                                                        onClick={() => toggleMuebleSelection(mueble)}
                                                    >
                                                        <td className="px-2 py-4">
                                                            <div className="flex justify-center">
                                                                <div className={`h-5 w-5 rounded border ${isSelected ? 'bg-blue-500 border-blue-300' : 'border-gray-700'} flex items-center justify-center transition-colors hover:border-blue-400`}>
                                                                    {isSelected && <CheckCircle className="h-4 w-4 text-white animate-pulse" />}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="text-sm font-medium text-white">
                                                                {mueble.id_inv}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {mueble.rubro}
                                                            </div>
                                                            <div className={`text-[10px] mt-1 font-mono px-2 py-0.5 rounded-full border inline-block
                                                                ${mueble.origen === 'INEA' ? 'bg-blue-900/30 text-blue-300 border-blue-700' :
                                                                    mueble.origen === 'ITEA' ? 'bg-pink-900/30 text-pink-200 border-pink-700' :
                                                                        'bg-gray-900/40 text-gray-400 border-gray-800'}`}
                                                            >
                                                                {mueble.origen}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="text-sm text-white">{truncateText(mueble.descripcion, 40)}</div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getColorClass(mueble.area)}`}>
                                                                {mueble.area || 'No especificada'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border gap-1 ${getColorClass(mueble.usufinal)}`}>
                                                                <User className="h-3.5 w-3.5 text-blue-400" />
                                                                {mueble.usufinal || 'No asignado'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                                ${mueble.estado === 'B' ? 'bg-green-900/20 text-green-300 border border-green-900' :
                                                                    mueble.estado === 'R' ? 'bg-yellow-900/20 text-yellow-300 border border-yellow-900' :
                                                                        mueble.estado === 'M' ? 'bg-red-900/20 text-red-300 border border-red-900' :
                                                                            mueble.estado === 'N' ? 'bg-blue-900/20 text-blue-300 border-blue-900' :
                                                                                'bg-gray-900/20 text-gray-300 border border-gray-900'}`}>
                                                                {mueble.estado}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                        {isLoadingMore && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                                                    <div className="flex justify-center items-center space-x-2">
                                                        <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
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
                            <div className="flex items-center justify-between bg-gradient-to-br from-gray-900/20 to-gray-900/40 p-4 rounded-xl border border-gray-800 shadow-inner mb-4 hover:shadow-lg transition-shadow">
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-400">
                                        Página <span className="text-blue-300">{currentPage}</span> de <span className="text-blue-300">{totalPages}</span>
                                    </span>
                                    <select
                                        title='Artículos por página'
                                        value={rowsPerPage}
                                        onChange={(e) => {
                                            setRowsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="bg-black border border-gray-800 rounded-lg text-white text-sm py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-500 transition-colors"
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
                                        className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-600 bg-black cursor-not-allowed' : 'text-white bg-black hover:bg-gray-900 border border-gray-800 hover:border-blue-500'} transition-colors`}
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button
                                        title='Siguiente'
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage >= totalPages}
                                        className={`p-2 rounded-lg ${currentPage >= totalPages ? 'text-gray-600 bg-black cursor-not-allowed' : 'text-white bg-black hover:bg-gray-900 border border-gray-800 hover:border-blue-500'} transition-colors`}
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right panel - Details */}
                    <div ref={detailRef} className="flex-1 bg-black p-4 border-t lg:border-t-0 lg:border-l border-gray-800 flex flex-col lg:col-span-2">
                        <div className="bg-gradient-to-br from-gray-900/20 to-gray-900/40 rounded-xl border border-gray-800 p-4 mb-4 shadow-inner hover:shadow-lg transition-shadow">
                            <h2 className="text-lg font-medium text-gray-100 mb-4 flex items-center gap-2">
                                <ActivitySquare className="h-5 w-5 text-blue-400 animate-pulse" />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-blue-100">
                                    Información del Resguardo
                                </span>
                            </h2>

                            {/* Director selection */}
                            <div className="mb-4">
                                <label className="text-sm font-medium text-gray-400 mb-1">Director de Área</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.directorId ? directorio.find(d => d.id_directorio.toString() === formData.directorId)?.nombre || directorSearchTerm : directorSearchTerm}
                                        onChange={handleDirectorInputChange}
                                        placeholder="Buscar director por nombre..."
                                        className="w-full bg-black border border-gray-800 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 appearance-none hover:border-blue-500 transition-colors"
                                        list="directores-list"
                                        disabled={inputsDisabled || directorInputDisabled}
                                        autoComplete="off"
                                    />
                                    <datalist id="directores-list">
                                        {directorio.map(d => (
                                            <option key={d.id_directorio} value={d.nombre} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                            <div className="mb-4 flex gap-4">
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-400 mb-1">Puesto</label>
                                    <input
                                        type="text"
                                        value={formData.puesto}
                                        onChange={e => setFormData(prev => ({ ...prev, puesto: e.target.value }))}
                                        placeholder="Puesto del director"
                                        className="w-full bg-black border border-gray-800 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-500 transition-colors"
                                        disabled={inputsDisabled}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-400 mb-1">Área</label>
                                    <select
                                        title="Selecciona un área"
                                        value={formData.area}
                                        onChange={e => setFormData(prev => ({ ...prev, area: e.target.value }))}
                                        disabled={!formData.directorId}
                                        className="w-full bg-black border border-gray-800 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-500 transition-colors"
                                    >
                                        <option value="">Selecciona un área</option>
                                        {getAreasForDirector(formData.directorId).map(a => (
                                            <option key={a.id_area} value={a.nombre}>{a.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Resguardante */}
                            <div className="mb-4">
                                <label className="text-sm font-medium text-gray-400 mb-1">Resguardante</label>
                                <input
                                    type="text"
                                    value={formData.resguardante}
                                    onChange={(e) => setFormData({ ...formData, resguardante: e.target.value })}
                                    placeholder="Nombre del resguardante"
                                    className="block w-full bg-black border border-gray-800 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-500 transition-colors"
                                    disabled={inputsDisabled}
                                />
                            </div>
                        </div>

                        {/* Selected Items */}
                        <div className="bg-gradient-to-br from-gray-900/20 to-gray-900/40 rounded-xl border border-gray-800 p-4 flex-grow overflow-y-hidden shadow-inner relative max-h-[70vh] hover:shadow-lg transition-shadow">
                            <h2 className="text-lg font-medium text-gray-100 mb-2 flex items-center gap-2 sticky top-0 z-20 bg-black/80 p-2 -m-2 backdrop-blur-md">
                                <LayoutGrid className="h-5 w-5 text-blue-400 animate-pulse" />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-blue-100">
                                    Artículos Seleccionados ({selectedMuebles.length})
                                </span>
                            </h2>

                            {selectedMuebles.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-gray-500">
                                    <TagIcon className="h-12 w-12 mb-2 text-gray-600" />
                                    <p className="text-sm">No hay artículos seleccionados</p>
                                    <p className="text-xs mt-1">Haga clic en un artículo para agregarlo</p>
                                </div>
                            ) : (
                                <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto pr-1">
                                    {selectedMuebles.map((mueble) => (
                                        <div key={`selected-${mueble.id}`} className="bg-black rounded-lg p-3 flex justify-between items-start border border-gray-800 shadow-sm hover:shadow-md transition-all hover:border-blue-500">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm font-medium text-white truncate">
                                                        {mueble.id_inv}
                                                    </div>
                                                    <div className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium 
                                                        ${mueble.estado === 'B' ? 'bg-green-900/20 text-green-300 border border-green-900' :
                                                            mueble.estado === 'R' ? 'bg-yellow-900/20 text-yellow-300 border border-yellow-900' :
                                                                mueble.estado === 'M' ? 'bg-red-900/20 text-red-300 border border-red-900' :
                                                                    mueble.estado === 'N' ? 'bg-blue-900/20 text-blue-300 border border-blue-900' :
                                                                        'bg-gray-900/20 text-gray-300 border border-gray-900'}`}>
                                                        {mueble.estado}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-300 mt-1 truncate">
                                                    {mueble.descripcion}
                                                </p>
                                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                    <Briefcase className="h-3 w-3" />
                                                    {mueble.rubro}
                                                </div>
                                                <div className={`text-[10px] mt-1 font-mono px-2 py-0.5 rounded-full border inline-block
                                                    ${mueble.origen === 'INEA' ? 'bg-blue-900/30 text-blue-300 border-blue-700' :
                                                        mueble.origen === 'ITEA' ? 'bg-pink-900/30 text-pink-200 border-pink-700' :
                                                            'bg-gray-900/40 text-gray-400 border-gray-800'}`}
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
                                                        className="block w-full bg-gray-900/50 border border-gray-800 rounded-lg py-1.5 px-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-500 transition-colors"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                title='Eliminar artículo'
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeSelectedMueble(mueble);
                                                }}
                                                className="ml-2 p-1 text-gray-400 hover:text-red-400 rounded-full hover:bg-gray-900/50 transition-colors"
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
                                className={`px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-all
                                    ${selectedMuebles.length === 0 ? 'bg-black text-gray-600 border border-gray-800 cursor-not-allowed' : 'bg-black text-gray-300 border border-gray-700 hover:bg-gray-900 hover:border-blue-500 hover:text-blue-300'}`}
                            >
                                <X className="h-4 w-4" />
                                Limpiar Selección
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!isFormValid || loading}
                                className={`px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 flex-grow sm:flex-grow-0 transition-all transform hover:scale-[1.02]
                                    ${!isFormValid || loading ?
                                        'bg-blue-900/10 text-blue-300/50 border border-blue-900/20 cursor-not-allowed' :
                                        'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 shadow-lg hover:shadow-blue-500/30'}`}
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
                <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-red-900/80 text-red-100 px-4 py-3 rounded-lg shadow-lg border border-red-800 z-50 backdrop-blur-sm animate-fade-in">
                    <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 animate-pulse" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                        <button
                            title='Cerrar alerta'
                            onClick={() => setError(null)}
                            className="ml-4 flex-shrink-0 p-1 rounded-full text-red-200 hover:text-white hover:bg-red-800 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Missing Director Data Error Alert */}
            {showMissingDirectorDataError && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-900/90 text-yellow-100 px-6 py-4 rounded-lg shadow-lg border border-yellow-700 flex items-center gap-4 animate-fade-in">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 animate-pulse" />
                    <span className="font-medium">Faltan datos del director. Debes completar el área y el puesto para continuar.</span>
                    <button
                        onClick={() => setShowDirectorModal(true)}
                        className="ml-4 px-3 py-1 rounded bg-yellow-600 text-black font-semibold hover:bg-yellow-500 transition-colors"
                    >
                        Completar datos
                    </button>
                </div>
            )}

            {/* Director Modal */}
            {showDirectorModal && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 animate-fadeIn">
                    <div className="bg-black rounded-2xl shadow-2xl border border-yellow-600/30 w-full max-w-md overflow-hidden transition-all duration-300 transform hover:border-yellow-500/50">
                        <div className="relative p-6 bg-gradient-to-b from-black to-gray-900">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500/60 via-yellow-400 to-yellow-500/60 animate-pulse"></div>

                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="p-3 bg-yellow-500/10 rounded-full border border-yellow-500/30 mb-3 animate-pulse">
                                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">¡Ups! Falta información</h3>
                                <p className="text-gray-400 mt-2">
                                    Necesitamos algunos datos adicionales del director seleccionado para Continuar
                                </p>
                            </div>

                            <div className="space-y-5 mt-6">
                                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 hover:border-yellow-500 transition-colors">
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Director seleccionado</label>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-800 rounded-lg">
                                            <UserCheck className="h-4 w-4 text-yellow-400 animate-pulse" />
                                        </div>
                                        <span className="text-white font-medium">{incompleteDirector?.nombre || 'Director'}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-gray-400" />
                                        Área
                                    </label>
                                    <input
                                        type="text"
                                        value={directorFormData.area}
                                        onChange={e => setDirectorFormData(prev => ({ ...prev, area: e.target.value }))}
                                        placeholder="Escribe el área asignada al director"
                                        className="block w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                        <Users className="h-4 w-4 text-gray-400" />
                                        Puesto
                                    </label>
                                    <input
                                        type="text"
                                        value={directorFormData.puesto}
                                        onChange={(e) => setDirectorFormData({ ...directorFormData, puesto: e.target.value })}
                                        placeholder="Ej: Director General, Gerente, Supervisor..."
                                        className="block w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-colors"
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

                        <div className="p-5 bg-black border-t border-gray-800 flex justify-end gap-3">
                            <button
                                onClick={handleCloseDirectorModal}
                                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 border border-gray-800 transition-colors flex items-center gap-2 hover:border-yellow-500"
                            >
                                <X className="h-4 w-4" />
                                Cancelar
                            </button>
                            <button
                                onClick={saveDirectorInfo}
                                disabled={savingDirector || !directorFormData.area || !directorFormData.puesto || isUsuario}
                                className={`px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all duration-300 transform hover:scale-[1.02]
                                    ${savingDirector || !directorFormData.area || !directorFormData.puesto || isUsuario ?
                                        'bg-gray-900 text-gray-500 cursor-not-allowed border border-gray-800' :
                                        'bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-medium hover:shadow-lg hover:shadow-yellow-500/20'}`}
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
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 animate-fadeIn">
                    <div className="bg-black rounded-2xl shadow-2xl border border-red-600/30 w-full max-w-md overflow-hidden transition-all duration-300 transform hover:border-red-500/50">
                        <div className="relative p-6 bg-gradient-to-b from-black to-gray-900">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/60 via-red-400 to-red-500/60 animate-pulse"></div>
                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="p-3 bg-red-500/10 rounded-full border border-red-500/30 mb-3 animate-pulse">
                                    <AlertTriangle className="h-8 w-8 text-red-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">No se puede agregar</h3>
                                <p className="text-gray-400 mt-2">
                                    Solo puedes seleccionar bienes que pertenezcan al mismo responsable.
                                </p>
                                <p className="text-red-300 mt-2 text-sm">
                                    El bien que intentas agregar actualmente pertenece a: <span className="font-semibold">{conflictUsufinal}</span>
                                </p>
                                <p className='text-gray-700 text-xs italic pt-3'>Te sugerimos editar las características del bien.</p>
                            </div>
                        </div>
                        <div className="p-5 bg-black border-t border-gray-800 flex justify-end gap-3">
                            <button
                                onClick={() => setShowUsufinalModal(false)}
                                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 border border-gray-800 transition-colors flex items-center gap-2 hover:border-red-500"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-blue-900/90 to-blue-700/90 rounded-2xl p-8 w-full max-w-md border-2 border-blue-500 shadow-2xl animate-fade-in">
                        <div className="flex items-center gap-3 mb-4">
                            <svg className="h-8 w-8 text-blue-300 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
                            <h3 className="text-xl font-bold text-blue-100">No puedes agregar artículos de diferentes áreas</h3>
                        </div>
                        <p className="text-blue-100 mb-6 text-base">Todos los artículos seleccionados deben pertenecer a la misma área.<br />Área en conflicto: <span className="font-semibold text-blue-200">{conflictArea}</span></p>
                        <div className="flex justify-end gap-2">
                            <button
                                className="px-5 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800 border border-blue-400 shadow-md transition-all"
                                onClick={() => setShowAreaConflictModal(false)}
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para descargar PDF tras guardar */}
            {showPDFButton && pdfData && (
                <div
                    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 animate-fadeIn"
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
                        className="bg-black rounded-2xl shadow-2xl border border-green-600/30 w-full max-w-md overflow-hidden transition-all duration-300 transform hover:border-green-500/50"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="relative p-6 bg-gradient-to-b from-black to-gray-900">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500/60 via-green-400 to-green-500/60 animate-pulse"></div>

                            <button
                                onClick={() => {
                                    const hasPdfBeenDownloaded = sessionStorage.getItem('pdfDownloaded') === 'true';
                                    if (!hasPdfBeenDownloaded) {
                                        setShowWarningModal(true);
                                    } else {
                                        setShowPDFButton(false);
                                    }
                                }}
                                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-gray-900 text-green-400 hover:text-green-500 border border-green-500/30 transition-colors"
                                title="Cerrar"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="p-3 bg-green-500/10 rounded-full border border-green-500/30 mb-3 animate-pulse">
                                    <FileDigit className="h-8 w-8 text-green-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Resguardo generado</h3>
                                <p className="text-gray-400 mt-2">
                                    Descarga el PDF del resguardo para imprimir o compartir
                                </p>
                            </div>

                            <div className="space-y-5 mt-6">
                                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 hover:border-green-500 transition-colors">
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Documento generado</label>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-800 rounded-lg">
                                            <FileText className="h-4 w-4 text-green-400 animate-pulse" />
                                        </div>
                                        <span className="text-white font-medium">Resguardo {pdfData.folio}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleGeneratePDF}
                                    disabled={generatingPDF}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-black font-medium rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-green-500/30"
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
                <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[60] px-4 animate-fadeIn">
                    <div className="bg-gray-900 rounded-xl shadow-2xl border border-red-500/30 w-full max-w-sm p-6 hover:border-red-500/50 transition-colors">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="p-3 bg-red-500/10 rounded-full border border-red-500/30 animate-pulse">
                                <AlertTriangle className="h-7 w-7 text-red-500" />
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">¿Cerrar sin descargar?</h3>
                                <p className="text-gray-400 text-sm">
                                    No has descargado el PDF. Si cierras esta ventana, no podrás volver a generar este documento por ahora.
                                </p>
                            </div>

                            <div className="flex gap-3 w-full mt-2">
                                <button
                                    onClick={() => setShowWarningModal(false)}
                                    className="flex-1 py-2 px-4 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors hover:border-blue-500"
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
        </div>
    );
}