"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search, ChevronLeft, ChevronRight, ArrowUpDown,
    AlertCircle, X, FileText, Calendar,
    User, Briefcase, Download, ListChecks,
    Info, RefreshCw, FileDigit, Building2, CircleX, XOctagon, Pencil
} from 'lucide-react';
import supabase from '@/app/lib/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import { generateResguardoPDF } from './ResguardoPDFReport';
import { useUserRole } from "@/hooks/useUserRole";
import RoleGuard from "@/components/roleGuard";
import { useNotifications } from '@/hooks/useNotifications';
import { useSearchParams } from 'next/navigation';

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
    articulos: Array<ResguardoArticulo>;
    puesto: string;
}

interface ResguardoArticulo {
    id: number;
    num_inventario: string;
    descripcion: string;
    rubro: string;
    condicion: string;
    origen: string; // INEA o ITEA
    resguardante?: string; // Agregando el resguardante individual
}

interface PdfFirma {
    concepto: string;
    nombre: string;
    puesto: string;
    cargo: string;
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
        origen?: string | null;
        resguardante?: string; // Pasar el resguardante individual
    }>;
    firmas?: PdfFirma[];
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
        resguardante?: string; // Pasar el resguardante individual
        folio_baja: string; // Agregar folio_baja
    }>;
    firmas?: PdfFirma[];
}

// Función auxiliar para obtener un artículo exacto de una tabla
const getExactArticulo = async (
    supabase: SupabaseClient,
    tabla: string,
    articulo: ResguardoArticulo,
    area?: string
) => {
    const { data } = await supabase
        .from(tabla)
        .select('id')
        .eq('id_inv', articulo.num_inventario)
        // Asegurar que sea exactamente el mismo artículo
        .eq('descripcion', articulo.descripcion)
        .eq('rubro', articulo.rubro)
        .eq('estado', articulo.condicion)
        .eq('area', area || '');

    return data;
};

// Función para limpiar área, usufinal y resguardante
const limpiarDatosArticulo = async (
    supabase: SupabaseClient,
    articulo: ResguardoArticulo,
    area: string
) => {
    // Buscar en muebles
    const muebleInea = await getExactArticulo(supabase, 'muebles', articulo, area);
    if (muebleInea && muebleInea.length > 0 && muebleInea[0].id) {
        await supabase
            .from('muebles')
            .update({ area: '', usufinal: '', resguardante: '' })
            .eq('id', muebleInea[0].id);
        return;
    }

    // Si no se encuentra en muebles, buscar en mueblesitea
    const muebleItea = await getExactArticulo(supabase, 'mueblesitea', articulo, area);
    if (muebleItea && muebleItea.length > 0 && muebleItea[0].id) {
        await supabase
            .from('mueblesitea')
            .update({ area: '', usufinal: '', resguardante: '' })
            .eq('id', muebleItea[0].id);
    }
};

