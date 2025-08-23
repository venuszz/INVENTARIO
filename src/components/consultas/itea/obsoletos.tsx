"use client"
import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search, RefreshCw, Filter, ChevronLeft, ChevronRight,
    ArrowUpDown, AlertCircle, X, Save, CircleSlash2, LayoutGrid, 
    TagIcon, ChevronDown, Building2, User, 
    Shield, AlertTriangle, Calendar, Info, Edit, Receipt, 
    ClipboardList, Store, CheckCircle, XCircle, Plus, RotateCw, DollarSign
} from 'lucide-react';
import supabase from '@/app/lib/supabase/client';
import { useUserRole } from "@/hooks/useUserRole";
import RoleGuard from "@/components/roleGuard";
import { useNotifications } from '@/hooks/useNotifications';

interface MuebleITEA {
    id: number;
    id_inv: string | null;
    rubro: string | null;
    descripcion: string | null;
    valor: string | null;
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
    usufinal: string;
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
    formadq: string[];
    directores: { nombre: string; areas: string[] }[];
}

interface Directorio {
    id_directorio: number;
    nombre: string;
    areas: string[];
}

interface Message {
    type: 'success' | 'error' | 'info' | 'warning';
    text: string;
}

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

                const { data, error } = await supabase
                    .storage
                    .from('muebles.inea')
                    .createSignedUrl(imagePath, 3600);

                if (error) throw error;

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

