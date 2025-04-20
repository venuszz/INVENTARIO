"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search, ChevronLeft, ChevronRight, ArrowUpDown,
    AlertCircle, X, Save, ActivitySquare,
    LayoutGrid, TagIcon, Building2,
    User, AlertTriangle, Calendar, Info,
    CheckCircle, RefreshCw, UserCheck, Briefcase,
    Trash2, ListChecks, FileDigit, Users, FileText, Download
} from 'lucide-react';
import supabase from '@/app/lib/supabase/client';
import Cookies from 'js-cookie';
import dynamic from 'next/dynamic';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ResguardoPDF } from './ResguardoPDFReport';

// Importar el componente PDF de forma dinámica para evitar SSR
const ResguardoPDFReport = dynamic(() => import('./ResguardoPDFReport'), { ssr: false });

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
    resguardante: string;
    area: string;
    puesto: string;
}

// Utilidad para asignar color a áreas y responsables
const colorPalette = [
    'bg-blue-900/30 text-blue-200 border-blue-700',
    'bg-green-900/30 text-green-200 border-green-700',
    'bg-yellow-900/30 text-yellow-200 border-yellow-700',
    'bg-purple-900/30 text-purple-200 border-purple-700',
    'bg-pink-900/30 text-pink-200 border-pink-700',
    'bg-red-900/30 text-red-200 border-red-700',
    'bg-cyan-900/30 text-cyan-200 border-cyan-700',
    'bg-orange-900/30 text-orange-200 border-orange-700',
    'bg-teal-900/30 text-teal-200 border-teal-700',
    'bg-indigo-900/30 text-indigo-200 border-indigo-700',
    'bg-gray-900/30 text-gray-200 border-gray-700',
];
function getColorClass(value: string | null | undefined) {
    if (!value) return 'bg-gray-900/20 text-gray-300 border border-gray-900';
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = value.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colorPalette.length;
    return colorPalette[idx];
}

export default function CrearResguardos() {
    const [filteredMuebles, setFilteredMuebles] = useState<Mueble[]>([]);
    const [directorio, setDirectorio] = useState<Directorio[]>([]);
    const [selectedMuebles, setSelectedMuebles] = useState<Mueble[]>([]);
    const [formData, setFormData] = useState<ResguardoForm>({
        folio: '',
        directorId: '',
        resguardante: '',
        area: '',
        puesto: ''
    });
    const [showDirectorModal, setShowDirectorModal] = useState(false);
    const [incompleteDirector, setIncompleteDirector] = useState<Directorio | null>(null);
    const [directorFormData, setDirectorFormData] = useState({ area: '', puesto: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortField, setSortField] = useState<keyof Mueble>('id_inv');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [loading, setLoading] = useState(false);
    const [savingDirector, setSavingDirector] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoadingMore] = useState(false);
    const detailRef = useRef<HTMLDivElement>(null);
    const [showUsufinalModal, setShowUsufinalModal] = useState(false);
    const [conflictUsufinal, setConflictUsufinal] = useState<string | null>(null);
    const [areaFilter, setAreaFilter] = useState<string>('');
    const [responsableFilter, setResponsableFilter] = useState<string>('');
    const [uniqueAreas, setUniqueAreas] = useState<string[]>([]);
    const [uniqueResponsables, setUniqueResponsables] = useState<string[]>([]);
    const [showWarningModal, setShowWarningModal] = useState(false);

    interface PdfArticulo {
        id_inv: string | null;
        descripcion: string | null;
        rubro: string | null;
        estado: string | null;
    }

    interface PdfData {
        folio: string;
        fecha: string;
        director: string | undefined;
        area: string;
        puesto: string;
        resguardante: string;
        articulos: PdfArticulo[];
    }

    const [pdfData, setPdfData] = useState<PdfData | null>(null);
    const [showPDFButton, setShowPDFButton] = useState(false);

    // Fetch data with pagination directly from database
    const fetchData = useCallback(async (
        page = 1,
        rowsPerPage = 10,
        searchQuery = '',
        sortField = 'id_inv',
        sortDir = 'asc',
        areaFilter = '',
        responsableFilter = ''
    ) => {
        setLoading(true);
        try {
            // Fetch total counts first (solo de muebles activos)
            const mueblesCountQuery = supabase
                .from('muebles')
                .select('*', { count: 'exact', head: true })
                .ilike('estatus', 'ACTIVO');

            const mueblesIteaCountQuery = supabase
                .from('mueblesitea')
                .select('*', { count: 'exact', head: true })
                .ilike('estatus', 'ACTIVO');

            // Aplicar filtros adicionales al conteo si están presentes
            if (areaFilter) {
                mueblesCountQuery.ilike('area', `%${areaFilter}%`);
                mueblesIteaCountQuery.ilike('area', `%${areaFilter}%`);
            }

            if (responsableFilter) {
                mueblesCountQuery.ilike('usufinal', `%${responsableFilter}%`);
                mueblesIteaCountQuery.ilike('usufinal', `%${responsableFilter}%`);
            }

            const [mueblesCountResult, mueblesIteaCountResult] = await Promise.all([
                mueblesCountQuery,
                mueblesIteaCountQuery
            ]);

            const totalItems = (mueblesCountResult.count || 0) + (mueblesIteaCountResult.count || 0);
            setTotalCount(totalItems);

            // Calculate range for pagination
            const from = (page - 1) * rowsPerPage;
            const to = from + rowsPerPage - 1;

            // Build base queries with estado filter
            let mueblesQuery = supabase
                .from('muebles')
                .select('id, id_inv, descripcion, estatus, resguardante, rubro, estado, usufinal, area')
                .eq('estatus', 'ACTIVO')
                .range(from, to)
                .order(sortField, { ascending: sortDir === 'asc' });

            let mueblesIteaQuery = supabase
                .from('mueblesitea')
                .select('id, id_inv, descripcion, estatus, resguardante, rubro, estado, usufinal, area')
                .eq('estatus', 'ACTIVO')
                .range(from, to)
                .order(sortField, { ascending: sortDir === 'asc' });

            // Apply search if provided
            if (searchQuery) {
                mueblesQuery = supabase
                    .from('muebles')
                    .select('id, id_inv, descripcion, estatus, resguardante, rubro, estado, usufinal, area')
                    .eq('estatus', 'ACTIVO')
                    .or(`id_inv.ilike.%${searchQuery}%,descripcion.ilike.%${searchQuery}%`)
                    .range(from, to)
                    .order(sortField, { ascending: sortDir === 'asc' });

                mueblesIteaQuery = supabase
                    .from('mueblesitea')
                    .select('id, id_inv, descripcion, estatus, resguardante, rubro, estado, usufinal, area')
                    .eq('estatus', 'ACTIVO')
                    .or(`id_inv.ilike.%${searchQuery}%,descripcion.ilike.%${searchQuery}%`)
                    .range(from, to)
                    .order(sortField, { ascending: sortDir === 'asc' });
            }

            // Aplicar filtros adicionales
            if (areaFilter) {
                mueblesQuery = mueblesQuery.ilike('area', `%${areaFilter}%`);
                mueblesIteaQuery = mueblesIteaQuery.ilike('area', `%${areaFilter}%`);
            }

            if (responsableFilter) {
                mueblesQuery = mueblesQuery.ilike('usufinal', `%${responsableFilter}%`);
                mueblesIteaQuery = mueblesIteaQuery.ilike('usufinal', `%${responsableFilter}%`);
            }

            // Execute queries
            const [mueblesResult, mueblesIteaResult] = await Promise.all([
                mueblesQuery,
                mueblesIteaQuery
            ]);

            const combinedData = [
                ...(mueblesResult.data || []),
                ...(mueblesIteaResult.data || [])
            ];

            // Apply client-side sorting for combined results
            combinedData.sort((a, b) => {
                const aValue = a[sortField as keyof Mueble] || '';
                const bValue = b[sortField as keyof Mueble] || '';

                if (aValue < bValue) return sortDir === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortDir === 'asc' ? 1 : -1;
                return 0;
            });

            // Limit to rowsPerPage
            const paginatedResults = combinedData.slice(0, rowsPerPage);

            setFilteredMuebles(paginatedResults as Mueble[]);

            // Fetch directorio
            const { data: directorioData } = await supabase.from('directorio').select('*');
            setDirectorio(directorioData || []);

            // Obtener valores únicos para los filtros - desde tablas completas
            const allDataQuery = supabase.from('muebles').select('area, usufinal').eq('estatus', 'ACTIVO');
            const allDataIteaQuery = supabase.from('mueblesitea').select('area, usufinal').eq('estatus', 'ACTIVO');

            const [allData, allDataItea] = await Promise.all([allDataQuery, allDataIteaQuery]);

            const allAreas = new Set<string>();
            const allResponsables = new Set<string>();

            // Procesar datos para obtener valores únicos
            [...(allData.data || []), ...(allDataItea.data || [])].forEach(item => {
                if (item.area) allAreas.add(item.area);
                if (item.usufinal) allResponsables.add(item.usufinal);
            });

            setUniqueAreas(Array.from(allAreas).sort());
            setUniqueResponsables(Array.from(allResponsables).sort());

            setError(null);
        } catch (err) {
            setError('Error al cargar los datos');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(currentPage, rowsPerPage, searchTerm, sortField, sortDirection, areaFilter, responsableFilter);
    }, [fetchData, currentPage, rowsPerPage, searchTerm, sortField, sortDirection, areaFilter, responsableFilter]);

    // Generate unique folio
    const generateFolio = useCallback(async () => {
        try {
            // Formato: RES-YYYYMMDD-XXX (XXX es un número secuencial diario)
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const datePart = `${year}${month}${day}`;

            // Obtener los folios únicos creados hoy para calcular el secuencial
            const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
            const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

            // Traer todos los folios del día
            const { data, error } = await supabase
                .from('resguardos')
                .select('folio')
                .gte('f_resguardo', startOfDay)
                .lte('f_resguardo', endOfDay);

            if (error) throw error;

            // Contar folios únicos
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
        // Generate folio when component mounts
        if (!formData.folio) {
            generateFolio();
        }
    }, [formData.folio, generateFolio]);

    // Check if director from usufinal exists and select them
    const checkDirectorMatch = useCallback((mueble: Mueble) => {
        if (!mueble.usufinal || !directorio.length) return;

        // Buscar si el usufinal coincide con algún nombre del directorio
        const matchingDirector = directorio.find(dir =>
            dir.nombre.toLowerCase() === mueble.usufinal?.toLowerCase()
        );

        if (matchingDirector) {
            // Siempre actualizar el directorId aunque falte información
            setFormData(prev => ({
                ...prev,
                directorId: matchingDirector.id_directorio.toString(),
                area: matchingDirector.area || '',
                puesto: matchingDirector.puesto || ''
            }));
            if (!matchingDirector.area || !matchingDirector.puesto) {
                setIncompleteDirector(matchingDirector);
                setDirectorFormData({
                    area: matchingDirector.area || '',
                    puesto: matchingDirector.puesto || ''
                });
                setShowDirectorModal(true);
            }
        }
    }, [directorio]);

    // Save director info
    const saveDirectorInfo = async () => {
        if (!incompleteDirector) return;

        setSavingDirector(true);
        try {
            const { error: updateError } = await supabase
                .from('directorio')
                .update({
                    area: directorFormData.area,
                    puesto: directorFormData.puesto
                })
                .eq('id_directorio', incompleteDirector.id_directorio);

            if (updateError) throw updateError;

            // Update local state
            setDirectorio(prev => prev.map(d =>
                d.id_directorio === incompleteDirector.id_directorio
                    ? { ...d, area: directorFormData.area, puesto: directorFormData.puesto }
                    : d
            ));

            // Update form data
            setFormData(prev => ({
                ...prev,
                directorId: incompleteDirector.id_directorio.toString(),
                area: directorFormData.area,
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

    // Select/deselect mueble
    const toggleMuebleSelection = (mueble: Mueble) => {
        // Check if already selected
        const isAlreadySelected = selectedMuebles.some(m => m.id === mueble.id);

        let newSelectedMuebles: Mueble[];
        if (isAlreadySelected) {
            // If already selected, remove it
            newSelectedMuebles = selectedMuebles.filter(m => m.id !== mueble.id);
        } else {
            // Validar que todos los seleccionados tengan el mismo usufinal
            const currentUsufinal = selectedMuebles[0]?.usufinal?.trim().toUpperCase();
            const newUsufinal = mueble.usufinal?.trim().toUpperCase();
            if (selectedMuebles.length > 0 && currentUsufinal && newUsufinal && currentUsufinal !== newUsufinal) {
                setConflictUsufinal(newUsufinal || '');
                setShowUsufinalModal(true);
                return;
            }
            newSelectedMuebles = [...selectedMuebles, mueble];
        }

        setSelectedMuebles(newSelectedMuebles);

        // Si la lista queda vacía, limpiar datos del director
        if (newSelectedMuebles.length === 0) {
            setFormData(prev => ({
                ...prev,
                directorId: '',
                area: '',
                puesto: ''
            }));
        } else if (!isAlreadySelected && newSelectedMuebles.length === 1) {
            // Si es el primer seleccionado, intentar seleccionar director
            checkDirectorMatch(mueble);
        } else if (!isAlreadySelected && newSelectedMuebles.length > 1) {
            // Si hay más de un artículo, asegurar que el director corresponde al usufinal
            const first = newSelectedMuebles[0];
            checkDirectorMatch(first);
        }

        if (window.innerWidth < 768 && detailRef.current) {
            setTimeout(() => {
                detailRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    // Handle form submit
    const handleSubmit = async () => {
        if (selectedMuebles.length === 0) {
            setError('Seleccione al menos un artículo para crear el resguardo');
            return;
        }

        if (!formData.directorId) {
            setError('Complete todos los campos obligatorios');
            return;
        }

        // Validación: área y puesto deben estar presentes
        if (!formData.area || !formData.puesto) {
            setError('No se puede crear el resguardo: el área y el puesto del director son obligatorios.');
            return;
        }

        let folioToUse = formData.folio;
        if (!folioToUse) {
            folioToUse = await generateFolio() || '';
            if (!folioToUse) return;
        }

        // Obtener usuario logueado de la cookie
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

            const resguardoPromises = selectedMuebles.map(async (mueble) => {
                // Determine which table to update
                const tableName = mueble.id_inv?.startsWith('ITEA') ? 'mueblesitea' : 'muebles';

                // Update mueble
                const { error: updateError } = await supabase
                    .from(tableName)
                    .update({ resguardante: formData.resguardante })
                    .eq('id', mueble.id);

                if (updateError) throw updateError;

                // Create resguardo
                const { error: insertError } = await supabase.from('resguardos').insert({
                    folio: folioToUse,
                    f_resguardo: new Date().toISOString(),
                    area_resguardo: formData.area,
                    dir_area: directorio.find(d => d.id_directorio.toString() === formData.directorId)?.nombre,
                    num_inventario: mueble.id_inv,
                    descripcion: mueble.descripcion,
                    rubro: mueble.rubro,
                    condicion: mueble.estado,
                    usufinal: formData.resguardante,
                    created_by: createdBy,
                });

                if (insertError) throw insertError;
            });

            await Promise.all(resguardoPromises);

            // Guardar datos para el PDF
            setPdfData({
                folio: folioToUse,
                fecha: new Date().toLocaleDateString(),
                director: directorio.find(d => d.id_directorio.toString() === formData.directorId)?.nombre,
                area: formData.area,
                puesto: formData.puesto,
                resguardante: formData.resguardante,
                articulos: selectedMuebles.map(m => ({
                    id_inv: m.id_inv,
                    descripcion: m.descripcion,
                    rubro: m.rubro,
                    estado: m.estado
                }))
            });
            setShowPDFButton(true);
            sessionStorage.setItem('pdfDownloaded', 'false'); // <-- Limpia el flag al generar nuevo PDF

            // Reset form but keep the folio for next group if needed
            setFormData(prev => ({
                ...prev,
                resguardante: ''
            }));
            setSelectedMuebles([]);
            setSuccessMessage(`Resguardo ${folioToUse} creado correctamente con ${selectedMuebles.length} artículo(s)`);
            setTimeout(() => setSuccessMessage(null), 3000);

            // Refresh data
            fetchData(currentPage, rowsPerPage, searchTerm, sortField, sortDirection, areaFilter, responsableFilter);

        } catch (err) {
            setError('Error al guardar el resguardo');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Handle sort
    const handleSort = (field: keyof Mueble) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1); // Reset to first page on sort change
    };

    // Remove item from selection
    const removeSelectedMueble = (mueble: Mueble) => {
        setSelectedMuebles(prev => prev.filter(m => m.id !== mueble.id));
    };

    // Reset folio to generate a new one
    const resetFolio = () => {
        generateFolio();
    };

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / rowsPerPage);

    return (
        <div className="bg-black text-white min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
            {/* Success message toast */}
            {successMessage && (
                <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-green-900/80 text-green-100 px-4 py-2 rounded-lg shadow-lg border border-green-700 backdrop-blur-sm animate-fade-in">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>{successMessage}</span>
                </div>
            )}

            <div className="w-full mx-auto bg-black rounded-lg sm:rounded-xl shadow-2xl overflow-hidden transition-all duration-500 transform border border-gray-800">
                {/* Header */}
                <div className="bg-black p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 gap-2 sm:gap-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
                        <span className="mr-2 sm:mr-3 bg-gray-900 text-white p-1 sm:p-2 rounded-lg border border-gray-700 text-sm sm:text-base">RES</span>
                        Creación de Resguardos
                    </h1>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <p className="text-gray-400 text-sm sm:text-base flex items-center gap-2">
                            <ListChecks className="h-4 w-4 text-blue-400" />
                            <span className="font-medium">{selectedMuebles.length}</span> artículos seleccionados
                        </p>
                        <p className="text-gray-400 text-sm sm:text-base flex items-center gap-2">
                            <Info className="h-4 w-4 text-blue-400" />
                            Seleccione artículos para el resguardo
                        </p>
                    </div>
                </div>

                {/* Main container */}
                <div className="grid grid-cols-1 lg:grid-cols-5 h-full flex-1">
                    {/* Left panel - Muebles table */}
                    <div className="flex-1 min-w-0 flex flex-col p-4 lg:col-span-3">
                        {/* Folio and director information */}
                        <div className="mb-6 bg-gray-900/20 p-4 rounded-xl border border-gray-800 shadow-inner">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-black p-3 rounded-lg border border-gray-800 flex flex-col">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs uppercase text-gray-500 font-medium">Folio</span>
                                        <button
                                            onClick={resetFolio}
                                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                        >
                                            <RefreshCw className="h-3 w-3" />
                                            Nuevo
                                        </button>
                                    </div>
                                    <div className="flex items-center">
                                        <FileDigit className="h-4 w-4 text-blue-400 mr-2" />
                                        <span className="text-sm font-medium text-white">{formData.folio || 'Generando...'}</span>
                                    </div>
                                </div>

                                <div className="bg-black p-3 rounded-lg border border-gray-800 flex flex-col">
                                    <span className="text-xs uppercase text-gray-500 font-medium mb-1">Director de Área</span>
                                    <div className="flex items-center">
                                        <Building2 className="h-4 w-4 text-blue-400 mr-2" />
                                        <span className="text-sm text-white">
                                            {formData.directorId ?
                                                directorio.find(d => d.id_directorio.toString() === formData.directorId)?.nombre || 'Seleccionar' :
                                                'Seleccionar'}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-black p-3 rounded-lg border border-gray-800 flex flex-col">
                                    <span className="text-xs uppercase text-gray-500 font-medium mb-1">Fecha</span>
                                    <div className="flex items-center">
                                        <Calendar className="h-4 w-4 text-blue-400 mr-2" />
                                        <span className="text-sm text-white">{new Date().toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search and filters */}
                        <div className="mb-6 bg-gray-900/20 p-4 rounded-xl border border-gray-800 shadow-inner">
                            <div className="flex flex-col gap-4">
                                {/* Búsqueda */}
                                <div className="relative flex-grow">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-blue-400/80" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Buscar por ID o descripción..."
                                        className="pl-10 pr-4 py-3 w-full bg-black border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Filtros */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Filtro por Área */}
                                    <div className="relative">
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Filtrar por Área</label>
                                        <select
                                            title='Filtro para Áreas'
                                            value={areaFilter}
                                            onChange={(e) => setAreaFilter(e.target.value)}
                                            className="w-full bg-black border border-gray-800 rounded-xl text-white py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Todas las áreas</option>
                                            {uniqueAreas.map((area) => (
                                                <option key={area} value={area}>{area}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtro por Responsable */}
                                    <div className="relative">
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Filtrar por Responsable</label>
                                        <select
                                            title='Filtro de los Responsables'
                                            value={responsableFilter}
                                            onChange={(e) => setResponsableFilter(e.target.value)}
                                            className="w-full bg-black border border-gray-800 rounded-xl text-white py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Todos los responsables</option>
                                            {uniqueResponsables.map((resp) => (
                                                <option key={resp} value={resp}>{resp}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Botones y conteo */}
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setSearchTerm('');
                                                setAreaFilter('');
                                                setResponsableFilter('');
                                            }}
                                            className="px-4 py-2 bg-black border border-gray-800 text-gray-400 rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2 text-sm"
                                        >
                                            <X className="h-4 w-4" />
                                            Limpiar filtros
                                        </button>
                                        <button
                                            onClick={() => fetchData(1, rowsPerPage, searchTerm, sortField, sortDirection, areaFilter, responsableFilter)}
                                            className="px-4 py-2 bg-blue-600/20 border border-blue-800 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors flex items-center gap-2 text-sm"
                                        >
                                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                            Actualizar
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <RefreshCw
                                            className={`h-4 w-4 text-blue-400 cursor-pointer hover:text-blue-300 ${loading ? 'animate-spin' : ''}`}
                                            onClick={() => fetchData(currentPage, rowsPerPage, searchTerm, sortField, sortDirection, areaFilter, responsableFilter)}
                                        />
                                        <span>Total: {totalCount} registros</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-gray-900/20 rounded-xl border border-gray-800 overflow-x-auto overflow-y-auto mb-6 flex flex-col flex-grow max-h-[60vh] shadow-lg">
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
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900 transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    ID Inventario
                                                    <ArrowUpDown className={`h-3.5 w-3.5 ${sortField === 'id_inv' ? 'text-blue-400' : 'text-gray-500'}`} />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('descripcion')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900 transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Descripción
                                                    <ArrowUpDown className={`h-3.5 w-3.5 ${sortField === 'descripcion' ? 'text-blue-400' : 'text-gray-500'}`} />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('area')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900 transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Área
                                                    <ArrowUpDown className={`h-3.5 w-3.5 ${sortField === 'area' ? 'text-blue-400' : 'text-gray-500'}`} />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('usufinal')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900 transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Responsable
                                                    <ArrowUpDown className={`h-3.5 w-3.5 ${sortField === 'usufinal' ? 'text-blue-400' : 'text-gray-500'}`} />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('estado')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900 transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Estado
                                                    <ArrowUpDown className={`h-3.5 w-3.5 ${sortField === 'estado' ? 'text-blue-400' : 'text-gray-500'}`} />
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
                                                            onClick={() => fetchData(currentPage, rowsPerPage, searchTerm, sortField, sortDirection, areaFilter, responsableFilter)}
                                                            className="px-4 py-2 bg-black text-blue-300 rounded-lg text-sm hover:bg-gray-900 transition-colors border border-gray-800"
                                                        >
                                                            Intentar nuevamente
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredMuebles.length === 0 ? (
                                            <tr className="h-96">
                                                <td colSpan={6} className="px-6 py-24 text-center text-gray-400">
                                                    <div className="flex flex-col items-center justify-center space-y-4">
                                                        <Search className="h-12 w-12 text-gray-500" />
                                                        <p className="text-lg font-medium">No se encontraron resultados</p>
                                                        {searchTerm && (
                                                            <button
                                                                onClick={() => setSearchTerm('')}
                                                                className="px-4 py-2 bg-black text-blue-400 rounded-lg text-sm hover:bg-gray-900 transition-colors flex items-center gap-2 border border-gray-800"
                                                            >
                                                                <X className="h-4 w-4" />
                                                                Limpiar búsqueda
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredMuebles.map((mueble) => {
                                                const isSelected = selectedMuebles.some(m => m.id === mueble.id);
                                                return (
                                                    <tr
                                                        key={`${mueble.id}`}
                                                        className={`hover:bg-gray-900/50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-900/10 border-l-2 border-blue-500' : ''}`}
                                                        onClick={() => toggleMuebleSelection(mueble)}
                                                    >
                                                        <td className="px-2 py-4">
                                                            <div className="flex justify-center">
                                                                <div className={`h-5 w-5 rounded border ${isSelected ? 'bg-blue-500 border-blue-300' : 'border-gray-700'} flex items-center justify-center`}>
                                                                    {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
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
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="text-sm text-white">{mueble.descripcion}</div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getColorClass(mueble.area)}`}>{mueble.area || 'No especificada'}</div>
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
                                                                            mueble.estado === 'N' ? 'bg-blue-900/20 text-blue-300 border border-blue-900' :
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
                        {filteredMuebles.length > 0 && (
                            <div className="flex items-center justify-between bg-gray-900/20 p-4 rounded-xl border border-gray-800 shadow-inner mb-4">
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-400">
                                        Página {currentPage} de {totalPages}
                                    </span>
                                    <select
                                        title='Artículos por página'
                                        value={rowsPerPage}
                                        onChange={(e) => {
                                            setRowsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="bg-black border border-gray-800 rounded-lg text-white text-sm py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-600 bg-black cursor-not-allowed' : 'text-white bg-black hover:bg-gray-900 border border-gray-800'}`}
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button
                                        title='Siguiente'
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage >= totalPages}
                                        className={`p-2 rounded-lg ${currentPage >= totalPages ? 'text-gray-600 bg-black cursor-not-allowed' : 'text-white bg-black hover:bg-gray-900 border border-gray-800'}`}
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right panel - Details */}
                    <div ref={detailRef} className="flex-1 bg-black p-4 border-t lg:border-t-0 lg:border-l border-gray-800 flex flex-col lg:col-span-2">
                        <div className="bg-gray-900/20 rounded-xl border border-gray-800 p-4 mb-4 shadow-inner">
                            <h2 className="text-lg font-medium text-gray-100 mb-4 flex items-center gap-2">
                                <ActivitySquare className="h-5 w-5 text-blue-400" />
                                Información del Resguardo
                            </h2>

                            {/* Director selection */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-400 mb-1">Director de Área</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.directorId ? directorio.find(d => d.id_directorio.toString() === formData.directorId)?.nombre || '' : ''}
                                        readOnly
                                        className="block w-full bg-black border border-gray-800 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 appearance-none"
                                        placeholder="Director de Área"
                                    />
                                </div>
                                {/* Advertencia de área o puesto solo si hay artículos seleccionados y falta info */}
                                {selectedMuebles.length > 0 && formData.directorId && (
                                    <>
                                        {(!formData.area || !formData.puesto) && (
                                            <div className="mt-2 text-yellow-400 text-xs flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4" />
                                                Falta información de área o puesto del director.
                                                <button
                                                    type="button"
                                                    className="ml-2 underline text-yellow-300 hover:text-yellow-200"
                                                    onClick={() => {
                                                        const dir = directorio.find(d => d.id_directorio.toString() === formData.directorId);
                                                        if (dir) {
                                                            setIncompleteDirector(dir);
                                                            setDirectorFormData({ area: dir.area || '', puesto: dir.puesto || '' });
                                                            setShowDirectorModal(true);
                                                        }
                                                    }}
                                                >
                                                    Completar datos
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Resguardante */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-400 mb-1">Resguardante</label>
                                <input
                                    type="text"
                                    value={formData.resguardante}
                                    onChange={(e) => setFormData({ ...formData, resguardante: e.target.value })}
                                    placeholder="Nombre del resguardante"
                                    className="block w-full bg-black border border-gray-800 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Area and Puesto */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Área</label>
                                    <input
                                        type="text"
                                        value={formData.area}
                                        readOnly={true}
                                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                        placeholder="Área"
                                        className="block w-full bg-black border border-gray-800 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Puesto</label>
                                    <input
                                        type="text"
                                        value={formData.puesto}
                                        readOnly={true}
                                        onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                                        placeholder="Puesto"
                                        className="block w-full bg-black border border-gray-800 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Selected Items */}
                        <div className="bg-gray-900/20 rounded-xl border border-gray-800 p-4 flex-grow overflow-y-auto shadow-inner relative">
                            <h2 className="text-lg font-medium text-gray-100 mb-2 flex items-center gap-2 sticky top-0 z-20 bg-black/80 p-2 -m-2 backdrop-blur-md">
                                <LayoutGrid className="h-5 w-5 text-blue-400" />
                                Artículos Seleccionados ({selectedMuebles.length})
                            </h2>

                            {selectedMuebles.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-gray-500">
                                    <TagIcon className="h-12 w-12 mb-2 text-gray-600" />
                                    <p className="text-sm">No hay artículos seleccionados</p>
                                    <p className="text-xs mt-1">Haga clic en un artículo para agregarlo</p>
                                </div>
                            ) : (
                                <div className="space-y-3 mt-2">
                                    {selectedMuebles.map((mueble) => (
                                        <div key={`selected-${mueble.id}`} className="bg-black rounded-lg p-3 flex justify-between items-start border border-gray-800 shadow-sm hover:shadow-md transition-shadow">
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
                                            </div>
                                            <button
                                                title='Eliminar artículo'
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeSelectedMueble(mueble);
                                                }}
                                                className="ml-2 p-1 text-gray-400 hover:text-red-400 rounded-full hover:bg-gray-900/50"
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
                                        resguardante: ''
                                    }));
                                }}
                                disabled={selectedMuebles.length === 0 || loading}
                                className={`px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 
                                    ${selectedMuebles.length === 0 ? 'bg-black text-gray-600 border border-gray-800 cursor-not-allowed' : 'bg-black text-gray-300 border border-gray-700 hover:bg-gray-900'}`}
                            >
                                <X className="h-4 w-4" />
                                Limpiar Selección
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={selectedMuebles.length === 0 || !formData.directorId || !formData.area || !formData.puesto || loading}
                                className={`px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 flex-grow sm:flex-grow-0 
                                    ${selectedMuebles.length === 0 || !formData.directorId || !formData.area || !formData.puesto || loading ?
                                        'bg-blue-900/10 text-blue-300/50 border border-blue-900/20 cursor-not-allowed' :
                                        'bg-blue-600 text-white hover:bg-blue-500'}`}
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
                        <AlertTriangle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                        <button
                            title='Cerrar alerta'
                            onClick={() => setError(null)}
                            className="ml-4 flex-shrink-0 p-1 rounded-full text-red-200 hover:text-white hover:bg-red-800"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Director Modal */}
            {showDirectorModal && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 animate-fadeIn">
                    <div className="bg-black rounded-2xl shadow-2xl border border-yellow-600/30 w-full max-w-md overflow-hidden transition-all duration-300 transform">
                        <div className="relative p-6 bg-gradient-to-b from-black to-gray-900">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500/60 via-yellow-400 to-yellow-500/60"></div>

                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="p-3 bg-yellow-500/10 rounded-full border border-yellow-500/30 mb-3">
                                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">¡Ups! Falta información</h3>
                                <p className="text-gray-400 mt-2">
                                    Necesitamos algunos datos adicionales del director seleccionado para Continuar
                                </p>
                            </div>

                            <div className="space-y-5 mt-6">
                                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Director seleccionado</label>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-800 rounded-lg">
                                            <UserCheck className="h-4 w-4 text-yellow-400" />
                                        </div>
                                        <span className="text-white font-medium">{incompleteDirector?.nombre || 'Director'}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-gray-400" />
                                        Área
                                    </label>
                                    <input
                                        type="text"
                                        value={directorFormData.area}
                                        onChange={(e) => setDirectorFormData({ ...directorFormData, area: e.target.value })}
                                        placeholder="Ej: Desarrollo, Marketing, Ventas..."
                                        className="block w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                        <Users className="h-4 w-4 text-gray-400" />
                                        Puesto
                                    </label>
                                    <input
                                        type="text"
                                        value={directorFormData.puesto}
                                        onChange={(e) => setDirectorFormData({ ...directorFormData, puesto: e.target.value })}
                                        placeholder="Ej: Director General, Gerente, Supervisor..."
                                        className="block w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-colors"
                                    />
                                    {(!directorFormData.area || !directorFormData.puesto) && (
                                        <p className="text-xs text-yellow-500/80 mt-2 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            Ambos campos son requeridos para continuar
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-black border-t border-gray-800 flex justify-end gap-3">
                            <button
                                onClick={() => setShowDirectorModal(false)}
                                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 border border-gray-800 transition-colors flex items-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                Cancelar
                            </button>
                            <button
                                onClick={saveDirectorInfo}
                                disabled={savingDirector || !directorFormData.area || !directorFormData.puesto}
                                className={`px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all duration-300 
                    ${savingDirector || !directorFormData.area || !directorFormData.puesto ?
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
                    <div className="bg-black rounded-2xl shadow-2xl border border-red-600/30 w-full max-w-md overflow-hidden transition-all duration-300 transform">
                        <div className="relative p-6 bg-gradient-to-b from-black to-gray-900">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/60 via-red-400 to-red-500/60"></div>
                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="p-3 bg-red-500/10 rounded-full border border-red-500/30 mb-3">
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
                                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 border border-gray-800 transition-colors flex items-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para descargar PDF tras guardar */}
            {showPDFButton && pdfData && (
                <div
                    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 animate-fadeIn"
                    tabIndex={-1} // Previene cierre por Escape
                    onKeyDown={e => {
                        // Previene cierre con Escape
                        if (e.key === 'Escape') {
                            e.stopPropagation();
                            e.preventDefault();
                        }
                    }}
                    onClick={e => e.stopPropagation()} // Previene cierre por clic fuera
                >
                    <div
                        className="bg-black rounded-2xl shadow-2xl border border-green-600/30 w-full max-w-md overflow-hidden transition-all duration-300 transform"
                        onClick={e => e.stopPropagation()} // Previene propagación de clics internos
                    >
                        <div className="relative p-6 bg-gradient-to-b from-black to-gray-900">
                            {/* Línea decorativa superior */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500/60 via-green-400 to-green-500/60"></div>

                            {/* Botón de cerrar con advertencia mejorada */}
                            <button
                                onClick={() => {
                                    // Verificar si el PDF ya fue descargado
                                    const hasPdfBeenDownloaded = sessionStorage.getItem('pdfDownloaded') === 'true';

                                    if (!hasPdfBeenDownloaded) {
                                        // Si no se ha descargado, mostrar modal de advertencia personalizado
                                        setShowWarningModal(true);
                                    } else {
                                        // Si ya se descargó, cerrar directamente
                                        setShowPDFButton(false);
                                    }
                                }}
                                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-gray-900 text-green-400 hover:text-green-500 border border-green-500/30 transition-colors"
                                title="Cerrar"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="p-3 bg-green-500/10 rounded-full border border-green-500/30 mb-3">
                                    <FileDigit className="h-8 w-8 text-green-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Resguardo generado</h3>
                                <p className="text-gray-400 mt-2">
                                    Descarga el PDF del resguardo para imprimir o compartir
                                </p>
                            </div>

                            <div className="space-y-5 mt-6">
                                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Documento generado</label>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-800 rounded-lg">
                                            <FileText className="h-4 w-4 text-green-400" />
                                        </div>
                                        <span className="text-white font-medium">Resguardo de equipo</span>
                                    </div>
                                </div>

                                {/* Componente PDF con visualización y botón de descarga */}
                                <div className="w-full flex flex-col items-center gap-4">
                                    <div className="w-full rounded-lg overflow-hidden border border-gray-700">
                                        <ResguardoPDFReport data={pdfData as PdfData} onClose={() => setShowPDFButton(false)} />
                                    </div>
                                    {/* Botón verde de descarga usando PDFDownloadLink */}
                                    <div className="w-full">
                                        <PDFDownloadLink
                                            document={<ResguardoPDF data={pdfData as PdfData} />}
                                            fileName={`resguardo_${pdfData.folio}.pdf`}
                                            className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-black font-medium rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg"
                                            onClick={() => {
                                                // Marcar que se ha descargado el PDF
                                                sessionStorage.setItem('pdfDownloaded', 'true');
                                            }}
                                        >
                                            {({ loading }) => (
                                                <>
                                                    <Download className="h-5 w-5" />
                                                    {loading ? 'Generando PDF...' : 'Descargar PDF'}
                                                </>
                                            )}
                                        </PDFDownloadLink>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de advertencia personalizado */}
            {showWarningModal && (
                <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[60] px-4 animate-fadeIn">
                    <div className="bg-gray-900 rounded-xl shadow-2xl border border-red-500/30 w-full max-w-sm p-6">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="p-3 bg-red-500/10 rounded-full border border-red-500/30">
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
                                    className="flex-1 py-2 px-4 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        setShowWarningModal(false);
                                        setShowPDFButton(false);
                                    }}
                                    className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
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