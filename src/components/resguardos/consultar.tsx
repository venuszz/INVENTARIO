"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search, ChevronLeft, ChevronRight, ArrowUpDown,
    AlertCircle, X, FileText, Calendar,
    User, Briefcase, Download, ListChecks,
    Info, RefreshCw, FileDigit, Building2
} from 'lucide-react';
import supabase from '@/app/lib/supabase/client';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ResguardoPDF } from './ResguardoPDFReport';
import dynamic from 'next/dynamic';

// Importar el componente PDF de forma dinámica para evitar SSR
const ResguardoPDFReport = dynamic(() => import('./ResguardoPDFReport'), { ssr: false });

interface Resguardo {
    id: number;
    folio: string;
    f_resguardo: string;
    area_resguardo: string | null;
    dir_area: string;
    num_inventario: string;
    descripcion: string;
    rubro: string;
    condicion: string;
    usufinal: string | null;
}

interface ResguardoDetalle extends Resguardo {
    articulos: Array<{
        num_inventario: string;
        descripcion: string;
        rubro: string;
        condicion: string;
    }>;
}

interface PdfData {
    folio: string;
    fecha: string;
    director: string;
    area: string;
    puesto: string;
    resguardante: string;
    articulos: Array<{
        id_inv: string;
        descripcion: string;
        rubro: string;
        estado: string;
    }>;
}

