"use client"
import { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { Calendar, Save, AlertTriangle, CheckCircle, X, ChevronRight, ChevronLeft, Camera, Eye, User, AlertCircle, RefreshCw } from 'lucide-react';
import supabase from "@/app/lib/supabase/client";
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/context/ThemeContext';

// Tipos dinámicos basados en los valores de la base de datos
type Estado = string;
type Estatus = string;
type Institucion = 'INEA' | 'ITEA';

interface FormData {
    id_inv: string;
    rubro: string;
    descripcion: string;
    valor: string;
    f_adq: string;
    formadq: string;
    proveedor: string;
    factura: string;
    ubicacion_es: string;
    ubicacion_mu: string;
    ubicacion_no: string;
    estado: Estado;
    estatus: Estatus;
    area: string;
    usufinal: string;
    fechabaja: string;
    causadebaja: string;
    resguardante: string;
    image_path: string;
}

interface FilterOptions {
    estados: string[];
    estatus: string[];
    areas: string[];
    rubros: string[];
    formasAdquisicion: string[];
    causasBaja: string[];
    usuarios: { nombre: string; area: string }[];
}

interface Message {
    type: 'success' | 'error' | '';
    text: string;
}

interface Directorio {
    id_directorio: number;
    nombre: string;
    area: string | null;
    puesto: string | null;
}

export default function RegistroBienesForm() {
    // Estados principales
    const { isDarkMode } = useTheme();
    const [institucion, setInstitucion] = useState<Institucion>('INEA');
    const [formData, setFormData] = useState<FormData>({
        id_inv: '',
        rubro: '',
        descripcion: '',
        valor: '',
        f_adq: '',
        formadq: '',
        proveedor: '',
        factura: '',
        ubicacion_es: '',
        ubicacion_mu: '',
        ubicacion_no: '',
        estado: '',
        estatus: '',
        area: '',
        usufinal: '',
        fechabaja: '',
        causadebaja: '',
        resguardante: '',
        image_path: '',
    });

    // Estados para el modal del director
    const [showDirectorModal, setShowDirectorModal] = useState(false);
    const [incompleteDirector, setIncompleteDirector] = useState<Directorio | null>(null);
    const [directorFormData, setDirectorFormData] = useState({ area: '' });
    const [savingDirector, setSavingDirector] = useState(false);
    const [directorio, setDirectorio] = useState<Directorio[]>([]);

    // Estados para áreas y relaciones N:M
    const [areas, setAreas] = useState<{ id_area: number; nombre: string }[]>([]);
    const [directorAreasMap, setDirectorAreasMap] = useState<{ [id_directorio: number]: number[] }>({});
    const [showAreaSelectModal, setShowAreaSelectModal] = useState(false);
    const [areaOptionsForDirector, setAreaOptionsForDirector] = useState<{ id_area: number; nombre: string }[]>([]);

    // Resto de estados
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [message, setMessage] = useState<Message>({ type: '', text: '' });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        estados: [],
        estatus: [],
        areas: [],
        rubros: [],
        formasAdquisicion: ['Compra', 'Donación', 'Transferencia', 'Comodato'],
        causasBaja: ['Obsolescencia', 'Daño irreparable', 'Robo o extravío', 'Transferencia', 'Donación'],
        usuarios: []
    });

    const imageFileRef = useRef<File | null>(null);
    const { createNotification } = useNotifications();

    // Helper function for input styling
    const getInputClasses = (fieldName: string, hasError: boolean = false) => {
        const baseClasses = "w-full border rounded-lg p-2 sm:p-3 focus:ring focus:ring-opacity-50 transition-all text-sm sm:text-base placeholder-gray-400";
        const errorClasses = hasError ? "border-red-500" : "";
        const themeClasses = isDarkMode
            ? "bg-black border-gray-700 text-white focus:border-white focus:ring-gray-700 placeholder-gray-500"
            : "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-200 placeholder-gray-400";

        return `${baseClasses} ${errorClasses} ${themeClasses}`;
    };

    const getLabelClasses = () => {
        return `block mb-1 text-sm sm:text-base font-medium transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-gray-700'
            }`;
    };

    // Función para obtener el directorio
    const fetchDirectorio = useCallback(async () => {
        try {
            const { data: directorioData } = await supabase.from('directorio').select('*');
            setDirectorio(directorioData || []);

            // Actualizar la lista de usuarios en filterOptions
            if (directorioData) {
                const usuarios = directorioData.map(item => ({
                    nombre: item.nombre?.trim().toUpperCase() || '',
                    area: item.area?.trim().toUpperCase() || ''
                }));

                setFilterOptions(prev => ({
                    ...prev,
                    usuarios: usuarios
                }));
            }
        } catch (err) {
            console.error('Error al cargar directorio:', err);
        }
    }, []);

    useEffect(() => {
        // Cargar directorio
        fetchDirectorio();
        // Cargar áreas y relaciones N:M
        async function fetchAreasAndRelations() {
            const { data: areasData } = await supabase.from('area').select('*').order('nombre');
            setAreas(areasData || []);
            const { data: rels } = await supabase.from('directorio_areas').select('*');
            if (rels) {
                const map: { [id_directorio: number]: number[] } = {};
                rels.forEach((rel: { id_directorio: number; id_area: number }) => {
                    if (!map[rel.id_directorio]) map[rel.id_directorio] = [];
                    map[rel.id_directorio].push(rel.id_area);
                });
                setDirectorAreasMap(map);
            }
        }
        fetchAreasAndRelations();
    }, [fetchDirectorio]);

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
            setIncompleteDirector(selected);
            setShowAreaSelectModal(true);
            return;
        }
        // Si solo tiene una área, asignar directo
        setFormData(prev => ({
            ...prev,
            usufinal: nombre,
            area: areasForDirector[0].nombre
        }));
    };

    // Función para guardar la información del director
    const saveDirectorInfo = async () => {
        if (!incompleteDirector) return;

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

            // Actualizar filterOptions.usuarios
            const updatedUsuarios = updatedDirectorio.map(item => ({
                nombre: item.nombre?.trim().toUpperCase() || '',
                area: item.area?.trim().toUpperCase() || ''
            }));

            setFilterOptions(prev => ({
                ...prev,
                usuarios: updatedUsuarios
            }));

            // Actualizar formulario
            setFormData(prev => ({
                ...prev,
                usufinal: incompleteDirector.nombre,
                area: directorFormData.area
            }));

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

    const fetchFilterOptions = useCallback(async () => {
        try {
            // Función auxiliar para obtener datos únicos de una tabla
            const fetchUniqueValues = async (table: string, column: string) => {
                const { data } = await supabase
                    .from(table)
                    .select(column)
                    .not(column, 'is', null);

                return data?.map((item) =>
                    (item[column as keyof typeof item] as string)?.trim().toUpperCase()
                ).filter(Boolean) || [];
            };

            // Obtener valores de la tabla config
            const fetchConfigValues = async (tipo: string) => {
                const { data } = await supabase
                    .from('config')
                    .select('concepto')
                    .eq('tipo', tipo);

                return data?.map(item => item.concepto?.trim().toUpperCase()).filter(Boolean) || [];
            };

            // Obtener estados únicos de ambas tablas
            const estadosMuebles = await fetchUniqueValues('muebles', 'estado');
            const estadosMueblesItea = await fetchUniqueValues('mueblesitea', 'estado');
            const estadosUnicos = [...new Set([...estadosMuebles, ...estadosMueblesItea])];

            // Obtener estatus desde la tabla config
            const estatusConfig = await fetchConfigValues('estatus');

            // Si hay valores en la tabla config, usarlos; de lo contrario, usar los de las tablas de muebles
            const estatusUnicos = estatusConfig.length > 0
                ? estatusConfig
                : [...new Set([
                    ...(await fetchUniqueValues('muebles', 'estatus')),
                    ...(await fetchUniqueValues('mueblesitea', 'estatus'))
                ])];

            // Obtener rubros desde la tabla config
            const rubrosConfig = await fetchConfigValues('rubro');
            const rubrosUnicos = rubrosConfig.length > 0
                ? rubrosConfig
                : [...new Set(await fetchUniqueValues('mueblesitea', 'rubro'))];

            // Obtener formas de adquisición desde la tabla config
            const formasConfig = await fetchConfigValues('formadq');
            const formasAdquisicion = formasConfig.length > 0
                ? formasConfig
                : ['Compra', 'Donación', 'Transferencia', 'Comodato'];

            // Obtener áreas desde la tabla areas
            const { data: areasData } = await supabase
                .from('areas')
                .select('itea')
                .not('itea', 'is', null);

            const areasUnicas = [...new Set(
                areasData?.map(item => item.itea?.trim().toUpperCase()).filter(Boolean) || []
            )];

            setFilterOptions(prev => ({
                ...prev,
                estados: estadosUnicos,
                estatus: estatusUnicos,
                areas: areasUnicas,
                rubros: rubrosUnicos,
                formasAdquisicion: formasAdquisicion,
                causasBaja: prev.causasBaja // Mantener los valores predeterminados para causas de baja
            }));

            // Establecer valores por defecto
            setFormData(prev => ({
                ...prev,
                estado: estadosUnicos.includes('BUENO') ? 'BUENO' : estadosUnicos[0] || '',
                estatus: estatusUnicos.includes('ACTIVO') ? 'ACTIVO' : estatusUnicos[0] || ''
            }));

        } catch (error) {
            console.error('Error al cargar opciones de filtro:', error);
        }
    }, []);

    useEffect(() => {
        fetchFilterOptions();
    }, [fetchFilterOptions]);

    // Manejador para subir imágenes
    const uploadImage = async (muebleId: number): Promise<string | null> => {
        if (!imageFileRef.current) return null;

        try {
            const bucketName = institucion === 'INEA' ? 'muebles.inea' : 'muebles.itea';
            const fileExt = imageFileRef.current.name.split('.').pop();
            const fileName = `${muebleId}/image.${fileExt}`;

            const { error } = await supabase.storage
                .from(bucketName)
                .upload(fileName, imageFileRef.current, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) throw error;
            return fileName;
        } catch (error) {
            console.error('Error subiendo imagen:', error);
            return null;
        }
    };

    // Manejador de envío del formulario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const tableName = institucion === 'INEA' ? 'muebles' : 'mueblesitea';

            // Preparar datos para guardar (convertir a mayúsculas y limpiar valor)
            const dataToSave = {
                ...formData,
                id_inv: formData.id_inv.toUpperCase(),
                rubro: formData.rubro.toUpperCase(),
                descripcion: formData.descripcion.toUpperCase(),
                valor: formData.valor.replace(/[^\d.]/g, ''), // Eliminar todo excepto números y punto decimal
                formadq: formData.formadq.toUpperCase(),
                proveedor: formData.proveedor.toUpperCase(),
                factura: formData.factura.toUpperCase(),
                ubicacion_es: formData.ubicacion_es.toUpperCase(),
                ubicacion_mu: formData.ubicacion_mu.toUpperCase(),
                ubicacion_no: formData.ubicacion_no.toUpperCase(),
                estado: formData.estado.toUpperCase(),
                estatus: formData.estatus.toUpperCase(),
                area: formData.area.toUpperCase(),
                usufinal: formData.usufinal.toUpperCase(),
                causadebaja: formData.causadebaja.toUpperCase(),
                resguardante: formData.resguardante.toUpperCase(),
                f_adq: formData.f_adq || null,
                fechabaja: formData.fechabaja || null
            };

            // Insertar datos principales
            const { data, error } = await supabase
                .from(tableName)
                .insert([dataToSave])
                .select();

            if (error) throw error;

            // Subir imagen si existe
            if (imageFileRef.current && data?.[0]?.id) {
                const imagePath = await uploadImage(data[0].id);
                if (imagePath) {
                    await supabase
                        .from(tableName)
                        .update({ image_path: imagePath })
                        .eq('id', data[0].id);
                }
            }

            setMessage({
                type: 'success',
                text: `Bien registrado correctamente en ${institucion}`
            });

            // Notificación de registro exitoso
            await createNotification({
                title: `Nuevo bien registrado (${institucion})`,
                description: `Se registró el bien "${formData.descripcion}" con ID ${formData.id_inv} en el área "${formData.area}".`,
                type: 'success',
                category: 'inventario',
                device: 'web',
                importance: 'medium',
                data: { changes: [`Registro de bien: ${formData.id_inv}`], affectedTables: [tableName] }
            });

            resetForm();
        } catch (error) {
            console.error('Error al guardar:', error);
            setMessage({
                type: 'error',
                text: "Error al guardar el registro. Intente nuevamente."
            });

            // Notificación de error
            await createNotification({
                title: 'Error al registrar bien',
                description: 'Ocurrió un error al guardar el registro de un bien.',
                type: 'danger',
                category: 'inventario',
                device: 'web',
                importance: 'high',
                data: { affectedTables: [institucion === 'INEA' ? 'muebles' : 'mueblesitea'] }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Si es el campo de director/jefe de área, llamar a handleSelectDirector
        if (name === 'usufinal') {
            handleSelectDirector(value.toUpperCase());
        } else {
            // Forzar mayúsculas para inputs de texto y textarea
            let newValue = value;
            if (
                e.target.tagName === 'INPUT' ||
                e.target.tagName === 'TEXTAREA'
            ) {
                newValue = value.toUpperCase();
            }
            setFormData(prev => ({ ...prev, [name]: newValue }));
            setTouched(prev => ({ ...prev, [name]: true }));
        }
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            imageFileRef.current = file;
            setFormData(prev => ({ ...prev, image_path: file.name }));

            const reader = new FileReader();
            reader.onload = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleCurrencyChange = (e: ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^\d.-]/g, '');
        setFormData(prev => ({ ...prev, valor: raw }));
    };

    const resetForm = () => {
        setFormData({
            id_inv: '',
            rubro: '',
            descripcion: '',
            valor: '',
            f_adq: '',
            formadq: '',
            proveedor: '',
            factura: '',
            ubicacion_es: '',
            ubicacion_mu: '',
            ubicacion_no: '',
            estado: filterOptions.estados.includes('BUENO') ? 'BUENO' : filterOptions.estados[0] || '',
            estatus: filterOptions.estatus.includes('ACTIVO') ? 'ACTIVO' : filterOptions.estatus[0] || '',
            area: '',
            usufinal: '',
            fechabaja: '',
            causadebaja: '',
            resguardante: '',
            image_path: '',
        });
        setImagePreview(null);
        imageFileRef.current = null;
        setCurrentStep(1);
        setTouched({});
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    // Funciones auxiliares...
    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
    const handleCloseMessage = () => setMessage({ type: '', text: '' });

    const requiredFields = {
        1: ['id_inv', 'rubro', 'valor', 'formadq', 'f_adq'],
        2: ['estatus', 'area', 'usufinal'],
        3: ['descripcion']
    };

    const isStepComplete = (step: number): boolean => {
        return requiredFields[step as keyof typeof requiredFields]
            .every(field => formData[field as keyof FormData]?.trim() !== '');
    };

    const formatCurrency = (value: string): string => {
        const num = parseFloat(value.replace(/[^\d.-]/g, ''));
        return isNaN(num) ? '' : new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(num);
    };

    useEffect(() => {
        const formSections = document.querySelectorAll('.form-section');
        formSections.forEach((section, index) => {
            section.classList.toggle('active', index + 1 === currentStep);
        });
    }, [currentStep, isDarkMode]);

    const isFieldValid = (fieldName: string): boolean => {
        if (!touched[fieldName]) return true;
        return Object.values(requiredFields)
            .flat()
            .includes(fieldName)
            ? formData[fieldName as keyof FormData]?.trim() !== ''
            : true;
    };

    return (
        <div className={`min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 transition-colors duration-500 flex items-center justify-center ${isDarkMode ? 'bg-black text-white' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
            }`}>
            <div className={`w-full max-w-7xl mx-auto rounded-lg sm:rounded-xl shadow-2xl overflow-hidden transition-all duration-500 transform border flex flex-col h-[85vh] min-h-[600px] ${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
                }`}>
                {/* Header con título */}
                <div className={`p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b gap-2 sm:gap-0 transition-colors duration-500 flex-shrink-0 ${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
                    }`}>
                    <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold flex items-center transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        <span className={`mr-2 sm:mr-3 p-1 sm:p-2 rounded-lg border text-sm sm:text-base transition-colors duration-500 ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-gray-100 text-gray-900 border-gray-300'
                            }`}>INV</span>
                        Registro de Bienes
                    </h1>
                    <div className="flex space-x-2 self-end sm:self-auto">
                        <div className={`h-2 sm:h-3 w-2 sm:w-3 rounded-full transition-colors duration-500 ${currentStep >= 1
                            ? (isDarkMode ? 'bg-white' : 'bg-blue-600')
                            : (isDarkMode ? 'bg-gray-700' : 'bg-gray-300')
                            }`}></div>
                        <div className={`h-2 sm:h-3 w-2 sm:w-3 rounded-full transition-colors duration-500 ${currentStep >= 2
                            ? (isDarkMode ? 'bg-white' : 'bg-blue-600')
                            : (isDarkMode ? 'bg-gray-700' : 'bg-gray-300')
                            }`}></div>
                        <div className={`h-2 sm:h-3 w-2 sm:w-3 rounded-full transition-colors duration-500 ${currentStep >= 3
                            ? (isDarkMode ? 'bg-white' : 'bg-blue-600')
                            : (isDarkMode ? 'bg-gray-700' : 'bg-gray-300')
                            }`}></div>
                    </div>
                </div>

                {/* Mensajes de notificación */}
                {message.text && (
                    <div className={`mx-2 sm:mx-4 md:mx-6 mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg flex items-center justify-between transition-all duration-500 animate-fadeIn border ${message.type === 'success'
                        ? (isDarkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200')
                        : (isDarkMode ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200')
                        }`}>
                        <div className="flex items-center">
                            {message.type === 'success' ?
                                <CheckCircle className={`mr-2 sm:mr-3 ${isDarkMode ? 'text-green-400' : 'text-green-600'
                                    }`} size={20} /> :
                                <AlertTriangle className={`mr-2 sm:mr-3 ${isDarkMode ? 'text-red-400' : 'text-red-600'
                                    }`} size={20} />
                            }
                            <span className={`font-medium text-sm sm:text-base ${message.type === 'success'
                                ? (isDarkMode ? 'text-green-100' : 'text-green-800')
                                : (isDarkMode ? 'text-red-100' : 'text-red-800')
                                }`}>{message.text}</span>
                        </div>
                        <button
                            onClick={handleCloseMessage}
                            className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-black' : 'hover:bg-gray-100'
                                }`}
                            title='Cerrar'
                        >
                            <X size={16} className={
                                message.type === 'success'
                                    ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                    : (isDarkMode ? 'text-red-400' : 'text-red-600')
                            } />
                        </button>
                    </div>
                )}

                {/* Pasos del formulario */}
                <div className={`hidden sm:flex justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-2 border-b transition-colors duration-500 flex-shrink-0 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'
                    }`}>
                    <div
                        className={`flex items-center cursor-pointer transition-colors duration-500 ${currentStep === 1
                            ? (isDarkMode ? 'text-white' : 'text-blue-600')
                            : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                            }`}
                        onClick={() => setCurrentStep(1)}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 border transition-colors duration-500 ${currentStep === 1
                            ? (isDarkMode ? 'bg-gray-700 border-white' : 'bg-blue-600 border-blue-600 text-white')
                            : (isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-300')
                            }`}>1</div>
                        <span>Información Básica</span>
                    </div>
                    <div
                        className={`flex items-center cursor-pointer transition-colors duration-500 ${currentStep === 2
                            ? (isDarkMode ? 'text-white' : 'text-blue-600')
                            : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                            }`}
                        onClick={() => isStepComplete(1) && setCurrentStep(2)}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 border transition-colors duration-500 ${currentStep === 2
                            ? (isDarkMode ? 'bg-gray-700 border-white' : 'bg-blue-600 border-blue-600 text-white')
                            : (isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-300')
                            }`}>2</div>
                        <span>Ubicación y Estado</span>
                    </div>
                    <div
                        className={`flex items-center cursor-pointer transition-colors duration-500 ${currentStep === 3
                            ? (isDarkMode ? 'text-white' : 'text-blue-600')
                            : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                            }`}
                        onClick={() => isStepComplete(1) && isStepComplete(2) && setCurrentStep(3)}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 border transition-colors duration-500 ${currentStep === 3
                            ? (isDarkMode ? 'bg-gray-700 border-white' : 'bg-blue-600 border-blue-600 text-white')
                            : (isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-300')
                            }`}>3</div>
                        <span>Detalles Adicionales</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    {/* Contenedor con scroll para los inputs */}
                    <div className={`px-2 sm:px-4 md:px-6 py-4 sm:py-6 overflow-y-scroll transition-colors duration-500 ${isDarkMode ? 'bg-black scrollbar-thumb-gray-600 scrollbar-track-gray-800' : 'bg-white scrollbar-thumb-gray-400 scrollbar-track-gray-100'}`} style={{ height: '50vh', minHeight: '200px', maxHeight: '50vh' }}>
                        {/* Paso 1: Información Básica */}
                        <div className={`form-section transition-all duration-500 ${currentStep === 1 ? 'block' : 'hidden'}`}>
                            <h2 className={`text-lg sm:text-xl font-semibold mb-4 sm:mb-6 border-b pb-2 transition-colors duration-500 ${isDarkMode ? 'text-white border-gray-800' : 'text-gray-900 border-gray-200'
                                }`}>Información Básica del Bien</h2>

                            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-2 sm:space-y-4">
                                    <div>
                                        <label className={`block mb-1 text-sm sm:text-base font-medium transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-gray-700'
                                            }`}>ID Inventario <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="id_inv"
                                            value={formData.id_inv}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`w-full border rounded-lg p-2 sm:p-3 focus:ring focus:ring-opacity-50 transition-all text-sm sm:text-base placeholder-gray-400 ${isDarkMode
                                                ? 'bg-black border-gray-700 text-white focus:border-white focus:ring-gray-700 placeholder-gray-500'
                                                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-200 placeholder-gray-400'
                                                } ${!isFieldValid('id_inv') ? 'border-red-500' : ''}`}
                                            required
                                            placeholder="Ej. INV-2023-001"
                                        />
                                        {!isFieldValid('id_inv') && (
                                            <p className="text-red-500 text-xs sm:text-sm mt-1">Este campo es obligatorio</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={`block mb-1 text-sm sm:text-base font-medium transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-gray-700'
                                            }`}>Rubro <span className="text-red-500">*</span></label>
                                        <select
                                            name="rubro"
                                            value={formData.rubro}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            title='Seleccionar Rubro'
                                            className={`w-full border rounded-lg p-2 sm:p-3 focus:ring focus:ring-opacity-50 transition-all text-sm sm:text-base ${isDarkMode
                                                ? 'bg-black border-gray-700 text-white focus:border-white focus:ring-gray-700'
                                                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-200'
                                                } ${!isFieldValid('rubro') ? 'border-red-500' : ''}`}
                                            required
                                        >
                                            <option value="">Seleccionar Rubro</option>
                                            {filterOptions.rubros.map((rubro, index) => (
                                                <option key={index} value={rubro}>{rubro}</option>
                                            ))}
                                        </select>
                                        {!isFieldValid('rubro') && (
                                            <p className="text-red-500 text-xs sm:text-sm mt-1">Este campo es obligatorio</p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2 sm:space-y-4">
                                    <div>
                                        <label className={`block mb-1 text-sm sm:text-base font-medium transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-gray-700'
                                            }`}>Valor <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <span className={`absolute left-3 top-2 sm:top-3 transition-colors duration-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                }`}>$</span>
                                            <input
                                                type="text"
                                                name="valor"
                                                value={formData.valor}
                                                onChange={handleCurrencyChange}
                                                onBlur={(e) => {
                                                    handleBlur(e);
                                                    const formatted = formData.valor ? formatCurrency(formData.valor) : '';
                                                    setFormData(prev => ({ ...prev, valor: formatted.replace('MX$', '').trim() }));
                                                }}
                                                className={`w-full border rounded-lg p-2 sm:p-3 pl-8 focus:ring focus:ring-opacity-50 transition-all text-sm sm:text-base placeholder-gray-400 ${isDarkMode
                                                    ? 'bg-black border-gray-700 text-white focus:border-white focus:ring-gray-700 placeholder-gray-500'
                                                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-200 placeholder-gray-400'
                                                    } ${!isFieldValid('valor') ? 'border-red-500' : ''}`}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {!isFieldValid('valor') && (
                                            <p className="text-red-500 text-xs sm:text-sm mt-1">Este campo es obligatorio</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={getLabelClasses()}>Forma de Adquisición <span className="text-red-500">*</span></label>
                                        <select
                                            name="formadq"
                                            title='Seleccionar Forma de Adquisición'
                                            value={formData.formadq}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            required
                                            className={getInputClasses('formadq', !isFieldValid('formadq'))}
                                        >
                                            <option value="">Seleccionar</option>
                                            {filterOptions.formasAdquisicion.map((forma, index) => (
                                                <option key={index} value={forma}>{forma}</option>
                                            ))}
                                        </select>
                                        {!isFieldValid('formadq') && (
                                            <p className="text-red-500 text-xs sm:text-sm mt-1">Este campo es obligatorio</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 sm:space-y-4">
                                    <div>
                                        <label className={getLabelClasses()}>Fecha de Adquisición <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                name="f_adq"
                                                title='Seleccionar Fecha de Adquisición'
                                                value={formData.f_adq}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                required
                                                className={getInputClasses('f_adq', !isFieldValid('f_adq'))}
                                            />
                                            <Calendar className={`absolute right-3 top-2 sm:top-3 transition-colors duration-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                }`} size={18} />
                                        </div>
                                        {!isFieldValid('f_adq') && (
                                            <p className="text-red-500 text-xs sm:text-sm mt-1">Este campo es obligatorio</p>
                                        )}
                                    </div>

                                    <div className="flex space-x-2 sm:space-x-3">
                                        <div className="flex-1">
                                            <label className={getLabelClasses()}>Proveedor</label>
                                            <input
                                                type="text"
                                                name="proveedor"
                                                value={formData.proveedor}
                                                onChange={handleChange}
                                                className={getInputClasses('proveedor')}
                                                placeholder="Nombre del proveedor"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className={getLabelClasses()}>Factura</label>
                                            <input
                                                type="text"
                                                name="factura"
                                                value={formData.factura}
                                                onChange={handleChange}
                                                className={getInputClasses('factura')}
                                                placeholder="No. de factura"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Paso 2: Ubicación y Estado */}
                        <div className={`form-section transition-all duration-500 ${currentStep === 2 ? 'block' : 'hidden'}`}>
                            <h2 className={`text-lg sm:text-xl font-semibold mb-4 sm:mb-6 border-b pb-2 transition-colors duration-500 ${isDarkMode ? 'text-white border-gray-800' : 'text-gray-900 border-gray-200'
                                }`}>Ubicación y Estado del Bien</h2>

                            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-2 sm:space-y-4">
                                    <div className={`p-3 sm:p-4 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'bg-black border-gray-800' : 'bg-gray-50 border-gray-200'
                                        }`}>
                                        <h3 className={`text-base sm:text-lg font-medium mb-2 sm:mb-3 transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>Ubicación Actual</h3>

                                        <div className="mb-2 sm:mb-3">
                                            <label className={getLabelClasses()}>Estado</label>
                                            <input
                                                type="text"
                                                name="ubicacion_es"
                                                value={formData.ubicacion_es}
                                                onChange={handleChange}
                                                maxLength={2}
                                                className={getInputClasses('ubicacion_es')}
                                                placeholder="Clave (2 caracteres)"
                                            />
                                        </div>

                                        <div className="mb-2 sm:mb-3">
                                            <label className={getLabelClasses()}>Municipio</label>
                                            <input
                                                type="text"
                                                name="ubicacion_mu"
                                                value={formData.ubicacion_mu}
                                                onChange={handleChange}
                                                maxLength={2}
                                                className={getInputClasses('ubicacion_mu')}
                                                placeholder="Clave (2 caracteres)"
                                            />
                                        </div>

                                        <div>
                                            <label className={getLabelClasses()}>Nomenclatura</label>
                                            <input
                                                type="text"
                                                name="ubicacion_no"
                                                value={formData.ubicacion_no}
                                                onChange={handleChange}
                                                maxLength={2}
                                                className={getInputClasses('ubicacion_no')}
                                                placeholder="Clave (2 caracteres)"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 sm:space-y-4">
                                    <div className={`p-3 sm:p-4 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'bg-black border-gray-800' : 'bg-gray-50 border-gray-200'
                                        }`}>
                                        <h3 className={`text-base sm:text-lg font-medium mb-2 sm:mb-3 transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>Condiciones</h3>

                                        <div className="mb-2 sm:mb-3">
                                            <label className={getLabelClasses()}>Estado Físico <span className="text-red-500">*</span></label>
                                            <select
                                                title='Seleccionar Estado Físico'
                                                name="estado"
                                                value={formData.estado}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                required
                                                className={getInputClasses('estado', !isFieldValid('estado'))}
                                            >
                                                <option value="">Seleccionar Estado</option>
                                                {filterOptions.estados.map((estado, index) => (
                                                    <option key={index} value={estado}>{estado}</option>
                                                ))}
                                            </select>
                                            {!isFieldValid('estado') && (
                                                <p className="text-red-500 text-xs sm:text-sm mt-1">Este campo es obligatorio</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className={getLabelClasses()}>Estatus <span className="text-red-500">*</span></label>
                                            <select
                                                name="estatus"
                                                title='Seleccionar Estatus'
                                                value={formData.estatus}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                required
                                                className={getInputClasses('estatus', !isFieldValid('estatus'))}
                                            >
                                                <option value="">Seleccionar Estatus</option>
                                                {filterOptions.estatus.map((estatus, index) => (
                                                    <option key={index} value={estatus}>{estatus}</option>
                                                ))}
                                            </select>
                                            {!isFieldValid('estatus') && (
                                                <p className="text-red-500 text-xs sm:text-sm mt-1">Este campo es obligatorio</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className={getLabelClasses()}>
                                            Área <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            title='Área'
                                            type="text"
                                            name="area"
                                            value={formData.area}
                                            readOnly
                                            required
                                            onBlur={handleBlur}
                                            className={`${getInputClasses('area', !isFieldValid('area'))} cursor-not-allowed`}
                                        />
                                        {!isFieldValid('area') && (
                                            <p className="text-red-500 text-xs sm:text-sm mt-1">Este campo es obligatorio</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 sm:space-y-4">
                                    <div>
                                        <label className={getLabelClasses()}>Director/Jefe de Área<span className="text-red-500">*</span></label>
                                        <select
                                            title='Seleccionar Director/Jefe de Área'
                                            name="usufinal"
                                            value={formData.usufinal}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={getInputClasses('usufinal', !isFieldValid('usufinal'))}
                                            required
                                        >
                                            <option value="">Seleccionar Director/Jefe de Área</option>
                                            {filterOptions.usuarios.map((usuario, index) => (
                                                <option key={index} value={usuario.nombre}>{usuario.nombre}</option>
                                            ))}
                                        </select>
                                        {!isFieldValid('usufinal') && (
                                            <p className="text-red-500 text-xs sm:text-sm mt-1">Este campo es obligatorio</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={getLabelClasses()}>Usuario Final</label>
                                        <input
                                            type="text"
                                            name="resguardante"
                                            value={formData.resguardante}
                                            onChange={handleChange}
                                            className={getInputClasses('resguardante')}
                                            placeholder="Persona que Usará el Bien"
                                        />
                                    </div>

                                    {formData.estatus === 'BAJA' && (
                                        <div className={`p-3 sm:p-4 rounded-lg border transition-colors duration-500 ${isDarkMode ? 'bg-black border-gray-700' : 'bg-red-50 border-red-200'
                                            }`}>
                                            <h3 className={`text-base sm:text-lg font-medium mb-2 sm:mb-3 transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-red-900'
                                                }`}>Información de Baja</h3>

                                            <div className="mb-2 sm:mb-3">
                                                <label className={getLabelClasses()}>Fecha de Baja</label>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        name="fechabaja"
                                                        title='Seleccionar Fecha de Baja'
                                                        value={formData.fechabaja}
                                                        onChange={handleChange}
                                                        className={getInputClasses('fechabaja')}
                                                    />
                                                    <Calendar className={`absolute right-3 top-2 sm:top-3 transition-colors duration-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                        }`} size={18} />
                                                </div>
                                            </div>

                                            <div>
                                                <label className={getLabelClasses()}>Causa de Baja</label>
                                                <select
                                                    name="causadebaja"
                                                    value={formData.causadebaja}
                                                    onChange={handleChange}
                                                    title='Seleccionar Causa de Baja'
                                                    className={getInputClasses('causadebaja')}
                                                >
                                                    <option value="">Seleccionar</option>
                                                    {filterOptions.causasBaja.map((causa, index) => (
                                                        <option key={index} value={causa}>{causa}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Paso 3: Detalles Adicionales */}
                        <div className={`form-section transition-all duration-500 ${currentStep === 3 ? 'block' : 'hidden'}`}>
                            <h2 className={`text-lg sm:text-xl font-semibold mb-4 sm:mb-6 border-b pb-2 transition-colors duration-500 ${isDarkMode ? 'text-white border-gray-800' : 'text-gray-900 border-gray-200'
                                }`}>Detalles Adicionales</h2>

                            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                                <div className="space-y-2 sm:space-y-4">
                                    <div>
                                        <label className={getLabelClasses()}>Descripción <span className="text-red-500">*</span></label>
                                        <textarea
                                            name="descripcion"
                                            value={formData.descripcion}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`${getInputClasses('descripcion', !isFieldValid('descripcion'))} h-32 sm:h-48`}
                                            placeholder="Descripción detallada del bien..."
                                            required
                                        ></textarea>
                                        {!isFieldValid('descripcion') && (
                                            <p className="text-red-500 text-xs sm:text-sm mt-1">Este campo es obligatorio</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={getLabelClasses()}>Institución</label>
                                        <select
                                            value={institucion}
                                            onChange={(e) => setInstitucion(e.target.value as Institucion)}
                                            title='Seleccionar Institución'
                                            className={getInputClasses('institucion')}
                                        >
                                            <option value="INEA">INEA</option>
                                            <option value="ITEA">ITEA</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2 sm:space-y-4">
                                    <div>
                                        <label className={getLabelClasses()}>Imagen del Bien</label>
                                        <div className={`border border-dashed rounded-lg p-3 sm:p-4 flex flex-col items-center justify-center transition-all cursor-pointer relative h-40 sm:h-48 ${isDarkMode
                                            ? 'border-gray-700 hover:border-white'
                                            : 'border-gray-300 hover:border-blue-500'
                                            }`}>
                                            <input
                                                type="file"
                                                title='Seleccionar Imagen'
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />

                                            {imagePreview ? (
                                                <div className="relative w-full h-full">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Vista previa"
                                                        className="w-full h-full object-contain rounded-lg"
                                                    />
                                                    <button
                                                        type="button"
                                                        title='Eliminar Imagen'
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setImagePreview(null);
                                                            setFormData(prev => ({ ...prev, image_path: '' }));
                                                        }}
                                                        className={`absolute top-2 right-2 rounded-full p-1 transition-all ${isDarkMode ? 'bg-black bg-opacity-70 hover:bg-opacity-100' : 'bg-white bg-opacity-70 hover:bg-opacity-100'
                                                            }`}
                                                    >
                                                        <X size={14} className={isDarkMode ? 'text-white' : 'text-gray-900'} />
                                                    </button>
                                                    <div className={`absolute bottom-0 left-0 right-0 p-1 sm:p-2 rounded-b-lg ${isDarkMode ? 'bg-black bg-opacity-70' : 'bg-white bg-opacity-70'
                                                        }`}>
                                                        <p className={`text-xs truncate text-center ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                            }`}>{formData.image_path}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <Camera size={28} className={`mb-1 sm:mb-2 transition-colors duration-500 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                                        }`} />
                                                    <p className={`text-center text-sm sm:text-base transition-colors duration-500 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                                        }`}>Haga clic o arrastre una imagen aquí</p>
                                                    <p className={`text-xs mt-1 text-center transition-colors duration-500 ${isDarkMode ? 'text-gray-600' : 'text-gray-500'
                                                        }`}>JPG, PNG o GIF (max. 5MB)</p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {imagePreview && (
                                        <div className="flex justify-center">
                                            <button
                                                type="button"
                                                className={`flex items-center text-xs sm:text-sm transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-blue-600'
                                                    }`}
                                            >
                                                <Eye size={14} className="mr-1" />
                                                Ver imagen a tamaño completo
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navegación entre pasos */}
                    <div className={`px-2 sm:px-4 md:px-6 py-4 sm:py-6 border-t flex-shrink-0 ${isDarkMode ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'}`}>
                        <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-0">
                            {currentStep > 1 ? (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className={`flex items-center justify-center px-3 sm:px-4 py-2 border rounded-lg transition-all text-sm sm:text-base ${isDarkMode
                                        ? 'bg-black border-gray-700 text-white hover:bg-gray-900'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <ChevronLeft size={16} className="mr-1" />
                                    Anterior
                                </button>
                            ) : (
                                <div></div>
                            )}

                            {currentStep < 3 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={!isStepComplete(currentStep)}
                                    className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg transition-all text-sm sm:text-base ${isStepComplete(currentStep)
                                        ? (isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700')
                                        : (isDarkMode ? 'bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed')
                                        }`}
                                >
                                    Siguiente
                                    <ChevronRight size={16} className="ml-1" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !isStepComplete(3)}
                                    className={`flex items-center justify-center px-4 sm:px-6 py-2 rounded-lg transition-all text-sm sm:text-base ${isSubmitting
                                        ? (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-400 text-gray-600')
                                        : isStepComplete(3)
                                            ? (isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700')
                                            : (isDarkMode ? 'bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed')
                                        }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className={`w-3 h-3 sm:w-4 sm:h-4 border-2 rounded-full animate-spin mr-2 ${isDarkMode ? 'border-gray-400 border-t-white' : 'border-gray-600 border-t-blue-600'
                                                }`}></div>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} className="mr-1 sm:mr-2" />
                                            Guardar Registro
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            {/* Modal para completar información del director */}
            {showDirectorModal && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 animate-fadeIn">
                    <div className={`rounded-2xl shadow-2xl border w-full max-w-md overflow-hidden transition-all duration-300 transform ${isDarkMode
                        ? 'bg-black border-yellow-600/30'
                        : 'bg-white border-yellow-400/40'
                        }`}>
                        <div className={`relative p-6 ${isDarkMode ? 'bg-gradient-to-b from-black to-gray-900' : 'bg-gradient-to-b from-white to-gray-50'
                            }`}>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500/60 via-yellow-400 to-yellow-500/60"></div>

                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="p-3 bg-yellow-500/10 rounded-full border border-yellow-500/30 mb-3">
                                    <AlertCircle className="h-8 w-8 text-yellow-500" />
                                </div>
                                <h3 className={`text-2xl font-bold transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>Información requerida</h3>
                                <p className={`mt-2 transition-colors duration-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    Por favor complete el área del director/jefe de área seleccionado
                                </p>
                            </div>

                            <div className="space-y-5 mt-6">
                                <div className={`rounded-lg border p-4 transition-colors duration-500 ${isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
                                    }`}>
                                    <label className={`block text-xs uppercase tracking-wider mb-1 transition-colors duration-500 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                        }`}>Director/Jefe seleccionado</label>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg transition-colors duration-500 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                                            }`}>
                                            <User className="h-4 w-4 text-yellow-400" />
                                        </div>
                                        <span className={`font-medium transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>{incompleteDirector?.nombre || 'Director'}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className={`flex items-center gap-2 text-sm font-medium mb-2 transition-colors duration-500 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                        }`}>
                                        <User className={`h-4 w-4 transition-colors duration-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
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
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-200'
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

                        <div className={`p-5 border-t flex justify-end gap-3 transition-colors duration-500 ${isDarkMode ? 'bg-black border-gray-800' : 'bg-gray-50 border-gray-200'
                            }`}>
                            <button
                                onClick={() => setShowDirectorModal(false)}
                                className={`px-5 py-2.5 rounded-lg text-sm border transition-colors flex items-center gap-2 ${isDarkMode
                                    ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-800'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                                    }`}
                            >
                                <X className="h-4 w-4" />
                                Cancelar
                            </button>
                            <button
                                onClick={saveDirectorInfo}
                                disabled={savingDirector || !directorFormData.area}
                                className={`px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all duration-300 ${savingDirector || !directorFormData.area
                                    ? (isDarkMode ? 'bg-gray-900 text-gray-500 cursor-not-allowed border border-gray-800' : 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-300')
                                    : 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-medium hover:shadow-lg hover:shadow-yellow-500/20'
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
            )}

            {/* Modal de selección de área para directores con varias áreas */}
            {showAreaSelectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className={`border rounded-2xl shadow-2xl min-w-[360px] max-w-md w-full relative animate-fadeIn overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
                        }`}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/60 via-blue-400 to-blue-500/60"></div>
                        <div className="p-6 relative">
                            <button
                                title='Cerrar'
                                onClick={() => setShowAreaSelectModal(false)}
                                className={`absolute top-3 right-3 p-1 rounded-full transition-colors ${isDarkMode
                                    ? 'bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <X size={18} />
                            </button>
                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/30 mb-3">
                                    <User className="h-8 w-8 text-blue-400" />
                                </div>
                                <h3 className={`text-2xl font-bold transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>Seleccione el área correspondiente</h3>
                                <p className={`mt-2 transition-colors duration-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>El director/jefe seleccionado tiene varias áreas asignadas. Elija una para continuar.</p>
                            </div>
                            <div className="flex flex-col gap-3 mt-4">
                                {areaOptionsForDirector.map((area) => (
                                    <button
                                        key={area.id_area}
                                        className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-medium ${isDarkMode
                                            ? 'bg-gray-900/70 border-gray-800 text-gray-200 hover:border-blue-500 hover:bg-gray-900 hover:text-blue-300'
                                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700'
                                            }`}
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                usufinal: incompleteDirector?.nombre || '',
                                                area: area.nombre
                                            }));
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

            {/* Estilos CSS adicionales */}
            <style jsx>{`
                .form-section {
                    opacity: 0;
                    transform: translateX(20px);
                    transition: opacity 0.5s ease, transform 0.5s ease;
                }
                
                .form-section.active {
                    opacity: 1;
                    transform: translateX(0);
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }

                select {
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    appearance: none;
                    background-repeat: no-repeat;
                    background-position: right 0.75rem center;
                    background-size: 1rem;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                }

                /* Scrollbar styling */
                .scrollbar-thin {
                    scrollbar-width: thin;
                }
                
                .scrollbar-thin::-webkit-scrollbar {
                    width: 6px;
                }
                
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: ${isDarkMode ? '#374151' : '#f3f4f6'};
                    border-radius: 3px;
                }
                
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: ${isDarkMode ? '#6b7280' : '#9ca3af'};
                    border-radius: 3px;
                }
                
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: ${isDarkMode ? '#9ca3af' : '#6b7280'};
                }
            `}</style>
        </div>
    );
}