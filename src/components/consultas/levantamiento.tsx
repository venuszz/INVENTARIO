"use client";
import { generateExcel } from '@/components/reportes/excelgenerator';
import { generatePDF } from '@/components/consultas/PDFLevantamiento';
import { generatePDF as generatePDFPerArea } from '@/components/consultas/PDFLevantamientoPerArea';
import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
    Search, RefreshCw, ChevronLeft, ChevronRight,
    ArrowUpDown, AlertCircle, X, FileUp, File, FileText, Filter
} from 'lucide-react';
import supabase from '@/app/lib/supabase/client';
import { useUserRole } from "@/hooks/useUserRole";
import { useRouter } from 'next/navigation';
import { BadgeCheck } from 'lucide-react';

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

interface FilterOptions {
    estados: string[];
    estatus: string[];
    areas: string[];
    rubros: string[];
    formadq: string[];
    resguardantes?: string[]; // Changed from usufinales
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

export default function LevantamientoUnificado() {
    const [muebles, setMuebles] = useState<LevMueble[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filteredCount, setFilteredCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Add this calculation
    const totalPages = Math.ceil(filteredCount / rowsPerPage);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<keyof LevMueble>('id_inv');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [filters, setFilters] = useState<{
        estado: string[];
        estatus: string[];
        area: string[];
        rubro: string[];
        formadq: string[];
        resguardante: string[]; // Changed from usufinal
        origen: string[];  // Agregamos origen a los filtros
    }>({
        estado: [],
        estatus: [],
        area: [],
        rubro: [],
        formadq: [],
        resguardante: [], // Changed from usufinal
        origen: []     // Inicializamos origen
    });
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        estados: [],
        estatus: [],
        areas: [],
        rubros: [],
        formadq: []
    });
    const [selectedItem, setSelectedItem] = useState<LevMueble | null>(null);
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
    const [areaDirectorAmbiguous, setAreaDirectorAmbiguous] = useState(false);
    const [areaPDFTarget, setAreaPDFTarget] = useState<{ area: string, usufinal: string }>({ area: '', usufinal: '' });

    // Estado para controlar si los campos fueron auto-completados
    const [autoCompletedFields, setAutoCompletedFields] = useState<{ area: boolean, nombre: boolean, puesto: boolean }>(
        { area: false, nombre: false, puesto: false }
    );

    // Detectar si hay filtro por área o usuario final
    const isAreaOrUserFiltered = !!filters.area.length || !!filters.resguardante.length;

    // Estado para mostrar/ocultar filtros avanzados
    const [showFilters, setShowFilters] = useState(false);

    // Utilidad para limpiar texto
    function cleanText(str: string) {
        return (str || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/gi, '').toLowerCase().trim();
    }

    // Buscar directorio por área o usuario
    const fetchDirectorFromDirectorio = async (area: string) => {
        setAreaPDFLoading(true);
        setAreaDirectorAmbiguous(false);
        setAreaDirectorForm({ nombre: '', puesto: '' });
        setAreaPDFError(null);
        setAutoCompletedFields({ area: false, nombre: false, puesto: false });
        try {
            // Obtener todos los directores de la tabla directorio
            const { data, error } = await supabase.from('directorio').select('*');
            if (error) throw error;
            if (!data) throw new Error('No se pudo obtener el directorio');
            setAreaDirectorOptions(data); // Todos los directores disponibles para el select
            // Buscar coincidencia exacta por área
            const areaClean = cleanText(area);
            const matches = data.filter((d: DirectorioOption) => cleanText(d.area) === areaClean);
            if (matches.length === 1) {
                setAreaDirectorForm({ nombre: matches[0].nombre, puesto: matches[0].puesto });
                setAreaPDFTarget(t => ({ ...t, area: matches[0].area }));
                setAutoCompletedFields({ area: true, nombre: true, puesto: true });
            } else {
                setAreaPDFTarget(t => ({ ...t, area: area })); // Prellenar área aunque no exista
                setAreaDirectorAmbiguous(true);
                setAreaDirectorForm({ nombre: '', puesto: '' });
                setAutoCompletedFields({ area: false, nombre: false, puesto: false });
            }
        } catch {
            setAreaPDFError('Error al buscar en directorio.');
        } finally {
            setAreaPDFLoading(false);
        }
    };

    // Manejar click en botón PDF por área/usuario
    const handleAreaPDFClick = () => {
        setAreaPDFTarget({ area: filters.area[0], usufinal: filters.resguardante[0] });
        fetchDirectorFromDirectorio(filters.area[0]);
        setShowAreaPDFModal(true);
    };

