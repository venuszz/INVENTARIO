"use client"
import { useState, useEffect, useRef, useCallback, useMemo, useDeferredValue } from 'react';
import {
    Search, RefreshCw, ChevronLeft, ChevronRight,
    ArrowUpDown, AlertCircle, X, Save, Trash2, LayoutGrid, ChevronDown, Building2, User, Shield, AlertTriangle, Calendar, Info, Edit, Receipt, ClipboardList, Store, CheckCircle, XCircle, Plus, DollarSign, BadgeCheck, Archive, FileWarning
} from 'lucide-react';
import supabase from '@/app/lib/supabase/client';
import Cookies from 'js-cookie';
import { useUserRole } from "@/hooks/useUserRole";
import RoleGuard from "@/components/roleGuard";
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/context/ThemeContext';
import { useIneaIndexation } from '@/context/IneaIndexationContext';
import { useRouter, useSearchParams } from 'next/navigation';

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
    rubros: string[] | null;
    formadq: string[] | null;
    directores: { nombre: string; area: string }[];
}

interface Directorio {
    id_directorio: number;
    nombre: string;
    area: string | null;
    puesto: string | null;
}

interface Message {
    type: 'success' | 'error' | 'info' | 'warning';
    text: string;
}

// --- OMNIBOX FILTER STATE ---
interface ActiveFilter {
    term: string;
    type: 'id' | 'descripcion' | 'rubro' | 'estado' | 'estatus' | 'area' | 'usufinal' | 'resguardante' | null;
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

// Función para generar color HSL único y consistente a partir de un string
function stringToHslColor(str: string, s = 60, l = 30) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, ${s}%, ${l}%)`;
}
function getStatusBadgeColors(status: string | null | undefined) {
    if (!status) return {
        bg: 'bg-gray-700',
        border: 'border-gray-600',
        text: 'text-gray-300',
        style: {}
    };
    const bg = stringToHslColor(status, 60, 22);
    const border = stringToHslColor(status, 60, 32);
    // Contraste: si el color es "oscuro" (l<30), texto claro, si no, texto oscuro
    const l = 22;
    const text = l < 30 ? 'text-white' : 'text-black';
    return {
        bg: '',
        border: '',
        text,
        style: { backgroundColor: bg, borderColor: border }
    };
}

export default function ConsultasNoListadoGeneral() {
    // Usar el contexto de indexación en lugar de estado local
    const { data: muebles, isIndexing, reindex } = useIneaIndexation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const loading = isIndexing;
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchMatchType, setSearchMatchType] = useState<ActiveFilter['type']>(null);
    const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
    const [suggestions, setSuggestions] = useState<{ value: string; type: ActiveFilter['type'] }[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [sortField, setSortField] = useState<keyof Mueble>('id_inv');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [filtersState, setFiltersState] = useState({
        estado: '',
        estatus: '',
        area: '',
        rubro: ''
    });
    const filters = useMemo(() => filtersState, [filtersState]);
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        estados: [],
        estatus: [],
        areas: [],
        rubros: [],
        formadq: [],
        directores: []
    });
    const [, setUniqueFilterOptions] = useState<{
        estados: string[];
        estatus: string[];
        areas: string[];
        rubros: string[];
    }>({
        estados: [],
        estatus: [],
        areas: [],
        rubros: []
    });
    const [selectedItem, setSelectedItem] = useState<Mueble | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState<Mueble | null>(null);
    const [message, setMessage] = useState<Message | null>(null);

    // Defer search term to avoid blocking input
    const deferredSearchTerm = useDeferredValue(searchTerm);

    // Pre-calculate searchable vectors to avoid mapping on every keystroke
    const searchableData = useMemo(() => {
        if (!muebles || muebles.length === 0) return null;
        return {
            id: muebles.map(m => m.id_inv || '').filter(Boolean),
            area: muebles.map(m => m.area || '').filter(Boolean),
            usufinal: muebles.map(m => m.usufinal || '').filter(Boolean),
            resguardante: muebles.map(m => m.resguardante || '').filter(Boolean),
            descripcion: muebles.map(m => m.descripcion || '').filter(Boolean),
            rubro: muebles.map(m => m.rubro || '').filter(Boolean),
            estado: muebles.map(m => m.estado || '').filter(Boolean),
            estatus: muebles.map(m => m.estatus || '').filter(Boolean),
        };
    }, [muebles]);

    // Estados para el modal del director
    const [showDirectorModal, setShowDirectorModal] = useState(false);
    const [incompleteDirector, setIncompleteDirector] = useState<Directorio | null>(null);
    const [directorFormData, setDirectorFormData] = useState({ area: '' });
    const [savingDirector, setSavingDirector] = useState(false);
    const [directorio, setDirectorio] = useState<Directorio[]>([]);

    const [showBajaModal, setShowBajaModal] = useState(false);
    const [bajaCause, setBajaCause] = useState('');
    const [showInactiveModal, setShowInactiveModal] = useState(false);

    const detailRef = useRef<HTMLDivElement>(null);

    const { createNotification } = useNotifications();
    const { isDarkMode } = useTheme();

    // Estados para áreas y relaciones N:M
    const [areas, setAreas] = useState<{ id_area: number; nombre: string }[]>([]);
    const [directorAreasMap, setDirectorAreasMap] = useState<{ [id_directorio: number]: number[] }>({});
    const [showAreaSelectModal, setShowAreaSelectModal] = useState(false);
    const [areaOptionsForDirector, setAreaOptionsForDirector] = useState<{ id_area: number; nombre: string }[]>([]);
    const [, setSelectedAreaForDirector] = useState<{ id_area: number; nombre: string } | null>(null);

    // 1. Estado para folios de resguardo y detalles
    interface ResguardoDetalle {
        folio: string;
        f_resguardo: string;
        area_resguardo: string | null;
        dir_area: string;
        puesto: string;
        origen: string;
        usufinal: string | null;
        descripcion: string;
        rubro: string;
        condicion: string;
        created_by: string;
    }
    const [foliosResguardo, setFoliosResguardo] = useState<{ [id_inv: string]: string | null }>({});
    const [resguardoDetalles, setResguardoDetalles] = useState<{ [folio: string]: ResguardoDetalle }>({});

    // Cargar áreas y relaciones N:M al montar
    useEffect(() => {
        async function fetchAreasAndRelations() {
            const { data: areasData } = await supabase.from('area').select('*').order('nombre');
            setAreas(areasData || []);
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

    // Función para obtener el directorio
    const fetchDirectorio = useCallback(async () => {
        try {
            const { data: directorioData, error } = await supabase.from('directorio').select('*');
            if (error) throw error;

            setDirectorio(directorioData || []);

            // Actualizar la lista de directores en filterOptions
            if (directorioData) {
                const directores = directorioData.map(item => ({
                    nombre: item.nombre?.trim().toUpperCase() || '',
                    area: item.area?.trim().toUpperCase() || ''
                }));

                setFilterOptions(prev => ({
                    ...prev,
                    directores: directores
                }));
            }
        } catch (err) {
            console.error('Error al cargar directorio:', err);
            setMessage({
                type: 'error',
                text: 'Error al cargar la lista de directores'
            });
        }
    }, []);

    // Nueva función para obtener valores únicos de filtros desde la tabla muebles
    const fetchUniqueFilterOptions = useCallback(async () => {
        try {
            // Traer todos los valores únicos de estado, estatus, área y rubro de la tabla muebles
            const { data, error } = await supabase
                .from('muebles')
                .select('estado, estatus, area, rubro');
            if (error) throw error;
            const estados = Array.from(new Set(data?.map(item => item.estado).filter(Boolean)));
            const estatus = Array.from(new Set(data?.map(item => item.estatus).filter(Boolean)));
            const areas = Array.from(new Set(data?.map(item => item.area).filter(Boolean)));
            const rubros = Array.from(new Set(data?.map(item => item.rubro).filter(Boolean)));
            setUniqueFilterOptions({
                estados,
                estatus,
                areas,
                rubros
            });
        } catch (error) {
            console.error('Error al cargar opciones únicas de filtro:', error);
        }
    }, []);

    // Función para manejar la selección del director/jefe de área
    const handleSelectDirector = (nombre: string) => {
        const selected = directorio.find(d => d.nombre === nombre);
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

    // Función para guardar la información del director
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

            // Actualizar estado local
            const updatedDirectorio = directorio.map(d =>
                d.id_directorio === incompleteDirector.id_directorio
                    ? { ...d, area: directorFormData.area }
                    : d
            );

            setDirectorio(updatedDirectorio);

            // Actualizar filterOptions.directores
            const updatedDirectores = updatedDirectorio.map(item => ({
                nombre: item.nombre?.trim().toUpperCase() || '',
                area: item.area?.trim().toUpperCase() || ''
            }));

            setFilterOptions(prev => ({
                ...prev,
                directores: updatedDirectores
            }));

            // Actualizar el formulario o el item seleccionado
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

    const markAsBaja = async () => {
        if (!selectedItem) return;
        setShowBajaModal(true);
    };

    const confirmBaja = async () => {
        if (!selectedItem || !bajaCause) return;
        setShowBajaModal(false);
        try {
            // Obtener la fecha local en formato YYYY-MM-DD
            const todayDate = new Date();
            const today = todayDate.getFullYear() + '-' +
                String(todayDate.getMonth() + 1).padStart(2, '0') + '-' +
                String(todayDate.getDate()).padStart(2, '0');
            const { error } = await supabase
                .from('muebles')
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
                id_inv: selectedItem.id_inv,
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
                data: { changes: [`Baja de artículo: ${selectedItem.id_inv}`], affectedTables: ['muebles', 'deprecated'] }
            });

            // El contexto actualizará automáticamente via realtime
            setSelectedItem(null);
            setMessage({ type: 'success', text: 'Artículo dado de baja correctamente' });
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
                data: { affectedTables: ['muebles', 'deprecated'] }
            });
        }
    };

    // Los datos ahora se cargan automáticamente desde el contexto
    // Ya no necesitamos fetchMuebles, usamos reindex para refrescar manualmente

    const fetchFilterOptions = useCallback(async () => {
        try {
            // Obtener estados únicos (se mantiene igual)
            const { data: estados } = await supabase
                .from('muebles')
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

            // Obtener áreas desde la tabla areas (se mantiene igual)
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
        fetchFilterOptions(); // para selects de edición
        fetchUniqueFilterOptions(); // para filtros de la tabla
        // Los datos se cargan automáticamente desde el contexto al iniciar
    }, [fetchDirectorio, fetchFilterOptions, fetchUniqueFilterOptions]);

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

            // Notificación de edición
            await createNotification({
                title: `Artículo editado (ID: ${editFormData.id_inv})`,
                description: `El artículo "${editFormData.descripcion}" fue editado. Cambios guardados por el usuario actual.`,
                type: 'info',
                category: 'inventario',
                device: 'web',
                importance: 'medium',
                data: { changes: [`Edición de artículo: ${editFormData.id_inv}`], affectedTables: ['muebles'] }
            });

            // El contexto actualizará automáticamente via realtime
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
                title: 'Error al editar artículo',
                description: 'Error al guardar los cambios en el artículo.',
                type: 'danger',
                category: 'inventario',
                device: 'web',
                importance: 'high',
                data: { affectedTables: ['muebles'] }
            });
        } finally {
            setUploading(false);
        }
    };

    const markAsInactive = async () => {
        if (!selectedItem) return;
        setShowInactiveModal(true);
    };

    const confirmMarkAsInactive = async () => {
        if (!selectedItem) return;
        setShowInactiveModal(false);
        try {
            const { error } = await supabase
                .from('muebles')
                .update({ estatus: 'INACTIVO' })
                .eq('id', selectedItem.id);

            if (error) throw error;

            // Notificación de inactivación
            await createNotification({
                title: `Artículo marcado como INACTIVO (ID: ${selectedItem.id_inv})`,
                description: `El artículo "${selectedItem.descripcion}" fue marcado como INACTIVO por el usuario actual.`,
                type: 'warning',
                category: 'inventario',
                device: 'web',
                importance: 'medium',
                data: { changes: [`Inactivación de artículo: ${selectedItem.id_inv}`], affectedTables: ['muebles'] }
            });

            // El contexto actualizará automáticamente via realtime
            setSelectedItem(null);
            setMessage({
                type: 'success',
                text: 'Artículo marcado como INACTIVO correctamente'
            });
        } catch (error) {
            console.error('Error al marcar como inactivo:', error);
            setMessage({
                type: 'error',
                text: 'Error al cambiar el estatus. Por favor, intente nuevamente.'
            });
            // Notificación de error
            await createNotification({
                title: 'Error al marcar como INACTIVO',
                description: 'Error al cambiar el estatus del artículo.',
                type: 'danger',
                category: 'inventario',
                device: 'web',
                importance: 'high',
                data: { affectedTables: ['muebles'] }
            });
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
                newData.valor = value ? parseFloat(value) : null;
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
                newData[field] = value || null;
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
        // Limpiar el parámetro id de la URL
        const params = new URLSearchParams(searchParams.toString());
        params.delete('id');
        const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
        router.replace(newUrl);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFiltersState({
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

    const changePage = (page: number) => {
        if (page === currentPage) return;
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const getMainContainerClass = () => {
        return selectedItem
            ? "grid grid-cols-1 lg:grid-cols-2 gap-6 p-6"
            : "w-full p-6";
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

    // --- OMNIBOX MATCH TYPE DETECTION ---
    // --- OMNIBOX MATCH TYPE DETECTION ---
    useEffect(() => {
        if (!deferredSearchTerm || muebles.length === 0) {
            setSearchMatchType(null);
            return;
        }
        const term = deferredSearchTerm.toLowerCase().trim();
        let bestMatch = { type: null, value: '', score: 0 } as { type: ActiveFilter['type'], value: string, score: number };

        // Optimización: Iteración simple sin regex pesado
        for (const item of muebles) {
            if ((item.usufinal && (item.usufinal.toLowerCase().includes(term))) || (item.resguardante && item.resguardante.toLowerCase().includes(term))) {
                const exact = (item.usufinal?.toLowerCase() === term) || (item.resguardante?.toLowerCase() === term);
                const score = exact ? 10 : 9;
                if (score > bestMatch.score) bestMatch = { type: 'usufinal', value: item.usufinal || item.resguardante || '', score };
            }
            else if (item.area && item.area.toLowerCase().includes(term)) {
                const exact = item.area.toLowerCase() === term;
                const score = exact ? 8 : 7;
                if (score > bestMatch.score) bestMatch = { type: 'area', value: item.area, score };
            }
            else if (item.id_inv && item.id_inv.toLowerCase().includes(term)) {
                const exact = item.id_inv.toLowerCase() === term;
                const score = exact ? 6 : 5;
                if (score > bestMatch.score) bestMatch = { type: 'id', value: item.id_inv, score };
            }
            else if (item.descripcion && item.descripcion.toLowerCase().includes(term)) {
                const exact = item.descripcion.toLowerCase() === term;
                const score = exact ? 4 : 3;
                if (score > bestMatch.score) bestMatch = { type: 'descripcion', value: item.descripcion, score };
            }

            // Short-circuit si encontramos un match exacto de alta prioridad
            if (bestMatch.score >= 10) break;
        }
        setSearchMatchType(bestMatch.type);
    }, [deferredSearchTerm, muebles]);

    // --- OMNIBOX AUTOCOMPLETADO Y SUGERENCIAS ---
    function getTypeIcon(type: ActiveFilter['type']) {
        switch (type) {
            case 'id': return <span className="h-4 w-4 text-white/80 font-medium">#</span>;
            case 'area': return <span className="h-4 w-4 text-white/80 font-medium">A</span>;
            case 'usufinal': return <span className="h-4 w-4 text-white/80 font-medium">D</span>;
            case 'resguardante': return <span className="h-4 w-4 text-white/80 font-medium">R</span>;
            case 'descripcion': return <span className="h-4 w-4 text-white/80 font-medium">Desc</span>;
            case 'rubro': return <span className="h-4 w-4 text-white/80 font-medium">Ru</span>;
            case 'estado': return <span className="h-4 w-4 text-white/80 font-medium">Edo</span>;
            case 'estatus': return <span className="h-4 w-4 text-white/80 font-medium">Est</span>;
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
    function SuggestionDropdown() {
        if (!showSuggestions || suggestions.length === 0) return null;
        return (
            <ul
                id="omnibox-suggestions"
                role="listbox"
                title="Sugerencias de búsqueda"
                className={`absolute left-0 top-full w-full mt-1 animate-fadeInUp max-h-80 overflow-y-auto rounded-lg shadow-sm border backdrop-blur-xl transition-all duration-200 z-50 ${isDarkMode
                    ? 'border-white/10 bg-black/90'
                    : 'border-gray-200 bg-white/95'
                    }`}
            >
                {suggestions.map((s, i) => {
                    const isSelected = highlightedIndex === i;
                    return (
                        <li
                            key={s.value + s.type}
                            role="option"
                            {...(isSelected && { 'aria-selected': 'true' })}
                            onMouseDown={() => handleSuggestionClick(i)}
                            className={`flex items-center gap-1.5 px-2 py-1 cursor-pointer select-none text-xs whitespace-normal break-words w-full transition-colors ${isSelected
                                ? (isDarkMode ? 'bg-white/5 text-white' : 'bg-blue-50 text-blue-900')
                                : (isDarkMode ? 'text-white/80 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50')
                                }`}
                        >
                            <span className={`shrink-0 ${isDarkMode ? 'text-white/70' : 'text-gray-600'
                                }`}>{getTypeIcon(s.type)}</span>
                            <span className="font-normal whitespace-normal break-words w-full truncate">{s.value}</span>
                            <span className={`ml-auto text-[10px] font-mono ${isDarkMode ? 'text-white/60' : 'text-gray-500'
                                }`}>{getTypeLabel(s.type)}</span>
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
    useEffect(() => {
        if (!deferredSearchTerm || !searchableData) {
            setSuggestions([]);
            setShowSuggestions(false);
            setHighlightedIndex(-1);
            return;
        }
        const term = deferredSearchTerm.toLowerCase().trim();
        if (term.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const seen = new Set<string>();
        const fields = [
            { type: 'id' as ActiveFilter['type'], label: 'ID', data: searchableData.id },
            { type: 'area' as ActiveFilter['type'], label: 'Área', data: searchableData.area },
            { type: 'usufinal' as ActiveFilter['type'], label: 'Director', data: searchableData.usufinal },
            { type: 'resguardante' as ActiveFilter['type'], label: 'Resguardante', data: searchableData.resguardante },
            { type: 'descripcion' as ActiveFilter['type'], label: 'Descripción', data: searchableData.descripcion },
            { type: 'rubro' as ActiveFilter['type'], label: 'Rubro', data: searchableData.rubro },
            { type: 'estado' as ActiveFilter['type'], label: 'Estado', data: searchableData.estado },
            { type: 'estatus' as ActiveFilter['type'], label: 'Estatus', data: searchableData.estatus },
        ];

        let allSuggestions: { value: string; type: ActiveFilter['type'] }[] = [];
        let count = 0;
        const maxSuggestions = 10;

        // Iterate fields efficiently
        for (const f of fields) {
            if (count >= maxSuggestions) break;

            for (const v of f.data) {
                const vLower = v.toLowerCase();
                if (vLower.includes(term)) {
                    // Create unique key
                    const key = f.type + ':' + vLower;
                    if (!seen.has(key)) {
                        allSuggestions.push({ value: v, type: f.type });
                        seen.add(key);
                        count++;
                        if (count >= maxSuggestions) break;
                    }
                }
            }
        }

        // Priorize exact matches
        allSuggestions.sort((a, b) => {
            const aStarts = a.value.toLowerCase().startsWith(term);
            const bStarts = b.value.toLowerCase().startsWith(term);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return 0;
        });

        setSuggestions(allSuggestions.slice(0, 7));
        setShowSuggestions(allSuggestions.length > 0);
        setHighlightedIndex(allSuggestions.length > 0 ? 0 : -1);
    }, [deferredSearchTerm, searchableData]);

    const saveCurrentFilter = () => {
        if (searchTerm && searchMatchType) {
            setActiveFilters(prev => [...prev, { term: searchTerm, type: searchMatchType }]);
            setSearchTerm('');
            setSearchMatchType(null);
        }
    };
    const removeFilter = (index: number) => {
        setActiveFilters(prev => prev.filter((_, i) => i !== index));
    };
    const clearAllFilters = () => {
        setActiveFilters([]);
        setSearchTerm('');
        setSearchMatchType(null);
    };

    // --- OMNIBOX FILTERING Y PAGINACIÓN ---
    const filteredMueblesOmni = useMemo(() => {
        const term = deferredSearchTerm.toLowerCase().trim();

        if (activeFilters.length === 0 && !term) return muebles;

        return muebles.filter(item => {
            // Verificar filtros activos
            const passesActiveFilters = activeFilters.every(filter => {
                const filterTerm = filter.term.toLowerCase();
                if (!filterTerm) return true;

                switch (filter.type) {
                    case 'id': return (item.id_inv?.toLowerCase() || '').includes(filterTerm);
                    case 'descripcion': return (item.descripcion?.toLowerCase() || '').includes(filterTerm);
                    case 'rubro': return (item.rubro?.toLowerCase() || '').includes(filterTerm);
                    case 'estado': return (item.estado?.toLowerCase() || '').includes(filterTerm);
                    case 'estatus': return (item.estatus?.toLowerCase() || '').includes(filterTerm);
                    case 'area': return (item.area?.toLowerCase() || '').includes(filterTerm);
                    case 'usufinal': return (item.usufinal?.toLowerCase() || '').includes(filterTerm);
                    case 'resguardante': return (item.resguardante?.toLowerCase() || '').includes(filterTerm);
                    default: return true;
                }
            });

            if (!passesActiveFilters) return false;

            // Búsqueda general estilo GlobalSearch (más eficiente)
            if (!term) return true;

            return (
                (item.id_inv?.toLowerCase() || '').includes(term) ||
                (item.descripcion?.toLowerCase() || '').includes(term) ||
                (item.rubro?.toLowerCase() || '').includes(term) ||
                (item.estado?.toLowerCase() || '').includes(term) ||
                (item.estatus?.toLowerCase() || '').includes(term) ||
                (item.area?.toLowerCase() || '').includes(term) ||
                (item.usufinal?.toLowerCase() || '').includes(term) ||
                (item.resguardante?.toLowerCase() || '').includes(term)
            );
        });
    }, [muebles, activeFilters, deferredSearchTerm]);
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

    // Detectar parámetro id en URL y abrir detalles automáticamente
    useEffect(() => {
        const idParam = searchParams.get('id');
        if (idParam && muebles.length > 0) {
            const itemId = parseInt(idParam, 10);
            const item = muebles.find(m => m.id === itemId);
            if (item) {
                setSelectedItem(item);
                setIsEditing(false);
                setEditFormData(null);

                // Calcular la página donde se encuentra el item
                // Primero, obtener la lista filtrada y ordenada (igual que en paginatedMuebles)
                const sortedFiltered = filteredMueblesOmni
                    .slice()
                    .sort((a, b) => {
                        const aValue = a[sortField] ?? '';
                        const bValue = b[sortField] ?? '';
                        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
                        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
                        return 0;
                    });

                // Encontrar el índice del item en la lista ordenada
                const itemIndex = sortedFiltered.findIndex(m => m.id === itemId);

                if (itemIndex !== -1) {
                    // Calcular la página basándose en el índice
                    const targetPage = Math.floor(itemIndex / rowsPerPage) + 1;
                    setCurrentPage(targetPage);
                }

                // Scroll al detalle si es necesario
                setTimeout(() => {
                    if (detailRef.current) {
                        detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 100);
            }
        }
    }, [searchParams, muebles, filteredMueblesOmni, sortField, sortDirection, rowsPerPage]);

    // Calcular totales directamente
    const filteredValue = filteredMueblesOmni.reduce((acc, item) => acc + (item.valor !== null && item.valor !== undefined ? Number(item.valor) : 0), 0);
    const allValue = muebles.reduce((acc, item) => acc + (item.valor !== null && item.valor !== undefined ? Number(item.valor) : 0), 0);

    // Fetch de resguardos y detalles (igual que ITEA)
    useEffect(() => {
        async function fetchFoliosYDetalles() {
            if (!muebles.length) return;
            const { data, error } = await supabase
                .from('resguardos')
                .select('*');
            if (!error && data) {
                const folioMap: { [id_inv: string]: string } = {};
                const detallesMap: { [folio: string]: ResguardoDetalle } = {};
                data.forEach(r => {
                    if (r.num_inventario && r.folio) {
                        folioMap[r.num_inventario] = r.folio;
                        if (!detallesMap[r.folio]) {
                            detallesMap[r.folio] = {
                                folio: r.folio,
                                f_resguardo: r.f_resguardo,
                                area_resguardo: r.area_resguardo,
                                dir_area: r.dir_area,
                                puesto: r.puesto,
                                origen: r.origen,
                                usufinal: r.usufinal,
                                descripcion: r.descripcion,
                                rubro: r.rubro,
                                condicion: r.condicion,
                                created_by: r.created_by
                            };
                        }
                    }
                });
                setFoliosResguardo(folioMap);
                setResguardoDetalles(detallesMap);
            } else {
                setFoliosResguardo({});
                setResguardoDetalles({});
            }
        }
        fetchFoliosYDetalles();
    }, [muebles]);

    // Skeleton para la tabla de inventario
    const TableSkeleton = () => (
        <tr>
            <td colSpan={6} className={`px-6 py-24 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                <div className="flex flex-col items-center justify-center space-y-4 animate-pulse">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex gap-4 w-full max-w-3xl mx-auto">
                            <div className={`h-6 w-24 rounded ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'
                                }`} />
                            <div className={`h-6 w-40 rounded ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'
                                }`} />
                            <div className={`h-6 w-32 rounded ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'
                                }`} />
                            <div className={`h-6 w-32 rounded ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'
                                }`} />
                            <div className={`h-6 w-28 rounded ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'
                                }`} />
                            <div className={`h-6 w-32 rounded ${isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'
                                }`} />
                        </div>
                    ))}
                </div>
            </td>
        </tr>
    );

    return (
        <div className={`h-full overflow-y-auto p-2 sm:p-4 md:p-6 lg:p-8 transition-colors duration-500 ${isDarkMode
            ? 'bg-black text-white'
            : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
            }`}>
            {/* Header con título */}
            <div className={`w-full mx-auto rounded-lg sm:rounded-xl shadow-2xl transition-all duration-500 transform border ${isDarkMode
                ? 'bg-black border-gray-800'
                : 'bg-white border-gray-200'
                }`}>
                <div className={`p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b gap-2 sm:gap-0 ${isDarkMode
                    ? 'bg-gradient-to-r from-black via-black to-amber-900/10 border-amber-800'
                    : 'bg-gradient-to-r from-amber-50 to-orange-50/50 border-gray-200'
                    }`}>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
                        <span className={`mr-2 sm:mr-3 p-1 sm:p-2 rounded-lg border text-sm sm:text-base shadow-lg hover:scale-105 transition-transform ${isDarkMode
                            ? 'bg-amber-900/30 text-amber-200 border-amber-800/50'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                            }`}>N/L</span>
                        <span className={`flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Inventario No Listado
                            <Archive className={`h-6 w-6 sm:h-8 sm:w-8 ${isDarkMode ? 'text-amber-500' : 'text-amber-600'}`} />
                        </span>
                    </h1>
                    <p className={`text-sm sm:text-base flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        <FileWarning className="h-4 w-4" />
                        Artículos no listados oficialmente en el inventario.
                    </p>
                </div>

                {/* Nuevo componente de valor total */}
                <div className={`p-8 border-b ${isDarkMode
                    ? 'bg-black border-gray-800'
                    : 'bg-gray-50/30 border-gray-200'
                    }`}>
                    <div className="flex flex-col lg:flex-row justify-between items-stretch gap-6">
                        {/* Panel de valor total */}
                        <div className="flex-grow">
                            <div className={`group relative overflow-hidden p-6 rounded-2xl border-2 transition-all duration-500 ${isDarkMode
                                ? 'bg-black border-white/10 hover:border-white/20'
                                : 'bg-white border-gray-200 hover:border-gray-300'
                                }`}>
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isDarkMode
                                    ? 'bg-white/5'
                                    : 'bg-gray-50'
                                    }`}></div>
                                <div className="flex items-start gap-6">
                                    <div className="relative">
                                        <div className={`absolute inset-0 blur-xl ${isDarkMode ? 'bg-white/10' : 'bg-gray-300/50'
                                            }`}></div>
                                        <div className={`relative p-4 rounded-xl border transform group-hover:scale-110 transition-all duration-500 ${isDarkMode
                                            ? 'bg-black border-white/10'
                                            : 'bg-amber-50 border-amber-200'
                                            }`}>
                                            <DollarSign className={`h-8 w-8 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'
                                                }`} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className={`text-sm font-medium mb-1 transition-colors ${isDarkMode
                                            ? 'text-gray-400 group-hover:text-white'
                                            : 'text-gray-600 group-hover:text-gray-900'
                                            }`}>Valor Estimado (No Listado)</h3>
                                        <div className="relative">
                                            <div className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                ${(activeFilters.length > 0 || searchTerm ? filteredValue : allValue).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                            <div className={`absolute -bottom-2 left-0 w-full h-px ${isDarkMode ? 'bg-white/30' : 'bg-gray-300'
                                                }`}></div>
                                        </div>
                                        <p className={`text-sm mt-2 transition-colors ${isDarkMode
                                            ? 'text-gray-500 group-hover:text-gray-400'
                                            : 'text-gray-600 group-hover:text-gray-700'
                                            }`}>
                                            {activeFilters.length > 0 || searchTerm ? 'Valor de artículos filtrados' : 'Valor total de todos los artículos'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Panel de conteo */}
                        <div className="flex-shrink-0">
                            <div className={`group p-6 rounded-2xl border transition-all duration-500 ${isDarkMode
                                ? 'bg-black/30 border-white/20 hover:border-white/40'
                                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                }`}>
                                <div className="text-center">
                                    <p className={`text-sm mb-2 transition-colors ${isDarkMode
                                        ? 'text-gray-400 group-hover:text-white'
                                        : 'text-gray-600 group-hover:text-gray-900'
                                        }`}>Artículos Registrados</p>
                                    <div className="relative">
                                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl ${isDarkMode
                                            ? 'bg-white/5'
                                            : 'bg-gray-100'
                                            }`}></div>
                                        <div className={`relative text-3xl font-bold transition-all duration-500 px-6 py-3 ${isDarkMode
                                            ? 'text-white/90 group-hover:text-white'
                                            : 'text-gray-800 group-hover:text-gray-900'
                                            }`}>
                                            {(activeFilters.length > 0 || searchTerm ? filteredMueblesOmni.length : muebles.length).toLocaleString('es-MX')}
                                        </div>
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
                        <div className={`mb-6 p-4 rounded-xl border shadow-inner hover:shadow-lg transition-shadow ${isDarkMode
                            ? 'bg-gradient-to-br from-black to-amber-900/10 border-gray-800'
                            : 'bg-gradient-to-br from-amber-50/50 to-orange-50/30 border-amber-100'
                            }`}>
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
                                                placeholder="Buscar en no listados..."
                                                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${isDarkMode
                                                    ? 'bg-black border-gray-800 text-white placeholder-gray-500 focus:ring-amber-500 hover:border-amber-500/30'
                                                    : 'bg-white border-amber-200 text-gray-900 placeholder-gray-400 focus:ring-amber-500 hover:border-amber-400'
                                                    }`}
                                            />
                                            <SuggestionDropdown />
                                        </div>
                                        <button
                                            onClick={saveCurrentFilter}
                                            disabled={!searchTerm || !searchMatchType}
                                            className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all duration-200 hover:scale-105 ${searchTerm && searchMatchType
                                                ? (isDarkMode
                                                    ? 'bg-amber-900/40 hover:bg-amber-800/50 border-amber-700/50 text-amber-100'
                                                    : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700'
                                                )
                                                : (isDarkMode
                                                    ? 'bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed'
                                                    : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                                                )
                                                }`}
                                            title="Agregar filtro actual a la lista de filtros activos"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                    {/* Filtros guardados debajo de la barra de búsqueda */}
                                    {activeFilters.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2 w-full">
                                            {activeFilters.map((filter, index) => {
                                                // Usar un estilo uniforme para todos los tipos de filtro
                                                const colorClass = isDarkMode
                                                    ? 'bg-amber-900/20 border-amber-700/30 text-amber-100'
                                                    : 'bg-amber-50 border-amber-200 text-amber-800';

                                                return (
                                                    <span
                                                        key={filter.term + filter.type + index}
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full ${colorClass} text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200`}
                                                    >
                                                        <span className={`mr-1 font-medium uppercase tracking-wide text-[10px] opacity-80 ${isDarkMode ? 'text-amber-200/70' : 'text-amber-600'
                                                            }`}>{getTypeLabel(filter.type)}</span>
                                                        <span className="truncate max-w-[160px] md:max-w-[220px] lg:max-w-[320px]">{filter.term}</span>
                                                        <button
                                                            onClick={() => removeFilter(index)}
                                                            className="ml-1 opacity-80 hover:opacity-100 focus:outline-none"
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
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-1 transition-all duration-200 border ${isDarkMode
                                                        ? 'bg-white/10 border-white/30 text-white/90 hover:bg-white/15'
                                                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    title="Limpiar todos los filtros"
                                                >
                                                    <X className="h-3 w-3 mr-1" /> Limpiar
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-4 md:mt-0">
                                    <button
                                        onClick={reindex}
                                        className={`px-4 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 shadow-md ${isDarkMode
                                            ? 'border-amber-700/30 bg-amber-900/10 text-amber-100 hover:bg-amber-900/20'
                                            : 'border-amber-200 bg-white text-amber-800 hover:bg-amber-50'
                                            }`}
                                        title="Recargar datos desde la base de datos"
                                    >
                                        <RefreshCw className="h-4 w-4 animate-spin-slow" />
                                        Actualizar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tabla */}
                        <div className={`rounded-lg border overflow-x-auto overflow-y-auto mb-6 flex flex-col flex-grow max-h-[70vh] ${isDarkMode
                            ? 'bg-black border-gray-800'
                            : 'bg-white border-amber-200 shadow-sm'
                            }`}>
                            <div className="flex-grow min-w-[800px]">
                                <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-800' : 'divide-gray-200'
                                    }`}>
                                    <thead className={`sticky top-0 z-20 ${isDarkMode
                                        ? 'bg-gradient-to-r from-black to-zinc-950 border-b border-gray-800'
                                        : 'bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100'
                                        }`}>
                                        <tr>
                                            <th
                                                onClick={() => handleSort('id_inv')}
                                                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${isDarkMode
                                                    ? 'text-amber-200 hover:bg-amber-900/20'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-1">
                                                    ID Inventario
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('descripcion')}
                                                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${isDarkMode
                                                    ? 'text-amber-200 hover:bg-amber-900/20'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-1">
                                                    Descripción
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('area')}
                                                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${isDarkMode
                                                    ? 'text-amber-200 hover:bg-amber-900/20'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-1">
                                                    Área
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('usufinal')}
                                                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${isDarkMode
                                                    ? 'text-amber-200 hover:bg-amber-900/20'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-1">
                                                    Director/Jefe de Área
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('estatus')}
                                                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${isDarkMode
                                                    ? 'text-amber-200 hover:bg-amber-900/20'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-1">
                                                    Estado
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </div>
                                            </th>
                                            <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-amber-200' : 'text-gray-600'
                                                }`}>Folio Resguardo</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDarkMode
                                        ? 'bg-black divide-gray-800'
                                        : 'bg-white divide-gray-200'
                                        }`}>
                                        {loading ? (
                                            <TableSkeleton />
                                        ) : error ? (
                                            <tr className="h-96">
                                                <td colSpan={5} className="px-6 py-24 text-center">
                                                    <div className={`flex flex-col items-center justify-center space-y-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'
                                                        }`}>
                                                        <AlertCircle className="h-12 w-12" />
                                                        <p className="text-lg font-medium">Error al cargar datos</p>
                                                        <p className={`text-sm max-w-lg mx-auto mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                            }`}>{error}</p>
                                                        <button
                                                            onClick={reindex}
                                                            className={`px-4 py-2 rounded-md text-sm transition-colors ${isDarkMode
                                                                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                }`}
                                                        >
                                                            Intentar nuevamente
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : muebles.length === 0 ? (
                                            <tr className="h-96">
                                                <td colSpan={5} className={`px-6 py-24 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>
                                                    <div className="flex flex-col items-center justify-center space-y-4">
                                                        <FileWarning className={`h-12 w-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                                            }`} />
                                                        <p className="text-lg font-medium">No se encontraron artículos no listados</p>
                                                        {(searchTerm || Object.values(filters).some(value => value !== '')) ? (
                                                            <>
                                                                <p className={`text-sm max-w-lg mx-auto ${isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                                                    }`}>
                                                                    No hay elementos en "No Listado" que coincidan con los criterios
                                                                </p>
                                                                <button
                                                                    onClick={clearFilters}
                                                                    className={`px-4 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${isDarkMode
                                                                        ? 'bg-white/10 text-white hover:bg-white/20'
                                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                        }`}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                    Limpiar filtros
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                                                }`}>No hay registros marcados como no listados actualmente</p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedMuebles.map(item => {
                                                const folio = item.id_inv ? foliosResguardo[item.id_inv] : undefined;
                                                return (
                                                    <tr
                                                        key={item.id}
                                                        onClick={() => handleSelectItem(item)}
                                                        className={`cursor-pointer transition-colors ${selectedItem?.id === item.id
                                                            ? (isDarkMode
                                                                ? 'bg-amber-900/20 border-l-4 border-amber-500'
                                                                : 'bg-amber-50 border-l-4 border-amber-500 shadow-sm'
                                                            )
                                                            : (isDarkMode
                                                                ? 'hover:bg-amber-900/10'
                                                                : 'hover:bg-gray-50'
                                                            )
                                                            }`}
                                                    >
                                                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                            }`}>
                                                            {item.id_inv}
                                                        </td>
                                                        <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                            }`}>
                                                            {truncateText(item.descripcion, 40)}
                                                        </td>
                                                        <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                            }`}>
                                                            {truncateText(item.area, 20)}
                                                        </td>
                                                        <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                            }`}>
                                                            {truncateText(item.usufinal, 20)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            {/* Badge de estatus con color automático */}
                                                            {(() => {
                                                                const status = item.estatus;
                                                                const { text, style } = getStatusBadgeColors(status);
                                                                return (
                                                                    <span
                                                                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${text}`}
                                                                        style={style}
                                                                    >
                                                                        {status === 'ACTIVO' && <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                                                                        {status === 'INACTIVO' && <XCircle className="h-3.5 w-3.5 mr-1.5" />}
                                                                        {status === 'NO LOCALIZADO' && <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />}
                                                                        {truncateText(status, 20)}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                            }`}>
                                                            {folio ? (
                                                                <div className="relative">
                                                                    <button
                                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold border shadow-sm hover:scale-105 transition-all duration-200 ${isDarkMode
                                                                            ? 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                                                                            : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                                                            }`}
                                                                        title={`Ver resguardo ${folio}`}
                                                                        onClick={e => {
                                                                            e.stopPropagation();
                                                                            window.location.href = `/resguardos/consultar?folio=${folio}`;
                                                                        }}
                                                                    >
                                                                        <BadgeCheck className={`h-4 w-4 mr-1 ${isDarkMode ? 'text-white/80' : 'text-blue-600'
                                                                            }`} />
                                                                        {folio}
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="relative">
                                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold border shadow-sm cursor-default select-none ${isDarkMode
                                                                        ? 'bg-black/30 text-white/80 border-white/20'
                                                                        : 'bg-gray-100 text-gray-600 border-gray-300'
                                                                        }`}>
                                                                        <XCircle className={`h-4 w-4 mr-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                                            }`} />
                                                                        Sin resguardo
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginación */}
                            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mt-4 mb-3 px-2">
                                {/* Contador de registros con diseño mejorado */}
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-inner ${isDarkMode
                                    ? 'bg-neutral-900/50 border-neutral-800'
                                    : 'bg-gray-50 border-gray-200'
                                    }`}>
                                    {totalCount === 0 ? (
                                        <span className={`flex items-center gap-2 ${isDarkMode ? 'text-neutral-400' : 'text-gray-600'
                                            }`}>
                                            <AlertCircle className={`h-4 w-4 ${isDarkMode ? 'text-neutral-500' : 'text-gray-500'
                                                }`} />
                                            No hay registros para mostrar
                                        </span>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className={isDarkMode ? 'text-neutral-300' : 'text-gray-700'}>Mostrando</span>
                                            <span className={`px-2 py-0.5 rounded-lg font-mono border ${isDarkMode
                                                ? 'bg-white/10 text-white border-white/30'
                                                : 'bg-blue-50 text-blue-800 border-blue-200'
                                                }`}>
                                                {((currentPage - 1) * rowsPerPage) + 1}–{Math.min(currentPage * rowsPerPage, totalCount)}
                                            </span>
                                            <span className={isDarkMode ? 'text-neutral-300' : 'text-gray-700'}>de</span>
                                            <span className={`px-2 py-0.5 rounded-lg font-mono border ${isDarkMode
                                                ? 'bg-neutral-900 text-neutral-300 border-neutral-800'
                                                : 'bg-gray-100 text-gray-700 border-gray-300'
                                                }`}>
                                                {totalCount}
                                            </span>
                                            <span className={isDarkMode ? 'text-neutral-400' : 'text-gray-600'}>registros</span>
                                            {/* Selector de filas por página */}
                                            <span className={`ml-4 ${isDarkMode ? 'text-neutral-400' : 'text-gray-500'}`}>|</span>
                                            <label htmlFor="rows-per-page" className={`ml-2 text-xs ${isDarkMode ? 'text-neutral-400' : 'text-gray-600'
                                                }`}>Filas por página:</label>
                                            <select
                                                id="rows-per-page"
                                                value={rowsPerPage}
                                                onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                                className={`ml-1 px-2 py-1 rounded-lg border font-mono text-xs focus:outline-none focus:ring-2 transition ${isDarkMode
                                                    ? 'bg-black/30 border-white/20 text-white focus:ring-white/50 focus:border-white/50'
                                                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                                                    }`}
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
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-inner ${isDarkMode
                                        ? 'bg-neutral-900/50 border-neutral-800'
                                        : 'bg-gray-50 border-gray-200'
                                        }`}>
                                        <span className={isDarkMode ? 'text-neutral-400' : 'text-gray-600'}>Página</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`px-2.5 py-0.5 rounded-lg font-mono font-bold border min-w-[2rem] text-center transition-all duration-300 hover:scale-105 ${isDarkMode
                                                ? 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                                                : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                                                }`}>
                                                {currentPage}
                                            </span>
                                            <span className={isDarkMode ? 'text-neutral-500' : 'text-gray-500'}>/</span>
                                            <span className={`px-2.5 py-0.5 rounded-lg font-mono min-w-[2rem] text-center border ${isDarkMode
                                                ? 'bg-neutral-900 text-neutral-400 border-neutral-800'
                                                : 'bg-gray-100 text-gray-700 border-gray-300'
                                                }`}>
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
                                        className={`px-2 py-1 rounded-lg border transition disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode
                                            ? 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
                                            : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                            }`}
                                        title="Primera página"
                                    >
                                        <ChevronLeft className="inline h-4 w-4 -mr-1" />
                                        <ChevronLeft className="inline h-4 w-4 -ml-2" />
                                    </button>
                                    <button
                                        onClick={() => changePage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`px-2 py-1 rounded-lg border transition disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode
                                            ? 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
                                            : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                            }`}
                                        title="Página anterior"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    {/* Botones numerados dinámicos */}
                                    {(() => {
                                        const pageButtons = [];
                                        const maxButtons = 5; // cantidad máxima de botones numerados visibles
                                        let start = Math.max(1, currentPage - 2);
                                        let end = Math.min(totalPages, currentPage + 2);
                                        if (currentPage <= 3) {
                                            end = Math.min(totalPages, maxButtons);
                                        } else if (currentPage >= totalPages - 2) {
                                            start = Math.max(1, totalPages - maxButtons + 1);
                                        }
                                        if (start > 1) {
                                            pageButtons.push(
                                                <span key="start-ellipsis" className={`px-2 ${isDarkMode ? 'text-neutral-500' : 'text-gray-500'
                                                    }`}>...</span>
                                            );
                                        }
                                        for (let i = start; i <= end; i++) {
                                            pageButtons.push(
                                                <button
                                                    key={i}
                                                    onClick={() => changePage(i)}
                                                    className={`mx-0.5 px-3 py-1.5 rounded-lg border text-sm font-semibold transition ${i === currentPage
                                                        ? (isDarkMode
                                                            ? 'bg-white/20 text-white border-white/40 shadow'
                                                            : 'bg-blue-500 text-white border-blue-600 shadow'
                                                        )
                                                        : (isDarkMode
                                                            ? 'bg-black/30 text-white/80 border-white/20 hover:bg-white/10 hover:text-white hover:border-white/30'
                                                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:text-gray-900 hover:border-gray-400'
                                                        )
                                                        }`}
                                                    aria-current={i === currentPage ? 'page' : undefined}
                                                >
                                                    {i}
                                                </button>
                                            );
                                        }
                                        if (end < totalPages) {
                                            pageButtons.push(
                                                <span key="end-ellipsis" className={`px-2 ${isDarkMode ? 'text-neutral-500' : 'text-gray-500'
                                                    }`}>...</span>
                                            );
                                        }
                                        return pageButtons;
                                    })()}
                                    <button
                                        onClick={() => changePage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`px-2 py-1 rounded-lg border transition disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode
                                            ? 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
                                            : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                            }`}
                                        title="Página siguiente"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => changePage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className={`px-2 py-1 rounded-lg border transition disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode
                                            ? 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
                                            : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                            }`}
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
                            className={`border rounded-lg shadow-xl overflow-visible flex flex-col flex-shrink-0 lg:w-[600px] min-w-full max-h-[85vh] ${isDarkMode
                                ? 'bg-black border-gray-800'
                                : 'bg-white border-gray-200'
                                }`}
                        >
                            <div className={`sticky top-0 z-10 border-b px-6 py-4 flex justify-between items-center ${isDarkMode
                                ? 'bg-black border-gray-800'
                                : 'bg-white border-gray-200'
                                }`}>
                                <h2 className={`text-xl font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    <Archive className={`h-5 w-5 ${isDarkMode ? 'text-amber-500' : 'text-amber-600'
                                        }`} />
                                    Detalle - No Listado
                                </h2>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        closeDetail();
                                    }}
                                    title="Cerrar detalle"
                                    className={`rounded-full p-2 focus:outline-none focus:ring-2 transition-colors ${isDarkMode
                                        ? 'text-amber-200 hover:text-white focus:ring-amber-500 hover:bg-amber-900/20'
                                        : 'text-gray-500 hover:text-gray-700 focus:ring-blue-500 hover:bg-gray-100'
                                        }`}
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
                                                <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>
                                                    Imagen del Bien
                                                </label>

                                                <div className="flex items-start gap-4">
                                                    <div className="flex-1">
                                                        {imagePreview ? (
                                                            <div className="relative group">
                                                                <img
                                                                    src={imagePreview}
                                                                    alt="Vista previa"
                                                                    className={`w-full h-64 object-contain rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'
                                                                        }`}
                                                                />
                                                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity ${isDarkMode ? 'bg-black/50' : 'bg-white/80'
                                                                    }`}>
                                                                    <label className={`cursor-pointer p-2 rounded-full transition-colors ${isDarkMode
                                                                        ? 'bg-gray-800/50 hover:bg-gray-700'
                                                                        : 'bg-gray-200/80 hover:bg-gray-300'
                                                                        }`}>
                                                                        <Edit className={`h-4 w-4 ${isDarkMode ? 'text-white' : 'text-gray-700'
                                                                            }`} />
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
                                                        <label className={`flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-amber-500 transition-colors p-4 ${isDarkMode
                                                            ? 'border-gray-700'
                                                            : 'border-gray-300'
                                                            }`}>
                                                            <div className="text-center">
                                                                <Plus className={`h-6 w-6 mx-auto mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                                    }`} />
                                                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                                    }`}>Cambiar imagen</span>
                                                            </div>
                                                            <input
                                                                type="file"
                                                                onChange={handleImageChange}
                                                                className="hidden"
                                                                accept="image/*"
                                                            />
                                                        </label>
                                                        <div className={`text-xs p-2 rounded-lg ${isDarkMode
                                                            ? 'text-gray-400 bg-gray-800/50'
                                                            : 'text-gray-600 bg-gray-100'
                                                            }`}>
                                                            <p>Formatos: JPG, PNG, GIF, WebP</p>
                                                            <p>Tamaño máximo: 5MB</p>
                                                            {uploading && <p className="text-blue-400 mt-1">Subiendo imagen...</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>ID Inventario</label>
                                                <input
                                                    type="text"
                                                    value={editFormData?.id_inv || ''}
                                                    onChange={(e) => handleEditFormChange(e, 'id_inv')}
                                                    className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${isDarkMode
                                                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-500'
                                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500'
                                                        }`}
                                                    placeholder="Ingrese el ID de inventario"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>Rubro</label>
                                                <div className="relative">
                                                    <select
                                                        title='Seleccione el rubro'
                                                        value={editFormData?.rubro || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'rubro')}
                                                        className={`appearance-none w-full border rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${isDarkMode
                                                            ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500'
                                                            : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
                                                            }`}
                                                    >
                                                        {(filterOptions.rubros ?? []).map((rubro) => (
                                                            <option key={rubro} value={rubro}>{rubro}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="form-group col-span-2">
                                                <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>Descripción</label>
                                                <textarea
                                                    value={editFormData?.descripcion || ''}
                                                    onChange={(e) => handleEditFormChange(e, 'descripcion')}
                                                    className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode
                                                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                                        }`}
                                                    rows={3}
                                                    placeholder="Ingrese la descripción"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>Estado</label>
                                                <div className="relative">
                                                    <select
                                                        id="estado-select"
                                                        title="Seleccione el estado"
                                                        value={editFormData?.estado || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'estado')}
                                                        className={`appearance-none w-full border rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode
                                                            ? 'bg-gray-800 border-gray-700 text-white'
                                                            : 'bg-white border-gray-300 text-gray-900'
                                                            }`}
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
                                                <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>
                                                    <DollarSign className="h-4 w-4 text-green-400" />
                                                    Valor
                                                </label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <span className="text-green-400 font-semibold">$</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={editFormData?.valor || 0}
                                                        onChange={(e) => handleEditFormChange(e, 'valor')}
                                                        className={`w-full border rounded-lg pl-8 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 ${isDarkMode
                                                            ? 'bg-gray-800 border-gray-700 text-white group-hover:bg-gray-700'
                                                            : 'bg-white border-gray-300 text-gray-900 group-hover:bg-gray-50'
                                                            }`}
                                                        title="Ingrese el valor"
                                                        placeholder="0.00"
                                                        step="0.01"
                                                        min="0"
                                                    />
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                        <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                                            }`}>MXN</span>
                                                    </div>
                                                </div>
                                                <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                                    }`}>Ingrese el valor en pesos mexicanos</p>
                                            </div>

                                            <div className="form-group">
                                                <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>Fecha de Adquisición</label>
                                                <div className="relative">
                                                    <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                                        }`} />
                                                    <input
                                                        type="date"
                                                        value={editFormData?.f_adq || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'f_adq')}
                                                        className={`w-full border rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode
                                                            ? 'bg-gray-800 border-gray-700 text-white'
                                                            : 'bg-white border-gray-300 text-gray-900'
                                                            }`}
                                                        title="Seleccione la fecha de adquisición"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>Forma de Adquisición</label>
                                                <div className="relative">
                                                    <select
                                                        value={editFormData?.formadq || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'formadq')}
                                                        className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode
                                                            ? 'bg-gray-800 border-gray-700 text-white'
                                                            : 'bg-white border-gray-300 text-gray-900'
                                                            }`}
                                                        title="Ingrese la forma de adquisición"
                                                    >
                                                        <option value="">Seleccionar forma de adquisición</option>
                                                        {(filterOptions.formadq ?? []).map((forma) => (
                                                            <option key={forma} value={forma}>{forma}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>Proveedor</label>
                                                <div className="relative">
                                                    <Store className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                                        }`} />
                                                    <input
                                                        type="text"
                                                        value={editFormData?.proveedor || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'proveedor')}
                                                        className={`w-full border rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode
                                                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                                            }`}
                                                        title="Ingrese el nombre del proveedor"
                                                        placeholder="Nombre del proveedor"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>Factura</label>
                                                <div className="relative">
                                                    <Receipt className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                                        }`} />
                                                    <input
                                                        type="text"
                                                        value={editFormData?.factura || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'factura')}
                                                        className={`w-full border rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode
                                                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                                            }`}
                                                        title="Ingrese el número de factura"
                                                        placeholder="Número de factura"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>Estado</label>
                                                <div className="relative">
                                                    <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                                        }`} />
                                                    <input
                                                        type="text"
                                                        title="Estado"
                                                        placeholder="Estado"
                                                        value={editFormData?.ubicacion_es || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'ubicacion_es')}
                                                        className={`w-full border rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode
                                                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                                            }`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>Municipio</label>
                                                <div className="relative">
                                                    <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                                        }`} />
                                                    <input
                                                        type="text"
                                                        title="Municipio"
                                                        placeholder="Municipio"
                                                        value={editFormData?.ubicacion_mu || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'ubicacion_mu')}
                                                        className={`w-full border rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode
                                                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                                            }`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>Nomenclatura</label>
                                                <div className="relative">
                                                    <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                                        }`} />
                                                    <input
                                                        type="text"
                                                        title="Nomenclatura"
                                                        placeholder="Nomenclatura"
                                                        value={editFormData?.ubicacion_no || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'ubicacion_no')}
                                                        className={`w-full border rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode
                                                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                                            }`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>Estatus</label>
                                                <div className="relative">
                                                    <select
                                                        title="Seleccione el estatus"
                                                        value={editFormData?.estatus || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'estatus')}
                                                        className={`appearance-none w-full border rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode
                                                            ? 'bg-gray-800 border-gray-700 text-white'
                                                            : 'bg-white border-gray-300 text-gray-900'
                                                            }`}
                                                    >
                                                        {filterOptions.estatus.map((status) => (
                                                            <option key={status} value={status}>{status}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>Área</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={editFormData?.area || ''}
                                                        readOnly
                                                        className={`w-full border rounded-lg pl-4 pr-10 py-2.5 cursor-not-allowed ${isDarkMode
                                                            ? 'bg-gray-700 border-gray-600 text-white'
                                                            : 'bg-gray-100 border-gray-300 text-gray-700'
                                                            }`}
                                                        aria-label="Área (se autocompleta al seleccionar un director/jefe)"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>Director/Jefe de Área</label>
                                                <div className="relative">
                                                    <select
                                                        title='Seleccione el Director/Jefe de Área'
                                                        name="usufinal"
                                                        value={editFormData?.usufinal || ''}
                                                        onChange={(e) => handleSelectDirector(e.target.value)}
                                                        className={`w-full border rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none ${isDarkMode
                                                            ? 'bg-gray-800 border-gray-700 text-white'
                                                            : 'bg-white border-gray-300 text-gray-900'
                                                            }`}
                                                    >
                                                        <option value="">Seleccionar Director/Jefe</option>
                                                        {filterOptions.directores.map((director, index) => (
                                                            <option key={index} value={director.nombre}>{director.nombre}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                        }`} />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>Usuario Final</label>
                                                <div className="relative">
                                                    <Shield className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                                        }`} />
                                                    <input
                                                        type="text"
                                                        value={editFormData?.resguardante || ''}
                                                        onChange={(e) => handleEditFormChange(e, 'resguardante')}
                                                        className={`w-full border rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode
                                                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                                            }`}
                                                        title="Ingrese el Usuario Final"
                                                        placeholder="Ingrese el Usuario Final"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-4 pt-6 border-t border-gray-800">
                                            <button
                                                onClick={saveChanges}
                                                className="px-5 py-2.5 bg-amber-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900"
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
                                        <div className={`detail-card rounded-lg p-4 transition-all col-span-2 ${isDarkMode
                                            ? 'bg-gray-800/50 hover:bg-gray-800/80'
                                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                            }`}>
                                            <h3 className={`text-xs font-medium uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                }`}>
                                                Fotografía del Bien
                                            </h3>
                                            <ImagePreview imagePath={selectedItem.image_path} />
                                        </div>
                                        {/* Sección de detalles de resguardo si existe (minimalista) */}
                                        {(() => {
                                            const folio = selectedItem?.id_inv ? foliosResguardo[selectedItem.id_inv] : undefined;
                                            const detalleResguardo = folio ? resguardoDetalles[folio] : undefined;
                                            if (folio && detalleResguardo) {
                                                return (
                                                    <div className="flex flex-wrap items-center gap-2 bg-white/10 border border-white/30 rounded-lg px-4 py-2 mb-4 text-xs text-white font-mono shadow-sm overflow-hidden break-words min-w-0">
                                                        <span className="font-bold text-white">Folio:</span> <span className="truncate break-words min-w-0">{detalleResguardo.folio}</span>
                                                        <span className="mx-2 text-white/60">|</span>
                                                        <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Fecha:</span> <span className="truncate break-words min-w-0">{formatDate(detalleResguardo.f_resguardo)}</span>
                                                        <span className={`mx-2 ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>|</span>
                                                        <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Área:</span> <span className="truncate break-words min-w-0">{detalleResguardo.area_resguardo}</span>
                                                        <span className={`mx-2 ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>|</span>
                                                        <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Director:</span> <span className="truncate break-words min-w-0">{detalleResguardo.dir_area}</span>
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div className={`flex flex-wrap items-center gap-2 border rounded-lg px-4 py-2 mb-4 text-xs font-mono shadow-sm overflow-hidden break-words min-w-0 ${isDarkMode
                                                        ? 'bg-gray-800/60 border-gray-700 text-gray-400'
                                                        : 'bg-gray-100 border-gray-300 text-gray-600'
                                                        }`}>
                                                        <XCircle className={`h-4 w-4 mr-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                            }`} />
                                                        Sin resguardo asignado
                                                    </div>
                                                );
                                            }
                                        })()}
                                        {/* Sección de detalles del artículo */}
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className={`detail-card rounded-lg p-4 transition-all ${isDarkMode
                                                ? 'bg-gray-800/50 hover:bg-gray-800/80'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                                }`}>
                                                <h3 className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>ID Inventario</h3>
                                                <p className={`mt-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>{selectedItem.id_inv}</p>
                                            </div>
                                            <div className={`detail-card rounded-lg p-4 transition-all ${isDarkMode
                                                ? 'bg-gray-800/50 hover:bg-gray-800/80'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                                }`}>
                                                <h3 className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>Rubro</h3>
                                                <p className={`mt-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>{selectedItem.rubro || 'No especificado'}</p>
                                            </div>
                                            <div className={`detail-card rounded-lg p-4 transition-all col-span-2 ${isDarkMode
                                                ? 'bg-gray-800/50 hover:bg-gray-800/80'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                                }`}>
                                                <h3 className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>Descripción</h3>
                                                <p className={`mt-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>{selectedItem.descripcion || 'No especificado'}</p>
                                            </div>
                                            <div className={`detail-card rounded-lg p-4 transition-all ${isDarkMode
                                                ? 'bg-gray-800/50 hover:bg-gray-800/80'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                                }`}>
                                                <h3 className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>Valor</h3>
                                                <p className={`mt-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>
                                                    {selectedItem.valor ?
                                                        `$${selectedItem.valor.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` :
                                                        '$0.00'}
                                                </p>
                                            </div>
                                            <div className={`detail-card rounded-lg p-4 transition-all ${isDarkMode
                                                ? 'bg-gray-800/50 hover:bg-gray-800/80'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                                }`}>
                                                <h3 className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>Fecha de Adquisición</h3>
                                                <p className={`mt-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>{formatDate(selectedItem.f_adq) || 'No especificado'}</p>
                                            </div>
                                            <div className={`detail-card rounded-lg p-4 transition-all ${isDarkMode
                                                ? 'bg-gray-800/50 hover:bg-gray-800/80'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                                }`}>
                                                <h3 className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>Forma de Adquisición</h3>
                                                <p className={`mt-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>{selectedItem.formadq || 'No especificado'}</p>
                                            </div>
                                            <div className={`detail-card rounded-lg p-4 transition-all ${isDarkMode
                                                ? 'bg-gray-800/50 hover:bg-gray-800/80'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                                }`}>
                                                <h3 className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>Proveedor</h3>
                                                <p className={`mt-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>{selectedItem.proveedor || 'No especificado'}</p>
                                            </div>
                                            <div className={`detail-card rounded-lg p-4 transition-all ${isDarkMode
                                                ? 'bg-gray-800/50 hover:bg-gray-800/80'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                                }`}>
                                                <h3 className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>Factura</h3>
                                                <p className={`mt-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>{selectedItem.factura || 'No especificado'}</p>
                                            </div>
                                            <div className={`detail-card rounded-lg p-4 transition-all ${isDarkMode
                                                ? 'bg-gray-800/50 hover:bg-gray-800/80'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                                }`}>
                                                <h3 className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>Estado</h3>
                                                <p className={`mt-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>{selectedItem.estado || 'No especificado'}</p>
                                            </div>
                                            <div className={`detail-card rounded-lg p-4 transition-all ${isDarkMode
                                                ? 'bg-gray-800/50 hover:bg-gray-800/80'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                                }`}>
                                                <h3 className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>Estado</h3>
                                                <p className={`mt-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>{selectedItem.ubicacion_es || 'No especificado'}</p>
                                            </div>

                                            <div className={`detail-card rounded-lg p-4 transition-all ${isDarkMode
                                                ? 'bg-gray-800/50 hover:bg-gray-800/80'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                                }`}>
                                                <h3 className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>Municipio</h3>
                                                <p className={`mt-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>{selectedItem.ubicacion_mu || 'No especificado'}</p>
                                            </div>

                                            <div className={`detail-card rounded-lg p-4 transition-all ${isDarkMode
                                                ? 'bg-gray-800/50 hover:bg-gray-800/80'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                                }`}>
                                                <h3 className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>Nomenclatura</h3>
                                                <p className={`mt-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>{selectedItem.ubicacion_no || 'No especificado'}</p>
                                            </div>
                                            <div className={`detail-card rounded-lg p-4 transition-all ${isDarkMode
                                                ? 'bg-gray-800/50 hover:bg-gray-800/80'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                                }`}>
                                                <h3 className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>Área</h3>
                                                <p className={`mt-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>{selectedItem.area || 'No especificado'}</p>
                                            </div>
                                            <div className={`detail-card rounded-lg p-4 transition-all ${isDarkMode
                                                ? 'bg-gray-800/50 hover:bg-gray-800/80'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                                }`}>
                                                <h3 className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>Director/Jefe de Área</h3>
                                                <p className={`mt-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>{selectedItem.usufinal || 'No especificado'}</p>
                                            </div>
                                            <div className={`detail-card rounded-lg p-4 transition-all ${isDarkMode
                                                ? 'bg-gray-800/50 hover:bg-gray-800/80'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                                }`}>
                                                <h3 className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>Usuario Final</h3>
                                                <p className={`mt-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>{selectedItem.resguardante || 'No especificado'}</p>
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
                                                            <span>Causa: {selectedItem.causadebaja}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <RoleGuard roles={["admin", "superadmin"]} userRole={userRole}>
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
                                                    className="px-5 py-2.5 bg-yellow-500 text-black rounded-lg font-medium flex items-center gap-2 hover:bg-yellow-400 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                                                >
                                                    <AlertTriangle className="h-4 w-4" />
                                                    Marcar como Inactivo
                                                </button>
                                                <button
                                                    onClick={markAsBaja}
                                                    className="px-5 py-2.5 bg-red-900 text-red-200 rounded-lg font-medium flex items-center gap-2 hover:bg-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
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

                    {/* Modal para completar información del director */}
                    {showDirectorModal && (
                        <div className={`fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn ${isDarkMode ? 'bg-black/90' : 'bg-black/50'
                            }`}>
                            <div className={`rounded-2xl shadow-2xl border w-full max-w-md overflow-hidden transition-all duration-300 transform ${isDarkMode
                                ? 'bg-black border-yellow-600/30'
                                : 'bg-white border-yellow-200'
                                }`}>
                                <div className={`relative p-6 ${isDarkMode
                                    ? 'bg-gradient-to-b from-black to-gray-900'
                                    : 'bg-gradient-to-b from-yellow-50 to-white'
                                    }`}>
                                    <div className={`absolute top-0 left-0 w-full h-1 ${isDarkMode ? 'bg-white/30' : 'bg-yellow-500'
                                        }`}></div>

                                    <div className="flex flex-col items-center text-center mb-4">
                                        <div className={`p-3 rounded-full border mb-3 ${isDarkMode
                                            ? 'bg-yellow-500/10 border-yellow-500/30'
                                            : 'bg-yellow-100 border-yellow-200'
                                            }`}>
                                            <AlertCircle className="h-8 w-8 text-yellow-500" />
                                        </div>
                                        <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>Información requerida</h3>
                                        <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                            Por favor complete el área del director/jefe de área seleccionado
                                        </p>
                                    </div>

                                    <div className="space-y-5 mt-6">
                                        <div className={`rounded-lg border p-4 ${isDarkMode
                                            ? 'border-gray-800 bg-gray-900/50'
                                            : 'border-gray-200 bg-gray-50'
                                            }`}>
                                            <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                }`}>Director/Jefe seleccionado</label>
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-yellow-100'
                                                    }`}>
                                                    <User className={`h-4 w-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                                                        }`} />
                                                </div>
                                                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>{incompleteDirector?.nombre || 'Director'}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                                }`}>
                                                <LayoutGrid className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                    }`} />
                                                Área
                                            </label>
                                            <input
                                                type="text"
                                                value={directorFormData.area}
                                                onChange={(e) => setDirectorFormData({ area: e.target.value })}
                                                placeholder="Ej: Administración, Recursos Humanos, Contabilidad..."
                                                className={`block w-full border rounded-lg py-3 px-4 focus:outline-none focus:ring-1 transition-colors ${isDarkMode
                                                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-yellow-500 focus:ring-yellow-500'
                                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500'
                                                    }`}
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

                                <div className={`p-5 border-t flex justify-end gap-3 ${isDarkMode
                                    ? 'bg-black border-gray-800'
                                    : 'bg-white border-gray-200'
                                    }`}>
                                    <button
                                        onClick={() => setShowDirectorModal(false)}
                                        className={`px-5 py-2.5 rounded-lg text-sm border transition-colors flex items-center gap-2 ${isDarkMode
                                            ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-800'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                                            }`}
                                    >
                                        <X className="h-4 w-4" />
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={saveDirectorInfo}
                                        disabled={savingDirector || !directorFormData.area}
                                        className={`px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all duration-300 ${savingDirector || !directorFormData.area
                                            ? isDarkMode
                                                ? 'bg-gray-900 text-gray-500 cursor-not-allowed border border-gray-800'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                                            : isDarkMode
                                                ? 'bg-white/20 text-white font-medium hover:bg-white/30'
                                                : 'bg-yellow-600 text-white font-medium hover:bg-yellow-700'
                                            }`}
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
                    )}                {/* Modal de selección de área para director (minimalista, dark) */}
                    {showAreaSelectModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">                    <div className="bg-black border border-gray-800 rounded-2xl shadow-2xl min-w-[360px] max-w-md w-full relative animate-fadeIn overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-white/30"></div>
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
                                                        area: area.nombre
                                                    }));
                                                } else if (selectedItem) {
                                                    setSelectedItem(prev => ({
                                                        ...prev!,
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
                        <div className={`fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn ${isDarkMode ? 'bg-black/90' : 'bg-black/50'
                            }`}>
                            <div className={`rounded-2xl shadow-2xl border w-full max-w-md overflow-hidden transition-all duration-300 transform ${isDarkMode
                                ? 'bg-black border-red-600/30'
                                : 'bg-white border-red-200'
                                }`}>
                                <div className={`relative p-6 ${isDarkMode
                                    ? 'bg-gradient-to-b from-black to-gray-900'
                                    : 'bg-gradient-to-b from-red-50 to-white'
                                    }`}>
                                    <div className={`absolute top-0 left-0 w-full h-1 ${isDarkMode ? 'bg-white/30' : 'bg-red-500'
                                        }`}></div>
                                    <div className="flex flex-col items-center text-center mb-4">
                                        <div className={`p-3 rounded-full border mb-3 ${isDarkMode
                                            ? 'bg-red-500/10 border-red-500/30'
                                            : 'bg-red-100 border-red-200'
                                            }`}>
                                            <AlertTriangle className="h-8 w-8 text-red-500" />
                                        </div>
                                        <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>¿Dar de baja este artículo?</h3>
                                    </div>
                                    <div className={`rounded-lg border p-4 mb-4 ${isDarkMode
                                        ? 'border-gray-800 bg-gray-900/50'
                                        : 'border-gray-200 bg-gray-50'
                                        }`}>
                                        <div className={`text-left text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}>
                                            <div><span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                }`}>ID:</span> {selectedItem.id_inv}</div>
                                            <div><span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                }`}>Descripción:</span> {selectedItem.descripcion}</div>
                                            <div><span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                }`}>Área:</span> {selectedItem.area}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}>
                                            <Info className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                }`} />
                                            Causa de Baja
                                        </label>
                                        <textarea
                                            value={bajaCause}
                                            onChange={(e) => setBajaCause(e.target.value)}
                                            placeholder="Ingrese la causa de baja"
                                            className={`block w-full border rounded-lg py-3 px-4 focus:outline-none focus:ring-1 transition-colors ${isDarkMode
                                                ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-red-500 focus:ring-red-500'
                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-red-500'
                                                }`}
                                            rows={3}
                                            required
                                        />
                                        {!bajaCause && (
                                            <p className="text-xs text-red-500/80 mt-2 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                Este campo es obligatorio
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className={`p-5 border-t flex justify-end gap-3 ${isDarkMode
                                    ? 'bg-black border-gray-800'
                                    : 'bg-white border-gray-200'
                                    }`}>
                                    <button
                                        onClick={() => setShowBajaModal(false)}
                                        className={`px-5 py-2.5 rounded-lg text-sm border transition-colors flex items-center gap-2 ${isDarkMode
                                            ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-800'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                                            }`}
                                    >
                                        <X className="h-4 w-4" />
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmBaja}
                                        disabled={!bajaCause}
                                        className={`px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all duration-300 ${!bajaCause
                                            ? isDarkMode
                                                ? 'bg-gray-900 text-gray-500 cursor-not-allowed border border-gray-800'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                                            : isDarkMode
                                                ? 'bg-white/20 text-white font-medium hover:bg-white/30'
                                                : 'bg-red-600 text-white font-medium hover:bg-red-700'
                                            }`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Dar de Baja
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal de confirmación para marcar como inactivo */}
                    {showInactiveModal && selectedItem && (
                        <div className={`fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn ${isDarkMode ? 'bg-black/90' : 'bg-black/50'
                            }`}>
                            <div className={`rounded-2xl shadow-2xl border w-full max-w-md overflow-hidden transition-all duration-300 transform ${isDarkMode
                                ? 'bg-black border-orange-600/30'
                                : 'bg-white border-orange-200'
                                }`}>
                                <div className={`relative p-6 ${isDarkMode
                                    ? 'bg-gradient-to-b from-black to-gray-900'
                                    : 'bg-gradient-to-b from-orange-50 to-white'
                                    }`}>
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500/60 via-orange-400 to-orange-500/60"></div>
                                    <div className="flex flex-col items-center text-center mb-4">
                                        <div className={`p-3 rounded-full border mb-3 ${isDarkMode
                                            ? 'bg-orange-500/10 border-orange-500/30'
                                            : 'bg-orange-100 border-orange-200'
                                            }`}>
                                            <AlertTriangle className="h-8 w-8 text-orange-500" />
                                        </div>
                                        <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>¿Marcar como INACTIVO?</h3>
                                        <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>El artículo será marcado como <span className="text-orange-500 font-semibold">INACTIVO</span> en el inventario.</p>
                                    </div>
                                    <div className={`rounded-lg border p-4 mb-4 text-left text-sm ${isDarkMode
                                        ? 'border-gray-800 bg-gray-900/50 text-gray-300'
                                        : 'border-gray-200 bg-gray-50 text-gray-700'
                                        }`}>
                                        <div><span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>ID:</span> {selectedItem.id_inv}</div>
                                        <div><span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>Descripción:</span> {selectedItem.descripcion}</div>
                                        <div><span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>Área:</span> {selectedItem.area}</div>
                                    </div>
                                </div>
                                <div className={`p-5 border-t flex justify-end gap-3 ${isDarkMode
                                    ? 'bg-black border-gray-800'
                                    : 'bg-white border-gray-200'
                                    }`}>
                                    <button
                                        onClick={() => setShowInactiveModal(false)}
                                        className={`px-5 py-2.5 rounded-lg text-sm border transition-colors flex items-center gap-2 ${isDarkMode
                                            ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-800'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                                            }`}
                                    >
                                        <X className="h-4 w-4" />
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmMarkAsInactive}
                                        className={`px-5 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-orange-700 transition-colors`}
                                    >
                                        <AlertTriangle className="h-4 w-4" />
                                        Marcar como INACTIVO
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}