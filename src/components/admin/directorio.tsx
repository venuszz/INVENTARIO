"use client"
import { useState, useCallback, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Plus, Trash2, Edit, AlertTriangle, CheckCircle, X, Search, RefreshCw, CheckSquare, XSquare } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import SectionRealtimeToggle from '@/components/SectionRealtimeToggle';
import { useAdminIndexation } from '@/hooks/indexation/useAdminIndexation';

interface Directorio {
    id_directorio: number;
    nombre: string | null;
    area: string | null;
    puesto: string | null;
}

interface Message {
    type: 'success' | 'error' | '';
    text: string;
}

export default function DirectorioManagementComponent() {
    const { isDarkMode } = useTheme();
    
    // Hook de indexación admin (reemplaza todos los fetch)
    const { 
        directorio: directorioFromStore, 
        areas: areasFromStore, 
        directorioAreas: directorioAreasFromStore,
        realtimeConnected,
        reindex 
    } = useAdminIndexation();
    
    // Estados locales
    const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [newEmployee, setNewEmployee] = useState<Directorio>({ id_directorio: 0, nombre: '', area: '', puesto: '' });
    const [editEmployee, setEditEmployee] = useState<Directorio>({ id_directorio: 0, nombre: '', area: '', puesto: '' });
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [message, setMessage] = useState<Message>({ type: '', text: '' });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    // NUEVO: Estado para áreas y relaciones (ahora vienen del hook)
    const [selectedAreas, setSelectedAreas] = useState<number[]>([]);
    const [editSelectedAreas, setEditSelectedAreas] = useState<number[]>([]);
    
    // Mapear directorioAreas a un objeto para fácil acceso
    const directorAreasMap = directorioAreasFromStore.reduce((acc, rel) => {
        if (!acc[rel.id_directorio]) acc[rel.id_directorio] = [];
        acc[rel.id_directorio].push(rel.id_area);
        return acc;
    }, {} as { [id_directorio: number]: number[] });

    // Estado para el valor del input de área (alta y edición)
    const [addAreaInput, setAddAreaInput] = useState('');
    const [editAreaInput, setEditAreaInput] = useState('');

    const addInputRef = useRef<HTMLInputElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);
    const { createNotification } = useNotifications();

    // Función para obtener el próximo ID disponible
    const getNextAvailableId = useCallback(() => {
        if (directorioFromStore.length === 0) return 1;
        const maxId = Math.max(...directorioFromStore.map(item => item.id_directorio));
        return maxId + 1;
    }, [directorioFromStore]);

    // Filtrar directorio según el término de búsqueda
    const filteredDirectorio = directorioFromStore.filter(item =>
        item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.puesto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id_directorio.toString().includes(searchTerm)
    );

    // Manejadores de eventos
    const handleAddNew = () => {
        setIsAddingNew(true);
        setNewEmployee({ id_directorio: getNextAvailableId(), nombre: '', area: '', puesto: '' });
        setSelectedAreas([]);
        setTimeout(() => addInputRef.current?.focus(), 100);
    };

    const handleCancelAdd = () => {
        setIsAddingNew(false);
        setNewEmployee({ id_directorio: 0, nombre: '', area: '', puesto: '' });
        setError('');
    };

    const handleEdit = async (employee: Directorio) => {
        setEditingId(employee.id_directorio);
        setEditEmployee({ ...employee });
        
        // Obtener áreas desde el mapa
        const areasFromMap = directorAreasMap[employee.id_directorio] || [];
        console.log('Áreas desde directorAreasMap:', areasFromMap);
        
        setEditSelectedAreas([...areasFromMap]);
        setTimeout(() => editInputRef.current?.focus(), 100);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditEmployee({ id_directorio: 0, nombre: '', area: '', puesto: '' });
        setEditSelectedAreas([]);
        setError('');
    };

    const handleDelete = (id: number) => {
        setDeletingId(id);
    };

    const handleCancelDelete = () => {
        setDeletingId(null);
    };

    const handleSubmitAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            // Validación de campos
            if (!newEmployee.nombre || newEmployee.nombre.trim() === '') {
                throw new Error('El nombre del empleado es obligatorio');
            }
            if (selectedAreas.length === 0) {
                throw new Error('Debes asignar al menos un área');
            }

            const nombreEmployee = newEmployee.nombre;
            const puestoEmployee = newEmployee.puesto || '';

            // Verificar si el empleado ya existe
            const existingEmployee = directorioFromStore.find((item: Directorio) =>
                item.nombre?.toUpperCase() === nombreEmployee &&
                item.puesto?.toUpperCase() === puestoEmployee
            );

            if (existingEmployee) {
                throw new Error('El empleado ya existe');
            }

            // Agregar nuevo empleado usando el proxy
            const insertResponse = await fetch('/api/supabase-proxy?target=/rest/v1/directorio', {
                method: 'POST',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({ nombre: nombreEmployee, puesto: puestoEmployee })
            });

            if (!insertResponse.ok) throw new Error('Error al agregar empleado');

            const data = await insertResponse.json();
            const newId = data?.[0]?.id_directorio;

            // Guardar áreas en directorio_areas
            for (const id_area of selectedAreas) {
                await fetch('/api/supabase-proxy?target=/rest/v1/directorio_areas', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ id_directorio: newId, id_area })
                });
            }

            setMessage({ type: 'success', text: 'Empleado agregado correctamente' });
            setIsAddingNew(false);
            setNewEmployee({ id_directorio: 0, nombre: '', area: '', puesto: '' });
            setSelectedAreas([]);
            // Ya no necesitamos fetchDirectorio, fetchAreas, fetchAllDirectorAreas
            // El realtime del hook se encarga de actualizar automáticamente

            // Notificación de alta
            await createNotification({
                title: 'Nuevo empleado agregado',
                description: `Se agregó a ${nombreEmployee} con áreas asignadas al directorio.`,
                type: 'success',
                category: 'directorio',
                device: 'web',
                importance: 'medium',
                data: { changes: [`Alta: ${nombreEmployee}`], affectedTables: ['directorio', 'directorio_areas'] }
            });
        } catch (error: unknown) {
            console.error('Error:', error);
            const errorMessage = (error instanceof Error) ? error.message : 'Ha ocurrido un error';
            setError(errorMessage);
            setMessage({ type: 'error', text: errorMessage });

            // Notificación de error
            await createNotification({
                title: 'Error al agregar empleado',
                description: errorMessage,
                type: 'danger',
                category: 'directorio',
                device: 'web',
                importance: 'high',
                data: { affectedTables: ['directorio'] }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            // Validación
            if (!editEmployee.nombre || editEmployee.nombre.trim() === '') {
                throw new Error('El nombre del empleado es obligatorio');
            }
            if (editSelectedAreas.length === 0) {
                throw new Error('Debes asignar al menos un área');
            }

            const nombreEmployee = editEmployee.nombre;
            const puestoEmployee = editEmployee.puesto || '';

            // Verificar si el nuevo nombre ya existe (excluyendo el empleado actual)
            const existingEmployee = directorioFromStore.find((item: Directorio) =>
                item.nombre?.toUpperCase() === nombreEmployee &&
                item.puesto?.toUpperCase() === puestoEmployee &&
                item.id_directorio !== editEmployee.id_directorio
            );

            if (existingEmployee) {
                throw new Error('El empleado ya existe');
            }

            // Actualizar nombre y puesto del empleado usando el proxy
            const updateResponse = await fetch(`/api/supabase-proxy?target=${encodeURIComponent(`/rest/v1/directorio?id_directorio=eq.${editEmployee.id_directorio}`)}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({ 
                    nombre: nombreEmployee, 
                    puesto: puestoEmployee 
                })
            });

            if (!updateResponse.ok) {
                const error = await updateResponse.json();
                throw new Error(error.message || 'Error al actualizar empleado');
            }

            // Actualizar áreas: eliminar todas y volver a insertar usando el proxy
            const deleteResponse = await fetch(`/api/supabase-proxy?target=${encodeURIComponent(`/rest/v1/directorio_areas?id_directorio=eq.${editEmployee.id_directorio}`)}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!deleteResponse.ok) {
                throw new Error('Error al eliminar áreas existentes');
            }

            // Insertar nuevas áreas
            for (const id_area of editSelectedAreas) {
                const insertResponse = await fetch('/api/supabase-proxy?target=/rest/v1/directorio_areas', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ 
                        id_directorio: editEmployee.id_directorio, 
                        id_area 
                    })
                });

                if (!insertResponse.ok) {
                    throw new Error('Error al insertar áreas');
                }
            }

            setMessage({ type: 'success', text: 'Empleado actualizado correctamente' });
            setEditingId(null);
            setEditEmployee({ id_directorio: 0, nombre: '', area: '', puesto: '' });
            setEditSelectedAreas([]);
            
            // El realtime del hook actualizará automáticamente el store y mostrará la notificación

            // Notificación de edición
            await createNotification({
                title: 'Empleado actualizado',
                description: `Se actualizó la información de ${nombreEmployee} en el directorio.`,
                type: 'info',
                category: 'directorio',
                device: 'web',
                importance: 'medium',
                data: { changes: [`Edición: ${nombreEmployee}`], affectedTables: ['directorio', 'directorio_areas'] }
            });
        } catch (error: unknown) {
            console.error('Error:', error);
            const errorMessage = (error instanceof Error) ? error.message : 'Ha ocurrido un error';
            setError(errorMessage);
            setMessage({ type: 'error', text: errorMessage });

            // Notificación de error
            await createNotification({
                title: 'Error al editar empleado',
                description: errorMessage,
                type: 'danger',
                category: 'directorio',
                device: 'web',
                importance: 'high',
                data: { affectedTables: ['directorio'] }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async (id: number) => {
        setIsSubmitting(true);
        try {
            const empleado = directorioFromStore.find(e => e.id_directorio === id);
            
            // Eliminar empleado usando el proxy
            const deleteResponse = await fetch(`/api/supabase-proxy?target=/rest/v1/directorio?id_directorio=eq.${id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!deleteResponse.ok) throw new Error('Error al eliminar empleado');

            setMessage({ type: 'success', text: 'Empleado eliminado correctamente' });
            setDeletingId(null);
            // Ya no necesitamos fetchDirectorio, fetchAllDirectorAreas
            // El realtime del hook se encarga de actualizar automáticamente

            // Notificación de baja
            await createNotification({
                title: 'Empleado eliminado',
                description: `Se eliminó a ${empleado?.nombre || ''} (Área: ${empleado?.area || ''}, Puesto: ${empleado?.puesto || ''}) del directorio.`,
                type: 'danger',
                category: 'directorio',
                device: 'web',
                importance: 'high',
                data: { changes: [`Baja: ${empleado?.nombre || ''}, Área: ${empleado?.area || ''}, Puesto: ${empleado?.puesto || ''}`], affectedTables: ['directorio'] }
            });
        } catch (error: unknown) {
            console.error('Error:', error);
            const errorMessage = (error instanceof Error) ? error.message : 'Ha ocurrido un error';
            setMessage({ type: 'error', text: errorMessage });

            // Notificación de error
            await createNotification({
                title: 'Error al eliminar empleado',
                description: errorMessage,
                type: 'danger',
                category: 'directorio',
                device: 'web',
                importance: 'high',
                data: { affectedTables: ['directorio'] }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseMessage = () => setMessage({ type: '', text: '' });

    // Función para agregar área manualmente (usada en los inputs)
    const addAreaManually = async (areaName: string, isEditing: boolean) => {
        const value = areaName.trim().toUpperCase();
        if (!value) return;
        
        // Verificar si ya existe
        if (!areasFromStore.some(a => a.nombre === value)) {
            const response = await fetch('/api/supabase-proxy?target=/rest/v1/area', {
                method: 'POST',
                credentials: 'include',
                headers: { 
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({ nombre: value })
            });
            if (response.ok) {
                const data = await response.json();
                if (data && data[0]) {
                    // El realtime actualizará areasFromStore automáticamente
                    if (isEditing) {
                        setEditSelectedAreas(prev => [...new Set([...prev, data[0].id_area])]);
                    } else {
                        setSelectedAreas(prev => [...new Set([...prev, data[0].id_area])]);
                    }
                }
            }
        } else {
            const areaObj = areasFromStore.find(a => a.nombre === value);
            if (areaObj) {
                if (isEditing) {
                    if (!editSelectedAreas.includes(areaObj.id_area)) {
                        setEditSelectedAreas(prev => [...new Set([...prev, areaObj.id_area])]);
                    }
                } else {
                    if (!selectedAreas.includes(areaObj.id_area)) {
                        setSelectedAreas(prev => [...new Set([...prev, areaObj.id_area])]);
                    }
                }
            }
        }
    };

    return (
        <div className={`min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 transition-colors duration-500 ${isDarkMode
                ? 'bg-black text-white'
                : 'bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900'
            }`}>
            <div className={`w-full mx-auto rounded-lg sm:rounded-xl shadow-2xl overflow-hidden transition-all duration-500 transform ${isDarkMode
                    ? 'bg-black border-2 border-white/10'
                    : 'bg-white border-2 border-gray-200'
                }`}>
                {/* Header con título y efecto glassmorphism */}
                <div className={`p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 transition-colors duration-500 ${isDarkMode
                        ? 'bg-black border-b-2 border-white/10'
                        : 'bg-white border-b-2 border-gray-200'
                    }`}>
                    <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold flex items-center transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        <span className={`mr-2 sm:mr-3 p-1 sm:p-2 rounded-lg text-sm sm:text-base shadow-lg transition-all duration-500 ${isDarkMode
                                ? 'bg-black border-2 border-white/10 text-white'
                                : 'bg-gray-600 border-2 border-gray-700 text-white'
                            }`}>DIR</span>
                        Directorio de Personal Autorizado
                    </h1>
                    <SectionRealtimeToggle 
                        sectionName="Directorio" 
                        isConnected={realtimeConnected} 
                    />
                </div>

                {/* Mensajes con animación mejorada */}
                {message.text && (
                    <div className={`mx-2 sm:mx-4 md:mx-6 mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg flex items-center justify-between transition-all duration-500 animate-slide-in-right backdrop-blur-sm border shadow-lg ${message.type === 'success'
                            ? isDarkMode
                                ? 'bg-gradient-to-r from-green-900/80 via-green-800/80 to-green-900/80 border-green-500/30'
                                : 'bg-gradient-to-r from-green-100 via-green-50 to-green-100 border-green-300 text-green-800'
                            : isDarkMode
                                ? 'bg-gradient-to-r from-red-900/80 via-red-800/80 to-red-900/80 border-red-500/30'
                                : 'bg-gradient-to-r from-red-100 via-red-50 to-red-100 border-red-300 text-red-800'
                        }`}>
                        <div className="flex items-center">
                            {message.type === 'success' ?
                                <CheckCircle className="mr-2 sm:mr-3" size={20} /> :
                                <AlertTriangle className="mr-2 sm:mr-3" size={20} />
                            }
                            <span className="font-medium text-sm sm:text-base">{message.text}</span>
                        </div>
                        <button
                            onClick={handleCloseMessage}
                            className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-black' : 'hover:bg-gray-200'
                                }`}
                            title='Cerrar'
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Contenido principal con glassmorphism */}
                <div className="px-2 sm:px-4 md:px-6 py-4 sm:py-6">
                    {/* Búsqueda y botones con efectos */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
                        <div className="w-full sm:w-auto relative mb-2 sm:mb-0 group">
                            <input
                                type="text"
                                placeholder="Buscar personal autorizado..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full sm:w-64 rounded-lg p-2 pl-8 text-sm transition-all duration-300 ${isDarkMode
                                        ? 'bg-black border-2 border-white/10 focus:border-white/20 focus:ring-2 focus:ring-white/10 group-hover:border-white/20 text-white'
                                        : 'bg-white border-2 border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 group-hover:border-gray-400 text-gray-900'
                                    }`}
                            />
                            <Search size={18} className={`absolute left-2 top-2.5 transition-colors ${isDarkMode
                                    ? 'text-gray-500 group-hover:text-gray-400'
                                    : 'text-gray-400 group-hover:text-gray-600'
                                }`} />
                        </div>

                        {/* Botones con efectos hover */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddNew}
                                disabled={isAddingNew}
                                className={`flex items-center px-4 py-2 rounded-lg transition-all duration-300 text-sm transform hover:scale-105 group disabled:opacity-50 ${isDarkMode
                                        ? 'bg-black border-2 border-white/10 hover:bg-white/5 text-white'
                                        : 'bg-gray-600 border-2 border-gray-700 hover:bg-gray-700 text-white'
                                    }`}
                            >
                                <Plus size={16} className={`mr-1.5 group-hover:rotate-90 transition-transform duration-300 ${isDarkMode ? 'text-emerald-400' : 'text-white'
                                    }`} />
                                Agregar Personal
                            </button>
                            <button
                                title="Recargar datos"
                                onClick={reindex}
                                className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-105 group ${isDarkMode
                                        ? 'bg-black border-2 border-white/10 hover:bg-white/5'
                                        : 'bg-white border-2 border-gray-300 hover:bg-gray-100'
                                    }`}
                            >
                                <RefreshCw size={16} className={`group-hover:rotate-180 transition-transform duration-500 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                    }`} />
                            </button>
                        </div>
                    </div>

                    {/* Tabla mejorada con efectos */}
                    <div className={`overflow-x-auto rounded-lg shadow-xl transition-colors duration-500 ${isDarkMode
                            ? 'border-2 border-white/10'
                            : 'border-2 border-gray-200'
                        }`}>
                        <table className={`min-w-full transition-colors duration-500 ${isDarkMode ? 'divide-y-2 divide-white/10' : 'divide-y-2 divide-gray-200'
                            }`}>
                            <thead className={isDarkMode ? "bg-black" : "bg-gray-50"}>
                                <tr>
                                    {/* Eliminamos la columna ID */}
                                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        NOMBRE DEL PERSONAL
                                    </th>
                                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        ÁREA DE ADSCRIPCIÓN
                                    </th>
                                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        PUESTO
                                    </th>
                                    <th scope="col" className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider transition-colors duration-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        ACCIONES
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={`transition-colors duration-500 ${isDarkMode
                                    ? 'bg-black/50 divide-y divide-gray-800/30'
                                    : 'bg-white divide-y divide-gray-200'
                                }`}>
                                {/* Fila para agregar nuevo empleado */}
                                {isAddingNew && (
                                    <tr className={`animate-fadeIn transition-colors duration-500 ${isDarkMode ? 'bg-gray-900 bg-opacity-50' : 'bg-gray-50'
                                        }`}>
                                        {/* Nombre */}
                                        <td className="px-4 py-2 text-sm">
                                            <input
                                                ref={addInputRef}
                                                type="text"
                                                value={newEmployee.nombre || ''}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, nombre: e.target.value.toUpperCase() })}
                                                placeholder="Nombre completo"
                                                className={`w-full rounded p-1.5 text-sm transition-all ${isDarkMode
                                                        ? 'bg-black border border-gray-700 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 text-white'
                                                        : 'bg-white border border-gray-300 focus:border-gray-500 focus:ring focus:ring-gray-500 focus:ring-opacity-50 text-gray-900'
                                                    }`}
                                            />
                                        </td>
                                        {/* Áreas: chips + input para agregar manualmente */}
                                        <td className="px-4 py-2 text-sm">
                                            <div className="flex flex-wrap gap-1 items-center">
                                                {selectedAreas.map(id_area => {
                                                    const areaObj = areasFromStore.find(a => a.id_area === id_area);
                                                    return areaObj ? (
                                                        <span key={`add-area-${id_area}`} className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors duration-500 ${isDarkMode
                                                                ? 'bg-emerald-900/40 text-emerald-200 border border-emerald-700'
                                                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                            }`}>
                                                            {areaObj.nombre}
                                                            <button
                                                                type="button"
                                                                className={`ml-1 hover:text-red-400 focus:outline-none transition-colors ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'
                                                                    }`}
                                                                onClick={() => setSelectedAreas(selectedAreas.filter(a => a !== id_area))}
                                                                title="Quitar área"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </span>
                                                    ) : null;
                                                })}
                                                <input
                                                    type="text"
                                                    placeholder="Agregar área..."
                                                    className={`rounded p-1.5 text-xs w-32 transition-all ${isDarkMode
                                                            ? 'bg-black border border-gray-700 text-white focus:border-emerald-400 focus:ring focus:ring-emerald-700 focus:ring-opacity-50'
                                                            : 'bg-white border border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring focus:ring-emerald-500 focus:ring-opacity-50'
                                                        }`}
                                                    value={addAreaInput}
                                                    onChange={e => setAddAreaInput(e.target.value)}
                                                    onKeyDown={async (e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const value = addAreaInput.trim().toUpperCase();
                                                            if (value) {
                                                                await addAreaManually(value, false);
                                                                setAddAreaInput('');
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        {/* Puesto: input editable */}
                                        <td className="px-4 py-2 text-sm">
                                            <input
                                                type="text"
                                                value={newEmployee.puesto || ''}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, puesto: e.target.value.toUpperCase() })}
                                                placeholder="Puesto"
                                                className={`w-full rounded p-1.5 text-sm transition-all ${isDarkMode
                                                        ? 'bg-black border border-gray-700 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 text-white'
                                                        : 'bg-white border border-gray-300 focus:border-gray-500 focus:ring focus:ring-gray-500 focus:ring-opacity-50 text-gray-900'
                                                    }`}
                                            />
                                        </td>
                                        {/* Acciones */}
                                        <td className="px-4 py-2 text-sm text-right">
                                            <div className="flex justify-end space-x-1">
                                                <button
                                                    onClick={handleSubmitAdd}
                                                    disabled={isSubmitting}
                                                    className="p-1 bg-green-900 hover:bg-green-800 rounded-md transition-colors"
                                                    title="Guardar"
                                                >
                                                    {isSubmitting ? (
                                                        <div className={`w-4 h-4 border-2 rounded-full animate-spin ${isDarkMode
                                                                ? 'border-gray-400 border-t-white'
                                                                : 'border-green-300 border-t-white'
                                                            }`}></div>
                                                    ) : (
                                                        <CheckSquare size={16} />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={handleCancelAdd}
                                                    className="p-1 bg-red-900 hover:bg-red-800 rounded-md transition-colors"
                                                    title="Cancelar"
                                                >
                                                    <XSquare size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {filteredDirectorio.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className={`px-4 py-4 text-center text-sm transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>
                                            {searchTerm ? 'No se encontró personal con el término de búsqueda.' : 'No hay personal registrado.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDirectorio.map((employee) => (
                                        <tr key={employee.id_directorio} className={`transition-colors ${editingId === employee.id_directorio
                                                ? isDarkMode ? 'bg-gray-900 bg-opacity-80' : 'bg-gray-50'
                                                : isDarkMode ? 'hover:bg-gray-900' : 'hover:bg-gray-50'
                                            }`}>
                                            {/* Eliminamos la celda del ID */}
                                            {editingId === employee.id_directorio ? (
                                                <>
                                                    {/* Nombre */}
                                                    <td className="px-4 py-2 text-sm">
                                                        <input
                                                            title='Nombre'
                                                            ref={editInputRef}
                                                            type="text"
                                                            value={editEmployee.nombre || ''}
                                                            onChange={(e) => setEditEmployee({ ...editEmployee, nombre: e.target.value.toUpperCase() })}
                                                            className={`w-full rounded p-1.5 text-sm transition-all ${isDarkMode
                                                                    ? 'bg-black border border-gray-700 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 text-white'
                                                                    : 'bg-white border border-gray-300 focus:border-gray-500 focus:ring focus:ring-gray-500 focus:ring-opacity-50 text-gray-900'
                                                                }`}
                                                        />
                                                    </td>
                                                    {/* Áreas: chips + input para agregar manualmente */}
                                                    <td className="px-4 py-2 text-sm">
                                                        <div className="flex flex-wrap gap-1 items-center">
                                                            {editSelectedAreas.length > 0 ? (
                                                                editSelectedAreas.map(id_area => {
                                                                    const areaObj = areasFromStore.find(a => a.id_area === id_area);
                                                                    return areaObj ? (
                                                                        <span key={`edit-area-${id_area}`} className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors duration-500 ${isDarkMode
                                                                                ? 'bg-emerald-900/40 text-emerald-200 border border-emerald-700'
                                                                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                                            }`}>
                                                                            {areaObj.nombre}
                                                                            <button
                                                                                type="button"
                                                                                className={`ml-1 hover:text-red-400 focus:outline-none transition-colors ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'
                                                                                    }`}
                                                                                onClick={() => setEditSelectedAreas(editSelectedAreas.filter(a => a !== id_area))}
                                                                                title="Quitar área"
                                                                            >
                                                                                <X size={12} />
                                                                            </button>
                                                                        </span>
                                                                    ) : null;
                                                                })
                                                            ) : (
                                                                <span className={`text-xs italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                    Sin áreas asignadas
                                                                </span>
                                                            )}
                                                            <input
                                                                type="text"
                                                                placeholder="Agregar área..."
                                                                className={`rounded p-1.5 text-xs w-32 transition-all ${isDarkMode
                                                                        ? 'bg-black border border-gray-700 text-white focus:border-emerald-400 focus:ring focus:ring-emerald-700 focus:ring-opacity-50'
                                                                        : 'bg-white border border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring focus:ring-emerald-500 focus:ring-opacity-50'
                                                                    }`}
                                                                value={editAreaInput}
                                                                onChange={e => setEditAreaInput(e.target.value)}
                                                                onKeyDown={async (e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        const value = editAreaInput.trim().toUpperCase();
                                                                        if (value) {
                                                                            await addAreaManually(value, true);
                                                                            setEditAreaInput('');
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                    {/* Puesto: input editable */}
                                                    <td className="px-4 py-2 text-sm">
                                                        <input
                                                            type="text"
                                                            value={editEmployee.puesto || ''}
                                                            onChange={(e) => setEditEmployee({ ...editEmployee, puesto: e.target.value.toUpperCase() })}
                                                            placeholder="Puesto"
                                                            className={`w-full rounded p-1.5 text-sm transition-all ${isDarkMode
                                                                    ? 'bg-black border border-gray-700 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 text-white'
                                                                    : 'bg-white border border-gray-300 focus:border-gray-500 focus:ring focus:ring-gray-500 focus:ring-opacity-50 text-gray-900'
                                                                }`}
                                                        />
                                                    </td>
                                                    {/* Acciones */}
                                                    <td className="px-4 py-2 text-sm text-right">
                                                        <div className="flex justify-end space-x-1">
                                                            <button
                                                                onClick={handleSubmitEdit}
                                                                disabled={isSubmitting}
                                                                className="p-1 bg-green-900 hover:bg-green-800 rounded-md transition-colors"
                                                                title="Guardar cambios"
                                                            >
                                                                {isSubmitting ? (
                                                                    <div className={`w-4 h-4 border-2 rounded-full animate-spin ${isDarkMode
                                                                            ? 'border-gray-400 border-t-white'
                                                                            : 'border-green-300 border-t-white'
                                                                        }`}></div>
                                                                ) : (
                                                                    <CheckSquare size={16} />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="p-1 bg-red-900 hover:bg-red-800 rounded-md transition-colors"
                                                                title="Cancelar edición"
                                                            >
                                                                <XSquare size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : deletingId === employee.id_directorio ? (
                                                <>
                                                    <td colSpan={3} className="px-4 py-3 text-sm">
                                                        <div className={`flex items-center transition-colors duration-500 ${isDarkMode ? 'text-red-400' : 'text-red-600'
                                                            }`}>
                                                            <AlertTriangle size={16} className="mr-2" />
                                                            <span>¿Confirma eliminar a <strong>{employee.nombre}</strong>?</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right">
                                                        <div className="flex justify-end space-x-1">
                                                            <button
                                                                onClick={() => handleConfirmDelete(employee.id_directorio)}
                                                                disabled={isSubmitting}
                                                                className="p-1 bg-red-700 hover:bg-red-600 rounded-md transition-colors"
                                                                title="Confirmar eliminación"
                                                            >
                                                                {isSubmitting ? (
                                                                    <div className={`w-4 h-4 border-2 rounded-full animate-spin ${isDarkMode
                                                                            ? 'border-gray-400 border-t-white'
                                                                            : 'border-red-300 border-t-white'
                                                                        }`}></div>
                                                                ) : (
                                                                    <CheckSquare size={16} />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={handleCancelDelete}
                                                                className={`p-1 rounded-md transition-colors ${isDarkMode
                                                                        ? 'bg-gray-700 hover:bg-gray-600'
                                                                        : 'bg-gray-200 hover:bg-gray-300'
                                                                    }`}
                                                                title="Cancelar eliminación"
                                                            >
                                                                <XSquare size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className={`px-4 py-3 text-sm font-medium transition-colors duration-500 ${!employee.nombre || employee.nombre.trim() === ''
                                                            ? isDarkMode
                                                                ? 'bg-amber-900 bg-opacity-50 border-l-2 border-amber-500'
                                                                : 'bg-amber-100 border-l-2 border-amber-400'
                                                            : ''
                                                        } ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        {employee.nombre || (
                                                            <span className={`flex items-center gap-1 transition-colors duration-500 ${isDarkMode ? 'text-amber-400' : 'text-amber-700'
                                                                }`}>
                                                                <AlertTriangle size={14} />
                                                                <span>Sin nombre</span>
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className={`px-4 py-3 text-sm`}>
                                                        <div className="flex flex-wrap gap-1">
                                                            {/* Mostrar chips de áreas */}
                                                            {areasFromStore.length > 0 && (
                                                                <AreaChips areaIds={directorAreasMap[employee.id_directorio] || []} areas={areasFromStore} />
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* Puesto como chip azul o aviso si no hay */}
                                                    <td className="px-4 py-3 text-sm">
                                                        {employee.puesto && employee.puesto.trim() !== '' ? (
                                                            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors duration-500 ${isDarkMode
                                                                    ? 'bg-slate-600/20 text-slate-300 border border-slate-500/50'
                                                                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                                                                }`}>
                                                                {employee.puesto}
                                                            </span>
                                                        ) : (
                                                            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold animate-fade-in transition-colors duration-500 ${isDarkMode
                                                                    ? 'text-amber-400 bg-amber-900/30 border border-amber-500'
                                                                    : 'text-amber-700 bg-amber-100 border border-amber-300'
                                                                }`}>
                                                                <AlertTriangle size={14} />
                                                                <span>Sin puesto</span>
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right">
                                                        <div className="flex justify-end space-x-1">
                                                            <button
                                                                onClick={() => handleEdit(employee)}
                                                                className={`p-1 rounded-md transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                                                                    }`}
                                                                title="Editar"
                                                                disabled={editingId !== null || deletingId !== null || isAddingNew}
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(employee.id_directorio)}
                                                                className="p-1 hover:bg-red-900 rounded-md transition-colors"
                                                                title="Eliminar"
                                                                disabled={editingId !== null || deletingId !== null || isAddingNew}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Error message con estilo mejorado */}
                    {error && (
                        <div className={`mt-3 text-sm p-3 rounded-lg animate-fade-in transition-colors duration-500 ${isDarkMode
                                ? 'text-white bg-black border-2 border-white/10'
                                : 'text-gray-900 bg-white border-2 border-gray-200'
                            }`}>
                            <AlertTriangle size={16} className="inline-block mr-2 mb-1" />
                            {error}
                        </div>
                    )}

                    {/* Contador de resultados con estilo mejorado */}
                    <div className={`mt-4 text-sm p-2 rounded-lg transition-colors duration-500 ${isDarkMode
                            ? 'text-white bg-black border-2 border-white/10'
                            : 'text-gray-900 bg-white border-2 border-gray-200'
                        }`}>
                        Mostrando {filteredDirectorio.length} de {directorioFromStore.length} empleados en el directorio
                    </div>
                </div>
            </div>

            {/* Estilos CSS con nuevas animaciones */}
            <style jsx>{`
                @keyframes gradient-x {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                @keyframes slide-in-right {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }

                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .animate-gradient-x {
                    animation: gradient-x 15s ease infinite;
                    background-size: 200% 200%;
                }

                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out forwards;
                }

                .animate-text {
                    animation: gradient-x 4s linear infinite;
                    background-size: 200% auto;
                }

                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
}

// NUEVO: Componente para mostrar chips de áreas (solo visualización, recibe ids de áreas)
function AreaChips({ areaIds, areas }: { areaIds: number[], areas: { id_area: number, nombre: string }[] }) {
    const { isDarkMode } = useTheme();
    const chips = areas.filter(a => areaIds.includes(a.id_area));
    if (chips.length === 0) {
        return (
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold animate-fade-in transition-colors duration-500 ${isDarkMode
                    ? 'text-amber-400 bg-amber-900/30 border border-amber-500'
                    : 'text-amber-700 bg-amber-100 border border-amber-300'
                }`}>
                <AlertTriangle size={14} />
                <span>Sin área</span>
            </span>
        );
    }
    return (
        <>
            {chips.map(area => (
                <span key={area.id_area} className={`flex rounded-full px-2 py-0.5 text-xs font-semibold items-center gap-1 transition-colors duration-500 ${isDarkMode
                        ? 'bg-white/5 text-white border border-white/20'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                    {area.nombre}
                </span>
            ))}
        </>
    );
}