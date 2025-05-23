"use client"
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Search, RefreshCw, ChevronLeft, ChevronRight,
    ArrowUpDown, AlertCircle, X, Save, Trash2, Check,
    LayoutGrid, ChevronDown, Building2, FileText, User, Shield, AlertTriangle, Calendar, Info, Edit, Receipt, ClipboardList, Store, CheckCircle, XCircle, Plus, Clock, DollarSign
} from 'lucide-react';
import supabase from '@/app/lib/supabase/client';
import Cookies from 'js-cookie';
import { useUserRole } from "@/hooks/useUserRole";
import RoleGuard from "@/components/roleGuard";
import { useNotifications } from '@/hooks/useNotifications';

// Utility function to format date strings as 'DD/MM/YYYY'
function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

interface Mueble {
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
    formasAdq: string[];
    directores: { nombre: string; area: string }[];
}

interface Area {
    id_area: number;
    nombre: string;
}

interface Directorio {
    id_directorio: number;
    nombre: string | null;
    area: string | null;
    puesto: string | null;
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
                    .from('muebles.itea')
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

// --- OMNIBOX FILTER STATE ---
interface ActiveFilter {
    term: string;
    type: 'id' | 'descripcion' | 'rubro' | 'estado' | 'estatus' | 'area' | 'usufinal' | 'resguardante' | null;
}

export default function ConsultasIteaGeneral() {
    const [muebles, setMuebles] = useState<Mueble[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchMatchType, setSearchMatchType] = useState<ActiveFilter['type']>(null);
    const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
    const [sortField, setSortField] = useState<keyof Mueble>('id_inv');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        estados: [],
        estatus: [],
        areas: [],
        rubros: [],
        formasAdq: [],
        directores: []
    });
    const [areas, setAreas] = useState<Area[]>([]);
    const [directores, setDirectores] = useState<Directorio[]>([]);
    const [selectedItem, setSelectedItem] = useState<Mueble | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState<Mueble | null>(null);
    const [showDirectorModal, setShowDirectorModal] = useState(false);
    const [incompleteDirector, setIncompleteDirector] = useState<Directorio | null>(null);
    const [directorFormData, setDirectorFormData] = useState({ area: '' });
    const [savingDirector, setSavingDirector] = useState(false);
    const [message, setMessage] = useState<Message | null>(null);
    const [showBajaModal, setShowBajaModal] = useState(false);
    const [bajaCause, setBajaCause] = useState('');
    const detailRef = useRef<HTMLDivElement>(null);
    const { createNotification } = useNotifications();

    // Estados para áreas y relaciones N:M
    const [directorAreasMap, setDirectorAreasMap] = useState<{ [id_directorio: number]: number[] }>({});
    const [showAreaSelectModal, setShowAreaSelectModal] = useState(false);
    const [areaOptionsForDirector, setAreaOptionsForDirector] = useState<{ id_area: number; nombre: string }[]>([]);
    const [, setSelectedAreaForDirector] = useState<{ id_area: number; nombre: string } | null>(null);

    // 1. Estado de filtros de tabla y memo
    const [filtersState] = useState({
        estado: '',
        estatus: '',
        area: '',
        rubro: ''
    });
    const filters = useMemo(() => filtersState, [filtersState.estado, filtersState.estatus, filtersState.area, filtersState.rubro]);

    // Cargar áreas y relaciones N:M al montar
    useEffect(() => {
        async function fetchAreasAndRelations() {
            // Cargar todas las áreas
            const { data: areasData } = await supabase.from('area').select('*').order('nombre');
            setAreas(areasData || []);
            // Cargar relaciones directorio_areas
            const { data: rels } = await supabase.from('directorio_areas').select('*');
            if (rels) {
                const map: { [id_directorio: number]: number[] } = {};
                rels.forEach((rel: { id_directorio: number, id_area: number }) => {
                    if (!map[rel.id_directorio]) map[rel.id_directorio] = [];
                    map[rel.id_directorio].push(rel.id_area);
                });
                setDirectorAreasMap(map);
            }
        }
        fetchAreasAndRelations();
    }, []);

    const fetchDirectores = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('directorio')
                .select('*')
                .order('nombre', { ascending: true });

            if (error) throw error;
            setDirectores(data || []);

            if (data) {
                const directores = data.map(item => ({
                    nombre: item.nombre?.trim().toUpperCase() || '',
                    area: item.area?.trim().toUpperCase() || ''
                }));

                setFilterOptions(prev => ({
                    ...prev,
                    directores: directores
                }));
            }
        } catch (error) {
            console.error('Error fetching directores:', error);
            setMessage({
                type: 'error',
                text: 'Error al cargar la lista de directores'
            });
        }
    }, []);

    const fetchFilterOptions = useCallback(async () => {
        try {
            // Obtener estados desde mueblesitea (se mantiene igual)
            const { data: estados } = await supabase
                .from('mueblesitea')
                .select('estado')
                .filter('estado', 'not.is', null)
                .limit(1000);

            // Obtener rubros desde config
            const { data: rubros } = await supabase
                .from('config')
                .select('concepto')
                .eq('tipo', 'rubro');

            // Obtener estatus desde config
            const { data: estatus } = await supabase
                .from('config')
                .select('concepto')
                .eq('tipo', 'estatus');

            // Obtener formas de adquisición desde config
            const { data: formasAdq } = await supabase
                .from('config')
                .select('concepto')
                .eq('tipo', 'formadq');

            setFilterOptions(prev => ({
                ...prev,
                estados: [...new Set(estados?.map(item => item.estado?.trim()).filter(Boolean))] as string[],
                rubros: rubros?.map(item => item.concepto?.trim()).filter(Boolean) || [],
                estatus: estatus?.map(item => item.concepto?.trim()).filter(Boolean) || [],
                formasAdq: formasAdq?.map(item => item.concepto?.trim()).filter(Boolean) || []
            }));
        } catch (error) {
            console.error('Error al cargar opciones de filtro:', error);
        }
    }, []);

    // Modificar handleSelectDirector para lógica N:M
    const handleSelectDirector = (nombre: string) => {
        const selected = directores.find(d => d.nombre === nombre);
        if (!selected) return;
        // Obtener áreas N:M del director
        const areaIds = directorAreasMap[selected.id_directorio] || [];
        const areasForDirector = areas.filter(a => areaIds.includes(a.id_area));
        // Si no tiene áreas, mostrar modal de info faltante
        if (areasForDirector.length === 0) {
            setIncompleteDirector(selected);
            setDirectorFormData({ area: '' });
            setShowDirectorModal(true);
            return;
        }
        // Si tiene más de una área, mostrar modal de selección
        if (areasForDirector.length > 1) {
            setAreaOptionsForDirector(areasForDirector);
            setSelectedAreaForDirector(null);
            setIncompleteDirector(selected); // por si se requiere
            setShowAreaSelectModal(true);
            return;
        }
        // Si solo tiene una área, asignar directo
        if (editFormData) {
            setEditFormData(prev => ({
                ...prev!,
                usufinal: nombre,
                area: areasForDirector[0].nombre
            }));
        } else if (selectedItem) {
            setSelectedItem(prev => ({
                ...prev!,
                usufinal: nombre,
                area: areasForDirector[0].nombre
            }));
        }
    };

    const saveDirectorInfo = async () => {
        if (!incompleteDirector || !directorFormData.area) return;

        setSavingDirector(true);
        try {
            const { error: updateError } = await supabase
                .from('directorio')
                .update({
                    area: directorFormData.area
                })
                .eq('id_directorio', incompleteDirector.id_directorio);

            if (updateError) throw updateError;

            const updatedDirectores = directores.map(d =>
                d.id_directorio === incompleteDirector.id_directorio
                    ? { ...d, area: directorFormData.area }
                    : d
            );

            setDirectores(updatedDirectores);

            const updatedDirectoresList = updatedDirectores.map(item => ({
                nombre: item.nombre?.trim().toUpperCase() || '',
                area: item.area?.trim().toUpperCase() || ''
            }));

            setFilterOptions(prev => ({
                ...prev,
                directores: updatedDirectoresList
            }));

            if (editFormData) {
                setEditFormData(prev => ({
                    ...prev!,
                    usufinal: incompleteDirector.nombre ?? '',
                    area: directorFormData.area
                }));
            } else if (selectedItem) {
                setSelectedItem(prev => ({
                    ...prev!,
                    usufinal: incompleteDirector.nombre ?? '',
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

    // Reemplaza fetchMuebles para traer todos los muebles sin paginación y sin límite de 1000
    const fetchMuebles = useCallback(async () => {
        setLoading(true);
        try {
            let allData: Mueble[] = [];
            let from = 0;
            const batchSize = 1000;
            let keepFetching = true;
            while (keepFetching) {
                const { data, error } = await supabase
                    .from('mueblesitea')
                    .select('*')
                    .range(from, from + batchSize - 1);
                if (error) throw error;
                if (data && data.length > 0) {
                    allData = allData.concat(data as Mueble[]);
                    if (data.length < batchSize) {
                        keepFetching = false;
                    } else {
                        from += batchSize;
                    }
                } else {
                    keepFetching = false;
                }
            }
            setMuebles(allData);
            setError(null);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Error al cargar los datos. Por favor, intente nuevamente.');
            setMuebles([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const uploadImage = async (muebleId: number) => {
        if (!imageFile) return null;

        try {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${muebleId}/image.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('muebles.itea')
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
        fetchDirectores();
        fetchFilterOptions();
        fetchMuebles();
    }, [fetchDirectores, fetchFilterOptions, fetchMuebles]);

    // 2. useEffect para resetear página igual que inea
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filters, sortField, sortDirection, rowsPerPage]);

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
        // Normalizar rubro al valor exacto de las opciones
        let normalizedRubro = '';
        if (selectedItem.rubro) {
            const match = filterOptions.rubros.find(
                r => r.trim().toUpperCase() === selectedItem.rubro!.trim().toUpperCase()
            );
            normalizedRubro = match || '';
        }
        setIsEditing(true);
        setEditFormData({ ...selectedItem, rubro: normalizedRubro });
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

            // Notificación de edición
            await createNotification({
                title: `Artículo editado (ID: ${editFormData.id_inv})`,
                description: `El artículo "${editFormData.descripcion}" fue editado. Cambios guardados por el usuario current.`,
                type: 'info',
                category: 'inventario',
                device: 'web',
                importance: 'medium',
                data: { changes: [`Edición de artículo: ${editFormData.id_inv}`], affectedTables: ['mueblesitea'] }
            });

            fetchMuebles();
            setSelectedItem({ ...editFormData, image_path: imagePath });
            setIsEditing(false);
            setEditFormData(null);
            setImageFile(null);
            setImagePreview(null);
        } catch (error) {
            console.error('Error al guardar cambios:', error);
            setError('Error al guardar los cambios. Por favor, intente nuevamente.');

            // Notificación de error
            await createNotification({
                title: 'Error al editar artículo',
                description: 'Error al guardar los cambios en el artículo.',
                type: 'danger',
                category: 'inventario',
                device: 'web',
                importance: 'high',
                data: { affectedTables: ['mueblesitea'] }
            });
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
                .from('mueblesitea')
                .update({ estatus: 'INACTIVO' })
                .eq('id', selectedItem.id);

            if (error) throw error;

            // Notificación de inactivación
            await createNotification({
                title: `Artículo marcado como INACTIVO (ID: ${selectedItem.id_inv})`,
                description: `El artículo "${selectedItem.descripcion}" fue marcado como INACTIVO por el usuario current.`,
                type: 'warning',
                category: 'inventario',
                device: 'web',
                importance: 'medium',
                data: { changes: [`Inactivación de artículo: ${selectedItem.id_inv}`], affectedTables: ['mueblesitea'] }
            });

            fetchMuebles();
            setSelectedItem(null);
        } catch (error) {
            console.error('Error al marcar como inactivo:', error);
            setError('Error al cambiar el estatus. Por favor, intente nuevamente.');

            // Notificación de error
            await createNotification({
                title: 'Error al marcar como INACTIVO',
                description: 'Error al cambiar el estatus del artículo.',
                type: 'danger',
                category: 'inventario',
                device: 'web',
                importance: 'high',
                data: { affectedTables: ['mueblesitea'] }
            });
        } finally {
            setLoading(false);
        }
    };

    const markAsBaja = async () => {
        if (!selectedItem) return;
        setShowBajaModal(true);
    };

    const confirmBaja = async () => {
        if (!selectedItem || !bajaCause) return;
        setShowBajaModal(false);
        setLoading(true);
        try {
            const today = '2025-04-27'; // Fecha actual
            const { error } = await supabase
                .from('mueblesitea')
                .update({ estatus: 'BAJA', causadebaja: bajaCause, fechabaja: today })
                .eq('id', selectedItem.id);
            if (error) throw error;

            // Obtener nombre completo del usuario desde la cookie userData
            let createdBy = 'SISTEMA';
            try {
                const userData = Cookies.get('userData');
                if (userData) {
                    const parsed = JSON.parse(userData);
                    if (parsed.firstName && parsed.lastName) {
                        createdBy = `${parsed.firstName} ${parsed.lastName}`;
                    }
                }
            } catch { }

            await supabase.from('deprecated').insert({
                id_inv: selectedItem.id_inv || '',
                descripcion: selectedItem.descripcion || '',
                area: selectedItem.area || '',
                created_by: createdBy,
                motive: bajaCause
            });

            // Notificación de baja
            await createNotification({
                title: `Artículo dado de baja (ID: ${selectedItem.id_inv})`,
                description: `El artículo "${selectedItem.descripcion}" fue dado de baja. Motivo: ${bajaCause}.`,
                type: 'danger',
                category: 'inventario',
                device: 'web',
                importance: 'high',
                data: { changes: [`Baja de artículo: ${selectedItem.id_inv}`], affectedTables: ['mueblesitea', 'deprecated'] }
            });

            fetchMuebles();
            setSelectedItem(null);
            setMessage({ type: 'success', text: 'Artículo dado de baja correctamente' });
            setBajaCause('');
        } catch (error) {
            console.error('Error al dar de baja:', error);
            setMessage({ type: 'error', text: 'Error al dar de baja. Por favor, intente nuevamente.' });

            // Notificación de error
            await createNotification({
                title: 'Error al dar de baja artículo',
                description: 'Error al dar de baja el artículo.',
                type: 'danger',
                category: 'inventario',
                device: 'web',
                importance: 'high',
                data: { affectedTables: ['mueblesitea', 'deprecated'] }
            });
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
                newData.id_inv = value;
                break;
            case 'valor':
                newData.valor = value;
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
                newData[field] = value || '';
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

    // Save current filter
    const saveCurrentFilter = () => {
        if (searchTerm && searchMatchType) {
            setActiveFilters(prev => [...prev, { term: searchTerm, type: searchMatchType }]);
            setSearchTerm('');
            setSearchMatchType(null);
        }
    };

    // Remove a filter
    const removeFilter = (index: number) => {
        setActiveFilters(prev => prev.filter((_, i) => i !== index));
    };

    // Remove all filters
    const clearAllFilters = () => {
        setActiveFilters([]);
        setSearchTerm('');
        setSearchMatchType(null);
    };

    // --- OMNIBOX MATCH TYPE DETECTION ---
    useEffect(() => {
        if (!searchTerm || muebles.length === 0) {
            setSearchMatchType(null);
            return;
        }
        const clean = (str: string) => (str || '').normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
        const term = clean(searchTerm);
        let bestMatch = { type: null, value: '', score: 0 } as { type: ActiveFilter['type'], value: string, score: number };
        for (const item of muebles) {
            // Usufinal/Resguardante
            if ((item.usufinal && clean(item.usufinal).includes(term)) || (item.resguardante && clean(item.resguardante).includes(term))) {
                const exact = clean(item.usufinal || '') === term || clean(item.resguardante || '') === term;
                const score = exact ? 10 : 9;
                if (score > bestMatch.score) bestMatch = { type: 'usufinal', value: item.usufinal || item.resguardante || '', score };
            }
            // Área
            if (item.area && clean(item.area).includes(term)) {
                const exact = clean(item.area) === term;
                const score = exact ? 8 : 7;
                if (score > bestMatch.score) bestMatch = { type: 'area', value: item.area, score };
            }
            // ID
            if (item.id_inv && clean(item.id_inv).includes(term)) {
                const exact = clean(item.id_inv) === term;
                const score = exact ? 6 : 5;
                if (score > bestMatch.score) bestMatch = { type: 'id', value: item.id_inv, score };
            }
            // Descripción
            if (item.descripcion && clean(item.descripcion).includes(term)) {
                const exact = clean(item.descripcion) === term;
                const score = exact ? 4 : 3;
                if (score > bestMatch.score) bestMatch = { type: 'descripcion', value: item.descripcion, score };
            }
            // Rubro
            if (item.rubro && clean(item.rubro).includes(term)) {
                const exact = clean(item.rubro) === term;
                const score = exact ? 2 : 1;
                if (score > bestMatch.score) bestMatch = { type: 'rubro', value: item.rubro, score };
            }
            // Estado
            if (item.estado && clean(item.estado).includes(term)) {
                const score = 1;
                if (score > bestMatch.score) bestMatch = { type: 'estado', value: item.estado, score };
            }
            // Estatus
            if (item.estatus && clean(item.estatus).includes(term)) {
                const score = 1;
                if (score > bestMatch.score) bestMatch = { type: 'estatus', value: item.estatus, score };
            }
            // All other fields (for completeness, but not used for filter chips)
            const otherFields: (keyof Mueble)[] = [
                'valor', 'f_adq', 'formadq', 'proveedor', 'factura', 'ubicacion_es', 'ubicacion_mu', 'ubicacion_no', 'fechabaja', 'causadebaja', 'image_path'
            ];
            for (const field of otherFields) {
                const val = item[field];
                if (typeof val === 'string' && clean(val).includes(term)) {
                    // Lower score for less relevant fields
                    if (bestMatch.score < 0.5) bestMatch = { type: null, value: val, score: 0.5 };
                }
            }
        }
        setSearchMatchType(bestMatch.type);
    }, [searchTerm, muebles]);

    // --- OMNIBOX FILTERING ---
    const clean = (str: string) => (str || '').normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    // 3. Filtrado de la tabla: aplica también los filtros de tabla (filters)
    const filteredMueblesOmni = muebles.filter(item => {
        // Filtros de tabla (igual que inea)
        if (filters.estado && clean(item.estado || '') !== clean(filters.estado)) return false;
        if (filters.estatus && clean(item.estatus || '') !== clean(filters.estatus)) return false;
        if (filters.area && clean(item.area || '') !== clean(filters.area)) return false;
        if (filters.rubro && clean(item.rubro || '') !== clean(filters.rubro)) return false;
        // Filtros omnibox
        if (activeFilters.length === 0 && !searchTerm) return true;
        const passesActiveFilters = activeFilters.every(filter => {
            const filterTerm = clean(filter.term);
            if (!filterTerm) return true;
            switch (filter.type) {
                case 'id': return clean(item.id_inv || '').includes(filterTerm);
                case 'descripcion': return clean(item.descripcion || '').includes(filterTerm);
                case 'rubro': return clean(item.rubro || '').includes(filterTerm);
                case 'estado': return clean(item.estado || '').includes(filterTerm);
                case 'estatus': return clean(item.estatus || '').includes(filterTerm);
                case 'area': return clean(item.area || '').includes(filterTerm);
                case 'usufinal': return clean(item.usufinal || '').includes(filterTerm);
                case 'resguardante': return clean(item.resguardante || '').includes(filterTerm);
                default: return true;
            }
        });
        const currentTerm = clean(searchTerm);
        const passesCurrentSearch = !currentTerm ||
            clean(item.id_inv || '').includes(currentTerm) ||
            clean(item.descripcion || '').includes(currentTerm) ||
            clean(item.rubro || '').includes(currentTerm) ||
            clean(item.estado || '').includes(currentTerm) ||
            clean(item.estatus || '').includes(currentTerm) ||
            clean(item.area || '').includes(currentTerm) ||
            clean(item.usufinal || '').includes(currentTerm) ||
            clean(item.resguardante || '').includes(currentTerm);
        return passesActiveFilters && passesCurrentSearch;
    });
    const totalCount = filteredMueblesOmni.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));
    const paginatedMuebles = filteredMueblesOmni
        .slice()
        .sort((a, b) => {
            const aValue = a[sortField] ?? '';
            const bValue = b[sortField] ?? '';
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        })
        .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    // Calcular totales directamente
    const filteredValue = filteredMueblesOmni.reduce((acc, item) => acc + (parseFloat(item.valor || '0') || 0), 0);
    const allValue = muebles.reduce((acc, item) => acc + (parseFloat(item.valor || '0') || 0), 0);

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

    const userRole = useUserRole();

    // Sorting logic for omnibox
    const handleSort = (field: keyof Mueble) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    // Pagination logic for omnibox
    const changePage = (page: number) => {
        if (page === currentPage) return;
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // --- OMNIBOX AUTOCOMPLETADO Y SUGERENCIAS ---
    const [suggestions, setSuggestions] = useState<{ value: string; type: ActiveFilter['type'] }[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function getTypeIcon(type: ActiveFilter['type']) {
        switch (type) {
            case 'id': return <span className="h-4 w-4 text-blue-400 font-bold">#</span>;
            case 'area': return <span className="h-4 w-4 text-purple-400 font-bold">A</span>;
            case 'usufinal': return <span className="h-4 w-4 text-amber-400 font-bold">D</span>;
            case 'resguardante': return <span className="h-4 w-4 text-cyan-400 font-bold">R</span>;
            case 'descripcion': return <span className="h-4 w-4 text-fuchsia-400 font-bold">Desc</span>;
            case 'rubro': return <span className="h-4 w-4 text-green-400 font-bold">Ru</span>;
            case 'estado': return <span className="h-4 w-4 text-cyan-400 font-bold">Edo</span>;
            case 'estatus': return <span className="h-4 w-4 text-pink-400 font-bold">Est</span>;
            default: return null;
        }
    }
    function getTypeLabel(type: ActiveFilter['type']) {
        switch (type) {
            case 'id': return 'ID';
            case 'area': return 'ÁREA';
            case 'usufinal': return 'DIRECTOR';
            case 'resguardante': return 'RESGUARDANTE';
            case 'descripcion': return 'DESCRIPCIÓN';
            case 'rubro': return 'RUBRO';
            case 'estado': return 'ESTADO';
            case 'estatus': return 'ESTATUS';
            default: return '';
        }
    }
    // Renderiza el dropdown como hijo del contenedor relativo
    function SuggestionDropdown() {
        if (!showSuggestions || suggestions.length === 0) return null;
        return (
            <ul
                id="omnibox-suggestions"
                role="listbox"
                title="Sugerencias de búsqueda"
                className={"absolute left-0 top-full w-full mt-1 animate-fadeInUp max-h-80 overflow-y-auto rounded-2xl shadow-2xl border border-neutral-800 bg-black/95 backdrop-blur-xl ring-1 ring-inset ring-neutral-900/60 transition-all duration-200 z-50"}
            >
                {suggestions.map((s, i) => {
                    const isSelected = highlightedIndex === i;
                    return (
                        <li
                            key={s.value + s.type}
                            role="option"
                            {...(isSelected && { 'aria-selected': 'true' })}
                            onMouseDown={() => handleSuggestionClick(i)}
                            className={`flex items-center gap-2 px-3 py-2 cursor-pointer select-none text-xs whitespace-normal break-words w-full ${isSelected ? 'bg-neutral-800/80 text-white' : 'text-neutral-300'} hover:bg-neutral-800/80`}
                        >
                            <span className="shrink-0">{getTypeIcon(s.type)}</span>
                            <span className="font-semibold whitespace-normal break-words w-full">{s.value}</span>
                            <span className="ml-auto text-[10px] text-neutral-400 font-mono">{getTypeLabel(s.type)}</span>
                        </li>
                    );
                })}
            </ul>
        );
    }
    function handleSuggestionClick(index: number) {
        const s = suggestions[index];
        if (!s) return;
        setActiveFilters(prev => [...prev, { term: s.value, type: s.type }]);
        setSearchTerm('');
        setSearchMatchType(null);
        setShowSuggestions(false);
    }
    function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (!showSuggestions || suggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(i => (i + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(i => (i - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
                handleSuggestionClick(highlightedIndex);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    }
    function handleInputBlur() {
        setTimeout(() => setShowSuggestions(false), 100);
    }
    // Generar sugerencias al escribir
    useEffect(() => {
        if (!searchTerm || !muebles.length) {
            setSuggestions([]);
            setShowSuggestions(false);
            setHighlightedIndex(-1);
            return;
        }
        const clean = (str: string) => (str || '').normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
        const term = clean(searchTerm);
        const seen = new Set<string>();
        const fields = [
            { type: 'id' as ActiveFilter['type'], label: 'ID' },
            { type: 'area' as ActiveFilter['type'], label: 'Área' },
            { type: 'usufinal' as ActiveFilter['type'], label: 'Director' },
            { type: 'resguardante' as ActiveFilter['type'], label: 'Resguardante' },
            { type: 'descripcion' as ActiveFilter['type'], label: 'Descripción' },
            { type: 'rubro' as ActiveFilter['type'], label: 'Rubro' },
            { type: 'estado' as ActiveFilter['type'], label: 'Estado' },
            { type: 'estatus' as ActiveFilter['type'], label: 'Estatus' },
        ];
        let allSuggestions: { value: string; type: ActiveFilter['type'] }[] = [];
        for (const f of fields) {
            let values: string[] = [];
            switch (f.type) {
                case 'id': values = muebles.map(m => m.id_inv || '').filter(Boolean) as string[]; break;
                case 'area': values = muebles.map(m => m.area || '').filter(Boolean) as string[]; break;
                case 'usufinal': values = muebles.map(m => m.usufinal || '').filter(Boolean) as string[]; break;
                case 'resguardante': values = muebles.map(m => m.resguardante || '').filter(Boolean) as string[]; break;
                case 'descripcion': values = muebles.map(m => m.descripcion || '').filter(Boolean) as string[]; break;
                case 'rubro': values = muebles.map(m => m.rubro || '').filter(Boolean) as string[]; break;
                case 'estado': values = muebles.map(m => m.estado || '').filter(Boolean) as string[]; break;
                case 'estatus': values = muebles.map(m => m.estatus || '').filter(Boolean) as string[]; break;
                default: values = [];
            }
            for (const v of values) {
                if (!v) continue;
                const vClean = clean(v);
                if (vClean.includes(term) && !seen.has(f.type + ':' + vClean)) {
                    allSuggestions.push({ value: v, type: f.type });
                    seen.add(f.type + ':' + vClean);
                }
            }
        }
        // Prioridad: exactos primero, luego parciales, máx 7
        allSuggestions = [
            ...allSuggestions.filter(s => clean(s.value) === term),
            ...allSuggestions.filter(s => clean(s.value) !== term)
        ].slice(0, 7);
        setSuggestions(allSuggestions);
        setShowSuggestions(allSuggestions.length > 0);
        setHighlightedIndex(allSuggestions.length > 0 ? 0 : -1);
    }, [searchTerm, muebles]);

    return (
        <div className="bg-black text-white min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
            {/* Notificación de mensaje */}
            {message && (
                <div className={`fixed top-6 right-6 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 animate-fadeIn ${message.type === 'success' ? 'bg-green-900/90 border border-green-700' :
                    message.type === 'error' ? 'bg-red-900/90 border border-red-700' :
                        message.type === 'warning' ? 'bg-yellow-900/90 border border-yellow-700' :
                            'bg-blue-900/90 border border-blue-700'}`}>
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
                <div className="bg-black p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 gap-2 sm:gap-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
                        <span className="mr-2 sm:mr-3 bg-gray-900 text-white p-1 sm:p-2 rounded-lg border border-gray-700 text-sm sm:text-base">INV</span>
                        Consulta de Inventario ITEA
                    </h1>
                    <p className="text-gray-400 text-sm sm:text-base">Vista general de todos los bienes registrados en el sistema.</p>
                </div>

                {/* Panel de valor total mejorado */}
                <div className="bg-gradient-to-b from-gray-900 via-black to-black p-8 border-b border-gray-800">
                    <div className="flex flex-col lg:flex-row justify-between items-stretch gap-6">
                        {/* Panel de valor total */}
                        <div className="flex-grow">
                            <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-950/30 via-purple-900/20 to-gray-900/30 p-6 rounded-2xl border border-indigo-800/30 hover:border-indigo-700/50 transition-all duration-500 hover:shadow-lg hover:shadow-indigo-500/10">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="flex items-start gap-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-xl"></div>
                                        <div className="relative p-4 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-xl border border-white/10 transform group-hover:scale-110 transition-all duration-500">
                                            <DollarSign className="h-8 w-8 text-white/90" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-sm font-medium text-gray-400 mb-1 group-hover:text-indigo-300 transition-colors">Valor Total del Inventario</h3>
                                        <div className="relative">
                                            <p className="text-4xl font-bold bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent group-hover:from-indigo-300 group-hover:via-purple-300 group-hover:to-pink-300 transition-all duration-500">
                                                ${(activeFilters.length > 0 || searchTerm ? filteredValue : allValue).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                            <div className="absolute -bottom-2 left-0 w-full h-px bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-pink-500/50"></div>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2 group-hover:text-gray-400 transition-colors">
                                            {activeFilters.length > 0 || searchTerm ? 'Valor de artículos filtrados' : 'Valor total de todos los artículos'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Panel de conteo */}
                        <div className="flex-shrink-0">
                            <div className="group bg-gradient-to-br from-emerald-950/30 via-teal-900/20 to-gray-900/30 p-6 rounded-2xl border border-emerald-800/30 hover:border-emerald-700/50 transition-all duration-500">
                                <div className="text-center">
                                    <p className="text-sm text-gray-400 mb-2 group-hover:text-emerald-300 transition-colors">Artículos Registrados</p>
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
                                        <span className="relative text-3xl font-bold bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:via-teal-300 group-hover:to-cyan-300 transition-all duration-500 px-6 py-3">
                                            {activeFilters.length > 0 || searchTerm ? filteredMueblesOmni.length : muebles.length}
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
                        {/* Panel de acciones y búsqueda omnibox */}
                        <div className="mb-6 bg-gradient-to-br from-gray-900/20 to-gray-900/40 p-4 rounded-xl border border-gray-800 shadow-inner hover:shadow-lg transition-shadow">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
                                <div className="flex-1 relative">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                onFocus={() => setShowSuggestions(suggestions.length > 0)}
                                                onBlur={handleInputBlur}
                                                onKeyDown={handleInputKeyDown}
                                                placeholder="Buscar por ID, descripción, área, director, etc."
                                                className="w-full px-4 py-2 rounded-lg bg-black border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                                            />
                                            <SuggestionDropdown />
                                        </div>
                                        <button
                                            onClick={saveCurrentFilter}
                                            disabled={!searchTerm || !searchMatchType}
                                            className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${searchTerm && searchMatchType
                                                    ? 'bg-blue-600 hover:bg-blue-700 border-blue-500 text-white'
                                                    : 'bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed'
                                                } transition-all duration-200 hover:scale-105`}
                                            title="Agregar filtro actual a la lista de filtros activos"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                    {/* Filtros guardados debajo de la barra de búsqueda */}
                                    {activeFilters.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2 w-full">
                                            {activeFilters.map((filter, index) => {
                                                // Colores por tipo de filtro
                                                let colorClass = '';
                                                switch (filter.type) {
                                                    case 'id': colorClass = 'from-blue-900/80 via-blue-800/80 to-blue-700/80 border-blue-700/60 text-blue-200'; break;
                                                    case 'area': colorClass = 'from-purple-900/80 via-purple-800/80 to-purple-700/80 border-purple-700/60 text-purple-200'; break;
                                                    case 'usufinal': colorClass = 'from-amber-900/80 via-amber-800/80 to-amber-700/80 border-amber-700/60 text-amber-200'; break;
                                                    case 'resguardante': colorClass = 'from-cyan-900/80 via-cyan-800/80 to-cyan-700/80 border-cyan-700/60 text-cyan-200'; break;
                                                    case 'descripcion': colorClass = 'from-fuchsia-900/80 via-fuchsia-800/80 to-fuchsia-700/80 border-fuchsia-700/60 text-fuchsia-200'; break;
                                                    case 'rubro': colorClass = 'from-green-900/80 via-green-800/80 to-green-700/80 border-green-700/60 text-green-200'; break;
                                                    case 'estado': colorClass = 'from-cyan-900/80 via-cyan-800/80 to-cyan-700/80 border-cyan-700/60 text-cyan-200'; break;
                                                    case 'estatus': colorClass = 'from-pink-900/80 via-pink-800/80 to-pink-700/80 border-pink-700/60 text-pink-200'; break;
                                                    default: colorClass = 'from-gray-800 via-gray-700 to-gray-900 border-gray-600 text-gray-300';
                                                }
                                                return (
                                                    <span
                                                        key={filter.term + filter.type + index}
                                                        className={`inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r ${colorClass} text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200 group`}
                                                    >
                                                        <span className="mr-2 font-bold uppercase tracking-wide text-[10px] opacity-80">{getTypeLabel(filter.type)}</span>
                                                        <span className="truncate max-w-[160px] md:max-w-[220px] lg:max-w-[320px] group-hover:max-w-none">{filter.term}</span>
                                                        <button
                                                            onClick={() => removeFilter(index)}
                                                            className="ml-2 opacity-80 hover:opacity-100 focus:outline-none"
                                                            title="Eliminar filtro"
                                                            tabIndex={-1}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                            {activeFilters.length > 1 && (
                                                <button
                                                    onClick={clearAllFilters}
                                                    className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 border border-gray-600 text-gray-300 text-xs font-semibold ml-2 hover:bg-gray-700/80 transition-all duration-200"
                                                    title="Limpiar todos los filtros"
                                                >
                                                    <X className="h-3 w-3 mr-1" /> Limpiar
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* Aquí puedes dejar el botón de actualizar y otros controles a la derecha si los tienes */}
                                <div className="flex items-center gap-2 mt-4 md:mt-0">
                                    <button
                                        onClick={fetchMuebles}
                                        className="px-4 py-2 rounded-lg border border-blue-700 bg-blue-900/80 text-blue-200 hover:bg-blue-800 hover:text-white transition-all duration-200 flex items-center gap-2 shadow-md"
                                        title="Actualizar datos"
                                    >
                                        <RefreshCw className="h-4 w-4 animate-spin-slow" />
                                        Actualizar
                                    </button>
                                </div>
                            </div>
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
                                    <tbody className="bg-black divide-y divide-gray-800">
                                        {loading ? (
                                            <tr className="h-96">
                                                <td colSpan={5} className="px-6 py-24 text-center text-gray-400">
                                                    <div className="flex flex-col items-center justify-center space-y-4">
                                                        <RefreshCw className="h-12 w-12 animate-spin text-gray-500" />
                                                        <p className="text-lg font-medium">Cargando datos...</p>
                                                        <p className="text-sm text-gray-500">Por favor espere mientras se cargan los registros de inventario</p>
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
                                        ) : paginatedMuebles.length === 0 ? (
                                            <tr className="h-96">
                                                <td colSpan={5} className="px-6 py-24 text-center text-gray-400">
                                                    <div className="flex flex-col items-center justify-center space-y-4">
                                                        <Search className="h-12 w-12 text-gray-500" />
                                                        <p className="text-lg font-medium">No se encontraron resultados</p>
                                                        {(searchTerm || activeFilters.length > 0) ? (
                                                            <>
                                                                <p className="text-sm text-gray-500 max-w-lg mx-auto">
                                                                    No hay elementos que coincidan con los criterios de búsqueda actuales
                                                                </p>
                                                                <button
                                                                    onClick={clearAllFilters}
                                                                    className="px-4 py-2 bg-gray-800 text-blue-400 rounded-md text-sm hover:bg-gray-700 transition-colores flex items-center gap-2"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                    Limpiar filtros
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <p className="text-sm text-gray-500">No hay registros disponibles en el inventario</p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedMuebles.map((item) => {
                                                const normalizedStatus = item.estatus?.trim();

                                                return (
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
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${normalizedStatus === 'ACTIVO' ? 'bg-green-900/70 text-green-200 border border-green-700' :
                                                                normalizedStatus === 'INACTIVO' ? 'bg-red-900/70 text-red-200 border border-red-700' :
                                                                    normalizedStatus === 'NO LOCALIZADO' ? 'bg-yellow-900/70 text-yellow-200 border border-yellow-700' :
                                                                        normalizedStatus === 'EN PROCESO DE BAJA' ? 'bg-purple-900/70 text-purple-200 border border-purple-700' :
                                                                            normalizedStatus?.startsWith('C.1./') || normalizedStatus?.startsWith('CIATLAX/') ?
                                                                                'bg-blue-900/70 text-blue-200 border border-blue-700' :
                                                                                'bg-gray-700 text-gray-300 border border-gray-600'
                                                                }`}>
                                                                {normalizedStatus === 'ACTIVO' && <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                                                                {normalizedStatus === 'INACTIVO' && <XCircle className="h-3.5 w-3.5 mr-1.5" />}
                                                                {normalizedStatus === 'NO LOCALIZADO' && <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />}
                                                                {normalizedStatus === 'EN PROCESO DE BAJA' && <Clock className="h-3.5 w-3.5 mr-1.5" />}
                                                                {(normalizedStatus?.startsWith('C.1./') || normalizedStatus?.startsWith('CIATLAX/')) &&
                                                                    <FileText className="h-3.5 w-3.5 mr-1.5" />}
                                                                {truncateText(normalizedStatus ?? null, 20)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginación (igual que INEA) */}
                            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mt-4 mb-3 px-2">
                                {/* Contador de registros con diseño mejorado */}
                                <div className="flex items-center gap-2 bg-neutral-900/50 px-4 py-2 rounded-xl border border-neutral-800 shadow-inner">
                                    {totalCount === 0 ? (
                                        <span className="text-neutral-400 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-neutral-500" />
                                            No hay registros para mostrar
                                        </span>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-neutral-300">Mostrando</span>
                                            <span className="px-2 py-0.5 rounded-lg bg-blue-900/30 text-blue-300 font-mono border border-blue-800/50">
                                                {((currentPage - 1) * rowsPerPage) + 1}–{Math.min(currentPage * rowsPerPage, totalCount)}
                                            </span>
                                            <span className="text-neutral-300">de</span>
                                            <span className="px-2 py-0.5 rounded-lg bg-neutral-900 text-neutral-300 font-mono border border-neutral-800">
                                                {totalCount}
                                            </span>
                                            <span className="text-neutral-400">registros</span>
                                            {/* Selector de filas por página */}
                                            <span className="ml-4 text-neutral-400">|</span>
                                            <label htmlFor="rows-per-page" className="ml-2 text-xs text-neutral-400">Filas por página:</label>
                                            <select
                                                id="rows-per-page"
                                                value={rowsPerPage}
                                                onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                                className="ml-1 px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-blue-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        >
                                            {[10, 20, 30, 50, 100].map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                        </div>
                                    )}
                                </div>
                                {/* Indicador de página actual con animación */}
                                {totalPages > 1 && (
                                    <div className="flex items-center gap-2 bg-neutral-900/50 px-4 py-2 rounded-xl border border-neutral-800 shadow-inner">
                                        <span className="text-neutral-400">Página</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="px-2.5 py-0.5 rounded-lg bg-blue-900/40 text-blue-300 font-mono font-bold border border-blue-700/50 min-w-[2rem] text-center transition-all duration-300 hover:scale-105 hover:bg-blue-900/60">
                                                {currentPage}
                                            </span>
                                            <span className="text-neutral-500">/</span>
                                            <span className="px-2.5 py-0.5 rounded-lg bg-neutral-900 text-neutral-400 font-mono min-w-[2rem] text-center border border-neutral-800">
                                                {totalPages}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Barra de paginación elegante y numerada */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-6 select-none">
                                    <button
                                        onClick={() => changePage(1)}
                                        disabled={currentPage === 1}
                                        className="px-2 py-1 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                        title="Primera página"
                                    >
                                        <ChevronLeft className="inline h-4 w-4 -mr-1" />
                                        <ChevronLeft className="inline h-4 w-4 -ml-2" />
                                    </button>
                                    <button
                                        onClick={() => changePage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-2 py-1 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                        title="Página anterior"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    {/* Botones numerados dinámicos */}
                                    {(() => {
                                        const pageButtons = [];
                                        const maxButtons = 5;
                                        let start = Math.max(1, currentPage - 2);
                                        let end = Math.min(totalPages, currentPage + 2);
                                        if (currentPage <= 3) {
                                            end = Math.min(totalPages, maxButtons);
                                        } else if (currentPage >= totalPages - 2) {
                                            start = Math.max(1, totalPages - maxButtons + 1);
                                        }
                                        if (start > 1) {
                                            pageButtons.push(
                                                <span key="start-ellipsis" className="px-2 text-neutral-500">...</span>
                                            );
                                        }
                                        for (let i = start; i <= end; i++) {
                                            pageButtons.push(
                                                <button
                                                    key={i}
                                                    onClick={() => changePage(i)}
                                                    className={`mx-0.5 px-3 py-1.5 rounded-lg border text-sm font-semibold transition
                                                    ${i === currentPage
                                                        ? 'bg-blue-900/80 text-blue-300 border-blue-700 shadow'
                                                        : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-blue-900/40 hover:text-blue-200 hover:border-blue-600'}
                                                `}
                                                    aria-current={i === currentPage ? 'page' : undefined}
                                                >
                                                    {i}
                                                </button>
                                            );
                                        }
                                        if (end < totalPages) {
                                            pageButtons.push(
                                                <span key="end-ellipsis" className="px-2 text-neutral-500">...</span>
                                            );
                                        }
                                        return pageButtons;
                                    })()}
                                    <button
                                        onClick={() => changePage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-2 py-1 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                        title="Página siguiente"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => changePage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="px-2 py-1 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                        title="Última página"
                                    >
                                        <ChevronRight className="inline h-4 w-4 -mr-2" />
                                        <ChevronRight className="inline h-4 w-4 -ml-1" />
                                    </button>
                                </div>
                            )}
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

                            <div className="flex-grow p-6 overflow-y-auto">
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
                                                        title="Seleccionar rubro"
                                                    >
                                                        <option value="">Seleccione un rubro</option>
                                                        {[...new Set(filterOptions.rubros)].map((rubro) => (
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
                                                        type="text"
                                                        value={editFormData?.valor || ''}
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
                                                <div className="relative">
                                                    <select
                                                        title='Seleccione la forma de adquisición'
                                                        value={editFormData?.formadq || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'formadq')}
                                                        className="appearance-none w-full bg-gray-800 border border-gray-700 rounded-lg pl-4 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    >
                                                        <option value="">Seleccione una forma</option>
                                                        {filterOptions.formasAdq.map((forma) => (
                                                            <option key={forma} value={forma}>{forma}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                                </div>
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
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                                                    <Building2 className="h-4 w-4 text-gray-400" />
                                                    Estado
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        title="Estado"
                                                        placeholder="Estado"
                                                        value={editFormData?.ubicacion_es || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'ubicacion_es')}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                                                    <Building2 className="h-4 w-4 text-gray-400" />
                                                    Municipio
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        title="Municipio"
                                                        placeholder="Municipio"
                                                        value={editFormData?.ubicacion_mu || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'ubicacion_mu')}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                                                    <Building2 className="h-4 w-4 text-gray-400" />
                                                    Nomenclatura
                                                </label>
                                                <div className="relative">
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
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Estado</label>
                                                <div className="relative">
                                                    <select
                                                        id="estado-select"
                                                        title="Seleccione el estado"
                                                        value={editFormData?.estado || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'estado')}
                                                        className="appearance-none w-full bg-gray-800 border border-gray-700 rounded-lg pl-4 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    >
                                                        <option value="">Seleccione un estado</option>
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
                                                        <option value="">Seleccione un estatus</option>
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
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Director/Jefe de Área</label>
                                                <div className="relative">
                                                    <select
                                                        title='Seleccione el Director/Jefe de Área'
                                                        name="usufinal"
                                                        value={editFormData?.usufinal || ''}
                                                        onChange={(e) => handleSelectDirector(e.target.value)}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-4 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                                    >
                                                        <option value="">Seleccionar Director/Jefe</option>
                                                        {directores.map((director) => (
                                                            <option key={director.id_directorio} value={director.nombre || ''}>{director.nombre}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-400 mb-2">Usuario Final</label>
                                                <div className="relative">
                                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        value={editFormData?.resguardante || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'resguardante')}
                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        title="Ingrese el Usuario Final"
                                                        placeholder="Ingrese el Usuario Final"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-4 pt-6 border-t border-gray-800">
                                            <button
                                                onClick={saveChanges}
                                                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-colores focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                            >
                                                <Save className="h-4 w-4" />
                                                Guardar Cambios
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="px-5 py-2.5 bg-gray-800 text-gray-300 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-700 transition-colores focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                            >
                                                <X className="h-4 w-4" />
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Sección de imagen en vista de detalles */}
                                        <div className="detail-card bg-gray-900/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all col-span-2">
                                            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">
                                                Fotografía del Bien
                                            </h3>
                                            <ImagePreview imagePath={selectedItem.image_path} />
                                        </div>
                                        {/* Sección de detalles del artículo */}
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className="detail-card bg-gray-900/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">ID Inventario</h3>
                                                <p className="mt-2 text-white font-medium">{selectedItem.id_inv}</p>
                                            </div>
                                            <div className="detail-card bg-gray-900/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Rubro</h3>
                                                <p className="mt-2 text-white font-medium">{selectedItem.rubro || 'No especificado'}</p>
                                            </div>
                                            <div className="detail-card bg-gray-900/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all col-span-2">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Descripción</h3>
                                                <p className="mt-2 text-white">{selectedItem.descripcion || 'No especificado'}</p>
                                            </div>
                                            <div className="detail-card bg-gray-900/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Valor</h3>
                                                <p className="mt-2 text-white font-medium">
                                                    {selectedItem.valor ? `$${selectedItem.valor}` : '$0.00'}
                                                </p>
                                            </div>
                                            <div className="detail-card bg-gray-900/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Fecha de Adquisición</h3>
                                                <p className="mt-2 text-white flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-blue-400" />
                                                    {formatDate(selectedItem.f_adq) || 'No especificado'}
                                                </p>
                                            </div>
                                            <div className="detail-card bg-gray-900/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Forma de Adquisición</h3>
                                                <p className="mt-2 text-white">{selectedItem.formadq || 'No especificado'}</p>
                                            </div>
                                            <div className="detail-card bg-gray-900/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Proveedor</h3>
                                                <p className="mt-2 text-white flex items-center gap-2">
                                                    <Store className="h-4 w-4 text-blue-400" />
                                                    {selectedItem.proveedor || 'No especificado'}
                                                </p>
                                            </div>
                                            <div className="detail-card bg-gray-900/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Factura</h3>
                                                <p className="mt-2 text-white flex items-center gap-2">
                                                    <Receipt className="h-4 w-4 text-blue-400" />
                                                    {selectedItem.factura || 'No especificado'}
                                                </p>
                                            </div>
                                            <div className="detail-card bg-gray-900/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Estado</h3>
                                                <p className="mt-2 text-white">{selectedItem.estado || 'No especificado'}</p>
                                            </div>
                                            <div className="detail-card bg-gray-900/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
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
                                            <div className="detail-card bg-gray-900/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all col-span-2">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Ubicación</h3>
                                                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    {selectedItem.ubicacion_es && (
                                                        <div className="flex items-center gap-2 bg-gray-800/60 p-2 rounded-md">
                                                            <Building2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                                            <span className="text-white">{selectedItem.ubicacion_es}</span>
                                                        </div>
                                                    )}
                                                    {selectedItem.ubicacion_mu && (
                                                        <div className="flex items-center gap-2 bg-gray-800/60 p-2 rounded-md">
                                                            <Building2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                                            <span className="text-white">{selectedItem.ubicacion_mu}</span>
                                                        </div>
                                                    )}
                                                    {selectedItem.ubicacion_no && (
                                                        <div className="flex items-center gap-2 bg-gray-800/60 p-2 rounded-md">
                                                            <Building2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                                            <span className="text-white">{selectedItem.ubicacion_no}</span>
                                                        </div>
                                                    )}
                                                    {!selectedItem.ubicacion_es && !selectedItem.ubicacion_mu && !selectedItem.ubicacion_no && (
                                                        <span className="text-gray-400">No especificado</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="detail-card bg-gray-900/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Área</h3>
                                                <p className="mt-2 text-white">{selectedItem.area || 'No especificado'}</p>
                                            </div>
                                            <div className="detail-card bg-gray-900/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Director/Jefe de Área</h3>
                                                <p className="mt-2 text-white flex items-center gap-2">
                                                    <User className="h-4 w-4 text-blue-400" />
                                                    {selectedItem.usufinal || 'No especificado'}
                                                </p>
                                            </div>
                                            <div className="detail-card bg-gray-900/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all">
                                                <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">Usuario Final</h3>
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
                                        <RoleGuard roles={["admin", "superadmin"]} userRole={userRole}>
                                            <div className="flex items-center space-x-4 pt-6 border-t border-gray-800">
                                                <button
                                                    onClick={handleStartEdit}
                                                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-colores focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={markAsInactive}
                                                    className="px-5 py-2.5 bg-yellow-500 text-black rounded-lg font-medium flex items-center gap-2 hover:bg-yellow-400 transition-colores focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                                >
                                                    <AlertTriangle className="h-4 w-4" />
                                                    Marcar como Inactivo
                                                </button>
                                                <button
                                                    onClick={markAsBaja}
                                                    className="px-5 py-2.5 bg-red-900 text-red-200 rounded-lg font-medium flex items-center gap-2 hover:bg-red-800 transition-colores focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Dar de Baja
                                                </button>
                                            </div>
                                        </RoleGuard>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

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
                                    <label className="text-xs uppercase tracking-wider text-gray-500 mb-1 block">Director/Jefe seleccionado</label>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-800 rounded-lg">
                                            <User className="h-4 w-4 text-yellow-400" />
                                        </div>
                                        <span className="text-white font-medium">{incompleteDirector?.nombre || 'Director'}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="flex text-sm font-medium text-gray-300 mb-2 gap-2">
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
                                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 border border-gray-800 transition-colores flex items-center gap-2"
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

            {/* Modal de selección de área */}
            {showAreaSelectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-black border border-gray-800 rounded-2xl shadow-2xl min-w-[360px] max-w-md w-full relative animate-fadeIn overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/60 via-blue-400 to-blue-500/60"></div>
                        <div className="p-6 relative">
                            <button
                                className="absolute top-3 right-3 p-1 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all duration-200"
                                onClick={() => setShowAreaSelectModal(false)}
                                aria-label="Cerrar"
                            >
                                ×
                            </button>
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/30 mb-3">
                                    <LayoutGrid className="h-8 w-8 text-blue-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Selecciona un área</h2>
                                <p className="text-gray-400 mt-2">
                                    Elige el área correspondiente para este artículo
                                </p>
                            </div>
                            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 mb-6">
                                <label className="text-xs uppercase tracking-wider text-gray-400 mb-2 block">Director asignado</label>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-800 rounded-lg">
                                        <User className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium">{incompleteDirector?.nombre}</span>
                                        <span className="text-sm text-gray-500">{incompleteDirector?.puesto || 'Sin puesto asignado'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-gray-400 block mb-3">Áreas disponibles</label>
                                {areaOptionsForDirector.map((area) => (
                                    <button
                                        key={area.id_area}
                                        className="w-full px-4 py-2.5 rounded-lg bg-gray-900/70 border border-gray-800 text-gray-200 hover:border-blue-500 hover:bg-gray-900 hover:text-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-medium"
                                        onClick={() => {
                                            if (editFormData) {
                                                setEditFormData(prev => ({
                                                    ...prev!,
                                                    usufinal: incompleteDirector?.nombre || '',
                                                    area: area.nombre
                                                }));
                                            } else if (selectedItem) {
                                                setSelectedItem(prev => ({
                                                    ...prev!,
                                                    usufinal: incompleteDirector?.nombre || '',
                                                    area: area.nombre
                                                }));
                                            }
                                            setShowAreaSelectModal(false);
                                        }}
                                    >
                                        {area.nombre}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación de baja */}
            {showBajaModal && selectedItem && (
                <>
                    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 animate-fadeIn">
                        <div className="bg-black rounded-2xl shadow-2xl border border-red-600/30 w-full max-w-md overflow-hidden transition-all duration-300 transform">
                            <div className="relative p-6 bg-gradient-to-b from-black to-gray-900">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/60 via-red-400 to-red-500/60"></div>
                                <div className="flex flex-col items-center text-center mb-4">
                                    <div className="p-3 bg-red-500/10 rounded-full border border-red-500/30 mb-3">
                                        <AlertTriangle className="h-8 w-8 text-red-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">¿Dar de baja este artículo?</h3>
                                </div>
                                {selectedItem && (
                                    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 mb-4">
                                        <div className="text-left text-sm text-gray-300">
                                            <div><span className="font-bold text-white">ID:</span> {selectedItem.id_inv}</div>
                                            <div><span className="font-bold text-white">Descripción:</span> {selectedItem.descripcion}</div>
                                            <div><span className="font-bold text-white">Área:</span> {selectedItem.area}</div>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                                        <Info className="h-4 w-4 text-gray-400" />
                                        Causa de Baja
                                    </label>
                                    <textarea
                                        value={bajaCause}
                                        onChange={(e) => setBajaCause(e.target.value)}
                                        placeholder="Ingrese la causa de baja"
                                        className="block w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colores"
                                        rows={3}
                                        required
                                    />
                                    {!bajaCause && (
                                        <div className="text-xs text-red-500/80 mt-2 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            Este campo es obligatorio
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-5 bg-black border-t border-gray-800 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowBajaModal(false)}
                                    className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 border border-gray-800 transition-colores flex items-center gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmBaja}
                                    disabled={!bajaCause}
                                    className={`px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all duration-300 
                                        ${!bajaCause ?
                                            'bg-gray-900 text-gray-500 cursor-not-allowed border border-gray-800' :
                                            'bg-gradient-to-r from-red-600 to-red-500 text-white font-medium hover:shadow-lg hover:shadow-red-500/20'}`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Dar de Baja
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}