export default function ConsultasIteaBajas() {
    const [muebles, setMuebles] = useState<MuebleITEA[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filteredCount, setFilteredCount] = useState(0);
    const [totalValue, setTotalValue] = useState(0); // Nuevo estado para el total
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<keyof MuebleITEA>('id_inv');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [filters, setFilters] = useState({
        estado: '',
        area: '',
        rubro: ''
    });
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        estados: [],
        estatus: [],
        areas: [],
        rubros: [],
        formadq: [],
        directores: []
    });
    const [uniqueFilterOptions, setUniqueFilterOptions] = useState<{ estados: string[]; areas: string[]; rubros: string[] }>({
        estados: [],
        areas: [],
        rubros: []
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MuebleITEA | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState<MuebleITEA | null>(null);
    const [message, setMessage] = useState<Message | null>(null);

    // Estados para el modal del director
    const [showDirectorModal, setShowDirectorModal] = useState(false);
    const [incompleteDirector, setIncompleteDirector] = useState<Directorio | null>(null);
    const [directorFormData, setDirectorFormData] = useState({ area: '' });
    const [savingDirector, setSavingDirector] = useState(false);
    const [directorio, setDirectorio] = useState<Directorio[]>([]);

    const [showReactivarModal, setShowReactivarModal] = useState(false);
    const [reactivating, setReactivating] = useState(false);

    const detailRef = useRef<HTMLDivElement>(null);

    const [bajaInfo, setBajaInfo] = useState<null | { created_by: string; created_at: string; motive: string }>(null);
    const [bajaInfoLoading, setBajaInfoLoading] = useState(false);
    const [bajaInfoError, setBajaInfoError] = useState<string | null>(null);

    const { createNotification } = useNotifications();

    // Estados para modales de área (N:M directores-areas)
    const [showAreaSelectModal, setShowAreaSelectModal] = useState(false);
    const [areaOptionsForDirector, setAreaOptionsForDirector] = useState<string[]>([]);

    useEffect(() => {
        if (!selectedItem || isEditing) {
            setBajaInfo(null);
            setBajaInfoError(null);
            return;
        }
        let cancelled = false;
        async function fetchBajaInfo() {
            setBajaInfoLoading(true);
            setBajaInfoError(null);
            try {
                if (!selectedItem) return;
                const { data, error } = await supabase
                    .from('deprecated')
                    .select('created_by, created_at, motive')
                    .eq('id_inv', selectedItem.id_inv || '')
                    .eq('descripcion', selectedItem.descripcion || '')
                    .eq('area', selectedItem.area || '')
                    .eq('motive', selectedItem.causadebaja || '')
                    .order('created_at', { ascending: false })
                    .limit(1);
                if (error) throw error;
                if (!cancelled) {
                    setBajaInfo(data && data.length > 0 ? data[0] : null);
                }
            } catch {
                if (!cancelled) setBajaInfoError('No se pudo obtener la información de baja.');
            } finally {
                if (!cancelled) setBajaInfoLoading(false);
            }
        }
        fetchBajaInfo();
        return () => { cancelled = true; };
    }, [selectedItem, isEditing]);

    // --- Calcular el total de los valores filtrados (bajas) con paginación automática ---
    async function sumFilteredBajasITEA(filters: { estado: string; area: string; rubro: string }) {
        let total = 0;
        let from = 0;
        const pageSize = 1000;
        let keepGoing = true;
        while (keepGoing) {
            const { data, error } = await supabase
                .from('mueblesitea')
                .select('valor')
                .match({
                    estatus: 'BAJA',
                    ...(filters.estado && { estado: filters.estado }),
                    ...(filters.area && { area: filters.area }),
                    ...(filters.rubro && { rubro: filters.rubro })
                })
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
        return total;
    }

    // --- Calcular el total de todas las bajas (sin filtros) con paginación automática ---
    async function sumAllBajasITEA() {
        let total = 0;
        let from = 0;
        const pageSize = 1000;
        let keepGoing = true;
        while (keepGoing) {
            const { data, error } = await supabase
                .from('mueblesitea')
                .select('valor')
                .eq('estatus', 'BAJA')
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
        return total;
    }

    // Reemplazar fetchDirectorio para N:M
    const fetchDirectorio = useCallback(async () => {
        try {
            // 1. Traer todos los directores
            const { data: directoresData, error: directoresError } = await supabase
                .from('directorio')
                .select('id_directorio, nombre');
            if (directoresError) throw directoresError;

            // 2. Traer todas las áreas
            const { data: areasData, error: areasError } = await supabase
                .from('area')
                .select('id_area, nombre');
            if (areasError) throw areasError;

            // 3. Traer todas las relaciones N:M
            const { data: relacionesData, error: relacionesError } = await supabase
                .from('directorio_areas')
                .select('id_directorio, id_area');
            if (relacionesError) throw relacionesError;

            // 4. Mapear áreas por director
            const directorioFormateado = (directoresData || []).map(director => {
                const areaIds = (relacionesData || [])
                    .filter(rel => rel.id_directorio === director.id_directorio)
                    .map(rel => rel.id_area);
                // Nombres de áreas asociadas
                const areas = (areasData || [])
                    .filter(a => areaIds.includes(a.id_area))
                    .map(a => a.nombre);
                return {
                    id_directorio: director.id_directorio,
                    nombre: director.nombre,
                    areas
                };
            });

            setDirectorio(directorioFormateado);

            // Actualizar filterOptions.directores
            const directores = directorioFormateado.map(item => ({
                nombre: item.nombre,
                areas: item.areas
            }));
            setFilterOptions(prev => ({
                ...prev,
                directores
            }));
        } catch (err) {
            console.error('Error al cargar directorio:', err);
            setMessage({
                type: 'error',
                text: 'Error al cargar la lista de directores'
            });
        }
    }, []);

    // Modificar handleSelectDirector para lógica N:M y modales unificados
    const handleSelectDirector = (nombre: string) => {
        const director = directorio.find(d => d.nombre === nombre);
        if (!director) return;

        // Si el director no tiene áreas, mostrar modal de alta de área
        if (!director.areas || director.areas.length === 0) {
            setIncompleteDirector(director);
            setDirectorFormData({ area: '' });
            setShowDirectorModal(true);
            return;
        }
        // Si tiene más de una área, mostrar modal de selección
        if (director.areas.length > 1) {
            setAreaOptionsForDirector(director.areas);
            setIncompleteDirector(director);
            setShowAreaSelectModal(true);
            return;
        }
        // Si solo tiene una área, asignar directo
        const area = director.areas[0] || '';
        if (editFormData) {
            setEditFormData(prev => ({
                ...prev!,
                usufinal: nombre,
                area
            }));
        } else if (selectedItem) {
            setSelectedItem(prev => ({
                ...prev!,
                usufinal: nombre,
                area
            }));
        }
    };

    // Guardar la información del director con área seleccionada (N:M)
    const saveDirectorInfo = async () => {
        if (!incompleteDirector || !directorFormData.area) return;

        setSavingDirector(true);
        try {
            const { error: updateError } = await supabase
                .from('directorio_areas')
                .insert({
                    id_directorio: incompleteDirector.id_directorio,
                    area: directorFormData.area
                });

            if (updateError) throw updateError;

            // Update local state
            const updatedDirectorio = directorio.map(d =>
                d.id_directorio === incompleteDirector.id_directorio
                    ? { ...d, areas: [...d.areas, directorFormData.area] }
                    : d
            );

            setDirectorio(updatedDirectorio);

            // Update filterOptions.directores
            const updatedDirectores = updatedDirectorio.map(item => ({
                nombre: item.nombre,
                areas: item.areas
            }));

            setFilterOptions(prev => ({
                ...prev,
                directores: updatedDirectores
            }));

            // Update the form or selected item
            if (editFormData) {
                setEditFormData(prev => ({
                    ...prev!,
                    usufinal: incompleteDirector.nombre,
                    area: directorFormData.area
                }));
            } else if (selectedItem) {
                setSelectedItem(prev => ({
                    ...prev!,
                    usufinal: incompleteDirector.nombre,
                    area: directorFormData.area
                }));
            }

            setShowDirectorModal(false);
            setMessage({
                type: 'success',
                text: 'Información del director actualizada correctamente'
            });
        } catch (err) {
            setMessage({
                type: 'error',
                text: 'Error al actualizar la información del director'
            });
            console.error(err);
        } finally {
            setSavingDirector(false);
        }
    };

    const reactivarArticulo = async () => {
        if (!selectedItem) return;
        setReactivating(true);
        try {
            const { error } = await supabase
                .from('mueblesitea')
                .update({
                    estatus: 'ACTIVO',
                    fechabaja: null,
                    causadebaja: null
                })
                .eq('id', selectedItem.id);
            if (error) throw error;
            // Notificación de reactivación
            await createNotification({
                title: `Artículo reactivado (ID: ${selectedItem.id_inv})`,
                description: `El artículo "${selectedItem.descripcion}" fue reactivado y regresó a inventario activo.`,
                type: 'success',
                category: 'bajas',
                device: 'web',
                importance: 'medium',
                data: { changes: [`Reactivación de artículo: ${selectedItem.id_inv}`], affectedTables: ['mueblesitea'] }
            });
            fetchMuebles();
            setSelectedItem(null);
            setMessage({ type: 'success', text: 'Artículo reactivado correctamente' });
        } catch {
            setMessage({ type: 'error', text: 'Error al reactivar el artículo. Por favor, intente nuevamente.' });
            // Notificación de error
            await createNotification({
                title: 'Error al reactivar artículo de baja',
                description: 'Error al reactivar el artículo dado de baja.',
                type: 'danger',
                category: 'bajas',
                device: 'web',
                importance: 'high',
                data: { affectedTables: ['mueblesitea'] }
            });
        } finally {
            setReactivating(false);
            setShowReactivarModal(false);
            setLoading(false);
        }
    };

    // Cambia el filtro para incluir solo los registros con estatus 'BAJA'
    const fetchMuebles = useCallback(async () => {
        setLoading(true);

        try {
            let countQuery = supabase
                .from('mueblesitea')
                .select('*', { count: 'exact', head: false })
                .eq('estatus', 'BAJA');

            let dataQuery = supabase.from('mueblesitea').select('*')
                .eq('estatus', 'BAJA');

            if (searchTerm) {
                const searchFilter = `id_inv.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%,resguardante.ilike.%${searchTerm}%,usufinal.ilike.%${searchTerm}%`;
                countQuery = countQuery.or(searchFilter);
                dataQuery = dataQuery.or(searchFilter);
            }

            if (filters.estado) {
                countQuery = countQuery.eq('estado', filters.estado);
                dataQuery = dataQuery.eq('estado', filters.estado);
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

            const mueblesData = (data as MuebleITEA[]) || [];
            setMuebles(mueblesData);

            // Calcular el total de los valores filtrados
            let total;
            if (Object.values(filters).some(v => v)) {
                total = await sumFilteredBajasITEA(filters);
            } else {
                total = await sumAllBajasITEA();
            }
            setTotalValue(total);

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

    const fetchFilterOptions = useCallback(async () => {
        try {
            // Obtener estados únicos
            const { data: estados } = await supabase
                .from('mueblesitea')
                .select('estado')
                .filter('estado', 'not.is', null)
                .limit(1000);

            // Obtener rubros desde la tabla config
            const { data: rubrosData } = await supabase
                .from('config')
                .select('concepto')
                .eq('tipo', 'rubro');

            // Obtener formas de adquisición desde la tabla config
            const { data: formadqData } = await supabase
                .from('config')
                .select('concepto')
                .eq('tipo', 'formadq');

            // Obtener estatus desde la tabla config
            const { data: estatusData } = await supabase
                .from('config')
                .select('concepto')
                .eq('tipo', 'estatus');

            // Obtener áreas desde la tabla areas
            const { data: areasData } = await supabase
                .from('areas')
                .select('itea')
                .not('itea', 'is', null);

            setFilterOptions(prev => ({
                ...prev,
                estados: [...new Set(estados?.map(item => item.estado).filter(Boolean))] as string[],
                rubros: rubrosData?.map(item => item.concepto).filter(Boolean) || [],
                formadq: formadqData?.map(item => item.concepto).filter(Boolean) || [],
                estatus: estatusData?.map(item => item.concepto).filter(Boolean) || [],
                areas: [...new Set(areasData?.map(item => item.itea).filter(Boolean))] as string[]
            }));
        } catch (error) {
            console.error('Error al cargar opciones de filtro:', error);
        }
    }, []);

    const fetchUniqueFilterOptions = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('mueblesitea')
                .select('estado, area, rubro')
                .eq('estatus', 'BAJA');
            if (error) throw error;
            const estados = Array.from(new Set(data?.map(item => item.estado?.trim()).filter(Boolean)));
            const areas = Array.from(new Set(data?.map(item => item.area?.trim()).filter(Boolean)));
            const rubros = Array.from(new Set(data?.map(item => item.rubro?.trim()).filter(Boolean)));
            setUniqueFilterOptions({
                estados,
                areas,
                rubros
            });
        } catch (error) {
            console.error('Error al cargar opciones únicas de filtro:', error);
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

    useEffect(() => {
        fetchDirectorio();
        fetchFilterOptions();
        fetchUniqueFilterOptions();
        fetchMuebles();
    }, [fetchDirectorio, fetchFilterOptions, fetchUniqueFilterOptions, fetchMuebles]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filters, sortField, sortDirection, rowsPerPage]);

    const handleSelectItem = (item: MuebleITEA) => {
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
                .from('mueblesitea')
                .update({ ...editFormData, image_path: imagePath })
                .eq('id', editFormData.id);

            if (error) throw error;

            // Notificación de edición de artículo dado de baja
            await createNotification({
                title: `Artículo de baja editado (ID: ${editFormData.id_inv})`,
                description: `El artículo "${editFormData.descripcion}" dado de baja fue editado. Cambios guardados por el usuario actual.`,
                type: 'info',
                category: 'bajas',
                device: 'web',
                importance: 'medium',
                data: { changes: [`Edición de artículo dado de baja: ${editFormData.id_inv}`], affectedTables: ['mueblesitea'] }
            });

            fetchMuebles();
            setSelectedItem({ ...editFormData, image_path: imagePath });
            setIsEditing(false);
            setEditFormData(null);
            setImageFile(null);
            setImagePreview(null);
            setMessage({
                type: 'success',
                text: 'Cambios guardados correctamente'
            });
        } catch (error) {
            console.error('Error al guardar cambios:', error);
            setMessage({
                type: 'error',
                text: 'Error al guardar los cambios. Por favor, intente nuevamente.'
            });
            // Notificación de error
            await createNotification({
                title: 'Error al editar artículo de baja',
                description: 'Error al guardar los cambios en el artículo dado de baja.',
                type: 'danger',
                category: 'bajas',
                device: 'web',
                importance: 'high',
                data: { affectedTables: ['mueblesitea'] }
            });
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    const handleEditFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
        field: keyof MuebleITEA
    ) => {
        if (!editFormData) return;

        const newData = { ...editFormData };

        // Forzar mayúsculas para inputs de texto y textarea
        let value = e.target.value;
        if (
            e.target.tagName === 'INPUT' ||
            e.target.tagName === 'TEXTAREA'
        ) {
            value = value.toUpperCase();
        }

        switch (field) {
            case 'id':
                newData.id = parseInt(value) || newData.id;
                break;
            case 'id_inv':
            case 'rubro':
            case 'descripcion':
            case 'valor':
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
                newData[field] = value || '';
                break;
            case 'f_adq':
                newData.f_adq = value || null;
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
            area: '',
            rubro: ''
        });
        setCurrentPage(1);
    };

    const handleSort = (field: keyof MuebleITEA) => {
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
        // Evitar desfase de zona horaria: usar la fecha como local (YYYY-MM-DD)
        const [year, month, day] = dateStr.split('-');
        if (!year || !month || !day) return '';
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
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
            ? "grid grid-cols-1 lg:grid-cols-2 gap-6 h-full flex-1"
            : "w-full h-full";
    };

    const truncateText = (text: string | null, length: number = 50) => {
        if (!text) return "No Data";
        return text.length > length ? `${text.substring(0, length)}...` : text;
    };

    // Efecto para mostrar mensajes temporales
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const userRole = useUserRole();

    return (
        <div className="bg-black text-white min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
            {/* Notificación de mensaje */}
            {message && (
                <div className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 animate-fadeIn ${message.type === 'success' ? 'bg-green-900/90 border border-green-700' :
                    message.type === 'error' ? 'bg-red-900/90 border border-red-700' :
                        message.type === 'warning' ? 'bg-yellow-900/90 border border-yellow-700' :
                            'bg-gray-900/90 border border-gray-700'}`}>
                    {message.type === 'success' && <CheckCircle className="h-5 w-5 text-green-300" />}
                    {message.type === 'error' && <XCircle className="h-5 w-5 text-red-300" />}
                    {message.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-300" />}
                    <span className="text-white">{message.text}</span>
                    <button
                        title='Cerrar mensaje'
                        onClick={() => setMessage(null)}
                        className="ml-2 text-gray-300 hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="w-full mx-auto bg-black rounded-lg sm:rounded-xl shadow-2xl overflow-hidden transition-all duration-500 transform border border-gray-800">
                {/* Header con título */}
                <div className="bg-gradient-to-r from-red-900/50 to-red-900/30 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-red-800 gap-2 sm:gap-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
                        <span className="mr-2 sm:mr-3 bg-red-900 text-white p-1 sm:p-2 rounded-lg border border-red-700 text-sm sm:text-base">INV</span>
                        Artículos dados de Baja (ITEA)
                    </h1>
                    <p className="text-red-300 text-sm sm:text-base">Vista de todos los bienes dados de baja en el sistema ITEA.</p>
                </div>

                {/* Nuevo componente de valor total */}
                <div className="bg-gradient-to-b from-gray-900 via-black to-black p-8 border-b border-gray-800">
                    <div className="flex flex-col lg:flex-row justify-between items-stretch gap-6">
                        {/* Panel de valor total */}
                        <div className="flex-grow">
                            <div className="group relative overflow-hidden bg-gradient-to-br from-red-950/30 via-red-900/20 to-gray-900/30 p-6 rounded-2xl border border-red-800/30 hover:border-red-700/50 transition-all duration-500 hover:shadow-lg hover:shadow-red-500/10">
                                <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-red-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="flex items-start gap-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-red-500/20 to-pink-500/20 blur-xl"></div>
                                        <div className="relative p-4 bg-gradient-to-br from-red-500/20 via-red-500/20 to-pink-500/20 rounded-xl border border-white/10 transform group-hover:scale-110 transition-all duration-500">
                                            <DollarSign className="h-8 w-8 text-white/90" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-sm font-medium text-gray-400 mb-1 group-hover:text-red-300 transition-colors">Valor Total de Bajas</h3>
                                        <div className="relative">
                                            <span className="text-3xl font-bold text-white">
                                                ${new Intl.NumberFormat('es-MX').format(totalValue)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Panel de conteo */}
                        <div className="flex-shrink-0">
                            <div className="group bg-gradient-to-br from-red-950/30 via-red-900/20 to-gray-900/30 p-6 rounded-2xl border border-red-800/30 hover:border-red-700/50 transition-all duration-500">
                                <div className="text-center">
                                    <p className="text-sm text-gray-400 mb-2 group-hover:text-red-300 transition-colors">Artículos Dados de Baja</p>
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
                                        <span className="relative text-3xl font-bold bg-gradient-to-r from-red-200 via-red-200 to-pink-200 bg-clip-text text-transparent group-hover:from-red-300 group-hover:via-red-300 group-hover:to-pink-300 transition-all duration-500 px-6 py-3">
                                            {filteredCount}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contenedor principal */}
                <div className={getMainContainerClass()}>
                    {/* Panel izquierdo: Búsqueda, filtros y tabla */}
                    <div className={`flex-1 min-w-0 flex flex-col ${selectedItem ? '' : 'w-full'}`}>
                        {/* Panel de acciones y búsqueda */}
                        <div className="mb-6 bg-gradient-to-br from-gray-900 via-black to-black p-6 rounded-xl border border-gray-800 shadow-lg">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                <div className="relative flex-grow group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-500 group-hover:text-red-400 transition-colors duration-300" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Buscar por ID, descripción o usuario..."
                                        className="pl-12 pr-4 py-3 w-full bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 hover:border-gray-600"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`group relative px-5 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-300 overflow-hidden ${
                                            Object.values(filters).some(value => value !== '')
                                                ? 'bg-gradient-to-r from-red-600/20 to-red-900/20 text-red-300 border border-red-500/50 hover:border-red-400'
                                                : 'bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 border border-gray-700 hover:border-gray-600'
                                        }`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <Filter className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${
                                            Object.values(filters).some(value => value !== '') ? 'text-red-400' : 'text-gray-400'
                                        }`} />
                                        <span>Filtros</span>
                                        {Object.values(filters).some(value => value !== '') && (
                                            <span className="ml-1 bg-red-500/20 text-red-300 rounded-full w-5 h-5 flex items-center justify-center text-xs animate-fadeIn">
                                                {Object.values(filters).filter(value => value !== '').length}
                                            </span>
                                        )}
                                    </button>

                                    <button
                                        onClick={fetchMuebles}
                                        className="group relative px-5 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 rounded-xl font-medium flex items-center gap-2 hover:text-white transition-all duration-300 border border-gray-700 hover:border-gray-600"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <RefreshCw className="h-5 w-5 text-gray-400 group-hover:text-gray-300 transition-transform duration-300 group-hover:rotate-180" />
                                        <span className="hidden sm:inline">Actualizar</span>
                                    </button>
                                </div>
                            </div>

                            {/* Panel de filtros */}
                            {showFilters && (
                                <div className="mt-6 border border-gray-700/50 rounded-xl bg-gray-900/30 shadow-xl backdrop-blur-sm transition-all duration-300 overflow-hidden animate-fadeIn">
                                    <div className="flex justify-between items-center px-5 py-4 border-b border-gray-700">
                                        <div className="flex items-center gap-2">
                                            <Filter className="h-5 w-5 text-gray-400" />
                                            <h3 className="font-semibold text-gray-200 text-lg">Filtros avanzados</h3>
                                        </div>
                                        <button
                                            onClick={clearFilters}
                                            className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1.5 transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-gray-700/70 border border-transparent hover:border-gray-600"
                                            aria-label="Limpiar todos los filtros"
                                        >
                                            <span>Limpiar filtros</span>
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="p-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {/* Estado */}
                                            <div className="filter-group">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                                                    <CircleSlash2 className="h-4 w-4 text-gray-400" />
                                                    Estado
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        id="estado-select"
                                                        title='Seleccione un estado'
                                                        value={filters.estado}
                                                        onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none transition-all duration-200"
                                                    >
                                                        <option value="">Todos los estados</option>
                                                        {uniqueFilterOptions.estados.map((estado) => (
                                                            <option key={estado} value={estado}>{estado}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Área */}
                                            <div className="filter-group">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                                                    <LayoutGrid className="h-4 w-4 text-gray-400" />
                                                    Área
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        id="area-select"
                                                        title='Área'
                                                        value={filters.area}
                                                        onChange={(e) => setFilters({ ...filters, area: e.target.value })}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none transition-all duration-200"
                                                    >
                                                        <option value="">Todas las áreas</option>
                                                        {uniqueFilterOptions.areas.map((area) => (
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
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                                                    <TagIcon className="h-4 w-4 text-gray-400" />
                                                    Rubro
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        id="rubro-select"
                                                        title='Seleccione un rubro'
                                                        value={filters.rubro}
                                                        onChange={(e) => setFilters({ ...filters, rubro: e.target.value })}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none transition-all duration-200"
                                                    >
                                                        <option value="">Todos los rubros</option>
                                                        {uniqueFilterOptions.rubros.map((rubro) => (
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
                        <div className="bg-black rounded-lg border border-gray-800 overflow-x-auto overflow-y-auto mb-6 flex flex-col flex-grow max-h-[70vh]">
                            <div className="flex-grow min-w-[800px]">
                                <table className="min-w-full divide-y divide-gray-800">
                                    <thead className="bg-black sticky top-0 z-10">
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
                                                    Director/Jefe de Área
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('fechabaja')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Fecha de Baja
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-black divide-y divide-gray-800">
                                        {loading ? (
                                            <tr className="h-96">
                                                <td colSpan={5} className="px-6 py-24 text-center text-gray-400">
                                                    <div className="flex flex-col items-center justify-center space-y-4">
                                                        <RefreshCw className="h-12 w-12 animate-spin text-gray-500" />
                                                        <p className="text-lg font-medium">Cargando datos...</p>
                                                        <p className="text-sm text-gray-500">Por favor espere mientras se cargan los registros de bajas</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : error ? (
                                            <tr className="h-96">
                                                <td colSpan={5} className="px-6 py-24 text-center">
                                                    <div className="flex flex-col items-center justify-center space-y-4 text-red-400">
                                                        <AlertCircle className="h-12 w-12" />
                                                        <p className="text-lg font-medium">Error al cargar datos</p>
                                                        <p className="text-sm text-gray-400 max-w-lg mx-auto mb-2">{error}</p>
                                                        <button
                                                            onClick={fetchMuebles}
                                                            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-md text-sm hover:bg-gray-700 transition-colors"
                                                        >
                                                            Intentar nuevamente
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : muebles.length === 0 ? (
                                            <tr className="h-96">
                                                <td colSpan={5} className="px-6 py-24 text-center text-gray-400">
                                                    <div className="flex flex-col items-center justify-center space-y-4">
                                                        <Search className="h-12 w-12 text-gray-500" />
                                                        <p className="text-lg font-medium">No se encontraron bajas</p>
                                                        {(searchTerm || Object.values(filters).some(value => value !== '')) ? (
                                                            <>
                                                                <p className="text-sm text-gray-500 max-w-lg mx-auto">
                                                                    No hay elementos que coincidan con los criterios de búsqueda actuales
                                                                </p>
                                                                <button
                                                                    onClick={clearFilters}
                                                                    className="px-4 py-2 bg-gray-800 text-red-400 rounded-md text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                    Limpiar filtros
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <p className="text-sm text-gray-500">No hay registros de bajas en el inventario</p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            muebles.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    onClick={() => handleSelectItem(item)}
                                                    className={`hover:bg-gray-800 cursor-pointer transition-colors ${selectedItem?.id === item.id ? 'bg-red-900/20 border-l-4 border-red-600' : ''}`}
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
                                                    <td className="px-4 py-3 text-sm text-gray-300">
                                                        {formatDate(item.fechabaja) || 'No especificada'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginación */}
                            <div className="px-6 py-4 border-t border-gray-800 bg-black flex flex-col sm:flex-row items-center justify-between gap-4 min-w-[93vh]">
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
                                                        ? 'bg-black text-white'
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
                                            className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-sm text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                            className="bg-black border border-gray-800 rounded-lg shadow-xl overflow-visible flex flex-col flex-shrink-0 lg:w-[600px] min-w-full max-h-[85vh]"
                        >
                            <div className="sticky top-0 z-10 bg-black border-b border-gray-800 px-6 py-4 flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                    <ClipboardList className="h-5 w-5 text-red-400" />
                                    Detalle del Artículo (BAJA)
                                </h2>
                                <button
                                    type="button"
                                    onClick={closeDetail}
                                    title="Cerrar detalle"
                                    className="text-gray-400 hover:text-white rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-red-500 hover:bg-gray-800 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex-grow p-6 overflow-y-auto">
                                {isEditing ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {/* Sección de imagen en edición */}
                                            <div className="form-group col-span-2">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
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
                                                        <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-red-500 transition-colors p-4">
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
                                                            {uploading && <p className="text-red-400 mt-1">Subiendo imagen...</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">ID Inventario</label>
                                                <input
                                                    type="text"
                                                    value={editFormData?.id_inv || ''}
                                                    onChange={(e) => handleEditFormChange(e, 'id_inv')}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                    placeholder="Ingrese el ID de inventario"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">Rubro</label>
                                                <div className="relative">
                                                    <select
                                                        id="rubro-select"
                                                        title='Seleccione un rubro'
                                                        value={editFormData?.rubro || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'rubro')}
                                                        className="appearance-none w-full bg-gray-800 border border-gray-700 rounded-lg pl-4 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                    >
                                                        {filterOptions.rubros.map((rubro) => (
                                                            <option key={rubro} value={rubro}>{rubro}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="form-group col-span-2">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">Descripción</label>
                                                <textarea
                                                    value={editFormData?.descripcion || ''}
                                                    onChange={(e) => handleEditFormChange(e, 'descripcion')}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                    rows={3}
                                                    placeholder="Ingrese la descripción"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">Valor</label>
                                                <input
                                                    type="text"
                                                    value={editFormData?.valor || ''}
                                                    onChange={(e) => handleEditFormChange(e, 'valor')}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                    placeholder="Ingrese el valor"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">Fecha de Adquisición</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                                    <input
                                                        type="date"
                                                        value={editFormData?.f_adq || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'f_adq')}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                        title="Seleccione la fecha de adquisición"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">Forma de Adquisición</label>
                                                <div className="relative">
                                                    <select
                                                        value={editFormData?.formadq || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'formadq')}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                        title="Ingrese la forma de adquisición"
                                                    >
                                                        <option value="">Seleccionar forma de adquisición</option>
                                                        {filterOptions.formadq.map((forma) => (
                                                            <option key={forma} value={forma}>{forma}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">Proveedor</label>
                                                <div className="relative">
                                                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        value={editFormData?.proveedor || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'proveedor')}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                        title="Ingrese el nombre del proveedor"
                                                        placeholder="Nombre del proveedor"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">Factura</label>
                                                <div className="relative">
                                                    <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        value={editFormData?.factura || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'factura')}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                        title="Ingrese el número de factura"
                                                        placeholder="Número de factura"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">Estado</label>
                                                <div className="relative">
                                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        title="Estado"
                                                        placeholder="Estado"
                                                        value={editFormData?.ubicacion_es || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'ubicacion_es')}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">Municipio</label>
                                                <div className="relative">
                                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        title="Municipio"
                                                        placeholder="Municipio"
                                                        value={editFormData?.ubicacion_mu || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'ubicacion_mu')}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">Nomenclatura</label>
                                                <div className="relative">
                                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        title="Nomenclatura"
                                                        placeholder="Nomenclatura"
                                                        value={editFormData?.ubicacion_no || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'ubicacion_no')}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">Estado</label>
                                                <div className="relative">
                                                    <select
                                                        id="estado-select"
                                                        title="Seleccione el estado"
                                                        value={editFormData?.estado || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'estado')}
                                                        className="appearance-none w-full bg-gray-800 border border-gray-700 rounded-lg pl-4 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                    >
                                                        {filterOptions.estados.map((estado) => (
                                                            <option key={estado} value={estado}>{estado}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">Área</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={editFormData?.area || ''}
                                                        readOnly
                                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-4 pr-10 py-2.5 text-white cursor-not-allowed"
                                                        aria-label="Área (se autocompleta al seleccionar un director/jefe)"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">Director/Jefe de Área</label>
                                                <div className="relative">
                                                    <select
                                                        title='Seleccione el Director/Jefe de Área'
                                                        name="usufinal"
                                                        value={editFormData?.usufinal || ''}
                                                        onChange={(e) => handleSelectDirector(e.target.value)}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-4 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all appearance-none"
                                                    >
                                                        <option value="">Seleccionar Director/Jefe</option>
                                                        {filterOptions.directores.map((director, index) => (
                                                            <option key={index} value={director.nombre}>{director.nombre}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">Usuario Final</label>
                                                <div className="relative">
                                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        value={editFormData?.resguardante || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'resguardante')}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                        title="Ingrese el Usuario Final"
                                                        placeholder="Ingrese el Usuario Final"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group col-span-2">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">Fecha de Baja</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                                    <input
                                                        type="date"
                                                        value={editFormData?.fechabaja || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'fechabaja')}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                        title="Seleccione la fecha de baja"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group col-span-2">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">Causa de Baja</label>
                                                <textarea
                                                    value={editFormData?.causadebaja || ''}
                                                    onChange={(e) => handleEditFormChange(e, 'causadebaja')}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                    rows={2}
                                                    placeholder="Ingrese la causa de la baja"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-4 pt-6 border-t border-gray-800">
                                            <button
                                                onClick={saveChanges}
                                                className="px-5 py-2.5 bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
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
                                                    {selectedItem.valor || '$0.00'}
                                                </p>
                                            </div>
                                            <div className="detail-card bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Fecha de Adquisición</h3>
                                                <p className="mt-2 text-white flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-red-400" />
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
                                                    <Store className="h-4 w-4 text-red-400" />
                                                    {selectedItem.proveedor || 'No especificado'}
                                                </p>
                                            </div>
                                            <div className="detail-card bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Factura</h3>
                                                <p className="mt-2 text-white flex items-center gap-2">
                                                    <Receipt className="h-4 w-4 text-red-400" />
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
                                                    <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-red-900/70 text-red-200 border border-red-700`}>
                                                        <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                                                        {selectedItem.estatus || 'No especificado'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="detail-card bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all col-span-2">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Ubicación</h3>
                                                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    {selectedItem.ubicacion_es && (
                                                        <div className="flex items-center gap-2 bg-gray-900/60 p-2 rounded-md">
                                                            <Building2 className="h-4 w-4 text-red-400 flex-shrink-0" />
                                                            <span className="text-white">{selectedItem.ubicacion_es}</span>
                                                        </div>
                                                    )}
                                                    {selectedItem.ubicacion_mu && (
                                                        <div className="flex items-center gap-2 bg-gray-900/60 p-2 rounded-md">
                                                            <Building2 className="h-4 w-4 text-red-400 flex-shrink-0" />
                                                            <span className="text-white">{selectedItem.ubicacion_mu}</span>
                                                        </div>
                                                    )}
                                                    {selectedItem.ubicacion_no && (
                                                        <div className="flex items-center gap-2 bg-gray-900/60 p-2 rounded-md">
                                                            <Building2 className="h-4 w-4 text-red-400 flex-shrink-0" />
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
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Director/Jefe de Área</h3>
                                                <p className="mt-2 text-white flex items-center gap-2">
                                                    <User className="h-4 w-4 text-red-400" />
                                                    {selectedItem.usufinal || 'No especificado'}
                                                </p>
                                            </div>
                                            <div className="detail-card bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Usuario Final</h3>
                                                <p className="mt-2 text-white flex items-center gap-2">
                                                    <Shield className="h-4 w-4 text-red-400" />
                                                    {selectedItem.resguardante || 'No especificado'}
                                                </p>
                                            </div>
                                            <div className="detail-card bg-red-900/20 border border-red-800/50 rounded-lg p-4 col-span-2">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-red-400 flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    Información de Baja
                                                </h3>
                                                <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                                                    <div className="flex items-center gap-2 text-gray-300">
                                                        <Calendar className="h-4 w-4 text-red-400" />
                                                        <span>Fecha: {formatDate(selectedItem.fechabaja) || 'No especificada'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-300">
                                                        <Info className="h-4 w-4 text-red-400" />
                                                        <span>Causa: {selectedItem.causadebaja || 'No especificada'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* NUEVO: Card de información de baja (usuario, fecha, motivo) */}
                                                                                        <div className="detail-card bg-red-900/60 border border-red-800 rounded-lg p-4 col-span-2 mt-2">
                                                                                            <h3 className="text-xs font-medium uppercase tracking-wider text-white flex items-center gap-2 mb-2">
                                                                                                <Info className="h-4 w-4" />
                                                                                                Registro de Baja
                                                                                            </h3>
                                                                                            {bajaInfoLoading ? (
                                                                                                <span className="text-gray-400">Cargando información...</span>
                                                                                            ) : bajaInfoError ? (
                                                                                                <span className="text-red-400">{bajaInfoError}</span>
                                                                                            ) : bajaInfo ? (
                                                                                                <div className="flex flex-col gap-1 text-sm text-gray-200">
                                                                                                    <div><span className="font-bold text-red-200">Usuario:</span> <span className="font-semibold text-white">{bajaInfo.created_by}</span></div>
                                                                                                </div>
                                                                                            ) : (
                                                                                                <span className="text-gray-400">No hay registro de baja en historial.</span>
                                                )}
                                            </div>
                                        </div>
                                        <RoleGuard roles={["admin", "superadmin"]} userRole={userRole}>
                                        <div className="flex items-center space-x-4 pt-6 border-t border-gray-800">
                                            <button
                                                onClick={handleStartEdit}
                                                className="px-5 py-2.5 bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                            >
                                                <Edit className="h-4 w-4" />
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => setShowReactivarModal(true)}
                                                className="px-5 py-2.5 bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-green-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                            >
                                                <RotateCw className="h-4 w-4" />
                                                Reactivar Artículo
                                            </button>
                                        </div>
                                        </RoleGuard>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Modal para completar información del director */}
                    {showDirectorModal && (
                        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 animate-fadeIn">
                            <div className="bg-black rounded-2xl shadow-2xl border border-yellow-600/30 w-full max-w-md overflow-hidden transition-all duration-300 transform">
                                <div className="relative p-6 bg-gradient-to-b from-black to-gray-900">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500/60 via-yellow-400 to-yellow-500/60"></div>

                                    <div className="flex flex-col items-center text-center mb-4">
                                        <div className="p-3 bg-yellow-500/10 rounded-full border border-yellow-500/30 mb-3">
                                            <AlertCircle className="h-8 w-8 text-yellow-500" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white">Información requerida</h3>
                                        <p className="text-gray-400 mt-2">
                                            Por favor complete el área del director/jefe de área seleccionado
                                        </p>
                                    </div>

                                    <div className="space-y-5 mt-6">
                                        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">Director/Jefe seleccionado</label>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-800 rounded-lg">
                                                    <User className="h-4 w-4 text-yellow-400" />
                                                </div>
                                                <span className="text-white font-medium">{incompleteDirector?.nombre || 'Director'}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                                                <LayoutGrid className="h-4 w-4 text-gray-400" />
                                                Área
                                            </label>
                                            <input
                                                type="text"
                                                value={directorFormData.area}
                                                onChange={(e) => setDirectorFormData({ area: e.target.value })}
                                                placeholder="Ej: Administración, Recursos Humanos, Contabilidad..."
                                                className="block w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-colors"
                                                required
                                            />
                                            {!directorFormData.area && (
                                                <p className="text-xs text-yellow-500/80 mt-2 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    Este campo es obligatorio
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
                                        disabled={savingDirector || !directorFormData.area}
                                        className={`px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all duration-300 
                                            ${savingDirector || !directorFormData.area ?
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

                    {/* Modal de selección de área para directores con varias áreas */}
                    {showAreaSelectModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                            <div className="bg-black border border-blue-600/30 rounded-2xl shadow-2xl min-w-[360px] max-w-md w-full relative animate-fadeIn overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/60 via-blue-400 to-blue-500/60"></div>
                                <div className="p-6 relative">
                                    <button
                                        onClick={() => setShowAreaSelectModal(false)}
                                        className="absolute top-2 right-2 text-gray-400 hover:text-white p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        title="Cerrar selección de área"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                    <div className="flex flex-col items-center text-center mb-4">
                                        <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/30 mb-3">
                                            <LayoutGrid className="h-8 w-8 text-blue-400" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white">Seleccione el área correspondiente</h3>
                                        <p className="text-gray-400 mt-2">El director/jefe seleccionado tiene varias áreas asignadas. Elija una para continuar.</p>
                                    </div>
                                    <div className="flex flex-col gap-3 mt-4">
                                        {areaOptionsForDirector.map((area, idx) => (
                                            <button
                                                key={idx}
                                                className="w-full px-4 py-2.5 rounded-lg bg-gray-900/70 border border-gray-800 text-gray-200 hover:border-blue-500 hover:bg-gray-900 hover:text-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-medium"
                                                onClick={() => {
                                                    if (editFormData) {
                                                        setEditFormData(prev => ({
                                                            ...prev!,
                                                            usufinal: incompleteDirector?.nombre || '',
                                                            area
                                                        }));
                                                    } else if (selectedItem) {
                                                        setSelectedItem(prev => ({
                                                            ...prev!,
                                                            usufinal: incompleteDirector?.nombre || '',
                                                            area
                                                        }));
                                                    }
                                                    setShowAreaSelectModal(false);
                                                }}
                                            >
                                                {area}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal de confirmación para reactivar */}
                    {showReactivarModal && selectedItem && (
                        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 animate-fadeIn">
                            <div className="bg-black rounded-2xl shadow-2xl border border-green-600/30 w-full max-w-md overflow-hidden transition-all duration-300 transform">
                                <div className="relative p-6 bg-gradient-to-b from-black to-gray-900">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500/60 via-green-400 to-green-500/60"></div>
                                    <div className="flex flex-col items-center text-center mb-4">
                                        <div className="p-3 bg-green-500/10 rounded-full border border-green-500/30 mb-3">
                                            <RotateCw className="h-8 w-8 text-green-500" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white">¿Reactivar este artículo?</h3>
                                        <p className="text-gray-400 mt-2">El artículo volverá a estar <span className="text-green-400 font-semibold">ACTIVO</span> en el inventario.</p>
                                    </div>
                                    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 mb-4 text-left text-sm text-gray-300">
                                        <div><span className="font-bold text-white">ID:</span> {selectedItem.id_inv}</div>
                                        <div><span className="font-bold text-white">Descripción:</span> {selectedItem.descripcion}</div>
                                        <div><span className="font-bold text-white">Área:</span> {selectedItem.area}</div>
                                    </div>
                                </div>
                                <div className="p-5 bg-black border-t border-gray-800 flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowReactivarModal(false)}
                                        className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 border border-gray-800 transition-colors flex items-center gap-2"
                                        disabled={reactivating}
                                    >
                                        <X className="h-4 w-4" />
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={reactivarArticulo}
                                        disabled={reactivating}
                                        className={`px-5 py-2.5 bg-green-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-green-800 border border-green-700 transition-colors ${reactivating ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    >
                                        {reactivating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                                        {reactivating ? 'Reactivando...' : 'Reactivar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}