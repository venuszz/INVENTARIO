"use client"
import { useState, useEffect } from 'react';
import {
    Search, Download, RefreshCw, Filter, ChevronLeft, ChevronRight,
    ArrowUpDown, Info, AlertCircle
} from 'lucide-react';
import supabase from '@/app/lib/supabase/client';

// Definir la interfaz para los objetos de mueble
interface Mueble {
    id: number;
    id_inv: string;
    rubro: string;
    descripcion: string;
    valor: number;
    f_adq: string;
    formadq: string;
    proveedor: string;
    factura: string;
    ubicacion_es: string;
    ubicacion_mu: string;
    ubicacion_no: string;
    estado: string;
    estatus: string;
    area: string;
    usufinal: string;
    fechabaja: string;
    causadebaja: string;
    resguardante: string;
}

export default function ConsultasIneaGeneral() {
    // Estados para manejar los datos y la paginación
    const [muebles, setMuebles] = useState<Mueble[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filteredCount, setFilteredCount] = useState(0);

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Estados para filtros y ordenamiento
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<keyof Mueble>('id_inv');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [filters, setFilters] = useState({
        estado: '',
        estatus: '',
        area: '',
        rubro: ''
    });

    // Estados para opciones de filtro
    const [filterOptions, setFilterOptions] = useState({
        estados: [] as string[],
        estatus: [] as string[],
        areas: [] as string[],
        rubros: [] as string[]
    });

    // Estado para mostrar/ocultar el panel de filtros
    const [showFilters, setShowFilters] = useState(false);

    // Cargar datos iniciales
    useEffect(() => {
        fetchMuebles();
        fetchFilterOptions();
    }, [currentPage, rowsPerPage, sortField, sortDirection]);

    // Efecto para aplicar filtros cuando cambian
    useEffect(() => {
        if (searchTerm || filters.estado || filters.estatus || filters.area || filters.rubro) {
            fetchMuebles();
        }
    }, [searchTerm, filters]);

    // Función para obtener las opciones de filtro
    const fetchFilterOptions = async () => {
        try {
            // Obtener estados únicos
            const { data: estados, error: estadosError } = await supabase
                .from('muebles')
                .select('estado')
                .filter('estado', 'not.is', null)
                .limit(1000);

            // Obtener estatus únicos
            const { data: estatus, error: estatusError } = await supabase
                .from('muebles')
                .select('estatus')
                .filter('estatus', 'not.is', null)
                .limit(1000);

            // Obtener áreas únicas
            const { data: areas, error: areasError } = await supabase
                .from('muebles')
                .select('area')
                .filter('area', 'not.is', null)
                .limit(1000);

            // Obtener rubros únicos
            const { data: rubros, error: rubrosError } = await supabase
                .from('muebles')
                .select('rubro')
                .filter('rubro', 'not.is', null)
                .limit(1000);

            if (estadosError || estatusError || areasError || rubrosError) {
                throw new Error('Error al cargar opciones de filtro');
            }

            setFilterOptions({
                estados: [...new Set(estados.map(item => item.estado))].filter(Boolean).sort(),
                estatus: [...new Set(estatus.map(item => item.estatus))].filter(Boolean).sort(),
                areas: [...new Set(areas.map(item => item.area))].filter(Boolean).sort(),
                rubros: [...new Set(rubros.map(item => item.rubro))].filter(Boolean).sort()
            });
        } catch (error) {
            console.error('Error al cargar opciones de filtro:', error);
        }
    };

    // Función para obtener los muebles de Supabase
    const fetchMuebles = async () => {
        setLoading(true);

        try {
            // Construir la consulta base
            let query = supabase.from('muebles').select('*');

            // Aplicar filtros si existen
            if (searchTerm) {
                query = query.or(`id_inv.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%,resguardante.ilike.%${searchTerm}%`);
            }

            if (filters.estado) {
                query = query.eq('estado', filters.estado);
            }

            if (filters.estatus) {
                query = query.eq('estatus', filters.estatus);
            }

            if (filters.area) {
                query = query.eq('area', filters.area);
            }

            if (filters.rubro) {
                query = query.eq('rubro', filters.rubro);
            }

            // Contar los resultados filtrados
            const { count: filteredCountResult, error: filteredCountError } = await query
                .select('*')
                .range(0, 0)

            if (filteredCountError) throw filteredCountError;
            setFilteredCount(filteredCountResult || 0);

            // Aplicar ordenamiento y paginación
            const { data, error } = await query
                .order(sortField, { ascending: sortDirection === 'asc' })
                .range((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage - 1);

            if (error) throw error;

            setMuebles((data as Mueble[]) || []);
            setError(null);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Error al cargar los datos. Por favor, intente nuevamente.');
            setMuebles([]);
        } finally {
            setLoading(false);
        }
    };

    // Función para limpiar todos los filtros
    const clearFilters = () => {
        setSearchTerm('');
        setFilters({
            estado: '',
            estatus: '',
            area: '',
            rubro: ''
        });
        setCurrentPage(1);
    };

    // Función para exportar a CSV
    const exportToCSV = () => {
        // Verificar si hay datos para exportar
        if (muebles.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        // Crear encabezados CSV
        const headers = Object.keys(muebles[0]).join(',');

        // Crear filas CSV
        const rows = muebles.map(item =>
            Object.values(item).map(value =>
                value === null ? '' :
                    typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
            ).join(',')
        ).join('\n');

        // Combinar encabezados y filas
        const csv = `${headers}\n${rows}`;

        // Crear blob y enlace de descarga
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        // Configurar enlace y descargar
        link.setAttribute('href', url);
        link.setAttribute('download', `inventario_inea_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Función para manejar el cambio de ordenamiento
    const handleSort = (field: keyof Mueble) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    // Función para formatear fechas
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-MX');
    };

    // Calcular el número total de páginas
    const totalPages = Math.ceil(filteredCount / rowsPerPage);

    // Función para cambiar de página
    const changePage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Generar un array con los números de página a mostrar
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Siempre mostrar la primera página
            pages.push(1);

            let startPage = Math.max(2, currentPage - 1);
            let endPage = Math.min(totalPages - 1, currentPage + 1);

            // Ajustar si estamos cerca del inicio
            if (currentPage <= 3) {
                endPage = Math.min(totalPages - 1, 4);
            }

            // Ajustar si estamos cerca del final
            if (currentPage >= totalPages - 2) {
                startPage = Math.max(2, totalPages - 3);
            }

            // Agregar elipsis después de la página 1 si es necesario
            if (startPage > 2) {
                pages.push('...');
            }

            // Agregar páginas intermedias
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            // Agregar elipsis antes de la última página si es necesario
            if (endPage < totalPages - 1) {
                pages.push('...');
            }

            // Siempre mostrar la última página
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <div className="bg-black text-white min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                {/* Encabezado */}
                <div className="mb-6 border-b border-gray-700 pb-4">
                    <h1 className="text-2xl font-bold text-white">Consulta de Inventario INEA</h1>
                    <p className="text-gray-400">Vista general de todos los bienes registrados en el sistema.</p>
                </div>

                {/* Panel de acciones y búsqueda */}
                <div className="mb-6 bg-gray-900 p-5 rounded-lg border border-gray-800">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Buscar por ID, descripción o resguardante..."
                                className="pl-10 pr-4 py-2 w-full bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors ${Object.values(filters).some(value => value !== '')
                                    ? 'bg-blue-900 text-blue-200 hover:bg-blue-800'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                <Filter className="h-4 w-4" />
                                Filtros
                                {Object.values(filters).some(value => value !== '') && (
                                    <span className="ml-1 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                        {Object.values(filters).filter(value => value !== '').length}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={fetchMuebles}
                                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-md font-medium flex items-center gap-2 hover:bg-gray-700 transition-colors"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Actualizar
                            </button>

                            <button
                                onClick={exportToCSV}
                                className="px-4 py-2 bg-green-900 text-green-200 rounded-md font-medium flex items-center gap-2 hover:bg-green-800 transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                Exportar
                            </button>
                        </div>
                    </div>

                    {/* Panel de filtros desplegable */}
                    {showFilters && (
                        <div className="mt-4 p-5 border border-gray-700 rounded-lg bg-gray-800/90 shadow-lg backdrop-blur-sm transition-all duration-300">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
                                <h3 className="font-semibold text-gray-200 text-lg">Filtros avanzados</h3>
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors duration-200 px-3 py-1 rounded hover:bg-gray-700/50"
                                >
                                    <span>Limpiar filtros</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                <div className="filter-group">
                                    <label htmlFor="estado-select" className="block text-sm font-medium text-gray-300 mb-2">Estado</label>
                                    <div className="relative">
                                        <select
                                            id="estado-select"
                                            title="Seleccionar estado"
                                            value={filters.estado}
                                            onChange={(e) => {
                                                setFilters({ ...filters, estado: e.target.value });
                                                setCurrentPage(1);
                                            }}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all duration-200"
                                        >
                                            <option value="">Todos</option>
                                            {filterOptions.estados.map((estado) => (
                                                <option key={estado} value={estado}>{estado}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="filter-group">
                                    <label htmlFor="estatus-select" className="block text-sm font-medium text-gray-300 mb-2">Estatus</label>
                                    <div className="relative">
                                        <select
                                            id="estatus-select"
                                            title="Seleccionar estatus"
                                            value={filters.estatus}
                                            onChange={(e) => {
                                                setFilters({ ...filters, estatus: e.target.value });
                                                setCurrentPage(1);
                                            }}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all duration-200"
                                        >
                                            <option value="">Todos</option>
                                            {filterOptions.estatus.map((status) => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="filter-group">
                                    <label htmlFor="area-select" className="block text-sm font-medium text-gray-300 mb-2">Área</label>
                                    <div className="relative">
                                        <select
                                            id="area-select"
                                            title="Seleccionar área"
                                            value={filters.area}
                                            onChange={(e) => {
                                                setFilters({ ...filters, area: e.target.value });
                                                setCurrentPage(1);
                                            }}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all duration-200"
                                        >
                                            <option value="">Todas</option>
                                            {filterOptions.areas.map((area) => (
                                                <option key={area} value={area}>{area}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="filter-group">
                                    <label htmlFor="rubro-select" className="block text-sm font-medium text-gray-300 mb-2">Rubro</label>
                                    <div className="relative">
                                        <select
                                            id="rubro-select"
                                            title="Seleccionar rubro"
                                            value={filters.rubro}
                                            onChange={(e) => {
                                                setFilters({ ...filters, rubro: e.target.value });
                                                setCurrentPage(1);
                                            }}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all duration-200"
                                        >
                                            <option value="">Todos</option>
                                            {filterOptions.rubros.map((rubro) => (
                                                <option key={rubro} value={rubro}>{rubro}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                    {/* Tabla de datos */}
                    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden mb-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-800">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th
                                            onClick={() => handleSort('id_inv')}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                        >
                                            <div className="flex items-center gap-1">
                                                ID Inventario
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('rubro')}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                        >
                                            <div className="flex items-center gap-1">
                                                Rubro
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('descripcion')}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                        >
                                            <div className="flex items-center gap-1">
                                                Descripción
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('valor')}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                        >
                                            <div className="flex items-center gap-1">
                                                Valor
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('f_adq')}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                        >
                                            <div className="flex items-center gap-1">
                                                Fecha Adq.
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('formadq')}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                        >
                                            <div className="flex items-center gap-1">
                                                Forma Adq.
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('proveedor')}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                        >
                                            <div className="flex items-center gap-1">
                                                Proveedor
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('factura')}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                        >
                                            <div className="flex items-center gap-1">
                                                Factura
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('ubicacion_es')}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                        >
                                            <div className="flex items-center gap-1">
                                                Ubicación ES
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('ubicacion_mu')}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                        >
                                            <div className="flex items-center gap-1">
                                                Ubicación MU
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('ubicacion_no')}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                        >
                                            <div className="flex items-center gap-1">
                                                Ubicación NO
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('estado')}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                        >
                                            <div className="flex items-center gap-1">
                                                Estado
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('estatus')}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                        >
                                            <div className="flex items-center gap-1">
                                                Estatus
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('area')}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                        >
                                            <div className="flex items-center gap-1">
                                                Área
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('usufinal')}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                        >
                                            <div className="flex items-center gap-1">
                                                Usuario Final
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('fechabaja')}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                        >
                                            <div className="flex items-center gap-1">
                                                Fecha Baja
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('causadebaja')}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                        >
                                            <div className="flex items-center gap-1">
                                                Causa de Baja
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th
                                            onClick={() => handleSort('resguardante')}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                        >
                                            <div className="flex items-center gap-1">
                                                Resguardante
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-900 divide-y divide-gray-800">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={21} className="px-6 py-4 text-center text-gray-400">
                                                <div className="flex justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                                </div>
                                                <div className="mt-2">Cargando datos...</div>
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan={21} className="px-6 py-4 text-center text-red-400">
                                                <div className="flex items-center justify-center gap-2">
                                                    <AlertCircle className="h-5 w-5" />
                                                    {error}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : muebles.length === 0 ? (
                                        <tr>
                                            <td colSpan={21} className="px-6 py-4 text-center text-gray-400">
                                                No se encontraron resultados
                                            </td>
                                        </tr>
                                    ) : (
                                        muebles.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-800">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                                    {item.id_inv || "No Data"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    {item.rubro || "No Data"}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-300">
                                                    {item.descripcion?.length > 50
                                                        ? `${item.descripcion.substring(0, 50)}...`
                                                        : item.descripcion || "No Data"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    {item.valor || "No Data"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    {formatDate(item.f_adq) || "No Data"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    {item.formadq || "No Data"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    {item.proveedor || "No Data"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    {item.factura || "No Data"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    {item.ubicacion_es || "No Data"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    {item.ubicacion_mu || "No Data"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    {item.ubicacion_no || "No Data"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.estado === 'B' || item.estado === 'BUENO' ? 'bg-green-900 text-green-200' :
                                                        item.estado === 'R' || item.estado === 'REGULAR' ? 'bg-yellow-900 text-yellow-200' :
                                                            item.estado === 'M' || item.estado === 'MALO' ? 'bg-red-900 text-red-200' :
                                                                'bg-gray-700 text-gray-300'
                                                        }`}>
                                                        {item.estado === 'b' ? 'BUENO' :
                                                            item.estado === 'r' ? 'REGULAR' :
                                                                item.estado === 'm' ? 'MALO' :
                                                                    item.estado || "No Data"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.estatus === 'ACTIVO' ? 'bg-blue-900 text-blue-200' :
                                                        item.estatus === 'INACTIVO' ? 'bg-gray-700 text-gray-300' :
                                                            item.estatus === 'NO LOCALIZADO' ? 'bg-red-900 text-red-200' :
                                                                item.estatus === 'OBSOLETO' ? 'bg-purple-900 text-purple-200' :
                                                                    'bg-gray-700 text-gray-300'
                                                        }`}>
                                                        {item.estatus || "No Data"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    {item.area || "No Data"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    {item.usufinal || "No Data"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    {formatDate(item.fechabaja) || "No Data"}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-300">
                                                    {item.causadebaja?.length > 50
                                                        ? `${item.causadebaja.substring(0, 50)}...`
                                                        : item.causadebaja || "No Data"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                    {item.resguardante || "No Data"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <button
                                                        className="text-blue-400 hover:text-blue-300 focus:outline-none"
                                                        title="Ver detalles"
                                                    >
                                                        <Info className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Paginación */}
                    {!loading && !error && muebles.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">Filas por página:</span>
                                <label htmlFor="rowsPerPage" className="sr-only">Filas por página</label>
                                <select
                                    id="rowsPerPage"
                                    title="Filas por página"
                                    value={rowsPerPage}
                                    onChange={(e) => {
                                        setRowsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="bg-gray-800 border border-gray-700 rounded-md text-sm px-2 py-1 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {[10, 25, 50, 100].map(size => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                                <span className="text-sm text-gray-400">
                                    Página {currentPage} de {totalPages}
                                </span>
                            </div>

                            <div className="flex items-center">
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    <button
                                        onClick={() => changePage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-700 hover:bg-gray-800 focus:z-20 focus:outline-offset-0 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                    >
                                        <span className="sr-only">Anterior</span>
                                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                    </button>

                                    {getPageNumbers().map((page, index) => (
                                        page === '...' ? (
                                            <span
                                                key={`ellipsis-${index}`}
                                                className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-400 ring-1 ring-inset ring-gray-700"
                                            >
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={page}
                                                onClick={() => changePage(page as number)}
                                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === page
                                                    ? 'bg-blue-900 text-blue-200 focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500'
                                                    : 'text-gray-400 ring-1 ring-inset ring-gray-700 hover:bg-gray-800 focus:z-20 focus:outline-offset-0'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        )))}

                                    <button
                                        onClick={() => changePage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-700 hover:bg-gray-800 focus:z-20 focus:outline-offset-0 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                    >
                                        <span className="sr-only">Siguiente</span>
                                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            );
}