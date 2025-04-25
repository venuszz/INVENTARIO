"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search, ChevronLeft, ChevronRight, ArrowUpDown,
    AlertCircle, X, FileText, Calendar,
    User, Download, ListChecks,
    Info, RefreshCw, FileDigit, Building2
} from 'lucide-react';
import supabase from '@/app/lib/supabase/client';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BajaPDF } from './BajaPDFReport';
import dynamic from 'next/dynamic';

// Importar el componente PDF de forma dinámica para evitar SSR
const BajaPDFReport = dynamic<{ data: PdfDataBaja; onClose: () => void }>(
    () => import('./BajaPDFReport'),
    { ssr: false }
);

interface ResguardoBaja {
    id: number;
    folio_resguardo: string;
    folio_baja: string;
    f_resguardo: string;
    area_resguardo: string | null;
    dir_area: string;
    num_inventario: string;
    descripcion: string;
    rubro: string;
    condicion: string;
    usufinal: string | null;
    puesto: string;
    origen: string;
    selected?: boolean;
}

interface ResguardoBajaDetalle extends ResguardoBaja {
    articulos: Array<ResguardoBajaArticulo>;
}

interface ResguardoBajaArticulo {
    id: number;
    num_inventario: string;
    descripcion: string;
    rubro: string;
    condicion: string;
    origen: string;
    folio_baja: string;
    usufinal?: string | null;
}

interface PdfDataBaja {
    folio_resguardo: string;
    folio_baja: string;
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
        origen?: string | null;
        folio_baja: string;
        resguardante: string;
    }>;
    firmas?: Array<{
        cargo: string;
        nombre: string;
        firma?: string;
        concepto: string;
        puesto: string;
    }>;
}

