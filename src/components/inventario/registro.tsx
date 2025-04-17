"use client"
import { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { Calendar, Save, AlertTriangle, CheckCircle, X, ChevronRight, ChevronLeft, Camera, Eye } from 'lucide-react';
import supabase from "@/app/lib/supabase/client";

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

export default function RegistroBienesForm() {
    // Estados
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

            // Obtener estados únicos de ambas tablas
            const estadosMuebles = await fetchUniqueValues('muebles', 'estado');
            const estadosMueblesItea = await fetchUniqueValues('mueblesitea', 'estado');
            const estadosUnicos = [...new Set([...estadosMuebles, ...estadosMueblesItea])];

            // Obtener estatus únicos de ambas tablas
            const estatusMuebles = await fetchUniqueValues('muebles', 'estatus');
            const estatusMueblesItea = await fetchUniqueValues('mueblesitea', 'estatus');
            const estatusUnicos = [...new Set([...estatusMuebles, ...estatusMueblesItea])];

            // Obtener rubros únicos (solo de mueblesitea como antes)
            const rubrosUnicos = [...new Set(
                (await fetchUniqueValues('mueblesitea', 'rubro'))
            )];

            // Obtener áreas desde la tabla areas
            const { data: areasData } = await supabase
                .from('areas')
                .select('itea')
                .not('itea', 'is', null);

            const areasUnicas = [...new Set(
                areasData?.map(item => item.itea?.trim().toUpperCase()).filter(Boolean) || []
            )];

            // Obtener usuarios desde la tabla directorio
            const { data: usuariosData } = await supabase
                .from('directorio')
                .select('nombre, area')
                .not('nombre', 'is', null);

            const usuarios = usuariosData?.map(item => ({
                nombre: item.nombre?.trim().toUpperCase() || '',
                area: item.area?.trim().toUpperCase() || ''
            })) || [];

            setFilterOptions(prev => ({
                ...prev,
                estados: estadosUnicos,
                estatus: estatusUnicos,
                areas: areasUnicas,
                rubros: rubrosUnicos,
                usuarios: usuarios
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

            resetForm();
        } catch (error) {
            console.error('Error al guardar:', error);
            setMessage({
                type: 'error',
                text: "Error al guardar el registro. Intente nuevamente."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setTouched(prev => ({ ...prev, [name]: true }));
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

    // Funciones auxiliares...
    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
    const handleCloseMessage = () => setMessage({ type: '', text: '' });

    const requiredFields = {
        1: ['id_inv', 'rubro', 'valor'],
        2: ['ubicacion_es', 'ubicacion_mu', 'usufinal'],
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

    const handleCurrencyChange = (e: ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^\d.-]/g, '');
        setFormData(prev => ({ ...prev, valor: raw }));
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    const isFieldValid = (fieldName: string): boolean => {
        if (!touched[fieldName]) return true;
        return Object.values(requiredFields)
            .flat()
            .includes(fieldName)
            ? formData[fieldName as keyof FormData]?.trim() !== ''
            : true;
    };

    useEffect(() => {
        const formSections = document.querySelectorAll('.form-section');
        formSections.forEach((section, index) => {
            section.classList.toggle('active', index + 1 === currentStep);
        });
    }, [currentStep]);

    return (
        <div className="bg-black text-white min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
            <div className="w-full mx-auto bg-black rounded-lg sm:rounded-xl shadow-2xl overflow-hidden transition-all duration-500 transform border border-gray-800">
                {/* Header con título */}
                <div className="bg-black p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 gap-2 sm:gap-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
                        <span className="mr-2 sm:mr-3 bg-gray-900 text-white p-1 sm:p-2 rounded-lg border border-gray-700 text-sm sm:text-base">INV</span>
                        Registro de Bienes
                    </h1>
                    <div className="flex space-x-2 self-end sm:self-auto">
                        <div className={`h-2 sm:h-3 w-2 sm:w-3 rounded-full ${currentStep >= 1 ? 'bg-white' : 'bg-gray-700'}`}></div>
                        <div className={`h-2 sm:h-3 w-2 sm:w-3 rounded-full ${currentStep >= 2 ? 'bg-white' : 'bg-gray-700'}`}></div>
                        <div className={`h-2 sm:h-3 w-2 sm:w-3 rounded-full ${currentStep >= 3 ? 'bg-white' : 'bg-gray-700'}`}></div>
                    </div>
                </div>

                {/* Mensajes de notificación */}
                {message.text && (
                    <div className={`mx-2 sm:mx-4 md:mx-6 mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg flex items-center justify-between transition-all duration-500 animate-fadeIn ${message.type === 'success' ? 'bg-green-900' : 'bg-red-900'} border ${message.type === 'success' ? 'border-green-700' : 'border-red-700'}`}>
                        <div className="flex items-center">
                            {message.type === 'success' ?
                                <CheckCircle className="mr-2 sm:mr-3" size={20} /> :
                                <AlertTriangle className="mr-2 sm:mr-3" size={20} />
                            }
                            <span className="font-medium text-sm sm:text-base">{message.text}</span>
                        </div>
                        <button onClick={handleCloseMessage} className="p-1 rounded-full hover:bg-black transition-colors" title='Cerrar'>
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Pasos del formulario */}
                <div className="hidden sm:flex justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-2 border-b border-gray-800">
                    <div
                        className={`flex items-center cursor-pointer ${currentStep === 1 ? 'text-white' : 'text-gray-500'}`}
                        onClick={() => setCurrentStep(1)}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${currentStep === 1 ? 'bg-gray-700' : 'bg-gray-900'} border ${currentStep === 1 ? 'border-white' : 'border-gray-700'}`}>1</div>
                        <span>Información Básica</span>
                    </div>
                    <div
                        className={`flex items-center cursor-pointer ${currentStep === 2 ? 'text-white' : 'text-gray-500'}`}
                        onClick={() => isStepComplete(1) && setCurrentStep(2)}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${currentStep === 2 ? 'bg-gray-700' : 'bg-gray-900'} border ${currentStep === 2 ? 'border-white' : 'border-gray-700'}`}>2</div>
                        <span>Ubicación y Estado</span>
                    </div>
                    <div
                        className={`flex items-center cursor-pointer ${currentStep === 3 ? 'text-white' : 'text-gray-500'}`}
                        onClick={() => isStepComplete(1) && isStepComplete(2) && setCurrentStep(3)}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${currentStep === 3 ? 'bg-gray-700' : 'bg-gray-900'} border ${currentStep === 3 ? 'border-white' : 'border-gray-700'}`}>3</div>
                        <span>Detalles Adicionales</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-2 sm:px-4 md:px-6 py-4 sm:py-6">
                    {/* Paso 1: Información Básica */}
                    <div className={`form-section transition-all duration-500 ${currentStep === 1 ? 'block' : 'hidden'}`}>
                        <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-white border-b border-gray-800 pb-2">Información Básica del Bien</h2>

                        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-2 sm:space-y-4">
                                <div>
                                    <label className="block mb-1 text-sm sm:text-base font-medium">ID Inventario <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="id_inv"
                                        value={formData.id_inv}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`w-full bg-black border ${!isFieldValid('id_inv') ? 'border-red-500' : 'border-gray-700'} rounded-lg p-2 sm:p-3 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm sm:text-base`}
                                        required
                                        placeholder="Ej. INV-2023-001"
                                    />
                                    {!isFieldValid('id_inv') && (
                                        <p className="text-red-500 text-xs sm:text-sm mt-1">Este campo es obligatorio</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block mb-1 text-sm sm:text-base font-medium">Rubro <span className="text-red-500">*</span></label>
                                    <select
                                        name="rubro"
                                        value={formData.rubro}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        title='Seleccionar Rubro'
                                        className={`w-full bg-black border ${!isFieldValid('rubro') ? 'border-red-500' : 'border-gray-700'} rounded-lg p-2 sm:p-3 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm sm:text-base`}
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
                                    <label className="block mb-1 text-sm sm:text-base font-medium">Valor <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 sm:top-3 text-gray-400">$</span>
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
                                            className={`w-full bg-black border ${!isFieldValid('valor') ? 'border-red-500' : 'border-gray-700'} rounded-lg p-2 sm:p-3 pl-8 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm sm:text-base`}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {!isFieldValid('valor') && (
                                        <p className="text-red-500 text-xs sm:text-sm mt-1">Este campo es obligatorio</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block mb-1 text-sm sm:text-base font-medium">Forma de Adquisición</label>
                                    <select
                                        name="formadq"
                                        title='Seleccionar Forma de Adquisición'
                                        value={formData.formadq}
                                        onChange={handleChange}
                                        className="w-full bg-black border border-gray-700 rounded-lg p-2 sm:p-3 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm sm:text-base"
                                    >
                                        <option value="">Seleccionar</option>
                                        {filterOptions.formasAdquisicion.map((forma, index) => (
                                            <option key={index} value={forma}>{forma}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 sm:space-y-4">
                                <div>
                                    <label className="block mb-1 text-sm sm:text-base font-medium">Fecha de Adquisición</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            name="f_adq"
                                            title='Seleccionar Fecha de Adquisición'
                                            value={formData.f_adq}
                                            onChange={handleChange}
                                            className="w-full bg-black border border-gray-700 rounded-lg p-2 sm:p-3 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm sm:text-base"
                                        />
                                        <Calendar className="absolute right-3 top-2 sm:top-3 text-gray-400" size={18} />
                                    </div>
                                </div>

                                <div className="flex space-x-2 sm:space-x-3">
                                    <div className="flex-1">
                                        <label className="block mb-1 text-sm sm:text-base font-medium">Proveedor</label>
                                        <input
                                            type="text"
                                            name="proveedor"
                                            value={formData.proveedor}
                                            onChange={handleChange}
                                            className="w-full bg-black border border-gray-700 rounded-lg p-2 sm:p-3 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm sm:text-base"
                                            placeholder="Nombre del proveedor"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block mb-1 text-sm sm:text-base font-medium">Factura</label>
                                        <input
                                            type="text"
                                            name="factura"
                                            value={formData.factura}
                                            onChange={handleChange}
                                            className="w-full bg-black border border-gray-700 rounded-lg p-2 sm:p-3 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm sm:text-base"
                                            placeholder="No. de factura"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Paso 2: Ubicación y Estado */}
                    <div className={`form-section transition-all duration-500 ${currentStep === 2 ? 'block' : 'hidden'}`}>
                        <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-white border-b border-gray-800 pb-2">Ubicación y Estado del Bien</h2>

                        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-2 sm:space-y-4">
                                <div className="p-3 sm:p-4 bg-black rounded-lg border border-gray-800">
                                    <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 text-white">Ubicación Actual</h3>

                                    <div className="mb-2 sm:mb-3">
                                        <label className="block mb-1 text-sm sm:text-base font-medium">Estado <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="ubicacion_es"
                                            value={formData.ubicacion_es}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            maxLength={4}
                                            className={`w-full bg-black border ${!isFieldValid('ubicacion_es') ? 'border-red-500' : 'border-gray-700'} rounded-lg p-2 sm:p-3 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm sm:text-base`}
                                            placeholder="Clave del estado (4 caracteres)"
                                        />
                                        {!isFieldValid('ubicacion_es') && (
                                            <p className="text-red-500 text-xs sm:text-sm mt-1">Este campo es obligatorio</p>
                                        )}
                                    </div>

                                    <div className="mb-2 sm:mb-3">
                                        <label className="block mb-1 text-sm sm:text-base font-medium">Municipio <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            name="ubicacion_mu"
                                            value={formData.ubicacion_mu}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            maxLength={5}
                                            className={`w-full bg-black border ${!isFieldValid('ubicacion_mu') ? 'border-red-500' : 'border-gray-700'} rounded-lg p-2 sm:p-3 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm sm:text-base`}
                                            placeholder="Clave del municipio (5 caracteres)"
                                        />
                                        {!isFieldValid('ubicacion_mu') && (
                                            <p className="text-red-500 text-xs sm:text-sm mt-1">Este campo es obligatorio</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block mb-1 text-sm sm:text-base font-medium">Número de Ubicación</label>
                                        <input
                                            type="text"
                                            name="ubicacion_no"
                                            value={formData.ubicacion_no}
                                            onChange={handleChange}
                                            maxLength={10}
                                            className="w-full bg-black border border-gray-700 rounded-lg p-2 sm:p-3 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm sm:text-base"
                                            placeholder="Número identificador (10 caracteres máx.)"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 sm:space-y-4">
                                <div className="p-3 sm:p-4 bg-black rounded-lg border border-gray-800">
                                    <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 text-white">Condiciones</h3>

                                    <div className="mb-2 sm:mb-3">
                                        <label className="block mb-1 text-sm sm:text-base font-medium">Estado Físico</label>
                                        <select
                                            title='Seleccionar Estado Físico'
                                            name="estado"
                                            value={formData.estado}
                                            onChange={handleChange}
                                            className="w-full bg-black border border-gray-700 rounded-lg p-2 sm:p-3 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm sm:text-base"
                                        >
                                            <option value="">Seleccionar Estado</option>
                                            {filterOptions.estados.map((estado, index) => (
                                                <option key={index} value={estado}>{estado}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block mb-1 text-sm sm:text-base font-medium">Estatus</label>
                                        <select
                                            name="estatus"
                                            title='Seleccionar Estatus'
                                            value={formData.estatus}
                                            onChange={handleChange}
                                            className="w-full bg-black border border-gray-700 rounded-lg p-2 sm:p-3 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm sm:text-base"
                                        >
                                            <option value="">Seleccionar Estatus</option>
                                            {filterOptions.estatus.map((estatus, index) => (
                                                <option key={index} value={estatus}>{estatus}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block mb-1 text-sm sm:text-base font-medium">Área</label>
                                    <select
                                        name="area"
                                        title='Seleccionar Área'
                                        value={formData.area}
                                        onChange={handleChange}
                                        className="w-full bg-black border border-gray-700 rounded-lg p-2 sm:p-3 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm sm:text-base"
                                    >
                                        <option value="">Seleccionar Área</option>
                                        {filterOptions.areas.map((area, index) => (
                                            <option key={index} value={area}>{area}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 sm:space-y-4">
                                <div>
                                    <label className="block mb-1 text-sm sm:text-base font-medium">Director/Jefe de Área<span className="text-red-500">*</span></label>
                                    <select
                                    title='Seleccionar Director/Jefe de Área'
                                        name="usufinal"
                                        value={formData.usufinal}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`w-full bg-black border ${!isFieldValid('usufinal') ? 'border-red-500' : 'border-gray-700'} rounded-lg p-2 sm:p-3 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm sm:text-base`}
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
                                    <label className="block mb-1 text-sm sm:text-base font-medium">Usuario Final</label>
                                    <input
                                        type="text"
                                        name="Usuario Final"
                                        value={formData.resguardante}
                                        onChange={handleChange}
                                        className="w-full bg-black border border-gray-700 rounded-lg p-2 sm:p-3 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm sm:text-base"
                                        placeholder="Persona que Usará el Bien"
                                    />
                                </div>

                                {formData.estatus === 'BAJA' && (
                                    <div className="p-3 sm:p-4 bg-black rounded-lg border border-gray-700">
                                        <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 text-white">Información de Baja</h3>

                                        <div className="mb-2 sm:mb-3">
                                            <label className="block mb-1 text-sm sm:text-base font-medium">Fecha de Baja</label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    name="fechabaja"
                                                    title='Seleccionar Fecha de Baja'
                                                    value={formData.fechabaja}
                                                    onChange={handleChange}
                                                    className="w-full bg-black border border-gray-700 rounded-lg p-2 sm:p-3 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm sm:text-base"
                                                />
                                                <Calendar className="absolute right-3 top-2 sm:top-3 text-gray-400" size={18} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block mb-1 text-sm sm:text-base font-medium">Causa de Baja</label>
                                            <select
                                                name="causadebaja"
                                                value={formData.causadebaja}
                                                onChange={handleChange}
                                                title='Seleccionar Causa de Baja'
                                                className="w-full bg-black border border-gray-700 rounded-lg p-2 sm:p-3 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm sm:text-base"
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
                        <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-white border-b border-gray-800 pb-2">Detalles Adicionales</h2>

                        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                            <div className="space-y-2 sm:space-y-4">
                                <div>
                                    <label className="block mb-1 text-sm sm:text-base font-medium">Descripción <span className="text-red-500">*</span></label>
                                    <textarea
                                        name="descripcion"
                                        value={formData.descripcion}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={`w-full bg-black border ${!isFieldValid('descripcion') ? 'border-red-500' : 'border-gray-700'} rounded-lg p-2 sm:p-3 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all h-32 sm:h-48 text-sm sm:text-base`}
                                        placeholder="Descripción detallada del bien..."
                                        required
                                    ></textarea>
                                    {!isFieldValid('descripcion') && (
                                        <p className="text-red-500 text-xs sm:text-sm mt-1">Este campo es obligatorio</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block mb-1 text-sm sm:text-base font-medium">Institución</label>
                                    <select
                                        value={institucion}
                                        onChange={(e) => setInstitucion(e.target.value as Institucion)}
                                        title='Seleccionar Institución'
                                        className="w-full bg-black border border-gray-700 rounded-lg p-2 sm:p-3 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm sm:text-base"
                                    >
                                        <option value="INEA">INEA</option>
                                        <option value="ITEA">ITEA</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 sm:space-y-4">
                                <div>
                                    <label className="block mb-1 text-sm sm:text-base font-medium">Imagen del Bien</label>
                                    <div className="border border-dashed border-gray-700 rounded-lg p-3 sm:p-4 flex flex-col items-center justify-center transition-all hover:border-white cursor-pointer relative h-40 sm:h-48">
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
                                                    className="absolute top-2 right-2 bg-black bg-opacity-70 rounded-full p-1 hover:bg-opacity-100 transition-all"
                                                >
                                                    <X size={14} />
                                                </button>
                                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-1 sm:p-2 rounded-b-lg">
                                                    <p className="text-xs truncate text-center">{formData.image_path}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <Camera size={28} className="text-gray-500 mb-1 sm:mb-2" />
                                                <p className="text-gray-500 text-center text-sm sm:text-base">Haga clic o arrastre una imagen aquí</p>
                                                <p className="text-gray-600 text-xs mt-1 text-center">JPG, PNG o GIF (max. 5MB)</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {imagePreview && (
                                    <div className="flex justify-center">
                                        <button
                                            type="button"
                                            className="flex items-center text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                                        >
                                            <Eye size={14} className="mr-1" />
                                            Ver imagen a tamaño completo
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Navegación entre pasos */}
                    <div className="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-0">
                        {currentStep > 1 ? (
                            <button
                                type="button"
                                onClick={prevStep}
                                className="flex items-center justify-center px-3 sm:px-4 py-2 bg-black border border-gray-700 rounded-lg hover:bg-gray-900 transition-all text-sm sm:text-base"
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
                                className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg transition-all text-sm sm:text-base ${isStepComplete(currentStep) ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-800 text-gray-400 cursor-not-allowed'}`}
                            >
                                Siguiente
                                <ChevronRight size={16} className="ml-1" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isSubmitting || !isStepComplete(3)}
                                className={`flex items-center justify-center px-4 sm:px-6 py-2 rounded-lg transition-all text-sm sm:text-base ${isSubmitting ? 'bg-gray-700 text-gray-300' : isStepComplete(3) ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-800 text-gray-400 cursor-not-allowed'}`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin mr-2"></div>
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
                </form>
            </div>

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
            `}</style>
        </div>
    );
}