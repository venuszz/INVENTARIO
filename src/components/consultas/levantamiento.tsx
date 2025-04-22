"use client";
import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
    Search, RefreshCw, ChevronLeft, ChevronRight,
    ArrowUpDown, AlertCircle, X, FileText, Download, 
    FileDigit, FileDown, FileUp, DollarSign
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
    const [message, setMessage] = useState<Message | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportType, setExportType] = useState<'pdf' | 'excel' | null>(null);
    const [totalValue, setTotalValue] = useState(0);
    const [totalValueAllItems, setTotalValueAllItems] = useState(0);

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

    // Función para sumar valores filtrados (ambas tablas)
    const sumFilteredValues = async (filters: {
        estado?: string;
        estatus?: string;
        area?: string;
        rubro?: string;
        formadq?: string;
    }) => {
        let total = 0;
        const sumTable = async (table: 'muebles' | 'mueblesitea') => {
            let from = 0;
            const pageSize = 1000;
            let keepGoing = true;
            while (keepGoing) {
                let query = supabase
                    .from(table)
                    .select('valor')
                    .neq('estatus', 'BAJA');
                if (filters.estado) query = query.eq('estado', filters.estado);
                if (filters.estatus) query = query.eq('estatus', filters.estatus);
                if (filters.area) query = query.eq('area', filters.area);
                if (filters.rubro) query = query.eq('rubro', filters.rubro);
                if (filters.formadq) query = query.eq('formadq', filters.formadq);
                const { data, error } = await query.range(from, from + pageSize - 1);
                if (error) break;
                if (data && data.length > 0) {
                    total += data.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0);
                    if (data.length < pageSize) {
                        keepGoing = false;
                    } else {
                        from += pageSize;
                    }
                } else {
                    keepGoing = false;
                }
            }
        };
        await sumTable('muebles');
        await sumTable('mueblesitea');
        return total;
    };

    // Función para sumar todos los valores (sin filtros)
    const sumAllValues = async () => {
        let total = 0;
        const sumTable = async (table: 'muebles' | 'mueblesitea') => {
            let from = 0;
            const pageSize = 1000;
            let keepGoing = true;
            while (keepGoing) {
                const { data, error } = await supabase
                    .from(table)
                    .select('valor')
                    .neq('estatus', 'BAJA')
                    .range(from, from + pageSize - 1);
                if (error) break;
                if (data && data.length > 0) {
                    total += data.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0);
                    if (data.length < pageSize) {
                        keepGoing = false;
                    } else {
                        from += pageSize;
                    }
                } else {
                    keepGoing = false;
                }
            }
        };
        await sumTable('muebles');
        await sumTable('mueblesitea');
        return total;
    };

    // Obtener muebles unificados con paginación real
    const fetchMuebles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let countInea = supabase.from('muebles').select('*', { count: 'exact', head: true });
            let countItea = supabase.from('mueblesitea').select('*', { count: 'exact', head: true });
            let dataInea = supabase.from('muebles').select('*');
            let dataItea = supabase.from('mueblesitea').select('*');

            if (searchTerm) {
                const search = `%${searchTerm}%`;
                countInea = countInea.or(`id_inv.ilike.${search},descripcion.ilike.${search},resguardante.ilike.${search},usufinal.ilike.${search}`);
                countItea = countItea.or(`id_inv.ilike.${search},descripcion.ilike.${search},resguardante.ilike.${search},usufinal.ilike.${search}`);
                dataInea = dataInea.or(`id_inv.ilike.${search},descripcion.ilike.${search},resguardante.ilike.${search},usufinal.ilike.${search}`);
                dataItea = dataItea.or(`id_inv.ilike.${search},descripcion.ilike.${search},resguardante.ilike.${search},usufinal.ilike.${search}`);
            }

            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    countInea = countInea.eq(key, value);
                    countItea = countItea.eq(key, value);
                    dataInea = dataInea.eq(key, value);
                    dataItea = dataItea.eq(key, value);
                }
            });

            const [countResInea, countResItea] = await Promise.all([countInea, countItea]);
            const totalInea = countResInea.count || 0;
            const totalItea = countResItea.count || 0;
            const total = totalInea + totalItea;
            setFilteredCount(total);

            const fromGlobal = (currentPage - 1) * rowsPerPage;
            const toGlobal = fromGlobal + rowsPerPage - 1;

            let fromInea = 0, toInea = -1, fromItea = 0, toItea = -1;
            if (fromGlobal < totalInea) {
                fromInea = fromGlobal;
                toInea = Math.min(toGlobal, totalInea - 1);
            }
            if (toGlobal >= totalInea) {
                fromItea = Math.max(0, fromGlobal - totalInea);
                toItea = toGlobal - totalItea;
            }

            const [dataResInea, dataResItea] = await Promise.all([
                toInea >= fromInea ? dataInea.order(sortField, { ascending: sortDirection === 'asc' }).range(fromInea, toInea) : { data: [] },
                toItea >= fromItea ? dataItea.order(sortField, { ascending: sortDirection === 'asc' }).range(fromItea, toItea) : { data: [] },
            ]);

            let pageMuebles: LevMueble[] = [
                ...(dataResInea.data?.map(item => ({ ...item, origen: 'INEA' as const })) || []),
                ...(dataResItea.data?.map(item => ({ ...item, origen: 'ITEA' as const })) || [])
            ];

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

            if (selectedItem && !pageMuebles.some(item =>
                item.id === selectedItem.id && item.origen === selectedItem.origen
            )) {
                setSelectedItem(null);
            }

            const totalFilteredItems = await sumFilteredValues(filters);
            setTotalValue(totalFilteredItems);
            if (!Object.values(filters).some(value => value !== '')) {
                const totalAllItems = await sumAllValues();
                setTotalValueAllItems(totalAllItems);
            } else {
                if (totalValueAllItems === 0) {
                    const totalAllItems = await sumAllValues();
                    setTotalValueAllItems(totalAllItems);
                }
            }
        } catch (error) {
            console.error('Error al cargar muebles:', error);
            setError('Error al cargar los datos. Por favor, intente nuevamente.');
            setMuebles([]);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, filters, sortField, sortDirection, currentPage, rowsPerPage, selectedItem, totalValueAllItems]);

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

    const totalPages = Math.ceil(filteredCount / rowsPerPage);

    const changePage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const truncateText = (text: string | null, length: number = 50) => {
        if (!text) return '';
        return text.length > length ? `${text.substring(0, length)}...` : text;
    };

    const handleExport = (type: 'pdf' | 'excel') => {
        setExportType(type);
        setShowExportModal(true);
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
                <div className="bg-black p-4 border-b border-gray-800 flex justify-center items-center">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                                <DollarSign className="h-6 w-6 text-blue-400" />
                            </div>
                            <div className="flex flex-col items-center justify-center text-center">
                                <h3 className="text-sm font-medium text-gray-400">Valor Total del Inventario</h3>
                                <p className="text-2xl font-bold text-white">
                                    ${(Object.values(filters).some(value => value !== '') ? totalValue : totalValueAllItems).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-4 p-4">
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
                                onClick={() => handleExport('pdf')}
                                className="px-4 py-2 bg-red-700 text-white rounded-md font-medium flex items-center gap-2 hover:bg-red-800 transition-colors border border-red-800"
                                title="Exportar a PDF"
                            >
                                <FileText className="h-4 w-4" />
                                <span className="hidden sm:inline">PDF</span>
                            </button>
                            <button
                                onClick={() => handleExport('excel')}
                                className="px-4 py-2 bg-green-700 text-white rounded-md font-medium flex items-center gap-2 hover:bg-green-800 transition-colors border border-green-800"
                                title="Exportar a Excel"
                            >
                                <FileUp className="h-4 w-4" />
                                <span className="hidden sm:inline">Excel</span>
                            </button>
                            <button
                                onClick={() => { setLoading(true); fetchMuebles(); }}
                                className="px-4 py-2 bg-black text-gray-300 rounded-md font-medium flex items-center gap-2 hover:bg-gray-700 transition-colors"
                                title="Actualizar"
                            >
                                <RefreshCw className="h-4 w-4" />
                                <span className="hidden sm:inline">Actualizar</span>
                            </button>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-4 py-2 bg-gray-800 text-blue-400 rounded-md text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
                                title={showFilters ? "Ocultar filtros" : "Mostrar filtros"}
                            >
                                {showFilters ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                                {showFilters ? "Ocultar filtros" : "Filtrar"}
                            </button>
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 bg-gray-800 text-blue-400 rounded-md text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
                                title="Limpiar filtros"
                            >
                                <X className="h-4 w-4" /> Limpiar
                            </button>
                        </div>
                    </div>
                    {showFilters && (
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
                    )}
                    {message && (
                        <div className={`p-3 rounded-md ${message.type === 'success' ? 'bg-green-900/50 text-green-300 border border-green-800' :
                                message.type === 'error' ? 'bg-red-900/50 text-red-300 border border-red-800' :
                                    message.type === 'warning' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-800' :
                                        'bg-blue-900/50 text-blue-300 border border-blue-800'
                            }`}>
                            {message.text}
                        </div>
                    )}
                    {showExportModal && (
                        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 animate-fadeIn">
                            <div className={`bg-black rounded-2xl shadow-2xl border w-full max-w-md overflow-hidden transition-all duration-300 transform
                                ${exportType === 'pdf' ? 'border-red-600/30' : 'border-green-600/30'}`}
                            >
                                <div className={`relative p-6 bg-gradient-to-b from-black to-gray-900
                                    ${exportType === 'pdf' ? 'from-red-950 to-red-900' : 'from-green-950 to-green-900'}`}
                                >
                                    <div className={`absolute top-0 left-0 w-full h-1 
                                        ${exportType === 'pdf'
                                            ? 'bg-gradient-to-r from-red-500/60 via-red-400 to-red-500/60'
                                            : 'bg-gradient-to-r from-green-500/60 via-green-400 to-green-500/60'}
                                    `}></div>

                                    <button
                                        onClick={() => setShowExportModal(false)}
                                        className={`absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-gray-900 
                                            ${exportType === 'pdf' ? 'text-red-400 hover:text-red-500 border border-red-500/30' : 'text-green-400 hover:text-green-500 border border-green-500/30'}
                                            transition-colors`}
                                        title="Cerrar"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>

                                    <div className="flex flex-col items-center text-center mb-4">
                                        <div className={`p-3 rounded-full border mb-3 
                                            ${exportType === 'pdf' ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}
                                        >
                                            {exportType === 'pdf' ? (
                                                <FileDigit className="h-8 w-8 text-red-500" />
                                            ) : (
                                                <FileDown className="h-8 w-8 text-green-500" />
                                            )}
                                        </div>
                                        <h3 className={`text-2xl font-bold ${exportType === 'pdf' ? 'text-red-400' : 'text-green-400'}`}
                                        >
                                            {exportType === 'pdf' ? 'Exportar a PDF' : 'Exportar a Excel'}
                                        </h3>
                                        <p className="text-gray-400 mt-2">
                                            {exportType === 'pdf' 
                                                ? 'Generar un documento PDF con los resultados actuales' 
                                                : 'Exportar los datos a un archivo Excel para su análisis'}
                                        </p>
                                    </div>

                                    <div className="space-y-5 mt-6">
                                        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                                            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Documento a generar</label>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-800 rounded-lg">
                                                    {exportType === 'pdf' ? (
                                                        <FileText className="h-4 w-4 text-red-400" />
                                                    ) : (
                                                        <FileUp className="h-4 w-4 text-green-400" />
                                                    )}
                                                </div>
                                                <span className="text-white font-medium">
                                                    {exportType === 'pdf'
                                                        ? `Reporte de inventario_${new Date().toISOString().slice(0, 10)}.pdf`
                                                        : `Reporte_inventario_${new Date().toISOString().slice(0, 10)}.xlsx`}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-full flex flex-col items-center gap-4">
                                            <div className="w-full">
                                                <button
                                                    className={`w-full py-3 px-4 font-medium rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg
                                                        ${exportType === 'pdf'
                                                            ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white'
                                                            : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-black'}
                                                    `}
                                                >
                                                    <Download className="h-5 w-5" />
                                                    {exportType === 'pdf' ? 'Generar PDF' : 'Descargar Excel'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
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
                                                    className={
                                                        `transition-colors`
                                                    }
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
                </div>
            </div>
        </div>
    );
}