export default function ConsultarResguardos({ folioParam }: { folioParam?: string | null }) {
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
    const [filterResguardante, setFilterResguardante] = useState('');
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [showDeleteItemModal, setShowDeleteItemModal] = useState<{ index: number, articulo: ResguardoArticulo } | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [allResguardos, setAllResguardos] = useState<Resguardo[]>([]);

    // Estado para selección múltiple de artículos
    const [selectedArticulos, setSelectedArticulos] = useState<string[]>([]); // num_inventario
    const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState(false);

    const [pdfBajaData, setPdfBajaData] = useState<PdfDataBaja | null>(null);
    const [showPDFBajaButton, setShowPDFBajaButton] = useState(false);

    // Estado para controlar la generación del PDF
    const [generatingPDF, setGeneratingPDF] = useState(false);

    // Estado para edición de resguardantes
    const [editResguardanteMode, setEditResguardanteMode] = useState(false);
    const [editedResguardantes, setEditedResguardantes] = useState<{ [id: number]: string }>({});
    const [savingResguardantes, setSavingResguardantes] = useState(false);

    const { createNotification } = useNotifications();
    const searchParams = useSearchParams();
    const [folioParamLoading, setFolioParamLoading] = useState(false);

    // Sincronizar los resguardantes editables cuando cambia el resguardo seleccionado
    useEffect(() => {
        if (selectedResguardo) {
            const initial: { [id: number]: string } = {};
            selectedResguardo.articulos.forEach(a => {
                initial[a.id] = a.resguardante || '';
            });
            setEditedResguardantes(initial);
            setEditResguardanteMode(false);
        }
    }, [selectedResguardo]);

    // Guardar cambios de resguardante en la base de datos
    const handleSaveResguardantes = async () => {
        if (!selectedResguardo) return;
        setSavingResguardantes(true);
        try {
            const cambios: string[] = [];
            for (const articulo of selectedResguardo.articulos) {
                const nuevoResguardante = editedResguardantes[articulo.id] || '';
                if (nuevoResguardante !== (articulo.resguardante || '')) {
                    cambios.push(`${articulo.num_inventario}: '${articulo.resguardante || 'Sin asignar'}' → '${nuevoResguardante || 'Sin asignar'}'`);
                    // Actualizar en la tabla resguardos usando id
                    await supabase
                        .from('resguardos')
                        .update({ usufinal: nuevoResguardante })
                        .eq('id', articulo.id);
                    // Actualizar también en muebles/mueblesitea
                    const tabla = articulo.origen === 'ITEA' ? 'mueblesitea' : 'muebles';
                    await supabase
                        .from(tabla)
                        .update({ resguardante: nuevoResguardante })
                        .eq('id_inv', articulo.num_inventario);
                }
            }
            // Notificación de edición de resguardantes
            if (cambios.length > 0) {
                await createNotification({
                    title: `Resguardantes editados en folio ${selectedResguardo.folio}`,
                    description: `Se actualizaron los resguardantes del resguardo (folio ${selectedResguardo.folio}, director ${selectedResguardo.dir_area}, área ${selectedResguardo.area_resguardo || ''}). Cambios: ${cambios.join('; ')}`,
                    type: 'info',
                    category: 'resguardos',
                    device: 'web',
                    importance: 'medium',
                    data: { changes: cambios, affectedTables: ['resguardos', 'muebles', 'mueblesitea'] }
                });
            }
            // Refrescar detalles
            await fetchResguardoDetails(selectedResguardo.folio);
            setEditResguardanteMode(false);
        } catch {
            setError('Error al guardar los resguardantes');
        } finally {
            setSavingResguardantes(false);
        }
    };

    // Seleccionar/deseleccionar un artículo
    const toggleArticuloSelection = (num_inventario: string) => {
        setSelectedArticulos(prev =>
            prev.includes(num_inventario)
                ? prev.filter(n => n !== num_inventario)
                : [...prev, num_inventario]
        );
    };

    // Generar folio de baja
    const generateFolioBaja = async () => {
        try {
            // Obtener el último folio de baja
            const { data: lastFolio } = await supabase
                .from('resguardos_bajas')
                .select('folio_baja')
                .order('id', { ascending: false })
                .limit(1)
                .single();

            // Generar nuevo folio
            const today = new Date();
            const year = today.getFullYear().toString();
            const prefix = 'BAJA-';

            let sequence = 1;
            if (lastFolio && lastFolio.folio_baja) {
                const lastSequence = parseInt(lastFolio.folio_baja.split('-')[2]);
                if (!isNaN(lastSequence)) {
                    sequence = lastSequence + 1;
                }
            }

            return `${prefix}${year}-${sequence.toString().padStart(4, '0')}`;
        } catch (error) {
            console.error('Error generando folio de baja:', error);
            return `BAJA-${new Date().getFullYear()}-0001`;
        }
    };

    // Mover registros a la tabla de bajas
    const moveToResguardosBajas = async (articulos: Array<ResguardoArticulo>, folioBaja: string) => {
        if (!selectedResguardo) return;

        // Obtener el nombre del usuario autenticado desde la cookie
        let createdBy = 'SISTEMA';
        try {
            const userDataCookie = typeof window !== 'undefined' ? window.document.cookie.split('; ').find(row => row.startsWith('userData=')) : null;
            if (userDataCookie) {
                const userData = JSON.parse(decodeURIComponent(userDataCookie.split('=')[1]));
                createdBy = `${userData.firstName || ''}${userData.lastName ? ' ' + userData.lastName : ''}`.trim();
            }
        } catch { }

        for (const articulo of articulos) {
            await supabase
                .from('resguardos_bajas')
                .insert({
                    folio_resguardo: selectedResguardo.folio,
                    folio_baja: folioBaja,
                    f_resguardo: selectedResguardo.f_resguardo,
                    area_resguardo: selectedResguardo.area_resguardo,
                    dir_area: selectedResguardo.dir_area,
                    num_inventario: articulo.num_inventario,
                    descripcion: articulo.descripcion,
                    rubro: articulo.rubro,
                    condicion: articulo.condicion,
                    usufinal: articulo.resguardante || '',
                    created_by: createdBy, // Ahora guarda el nombre del usuario
                    puesto: selectedResguardo.puesto,
                    origen: articulo.origen
                });
        }
    };

    // Eliminar artículos seleccionados
    const handleDeleteSelected = async () => {
        if (!selectedResguardo || selectedArticulos.length === 0) return;
        setDeleting(true);
        try {
            const folioBaja = await generateFolioBaja();

            // Obtener las firmas
            const { data: firmas, error: firmasError } = await supabase
                .from('firmas')
                .select('*')
                .order('id', { ascending: true });

            if (firmasError) throw firmasError;

            // Obtener artículos seleccionados
            const articulosSeleccionados = selectedResguardo.articulos.filter(
                art => selectedArticulos.includes(art.num_inventario)
            );

            // Mover registros a resguardos_bajas
            await moveToResguardosBajas(articulosSeleccionados, folioBaja);

            // Preparar datos para el PDF de baja
            setPdfBajaData({
                folio_resguardo: selectedResguardo.folio,
                folio_baja: folioBaja,
                fecha: new Date().toLocaleDateString(),
                director: selectedResguardo.dir_area,
                area: selectedResguardo.area_resguardo || '',
                puesto: selectedResguardo.puesto,
                resguardante: selectedResguardo.usufinal || '',
                articulos: articulosSeleccionados.map(art => ({
                    id_inv: art.num_inventario,
                    descripcion: art.descripcion,
                    rubro: art.rubro,
                    estado: art.condicion,
                    origen: art.origen,
                    resguardante: art.resguardante || '', // Siempre string
                    folio_baja: folioBaja
                })),
                firmas: firmas || undefined
            });

            // Eliminar registros originales
            for (const numInv of selectedArticulos) {
                await supabase
                    .from('resguardos')
                    .delete()
                    .eq('folio', selectedResguardo.folio)
                    .eq('num_inventario', numInv);
            }

            // Limpiar área, usufinal y resguardante para cada artículo seleccionado
            for (const articulo of articulosSeleccionados) {
                await limpiarDatosArticulo(supabase, articulo, selectedResguardo.area_resguardo || '');
            }

            // Notificación de eliminación de artículos
            await createNotification({
                title: `Artículos eliminados del resguardo ${selectedResguardo.folio}`,
                description: `Se eliminaron ${selectedArticulos.length} artículo(s) del resguardo (folio ${selectedResguardo.folio}, director ${selectedResguardo.dir_area}, área ${selectedResguardo.area_resguardo || ''}). Inventarios: ${selectedArticulos.join(', ')}`,
                type: 'danger',
                category: 'resguardos',
                device: 'web',
                importance: 'high',
                data: { affectedTables: ['resguardos', 'resguardos_bajas'], changes: selectedArticulos }
            });

            await fetchResguardoDetails(selectedResguardo.folio);
            setShowDeleteSelectedModal(false);
            setSelectedArticulos([]);
            setShowPDFBajaButton(true);
            fetchResguardos();
        } catch {
            setError('Error al procesar la baja de los artículos seleccionados');
        } finally {
            setDeleting(false);
        }
    };

    // Fetch resguardos with pagination and sorting (por folio único)
    const fetchResguardos = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Obtener todos los folios únicos con filtros
            let foliosQuery = supabase.from('resguardos').select('folio, f_resguardo, dir_area, area_resguardo, usufinal', { count: 'exact' });

            if (filterDate) {
                foliosQuery = foliosQuery.eq('f_resguardo::date', filterDate);
            }
            if (filterDirector) {
                foliosQuery = foliosQuery.filter('dir_area', 'ilike', `%${filterDirector.trim().toUpperCase()}%`);
            }
            if (filterResguardante) {
                foliosQuery = foliosQuery.filter('usufinal', 'ilike', `%${filterResguardante.trim().toUpperCase()}%`);
            }

            // Obtener todos los folios únicos (sin paginar aún)
            const { data: foliosData, error: foliosError } = await foliosQuery;
            if (foliosError) throw foliosError;
            // Agrupar por folio único
            const foliosUnicosArr = Array.from(new Map((foliosData || []).map(r => [r.folio, r])).values());
            setTotalCount(foliosUnicosArr.length);

            // 2. Paginar los folios únicos
            const from = (currentPage - 1) * rowsPerPage;
            const to = from + rowsPerPage;
            const foliosPagina = foliosUnicosArr
                .sort((a, b) => {
                    // Ordenar según sortField y sortDirection
                    const dir = sortDirection === 'asc' ? 1 : -1;
                    if (a[sortField] < b[sortField]) return -1 * dir;
                    if (a[sortField] > b[sortField]) return 1 * dir;
                    return 0;
                })
                .slice(from, to);

            // 3. Obtener los datos completos de los resguardos de los folios de la página
            if (foliosPagina.length === 0) {
                setResguardos([]);
                setError(null);
                setLoading(false);
                return;
            }
            const foliosFiltrados = foliosPagina.map(f => f.folio);
            const dataQuery = supabase.from('resguardos').select('*').in('folio', foliosFiltrados);
            const { data, error: queryError } = await dataQuery;
            if (queryError) throw queryError;
            setResguardos(data || []);
            setError(null);
        } catch (err) {
            setError('Error al cargar los resguardos');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, rowsPerPage, sortField, sortDirection, filterDate, filterDirector, filterResguardante]);

    // Fetch all resguardos for counting articles by folio correctly
    useEffect(() => {
        const fetchAllResguardos = async () => {
            try {
                let dataQuery = supabase.from('resguardos').select('*');
                if (filterDate) {
                    dataQuery = dataQuery.eq('f_resguardo::date', filterDate);
                }
                if (filterDirector) {
                    // Normalizar a mayúsculas y quitar espacios para comparar correctamente
                    dataQuery = dataQuery.filter('dir_area', 'ilike', `%${filterDirector.trim().toUpperCase()}%`);
                }
                if (filterResguardante) {
                    dataQuery = dataQuery.filter('usufinal', 'ilike', `%${filterResguardante.trim().toUpperCase()}%`);
                }
                const { data, error } = await dataQuery;
                if (!error) setAllResguardos(data || []);
            } catch {
                setAllResguardos([]);
            }
        };
        fetchAllResguardos();
    }, [filterDate, filterDirector, filterResguardante, searchTerm]);

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

    // Fetch resguardos by folio
    const fetchResguardoDetails = async (folio: string, specificResguardante?: string) => {
        setLoading(true);
        try {
            let query = supabase
                .from('resguardos')
                .select('*')
                .eq('folio', folio);

            // Si se especifica un resguardante, filtrar solo sus artículos
            if (specificResguardante) {
                query = query.eq('usufinal', specificResguardante);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data && data.length > 0) {
                const firstItem = data[0];
                const detalles: ResguardoDetalle = {
                    ...firstItem,
                    articulos: data.map(item => ({
                        id: item.id,
                        num_inventario: item.num_inventario,
                        descripcion: item.descripcion,
                        rubro: item.rubro,
                        condicion: item.condicion,
                        origen: item.origen,
                        resguardante: item.usufinal // Asegurar que se pase el resguardante individual
                    })),
                    puesto: firstItem.puesto
                };

                setSelectedResguardo(detalles);

                // Obtener firmas
                const firmas = await getFirmas();

                // Preparar datos para el PDF
                const [year, month, day] = detalles.f_resguardo.slice(0, 10).split('-').map(Number);
                const fechaLocal = new Date(year, month - 1, day);
                setPdfData({
                    folio: detalles.folio,
                    fecha: fechaLocal.toLocaleDateString(),
                    director: detalles.dir_area,
                    area: detalles.area_resguardo || '',
                    puesto: detalles.puesto,
                    resguardante: specificResguardante || detalles.usufinal || '',
                    articulos: detalles.articulos.map(art => ({
                        id_inv: art.num_inventario,
                        descripcion: art.descripcion,
                        rubro: art.rubro,
                        estado: art.condicion,
                        origen: art.origen,
                        resguardante: art.resguardante // Pasar el resguardante individual
                    })),
                    firmas: firmas || undefined
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

    // Eliminar todos los artículos de un resguardo (por folio)
    const handleDeleteAll = async () => {
        if (!selectedResguardo) return;
        setDeleting(true);
        try {
            const folioBaja = await generateFolioBaja();

            // Obtener las firmas antes de crear el PDF
            const { data: firmas, error: firmasError } = await supabase
                .from('firmas')
                .select('*')
                .order('id', { ascending: true });

            if (firmasError) throw firmasError;

            // Mover registros a resguardos_bajas antes de eliminarlos
            await moveToResguardosBajas(selectedResguardo.articulos, folioBaja);

            // Preparar datos para el PDF de baja
            setPdfBajaData({
                folio_resguardo: selectedResguardo.folio,
                folio_baja: folioBaja,
                fecha: new Date().toLocaleDateString(),
                director: selectedResguardo.dir_area,
                area: selectedResguardo.area_resguardo || '',
                puesto: selectedResguardo.puesto,
                resguardante: selectedResguardo.usufinal || '',
                articulos: selectedResguardo.articulos.map(art => ({
                    id_inv: art.num_inventario,
                    descripcion: art.descripcion,
                    rubro: art.rubro,
                    estado: art.condicion,
                    origen: art.origen,
                    resguardante: art.resguardante || '', // Siempre string
                    folio_baja: folioBaja
                })),
                firmas: firmas || undefined
            });

            // Eliminar registros originales y actualizar UI
            const { error } = await supabase
                .from('resguardos')
                .delete()
                .eq('folio', selectedResguardo.folio);

            if (error) throw error;

            // Limpiar área, usufinal y resguardante para cada artículo
            for (const articulo of selectedResguardo.articulos) {
                await limpiarDatosArticulo(supabase, articulo, selectedResguardo.area_resguardo || '');
            }

            // Notificación de eliminación de resguardo completo
            await createNotification({
                title: `Resguardo dado de baja (folio ${selectedResguardo.folio})`,
                description: `Se eliminó el resguardo completo (folio ${selectedResguardo.folio}, director ${selectedResguardo.dir_area}, área ${selectedResguardo.area_resguardo || ''}) con ${selectedResguardo.articulos.length} artículo(s).`,
                type: 'danger',
                category: 'resguardos',
                device: 'web',
                importance: 'high',
                data: { affectedTables: ['resguardos', 'resguardos_bajas'], changes: selectedResguardo.articulos.map(a => a.num_inventario) }
            });

            setSelectedResguardo(null);
            setShowDeleteAllModal(false);
            setShowPDFBajaButton(true);
            fetchResguardos();
        } catch (err) {
            setError('Error al procesar la baja del resguardo');
            console.error(err);
        } finally {
            setDeleting(false);
        }
    };

    // Eliminar un solo artículo de un resguardo
    const handleDeleteItem = async (articulo: ResguardoArticulo) => {
        if (!selectedResguardo) return;
        setDeleting(true);
        try {
            const folioBaja = await generateFolioBaja();

            // Obtener las firmas
            const { data: firmas, error: firmasError } = await supabase
                .from('firmas')
                .select('*')
                .order('id', { ascending: true });

            if (firmasError) throw firmasError;

            // Mover registro a resguardos_bajas
            await moveToResguardosBajas([articulo], folioBaja);

            // Preparar datos para el PDF de baja
            setPdfBajaData({
                folio_resguardo: selectedResguardo.folio,
                folio_baja: folioBaja,
                fecha: new Date().toLocaleDateString(),
                director: selectedResguardo.dir_area,
                area: selectedResguardo.area_resguardo || '',
                puesto: selectedResguardo.puesto,
                resguardante: selectedResguardo.usufinal || '',
                articulos: [
                    {
                        id_inv: articulo.num_inventario,
                        descripcion: articulo.descripcion,
                        rubro: articulo.rubro,
                        estado: articulo.condicion,
                        origen: articulo.origen,
                        resguardante: articulo.resguardante || '', // Siempre string
                        folio_baja: folioBaja
                    }
                ],
                firmas: firmas || undefined
            });

            // Eliminar registro original
            const { error } = await supabase
                .from('resguardos')
                .delete()
                .eq('folio', selectedResguardo.folio)
                .eq('num_inventario', articulo.num_inventario);

            if (error) throw error;

            // Limpiar área, usufinal y resguardante solo para este artículo
            await limpiarDatosArticulo(supabase, articulo, selectedResguardo.area_resguardo || '');

            await fetchResguardoDetails(selectedResguardo.folio);
            setShowDeleteItemModal(null);
            setShowPDFBajaButton(true);
            fetchResguardos();
        } catch (err) {
            setError('Error al procesar la baja del artículo');
            console.error(err);
        } finally {
            setDeleting(false);
        }
    };

    // Función para manejar la generación del PDF
    const handleGeneratePDF = async () => {
        setGeneratingPDF(true);
        try {
            if (pdfData) {
                await generateResguardoPDF(pdfData);
            }
        } catch (error) {
            setError('Error al generar el PDF');
            console.error(error);
        } finally {
            setGeneratingPDF(false);
            setShowPDFButton(false); // Cerrar el modal después de la descarga
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

    // Reset search
    const resetSearch = () => {
        setSearchTerm('');
        fetchResguardos();
    };

    // Efecto para búsqueda en tiempo real
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm || filterDate || filterDirector || filterResguardante) {
                setLoading(true);
                try {
                    let query = supabase.from('resguardos').select('*');

                    // Aplicar filtros
                    if (searchTerm) {
                        query = query.ilike('folio', `%${searchTerm}%`);
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
            } else {
                fetchResguardos();
            }
        }, 100);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, sortField, sortDirection, filterDate, filterDirector, filterResguardante, fetchResguardos]);

    useEffect(() => {
        fetchResguardos();
    }, [fetchResguardos]);

    // Mostrar resguardo automáticamente si hay ?folio=XXX
    useEffect(() => {
        const folioParam = searchParams?.get('folio');
        if (folioParam) {
            fetchResguardoDetails(folioParam);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // Buscar y mostrar el detalle del folio si viene por prop
    useEffect(() => {
        if (folioParam) {
            setFolioParamLoading(true);
            fetchResguardoDetails(folioParam)
                .then(() => {
                    // Scroll al detalle después de cargar
                    if (detailRef.current) {
                        detailRef.current.scrollIntoView({ behavior: 'smooth' });
                    }
                })
                .finally(() => setFolioParamLoading(false));
        }
    }, [folioParam]);

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / rowsPerPage);

    // Agrupar resguardos por folio para mostrar solo un folio por fila (de los resguardos cargados en la página)
    const foliosUnicos = Array.from(
        new Map(resguardos.map(r => [r.folio, r])).values()
    );

    // Función para contar artículos por folio usando todos los resguardos filtrados
    const getArticuloCount = (folio: string) => {
        return allResguardos.filter(r => r.folio === folio).length;
    };

    const userRole = useUserRole();

    return (
        <div className="bg-black text-white min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
            {/* Si está cargando el folio por param, mostrar loader sobre el panel derecho */}
            {folioParamLoading && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-blue-300 animate-pulse text-lg font-bold">Cargando folio...</span>
                        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
            )}
            <div className="w-full mx-auto bg-black rounded-lg sm:rounded-xl shadow-2xl overflow-hidden transition-all duration-500 transform border border-gray-800">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 gap-2 sm:gap-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
                        <span className="mr-2 sm:mr-3 bg-gradient-to-br from-blue-600 to-purple-600 text-white p-1 sm:p-2 rounded-lg border border-blue-400/20 text-sm sm:text-base shadow-lg">RES</span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-200">
                            Consulta de Resguardos
                        </span>
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <ListChecks className="h-4 w-4 text-blue-400 animate-pulse" />
                        <span>{totalCount} resguardos registrados</span>
                    </div>
                </div>

                {/* Main container */}
                <div className="grid grid-cols-1 lg:grid-cols-5 h-full flex-1">
                    {/* Left panel - Resguardos table */}
                    <div className="flex-1 min-w-0 flex flex-col p-4 lg:col-span-3">
                        {/* Search */}
                        <div className="mb-6 bg-gradient-to-br from-gray-900/50 to-blue-900/10 p-4 rounded-xl border border-gray-800 shadow-inner">
                            <div className="flex flex-col gap-4">
                                <div className="relative flex-grow">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-blue-400/80" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Buscar por folio..."
                                        className="pl-10 pr-4 py-3 w-full bg-black border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-500/50"
                                    />
                                </div>

                                <div className="flex justify-between items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={resetSearch}
                                            disabled={!searchTerm}
                                            className={`px-4 py-2 bg-black border border-gray-800 text-gray-400 rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2 text-sm ${!searchTerm ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500/50 hover:text-blue-300'}`}
                                        >
                                            <X className="h-4 w-4" />
                                            Limpiar búsqueda
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedResguardo(null);
                                            setPdfData(null);
                                            fetchResguardos();
                                        }}
                                        className="px-4 py-2 bg-gradient-to-r from-blue-900/30 to-blue-800/20 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm hover:border-blue-500/50 hover:text-blue-300"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                        Actualizar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Filtro avanzado */}
                        <div className="mb-6 bg-gradient-to-br from-gray-900/50 to-purple-900/10 p-4 rounded-xl border border-gray-800 shadow-inner">
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
                                        className="w-full bg-black border border-gray-800 rounded-lg text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-500/50"
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
                                        className="w-full bg-black border border-gray-800 rounded-lg text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">
                                        Filtrar por resguardante
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Nombre del resguardante..."
                                        value={filterResguardante}
                                        onChange={e => {
                                            setCurrentPage(1);
                                            setFilterResguardante(e.target.value);
                                        }}
                                        className="w-full bg-black border border-gray-800 rounded-lg text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-500/50"
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
                                    className="px-4 py-2 bg-black border border-gray-800 text-gray-400 rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2 text-sm hover:border-blue-500/50 hover:text-blue-300"
                                >
                                    <X className="h-4 w-4" />
                                    Limpiar filtros
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-gradient-to-br from-gray-900/30 to-blue-900/10 rounded-xl border border-gray-800 overflow-x-auto overflow-y-auto mb-6 flex flex-col flex-grow shadow-lg h-[40vh] max-h-[78vh]">
                            <div className="flex-grow min-w-[800px]">
                                <table className="min-w-full divide-y divide-gray-800">
                                    <thead className="bg-black sticky top-0 z-10">
                                        <tr>
                                            <th
                                                onClick={() => handleSort('folio')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900 transition-colors group"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Folio
                                                    <ArrowUpDown className={`h-3.5 w-3.5 ${sortField === 'folio' ? 'text-blue-400 animate-bounce' : 'text-gray-500 group-hover:text-blue-300'}`} />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('f_resguardo')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900 transition-colors group"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Fecha
                                                    <ArrowUpDown className={`h-3.5 w-3.5 ${sortField === 'f_resguardo' ? 'text-blue-400 animate-bounce' : 'text-gray-500 group-hover:text-blue-300'}`} />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('dir_area')}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-900 transition-colors group"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Director
                                                    <ArrowUpDown className={`h-3.5 w-3.5 ${sortField === 'dir_area' ? 'text-blue-400 animate-bounce' : 'text-gray-500 group-hover:text-blue-300'}`} />
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
                                                            className="px-4 py-2 bg-black text-blue-300 rounded-lg text-sm hover:bg-gray-900 transition-colors border border-gray-800 hover:border-blue-500/50"
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
                                                                className="px-4 py-2 bg-black text-blue-400 rounded-lg text-sm hover:bg-gray-900 transition-colors flex items-center gap-2 border border-gray-800 hover:border-blue-500/50"
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
                                                const itemCount = getArticuloCount(resguardo.folio);
                                                // Color azul más fuerte según cantidad
                                                let bgColor = 'bg-blue-900/20';
                                                if (itemCount >= 10) bgColor = 'bg-blue-700/60';
                                                else if (itemCount >= 5) bgColor = 'bg-blue-800/40';

                                                return (
                                                    <tr
                                                        key={resguardo.folio}
                                                        className={`hover:bg-gray-900/50 cursor-pointer transition-colors group ${selectedResguardo?.folio === resguardo.folio ? 'bg-blue-900/10 border-l-4 border-blue-500' : ''}`}
                                                        onClick={() => fetchResguardoDetails(resguardo.folio)}
                                                    >
                                                        <td className="px-4 py-4">
                                                            <div className="text-sm font-medium text-blue-400 flex items-center gap-2 group-hover:text-blue-300 transition-colors">
                                                                <FileDigit className="h-4 w-4" />
                                                                {resguardo.folio}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="text-sm text-white group-hover:text-blue-200 transition-colors">
                                                                {resguardo.f_resguardo.slice(0, 10).split('-').reverse().join('/')}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 group relative">
                                                            <div className="text-sm text-white hover:text-blue-400 transition-colors">
                                                                {resguardo.dir_area}
                                                            </div>
                                                            <div className="text-xs text-gray-500">{resguardo.area_resguardo}</div>

                                                            {/* Si hay un filtro de resguardante activo, mostrar un indicador */}
                                                            {filterResguardante && (
                                                                <div className="mt-1">
                                                                    {Array.from(new Set(allResguardos
                                                                        .filter(r => r.folio === resguardo.folio && r.usufinal?.toLowerCase().includes(filterResguardante.toLowerCase()))
                                                                        .map(r => r.usufinal)))
                                                                        .map((matchedResguardante, idx) => (
                                                                            <div
                                                                                key={idx}
                                                                                className="inline-flex items-center px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs mr-1 mb-1"
                                                                            >
                                                                                {matchedResguardante}
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            )}

                                                            {/* Tooltip con los resguardantes (mantener el existente) */}
                                                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-max max-w-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999]">
                                                                <div className="absolute left-1/2 -top-2 -translate-x-1/2 border-8 border-transparent border-b-gray-800"></div>
                                                                <div className="bg-black border border-gray-800 rounded-lg shadow-xl p-4">
                                                                    <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                                                        <User className="h-4 w-4 text-blue-400" />
                                                                        Resguardantes
                                                                    </h4>
                                                                    <div className="flex flex-col gap-2">
                                                                        {Array.from(new Set(allResguardos
                                                                            .filter(r => r.folio === resguardo.folio)
                                                                            .map(r => r.usufinal || 'Sin asignar')))
                                                                            .map((resguardante, idx) => (
                                                                                <div
                                                                                    key={idx}
                                                                                    className="flex items-center gap-2 text-sm text-gray-400 bg-gray-900/50 px-2 py-1 rounded-lg w-full"
                                                                                >
                                                                                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                                                                    {resguardante}
                                                                                </div>
                                                                            ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-800 text-blue-100 ${bgColor} group-hover:bg-blue-700/50 transition-colors`}>
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
                            <div className="flex items-center justify-between bg-gradient-to-br from-gray-900/30 to-blue-900/10 p-4 rounded-xl border border-gray-800 shadow-inner mb-4">
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
                                        className="bg-black border border-gray-800 rounded-lg text-white text-sm py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-500/50"
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
                                        className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-600 bg-black cursor-not-allowed' : 'text-white bg-black hover:bg-gray-900 border border-gray-800 hover:border-blue-500/50 transition-colors'}`}
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button
                                        title='Siguiente'
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage >= totalPages}
                                        className={`p-2 rounded-lg ${currentPage >= totalPages ? 'text-gray-600 bg-black cursor-not-allowed' : 'text-white bg-black hover:bg-gray-900 border border-gray-800 hover:border-blue-500/50 transition-colors'}`}
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right panel - Details */}
                    <div ref={detailRef} className="flex-1 bg-black p-4 border-t lg:border-t-0 lg:border-l border-gray-800 flex flex-col lg:col-span-2">
                        <div className="bg-gradient-to-br from-gray-900/30 to-purple-900/10 rounded-xl border border-gray-800 p-4 mb-4 shadow-inner">
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
                                            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Resguardantes</label>
                                            <div className="flex flex-wrap gap-2">
                                                {Array.from(new Set(selectedResguardo.articulos.map(a => a.resguardante || 'Sin asignar'))).map((resguardante, idx) => {
                                                    // Paleta de colores pastel bonitos
                                                    const colorPalette = [
                                                        'from-pink-500/80 to-pink-400/80 border-pink-400 text-pink-100',
                                                        'from-blue-500/80 to-blue-400/80 border-blue-400 text-blue-100',
                                                        'from-green-500/80 to-green-400/80 border-green-400 text-green-100',
                                                        'from-yellow-500/80 to-yellow-400/80 border-yellow-400 text-yellow-900',
                                                        'from-purple-500/80 to-purple-400/80 border-purple-400 text-purple-100',
                                                        'from-fuchsia-500/80 to-fuchsia-400/80 border-fuchsia-400 text-fuchsia-100',
                                                        'from-cyan-500/80 to-cyan-400/80 border-cyan-400 text-cyan-900',
                                                        'from-orange-500/80 to-orange-400/80 border-orange-400 text-orange-900',
                                                        'from-rose-500/80 to-rose-400/80 border-rose-400 text-rose-100',
                                                        'from-emerald-500/80 to-emerald-400/80 border-emerald-400 text-emerald-100',
                                                    ];
                                                    const color = colorPalette[idx % colorPalette.length];
                                                    return (
                                                        <span
                                                            key={idx}
                                                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${color} border shadow-md transition-all duration-200 hover:scale-105 tracking-tight`}
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
                                        onClick={() => setShowPDFButton(true)}
                                        className="mt-6 w-full py-2.5 bg-gradient-to-r from-blue-600/30 to-blue-500/20 border border-blue-800 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/20"
                                    >
                                        <Download className="h-4 w-4" />
                                        Generar PDF
                                    </button>
                                    <RoleGuard roles={["admin", "superadmin"]} userRole={userRole}>
                                        <button
                                            onClick={() => setShowDeleteAllModal(true)}
                                            className="mt-2 w-full py-2.5 bg-gradient-to-r from-red-900/30 to-red-800/20 border border-red-800 text-red-300 rounded-lg hover:bg-red-900/40 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/20"
                                        >
                                            <XOctagon className="h-4 w-4" />
                                            Borrar resguardo
                                        </button>
                                    </RoleGuard>
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
                        <div className="bg-gradient-to-br from-gray-900/30 to-purple-900/10 rounded-xl border border-gray-800 flex-grow shadow-inner flex flex-col overflow-hidden">
                            {/* Título fijo */}
                            <div className="p-4 bg-black/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-20 flex items-center justify-between">
                                <h2 className="text-lg font-medium text-gray-100 flex items-center gap-2">
                                    <ListChecks className="h-5 w-5 text-blue-400" />
                                    Artículos del Resguardo ({selectedResguardo?.articulos.length || 0})
                                </h2>
                                {selectedResguardo && (
                                    <RoleGuard roles={["admin", "superadmin"]} userRole={userRole}>
                                        <button
                                            title={editResguardanteMode ? 'Cancelar edición' : 'Editar resguardantes'}
                                            onClick={() => setEditResguardanteMode(e => !e)}
                                            className={`ml-2 p-2 rounded-lg border border-blue-800 bg-blue-900/20 text-blue-300 hover:bg-blue-800/30 transition-all duration-300 hover:scale-110 flex items-center gap-1 ${editResguardanteMode ? 'ring-2 ring-blue-400' : ''}`}
                                        >
                                            <Pencil className="h-4 w-4" />
                                            <span className="hidden sm:inline text-xs">{editResguardanteMode ? 'Cancelar' : 'Editar'}</span>
                                        </button>
                                    </RoleGuard>
                                )}
                            </div>
                            {/* Contenido scrolleable */}
                            <div className="flex-1 overflow-y-auto p-4 max-h-[70vh]">
                                {selectedResguardo ? (
                                    <>
                                        {/* Botones de acciones para selección múltiple */}
                                        {selectedArticulos.length > 0 && (
                                            <div className="flex justify-end items-center gap-2 mb-4 overflow-auto">
                                                <RoleGuard roles={["admin", "superadmin"]} userRole={userRole}>
                                                    <button
                                                        className="px-4 py-2 bg-gradient-to-r from-red-700 to-red-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:from-red-800 hover:to-red-600 border border-red-900/50 transition-all duration-300 hover:scale-[1.02] shadow-lg"
                                                        onClick={() => setShowDeleteSelectedModal(true)}
                                                    >
                                                        <XOctagon className="h-4 w-4" />
                                                        Eliminar seleccionados ({selectedArticulos.length})
                                                    </button>
                                                </RoleGuard>
                                                <button
                                                    className="px-3 py-2 bg-gray-800 text-gray-200 rounded-lg text-xs font-medium flex items-center gap-2 hover:bg-gray-700 border border-gray-700 transition-colors"
                                                    onClick={() => setSelectedArticulos([])}
                                                >
                                                    <X className="h-4 w-4" />
                                                    Limpiar selección
                                                </button>
                                            </div>
                                        )}
                                        {/* Agrupar artículos por resguardante */}
                                        {Object.entries(
                                            selectedResguardo.articulos.reduce((groups: { [key: string]: ResguardoArticulo[] }, articulo) => {
                                                const resguardante = articulo.resguardante || 'Sin asignar';
                                                if (!groups[resguardante]) {
                                                    groups[resguardante] = [];
                                                }
                                                groups[resguardante].push(articulo);
                                                return groups;
                                            }, {})
                                        ).map(([resguardante, articulos]) => (
                                            <div key={resguardante} className="mb-8 rounded-xl bg-gradient-to-br from-gray-950 to-blue-900/70 shadow-sm border border-violet-900/10">
                                                {/* Cabecera minimalista */}
                                                <div className="flex items-center justify-between px-6 py-3 bg-transparent border-b border-violet-900/10">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-5 w-5 text-blue-300/80" />
                                                        <span className="font-medium text-violet-100 text-sm tracking-wide">{resguardante}</span>
                                                        <span className="ml-2 text-xs text-violet-100/50">{articulos.length} artículo{articulos.length !== 1 ? 's' : ''}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setPdfData({
                                                                folio: selectedResguardo.folio,
                                                                // Corregir fecha para evitar desfase por zona horaria
                                                                fecha: (() => {
                                                                    const [year, month, day] = selectedResguardo.f_resguardo.slice(0, 10).split('-').map(Number);
                                                                    return new Date(year, month - 1, day).toLocaleDateString();
                                                                })(),
                                                                director: selectedResguardo.dir_area,
                                                                area: selectedResguardo.area_resguardo || '',
                                                                puesto: selectedResguardo.puesto,
                                                                resguardante: resguardante,
                                                                articulos: articulos.map(art => ({
                                                                    id_inv: art.num_inventario,
                                                                    descripcion: art.descripcion,
                                                                    rubro: art.rubro,
                                                                    estado: art.condicion,
                                                                    origen: art.origen,
                                                                    resguardante: art.resguardante
                                                                }))
                                                            });
                                                            setShowPDFButton(true);
                                                        }}
                                                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-800/10 hover:bg-blue-700/20 text-blue-200 text-xs font-normal border border-blue-800/10 transition-all duration-300 hover:scale-105 shadow-none"
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                        <span className="hidden sm:inline">PDF</span>
                                                    </button>
                                                </div>
                                                {/* Lista simple tipo list-group minimalista */}
                                                <ul className="divide-y divide-blue-900/10 bg-black">
                                                    {articulos.map((articulo, index) => (
                                                        <li
                                                            key={`${selectedResguardo.folio}-${index}`}
                                                            className={`flex items-start gap-4 px-6 py-3 transition-all duration-200 ${selectedArticulos.includes(articulo.num_inventario)
                                                                ? 'bg-blue-900/10' : 'hover:bg-blue-900/5'
                                                                }`}
                                                        >
                                                            <div
                                                                onClick={() => toggleArticuloSelection(articulo.num_inventario)}
                                                                className={`flex items-center justify-center w-5 h-5 rounded border cursor-pointer transition-all duration-200 mt-1 mr-2 ${selectedArticulos.includes(articulo.num_inventario)
                                                                    ? 'bg-black border-blue-400'
                                                                    : 'border-blue-700/30 hover:blue-400 hover:bg-blue-500/10'
                                                                    }`}
                                                                title="Seleccionar artículo"
                                                            >
                                                                {selectedArticulos.includes(articulo.num_inventario) && (
                                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="text-sm font-medium text-white truncate">{articulo.num_inventario}</span>
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-normal border ${articulo.condicion === 'B' ? 'bg-green-900/10 text-green-200 border border-green-900/20' :
                                                                        articulo.condicion === 'R' ? 'bg-yellow-900/10 text-yellow-200 border border-yellow-900/20' :
                                                                            articulo.condicion === 'M' ? 'bg-red-900/10 text-red-200 border border-red-900/20' :
                                                                                'bg-gray-900/10 text-gray-300 border-gray-900/20'
                                                                        }`}>{articulo.condicion}</span>
                                                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-normal border ${articulo.origen === 'INEA' ? 'bg-blue-900/10 text-blue-200 border-blue-700/20' :
                                                                        articulo.origen === 'ITEA' ? 'bg-pink-900/10 text-pink-200 border-pink-700/20' :
                                                                            'bg-gray-900/10 text-gray-400 border-gray-800/20'
                                                                        }`}>{articulo.origen}</span>
                                                                </div>
                                                                <div className="text-xs text-gray-300 mt-1">{articulo.descripcion}</div>
                                                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                                    <Briefcase className="h-3 w-3" />
                                                                    {articulo.rubro}
                                                                </div>
                                                                {/* Input de edición de resguardante */}
                                                                {editResguardanteMode ? (
                                                                    <div className="mt-3 flex items-center gap-2">
                                                                        <input
                                                                            type="text"
                                                                            value={editedResguardantes[articulo.id] || ''}
                                                                            onChange={e => setEditedResguardantes(prev => ({ ...prev, [articulo.id]: e.target.value }))}
                                                                            placeholder="Resguardante (opcional)"
                                                                            className="block w-full bg-gray-900/50 border border-gray-800 rounded-lg py-1.5 px-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-500/50"
                                                                        />
                                                                        {editedResguardantes[articulo.id] && (
                                                                            <button
                                                                                title="Limpiar resguardante"
                                                                                onClick={() => setEditedResguardantes(prev => ({ ...prev, [articulo.id]: '' }))}
                                                                                className="p-1 rounded-full text-gray-400 hover:text-red-400 hover:bg-gray-900/40 transition-colors"
                                                                            >
                                                                                <X className="h-4 w-4" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="mt-3 text-xs text-blue-200 flex items-center gap-2">
                                                                        <User className="h-3.5 w-3.5 text-blue-400" />
                                                                        {articulo.resguardante || <span className="italic text-gray-500">Sin asignar</span>}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <RoleGuard roles={["admin", "superadmin"]} userRole={userRole}>
                                                                <button
                                                                    title="Eliminar artículo"
                                                                    onClick={() => setShowDeleteItemModal({ index, articulo })}
                                                                    className="p-1 text-gray-400 hover:text-red-400 rounded-full hover:bg-gray-900/30 self-center ml-auto btn-delete-articulo transition-colors"
                                                                >
                                                                    <CircleX className="h-4 w-4" />
                                                                </button>
                                                            </RoleGuard>
                                                        </li>
                                                    ))}
                                                </ul>
                                                {/* Guardar/cancelar edición */}
                                                {editResguardanteMode && (
                                                    <div className="flex justify-end items-center gap-2 px-6 py-2 bg-transparent border-t border-violet-900/10">
                                                        <button
                                                            className="px-4 py-2 bg-black border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-900 transition-colors text-sm hover:border-blue-500/50"
                                                            onClick={() => setEditResguardanteMode(false)}
                                                            disabled={savingResguardantes}
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium hover:from-blue-500 hover:to-blue-400 transition-all duration-300 hover:scale-[1.02] shadow-lg text-sm"
                                                            onClick={handleSaveResguardantes}
                                                            disabled={savingResguardantes}
                                                        >
                                                            {savingResguardantes ? 'Guardando...' : 'Guardar cambios'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </>
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
                            className="ml-4 flex-shrink-0 p-1 rounded-full text-red-200 hover:text-white hover:bg-red-800 transition-colors"
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
                                <div className="p-3 bg-green-500/10 rounded-full border border-green-500/30 mb-3 animate-pulse">
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
                                <button
                                    onClick={handleGeneratePDF}
                                    disabled={generatingPDF}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-black font-medium rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-green-500/30"
                                >
                                    <Download className="h-4 w-4" />
                                    {generatingPDF ? 'Generando PDF...' : 'Descargar PDF'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para PDF de baja */}
            {showPDFBajaButton && pdfBajaData && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 animate-fadeIn">
                    <div className="bg-black rounded-2xl shadow-2xl border border-red-600/30 w-full max-w-md overflow-hidden transition-all duration-300 transform">
                        <div className="relative p-6 bg-gradient-to-b from-black to-gray-900">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/60 via-red-400 to-red-500/60"></div>

                            <button
                                onClick={() => {
                                    setShowPDFBajaButton(false);
                                    setPdfBajaData(null);
                                }}
                                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-gray-900 text-red-400 hover:text-red-500 border border-red-500/30 transition-colors"
                                title="Cerrar"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="p-3 bg-red-500/10 rounded-full border border-red-500/30 mb-3 animate-pulse">
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

                                <div className="w-full">
                                    <button
                                        onClick={async () => {
                                            if (pdfBajaData) {
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
                                                const { generateBajaPDF } = await import('./BajaPDFReport');
                                                await generateBajaPDF({
                                                    data: pdfData,
                                                    columns,
                                                    title,
                                                    fileName,
                                                    firmas,
                                                    encabezado: {
                                                        ...pdfBajaData,
                                                        articulos: pdfBajaData.articulos.map(articulo => ({
                                                            ...articulo,
                                                            resguardante: articulo.resguardante || ''
                                                        }))
                                                    }
                                                });
                                                setShowPDFBajaButton(false);
                                                setPdfBajaData(null);
                                            }
                                        }}
                                        className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-medium hover:from-red-500 hover:to-red-400 transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-red-500/30"
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

            {/* Modal de confirmación para borrar TODO el resguardo */}
            {showDeleteAllModal && selectedResguardo && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 animate-fadeIn">
                    <div className="bg-black rounded-2xl shadow-2xl border border-red-600/30 w-full max-w-md overflow-hidden transition-all duration-300 transform">
                        <div className="relative p-6 bg-gradient-to-b from-black to-gray-900">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/60 via-red-400 to-red-500/60"></div>
                            <button
                                onClick={() => setShowDeleteAllModal(false)}
                                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-gray-900 text-red-400 hover:text-red-500 border border-red-500/30 transition-colors"
                                title="Cerrar"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="p-3 bg-red-500/10 rounded-full border border-red-500/30 mb-3 animate-pulse">
                                    <XOctagon className="h-8 w-8 text-red-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">¿Borrar todo el resguardo?</h3>
                                <p className="text-gray-400 mt-2">
                                    Esta acción eliminará <b>todos los artículos</b> del resguardo <span className="text-red-300 font-bold">{selectedResguardo.folio}</span> de la base de datos. ¿Desea continuar?
                                </p>
                            </div>
                            <div className="flex gap-3 w-full mt-2">
                                <button
                                    onClick={() => setShowDeleteAllModal(false)}
                                    className="flex-1 py-2 px-4 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors hover:border-blue-500/50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteAll}
                                    disabled={deleting}
                                    className="flex-1 py-2 px-4 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-lg hover:from-red-500 hover:to-red-400 transition-all transform hover:scale-[1.02] shadow-lg border border-red-700 disabled:opacity-60"
                                >
                                    {deleting ? 'Eliminando...' : 'Borrar todo'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación para borrar un solo artículo */}
            {showDeleteItemModal && selectedResguardo && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 animate-fadeIn">
                    <div className="bg-black rounded-2xl shadow-2xl border border-red-600/30 w-full max-w-md overflow-hidden transition-all duration-300 transform">
                        <div className="relative p-6 bg-gradient-to-b from-black to-gray-900">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/60 via-red-400 to-red-500/60"></div>
                            <button
                                onClick={() => setShowDeleteItemModal(null)}
                                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-gray-900 text-red-400 hover:text-red-500 border border-red-500/30 transition-colors"
                                title="Cerrar"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="p-3 bg-red-500/10 rounded-full border border-red-500/30 mb-3 animate-pulse">
                                    <CircleX className="h-8 w-8 text-red-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">¿Eliminar este artículo?</h3>
                                <p className="text-gray-400 mt-2">
                                    El artículo <span className="text-red-300 font-bold">{showDeleteItemModal.articulo.num_inventario}</span> será eliminado del resguardo <span className="text-red-300 font-bold">{selectedResguardo.folio}</span>.
                                </p>
                            </div>
                            <div className="flex gap-3 w-full mt-2">
                                <button
                                    onClick={() => setShowDeleteItemModal(null)}
                                    className="flex-1 py-2 px-4 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors hover:border-blue-500/50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleDeleteItem(showDeleteItemModal.articulo)}
                                    disabled={deleting}
                                    className="flex-1 py-2 px-4 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-lg hover:from-red-500 hover:to-red-400 transition-all transform hover:scale-[1.02] shadow-lg border border-red-700 disabled:opacity-60"
                                >
                                    {deleting ? 'Eliminando...' : 'Eliminar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación para borrar varios artículos seleccionados */}
            {showDeleteSelectedModal && selectedResguardo && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 animate-fadeIn">
                    <div className="bg-black rounded-2xl shadow-2xl border border-red-600/30 w-full max-w-md overflow-hidden transition-all duration-300 transform">
                        <div className="relative p-6 bg-gradient-to-b from-black to-gray-900">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/60 via-red-400 to-red-500/60"></div>
                            <button
                                onClick={() => setShowDeleteSelectedModal(false)}
                                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-gray-900 text-red-400 hover:text-red-500 border border-red-500/30 transition-colors"
                                title="Cerrar"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="p-3 bg-red-500/10 rounded-full border border-red-500/30 mb-3 animate-pulse">
                                    <XOctagon className="h-8 w-8 text-red-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">¿Eliminar artículos seleccionados?</h3>
                                <p className="text-gray-400 mt-2">
                                    Se eliminarán <b>{selectedArticulos.length}</b> artículos del resguardo <span className="text-red-300 font-bold">{selectedResguardo.folio}</span>:
                                </p>
                                <ul className="text-left mt-4 max-h-40 overflow-y-auto w-full text-sm text-gray-200">
                                    {selectedResguardo.articulos.filter(a => selectedArticulos.includes(a.num_inventario)).map(a => (
                                        <li key={a.num_inventario} className="mb-1 flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-red-400" />
                                            <span className="font-mono">{a.num_inventario}</span> - {a.descripcion}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex gap-3 w-full mt-2">
                                <button
                                    onClick={() => setShowDeleteSelectedModal(false)}
                                    className="flex-1 py-2 px-4 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors hover:border-blue-500/50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteSelected}
                                    disabled={deleting}
                                    className="flex-1 py-2 px-4 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-lg hover:from-red-500 hover:to-red-400 transition-all transform hover:scale-[1.02] shadow-lg border border-red-700 disabled:opacity-60"
                                >
                                    {deleting ? 'Eliminando...' : 'Eliminar seleccionados'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}