const ConsultarBajasResguardos = () => {
    const [bajas, setBajas] = useState<ResguardoBaja[]>([]);
    const [selectedBaja, setSelectedBaja] = useState<ResguardoBajaDetalle | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [sortField, setSortField] = useState<'id' | 'folio_resguardo' | 'f_resguardo' | 'dir_area'>('id');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [pdfBajaData, setPdfBajaData] = useState<PdfDataBaja | null>(null);
    const [showPDFButton, setShowPDFButton] = useState(false);
    const detailRef = useRef<HTMLDivElement>(null);
    const [filterDate, setFilterDate] = useState('');
    const [filterDirector, setFilterDirector] = useState('');
    const [allBajas, setAllBajas] = useState<ResguardoBaja[]>([]);
    const [selectedItems, setSelectedItems] = useState<{ [key: string]: boolean }>({});
    const [groupedItems, setGroupedItems] = useState<{ [key: string]: ResguardoBajaArticulo[] }>({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteType, setDeleteType] = useState<'folio' | 'selected' | 'single' | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{
        folioResguardo?: string;
        folioBaja?: string;
        articulos?: ResguardoBajaArticulo[];
        singleArticulo?: ResguardoBajaArticulo;
    } | null>(null);

    // Update loading state
    const isLoading = loading;

    // Fetch bajas with pagination and sorting
    const fetchBajas = useCallback(async () => {
        setLoading(true);
        try {
            // Consulta base para obtener folios únicos
            let baseQuery = supabase
                .from('resguardos_bajas')
                .select('*');

            if (filterDate) {
                baseQuery = baseQuery.eq('f_resguardo::date', filterDate);
            }

            if (filterDirector) {
                baseQuery = baseQuery.ilike('dir_area', `%${filterDirector?.trim().toUpperCase() || ''}%`);
            }

            // Obtener los datos con los filtros aplicados
            const { data: allData, error: queryError } = await baseQuery;
            
            if (queryError) throw queryError;

            // Agrupar por folio_resguardo y tomar el primer registro de cada grupo
            const uniqueFolios = Array.from(
                new Map(
                    allData?.map(item => [item.folio_resguardo, item])
                ).values()
            );

            const totalUniqueFolios = uniqueFolios.length;
            setTotalCount(totalUniqueFolios);

            // Calcular el número total de páginas basado en folios únicos
            const totalPages = Math.ceil(totalUniqueFolios / rowsPerPage);
            
            // Asegurarse de que la página actual no exceda el total de páginas
            const adjustedCurrentPage = Math.min(currentPage, totalPages || 1);
            if (adjustedCurrentPage !== currentPage) {
                setCurrentPage(adjustedCurrentPage);
            }

            // Calcular rango para paginación
            const from = (adjustedCurrentPage - 1) * rowsPerPage;
            
            // Aplicar paginación a los folios únicos
            const paginatedData = uniqueFolios
                .sort((a, b) => {
                    if (sortField === 'id') {
                        return sortDirection === 'asc' ? a.id - b.id : b.id - a.id;
                    }
                    if (sortField === 'f_resguardo') {
                        return sortDirection === 'asc' 
                            ? new Date(a.f_resguardo).getTime() - new Date(b.f_resguardo).getTime()
                            : new Date(b.f_resguardo).getTime() - new Date(a.f_resguardo).getTime();
                    }
                    if (sortField === 'dir_area' || sortField === 'folio_resguardo') {
                        const aValue = a[sortField]?.toLowerCase() || '';
                        const bValue = b[sortField]?.toLowerCase() || '';
                        return sortDirection === 'asc' 
                            ? aValue.localeCompare(bValue)
                            : bValue.localeCompare(aValue);
                    }
                    return 0;
                })
                .slice(from, from + rowsPerPage);
            
            setBajas(paginatedData || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los resguardos dados de baja');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, rowsPerPage, sortField, sortDirection, filterDate, filterDirector]);

    // Fetch all bajas for counting articles by folio correctly
    useEffect(() => {
        const fetchAllBajas = async () => {
            try {
                let dataQuery = supabase.from('resguardos_bajas').select('*');
                if (filterDate) {
                    dataQuery = dataQuery.eq('f_resguardo::date', filterDate);
                }
                if (filterDirector) {
                    dataQuery = dataQuery.ilike('dir_area', `%${filterDirector.trim().toUpperCase()}%`);
                }
                const { data, error } = await dataQuery;
                if (!error) setAllBajas(data || []);
            } catch {
                setAllBajas([]);
            }
        };
        fetchAllBajas();
    }, [filterDate, filterDirector, searchTerm]);

    // Fetch bajas by folio_resguardo
    const fetchBajaDetails = async (folioResguardo: string) => {
        setLoading(true);
        try {
            // Modificar la consulta para incluir todos los campos necesarios
            const { data, error } = await supabase
                .from('resguardos_bajas')
                .select(`
                    id,
                    num_inventario,
                    descripcion,
                    rubro,
                    condicion,
                    origen,
                    folio_baja,
                    usufinal,
                    folio_resguardo,
                    f_resguardo,
                    area_resguardo,
                    dir_area,
                    puesto
                `)
                .eq('folio_resguardo', folioResguardo);

            if (error) throw error;

            if (data && data.length > 0) {
                const firstItem = data[0];
                const articles = data.map(item => ({
                    id: item.id,
                    num_inventario: item.num_inventario,
                    descripcion: item.descripcion,
                    rubro: item.rubro,
                    condicion: item.condicion,
                    origen: item.origen,
                    folio_baja: item.folio_baja,
                    usufinal: item.usufinal || firstItem.usufinal // Usar el usufinal del artículo o el general
                }));

                // Group articles by folio_baja
                const grouped = articles.reduce((acc, article) => {
                    const folio = article.folio_baja;
                    if (!acc[folio]) {
                        acc[folio] = [];
                    }
                    acc[folio].push(article);
                    return acc;
                }, {} as { [key: string]: ResguardoBajaArticulo[] });

                setGroupedItems(grouped);

                const detalles: ResguardoBajaDetalle = {
                    ...firstItem,
                    articulos: articles
                };

                setSelectedBaja(detalles);

                // Update PDF data
                const selectedArticles = getSelectedItemsForPDF();
                setPdfBajaData({
                    folio_resguardo: firstItem.folio_resguardo,
                    folio_baja: firstItem.folio_baja,
                    fecha: new Date(firstItem.f_resguardo).toLocaleDateString(),
                    director: firstItem.dir_area,
                    area: firstItem.area_resguardo || '',
                    puesto: firstItem.puesto,
                    resguardante: firstItem.usufinal || '',
                    articulos: selectedArticles.length > 0 ? selectedArticles.map(art => ({
                        id_inv: art.num_inventario,
                        descripcion: art.descripcion,
                        rubro: art.rubro,
                        estado: art.condicion,
                        origen: art.origen,
                        folio_baja: art.folio_baja,
                        resguardante: art.usufinal || firstItem.usufinal || '' // Usar el resguardante individual o el general
                    })) : articles.map(art => ({
                        id_inv: art.num_inventario,
                        descripcion: art.descripcion,
                        rubro: art.rubro,
                        estado: art.condicion,
                        origen: art.origen,
                        folio_baja: art.folio_baja,
                        resguardante: art.usufinal || firstItem.usufinal || '' // Usar el resguardante individual o el general
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
            setError('Error al cargar los detalles de la baja');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Función para obtener las firmas
    const getFirmas = async () => {
        const { data, error } = await supabase
            .from('firmas')
            .select('*');
        
        if (error) {
            console.error('Error al obtener firmas:', error);
            return null;
        }
        return data;
    };

    // En la función que genera el PDF de baja, modificar para incluir las firmas
    const handleBajaPDF = async () => {
        if (selectedBaja) {
            const groupedSelected = getSelectedItemsGroupedByFolio();
            for (const group of groupedSelected) {
                const firmas = await getFirmas();
                
                setPdfBajaData({
                    folio_resguardo: selectedBaja.folio_resguardo,
                    folio_baja: group.folio_baja,
                    fecha: new Date(selectedBaja.f_resguardo).toLocaleDateString(),
                    director: selectedBaja.dir_area,
                    area: selectedBaja.area_resguardo || '',
                    puesto: selectedBaja.puesto,
                    resguardante: selectedBaja.usufinal || '',
                    articulos: group.articulos.map(art => ({
                        id_inv: art.num_inventario,
                        descripcion: art.descripcion,
                        rubro: art.rubro,
                        estado: art.condicion,
                        origen: art.origen,
                        folio_baja: art.folio_baja,
                        resguardante: art.usufinal || selectedBaja.usufinal || '' // Use article's usufinal if available
                    })),
                    firmas: firmas || undefined
                });
                setShowPDFButton(true);
            }
        }
    };

    // Handle sort
    const handleSort = (field: 'id' | 'folio_resguardo' | 'f_resguardo' | 'dir_area') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    // Reset search
    const resetSearch = () => {
        setSearchTerm('');
        fetchBajas();
    };

    // Efecto para búsqueda en tiempo real
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm) {
                setLoading(true);
                try {
                    const { data, error } = await supabase
                        .from('resguardos_bajas')
                        .select('*')
                        .or(`folio_resguardo.ilike.%${searchTerm}%,folio_baja.ilike.%${searchTerm}%`)
                        .order(sortField, { ascending: sortDirection === 'asc' });

                    if (error) throw error;

                    setBajas(data || []);
                    setTotalCount(data?.length || 0);
                    setCurrentPage(1);
                    setError(null);
                } catch (err) {
                    setError('Error al buscar resguardos dados de baja');
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            } else {
                fetchBajas();
            }
        }, 100);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, sortField, sortDirection, fetchBajas]);

    useEffect(() => {
        fetchBajas();
    }, [fetchBajas]);

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / rowsPerPage);

    // Agrupar bajas por folio_resguardo para mostrar solo un folio por fila
    const foliosUnicos = Array.from(
        new Map(bajas.map(r => [r.folio_resguardo, r])).values()
    );

    // Función para contar artículos por folio_resguardo usando todas las bajas filtradas
    const getArticuloCount = (folioResguardo: string) => {
        return allBajas.filter(r => r.folio_resguardo === folioResguardo).length;
    };

    // Add function to handle item selection
    const handleItemSelection = (articleId: number) => {
        setSelectedItems(prev => ({
            ...prev,
            [articleId]: !prev[articleId]
        }));
    };

    // Add function to handle select all items in a group
    const handleGroupSelection = (folioBaja: string) => {
        const newSelectedItems = { ...selectedItems };
        const groupArticles = groupedItems[folioBaja] || [];

        const allSelected = groupArticles.every(article => selectedItems[article.id]);

        groupArticles.forEach(article => {
            newSelectedItems[article.id] = !allSelected;
        });

        setSelectedItems(newSelectedItems);
    };

    // Add function to clear all selections
    const clearSelections = () => {
        setSelectedItems({});
    };

    // Add function to get selected items for PDF
    const getSelectedItemsForPDF = () => {
        if (!selectedBaja) return [];
        return selectedBaja.articulos.filter(art => selectedItems[art.id]);
    };

    // Add function to get selected items grouped by folio_baja
    const getSelectedItemsGroupedByFolio = () => {
        if (!selectedBaja) return [];
        const selectedArticles = selectedBaja.articulos.filter(art => selectedItems[art.id]);
        // Si no hay artículos seleccionados, usar todos los artículos
        if (selectedArticles.length === 0) {
            return [{
                folio_baja: selectedBaja.folio_baja,
                articulos: selectedBaja.articulos
            }];
        }
        // Agrupar artículos seleccionados por folio_baja
        const grouped = selectedArticles.reduce((acc, art) => {
            const found = acc.find(g => g.folio_baja === art.folio_baja);
            if (found) {
                found.articulos.push(art);
            } else {
                acc.push({
                    folio_baja: art.folio_baja,
                    articulos: [art]
                });
            }
            return acc;
        }, [] as Array<{ folio_baja: string, articulos: ResguardoBajaArticulo[] }>);
        return grouped;
    };

    const getItemCountBgColor = (count: number) => {
        switch (count) {
            case 0:
                return 'bg-gray-900/40 text-gray-400 border border-gray-800';
            case 1:
                return 'bg-red-900/20 text-red-300 border border-red-900';
            case 2:
            case 3:
            case 4:
                return 'bg-red-800/40 text-red-300 border border-red-800';
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
                return 'bg-red-800/60 text-red-200 border border-red-700';
            default:
                return 'bg-red-700/60 text-red-100 border border-red-600';
        }
    };

    // Función para manejar la eliminación
    const handleDelete = async () => {
        if (!itemToDelete) return;

        setLoading(true);
        try {
            let result;

            switch (deleteType) {
                case 'folio':
                    // Eliminar todo el folio
                    if (itemToDelete.folioResguardo) {
                        result = await supabase
                            .from('resguardos_bajas')
                            .delete()
                            .eq('folio_resguardo', itemToDelete.folioResguardo);
                    }
                    break;

                case 'selected':
                    // Eliminar múltiples artículos seleccionados
                    if (itemToDelete.articulos && itemToDelete.articulos.length > 0) {
                        const ids = itemToDelete.articulos.map(art => art.id);
                        result = await supabase
                            .from('resguardos_bajas')
                            .delete()
                            .in('id', ids);
                    }
                    break;

                case 'single':
                    // Eliminar un solo artículo
                    if (itemToDelete.singleArticulo) {
                        result = await supabase
                            .from('resguardos_bajas')
                            .delete()
                            .eq('id', itemToDelete.singleArticulo.id);
                    }
                    break;
            }

            if (result?.error) throw result.error;

            // Refrescar la vista
            await fetchBajas();
            setSelectedBaja(null);
            setSelectedItems({});
            setShowDeleteModal(false);
            setItemToDelete(null);
            setDeleteType(null);
        } catch (err) {
            setError('Error al eliminar el registro');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Función para iniciar el proceso de eliminación
    const initiateDelete = (type: 'folio' | 'selected' | 'single', data: {
        folioResguardo?: string;
        folioBaja?: string;
        articulos?: ResguardoBajaArticulo[];
        singleArticulo?: ResguardoBajaArticulo;
    }) => {
        setDeleteType(type);
        setItemToDelete(data);
        setShowDeleteModal(true);
    };

    return (
        <div className="bg-black text-white min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
            <div className="w-full mx-auto bg-black rounded-lg sm:rounded-xl shadow-2xl overflow-hidden transition-all duration-500 transform border border-gray-800">
                {/* Header */}
                <div className="bg-black p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 gap-2 sm:gap-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
                        <span className="mr-2 sm:mr-3 bg-gray-900 text-white p-1 sm:p-2 rounded-lg border border-gray-700 text-sm sm:text-base">BAJ</span>
                        Consulta de Resguardos Dados de Baja
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <ListChecks className="h-4 w-4 text-red-400" />
                        <span>{totalCount} resguardos dados de baja</span>
                    </div>
                </div>

                {/* Main container */}
                <div className="grid grid-cols-1 lg:grid-cols-5 h-full flex-1">
                    {/* Left panel - Bajas table */}
                    <div className="flex-1 min-w-0 flex flex-col p-4 lg:col-span-3">
                        {/* Search */}
                        <div className="mb-6 bg-gray-900/20 p-4 rounded-xl border border-gray-800 shadow-inner">
                            <div className="flex flex-col gap-4">
                                <div className="relative flex-grow">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-red-400/80" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Buscar por folio de resguardo o baja..."
                                        className="pl-10 pr-4 py-3 w-full bg-black border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedBaja(null);
                                            setPdfBajaData(null);
                                            fetchBajas();
                                        }}
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
                                        className="w-full bg-black border border-gray-800 rounded-lg text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
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
                                        className="w-full bg-black border border-gray-800 rounded-lg text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
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
                        <div className="bg-gray-900/20 rounded-xl border border-gray-800 overflow-x-auto overflow-y-auto mb-6 flex flex-col flex-grow shadow-lg h-[40vh] max-h-[78vh]">
                            <div className="flex-grow min-w-[800px]">
                                <table className="min-w-full divide-y divide-gray-800">
                                    <thead className="bg-black sticky top-0 z-10">
                                        <tr>
                                            <th
                                                onClick={() => handleSort('folio_resguardo')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900 transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Folio Resguardo
                                                    <ArrowUpDown className={`h-3.5 w-3.5 ${sortField === 'folio_resguardo' ? 'text-red-400' : 'text-gray-500'}`} />
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Folio Baja
                                            </th>
                                            <th
                                                onClick={() => handleSort('f_resguardo')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900 transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Fecha
                                                    <ArrowUpDown className={`h-3.5 w-3.5 ${sortField === 'f_resguardo' ? 'text-red-400' : 'text-gray-500'}`} />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('dir_area')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900 transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Director
                                                    <ArrowUpDown className={`h-3.5 w-3.5 ${sortField === 'dir_area' ? 'text-red-400' : 'text-gray-500'}`} />
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                Artículos
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-transparent divide-y divide-gray-800/50">
                                        {isLoading ? (
                                            <tr className="h-96">
                                                <td colSpan={5} className="px-6 py-24 text-center text-gray-400">
                                                    <div className="flex flex-col items-center justify-center space-y-4">
                                                        <RefreshCw className="h-12 w-12 animate-spin text-red-500" />
                                                        <p className="text-lg font-medium">Cargando resguardos dados de baja...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : error ? (
                                            <tr className="h-96">
                                                <td colSpan={5} className="px-6 py-24 text-center">
                                                    <div className="flex flex-col items-center justify-center space-y-4 text-red-400">
                                                        <AlertCircle className="h-12 w-12" />
                                                        <p className="text-lg font-medium">Error al cargar resguardos dados de baja</p>
                                                        <p className="text-sm text-gray-400">{error}</p>
                                                        <button
                                                            onClick={fetchBajas}
                                                            className="px-4 py-2 bg-black text-red-300 rounded-lg text-sm hover:bg-gray-900 transition-colors border border-gray-800"
                                                        >
                                                            Intentar nuevamente
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : bajas.length === 0 ? (
                                            <tr className="h-96">
                                                <td colSpan={5} className="px-6 py-24 text-center text-gray-400">
                                                    <div className="flex flex-col items-center justify-center space-y-4">
                                                        <Search className="h-12 w-12 text-gray-500" />
                                                        <p className="text-lg font-medium">No se encontraron resguardos dados de baja</p>
                                                        {searchTerm && (
                                                            <button
                                                                onClick={resetSearch}
                                                                className="px-4 py-2 bg-black text-red-400 rounded-lg text-sm hover:bg-gray-900 transition-colors flex items-center gap-2 border border-gray-800"
                                                            >
                                                                <X className="h-4 w-4" />
                                                                Limpiar búsqueda
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            foliosUnicos.map((baja) => {
                                                // Contar artículos por folio
                                                const itemCount = getArticuloCount(baja.folio_resguardo);
                                                return (
                                                    <tr
                                                        key={baja.id}
                                                        className={`hover:bg-gray-900/50 cursor-pointer transition-colors ${selectedBaja?.folio_resguardo === baja.folio_resguardo ? 'bg-red-900/10 border-l-2 border-red-500' : ''}`}
                                                        onClick={() => fetchBajaDetails(baja.folio_resguardo)}
                                                    >
                                                        <td className="px-4 py-4">
                                                            <div className="text-sm font-medium text-red-400 flex items-center gap-2">
                                                                <FileDigit className="h-4 w-4" />
                                                                {baja.folio_resguardo}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                                                <FileDigit className="h-4 w-4" />
                                                                {baja.folio_baja}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="text-sm text-white">
                                                                {baja.f_resguardo.slice(0, 10).split('-').reverse().join('/')}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="text-sm text-white">{baja.dir_area}</div>
                                                            <div className="text-xs text-gray-500">{baja.area_resguardo}</div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getItemCountBgColor(itemCount)}`}>
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
                        {bajas.length > 0 && (
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
                                        className="bg-black border border-gray-800 rounded-lg text-white text-sm py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
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
                                <FileText className="h-5 w-5 text-red-400" />
                                Detalles del Resguardo
                            </h2>

                            {selectedBaja ? (
                                <>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Folio Resguardo</label>
                                            <div className="text-lg font-medium text-red-400 flex items-center gap-2">
                                                <FileDigit className="h-5 w-5" />
                                                {selectedBaja.folio_resguardo}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Fecha</label>
                                            <div className="text-sm text-white flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {selectedBaja.f_resguardo.slice(0, 10).split('-').reverse().join('/')}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Director de Área</label>
                                            <div className="text-sm text-white flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-gray-400" />
                                                {selectedBaja.dir_area}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {selectedBaja.area_resguardo}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Resguardante</label>
                                            <div className="text-sm text-white flex items-center gap-2">
                                                <User className="h-4 w-4 text-gray-400" />
                                                {selectedBaja.usufinal}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {selectedBaja.puesto}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleBajaPDF}
                                        className="mt-6 w-full py-2.5 bg-red-600/20 border border-red-800 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Generar PDF de {Object.values(selectedItems).filter(Boolean).length > 0 ? 'Artículos Seleccionados' : 'Baja Completa'}
                                    </button>
                                    {/* Botón para eliminar folio completo */}
                                    <button
                                        onClick={() => initiateDelete('folio', { folioResguardo: selectedBaja.folio_resguardo })}
                                        className="w-full py-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40 transition-colors border border-red-900/50 flex items-center justify-center gap-2 mt-2"
                                    >
                                        <X className="h-4 w-4" />
                                        Eliminar Folio Completo
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-gray-500">
                                    <Info className="h-12 w-12 mb-2 text-gray-600" />
                                    <p className="text-sm">Seleccione una baja</p>
                                    <p className="text-xs mt-1">Haga clic en un folio para ver los detalles</p>
                                </div>
                            )}
                        </div>

                        {/* Selected Items Panel */}
                        <div className="bg-gray-900/20 rounded-xl border border-gray-800 p-4 flex-grow shadow-inner relative max-h-[70vh] overflow-hidden">
                            <h2 className="text-lg font-medium text-gray-100 mb-4 flex items-center gap-2 sticky top-0 z-20 bg-black/80 p-2 -m-2 backdrop-blur-md">
                                <ListChecks className="h-5 w-5 text-red-400" />
                                Artículos Dados de Baja ({selectedBaja?.articulos.length || 0})
                            </h2>

                            {selectedBaja ? (
                                <div className="space-y-3 mt-2 overflow-auto max-h-[54vh]">
                                    {/* Selection controls */}
                                    <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm p-2 -mx-2 mb-2 border-b border-gray-800">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={clearSelections}
                                                    className="px-3 py-1.5 bg-gray-900/20 text-gray-400 rounded-lg text-sm hover:bg-gray-900/40 transition-colors border border-gray-800"
                                                >
                                                    Limpiar Selección
                                                </button>
                                                {Object.values(selectedItems).filter(Boolean).length > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            const selectedArticulos = selectedBaja.articulos.filter(art => selectedItems[art.id]);
                                                            initiateDelete('selected', { articulos: selectedArticulos });
                                                        }}
                                                        className="px-3 py-1.5 bg-red-900/20 text-red-400 rounded-lg text-sm hover:bg-red-900/40 transition-colors border border-red-900/50 flex items-center gap-2"
                                                    >
                                                        <X className="h-3 w-3" />
                                                        Eliminar Seleccionados
                                                    </button>
                                                )}
                                            </div>
                                            <span className="text-sm text-gray-400">
                                                {Object.values(selectedItems).filter(Boolean).length} seleccionados
                                            </span>
                                        </div>
                                    </div>

                                    {/* Group items by folio_baja */}
                                    {Object.entries(groupedItems).map(([folioBaja, articulos]) => (
                                        <div key={folioBaja} className="mb-6 bg-gray-900/10 p-4 rounded-xl border border-gray-800">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-medium text-red-400 flex items-center gap-2">
                                                    <FileDigit className="h-4 w-4" />
                                                    Folio de Baja: {folioBaja}
                                                </h3>
                                                <button
                                                    onClick={() => handleGroupSelection(folioBaja)}
                                                    className="px-2 py-1 text-xs bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40 transition-colors border border-red-900/50"
                                                >
                                                    {articulos.every(art => selectedItems[art.id]) ? 'Deseleccionar Grupo' : 'Seleccionar Grupo'}
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {articulos.map((articulo, index) => (
                                                    <div
                                                        key={`${folioBaja}-${index}`}
                                                        className={`bg-black/40 rounded-lg p-4 border-2 transition-all duration-200 
                                                            ${selectedItems[articulo.id]
                                                                ? 'border-red-500 bg-red-900/10 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]'
                                                                : 'border-gray-800 hover:border-gray-700'}`}
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div
                                                                onClick={() => handleItemSelection(articulo.id)}
                                                                className="flex-1 cursor-pointer"
                                                            >
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <div className="text-sm font-medium text-white">
                                                                        {articulo.num_inventario}
                                                                    </div>
                                                                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                                                                        {articulo.rubro}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-300">
                                                                    {articulo.descripcion}
                                                                </p>
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    Condición: {articulo.condicion}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    initiateDelete('single', { singleArticulo: articulo });
                                                                }}
                                                                className="p-2 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-colors border border-red-900/50"
                                                                title="Eliminar artículo"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-gray-500">
                                    <ListChecks className="h-12 w-12 mb-2 text-gray-600" />
                                    <p className="text-sm">No hay artículos para mostrar</p>
                                    <p className="text-xs mt-1">Seleccione una baja para ver sus artículos</p>
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

            {/* Modal para descargar PDF de baja */}
            {showPDFButton && pdfBajaData && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 animate-fadeIn">
                    <div className="bg-black rounded-2xl shadow-2xl border border-red-600/30 w-full max-w-md overflow-hidden transition-all duration-300 transform">
                        <div className="relative p-6 bg-gradient-to-b from-black to-gray-900">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/60 via-red-400 to-red-500/60"></div>

                            <button
                                onClick={() => setShowPDFButton(false)}
                                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-gray-900 text-red-400 hover:text-red-500 border border-red-500/30 transition-colors"
                                title="Cerrar"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="p-3 bg-red-500/10 rounded-full border border-red-500/30 mb-3">
                                    <FileDigit className="h-8 w-8 text-red-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Baja generada</h3>
                                <p className="text-gray-400 mt-2">
                                    Descarga el PDF de la baja para imprimir o compartir
                                </p>
                            </div>

                            <div className="space-y-5 mt-6">
                                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Documento generado</label>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-800 rounded-lg">
                                            <FileText className="h-4 w-4 text-red-400" />
                                        </div>
                                        <span className="text-white font-medium">Baja {pdfBajaData.folio_baja}</span>
                                    </div>
                                </div>

                                <div className="w-full flex flex-col items-center gap-4">
                                    <div className="w-full rounded-lg overflow-hidden border border-gray-700">
                                        <BajaPDFReport data={pdfBajaData} onClose={() => setShowPDFButton(false)} />
                                    </div>
                                    <div className="w-full">
                                        <PDFDownloadLink
                                            document={<BajaPDF data={pdfBajaData} />}
                                            fileName={`baja_${pdfBajaData.folio_baja}.pdf`}
                                            className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg"
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

            {/* Modal de confirmación de eliminación */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 animate-fadeIn">
                    <div className="bg-black rounded-2xl shadow-2xl border border-red-900/30 w-full max-w-md overflow-hidden">
                        <div className="relative p-6 bg-gradient-to-b from-black to-gray-900">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-800/60 via-red-600 to-red-800/60"></div>

                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="p-3 bg-red-900/20 rounded-full border border-red-900/30 mb-3">
                                    <AlertCircle className="h-8 w-8 text-red-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Confirmar eliminación</h3>
                                <p className="text-gray-400 mt-2">
                                    {deleteType === 'folio' && "¿Estás seguro de que deseas eliminar todo el folio de baja? Esta acción no se puede deshacer."}
                                    {deleteType === 'selected' && "¿Estás seguro de que deseas eliminar los artículos seleccionados? Esta acción no se puede deshacer."}
                                    {deleteType === 'single' && "¿Estás seguro de que deseas eliminar este artículo? Esta acción no se puede deshacer."}
                                </p>
                            </div>

                            <div className="space-y-4 mt-6">
                                {deleteType === 'folio' && itemToDelete?.folioResguardo && (
                                    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-800 rounded-lg">
                                                <FileDigit className="h-4 w-4 text-red-400" />
                                            </div>
                                            <div>
                                                <span className="text-white font-medium">Folio: {itemToDelete.folioResguardo}</span>
                                                <p className="text-sm text-gray-500">Se eliminarán todos los artículos asociados</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {deleteType === 'selected' && itemToDelete?.articulos && (
                                    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-800 rounded-lg">
                                                <ListChecks className="h-4 w-4 text-red-400" />
                                            </div>
                                            <div>
                                                <span className="text-white font-medium">{itemToDelete.articulos.length} artículos seleccionados</span>
                                                <p className="text-sm text-gray-500">Se eliminarán los artículos marcados</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {deleteType === 'single' && itemToDelete?.singleArticulo && (
                                    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-800 rounded-lg">
                                                <FileDigit className="h-4 w-4 text-red-400" />
                                            </div>
                                            <div>
                                                <span className="text-white font-medium">Artículo: {itemToDelete.singleArticulo.num_inventario}</span>
                                                <p className="text-sm text-gray-500">{itemToDelete.singleArticulo.descripcion}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setItemToDelete(null);
                                            setDeleteType(null);
                                        }}
                                        className="flex-1 py-2.5 px-4 bg-gray-900 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors border border-gray-800"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultarBajasResguardos;