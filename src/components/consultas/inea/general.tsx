"use client"
import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search, RefreshCw, Filter, ChevronLeft, ChevronRight,
    ArrowUpDown, AlertCircle, X, Save, Trash2, Check, CircleSlash2,
    ActivitySquare, LayoutGrid, TagIcon, ChevronDown, Building2, BookOpen, FileText, User, Shield, AlertTriangle, Calendar, Info, Edit, Receipt, ClipboardList, Store, CheckCircle, XCircle, Plus
} from 'lucide-react';
import supabase from '@/app/lib/supabase/client';

interface Mueble {
    id: number;
    id_inv: string;
    rubro: string | null;
    descripcion: string | null;
    valor: number | null;
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
}

interface FilterOptions {
    estados: string[];
    estatus: string[];
    areas: string[];
    rubros: string[];
}

// Componente para mostrar imágenes con manejo de carga y errores
const ImagePreview = ({ imagePath }: { imagePath: string | null }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadImage = async () => {
            if (!imagePath) {
                if (isMounted) {
                    setLoading(false);
                    setError(false);
                }
                return;
            }

            try {
                if (isMounted) {
                    setLoading(true);
                    setError(false);
                }

                // Generar URL firmada
                const { data, error } = await supabase
                    .storage
                    .from('muebles.inea')
                    .createSignedUrl(imagePath, 3600);

                if (error) throw error;

                // Verificar que la imagen se puede cargar
                const img = new Image();
                img.src = data.signedUrl;

                img.onload = () => {
                    if (isMounted) {
                        setImageUrl(data.signedUrl);
                        setLoading(false);
                    }
                };

                img.onerror = () => {
                    if (isMounted) {
                        setError(true);
                        setLoading(false);
                    }
                };
            } catch (err) {
                if (isMounted) {
                    setError(true);
                    setLoading(false);
                }
                console.error("Error loading image:", err);
            }
        };

        loadImage();

        return () => {
            isMounted = false;
        };
    }, [imagePath]);

    if (loading) {
        return (
            <div className="w-full h-64 flex items-center justify-center bg-gray-900/50 rounded-lg">
                <span className="text-gray-400">Cargando imagen...</span>
            </div>
        );
    }

    if (error || !imageUrl) {
        return (
            <div className="w-full h-64 flex items-center justify-center bg-gray-900/50 rounded-lg">
                <span className="text-gray-500">Imagen no disponible</span>
            </div>
        );
    }

    return (
        <div className="w-full h-64 bg-gray-900 rounded-lg overflow-hidden">
            <img
                src={imageUrl}
                alt="Imagen del bien"
                className="w-full h-full object-cover"
                onError={() => setError(true)}
            />
        </div>
    );
};

export default function ConsultasIneaGeneral() {
    const [muebles, setMuebles] = useState<Mueble[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filteredCount, setFilteredCount] = useState(0);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

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

    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        estados: [],
        estatus: [],
        areas: [],
        rubros: []
    });

    const [showFilters, setShowFilters] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Mueble | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState<Mueble | null>(null);
    const detailRef = useRef<HTMLDivElement>(null);

    // Función para obtener los muebles de Supabase
    const fetchMuebles = useCallback(async () => {
        setLoading(true);

        try {
            let countQuery = supabase
                .from('muebles')
                .select('id, id_inv, rubro, descripcion, valor, f_adq, formadq, proveedor, factura, ubicacion_es, ubicacion_mu, ubicacion_no, estado, estatus, area, usufinal, fechabaja, causadebaja, resguardante, image_path', { count: 'exact', head: false });

            let dataQuery = supabase.from('muebles').select('id, id_inv, rubro, descripcion, valor, f_adq, formadq, proveedor, factura, ubicacion_es, ubicacion_mu, ubicacion_no, estado, estatus, area, usufinal, fechabaja, causadebaja, resguardante, image_path');

            if (searchTerm) {
                const searchFilter = `id_inv.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%,resguardante.ilike.%${searchTerm}%,usufinal.ilike.%${searchTerm}%`;
                countQuery = countQuery.or(searchFilter);
                dataQuery = dataQuery.or(searchFilter);
            }

            if (filters.estado) {
                countQuery = countQuery.eq('estado', filters.estado);
                dataQuery = dataQuery.eq('estado', filters.estado);
            }

            if (filters.estatus) {
                countQuery = countQuery.eq('estatus', filters.estatus);
                dataQuery = dataQuery.eq('estatus', filters.estatus);
            }

            if (filters.area) {
                countQuery = countQuery.eq('area', filters.area);
                dataQuery = dataQuery.eq('area', filters.area);
            }

            if (filters.rubro) {
                countQuery = countQuery.eq('rubro', filters.rubro);
                dataQuery = dataQuery.eq('rubro', filters.rubro);
            }

            const { count } = await countQuery;
            setFilteredCount(count || 0);

            const { data, error } = await dataQuery
                .order(sortField, { ascending: sortDirection === 'asc' })
                .range((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage - 1);

            if (error) throw error;

            const mueblesData = (data as Mueble[]) || [];
            setMuebles(mueblesData);

            if (selectedItem && !mueblesData.some(item => item.id === selectedItem.id)) {
                setSelectedItem(null);
                setIsEditing(false);
                setEditFormData(null);
            }

            setError(null);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Error al cargar los datos. Por favor, intente nuevamente.');
            setMuebles([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, rowsPerPage, searchTerm, filters, sortField, sortDirection, selectedItem]);

    // Función para obtener las opciones de filtro
    const fetchFilterOptions = useCallback(async () => {
        try {
            const { data: estados } = await supabase
                .from('muebles')
                .select('estado')
                .filter('estado', 'not.is', null)
                .limit(1000);

            const { data: estatus } = await supabase
                .from('muebles')
                .select('estatus')
                .filter('estatus', 'not.is', null)
                .limit(1000);

            const { data: areas } = await supabase
                .from('muebles')
                .select('area')
                .filter('area', 'not.is', null)
                .limit(1000);

            const { data: rubros } = await supabase
                .from('muebles')
                .select('rubro')
                .filter('rubro', 'not.is', null)
                .limit(1000);

            setFilterOptions({
                estados: [...new Set(estados?.map(item => item.estado).filter(Boolean))] as string[],
                estatus: [...new Set(estatus?.map(item => item.estatus).filter(Boolean))] as string[],
                areas: [...new Set(areas?.map(item => item.area).filter(Boolean))] as string[],
                rubros: [...new Set(rubros?.map(item => item.rubro).filter(Boolean))] as string[]
            });
        } catch (error) {
            console.error('Error al cargar opciones de filtro:', error);
        }
    }, []);

    const uploadImage = async (muebleId: number) => {
        if (!imageFile) return null;

        try {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${muebleId}/image.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('muebles.inea')
                .upload(filePath, imageFile, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                console.error('Error subiendo imagen', uploadError);
                return null;
            }

            return filePath;
        } catch (err) {
            console.error('Error inesperado subiendo imagen', err);
            return null;
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('El archivo es demasiado grande. Máximo 5MB.');
                return;
            }

            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                setError('Formato no válido. Use JPG, PNG, GIF o WebP');
                return;
            }

            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Cargar datos iniciales
    useEffect(() => {
        fetchFilterOptions();
        fetchMuebles();
    }, [fetchFilterOptions, fetchMuebles]);

    // Efecto para aplicar filtros y ordenamiento
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filters, sortField, sortDirection, rowsPerPage]);

    // Efecto para cambiar de página
    useEffect(() => {
        fetchMuebles();
    }, [currentPage, fetchMuebles]);

    const handleSelectItem = (item: Mueble) => {
        setSelectedItem(item);
        setIsEditing(false);
        setEditFormData(null);
        setImageFile(null);
        setImagePreview(null);

        if (window.innerWidth < 768 && detailRef.current) {
            setTimeout(() => {
                detailRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    const handleStartEdit = () => {
        if (!selectedItem) return;
        setIsEditing(true);
        setEditFormData({ ...selectedItem });
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditFormData(null);
        setImageFile(null);
        setImagePreview(null);
    };

    const saveChanges = async () => {
        if (!editFormData) return;

        setLoading(true);
        setUploading(true);

        try {
            let imagePath = editFormData.image_path;
            if (imageFile) {
                const newPath = await uploadImage(editFormData.id);
                if (newPath) imagePath = newPath;
            }

            const { error } = await supabase
                .from('muebles')
                .update({ ...editFormData, image_path: imagePath })
                .eq('id', editFormData.id);

            if (error) throw error;

            fetchMuebles();
            setSelectedItem({ ...editFormData, image_path: imagePath });
            setIsEditing(false);
            setEditFormData(null);
            setImageFile(null);
            setImagePreview(null);
        } catch (error) {
            console.error('Error al guardar cambios:', error);
            setError('Error al guardar los cambios. Por favor, intente nuevamente.');
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    const markAsInactive = async () => {
        if (!selectedItem) return;
        if (!confirm('¿Está seguro de que desea marcar este artículo como INACTIVO?')) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('muebles')
                .update({ estatus: 'INACTIVO' })
                .eq('id', selectedItem.id);

            if (error) throw error;

            fetchMuebles();
            setSelectedItem(null);
        } catch (error) {
            console.error('Error al marcar como inactivo:', error);
            setError('Error al cambiar el estatus. Por favor, intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
        field: keyof Mueble
    ) => {
        if (!editFormData) return;

        const newData = { ...editFormData };

        switch (field) {
            case 'id':
                newData.id = parseInt(e.target.value) || newData.id;
                break;
            case 'id_inv':
                newData.id_inv = e.target.value;
                break;
            case 'valor':
                newData.valor = e.target.value ? parseFloat(e.target.value) : null;
                break;
            case 'rubro':
            case 'descripcion':
            case 'f_adq':
            case 'formadq':
            case 'proveedor':
            case 'factura':
            case 'ubicacion_es':
            case 'ubicacion_mu':
            case 'ubicacion_no':
            case 'estado':
            case 'estatus':
            case 'area':
            case 'usufinal':
            case 'fechabaja':
            case 'causadebaja':
            case 'resguardante':
            case 'image_path':
                newData[field] = e.target.value || null;
                break;
        }

        setEditFormData(newData);
    };

    const closeDetail = () => {
        setSelectedItem(null);
        setIsEditing(false);
        setEditFormData(null);
        setImageFile(null);
        setImagePreview(null);
    };

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

    const handleSort = (field: keyof Mueble) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-MX');
    };

    const totalPages = Math.ceil(filteredCount / rowsPerPage);

    const changePage = (page: number) => {
        if (page === currentPage) return;
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            let startPage = Math.max(2, currentPage - 1);
            let endPage = Math.min(totalPages - 1, currentPage + 1);

            if (currentPage <= 3) {
                endPage = Math.min(totalPages - 1, 4);
            }

            if (currentPage >= totalPages - 2) {
                startPage = Math.max(2, totalPages - 3);
            }

            if (startPage > 2) {
                pages.push('...');
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            if (endPage < totalPages - 1) {
                pages.push('...');
            }

            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const getMainContainerClass = () => {
        return selectedItem
            ? "grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-hidden"
            : "w-full h-full overflow-hidden";
    };

    const truncateText = (text: string | null, length: number = 50) => {
        if (!text) return "No Data";
        return text.length > length ? `${text.substring(0, length)}...` : text;
    };

    return (
        <div className="bg-black text-white max-h-screen p-4 md:p-2 flex flex-col overflow-y-hidden">
            <div className="max-w-7xl mx-auto h-screen flex flex-col overflow-hidden">
                {/* Encabezado */}
                <div className="mb-6 border-b border-gray-700 pb-4">
                    <h1 className="text-2xl font-bold text-white">Consulta de Inventario INEA</h1>
                    <p className="text-gray-400">Vista general de todos los bienes registrados en el sistema.</p>
                </div>

                {/* Contenedor principal */}
                <div className={getMainContainerClass()}>
                    {/* Panel izquierdo: Búsqueda, filtros y tabla */}
                    <div className={`${selectedItem ? 'h-full overflow-y-hidden' : 'h-fill'}`}>
                        {/* Panel de acciones y búsqueda */}
                        <div className="mb-6 bg-gray-900 p-4 rounded-lg border border-gray-800">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                <div className="relative flex-grow">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Buscar por ID, descripción o usuario..."
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
                                        <span className="hidden sm:inline">Actualizar</span>
                                    </button>
                                </div>
                            </div>

                            {/* Panel de filtros */}
                            {showFilters && (
                                <div className="mt-6 border border-gray-700 rounded-xl bg-gray-800/90 shadow-lg backdrop-blur-sm transition-all duration-300 overflow-hidden">
                                    <div className="flex justify-between items-center px-5 py-4 border-b border-gray-700">
                                        <div className="flex items-center gap-2">
                                            <Filter className="h-5 w-5 text-blue-400" />
                                            <h3 className="font-semibold text-gray-200 text-lg">Filtros avanzados</h3>
                                        </div>
                                        <button
                                            onClick={clearFilters}
                                            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-gray-700/70 border border-transparent hover:border-gray-600"
                                            aria-label="Limpiar todos los filtros"
                                        >
                                            <span>Limpiar filtros</span>
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                            {/* Estado */}
                                            <div className="filter-group">
                                                <label htmlFor="estado-select" className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-2">
                                                    <CircleSlash2 className="h-4 w-4 text-gray-400" />
                                                    Estado
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        id="estado-select"
                                                        value={filters.estado}
                                                        onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all duration-200"
                                                    >
                                                        <option value="">Todos los estados</option>
                                                        {filterOptions.estados.map((estado) => (
                                                            <option key={estado} value={estado}>{estado}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Estatus */}
                                            <div className="filter-group">
                                                <label htmlFor="estatus-select" className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-2">
                                                    <ActivitySquare className="h-4 w-4 text-gray-400" />
                                                    Estatus
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        id="estatus-select"
                                                        value={filters.estatus}
                                                        onChange={(e) => setFilters({ ...filters, estatus: e.target.value })}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all duration-200"
                                                    >
                                                        <option value="">Todos los estatus</option>
                                                        {filterOptions.estatus.map((status) => (
                                                            <option key={status} value={status}>{status}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Área */}
                                            <div className="filter-group">
                                                <label htmlFor="area-select" className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-2">
                                                    <LayoutGrid className="h-4 w-4 text-gray-400" />
                                                    Área
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        id="area-select"
                                                        value={filters.area}
                                                        onChange={(e) => setFilters({ ...filters, area: e.target.value })}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all duration-200"
                                                    >
                                                        <option value="">Todas las áreas</option>
                                                        {filterOptions.areas.map((area) => (
                                                            <option key={area} value={area}>{area}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Rubro */}
                                            <div className="filter-group">
                                                <label htmlFor="rubro-select" className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-2">
                                                    <TagIcon className="h-4 w-4 text-gray-400" />
                                                    Rubro
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        id="rubro-select"
                                                        value={filters.rubro}
                                                        onChange={(e) => setFilters({ ...filters, rubro: e.target.value })}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all duration-200"
                                                    >
                                                        <option value="">Todos los rubros</option>
                                                        {filterOptions.rubros.map((rubro) => (
                                                            <option key={rubro} value={rubro}>{rubro}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tabla */}
                        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden mb-6 flex flex-col flex-grow">
                            <div className="overflow-x-auto flex-grow overflow-y-auto max-h-[calc(100vh-300px)]">
                                <table className="min-w-full divide-y divide-gray-800">
                                    <thead className="bg-gray-800 sticky top-0 z-10">
                                        <tr>
                                            <th
                                                onClick={() => handleSort('id_inv')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                            >
                                                <div className="flex items-center gap-1">
                                                    ID Inventario
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('descripcion')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Descripción
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('area')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Área
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('usufinal')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Usuario Final
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('estatus')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Estado
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-gray-900 divide-y divide-gray-800">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                                    <div className="flex flex-col items-center justify-center space-y-3">
                                                        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                                                        <p>Cargando datos...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : error ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center">
                                                    <div className="flex flex-col items-center justify-center space-y-3 text-red-400">
                                                        <AlertCircle className="h-8 w-8" />
                                                        <p>{error}</p>
                                                        <button
                                                            onClick={fetchMuebles}
                                                            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-md text-sm hover:bg-gray-700"
                                                        >
                                                            Intentar nuevamente
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : muebles.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                                    <div className="flex flex-col items-center justify-center space-y-3">
                                                        <Search className="h-8 w-8" />
                                                        <p>No se encontraron resultados</p>
                                                        {(searchTerm || Object.values(filters).some(value => value !== '')) && (
                                                            <button
                                                                onClick={clearFilters}
                                                                className="px-4 py-2 bg-gray-800 text-blue-400 rounded-md text-sm hover:bg-gray-700"
                                                            >
                                                                Limpiar filtros
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            muebles.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    onClick={() => handleSelectItem(item)}
                                                    className={`hover:bg-gray-800 cursor-pointer transition-colors ${selectedItem?.id === item.id ? 'bg-blue-900/20 border-l-4 border-blue-600' : ''}`}
                                                >
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
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${item.estatus === 'ACTIVO' ? 'bg-green-900/70 text-green-200 border border-green-700' :
                                                            item.estatus === 'INACTIVO' ? 'bg-red-900/70 text-red-200 border border-red-700' :
                                                                item.estatus === 'NO LOCALIZADO' ? 'bg-yellow-900/70 text-yellow-200 border border-yellow-700' :
                                                                    'bg-gray-700 text-gray-300 border border-gray-600'
                                                            }`}>
                                                            {item.estatus === 'ACTIVO' && <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                                                            {item.estatus === 'INACTIVO' && <XCircle className="h-3.5 w-3.5 mr-1.5" />}
                                                            {item.estatus === 'NO LOCALIZADO' && <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />}
                                                            {truncateText(item.estatus, 20)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginación */}
                            <div className="px-6 py-4 border-t border-gray-800 bg-gray-900 flex flex-col sm:flex-row items-center justify-between gap-4">
                                {/* Información de registros */}
                                <div className="text-sm text-gray-400 font-medium">
                                    Mostrando <span className="text-white">{(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filteredCount)}</span> de <span className="text-white">{filteredCount}</span> registros
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Controles de paginación */}
                                    <div className="flex items-center space-x-1 bg-gray-850 rounded-lg p-1">
                                        {/* Botón primera página */}
                                        <button
                                            onClick={() => changePage(1)}
                                            disabled={currentPage === 1}
                                            className={`p-1.5 rounded-md flex items-center justify-center ${currentPage === 1
                                                ? 'text-gray-600 cursor-not-allowed'
                                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                                }`}
                                            aria-label="Primera página"
                                            title="Primera página"
                                        >
                                            <div className="flex">
                                                <ChevronLeft className="h-4 w-4" />
                                                <ChevronLeft className="h-4 w-4 -ml-2" />
                                            </div>
                                        </button>

                                        {/* Botón página anterior */}
                                        <button
                                            onClick={() => changePage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={`p-1.5 rounded-md ${currentPage === 1
                                                ? 'text-gray-600 cursor-not-allowed'
                                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                                }`}
                                            aria-label="Página anterior"
                                            title="Página anterior"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>

                                        {/* Números de página */}
                                        <div className="flex items-center">
                                            {getPageNumbers().map((page, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => typeof page === 'number' ? changePage(page) : null}
                                                    disabled={page === '...'}
                                                    className={`min-w-[32px] h-8 px-2 rounded-md text-sm font-medium flex items-center justify-center ${currentPage === page
                                                        ? 'bg-blue-600 text-white'
                                                        : page === '...'
                                                            ? 'text-gray-500 cursor-default'
                                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Botón página siguiente */}
                                        <button
                                            onClick={() => changePage(currentPage + 1)}
                                            disabled={currentPage === totalPages || totalPages === 0}
                                            className={`p-1.5 rounded-md ${currentPage === totalPages || totalPages === 0
                                                ? 'text-gray-600 cursor-not-allowed'
                                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                                }`}
                                            aria-label="Página siguiente"
                                            title="Página siguiente"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>

                                        {/* Botón última página */}
                                        <button
                                            onClick={() => changePage(totalPages)}
                                            disabled={currentPage === totalPages || totalPages === 0}
                                            className={`p-1.5 rounded-md flex items-center justify-center ${currentPage === totalPages || totalPages === 0
                                                ? 'text-gray-600 cursor-not-allowed'
                                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                                }`}
                                            aria-label="Última página"
                                            title="Última página"
                                        >
                                            <div className="flex">
                                                <ChevronRight className="h-4 w-4" />
                                                <ChevronRight className="h-4 w-4 -ml-2" />
                                            </div>
                                        </button>
                                    </div>

                                    {/* Selector de filas por página */}
                                    <div className="flex items-center bg-gray-850 rounded-lg px-3 py-1.5">
                                        <label htmlFor="rowsPerPage" className="text-sm text-gray-400 mr-2">Filas:</label>
                                        <select
                                            id="rowsPerPage"
                                            value={rowsPerPage}
                                            onChange={(e) => {
                                                setRowsPerPage(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                    {/* Panel de detalles */}
                    {selectedItem && (
                        <div
                            ref={detailRef}
                            className="bg-gray-900 border border-gray-800 rounded-lg shadow-xl overflow-y-auto h-full flex flex-col"
                        >
                            <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                    <ClipboardList className="h-5 w-5 text-blue-400" />
                                    Detalle del Artículo
                                </h2>
                                <button
                                    type="button"
                                    onClick={closeDetail}
                                    title="Cerrar detalle"
                                    className="text-gray-400 hover:text-white rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-800 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex-grow p-6">
                                {isEditing ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {/* Sección de imagen en edición */}
                                            <div className="form-group col-span-2">
                                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                                    Imagen del Bien
                                                </label>

                                                <div className="flex items-start gap-4">
                                                    <div className="flex-1">
                                                        {imagePreview ? (
                                                            <div className="relative group">
                                                                <img
                                                                    src={imagePreview}
                                                                    alt="Vista previa"
                                                                    className="w-full h-64 object-contain rounded-lg border border-gray-700"
                                                                />
                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                                                                    <label className="cursor-pointer p-2 bg-gray-800/50 rounded-full hover:bg-gray-700">
                                                                        <Edit className="h-4 w-4 text-white" />
                                                                        <input
                                                                            type="file"
                                                                            onChange={handleImageChange}
                                                                            className="hidden"
                                                                            accept="image/*"
                                                                            id="image-upload"
                                                                            aria-label="Seleccionar nueva imagen"
                                                                            title="Seleccionar nueva imagen"
                                                                        />
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <ImagePreview imagePath={editFormData?.image_path || null} />
                                                        )}
                                                    </div>

                                                    <div className="flex-shrink-0 w-64 space-y-2">
                                                        <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors p-4">
                                                            <div className="text-center">
                                                                <Plus className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                                                                <span className="text-xs text-gray-400">Cambiar imagen</span>
                                                            </div>
                                                            <input
                                                                type="file"
                                                                onChange={handleImageChange}
                                                                className="hidden"
                                                                accept="image/*"
                                                            />
                                                        </label>
                                                        <div className="text-xs text-gray-400 p-2 bg-gray-800/50 rounded-lg">
                                                            <p>Formatos: JPG, PNG, GIF, WebP</p>
                                                            <p>Tamaño máximo: 5MB</p>
                                                            {uploading && <p className="text-blue-400 mt-1">Subiendo imagen...</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-400 mb-2">ID Inventario</label>
                                                <input
                                                    type="text"
                                                    value={editFormData?.id_inv || ''}
                                                    onChange={(e) => handleEditFormChange(e, 'id_inv')}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    placeholder="Ingrese el ID de inventario"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Rubro</label>
                                                <div className="relative">
                                                    <select
                                                        id="rubro-select"
                                                        value={editFormData?.rubro || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'rubro')}
                                                        className="appearance-none w-full bg-gray-800 border border-gray-700 rounded-lg pl-4 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    >
                                                        {filterOptions.rubros.map((rubro) => (
                                                            <option key={rubro} value={rubro}>{rubro}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="form-group col-span-2">
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Descripción</label>
                                                <textarea
                                                    value={editFormData?.descripcion || ''}
                                                    onChange={(e) => handleEditFormChange(e, 'descripcion')}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    rows={3}
                                                    placeholder="Ingrese la descripción"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Valor</label>
                                                <div className="relative">
                                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">$</span>
                                                    <input
                                                        type="number"
                                                        value={editFormData?.valor || 0}
                                                        onChange={(e) => handleEditFormChange(e, 'valor')}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        title="Ingrese el valor"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Fecha de Adquisición</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                                    <input
                                                        type="date"
                                                        value={editFormData?.f_adq || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'f_adq')}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        title="Seleccione la fecha de adquisición"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Forma de Adquisición</label>
                                                <input
                                                    type="text"
                                                    value={editFormData?.formadq || ''}
                                                    onChange={(e) => handleEditFormChange(e, 'formadq')}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    title="Ingrese la forma de adquisición"
                                                    placeholder="Forma de adquisición"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Proveedor</label>
                                                <div className="relative">
                                                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        value={editFormData?.proveedor || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'proveedor')}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        title="Ingrese el nombre del proveedor"
                                                        placeholder="Nombre del proveedor"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Factura</label>
                                                <div className="relative">
                                                    <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        value={editFormData?.factura || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'factura')}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        title="Ingrese el número de factura"
                                                        placeholder="Número de factura"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Ubicación (Edificio)</label>
                                                <div className="relative">
                                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        title="Ubicación (Edificio)"
                                                        placeholder="Ubicación (Edificio)"
                                                        value={editFormData?.ubicacion_es || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'ubicacion_es')}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Ubicación (Mueble)</label>
                                                <div className="relative">
                                                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        title="Ubicación (Mueble)"
                                                        placeholder="Ubicación (Mueble)"
                                                        value={editFormData?.ubicacion_mu || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'ubicacion_mu')}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Ubicación (Notas)</label>
                                                <input
                                                    type="text"
                                                    value={editFormData?.ubicacion_no || ''}
                                                    onChange={(e) => handleEditFormChange(e, 'ubicacion_no')}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    title="Ingrese notas de ubicación"
                                                    placeholder="Notas de ubicación"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Estado</label>
                                                <div className="relative">
                                                    <select
                                                        id="estado-select"
                                                        title="Seleccione el estado"
                                                        value={editFormData?.estado || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'estado')}
                                                        className="appearance-none w-full bg-gray-800 border border-gray-700 rounded-lg pl-4 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    >
                                                        {filterOptions.estados.map((estado) => (
                                                            <option key={estado} value={estado}>{estado}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Estatus</label>
                                                <div className="relative">
                                                    <select
                                                        id="estatus-select"
                                                        title="Seleccione el estatus"
                                                        value={editFormData?.estatus || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'estatus')}
                                                        className="appearance-none w-full bg-gray-800 border border-gray-700 rounded-lg pl-4 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    >
                                                        {filterOptions.estatus.map((status) => (
                                                            <option key={status} value={status}>{status}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Área</label>
                                                <div className="relative">
                                                    <select
                                                        aria-label="Área"
                                                        value={editFormData?.area || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'area')}
                                                        className="appearance-none w-full bg-gray-800 border border-gray-700 rounded-lg pl-4 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    >
                                                        {filterOptions.areas.map((area) => (
                                                            <option key={area} value={area}>{area}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Usuario Final</label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        title="Ingrese el usuario final"
                                                        placeholder="Ingrese el usuario final"
                                                        value={editFormData?.usufinal || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'usufinal')}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Resguardante</label>
                                                <div className="relative">
                                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        value={editFormData?.resguardante || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'resguardante')}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        title="Ingrese el resguardante"
                                                        placeholder="Ingrese el resguardante"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-4 pt-6 border-t border-gray-800">
                                            <button
                                                onClick={saveChanges}
                                                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                            >
                                                <Save className="h-4 w-4" />
                                                Guardar Cambios
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="px-5 py-2.5 bg-gray-800 text-gray-300 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                            >
                                                <X className="h-4 w-4" />
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Sección de imagen en vista de detalles */}
                                        <div className="detail-card bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all col-span-2">
                                            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">
                                                Fotografía del Bien
                                            </h3>
                                            <ImagePreview imagePath={selectedItem.image_path} />
                                        </div>
                                        {/* Sección de detalles del artículo */}
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className="detail-card bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">ID Inventario</h3>
                                                <p className="mt-2 text-white font-medium">{selectedItem.id_inv}</p>
                                            </div>
                                            <div className="detail-card bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Rubro</h3>
                                                <p className="mt-2 text-white font-medium">{selectedItem.rubro || 'No especificado'}</p>
                                            </div>
                                            <div className="detail-card bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all col-span-2">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Descripción</h3>
                                                <p className="mt-2 text-white">{selectedItem.descripcion || 'No especificado'}</p>
                                            </div>
                                            <div className="detail-card bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Valor</h3>
                                                <p className="mt-2 text-white font-medium">
                                                    {selectedItem.valor ?
                                                        `$${selectedItem.valor.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` :
                                                        '$0.00'}
                                                </p>
                                            </div>
                                            <div className="detail-card bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Fecha de Adquisición</h3>
                                                <p className="mt-2 text-white flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-blue-400" />
                                                    {formatDate(selectedItem.f_adq) || 'No especificado'}
                                                </p>
                                            </div>
                                            <div className="detail-card bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Forma de Adquisición</h3>
                                                <p className="mt-2 text-white">{selectedItem.formadq || 'No especificado'}</p>
                                            </div>
                                            <div className="detail-card bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Proveedor</h3>
                                                <p className="mt-2 text-white flex items-center gap-2">
                                                    <Store className="h-4 w-4 text-blue-400" />
                                                    {selectedItem.proveedor || 'No especificado'}
                                                </p>
                                            </div>
                                            <div className="detail-card bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Factura</h3>
                                                <p className="mt-2 text-white flex items-center gap-2">
                                                    <Receipt className="h-4 w-4 text-blue-400" />
                                                    {selectedItem.factura || 'No especificado'}
                                                </p>
                                            </div>
                                            <div className="detail-card bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Estado</h3>
                                                <p className="mt-2 text-white">{selectedItem.estado || 'No especificado'}</p>
                                            </div>
                                            <div className="detail-card bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Estatus</h3>
                                                <div className="mt-2">
                                                    <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${selectedItem.estatus === 'ACTIVO' ? 'bg-green-900/70 text-green-200 border border-green-700' :
                                                        selectedItem.estatus === 'INACTIVO' ? 'bg-red-900/70 text-red-200 border border-red-700' :
                                                            'bg-gray-700 text-gray-300 border border-gray-600'
                                                        }`}>
                                                        {selectedItem.estatus === 'ACTIVO' && <Check className="h-3.5 w-3.5 mr-1.5" />}
                                                        {selectedItem.estatus === 'INACTIVO' && <AlertCircle className="h-3.5 w-3.5 mr-1.5" />}
                                                        {selectedItem.estatus || 'No especificado'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="detail-card bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all col-span-2">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Ubicación</h3>
                                                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    {selectedItem.ubicacion_es && (
                                                        <div className="flex items-center gap-2 bg-gray-900/60 p-2 rounded-md">
                                                            <Building2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                                            <span className="text-white">{selectedItem.ubicacion_es}</span>
                                                        </div>
                                                    )}
                                                    {selectedItem.ubicacion_mu && (
                                                        <div className="flex items-center gap-2 bg-gray-900/60 p-2 rounded-md">
                                                            <BookOpen className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                                            <span className="text-white">{selectedItem.ubicacion_mu}</span>
                                                        </div>
                                                    )}
                                                    {selectedItem.ubicacion_no && (
                                                        <div className="flex items-center gap-2 bg-gray-900/60 p-2 rounded-md">
                                                            <FileText className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                                            <span className="text-white">{selectedItem.ubicacion_no}</span>
                                                        </div>
                                                    )}
                                                    {!selectedItem.ubicacion_es && !selectedItem.ubicacion_mu && !selectedItem.ubicacion_no && (
                                                        <span className="text-gray-400">No especificado</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="detail-card bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Área</h3>
                                                <p className="mt-2 text-white">{selectedItem.area || 'No especificado'}</p>
                                            </div>
                                            <div className="detail-card bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Usuario Final</h3>
                                                <p className="mt-2 text-white flex items-center gap-2">
                                                    <User className="h-4 w-4 text-blue-400" />
                                                    {selectedItem.usufinal || 'No especificado'}
                                                </p>
                                            </div>
                                            <div className="detail-card bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Resguardante</h3>
                                                <p className="mt-2 text-white flex items-center gap-2">
                                                    <Shield className="h-4 w-4 text-blue-400" />
                                                    {selectedItem.resguardante || 'No especificado'}
                                                </p>
                                            </div>
                                            {selectedItem.fechabaja && (
                                                <div className="detail-card bg-red-900/20 border border-red-800/50 rounded-lg p-4 col-span-2">
                                                    <h3 className="text-xs font-medium uppercase tracking-wider text-red-400 flex items-center gap-2">
                                                        <AlertTriangle className="h-4 w-4" />
                                                        Información de Baja
                                                    </h3>
                                                    <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                                                        <div className="flex items-center gap-2 text-gray-300">
                                                            <Calendar className="h-4 w-4 text-red-400" />
                                                            <span>Fecha: {formatDate(selectedItem.fechabaja)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-gray-300">
                                                            <Info className="h-4 w-4 text-red-400" />
                                                            <span>Causa: {selectedItem.causadebaja || 'No especificada'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-4 pt-6 border-t border-gray-800">
                                            <button
                                                onClick={handleStartEdit}
                                                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                            >
                                                <Edit className="h-4 w-4" />
                                                Editar
                                            </button>
                                            <button
                                                onClick={markAsInactive}
                                                className="px-5 py-2.5 bg-red-900 text-red-200 rounded-lg font-medium flex items-center gap-2 hover:bg-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Marcar como Inactivo
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}