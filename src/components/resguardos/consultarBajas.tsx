"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search, ChevronLeft, ChevronRight, ArrowUpDown,
    AlertCircle, X, FileText, Calendar,
    User, Download, ListChecks,
    Info, RefreshCw, FileDigit, Building2
} from 'lucide-react';
import supabase from '@/app/lib/supabase/client';
import { generateBajaPDF } from './BajaPDFReport';
import { useUserRole } from "@/hooks/useUserRole";
import RoleGuard from "@/components/roleGuard";
import { useNotifications } from '@/hooks/useNotifications';

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
    area_resguardo?: string | null;
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
    const [showPDFModal, setShowPDFModal] = useState(false);
    const detailRef = useRef<HTMLDivElement>(null);
    const [filterDate, setFilterDate] = useState('');
    const [filterDirector, setFilterDirector] = useState('');
    const [filterResguardante, setFilterResguardante] = useState('');
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
    const { createNotification } = useNotifications();

    // Fetch bajas with pagination and sorting
    const fetchBajas = useCallback(async () => {
        setLoading(true);
        try {
            let baseQuery = supabase
                .from('resguardos_bajas')
                .select('*');

            if (filterDate) {
                baseQuery = baseQuery.eq('f_resguardo::date', filterDate);
            }

            if (filterDirector) {
                baseQuery = baseQuery.ilike('dir_area', `%${filterDirector?.trim().toUpperCase() || ''}%`);
            }

            if (filterResguardante) {
                baseQuery = baseQuery.ilike('usufinal', `%${filterResguardante?.trim().toUpperCase() || ''}%`);
            }

            const { data: allData, error: queryError } = await baseQuery;

            if (queryError) throw queryError;

            const uniqueFolios = Array.from(
                new Map(
                    allData?.map(item => [item.folio_resguardo, item])
                ).values()
            );

            const totalUniqueFolios = uniqueFolios.length;
            setTotalCount(totalUniqueFolios);

            const totalPages = Math.ceil(totalUniqueFolios / rowsPerPage);
            const adjustedCurrentPage = Math.min(currentPage, totalPages || 1);
            if (adjustedCurrentPage !== currentPage) {
                setCurrentPage(adjustedCurrentPage);
            }

            const from = (adjustedCurrentPage - 1) * rowsPerPage;

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
    }, [currentPage, rowsPerPage, sortField, sortDirection, filterDate, filterDirector, filterResguardante]);

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
                if (filterResguardante) {
                    dataQuery = dataQuery.ilike('usufinal', `%${filterResguardante.trim().toUpperCase()}%`);
                }
                const { data, error } = await dataQuery;
                if (!error) setAllBajas(data || []);
            } catch {
                setAllBajas([]);
            }
        };
        fetchAllBajas();
    }, [filterDate, filterDirector, filterResguardante, searchTerm]);

    const fetchBajaDetails = async (folioResguardo: string) => {
        setLoading(true);
        try {
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
                    usufinal: item.usufinal || firstItem.usufinal
                }));

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
            }
        } catch (err) {
            setError('Error al cargar los detalles de la baja');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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

    const handleBajaPDF = async () => {
        if (!selectedBaja) return;

        setLoading(true);
        try {
            const groupedSelected = getSelectedItemsGroupedByFolio();
            const firstGroup = groupedSelected[0];

            const firmas = await getFirmas();

            setPdfBajaData({
                folio_resguardo: selectedBaja.folio_resguardo,
                folio_baja: firstGroup.folio_baja,
                fecha: new Date(selectedBaja.f_resguardo).toLocaleDateString(),
                director: selectedBaja.dir_area,
                area: selectedBaja.area_resguardo || '',
                puesto: selectedBaja.puesto,
                resguardante: selectedBaja.usufinal || '',
                articulos: firstGroup.articulos.map(art => ({
                    id_inv: art.num_inventario,
                    descripcion: art.descripcion,
                    rubro: art.rubro,
                    estado: art.condicion,
                    origen: art.origen,
                    folio_baja: art.folio_baja,
                    resguardante: art.usufinal || selectedBaja.usufinal || ''
                })),
                firmas: firmas || undefined
            });
            setShowPDFModal(true);
            // Notificación de generación de PDF de baja
            await createNotification({
                title: `PDF de baja generado (${firstGroup.folio_baja})`,
                description: `Se generó un PDF de baja para el folio ${firstGroup.folio_baja} (director: ${selectedBaja.dir_area}, área: ${selectedBaja.area_resguardo || ''}) con ${firstGroup.articulos.length} artículo(s).`,
                type: 'info',
                category: 'bajas',
                device: 'web',
                importance: 'medium' as const,
                data: { affectedTables: ['resguardos_bajas'], changes: firstGroup.articulos.map(a => a.num_inventario) }
            });
        } catch (err) {
            setError('Error al preparar el PDF de baja');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field: 'id' | 'folio_resguardo' | 'f_resguardo' | 'dir_area') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    const resetSearch = () => {
        setSearchTerm('');
        fetchBajas();
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm || filterDate || filterDirector || filterResguardante) {
                setLoading(true);
                try {
                    let query = supabase.from('resguardos_bajas').select('*');

                    if (searchTerm) {
                        query = query.or(`folio_resguardo.ilike.%${searchTerm}%,folio_baja.ilike.%${searchTerm}%`);
                    }
                    if (filterDate) {
                        query = query.eq('f_resguardo::date', filterDate);
                    }
                    if (filterDirector) {
                        query = query.filter('dir_area', 'ilike', `%${filterDirector.trim().toUpperCase()}%`);
                    }
                    if (filterResguardante) {
                        query = query.filter('usufinal', 'ilike', `%${filterResguardante.trim().toUpperCase()}%`);
                    }

                    const { data, error } = await query.order(sortField, { ascending: sortDirection === 'asc' });

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
    }, [searchTerm, sortField, sortDirection, filterDate, filterDirector, filterResguardante, fetchBajas]);

    useEffect(() => {
        fetchBajas();
    }, [fetchBajas]);

    const totalPages = Math.ceil(totalCount / rowsPerPage);
    const foliosUnicos = Array.from(new Map(bajas.map(r => [r.folio_resguardo, r])).values());

    const getArticuloCount = (folioResguardo: string) => {
        return allBajas.filter(r => r.folio_resguardo === folioResguardo).length;
    };

    const handleItemSelection = (articleId: number) => {
        setSelectedItems(prev => ({
            ...prev,
            [articleId]: !prev[articleId]
        }));
    };

    const handleGroupSelection = (folioBaja: string) => {
        const newSelectedItems = { ...selectedItems };
        const groupArticles = groupedItems[folioBaja] || [];

        const allSelected = groupArticles.every(article => selectedItems[article.id]);

        groupArticles.forEach(article => {
            newSelectedItems[article.id] = !allSelected;
        });

        setSelectedItems(newSelectedItems);
    };

    const clearSelections = () => {
        setSelectedItems({});
    };

    const getSelectedItemsGroupedByFolio = () => {
        if (!selectedBaja) return [];
        const selectedArticles = selectedBaja.articulos.filter(art => selectedItems[art.id]);
        if (selectedArticles.length === 0) {
            return [{
                folio_baja: selectedBaja.folio_baja,
                articulos: selectedBaja.articulos
            }];
        }
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
            case 0: return 'bg-gray-900/40 text-gray-400 border border-gray-800';
            case 1: return 'bg-red-900/20 text-red-300 border border-red-900';
            case 2:
            case 3:
            case 4: return 'bg-red-800/40 text-red-300 border border-red-800';
            case 5:
            case 6:
            case 7:
            case 8:
            case 9: return 'bg-red-800/60 text-red-200 border border-red-700';
            default: return 'bg-red-700/60 text-red-100 border border-red-600';
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;

        setLoading(true);
        try {
            let result;
            let notificationData = null;

            switch (deleteType) {
                case 'folio':
                    if (itemToDelete.folioResguardo) {
                        // Buscar info para la notificación
                        const folioBajaArticulos = allBajas.filter(b => b.folio_resguardo === itemToDelete.folioResguardo);
                        result = await supabase
                            .from('resguardos_bajas')
                            .delete()
                            .eq('folio_resguardo', itemToDelete.folioResguardo);
                        const notificationType = 'danger' as const;
                        notificationData = {
                            title: `Folio de baja eliminado (${folioBajaArticulos[0]?.folio_baja || ''})`,
                            description: `Se eliminó el folio de baja ${folioBajaArticulos[0]?.folio_baja || ''} (director: ${folioBajaArticulos[0]?.dir_area || ''}, área: ${folioBajaArticulos[0]?.area_resguardo ?? ''}) con ${folioBajaArticulos.length} artículo(s).`,
                            type: notificationType,
                            category: 'bajas',
                            device: 'web',
                            importance: 'high' as const,
                            data: { affectedTables: ['resguardos_bajas'], changes: folioBajaArticulos.map(a => a.num_inventario) }
                        };
                    }
                    break;

                case 'selected':
                    if (itemToDelete.articulos && itemToDelete.articulos.length > 0) {
                        const ids = itemToDelete.articulos.map(art => art.id);
                        result = await supabase
                            .from('resguardos_bajas')
                            .delete()
                            .in('id', ids);
                        const notificationType = 'danger' as const;
                        notificationData = {
                            title: `Artículos eliminados de baja (${itemToDelete.articulos[0]?.folio_baja || ''})`,
                            description: `Se eliminaron ${itemToDelete.articulos.length} artículo(s) del folio de baja ${itemToDelete.articulos[0]?.folio_baja || ''} (director: ${selectedBaja?.dir_area || ''}, área: ${selectedBaja?.area_resguardo || ''}). Inventarios: ${itemToDelete.articulos.map(a => a.num_inventario).join(', ')}`,
                            type: notificationType as 'danger',
                            category: 'bajas',
                            device: 'web',
                            importance: 'high' as const,
                            data: { affectedTables: ['resguardos_bajas'], changes: itemToDelete.articulos.map(a => a.num_inventario) }
                        };
                    }
                    break;

                case 'single':
                    if (itemToDelete.singleArticulo) {
                        result = await supabase
                            .from('resguardos_bajas')
                            .delete()
                            .eq('id', itemToDelete.singleArticulo.id);
                        const notificationType = 'danger' as const;
                        notificationData = {
                            title: `Artículo eliminado de baja (${itemToDelete.singleArticulo.folio_baja})`,
                            description: `Se eliminó el artículo ${itemToDelete.singleArticulo.num_inventario} del folio de baja ${itemToDelete.singleArticulo.folio_baja}.`,
                            type: notificationType as 'danger',
                            category: 'bajas',
                            device: 'web',
                            importance: 'high' as const,
                            data: { affectedTables: ['resguardos_bajas'], changes: [itemToDelete.singleArticulo.num_inventario] }
                        };
                    }
                    break;
            }

            if (result?.error) throw result.error;

            if (notificationData) {
                await createNotification(notificationData);
            }

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

    const userRole = useUserRole();

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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Filtrar por fecha</label>
                                    <input
                                        title='Fecha de resguardo'
                                        type="date"
                                        max={new Date().toISOString().split('T')[0]}
                                        value={filterDate}
                                        onChange={e => {
                                            setCurrentPage(1);
                                            setFilterDate(e.target.value);
                                        }}
                                        className="w-full bg-black border border-gray-800 rounded-lg text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Filtrar por director</label>
                                    <input
                                        type="text"
                                        placeholder="Nombre del director..."
                                        value={filterDirector}
                                        onChange={e => {
                                            setCurrentPage(1);
                                            setFilterDirector(e.target.value);
                                        }}
                                        className="w-full bg-black border border-gray-800 rounded-lg text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Filtrar por resguardante</label>
                                    <input
                                        type="text"
                                        placeholder="Nombre del resguardante..."
                                        value={filterResguardante}
                                        onChange={e => {
                                            setCurrentPage(1);
                                            setFilterResguardante(e.target.value);
                                        }}
                                        className="w-full bg-black border border-gray-800 rounded-lg text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={() => {
                                        setFilterDate('');
                                        setFilterDirector('');
                                        setFilterResguardante('');
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
                                        {loading ? (
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
                                                        <td className="px-4 py-4 group relative">
                                                            <div className="text-sm text-white hover:text-red-400 transition-colors">
                                                                {baja.dir_area}
                                                            </div>
                                                            <div className="text-xs text-gray-500">{baja.area_resguardo}</div>

                                                            {filterResguardante && (
                                                                <div className="mt-1">
                                                                    {Array.from(new Set(allBajas
                                                                        .filter(r => r.folio_resguardo === baja.folio_resguardo && r.usufinal?.toLowerCase().includes(filterResguardante.toLowerCase()))
                                                                        .map(r => r.usufinal)))
                                                                        .map((matchedResguardante, idx) => (
                                                                            <div
                                                                                key={idx}
                                                                                className="inline-flex items-center px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-300 text-xs mr-1 mb-1"
                                                                            >
                                                                                {matchedResguardante}
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            )}

                                                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-max max-w-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999]">
                                                                <div className="absolute left-1/2 -top-2 -translate-x-1/2 border-8 border-transparent border-b-gray-800"></div>
                                                                <div className="bg-black border border-gray-800 rounded-lg shadow-xl p-4">
                                                                    <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                                                        <User className="h-4 w-4 text-red-400" />
                                                                        Resguardantes
                                                                    </h4>
                                                                    <div className="flex flex-col gap-2">
                                                                        {Array.from(new Set(allBajas
                                                                            .filter(r => r.folio_resguardo === baja.folio_resguardo)
                                                                            .map(r => r.usufinal || 'Sin asignar')))
                                                                            .map((resguardante, idx) => (
                                                                                <div
                                                                                    key={idx}
                                                                                    className="flex items-center gap-2 text-sm text-gray-400 bg-gray-900/50 px-2 py-1 rounded-lg w-full"
                                                                                >
                                                                                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                                                                    {resguardante}
                                                                                </div>
                                                                            ))}
                                                                    </div>
                                                                </div>
                                                            </div>
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
                                            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Puesto</label>
                                            <div className="text-sm text-white flex items-center gap-2">
                                                <User className="h-4 w-4 text-gray-400" />
                                                {selectedBaja.puesto}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Resguardantes</label>
                                            <div className="flex flex-wrap gap-2">
                                                {Array.from(new Set(selectedBaja.articulos.map(a => a.usufinal || 'Sin asignar'))).map((resguardante, idx) => {
                                                    const colorPalette = [
                                                        'from-slate-800 to-slate-700 border-slate-600 text-slate-200',
                                                        'from-zinc-800 to-zinc-700 border-zinc-600 text-zinc-200',
                                                        'from-neutral-800 to-neutral-700 border-neutral-600 text-neutral-200',
                                                        'from-stone-800 to-stone-700 border-stone-600 text-stone-200',
                                                        'from-red-900 to-red-800 border-red-700 text-red-200',
                                                        'from-orange-900 to-orange-800 border-orange-700 text-orange-200',
                                                        'from-amber-900 to-amber-800 border-amber-700 text-amber-200',
                                                        'from-emerald-900 to-emerald-800 border-emerald-700 text-emerald-200',
                                                        'from-teal-900 to-teal-800 border-teal-700 text-teal-200',
                                                        'from-cyan-900 to-cyan-800 border-cyan-700 text-cyan-200',
                                                    ];
                                                    const color = colorPalette[idx % colorPalette.length];
                                                    return (
                                                        <span
                                                            key={idx}
                                                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${color} border shadow-md transition-all duration-200 hover:scale-105 tracking-wider`}
                                                        >
                                                            <User className="h-3.5 w-3.5 mr-1 opacity-80" />
                                                            {resguardante}
                                                        </span>
                                                    );
                                                })}
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
                                    <RoleGuard roles={["admin", "superadmin"]} userRole={userRole}>
                                    <button
                                        onClick={() => initiateDelete('folio', { folioResguardo: selectedBaja.folio_resguardo })}
                                        className="w-full py-2 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40 transition-colors border border-red-900/50 flex items-center justify-center gap-2 mt-2"
                                    >
                                        <X className="h-4 w-4" />
                                        Eliminar Folio Completo
                                    </button>
                                    </RoleGuard>
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
                                                    <RoleGuard roles={["admin", "superadmin"]} userRole={userRole}>
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
                                                    </RoleGuard>
                                                )}
                                            </div>
                                            <span className="text-sm text-gray-400">
                                                {Object.values(selectedItems).filter(Boolean).length} seleccionados
                                            </span>
                                        </div>
                                    </div>

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
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                                        articulo.origen?.startsWith('INEA') || articulo.num_inventario.startsWith('INEA')
                                                                        ? 'bg-blue-900/70 text-blue-200 border border-blue-700'
                                                                        : 'bg-purple-900/70 text-purple-200 border border-purple-700'
                                                                    }`}>
                                                                        {articulo.origen?.startsWith('INEA') || articulo.num_inventario.startsWith('INEA') ? 'INEA' : 'ITEA'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-300">
                                                                    {articulo.descripcion}
                                                                </p>
                                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                                    <span>Condición: {articulo.condicion}</span>
                                                                    <span className="text-gray-600">•</span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="h-3 w-3" />
                                                                        {selectedBaja?.f_resguardo.slice(0, 10).split('-').reverse().join('/')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <RoleGuard roles={["admin", "superadmin"]} userRole={userRole}>
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
                                                            </RoleGuard>
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
            {showPDFModal && pdfBajaData && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 animate-fadeIn">
                    <div className="bg-black rounded-2xl shadow-2xl border border-red-600/30 w-full max-w-md overflow-hidden transition-all duration-300 transform">
                        <div className="relative p-6 bg-gradient-to-b from-black to-gray-900">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/60 via-red-400 to-red-500/60"></div>

                            <button
                                onClick={() => setShowPDFModal(false)}
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

                                <div className="w-full rounded-lg overflow-hidden border border-gray-700">
                                </div>

                                <div className="w-full">
                                    <button
                                        onClick={async () => {
                                            if (pdfBajaData) {
                                                // Construir columns y datos igual que en BajaPDFReport
                                                const foliosBaja = Array.from(new Set(pdfBajaData.articulos.map(a => a.folio_baja)));
                                                const showFolioBajaColumn = foliosBaja.length > 1;
                                                const columns = [
                                                    { header: 'No. Inventario', key: 'id_inv' },
                                                    { header: 'Descripción', key: 'descripcion' },
                                                    { header: 'Rubro', key: 'rubro' },
                                                    { header: 'Condición', key: 'estado' },
                                                    { header: 'Origen', key: 'origen' },
                                                    { header: 'Resguardante', key: 'resguardante' },
                                                ];
                                                if (showFolioBajaColumn) {
                                                    columns.splice(1, 0, { header: 'Folio Baja', key: 'folio_baja' });
                                                }
                                                const firmas = pdfBajaData.firmas ?? [];
                                                const pdfData = pdfBajaData.articulos.map(a => ({
                                                    id_inv: a.id_inv,
                                                    descripcion: a.descripcion,
                                                    rubro: a.rubro,
                                                    estado: a.estado,
                                                    origen: a.origen || '',
                                                    resguardante: a.resguardante,
                                                    folio_baja: a.folio_baja
                                                }));
                                                const title = `BAJA DE RESGUARDO FOLIO ${pdfBajaData.folio_baja}`;
                                                const fileName = `baja_${pdfBajaData.folio_baja}`;
                                                await generateBajaPDF({
                                                    data: pdfData,
                                                    columns,
                                                    title,
                                                    fileName,
                                                    firmas,
                                                    encabezado: pdfBajaData
                                                });
                                                setShowPDFModal(false);
                                            }
                                        }}
                                        className="w-full py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Descargar PDF
                                    </button>
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