    // Generar PDF por área/usuario
    const handleAreaPDFGenerate = async () => {
        setAreaPDFLoading(true);
        setAreaPDFError(null);
        try {
            // Guardar/actualizar directorio si los datos son válidos
            if (areaDirectorForm.nombre && areaDirectorForm.puesto && areaPDFTarget.area) {
                // Buscar si ya existe el director por nombre
                const { data: existing, error: findError } = await supabase
                    .from('directorio')
                    .select('*')
                    .eq('nombre', areaDirectorForm.nombre.trim());
                if (findError) throw findError;
                if (existing && existing.length > 0) {
                    // UPDATE si ya existe
                    await supabase
                        .from('directorio')
                        .update({
                            puesto: areaDirectorForm.puesto.trim(),
                            area: areaPDFTarget.area.trim()
                        })
                        .eq('id_directorio', existing[0].id_directorio);
                } else {
                    // INSERT si no existe
                    await supabase
                        .from('directorio')
                        .insert({
                            nombre: areaDirectorForm.nombre.trim(),
                            puesto: areaDirectorForm.puesto.trim(),
                            area: areaPDFTarget.area.trim()
                        });
                }
                // Guardar área si no existe
                const { data: areaExists } = await supabase
                    .from('areas')
                    .select('*')
                    .eq('itea', areaPDFTarget.area.trim());
                if (!areaExists || areaExists.length === 0) {
                    await supabase
                        .from('areas')
                        .insert({ itea: areaPDFTarget.area.trim() });
                }
            }
            const exportData = (await getFilteredData()).map((item, index) => ({ ...item, _counter: index + 1 }));
            if (!exportData.length) throw new Error('No hay datos para exportar.');
            const columns = [
                { header: 'ID INVENTARIO', key: 'id_inv', width: 60 },
                { header: 'DESCRIPCIÓN', key: 'descripcion', width: 120 },
                { header: 'ESTADO', key: 'estado', width: 50 },
                { header: 'ESTATUS', key: 'estatus', width: 50 },
                { header: 'ÁREA', key: 'area', width: 60 },
                { header: 'USUARIO FINAL', key: 'usufinal', width: 70 },
            ];
            const firmas = [
                { concepto: 'Responsable', nombre: areaDirectorForm.nombre, puesto: areaDirectorForm.puesto },
            ];
            await generatePDFPerArea({
                data: exportData,
                columns,
                title: `LEVANTAMIENTO DE INVENTARIO - ${areaPDFTarget.area}`,
                fileName: `levantamiento_area_${areaPDFTarget.area || areaPDFTarget.usufinal}_${new Date().toISOString().slice(0, 10)}`,
                firmas,
            });
            setShowAreaPDFModal(false);
            setMessage({ type: 'success', text: 'PDF generado exitosamente.' });
        } catch {
            setAreaPDFError('Error al generar PDF.');
        } finally {
            setAreaPDFLoading(false);
        }
    };

    // Obtener opciones de filtro unificadas
    const fetchFilterOptions = useCallback(async () => {
        try {
            // Obtener estados unificados
            const [estadosInea, estadosItea] = await Promise.all([
                supabase.from('muebles').select('estado').not('estado', 'is', null),
                supabase.from('mueblesitea').select('estado').not('estado', 'is', null),
            ]);
            const estados = Array.from(new Set([
                ...(estadosInea.data?.map(i => i.estado?.trim()) || []),
                ...(estadosItea.data?.map(i => i.estado?.trim()) || [])
            ].filter(Boolean))) as string[];

            // Obtener estatus unificados
            const [estatusInea, estatusItea] = await Promise.all([
                supabase.from('muebles').select('estatus').not('estatus', 'is', null),
                supabase.from('mueblesitea').select('estatus').not('estatus', 'is', null),
            ]);
            const estatus = Array.from(new Set([
                ...(estatusInea.data?.map(i => i.estatus?.trim()) || []),
                ...(estatusItea.data?.map(i => i.estatus?.trim()) || [])
            ].filter(Boolean))) as string[];

            // Obtener áreas unificadas
            const [areasInea, areasItea] = await Promise.all([
                supabase.from('muebles').select('area').not('area', 'is', null),
                supabase.from('mueblesitea').select('area').not('area', 'is', null),
            ]);
            const areas = Array.from(new Set([
                ...(areasInea.data?.map(i => i.area?.trim()) || []),
                ...(areasItea.data?.map(i => i.area?.trim()) || [])
            ].filter(Boolean))) as string[];

            // Obtener rubros unificados
            const [rubrosInea, rubrosItea] = await Promise.all([
                supabase.from('muebles').select('rubro').not('rubro', 'is', null),
                supabase.from('mueblesitea').select('rubro').not('rubro', 'is', null),
            ]);
            const rubros = Array.from(new Set([
                ...(rubrosInea.data?.map(i => i.rubro?.trim()) || []),
                ...(rubrosItea.data?.map(i => i.rubro?.trim()) || [])
            ].filter(Boolean))) as string[];

            // Obtener formas de adquisición unificadas
            const [formadqInea, formadqItea] = await Promise.all([
                supabase.from('muebles').select('formadq').not('formadq', 'is', null),
                supabase.from('mueblesitea').select('formadq').not('formadq', 'is', null),
            ]);
            const formadq = Array.from(new Set([
                ...(formadqInea.data?.map(i => i.formadq?.trim()) || []),
                ...(formadqItea.data?.map(i => i.formadq?.trim()) || [])
            ].filter(Boolean))) as string[];

            // Obtener resguardantes únicos de ambas tablas
            const [resguardanteInea, resguardanteItea] = await Promise.all([
                supabase.from('muebles').select('resguardante').not('resguardante', 'is', null),
                supabase.from('mueblesitea').select('resguardante').not('resguardante', 'is', null),
            ]);
            const resguardantes = Array.from(new Set([
                ...(resguardanteInea.data?.map(i => i.resguardante?.trim()) || []),
                ...(resguardanteItea.data?.map(i => i.resguardante?.trim()) || [])
            ].filter(Boolean))) as string[];

            setFilterOptions({ estados, estatus, areas, rubros, formadq, resguardantes });
        } catch (error) {
            console.error('Error al cargar opciones de filtro:', error);
            setError('Error al cargar opciones de filtro');
        }
    }, []);