export default function ConsultarResguardos() {
    const [resguardos, setResguardos] = useState<Resguardo[]>([]);
    const [selectedResguardo, setSelectedResguardo] = useState<ResguardoDetalle | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [sortField, setSortField] = useState<'folio' | 'f_resguardo' | 'dir_area' | 'usufinal'>('folio');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [pdfData, setPdfData] = useState<PdfData | null>(null);
    const [showPDFButton, setShowPDFButton] = useState(false);
    const detailRef = useRef<HTMLDivElement>(null);
    const [filterDate, setFilterDate] = useState('');
    const [filterDirector, setFilterDirector] = useState('');

    // Fetch resguardos with pagination and sorting
    const fetchResguardos = useCallback(async () => {
        setLoading(true);
        try {
            // Obtener el conteo total de resguardos con filtros
            let countQuery = supabase.from('resguardos').select('*', { count: 'exact', head: true });

            if (filterDate) {
                // Aplicar casting a DATE para comparación exacta
                countQuery = countQuery.eq('f_resguardo::date', filterDate);
            }

            if (filterDirector) {
                countQuery = countQuery.ilike('dir_area', `%${filterDirector}%`);
            }

            const { count, error: countError } = await countQuery;
            if (countError) throw countError;
            setTotalCount(count || 0);

            // Calcular rango para paginación
            const from = (currentPage - 1) * rowsPerPage;
            const to = from + rowsPerPage - 1;

            // Obtener los resguardos paginados y ordenados con filtros
            let dataQuery = supabase.from('resguardos').select('*');

            if (filterDate) {
                // Aplicar casting a DATE para comparación exacta
                dataQuery = dataQuery.eq('f_resguardo::date', filterDate);
            }

            if (filterDirector) {
                dataQuery = dataQuery.ilike('dir_area', `%${filterDirector}%`);
            }

            const { data, error: queryError } = await dataQuery
                .order(sortField, { ascending: sortDirection === 'asc' })
                .range(from, to);

            if (queryError) throw queryError;
            setResguardos(data || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los resguardos');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, rowsPerPage, sortField, sortDirection, filterDate, filterDirector]);

    // Fetch resguardos by folio
    const fetchResguardoDetails = async (folio: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('resguardos')
                .select('*')
                .eq('folio', folio);

            if (error) throw error;

            if (data && data.length > 0) {
                const firstItem = data[0];
                const detalles: ResguardoDetalle = {
                    ...firstItem,
                    articulos: data.map(item => ({
                        num_inventario: item.num_inventario,
                        descripcion: item.descripcion,
                        rubro: item.rubro,
                        condicion: item.condicion
                    }))
                };

                setSelectedResguardo(detalles);

                // Prepare PDF data
                setPdfData({
                    folio: detalles.folio,
                    fecha: new Date(detalles.f_resguardo).toLocaleDateString(),
                    director: detalles.dir_area,
                    area: detalles.area_resguardo || '',
                    puesto: '',
                    resguardante: detalles.usufinal || '',
                    articulos: detalles.articulos.map(art => ({
                        id_inv: art.num_inventario,
                        descripcion: art.descripcion,
                        rubro: art.rubro,
                        estado: art.condicion
                    }))
                });

                // Scroll to details on mobile
                if (window.innerWidth < 768 && detailRef.current) {
                    setTimeout(() => {
                        detailRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                }
            }
        } catch (err) {
            setError('Error al cargar los detalles del resguardo');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Handle sort
    const handleSort = (field: 'folio' | 'f_resguardo' | 'dir_area' | 'usufinal') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    // Search resguardos by folio
    const handleSearch = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('resguardos')
                .select('*')
                .ilike('folio', `%${searchTerm}%`)
                .order(sortField, { ascending: sortDirection === 'asc' });

            if (error) throw error;

            setResguardos(data || []);
            setTotalCount(data?.length || 0);
            setCurrentPage(1);
            setError(null);
        } catch (err) {
            setError('Error al buscar resguardos');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Reset search
    const resetSearch = () => {
        setSearchTerm('');
        fetchResguardos();
    };

    useEffect(() => {
        fetchResguardos();
    }, [fetchResguardos]);

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / rowsPerPage);

    // Agrupar resguardos por folio para mostrar solo un folio por fila
    const foliosUnicos = Array.from(
        new Map(resguardos.map(r => [r.folio, r])).values()
    );

    return (
        <div className="bg-black text-white min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
            <div className="w-full mx-auto bg-black rounded-lg sm:rounded-xl shadow-2xl overflow-hidden transition-all duration-500 transform border border-gray-800">
                {/* Header */}
                <div className="bg-black p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 gap-2 sm:gap-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
                        <span className="mr-2 sm:mr-3 bg-gray-900 text-white p-1 sm:p-2 rounded-lg border border-gray-700 text-sm sm:text-base">RES</span>
                        Consulta de Resguardos
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <ListChecks className="h-4 w-4 text-blue-400" />
                        <span>{totalCount} resguardos registrados</span>
                    </div>
                </div>

                {/* Main container */}
                <div className="grid grid-cols-1 lg:grid-cols-5 h-full flex-1">
                    {/* Left panel - Resguardos table */}
                    <div className="flex-1 min-w-0 flex flex-col p-4 lg:col-span-3">
                        {/* Search */}
                        <div className="mb-6 bg-gray-900/20 p-4 rounded-xl border border-gray-800 shadow-inner">
                            <div className="flex flex-col gap-4">
                                <div className="relative flex-grow">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-blue-400/80" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Buscar por folio..."
                                        className="pl-10 pr-4 py-3 w-full bg-black border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="flex justify-between items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={resetSearch}
                                            disabled={!searchTerm}
                                            className={`px-4 py-2 bg-black border border-gray-800 text-gray-400 rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2 text-sm ${!searchTerm ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <X className="h-4 w-4" />
                                            Limpiar búsqueda
                                        </button>
                                        <button
                                            onClick={handleSearch}
                                            disabled={!searchTerm}
                                            className={`px-4 py-2 bg-blue-600/20 border border-blue-800 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors flex items-center gap-2 text-sm ${!searchTerm ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <Search className="h-4 w-4" />
                                            Buscar
                                        </button>
                                    </div>
                                    <button
                                        onClick={fetchResguardos}
                                        className="px-4 py-2 bg-gray-900/50 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                        Actualizar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Filtro avanzado */}
                        <div className="mb-6 bg-gray-900/20 p-4 rounded-xl border border-gray-800 shadow-inner">
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Filtrar por fecha</label>
                                    <input
                                        title='Fecha de resguardo'
                                        type="date"
                                        max={new Date().toISOString().split('T')[0]}
                                        onChange={e => {
                                            setCurrentPage(1);
                                            setFilterDate(e.target.value);
                                        }}
                                        className="w-full bg-black border border-gray-800 rounded-lg text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Filtrar por director</label>
                                    <input
                                        type="text"
                                        placeholder="Nombre del director..."
                                        onChange={e => {
                                            setCurrentPage(1);
                                            setFilterDirector(e.target.value);
                                        }}
                                        className="w-full bg-black border border-gray-800 rounded-lg text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        setFilterDate('');
                                        setFilterDirector('');
                                        setCurrentPage(1);
                                    }}
                                    className="px-4 py-2 bg-black border border-gray-800 text-gray-400 rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2 text-sm"
                                >
                                    <X className="h-4 w-4" />
                                    Limpiar filtros
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-gray-900/20 rounded-xl border border-gray-800 overflow-x-auto overflow-y-auto mb-6 flex flex-col flex-grow max-h-[60vh] shadow-lg">
                            <div className="flex-grow min-w-[800px]">
                                <table className="min-w-full divide-y divide-gray-800">
                                    <thead className="bg-black sticky top-0 z-10">
                                        <tr>
                                            <th
                                                onClick={() => handleSort('folio')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900 transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Folio
                                                    <ArrowUpDown className={`h-3.5 w-3.5 ${sortField === 'folio' ? 'text-blue-400' : 'text-gray-500'}`} />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('f_resguardo')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900 transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Fecha
                                                    <ArrowUpDown className={`h-3.5 w-3.5 ${sortField === 'f_resguardo' ? 'text-blue-400' : 'text-gray-500'}`} />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('dir_area')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900 transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Director
                                                    <ArrowUpDown className={`h-3.5 w-3.5 ${sortField === 'dir_area' ? 'text-blue-400' : 'text-gray-500'}`} />
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Artículos
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-transparent divide-y divide-gray-800/50">
                                        {loading ? (
                                            <tr className="h-96">
                                                <td colSpan={4} className="px-6 py-24 text-center text-gray-400">
                                                    <div className="flex flex-col items-center justify-center space-y-4">
                                                        <RefreshCw className="h-12 w-12 animate-spin text-blue-500" />
                                                        <p className="text-lg font-medium">Cargando resguardos...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : error ? (
                                            <tr className="h-96">
                                                <td colSpan={4} className="px-6 py-24 text-center">
                                                    <div className="flex flex-col items-center justify-center space-y-4 text-red-400">
                                                        <AlertCircle className="h-12 w-12" />
                                                        <p className="text-lg font-medium">Error al cargar resguardos</p>
                                                        <p className="text-sm text-gray-400">{error}</p>
                                                        <button
                                                            onClick={fetchResguardos}
                                                            className="px-4 py-2 bg-black text-blue-300 rounded-lg text-sm hover:bg-gray-900 transition-colors border border-gray-800"
                                                        >
                                                            Intentar nuevamente
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : resguardos.length === 0 ? (
                                            <tr className="h-96">
                                                <td colSpan={4} className="px-6 py-24 text-center text-gray-400">
                                                    <div className="flex flex-col items-center justify-center space-y-4">
                                                        <Search className="h-12 w-12 text-gray-500" />
                                                        <p className="text-lg font-medium">No se encontraron resguardos</p>
                                                        {searchTerm && (
                                                            <button
                                                                onClick={resetSearch}
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
                                            foliosUnicos.map((resguardo) => {
                                                // Contar artículos por folio
                                                const itemCount = resguardos.filter(r => r.folio === resguardo.folio).length;
                                                // Color azul más fuerte según cantidad
                                                let bgColor = 'bg-blue-900/20';
                                                if (itemCount >= 10) bgColor = 'bg-blue-700/60';
                                                else if (itemCount >= 5) bgColor = 'bg-blue-800/40';

                                                return (
                                                    <tr
                                                        key={resguardo.folio}
                                                        className={`hover:bg-gray-900/50 cursor-pointer transition-colors ${selectedResguardo?.folio === resguardo.folio ? 'bg-blue-900/10 border-l-2 border-blue-500' : ''}`}
                                                        onClick={() => fetchResguardoDetails(resguardo.folio)}
                                                    >
                                                        <td className="px-4 py-4">
                                                            <div className="text-sm font-medium text-blue-400 flex items-center gap-2">
                                                                <FileDigit className="h-4 w-4" />
                                                                {resguardo.folio}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="text-sm text-white">
                                                                {resguardo.f_resguardo.slice(0, 10).split('-').reverse().join('/')}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="text-sm text-white">{resguardo.dir_area}</div>
                                                            <div className="text-xs text-gray-500">{resguardo.area_resguardo}</div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-800 text-blue-100 ${bgColor}`}>
                                                                {itemCount} artículo{itemCount !== 1 ? 's' : ''}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {resguardos.length > 0 && (
                            <div className="flex items-center justify-between bg-gray-900/20 p-4 rounded-xl border border-gray-800 shadow-inner mb-4">
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-400">
                                        Página {currentPage} de {totalPages}
                                    </span>
                                    <select
                                        title='Resguardos por página'
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
                                <FileText className="h-5 w-5 text-blue-400" />
                                Detalles del Resguardo
                            </h2>

                            {selectedResguardo ? (
                                <>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Folio</label>
                                            <div className="text-lg font-medium text-blue-400 flex items-center gap-2">
                                                <FileDigit className="h-5 w-5" />
                                                {selectedResguardo.folio}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Fecha</label>
                                                <div className="text-sm text-white flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    {selectedResguardo.f_resguardo.slice(0, 10).split('-').reverse().join('/')}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Artículos</label>
                                                <div className="text-sm text-white">
                                                    {selectedResguardo.articulos.length}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Director de Área</label>
                                            <div className="text-sm text-white flex items-center gap-2">
                                                <Building2 className="h-4 w-4" />
                                                {selectedResguardo.dir_area}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {selectedResguardo.area_resguardo}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Resguardante</label>
                                            <div className="text-sm text-white flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                {selectedResguardo.usufinal}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowPDFButton(true)}
                                        className="mt-6 w-full py-2.5 bg-blue-600/20 border border-blue-800 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Generar PDF
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-gray-500">
                                    <Info className="h-12 w-12 mb-2 text-gray-600" />
                                    <p className="text-sm">Seleccione un resguardo</p>
                                    <p className="text-xs mt-1">Haga clic en un folio para ver los detalles</p>
                                </div>
                            )}
                        </div>

                        {/* Selected Items */}
                        <div className="bg-gray-900/20 rounded-xl border border-gray-800 p-4 flex-grow overflow-y-auto shadow-inner relative">
                            <h2 className="text-lg font-medium text-gray-100 mb-2 flex items-center gap-2 sticky top-0 z-20 bg-black/80 p-2 -m-2 backdrop-blur-md">
                                <ListChecks className="h-5 w-5 text-blue-400" />
                                Artículos del Resguardo ({selectedResguardo?.articulos.length || 0})
                            </h2>

                            {selectedResguardo ? (
                                <div className="space-y-3 mt-2">
                                    {selectedResguardo.articulos.map((articulo, index) => (
                                        <div key={`${selectedResguardo.folio}-${index}`} className="bg-black rounded-lg p-3 border border-gray-800 shadow-sm">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-sm font-medium text-white truncate">
                                                            {articulo.num_inventario}
                                                        </div>
                                                        <div className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium 
                                                            ${articulo.condicion === 'B' ? 'bg-green-900/20 text-green-300 border border-green-900' :
                                                                articulo.condicion === 'R' ? 'bg-yellow-900/20 text-yellow-300 border border-yellow-900' :
                                                                    articulo.condicion === 'M' ? 'bg-red-900/20 text-red-300 border border-red-900' :
                                                                        'bg-gray-900/20 text-gray-300 border border-gray-900'}`}>
                                                            {articulo.condicion}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-300 mt-1">
                                                        {articulo.descripcion}
                                                    </p>
                                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                        <Briefcase className="h-3 w-3" />
                                                        {articulo.rubro}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-gray-500">
                                    <ListChecks className="h-12 w-12 mb-2 text-gray-600" />
                                    <p className="text-sm">No hay artículos para mostrar</p>
                                    <p className="text-xs mt-1">Seleccione un resguardo para ver sus artículos</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-red-900/80 text-red-100 px-4 py-3 rounded-lg shadow-lg border border-red-800 z-50 backdrop-blur-sm animate-fade-in">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
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

            {/* Modal para descargar PDF */}
            {showPDFButton && pdfData && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 animate-fadeIn">
                    <div className="bg-black rounded-2xl shadow-2xl border border-green-600/30 w-full max-w-md overflow-hidden transition-all duration-300 transform">
                        <div className="relative p-6 bg-gradient-to-b from-black to-gray-900">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500/60 via-green-400 to-green-500/60"></div>

                            <button
                                onClick={() => setShowPDFButton(false)}
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
                                        <span className="text-white font-medium">Resguardo {pdfData.folio}</span>
                                    </div>
                                </div>

                                <div className="w-full flex flex-col items-center gap-4">
                                    <div className="w-full rounded-lg overflow-hidden border border-gray-700">
                                        <ResguardoPDFReport data={pdfData} onClose={() => setShowPDFButton(false)} />
                                    </div>
                                    <div className="w-full">
                                        <PDFDownloadLink
                                            document={<ResguardoPDF data={pdfData} />}
                                            fileName={`resguardo_${pdfData.folio}.pdf`}
                                            className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-black font-medium rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg"
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
        </div>
    );
}