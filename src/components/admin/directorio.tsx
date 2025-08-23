"use client"
import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, Edit, AlertTriangle, CheckCircle, X, Search, RefreshCw, CheckSquare, XSquare } from 'lucide-react';
import supabase from "@/app/lib/supabase/client";
import { useNotifications } from '@/hooks/useNotifications';

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
    // Estados
    const [directorio, setDirectorio] = useState<Directorio[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [newEmployee, setNewEmployee] = useState<Directorio>({ id_directorio: 0, nombre: '', area: '', puesto: '' });
    const [editEmployee, setEditEmployee] = useState<Directorio>({ id_directorio: 0, nombre: '', area: '', puesto: '' });
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [message, setMessage] = useState<Message>({ type: '', text: '' });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    // NUEVO: Estado para áreas y relaciones
    const [areas, setAreas] = useState<{ id_area: number; nombre: string }[]>([]);
    const [selectedAreas, setSelectedAreas] = useState<number[]>([]);
    const [editSelectedAreas, setEditSelectedAreas] = useState<number[]>([]);
    const [directorAreasMap, setDirectorAreasMap] = useState<{ [id_directorio: number]: number[] }>({});

    // Estado para el valor del input de área (alta y edición)
    const [addAreaInput, setAddAreaInput] = useState('');
    const [editAreaInput, setEditAreaInput] = useState('');

    const addInputRef = useRef<HTMLInputElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);
    const { createNotification } = useNotifications();

    // Cargar datos del directorio
    const fetchDirectorio = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('directorio')
                .select('*')
                .order('id_directorio', { ascending: true });

            if (error) throw error;
            setDirectorio(data || []);
        } catch (error) {
            console.error('Error cargando directorio:', error);
            setError('Error al cargar el directorio de personal');
        } finally {
            setLoading(false);
        }
    }, []);

    // NUEVO: Cargar áreas y relaciones
    const fetchAreas = useCallback(async () => {
        const { data, error } = await supabase.from('area').select('*').order('nombre');
        if (!error) setAreas(data || []);
    }, []);

    const fetchDirectorAreas = useCallback(async (id_directorio: number) => {
        const { data, error } = await supabase
            .from('directorio_areas')
            .select('id_area')
            .eq('id_directorio', id_directorio);
        if (!error) return (data || []).map((d: { id_area: number }) => d.id_area);
        return [];
    }, []);

    const fetchAllDirectorAreas = useCallback(async () => {
        const { data, error } = await supabase.from('directorio_areas').select('*');
        if (!error && data) {
            const map: { [id_directorio: number]: number[] } = {};
            data.forEach((rel: { id_directorio: number, id_area: number }) => {
                if (!map[rel.id_directorio]) map[rel.id_directorio] = [];
                map[rel.id_directorio].push(rel.id_area);
            });
            setDirectorAreasMap(map);
        }
    }, []);

    // Cargar datos al montar el componente
    useEffect(() => {
        fetchDirectorio();
        fetchAreas();
        fetchAllDirectorAreas();
    }, [fetchDirectorio, fetchAreas, fetchAllDirectorAreas]);

    // NUEVO: Al editar, cargar áreas seleccionadas
    useEffect(() => {
        if (editingId) {
            fetchDirectorAreas(editingId).then(setEditSelectedAreas);
        }
    }, [editingId, fetchDirectorAreas]);

    // NUEVO: Al agregar, limpiar selección
    useEffect(() => {
        if (isAddingNew) setSelectedAreas([]);
    }, [isAddingNew]);

    // Limpiar el input cuando se abre alta o edición
    useEffect(() => {
        if (isAddingNew) setAddAreaInput('');
    }, [isAddingNew]);
    useEffect(() => {
        if (editingId) setEditAreaInput('');
    }, [editingId]);

    // Función para obtener el próximo ID disponible
    const getNextAvailableId = useCallback(() => {
        if (directorio.length === 0) return 1;
        const maxId = Math.max(...directorio.map(item => item.id_directorio));
        return maxId + 1;
    }, [directorio]);

    // Filtrar directorio según el término de búsqueda
    const filteredDirectorio = directorio.filter(item =>
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

    const handleEdit = (employee: Directorio) => {
        setEditingId(employee.id_directorio);
        setEditEmployee({ ...employee });
        fetchDirectorAreas(employee.id_directorio).then(setEditSelectedAreas);
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
            const existingEmployee = directorio.find((item: Directorio) =>
                item.nombre?.toUpperCase() === nombreEmployee &&
                item.puesto?.toUpperCase() === puestoEmployee
            );

            if (existingEmployee) {
                throw new Error('El empleado ya existe');
            }

            // Agregar nuevo empleado
            const { data, error } = await supabase
                .from('directorio')
                .insert([{ nombre: nombreEmployee, puesto: puestoEmployee }])
                .select();

            if (error) throw error;

            const newId = data?.[0]?.id_directorio;

            // Guardar áreas en directorio_areas
            for (const id_area of selectedAreas) {
                await supabase.from('directorio_areas').insert({ id_directorio: newId, id_area });
            }

            setMessage({ type: 'success', text: 'Empleado agregado correctamente' });
            setIsAddingNew(false);
            setNewEmployee({ id_directorio: 0, nombre: '', area: '', puesto: '' });
            setSelectedAreas([]);
            fetchDirectorio();
            fetchAreas();
            fetchAllDirectorAreas();

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
            const existingEmployee = directorio.find((item: Directorio) =>
                item.nombre?.toUpperCase() === nombreEmployee &&
                item.puesto?.toUpperCase() === puestoEmployee &&
                item.id_directorio !== editEmployee.id_directorio
            );

            if (existingEmployee) {
                throw new Error('El empleado ya existe');
            }

            // Editar empleado existente
            const { error } = await supabase
                .from('directorio')
                .update({ nombre: nombreEmployee, puesto: puestoEmployee })
                .eq('id_directorio', editEmployee.id_directorio);

            if (error) throw error;

            // Actualizar áreas: eliminar todas y volver a insertar
            await supabase.from('directorio_areas').delete().eq('id_directorio', editEmployee.id_directorio);
            for (const id_area of editSelectedAreas) {
                await supabase.from('directorio_areas').insert({ id_directorio: editEmployee.id_directorio, id_area });
            }

            setMessage({ type: 'success', text: 'Empleado actualizado correctamente' });
            setEditingId(null);
            setEditEmployee({ id_directorio: 0, nombre: '', area: '', puesto: '' });
            setEditSelectedAreas([]);
            fetchDirectorio();
            fetchAreas();
            fetchAllDirectorAreas();

            // Notificación de edición
            await createNotification({
                title: 'Empleado actualizado',
                description: `Se actualizó a ${nombreEmployee} con nuevas áreas asignadas.`,
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
            const empleado = directorio.find(e => e.id_directorio === id);
            const { error } = await supabase
                .from('directorio')
                .delete()
                .eq('id_directorio', id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Empleado eliminado correctamente' });
            setDeletingId(null);
            fetchDirectorio();
            fetchAllDirectorAreas();

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

    return (
        <div className="bg-black text-white min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
            <div className="w-full mx-auto bg-black rounded-lg sm:rounded-xl shadow-2xl overflow-hidden transition-all duration-500 transform border-2 border-white/10">
                {/* Header con título y efecto glassmorphism */}
                <div className="bg-black p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-white/10 gap-2 sm:gap-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center text-white">
                        <span className="mr-2 sm:mr-3 bg-black p-1 sm:p-2 rounded-lg border-2 border-white/10 text-sm sm:text-base shadow-lg transition-all">DIR</span>
                        Directorio de Personal Autorizado
                    </h1>
                </div>

                {/* Mensajes con animación mejorada */}
                {message.text && (
                    <div className={`mx-2 sm:mx-4 md:mx-6 mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg flex items-center justify-between transition-all duration-500 animate-slide-in-right ${message.type === 'success'
                            ? 'bg-gradient-to-r from-green-900/80 via-green-800/80 to-green-900/80 border-green-500/30'
                            : 'bg-gradient-to-r from-red-900/80 via-red-800/80 to-red-900/80 border-red-500/30'
                        } backdrop-blur-sm border shadow-lg`}>
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
                                className="w-full sm:w-64 bg-black border-2 border-white/10 rounded-lg p-2 pl-8 focus:border-white/20 focus:ring-2 focus:ring-white/10 transition-all duration-300 text-sm group-hover:border-white/20"
                            />
                            <Search size={18} className="absolute left-2 top-2.5 text-gray-500 group-hover:text-gray-400 transition-colors" />
                        </div>

                        {/* Botones con efectos hover */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddNew}
                                disabled={isAddingNew}
                                className="flex items-center px-4 py-2 bg-black border-2 border-white/10 rounded-lg transition-all duration-300 text-sm transform hover:scale-105 hover:bg-white/5 group disabled:opacity-50"
                            >
                                <Plus size={16} className="mr-1.5 text-emerald-400 group-hover:rotate-90 transition-transform duration-300" />
                                Agregar Personal
                            </button>
                            <button
                                title="Recargar datos"
                                onClick={fetchDirectorio}
                                className="p-2 bg-black border-2 border-white/10 rounded-lg transition-all duration-300 transform hover:scale-105 hover:bg-white/5 group"
                            >
                                <RefreshCw size={16} className="text-gray-300 group-hover:rotate-180 transition-transform duration-500" />
                            </button>
                        </div>
                    </div>

                    {/* Tabla mejorada con efectos */}
                    <div className="overflow-x-auto border-2 border-white/10 rounded-lg shadow-xl">
                        <table className="min-w-full divide-y-2 divide-white/10">
                            <thead className="bg-black">
                                <tr>
                                    {/* Eliminamos la columna ID */}
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        NOMBRE DEL PERSONAL
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        ÁREA DE ADSCRIPCIÓN
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        PUESTO
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        ACCIONES
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-black/50 divide-y divide-gray-800/30">
                                {/* Fila para agregar nuevo empleado */}
                                {isAddingNew && (
                                    <tr className="bg-gray-900 bg-opacity-50 animate-fadeIn">
                                        {/* Nombre */}
                                        <td className="px-4 py-2 text-sm">
                                            <input
                                                ref={addInputRef}
                                                type="text"
                                                value={newEmployee.nombre || ''}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, nombre: e.target.value.toUpperCase() })}
                                                placeholder="Nombre completo"
                                                className="w-full bg-black border border-gray-700 rounded p-1.5 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm"
                                            />
                                        </td>
                                        {/* Áreas: chips + input para agregar manualmente */}
                                        <td className="px-4 py-2 text-sm">
                                            <div className="flex flex-wrap gap-1 items-center">
                                                {selectedAreas.map(id_area => {
                                                    const areaObj = areas.find(a => a.id_area === id_area);
                                                    return areaObj ? (
                                                        <span key={id_area} className="flex items-center gap-1 bg-emerald-900/40 text-emerald-200 border border-emerald-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                                                            {areaObj.nombre}
                                                            <button
                                                                type="button"
                                                                className="ml-1 text-emerald-300 hover:text-red-400 focus:outline-none"
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
                                                    className="bg-black border border-gray-700 rounded p-1.5 text-xs text-white focus:border-emerald-400 focus:ring focus:ring-emerald-700 focus:ring-opacity-50 transition-all w-32"
                                                    value={addAreaInput}
                                                    onChange={e => setAddAreaInput(e.target.value)}
                                                    onKeyDown={async (e) => {
                                                        if (e.key === 'Enter') {
                                                            const value = addAreaInput.trim().toUpperCase();
                                                            if (value && !areas.some(a => a.nombre === value)) {
                                                                const { data, error } = await supabase.from('area').insert([{ nombre: value }]).select();
                                                                if (!error && data && data[0]) {
                                                                    setAreas([...areas, data[0]]);
                                                                    setSelectedAreas([...selectedAreas, data[0].id_area]);
                                                                }
                                                            } else if (value) {
                                                                const areaObj = areas.find(a => a.nombre === value);
                                                                if (areaObj && !selectedAreas.includes(areaObj.id_area)) {
                                                                    setSelectedAreas([...selectedAreas, areaObj.id_area]);
                                                                }
                                                            }
                                                            setAddAreaInput('');
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        {/* Puesto como chip azul o aviso si no hay */}
                                        <td className="px-4 py-2 text-sm">
                                            {newEmployee.puesto && newEmployee.puesto.trim() !== '' ? (
                                                <span className="flex items-center gap-1 bg-slate-600/20 text-slate-300 border border-slate-500/50 rounded-full px-2 py-0.5 text-xs font-semibold">
                                                    {newEmployee.puesto}
                                                </span>
                                            ) : (
                                                <span className="text-amber-400 flex items-center gap-1 bg-amber-900/30 border border-amber-500 rounded-full px-2 py-0.5 text-xs font-semibold animate-fade-in">
                                                    <AlertTriangle size={14} />
                                                    <span>Sin puesto</span>
                                                </span>
                                            )}
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
                                                        <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
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

                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-4 text-center text-sm">
                                            <div className="flex justify-center items-center">
                                                <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin mr-2"></div>
                                                Cargando directorio de personal...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredDirectorio.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-4 text-center text-sm">
                                            {searchTerm ? 'No se encontró personal con el término de búsqueda.' : 'No hay personal registrado.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDirectorio.map((employee) => (
                                        <tr key={employee.id_directorio} className={`hover:bg-gray-900 transition-colors ${editingId === employee.id_directorio ? 'bg-gray-900 bg-opacity-80' : ''}`}>
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
                                                            className="w-full bg-black border border-gray-700 rounded p-1.5 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm"
                                                        />
                                                    </td>
                                                    {/* Áreas: chips + input para agregar manualmente */}
                                                    <td className="px-4 py-2 text-sm">
                                                        <div className="flex flex-wrap gap-1 items-center">
                                                            {editSelectedAreas.map(id_area => {
                                                                const areaObj = areas.find(a => a.id_area === id_area);
                                                                return areaObj ? (
                                                                    <span key={id_area} className="flex items-center gap-1 bg-emerald-900/40 text-emerald-200 border border-emerald-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                                                                        {areaObj.nombre}
                                                                        <button
                                                                            type="button"
                                                                            className="ml-1 text-emerald-300 hover:text-red-400 focus:outline-none"
                                                                            onClick={() => setEditSelectedAreas(editSelectedAreas.filter(a => a !== id_area))}
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
                                                                className="bg-black border border-gray-700 rounded p-1.5 text-xs text-white focus:border-emerald-400 focus:ring focus:ring-emerald-700 focus:ring-opacity-50 transition-all w-32"
                                                                value={editAreaInput}
                                                                onChange={e => setEditAreaInput(e.target.value)}
                                                                onKeyDown={async (e) => {
                                                                    if (e.key === 'Enter') {
                                                                        const value = editAreaInput.trim().toUpperCase();
                                                                        if (value && !areas.some(a => a.nombre === value)) {
                                                                            const { data, error } = await supabase.from('area').insert([{ nombre: value }]).select();
                                                                            if (!error && data && data[0]) {
                                                                                setAreas([...areas, data[0]]);
                                                                                setEditSelectedAreas([...editSelectedAreas, data[0].id_area]);
                                                                            }
                                                                        } else if (value) {
                                                                            const areaObj = areas.find(a => a.nombre === value);
                                                                            if (areaObj && !editSelectedAreas.includes(areaObj.id_area)) {
                                                                                setEditSelectedAreas([...editSelectedAreas, areaObj.id_area]);
                                                                            }
                                                                        }
                                                                        setEditAreaInput('');
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                    {/* Puesto como chip azul o aviso si no hay */}
                                                    <td className="px-4 py-2 text-sm">
                                                        {editEmployee.puesto && editEmployee.puesto.trim() !== '' ? (
                                                            <span className="flex items-center gap-1 bg-slate-600/20 text-slate-300 border border-slate-500/50 rounded-full px-2 py-0.5 text-xs font-semibold">
                                                                {editEmployee.puesto}
                                                            </span>
                                                        ) : (
                                                            <span className="text-amber-400 flex items-center gap-1 bg-amber-900/30 border border-amber-500 rounded-full px-2 py-0.5 text-xs font-semibold animate-fade-in">
                                                                <AlertTriangle size={14} />
                                                                <span>Sin puesto</span>
                                                            </span>
                                                        )}
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
                                                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
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
                                                        <div className="flex items-center text-red-400">
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
                                                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                                                                ) : (
                                                                    <CheckSquare size={16} />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={handleCancelDelete}
                                                                className="p-1 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                                                                title="Cancelar eliminación"
                                                            >
                                                                <XSquare size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className={`px-4 py-3 text-sm font-medium ${!employee.nombre || employee.nombre.trim() === '' ? 'bg-amber-900 bg-opacity-50 border-l-2 border-amber-500' : ''}`}>
                                                        {employee.nombre || (
                                                            <span className="text-amber-400 flex items-center gap-1">
                                                                <AlertTriangle size={14} />
                                                                <span>Sin nombre</span>
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className={`px-4 py-3 text-sm`}>
                                                        <div className="flex flex-wrap gap-1">
                                                            {/* Mostrar chips de áreas */}
                                                            {areas.length > 0 && (
                                                                <AreaChips areaIds={directorAreasMap[employee.id_directorio] || []} areas={areas} />
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* Puesto como chip azul o aviso si no hay */}
                                                    <td className={`px-4 py-3 text-sm ${!employee.puesto || employee.puesto.trim() === '' ? '' : ''}`}>
                                                        {employee.puesto && employee.puesto.trim() !== '' ? (
                                                            <span className="flex items-center gap-1 bg-slate-600/20 text-slate-300 border border-slate-500/50 rounded-full px-2 py-0.5 text-xs font-semibold">
                                                                {employee.puesto}
                                                            </span>
                                                        ) : (
                                                            <span className="text-amber-400 flex items-center gap-1 bg-amber-900/30 border border-amber-500 rounded-full px-2 py-0.5 text-xs font-semibold animate-fade-in">
                                                                <AlertTriangle size={14} />
                                                                <span>Sin puesto</span>
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right">
                                                        <div className="flex justify-end space-x-1">
                                                            <button
                                                                onClick={() => handleEdit(employee)}
                                                                className="p-1 hover:bg-gray-700 rounded-md transition-colors"
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
                        <div className="mt-3 text-white text-sm bg-black p-3 rounded-lg border-2 border-white/10 animate-fade-in">
                            <AlertTriangle size={16} className="inline-block mr-2 mb-1" />
                            {error}
                        </div>
                    )}

                    {/* Contador de resultados con estilo mejorado */}
                    <div className="mt-4 text-sm text-white bg-black p-2 rounded-lg border-2 border-white/10">
                        Mostrando {filteredDirectorio.length} de {directorio.length} empleados en el directorio
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
    const chips = areas.filter(a => areaIds.includes(a.id_area));
    if (chips.length === 0) {
        return (
            <span className="text-amber-400 flex items-center gap-1 bg-amber-900/30 border border-amber-500 rounded-full px-2 py-0.5 text-xs font-semibold animate-fade-in">
                <AlertTriangle size={14} />
                <span>Sin área</span>
            </span>
        );
    }
    return (
        <>
            {chips.map(area => (
                <span key={area.id_area} className="flex bg-white/5 text-white border border-white/20 rounded-full px-2 py-0.5 text-xs font-semibold items-center gap-1">
                    {area.nombre}
                </span>
            ))}
        </>
    );
}