    // Función para obtener datos filtrados para exportación
    const getFilteredData = async () => {
        try {
            // --- Helper para traer todos los datos paginando manualmente ---
            const fetchAllRows = async (table: 'muebles' | 'mueblesitea') => {
                let allRows: LevMueble[] = [];
                let from = 0;
                const pageSize = 1000;
                let keepGoing = true;
                let query = supabase.from(table).select('*');

                // Aplicar filtros de búsqueda
                if (searchTerm) {
                    const search = `%${searchTerm}%`;
                    const searchPattern = `id_inv.ilike.${search},descripcion.ilike.${search},resguardante.ilike.${search},usufinal.ilike.${search}`;
                    query = query.or(searchPattern);
                }
                // Aplicar otros filtros
                Object.entries(filters).forEach(([key, values]) => {
                    if (values.length > 0) {
                        query = query.in(key, values);
                    }
                });

                while (keepGoing) {
                    const { data, error } = await query.range(from, from + pageSize - 1);
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

            // Ordenar los datos según la configuración actual
            return allData.sort((a, b) => {
                const aVal = a[sortField] || '';
                const bVal = b[sortField] || '';
                const comparison = String(aVal).localeCompare(String(bVal));
                return sortDirection === 'asc' ? comparison : -comparison;
            });
        } catch (error) {
            console.error('Error al obtener datos filtrados:', error);
            throw error;
        }
    };

    // Función para manejar la exportación
    const handleExport = async () => {
        try {
            setLoading(true);
            const exportData = await getFilteredData();

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

    // Función para obtener muebles paginados
    const fetchMuebles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Determinar qué tablas consultar según el filtro de origen
            const shouldQueryInea = !filters.origen.length || filters.origen.includes('INEA');
            const shouldQueryItea = !filters.origen.length || filters.origen.includes('ITEA');

            // Preparar consultas solo para las tablas necesarias
            const queries = [];
            const countQueries = [];

            if (shouldQueryInea) {
                let countInea = supabase.from('muebles').select('*', { count: 'exact', head: true });
                let dataInea = supabase.from('muebles').select('*');

                // Aplicar filtros excepto el de origen
                if (searchTerm) {
                    const search = `%${searchTerm}%`;
                    const searchPattern = `id_inv.ilike.${search},descripcion.ilike.${search},resguardante.ilike.${search},usufinal.ilike.${search}`;
                    countInea = countInea.or(searchPattern);
                    dataInea = dataInea.or(searchPattern);
                }

                Object.entries(filters).forEach(([key, values]) => {
                    if (values.length > 0 && key !== 'origen') {
                        countInea = countInea.in(key, values);
                        dataInea = dataInea.in(key, values);
                    }
                });

                countQueries.push(countInea);
                queries.push({ query: dataInea, type: 'INEA' });
            }

            if (shouldQueryItea) {
                let countItea = supabase.from('mueblesitea').select('*', { count: 'exact', head: true });
                let dataItea = supabase.from('mueblesitea').select('*');

                // Aplicar filtros excepto el de origen
                if (searchTerm) {
                    const search = `%${searchTerm}%`;
                    const searchPattern = `id_inv.ilike.${search},descripcion.ilike.${search},resguardante.ilike.${search},usufinal.ilike.${search}`;
                    countItea = countItea.or(searchPattern);
                    dataItea = dataItea.or(searchPattern);
                }

                Object.entries(filters).forEach(([key, values]) => {
                    if (values.length > 0 && key !== 'origen') {
                        countItea = countItea.in(key, values);
                        dataItea = dataItea.in(key, values);
                    }
                });

                countQueries.push(countItea);
                queries.push({ query: dataItea, type: 'ITEA' });
            }

            // Obtener totales
            const countResults = await Promise.all(countQueries);
            const total = countResults.reduce((sum, result) => sum + (result.count || 0), 0);
            setFilteredCount(total);

            // Calcular rangos de paginación global
            const fromGlobal = (currentPage - 1) * rowsPerPage;
            const toGlobal = fromGlobal + rowsPerPage - 1;

            // Obtener datos paginados de las tablas seleccionadas
            const results = await Promise.all(
                queries.map(({ query, type }) => 
                    query
                        .order(sortField, { ascending: sortDirection === 'asc' })
                        .range(fromGlobal, toGlobal)
                        .then(res => ({
                            data: res.data?.map(item => ({ ...item, origen: type })) || [],
                            type
                        }))
                )
            );

            // Combinar y ordenar resultados
            let pageMuebles = results.flatMap(result => result.data);

            // Ordenar los resultados combinados
            if (pageMuebles.length > 0) {
                pageMuebles = pageMuebles.sort((a, b) => {
                    const aVal = a[sortField] || '';
                    const bVal = b[sortField] || '';
                    const comparison = String(aVal).localeCompare(String(bVal));
                    return sortDirection === 'asc' ? comparison : -comparison;
                });
            }

            // Asegurar que no excedemos el límite de elementos por página
            pageMuebles = pageMuebles.slice(0, rowsPerPage);

            setMuebles(pageMuebles);

            if (selectedItem && !pageMuebles.some(item =>
                item.id === selectedItem.id && item.origen === selectedItem.origen
            )) {
                setSelectedItem(null);
            }

        } catch (error) {
            console.error('Error al cargar muebles:', error);
            setError('Error al cargar los datos. Por favor, intente nuevamente.');
            setMuebles([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, rowsPerPage, searchTerm, filters, sortField, sortDirection, selectedItem]);

    useEffect(() => {
        fetchFilterOptions();
        fetchMuebles();
    }, [fetchFilterOptions, fetchMuebles]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filters, sortField, sortDirection, rowsPerPage]);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // useEffect para autocompletar directorio al cambiar el filtro de usuario final
    useEffect(() => {
        if (filters.resguardante.length) {
            fetchDirectorFromDirectorio(filters.area[0]);
        }
        // Solo autocompletar si hay filtro de usuario
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.resguardante]);

    const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
        setFilters(prev => {
            const currentValues = prev[filterName];
            if (currentValues.includes(value)) {
                return {
                    ...prev,
                    [filterName]: currentValues.filter(v => v !== value)
                };
            } else {
                return {
                    ...prev,
                    [filterName]: [...currentValues, value]
                };
            }
        });
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({
            estado: [],
            estatus: [],
            area: [],
            rubro: [],
            formadq: [],
            resguardante: [], // Changed from usufinal
            origen: []
        });
        setSearchTerm('');
        setCurrentPage(1);
    };
    const changePage = (page: number) => {
        const totalPages = Math.ceil(filteredCount / rowsPerPage);
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const truncateText = (text: string | null, length: number = 50) => {
        if (!text) return '';
        return text.length > length ? `${text.substring(0, length)}...` : text;
    };

    const role = useUserRole();
    const isUsuario = role === "usuario";

    function handleClearAllFilters(): void {
        throw new Error('Function not implemented.');
    }

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

    return (
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
                            {/* Barra de búsqueda */}
                            <div className="relative flex-grow">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    spellCheck="false"
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    placeholder="Buscar por ID o descripción..."
                                    className="pl-10 pr-4 py-2 w-full bg-black border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                                    title="Buscar"
                                />
                            </div>
                            {/* Botones de filtro por origen */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleFilterChange('origen', 'INEA')}
                                    className={`
                                        relative px-4 py-2 rounded-lg font-medium 
                                        flex items-center gap-2 transition-all duration-300
                                        ${filters.origen?.includes('INEA')
                                            ? 'bg-gradient-to-br from-blue-900/70 to-blue-800/70 text-blue-200 border border-blue-700 shadow-lg shadow-blue-900/20'
                                            : 'bg-gradient-to-br from-gray-800 to-gray-900 text-gray-400 border border-gray-700 hover:border-blue-700/50'
                                        }
                                        overflow-hidden
                                    `}
                                    title="Filtrar origen INEA"
                                >
                                    {/* Animated gradient background */}
                                    <div className={`
                                        absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent
                                        opacity-0 hover:opacity-100 transition-opacity duration-500
                                    `}></div>

                                    {/* Dot indicator with pulse animation */}
                                    <div className="relative">
                                        <div className={`
                                            w-2 h-2 rounded-full transition-colors duration-300
                                            ${filters.origen?.includes('INEA') ? 'bg-blue-400' : 'bg-gray-400'}
                                        `}/>
                                        {filters.origen?.includes('INEA') && (
                                            <div className="absolute inset-0 animate-ping rounded-full bg-blue-400/50"></div>
                                        )}
                                    </div>

                                    {/* Text with underline animation */}
                                    <span className="relative">
                                        INEA
                                        <span className={`
                                            absolute inset-x-0 -bottom-0.5 h-px bg-gradient-to-r 
                                            from-transparent via-blue-400/50 to-transparent
                                            opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                        `}></span>
                                    </span>
                                </button>

                                <button
                                    onClick={() => handleFilterChange('origen', 'ITEA')}
                                    className={`
                                        relative px-4 py-2 rounded-lg font-medium 
                                        flex items-center gap-2 transition-all duration-300
                                        ${filters.origen?.includes('ITEA')
                                            ? 'bg-gradient-to-br from-purple-900/70 to-purple-800/70 text-purple-200 border border-purple-700 shadow-lg shadow-purple-900/20'
                                            : 'bg-gradient-to-br from-gray-800 to-gray-900 text-gray-400 border border-gray-700 hover:border-purple-700/50'
                                        }
                                        overflow-hidden
                                    `}
                                    title="Filtrar origen ITEA"
                                >
                                    {/* Animated gradient background */}
                                    <div className={`
                                        absolute inset-0 bg-gradient-to-r from-purple-500/20 to-transparent
                                        opacity-0 hover:opacity-100 transition-opacity duration-500
                                    `}></div>

                                    {/* Dot indicator with pulse animation */}
                                    <div className="relative">
                                        <div className={`
                                            w-2 h-2 rounded-full transition-colors duration-300
                                            ${filters.origen?.includes('ITEA') ? 'bg-purple-400' : 'bg-gray-400'}
                                        `}/>
                                        {filters.origen?.includes('ITEA') && (
                                            <div className="absolute inset-0 animate-ping rounded-full bg-purple-400/50"></div>
                                        )}
                                    </div>

                                    {/* Text with underline animation */}
                                    <span className="relative">
                                        ITEA
                                        <span className={`
                                            absolute inset-x-0 -bottom-0.5 h-px bg-gradient-to-r 
                                            from-transparent via-purple-400/50 to-transparent
                                            opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                        `}></span>
                                    </span>
                                </button>
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
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
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
                                    if (isAreaOrUserFiltered) {
                                        handleAreaPDFClick();
                                    } else {
                                        setExportType('pdf');
                                        setShowExportModal(true);
                                    }
                                }}
                                className={`
                                    group relative px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-all duration-300 shadow-lg border
                                    ${isAreaOrUserFiltered 
                                        ? 'bg-gradient-to-br from-fuchsia-600 to-purple-600 hover:from-purple-600 hover:to-fuchsia-600 text-white hover:shadow-fuchsia-500/30 border-fuchsia-700/50 hover:border-fuchsia-500' 
                                        : 'bg-gradient-to-br from-red-600 to-rose-600 hover:from-rose-600 hover:to-red-600 text-white hover:shadow-red-500/30 border-red-700/50 hover:border-red-500'
                                    }`}
                                title={isAreaOrUserFiltered ? 'Exportar PDF personalizado por área/usuario' : 'Exportar a PDF'}
                                style={{ minWidth: isAreaOrUserFiltered ? '140px' : '120px' }}
                            >
                                <div className={`
                                    absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md
                                    ${isAreaOrUserFiltered ? 'from-fuchsia-600/20' : 'from-red-600/20'} to-transparent
                                `}></div>
                                <div className="relative">
                                    {isAreaOrUserFiltered ? (
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 transition-transform group-hover:scale-110 group-hover:-translate-y-0.5 duration-300" />
                                            <span className="hidden sm:flex items-center gap-1">
                                                PDF
                                                <span className={`
                                                    text-xs opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0
                                                    ${isAreaOrUserFiltered ? 'text-fuchsia-300' : 'text-red-300'}
                                                `}>
                                                    personalizado
                                                </span>
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <File className="h-4 w-4 transition-transform group-hover:scale-110 group-hover:-translate-y-0.5 duration-300" />
                                            <span className="hidden sm:flex items-center gap-1">
                                                PDF
                                                <span className="text-xs text-red-300 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                                                    .pdf
                                                </span>
                                            </span>
                                        </div>
                                    )}
                                </div>
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

                            {/* Filters Button */}
                            <button
                                onClick={() => setShowFilters(!showFilters)} 
                                className={`
                                    group relative px-4 py-2.5 rounded-lg font-medium 
                                    flex items-center gap-2.5 transition-all duration-300
                                    ${Object.values(filters).some(value => value.length > 0)
                                        ? 'bg-gradient-to-br from-fuchsia-600/20 to-purple-600/20 text-fuchsia-300 hover:text-fuchsia-200'
                                        : 'bg-gradient-to-br from-gray-800 to-gray-900 text-gray-400 hover:text-gray-300'
                                    }
                                    border
                                    ${Object.values(filters).some(value => value.length > 0)
                                        ? 'border-fuchsia-500/30 hover:border-fuchsia-400/50'
                                        : 'border-gray-700 hover:border-gray-600'
                                    }
                                    shadow-lg
                                    ${Object.values(filters).some(value => value.length > 0)
                                        ? 'hover:shadow-fuchsia-500/10'
                                        : 'hover:shadow-gray-800/30'
                                    }
                                    hover:scale-[1.02] active:scale-[0.98]
                                    overflow-hidden
                                `}
                                title="Mostrar/ocultar filtros avanzados"
                            >
                                {/* Animated gradient background */}
                                <div className={`
                                    absolute inset-0 bg-gradient-to-r 
                                    ${Object.values(filters).some(value => value.length > 0)
                                        ? 'from-fuchsia-500/20 via-purple-500/20 to-transparent'
                                        : 'from-gray-700/20 via-gray-600/20 to-transparent'
                                    }
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-500
                                    animate-gradient-x
                                `}/>

                                {/* Icon wrapper with animation */}
                                <div className="relative">
                                    <Filter className={`
                                        h-4 w-4 transition-all duration-300
                                        group-hover:scale-110 group-hover:rotate-[-10deg]
                                        ${Object.values(filters).some(value => value.length > 0)
                                            ? 'text-fuchsia-300 group-hover:text-fuchsia-200'
                                            : 'text-gray-400 group-hover:text-gray-300'
                                        }
                                    `} />
                                </div>

                                {/* Text with underline animation */}
                                <span className="relative">
                                    Filtros
                                    <span className={`
                                        absolute inset-x-0 -bottom-0.5 h-px
                                        ${Object.values(filters).some(value => value.length > 0)
                                            ? 'bg-gradient-to-r from-transparent via-fuchsia-400/50 to-transparent'
                                            : 'bg-gradient-to-r from-transparent via-gray-400/50 to-transparent'
                                        }
                                        opacity-0 group-hover:opacity-100 transition-all duration-300
                                    `}/>
                                </span>

                                {/* Counter badge with animations */}
                                {Object.values(filters).some(value => value.length > 0) && (
                                    <span className={`
                                        flex items-center justify-center
                                        min-w-5 h-5 px-1.5
                                        rounded-full text-xs font-bold
                                        transition-all duration-300
                                        ${Object.values(filters).some(value => value.length > 0)
                                            ? 'bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-400/30'
                                            : 'bg-gray-800/80 text-gray-300 border border-gray-700'
                                        }
                                        group-hover:scale-110 group-hover:rotate-3
                                        shadow-inner
                                    `}>
                                        {Object.values(filters).filter(value => value.length > 0).length}
                                    </span>
                                )}
                            </button>

                            {/* Clear Filters Button */}
                            <button
                                onClick={clearFilters}
                                className="group relative px-4 py-2 bg-gradient-to-br from-red-950 to-rose-950 text-rose-300 rounded-lg font-medium flex items-center gap-2.5 hover:from-rose-900 hover:to-red-900 transition-all duration-300 shadow-lg hover:shadow-rose-900/30 border border-rose-800/30 hover:border-rose-700/50"
                                title="Limpiar todos los filtros aplicados"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg"></div>
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className="h-4 w-4 transition-all duration-300 group-hover:rotate-180 group-hover:scale-110" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2.5" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                >
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                                    <line x1="17" y1="17" x2="7" y2="17"/>
                                    <polyline points="7 13 7 17 11 17"/>
                                    <line x1="17" y1="8" x2="12" y2="8"/>
                                </svg>
                                <span className="relative">
                                    Limpiar filtros
                                    <span className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-rose-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                </span>
                            </button>
                        </div>
                    </div>
                    {showFilters && (
                        <div className="mt-6 border border-gray-700 rounded-xl bg-black/80 shadow-xl backdrop-blur-lg transition-all duration-300 overflow-hidden">
                            <div className="p-4 bg-gradient-to-r from-gray-900 to-black border-b border-gray-700">
                                <h3 className="text-lg font-semibold text-white flex items-center">
                                    <span className="mr-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-fuchsia-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                    Filtros Aplicados
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 p-6">
                                {/* Filter: Estado */}
                                <div className="filter-group">
                                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                                        <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                                        Estado
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={filters.estado.length ? filters.estado[0] : ''}
                                            onChange={e => handleFilterChange('estado', e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-3 pr-10 py-2.5 text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all appearance-none"
                                            title="Filtrar por estado"
                                        >
                                            <option value="">Todos ({filterOptions.estados.length})</option>
                                            {filterOptions.estados.map(e => (
                                                <option
                                                    key={e}
                                                    value={e}
                                                >
                                                    {e}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-fuchsia-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </div>
                                    </div>

                                    {filters.estado.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {filters.estado.map(e => (
                                                <span
                                                    key={e}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-600/40 to-blue-500/40 text-blue-100 border border-blue-500/50 shadow-sm shadow-blue-900/20"
                                                >
                                                    {e}
                                                    <button
                                                        onClick={() => handleFilterChange('estado', e)}
                                                        className="ml-1.5 text-blue-200 hover:text-white rounded-full bg-blue-600/30 hover:bg-blue-600/50 transition-colors w-4 h-4 inline-flex items-center justify-center"
                                                        aria-label="Eliminar filtro"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Filter: Estatus */}
                                <div className="filter-group">
                                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                                        <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                                        Estatus
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={filters.estatus.length ? filters.estatus[0] : ''}
                                            onChange={e => handleFilterChange('estatus', e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-3 pr-10 py-2.5 text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all appearance-none"
                                            title="Filtrar por estatus"
                                        >
                                            <option value="">Todos ({filterOptions.estatus.length})</option>
                                            {filterOptions.estatus.map(e => (
                                                <option
                                                    key={e}
                                                    value={e}
                                                >
                                                    {e}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-fuchsia-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </div>
                                    </div>

                                    {filters.estatus.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {filters.estatus.map(e => (
                                                <span
                                                    key={e}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-600/40 to-green-500/40 text-green-100 border border-green-500/50 shadow-sm shadow-green-900/20"
                                                >
                                                    {e}
                                                    <button
                                                        onClick={() => handleFilterChange('estatus', e)}
                                                        className="ml-1.5 text-green-200 hover:text-white rounded-full bg-green-600/30 hover:bg-green-600/50 transition-colors w-4 h-4 inline-flex items-center justify-center"
                                                        aria-label="Eliminar filtro"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Filter: Área */}
                                <div className="filter-group">
                                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                                        <span className="h-2 w-2 rounded-full bg-purple-500 mr-2"></span>
                                        Área
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={filters.area.length ? filters.area[0] : ''}
                                            onChange={e => handleFilterChange('area', e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-3 pr-10 py-2.5 text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all appearance-none"
                                            title="Filtrar por área"
                                        >
                                            <option value="">Todas ({filterOptions.areas.length})</option>
                                            {filterOptions.areas.map(e => (
                                                <option
                                                    key={e}
                                                    value={e}
                                                >
                                                    {e}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-fuchsia-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </div>
                                    </div>

                                    {filters.area.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {filters.area.map(e => (
                                                <span
                                                    key={e}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-600/40 to-purple-500/40 text-purple-100 border border-purple-500/50 shadow-sm shadow-purple-900/20"
                                                >
                                                    {e}
                                                    <button
                                                        onClick={() => handleFilterChange('area', e)}
                                                        className="ml-1.5 text-purple-200 hover:text-white rounded-full bg-purple-600/30 hover:bg-purple-600/50 transition-colors w-4 h-4 inline-flex items-center justify-center"
                                                        aria-label="Eliminar filtro"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Filter: Rubro */}
                                <div className="filter-group">
                                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                                        <span className="h-2 w-2 rounded-full bg-amber-500 mr-2"></span>
                                        Rubro
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={filters.rubro.length ? filters.rubro[0] : ''}
                                            onChange={e => handleFilterChange('rubro', e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-3 pr-10 py-2.5 text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all appearance-none"
                                            title="Filtrar por rubro"
                                        >
                                            <option value="">Todos ({filterOptions.rubros.length})</option>
                                            {filterOptions.rubros.map(e => (
                                                <option
                                                    key={e}
                                                    value={e}
                                                >
                                                    {e}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-fuchsia-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </div>
                                    </div>

                                    {filters.rubro.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {filters.rubro.map(e => (
                                                <span
                                                    key={e}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-600/40 to-amber-500/40 text-amber-100 border border-amber-500/50 shadow-sm shadow-amber-900/20"
                                                >
                                                    {e}
                                                    <button
                                                        onClick={() => handleFilterChange('rubro', e)}
                                                        className="ml-1.5 text-amber-200 hover:text-white rounded-full bg-amber-600/30 hover:bg-amber-600/50 transition-colors w-4 h-4 inline-flex items-center justify-center"
                                                        aria-label="Eliminar filtro"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Filter: Forma Adq. */}
                                <div className="filter-group">
                                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                                        <span className="h-2 w-2 rounded-full bg-pink-500 mr-2"></span>
                                        Forma Adq.
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={filters.formadq.length ? filters.formadq[0] : ''}
                                            onChange={e => handleFilterChange('formadq', e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-3 pr-10 py-2.5 text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all appearance-none"
                                            title="Filtrar por forma de adquisición"
                                        >
                                            <option value="">Todas ({filterOptions.formadq.length})</option>
                                            {filterOptions.formadq.map(e => (
                                                <option
                                                    key={e}
                                                    value={e}
                                                >
                                                    {e}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-fuchsia-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </div>
                                    </div>

                                    {filters.formadq.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {filters.formadq.map(e => (
                                                <span
                                                    key={e}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-pink-600/40 to-pink-500/40 text-pink-100 border border-pink-500/50 shadow-sm shadow-pink-900/20"
                                                >
                                                    {e}
                                                    <button
                                                        onClick={() => handleFilterChange('formadq', e)}
                                                        className="ml-1.5 text-pink-200 hover:text-white rounded-full bg-pink-600/30 hover:bg-pink-600/50 transition-colors w-4 h-4 inline-flex items-center justify-center"
                                                        aria-label="Eliminar filtro"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Filter: Resguardante */}
                                <div className="filter-group">
                                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                                        <span className="h-2 w-2 rounded-full bg-cyan-500 mr-2"></span>
                                        Resguardante
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={filters.resguardante.length ? filters.resguardante[0] : ''}
                                            onChange={e => handleFilterChange('resguardante', e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-3 pr-10 py-2.5 text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all appearance-none"
                                            title="Filtrar por resguardante"
                                        >
                                            <option value="">Todos ({filterOptions.resguardantes?.length})</option>
                                            {filterOptions.resguardantes?.map(r => (
                                                <option
                                                    key={r}
                                                    value={r}
                                                >
                                                    {r}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-fuchsia-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </div>
                                    </div>

                                    {filters.resguardante.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {filters.resguardante.map(e => (
                                                <span
                                                    key={e}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-cyan-600/40 to-cyan-500/40 text-cyan-100 border border-cyan-500/50 shadow-sm shadow-cyan-900/20"
                                                >
                                                    {e}
                                                    <button
                                                        onClick={() => handleFilterChange('resguardante', e)}
                                                        className="ml-1.5 text-cyan-200 hover:text-white rounded-full bg-cyan-600/30 hover:bg-cyan-600/50 transition-colors w-4 h-4 inline-flex items-center justify-center"
                                                        aria-label="Eliminar filtro"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Active Filters Summary */}
                            {Object.values(filters).some(arr => arr.length > 0) && (
                                <div className="px-6 py-4 bg-gray-800/70 border-t border-gray-700 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center">
                                        <span className="text-sm text-gray-400">
                                            {Object.values(filters).flat().length} {Object.values(filters).flat().length === 1 ? 'filtro activo' : 'filtros activos'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleClearAllFilters()}
                                        className="text-sm text-fuchsia-300 hover:text-fuchsia-100 hover:underline flex items-center transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        Limpiar todos los filtros
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
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
                                    } border transition-colors`}
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
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Documento a generar</label>
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
                    <div className="bg-black rounded-2xl shadow-2xl border border-fuchsia-600/30 w-full max-w-md overflow-hidden transition-all duration-300 transform">
                        <div className="relative p-6 bg-gradient-to-b from-black to-fuchsia-950">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500/60 via-fuchsia-400 to-fuchsia-500/60"></div>
                            <button
                                onClick={() => setShowAreaPDFModal(false)}
                                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-gray-900 text-fuchsia-400 hover:text-fuchsia-500 border border-fuchsia-500/30 transition-colors"
                                title="Cerrar"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="p-3 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 mb-3">
                                    <FileText className="h-8 w-8 text-fuchsia-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-fuchsia-400">Exportar PDF por Área/Usuario</h3>
                                <p className="text-gray-400 mt-2">Genera un PDF con encabezado y firma personalizada para el área o usuario filtrado.</p>
                            </div>
                            <form className="space-y-4 mt-2" onSubmit={e => { e.preventDefault(); handleAreaPDFGenerate(); }}>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">Área</label>
                                    <input
                                        title='Área'
                                        type="text"
                                        value={areaPDFTarget.area}
                                        onChange={e => {
                                            setAreaPDFTarget(t => ({ ...t, area: e.target.value }));
                                            setAutoCompletedFields(f => ({ ...f, area: false }));
                                        }}
                                        placeholder="Área"
                                        required
                                        disabled={areaPDFLoading || (isUsuario ? true : autoCompletedFields.area)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white"
                                    />
                                    {isUsuario && (
                                        <div className="text-xs text-gray-400 mt-1">Solo un administrador puede editar este campo</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">Director/Jefe</label>
                                    {areaDirectorAmbiguous && areaDirectorOptions.length > 0 ? (
                                        <select
                                            title='Director/Jefe'
                                            className="w-full bg-gray-800 border border-fuchsia-700 rounded-lg px-3 py-2.5 text-white"
                                            value={areaDirectorForm.nombre}
                                            onChange={e => {
                                                const selected = areaDirectorOptions.find(opt => opt.nombre === e.target.value);
                                                setAreaDirectorForm(f => ({
                                                    ...f,
                                                    nombre: selected?.nombre || '',
                                                    puesto: selected?.puesto || ''
                                                }));
                                                setAreaPDFTarget(t => ({ ...t, area: selected?.area || t.area }));
                                                setAutoCompletedFields({
                                                    area: !!selected?.area,
                                                    nombre: !!selected?.nombre,
                                                    puesto: !!selected?.puesto
                                                });
                                            }}
                                            disabled={areaPDFLoading}
                                        >
                                            <option value="">Selecciona...</option>
                                            {areaDirectorOptions.map(opt => (
                                                <option key={opt.id_directorio} value={opt.nombre}>{opt.nombre}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            className="w-full bg-gray-800 border border-fuchsia-700 rounded-lg px-3 py-2.5 text-white"
                                            value={areaDirectorForm.nombre}
                                            onChange={e => {
                                                setAreaDirectorForm(f => ({ ...f, nombre: e.target.value }));
                                                setAutoCompletedFields(f => ({ ...f, nombre: false }));
                                            }}
                                            placeholder="Nombre del director/jefe"
                                            required
                                            disabled={areaPDFLoading || (isUsuario ? true : autoCompletedFields.nombre)}
                                        />
                                    )}
                                    {isUsuario && (
                                        <div className="text-xs text-gray-400 mt-1">Solo un administrador puede editar este campo</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-400 mb-1">Puesto</label>
                                    <input
                                        type="text"
                                        className="w-full bg-gray-800 border border-fuchsia-700 rounded-lg px-3 py-2.5 text-white"
                                        value={areaDirectorForm.puesto ?? ''}
                                        onChange={e => {
                                            setAreaDirectorForm(f => ({ ...f, puesto: e.target.value }));
                                            setAutoCompletedFields(f => ({ ...f, puesto: false }));
                                        }}
                                        placeholder="Puesto del director/jefe"
                                        required
                                        disabled={areaPDFLoading || (isUsuario ? true : autoCompletedFields.puesto)}
                                        autoComplete="off"
                                    />
                                    {isUsuario && (
                                        <div className="text-xs text-gray-400 mt-1">Solo un administrador puede editar este campo</div>
                                    )}
                                </div>
                                {areaPDFError && <div className="text-red-400 text-sm">{areaPDFError}</div>}
                                <div className="w-full flex flex-col items-center gap-4 mt-4">
                                    <button
                                        type="submit"
                                        className={`w-full py-3 px-4 font-medium rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 hover:from-fuchsia-500 hover:to-fuchsia-400 text-black ${areaPDFLoading || !areaDirectorForm.nombre || !areaDirectorForm.puesto || !areaPDFTarget.area ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                        disabled={areaPDFLoading || !areaDirectorForm.nombre || !areaDirectorForm.puesto || !areaPDFTarget.area}
                                    >
                                        {areaPDFLoading ? (
                                            <>
                                                <RefreshCw className="h-5 w-5 animate-spin" />
                                                Generando PDF...
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="h-5 w-5" />
                                                Descargar PDF personalizado
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full">
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
                                ) : muebles.length === 0 ? (
                                    <tr className="h-96">
                                        <td colSpan={6} className="px-6 py-24 text-center text-gray-400">
                                            <Search className="h-12 w-12 text-gray-500" />
                                            <p className="text-lg font-medium">No se encontraron resultados</p>
                                        </td>
                                    </tr>
                                ) : (
                                    muebles.map((item) => (
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
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                        <div className="text-sm text-gray-400 font-medium">
                            Mostrando <span className="text-white">{(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filteredCount)}</span> de <span className="text-white">{filteredCount}</span> registros
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-1 bg-gray-850 rounded-lg p-1">
                                <button
                                    onClick={() => changePage(1)}
                                    disabled={currentPage === 1}
                                    className={`p-1.5 rounded-md flex items-center justify-center ${currentPage === 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                                    title="Primera página"
                                >
                                    <div className="flex">
                                        <ChevronLeft className="h-4 w-4" />
                                        <ChevronLeft className="h-4 w-4 -ml-2" />
                                    </div>
                                </button>
                                <button
                                    onClick={() => changePage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`p-1.5 rounded-md ${currentPage === 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                                    title="Página anterior"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <div className="flex items-center">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(page =>
                                            page === 1 ||
                                            page === totalPages ||
                                            (page >= currentPage - 1 && page <= currentPage + 1)
                                        )
                                        .map((page, i, arr) => (
                                            <React.Fragment key={page}>
                                                {i > 0 && arr[i] - arr[i - 1] > 1 && (
                                                    <span className="px-2 text-gray-400">...</span>
                                                )}
                                                <button
                                                    onClick={() => changePage(page)}
                                                    className={`min-w-[32px] h-8 px-2 rounded-md text-sm font-medium flex items-center justify-center ${currentPage === page ? 'bg-black text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                                        }`}
                                                    title={`Ir a la página ${page}`}
                                                >
                                                    {page}
                                                </button>
                                            </React.Fragment>
                                        ))}
                                </div>
                                <button
                                    onClick={() => changePage(currentPage + 1)}
                                    disabled={currentPage === totalPages || filteredCount === 0}
                                    className={`p-1.5 rounded-md ${currentPage === totalPages || filteredCount === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                                    title="Página siguiente"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => changePage(totalPages)}
                                    disabled={currentPage === totalPages || filteredCount === 0}
                                    className={`p-1.5 rounded-md flex items-center justify-center ${currentPage === totalPages || filteredCount === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                                    title="Última página"
                                >
                                    <div className="flex">
                                        <ChevronRight className="h-4 w-4" />
                                        <ChevronRight className="h-4 w-4 -ml-2" />
                                    </div>
                                </button>
                            </div>
                            <div className="flex items-center bg-gray-850 rounded-lg px-3 py-1.5">
                                <label htmlFor="rowsPerPage" className="text-sm text-gray-400 mr-2">Filas:</label>
                                <select
                                    id="rowsPerPage"
                                    value={rowsPerPage}
                                    onChange={e => {
                                        setRowsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    title="Filas por página"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>
                    </div>
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
                    z-index: 1;
                    transform: rotateY(180deg);
                }
                }
            `}</style>
        </div>
    );
}