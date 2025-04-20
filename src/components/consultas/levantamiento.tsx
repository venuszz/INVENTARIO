"use client";
import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
    Search, RefreshCw, ChevronLeft, ChevronRight,
    ArrowUpDown, AlertCircle, X, Edit, XCircle
} from 'lucide-react';
import supabase from '@/app/lib/supabase/client';

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filteredCount, setFilteredCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<keyof LevMueble>('id_inv');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [filters, setFilters] = useState({
        estado: '',
        estatus: '',
        area: '',
        rubro: '',
        formadq: ''
    });
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        estados: [],
        estatus: [],
        areas: [],
        rubros: [],
        formadq: []
    });
    const [selectedItem, setSelectedItem] = useState<LevMueble | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState<LevMueble | null>(null);
    const [message, setMessage] = useState<Message | null>(null);

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

            setFilterOptions({ estados, estatus, areas, rubros, formadq });
        } catch (error) {
            console.error('Error al cargar opciones de filtro:', error);
            setError('Error al cargar opciones de filtro');
        }
    }, []);

    // Obtener muebles unificados con paginación real
    const fetchMuebles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Construir queries base para count y data
            let countInea = supabase.from('muebles').select('*', { count: 'exact', head: true });
            let countItea = supabase.from('mueblesitea').select('*', { count: 'exact', head: true });
            let dataInea = supabase.from('muebles').select('*');
            let dataItea = supabase.from('mueblesitea').select('*');

            // 2. Aplicar filtros de búsqueda
            if (searchTerm) {
                const search = `%${searchTerm}%`;
                countInea = countInea.or(`id_inv.ilike.${search},descripcion.ilike.${search},resguardante.ilike.${search},usufinal.ilike.${search}`);
                countItea = countItea.or(`id_inv.ilike.${search},descripcion.ilike.${search},resguardante.ilike.${search},usufinal.ilike.${search}`);
                dataInea = dataInea.or(`id_inv.ilike.${search},descripcion.ilike.${search},resguardante.ilike.${search},usufinal.ilike.${search}`);
                dataItea = dataItea.or(`id_inv.ilike.${search},descripcion.ilike.${search},resguardante.ilike.${search},usufinal.ilike.${search}`);
            }

            // 3. Aplicar filtros seleccionados
            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    countInea = countInea.eq(key, value);
                    countItea = countItea.eq(key, value);
                    dataInea = dataInea.eq(key, value);
                    dataItea = dataItea.eq(key, value);
                }
            });

            // 4. Obtener conteos reales
            const [countResInea, countResItea] = await Promise.all([countInea, countItea]);
            const totalInea = countResInea.count || 0;
            const totalItea = countResItea.count || 0;
            const total = totalInea + totalItea;
            setFilteredCount(total);

            // 5. Calcular rangos para paginación combinada
            const fromGlobal = (currentPage - 1) * rowsPerPage;
            const toGlobal = fromGlobal + rowsPerPage - 1;

            // Determinar cuántos registros pedir a cada tabla
            let fromInea = 0, toInea = -1, fromItea = 0, toItea = -1;
            if (fromGlobal < totalInea) {
                fromInea = fromGlobal;
                toInea = Math.min(toGlobal, totalInea - 1);
            }
            if (toGlobal >= totalInea) {
                fromItea = Math.max(0, fromGlobal - totalInea);
                toItea = toGlobal - totalInea;
            }

            // 6. Consultar datos paginados
            const [dataResInea, dataResItea] = await Promise.all([
                toInea >= fromInea ? dataInea.order(sortField, { ascending: sortDirection === 'asc' }).range(fromInea, toInea) : { data: [] },
                toItea >= fromItea ? dataItea.order(sortField, { ascending: sortDirection === 'asc' }).range(fromItea, toItea) : { data: [] },
            ]);

            // 7. Unir resultados y agregar origen
            let pageMuebles: LevMueble[] = [
                ...(dataResInea.data?.map(item => ({ ...item, origen: 'INEA' as const })) || []),
                ...(dataResItea.data?.map(item => ({ ...item, origen: 'ITEA' as const })) || [])
            ];

            // 8. Ordenar resultados combinados (si ambos tienen datos)
            if (dataResInea.data && dataResItea.data && dataResInea.data.length > 0 && dataResItea.data.length > 0) {
                pageMuebles = pageMuebles.sort((a, b) => {
                    const aVal = a[sortField] || '';
                    const bVal = b[sortField] || '';
                    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                    return 0;
                });
            }

            setMuebles(pageMuebles);

            // Resetear item seleccionado si no está en los resultados
            if (selectedItem && !pageMuebles.some(item =>
                item.id === selectedItem.id && item.origen === selectedItem.origen
            )) {
                setSelectedItem(null);
                setIsEditing(false);
                setEditFormData(null);
            }
        } catch (error) {
            console.error('Error al cargar muebles:', error);
            setError('Error al cargar los datos. Por favor, intente nuevamente.');
            setMuebles([]);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, filters, sortField, sortDirection, currentPage, rowsPerPage, selectedItem]);

    // Inicializar
    useEffect(() => {
        fetchFilterOptions();
        fetchMuebles();
    }, [fetchFilterOptions, fetchMuebles]);

    // Resetear página cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filters, sortField, sortDirection, rowsPerPage]);

    // Mensajes temporales
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // Manejar selección de item
    const handleSelectItem = (item: LevMueble) => {
        setSelectedItem(item);
        setIsEditing(false);
        setEditFormData(null);
    };

    // Iniciar edición
    const handleStartEdit = () => {
        if (!selectedItem) return;
        setIsEditing(true);
        setEditFormData({ ...selectedItem });
    };

    // Cancelar edición
    const cancelEdit = () => {
        setIsEditing(false);
        setEditFormData(null);
    };

    // Guardar cambios
    const saveChanges = async () => {
        if (!editFormData) return;

        setLoading(true);
        try {
            const tableName = editFormData.origen === 'INEA' ? 'muebles' : 'mueblesitea';

            const { error } = await supabase
                .from(tableName)
                .update(editFormData)
                .eq('id', editFormData.id);

            if (error) throw error;

            setMessage({
                type: 'success',
                text: 'Cambios guardados correctamente'
            });
            fetchMuebles();
            setSelectedItem(editFormData);
            setIsEditing(false);
            setEditFormData(null);
        } catch (error) {
            console.error('Error al guardar cambios:', error);
            setMessage({
                type: 'error',
                text: 'Error al guardar los cambios. Por favor, intente nuevamente.'
            });
        } finally {
            setLoading(false);
        }
    };

    // Marcar como inactivo
    const markAsInactive = async () => {
        if (!selectedItem) return;
        if (!confirm('¿Está seguro de que desea marcar este artículo como INACTIVO?')) return;

        setLoading(true);
        try {
            const tableName = selectedItem.origen === 'INEA' ? 'muebles' : 'mueblesitea';

            const { error } = await supabase
                .from(tableName)
                .update({ estatus: 'INACTIVO' })
                .eq('id', selectedItem.id);

            if (error) throw error;

            setMessage({
                type: 'success',
                text: 'Artículo marcado como INACTIVO correctamente'
            });
            fetchMuebles();
            setSelectedItem(null);
        } catch (error) {
            console.error('Error al marcar como inactivo:', error);
            setMessage({
                type: 'error',
                text: 'Error al cambiar el estatus. Por favor, intente nuevamente.'
            });
        } finally {
            setLoading(false);
        }
    };

    // Manejar cambios en el formulario de edición
    const handleEditFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
        field: keyof LevMueble
    ) => {
        if (!editFormData) return;

        setEditFormData({
            ...editFormData,
            [field]: e.target.value || null
        });
    };

    // Limpiar filtros
    const clearFilters = () => {
        setFilters({
            estado: '',
            estatus: '',
            area: '',
            rubro: '',
            formadq: ''
        });
        setSearchTerm('');
        setCurrentPage(1);
    };

    // Formatear fecha
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-MX');
    };

    // Calcular total de páginas
    const totalPages = Math.ceil(filteredCount / rowsPerPage);

    // Cambiar página
    const changePage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    // Acortar texto
    const truncateText = (text: string | null, length: number = 50) => {
        if (!text) return '';
        return text.length > length ? `${text.substring(0, length)}...` : text;
    };

    return (
        <div className="bg-black text-white min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
            <div className="w-full mx-auto bg-black rounded-lg sm:rounded-xl shadow-2xl overflow-hidden border border-gray-800">
                {/* Encabezado */}
                <div className="bg-black p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 gap-2 sm:gap-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
                        <span className="mr-2 sm:mr-3 bg-gray-900 text-white p-1 sm:p-2 rounded-lg border border-gray-700 text-sm sm:text-base">LEV</span>
                        Levantamiento de Inventario (INEA + ITEA)
                    </h1>
                    <p className="text-gray-400 text-sm sm:text-base">Vista unificada de todos los bienes registrados</p>
                </div>

                {/* Controles y filtros */}
                <div className="flex flex-col gap-4 p-4">
                    {/* Barra de búsqueda y botones */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                placeholder="Buscar por ID, descripción o usuario..."
                                className="pl-10 pr-4 py-2 w-full bg-black border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                                title="Buscar"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setLoading(true); fetchMuebles(); }}
                                className="px-4 py-2 bg-black text-gray-300 rounded-md font-medium flex items-center gap-2 hover:bg-gray-700 transition-colors"
                                title="Actualizar"
                            >
                                <RefreshCw className="h-4 w-4" />
                                <span className="hidden sm:inline">Actualizar</span>
                            </button>
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 bg-gray-800 text-blue-400 rounded-md text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
                                title="Limpiar filtros"
                            >
                                <X className="h-4 w-4" /> Limpiar filtros
                            </button>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                            <select
                                value={filters.estado}
                                onChange={e => {
                                    setFilters(f => ({ ...f, estado: e.target.value }));
                                    setCurrentPage(1);
                                }}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white"
                                title="Filtrar por estado"
                            >
                                <option value="">Todos</option>
                                {filterOptions.estados.map(e => (
                                    <option key={e} value={e}>{e}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Estatus</label>
                            <select
                                value={filters.estatus}
                                onChange={e => {
                                    setFilters(f => ({ ...f, estatus: e.target.value }));
                                    setCurrentPage(1);
                                }}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white"
                                title="Filtrar por estatus"
                            >
                                <option value="">Todos</option>
                                {filterOptions.estatus.map(e => (
                                    <option key={e} value={e}>{e}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Área</label>
                            <select
                                value={filters.area}
                                onChange={e => {
                                    setFilters(f => ({ ...f, area: e.target.value }));
                                    setCurrentPage(1);
                                }}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white"
                                title="Filtrar por área"
                            >
                                <option value="">Todas</option>
                                {filterOptions.areas.map(e => (
                                    <option key={e} value={e}>{e}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Rubro</label>
                            <select
                                value={filters.rubro}
                                onChange={e => {
                                    setFilters(f => ({ ...f, rubro: e.target.value }));
                                    setCurrentPage(1);
                                }}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white"
                                title="Filtrar por rubro"
                            >
                                <option value="">Todos</option>
                                {filterOptions.rubros.map(e => (
                                    <option key={e} value={e}>{e}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Forma Adq.</label>
                            <select
                                value={filters.formadq}
                                onChange={e => {
                                    setFilters(f => ({ ...f, formadq: e.target.value }));
                                    setCurrentPage(1);
                                }}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white"
                                title="Filtrar por forma de adquisición"
                            >
                                <option value="">Todas</option>
                                {filterOptions.formadq.map(e => (
                                    <option key={e} value={e}>{e}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Mensajes */}
                    {message && (
                        <div className={`p-3 rounded-md ${message.type === 'success' ? 'bg-green-900/50 text-green-300 border border-green-800' :
                                message.type === 'error' ? 'bg-red-900/50 text-red-300 border border-red-800' :
                                    message.type === 'warning' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-800' :
                                        'bg-blue-900/50 text-blue-300 border border-blue-800'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Contenido principal */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Tabla */}
                        <div className={`${selectedItem ? 'lg:w-2/3' : 'w-full'}`}>
                            <div className="bg-black rounded-lg border border-gray-800 overflow-x-auto overflow-y-auto flex flex-col flex-grow max-h-[70vh]">
                                <table className="min-w-full divide-y divide-gray-800">
                                    <thead className="bg-black sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Origen</th>
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
                                                <div className="flex items-center gap-1">Director/Jefe<ArrowUpDown className="h-3 w-3" /></div>
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
                                        {loading ? (
                                            <tr className="h-96">
                                                <td colSpan={6} className="px-6 py-24 text-center text-gray-400">
                                                    <div className="flex flex-col items-center justify-center space-y-4">
                                                        <RefreshCw className="h-12 w-12 animate-spin text-gray-500" />
                                                        <p className="text-lg font-medium">Cargando datos...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : error ? (
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
                                                    className={`hover:bg-gray-800 cursor-pointer transition-colors ${selectedItem?.id === item.id && selectedItem?.origen === item.origen ? 'bg-gray-800' : ''
                                                        }`}
                                                    onClick={() => handleSelectItem(item)}
                                                >
                                                    <td className="px-4 py-3 text-xs">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold ${ORIGEN_COLORS[item.origen]}`}>
                                                            {item.origen}
                                                        </span>
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
                                                        {truncateText(item.usufinal, 20)}
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

                            {/* Paginación */}
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

                        {/* Detalle del item seleccionado */}
                        {selectedItem && (
                            <div className="lg:w-1/3 bg-gray-900 rounded-lg border border-gray-800 p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">
                                        Detalle del Bien
                                    </h2>
                                    <button
                                        onClick={() => setSelectedItem(null)}
                                        className="text-gray-400 hover:text-white"
                                        title="Cerrar detalle"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">ID Inventario</label>
                                                <input
                                                    type="text"
                                                    value={editFormData?.id_inv || ''}
                                                    onChange={e => handleEditFormChange(e, 'id_inv')}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
                                                    placeholder="ID Inventario"
                                                    title="ID Inventario"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                                                <textarea
                                                    value={editFormData?.descripcion || ''}
                                                    onChange={e => handleEditFormChange(e, 'descripcion')}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
                                                    rows={3}
                                                    placeholder="Descripción"
                                                    title="Descripción"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Rubro</label>
                                                <select
                                                    value={editFormData?.rubro || ''}
                                                    onChange={e => handleEditFormChange(e, 'rubro')}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
                                                    title="Rubro"
                                                >
                                                    <option value="">Seleccionar rubro</option>
                                                    {filterOptions.rubros.map(rubro => (
                                                        <option key={rubro} value={rubro}>{rubro}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Valor</label>
                                                <input
                                                    type="text"
                                                    value={editFormData?.valor?.toString() || ''}
                                                    onChange={e => handleEditFormChange(e, 'valor')}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
                                                    placeholder="Valor"
                                                    title="Valor"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Fecha Adquisición</label>
                                                <input
                                                    type="date"
                                                    value={editFormData?.f_adq || ''}
                                                    onChange={e => handleEditFormChange(e, 'f_adq')}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
                                                    placeholder="Fecha de adquisición"
                                                    title="Fecha de adquisición"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Forma Adquisición</label>
                                                <select
                                                    value={editFormData?.formadq || ''}
                                                    onChange={e => handleEditFormChange(e, 'formadq')}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
                                                    title="Forma de adquisición"
                                                >
                                                    <option value="">Seleccionar forma</option>
                                                    {filterOptions.formadq.map(formadq => (
                                                        <option key={formadq} value={formadq}>{formadq}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Proveedor</label>
                                                <input
                                                    type="text"
                                                    value={editFormData?.proveedor || ''}
                                                    onChange={e => handleEditFormChange(e, 'proveedor')}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
                                                    placeholder="Proveedor"
                                                    title="Proveedor"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Factura</label>
                                                <input
                                                    type="text"
                                                    value={editFormData?.factura || ''}
                                                    onChange={e => handleEditFormChange(e, 'factura')}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
                                                    placeholder="Factura"
                                                    title="Factura"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                                                <select
                                                    value={editFormData?.estado || ''}
                                                    onChange={e => handleEditFormChange(e, 'estado')}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
                                                    title="Estado"
                                                >
                                                    <option value="">Seleccionar estado</option>
                                                    {filterOptions.estados.map(estado => (
                                                        <option key={estado} value={estado}>{estado}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Estatus</label>
                                                <select
                                                    value={editFormData?.estatus || ''}
                                                    onChange={e => handleEditFormChange(e, 'estatus')}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
                                                    title="Estatus"
                                                >
                                                    <option value="">Seleccionar estatus</option>
                                                    {filterOptions.estatus.map(estatus => (
                                                        <option key={estatus} value={estatus}>{estatus}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Área</label>
                                                <input
                                                    type="text"
                                                    value={editFormData?.area || ''}
                                                    onChange={e => handleEditFormChange(e, 'area')}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
                                                    placeholder="Área"
                                                    title="Área"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Usuario Final</label>
                                                <input
                                                    type="text"
                                                    value={editFormData?.usufinal || ''}
                                                    onChange={e => handleEditFormChange(e, 'usufinal')}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
                                                    placeholder="Usuario final"
                                                    title="Usuario final"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Resguardante</label>
                                                <input
                                                    type="text"
                                                    value={editFormData?.resguardante || ''}
                                                    onChange={e => handleEditFormChange(e, 'resguardante')}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
                                                    placeholder="Resguardante"
                                                    title="Resguardante"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-4">
                                            <button
                                                onClick={cancelEdit}
                                                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                                                title="Cancelar edición"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={saveChanges}
                                                disabled={loading}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                title="Guardar cambios"
                                            >
                                                {loading ? 'Guardando...' : 'Guardar Cambios'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${ORIGEN_COLORS[selectedItem.origen]}`}>
                                                    {selectedItem.origen}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleStartEdit}
                                                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-md transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={markAsInactive}
                                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-md transition-colors"
                                                    title="Marcar como inactivo"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-400">ID Inventario</p>
                                                <p className="text-white font-medium">{selectedItem.id_inv}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">Rubro</p>
                                                <p className="text-white font-medium">{selectedItem.rubro || 'N/A'}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-sm text-gray-400">Descripción</p>
                                                <p className="text-white font-medium">{selectedItem.descripcion || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">Valor</p>
                                                <p className="text-white font-medium">
                                                    {selectedItem.valor ?
                                                        typeof selectedItem.valor === 'number' ?
                                                            `$${selectedItem.valor.toLocaleString('es-MX')}` :
                                                            selectedItem.valor
                                                        : 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">Fecha Adquisición</p>
                                                <p className="text-white font-medium">{formatDate(selectedItem.f_adq) || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">Forma Adquisición</p>
                                                <p className="text-white font-medium">{selectedItem.formadq || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">Proveedor</p>
                                                <p className="text-white font-medium">{selectedItem.proveedor || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">Factura</p>
                                                <p className="text-white font-medium">{selectedItem.factura || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">Estado</p>
                                                <p className="text-white font-medium">{selectedItem.estado || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">Estatus</p>
                                                <p className="text-white font-medium">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${selectedItem.estatus === 'ACTIVO' ? ESTATUS_COLORS.ACTIVO :
                                                            selectedItem.estatus === 'INACTIVO' ? ESTATUS_COLORS.INACTIVO :
                                                                selectedItem.estatus === 'NO LOCALIZADO' ? ESTATUS_COLORS['NO LOCALIZADO'] :
                                                                    ESTATUS_COLORS.DEFAULT
                                                        }`}>
                                                        {selectedItem.estatus || 'N/A'}
                                                    </span>
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">Área</p>
                                                <p className="text-white font-medium">{selectedItem.area || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">Usuario Final</p>
                                                <p className="text-white font-medium">{selectedItem.usufinal || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400">Resguardante</p>
                                                <p className="text-white font-medium">{selectedItem.resguardante || 'N/A'}</p>
                                            </div>
                                            {selectedItem.fechabaja && (
                                                <div>
                                                    <p className="text-sm text-gray-400">Fecha de Baja</p>
                                                    <p className="text-white font-medium">{formatDate(selectedItem.fechabaja)}</p>
                                                </div>
                                            )}
                                            {selectedItem.causadebaja && (
                                                <div>
                                                    <p className="text-sm text-gray-400">Causa de Baja</p>
                                                    <p className="text-white font-medium">{selectedItem.causadebaja}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}