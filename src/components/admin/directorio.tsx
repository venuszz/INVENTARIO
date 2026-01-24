"use client"
import { useState, useCallback, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Plus, Trash2, Edit, X, Search } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import SectionRealtimeToggle from '@/components/SectionRealtimeToggle';
import { useAdminIndexation } from '@/hooks/indexation/useAdminIndexation';
import { motion, AnimatePresence } from 'framer-motion';

interface Directorio {
    id_directorio: number;
    nombre: string | null;
    area: string | null;
    puesto: string | null;
}

export default function DirectorioManagementComponent() {
    const { isDarkMode } = useTheme();
    
    // Hook de indexación admin
    const { 
        directorio: directorioFromStore, 
        areas: areasFromStore, 
        directorioAreas: directorioAreasFromStore,
        realtimeConnected
    } = useAdminIndexation();
    
    // Estados locales
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [editEmployee, setEditEmployee] = useState<Directorio>({ id_directorio: 0, nombre: '', area: '', puesto: '' });
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    
    // Estados para áreas
    const [editSelectedAreas, setEditSelectedAreas] = useState<number[]>([]);
    const [newAreaInput, setNewAreaInput] = useState('');
    
    // Estados para agregar nuevo
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newEmployeeName, setNewEmployeeName] = useState('');
    const [newEmployeePuesto, setNewEmployeePuesto] = useState('');
    const [newEmployeeAreas, setNewEmployeeAreas] = useState<number[]>([]);
    const [newAreaInputAdd, setNewAreaInputAdd] = useState('');

    const editInputRef = useRef<HTMLInputElement>(null);
    const newEmployeeInputRef = useRef<HTMLInputElement>(null);
    const { createNotification } = useNotifications();

    // Mapear directorioAreas a un objeto para fácil acceso
    const directorAreasMap = directorioAreasFromStore.reduce((acc, rel) => {
        if (!acc[rel.id_directorio]) acc[rel.id_directorio] = [];
        acc[rel.id_directorio].push(rel.id_area);
        return acc;
    }, {} as { [id_directorio: number]: number[] });

    // Filtrar directorio según el término de búsqueda
    const filteredDirectorio = directorioFromStore.filter(item =>
        item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.puesto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id_directorio.toString().includes(searchTerm)
    );

    // Función para agregar área manualmente
    const addAreaManually = async (areaName: string, isEditing: boolean) => {
        const value = areaName.trim().toUpperCase();
        if (!value) return;
        
        // Verificar si ya existe
        const existingArea = areasFromStore.find(a => a.nombre === value);
        
        if (existingArea) {
            // Si existe, solo agregarla a la selección
            if (isEditing) {
                if (!editSelectedAreas.includes(existingArea.id_area)) {
                    setEditSelectedAreas(prev => [...prev, existingArea.id_area]);
                }
            } else {
                if (!newEmployeeAreas.includes(existingArea.id_area)) {
                    setNewEmployeeAreas(prev => [...prev, existingArea.id_area]);
                }
            }
        } else {
            // Crear nueva área
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
                    if (isEditing) {
                        setEditSelectedAreas(prev => [...prev, data[0].id_area]);
                    } else {
                        setNewEmployeeAreas(prev => [...prev, data[0].id_area]);
                    }
                }
            }
        }
    };

    // Manejadores de eventos
    const handleEdit = async (employee: Directorio) => {
        setEditingId(employee.id_directorio);
        setEditEmployee({ ...employee });
        
        const areasFromMap = directorAreasMap[employee.id_directorio] || [];
        setEditSelectedAreas([...areasFromMap]);
        setTimeout(() => editInputRef.current?.focus(), 100);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditEmployee({ id_directorio: 0, nombre: '', area: '', puesto: '' });
        setEditSelectedAreas([]);
        setNewAreaInput('');
    };

    const handleDelete = (id: number) => {
        setDeletingId(id);
    };

    const handleCancelDelete = () => {
        setDeletingId(null);
    };

    const handleSubmitEdit = async () => {
        setIsSubmitting(true);

        try {
            if (!editEmployee.nombre || editEmployee.nombre.trim() === '') {
                throw new Error('El nombre del empleado es obligatorio');
            }
            if (editSelectedAreas.length === 0) {
                throw new Error('Debes asignar al menos un área');
            }

            const nombreEmployee = editEmployee.nombre.trim().toUpperCase();
            const puestoEmployee = editEmployee.puesto?.trim().toUpperCase() || '';

            // Actualizar nombre y puesto
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
                throw new Error('Error al actualizar empleado');
            }

            // Actualizar áreas: eliminar todas y volver a insertar
            await fetch(`/api/supabase-proxy?target=${encodeURIComponent(`/rest/v1/directorio_areas?id_directorio=eq.${editEmployee.id_directorio}`)}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            // Insertar nuevas áreas
            for (const id_area of editSelectedAreas) {
                await fetch('/api/supabase-proxy?target=/rest/v1/directorio_areas', {
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
            }

            setEditingId(null);
            setEditEmployee({ id_directorio: 0, nombre: '', area: '', puesto: '' });
            setEditSelectedAreas([]);
            setNewAreaInput('');

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
            const errorMessage = (error instanceof Error) ? error.message : 'Ha ocurrido un error';
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
            
            await fetch(`/api/supabase-proxy?target=/rest/v1/directorio?id_directorio=eq.${id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            setDeletingId(null);

            await createNotification({
                title: 'Empleado eliminado',
                description: `Se eliminó a ${empleado?.nombre || ''} del directorio.`,
                type: 'danger',
                category: 'directorio',
                device: 'web',
                importance: 'high',
                data: { changes: [`Baja: ${empleado?.nombre || ''}`], affectedTables: ['directorio'] }
            });
        } catch (error: unknown) {
            const errorMessage = (error instanceof Error) ? error.message : 'Ha ocurrido un error';
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

    const handleAddNewEmployee = async () => {
        if (!newEmployeeName.trim()) return;
        
        setIsSubmitting(true);

        try {
            if (newEmployeeAreas.length === 0) {
                throw new Error('Debes asignar al menos un área');
            }

            const nombreEmployee = newEmployeeName.trim().toUpperCase();
            const puestoEmployee = newEmployeePuesto.trim().toUpperCase();

            // Agregar nuevo empleado
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

            // Guardar áreas
            for (const id_area of newEmployeeAreas) {
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

            setNewEmployeeName('');
            setNewEmployeePuesto('');
            setNewEmployeeAreas([]);
            setNewAreaInputAdd('');
            setIsAddingNew(false);

            await createNotification({
                title: 'Nuevo empleado agregado',
                description: `Se agregó a ${nombreEmployee} al directorio.`,
                type: 'success',
                category: 'directorio',
                device: 'web',
                importance: 'medium',
                data: { changes: [`Alta: ${nombreEmployee}`], affectedTables: ['directorio', 'directorio_areas'] }
            });
        } catch (error: unknown) {
            const errorMessage = (error instanceof Error) ? error.message : 'Ha ocurrido un error';
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

    return (
        <div className={`h-[calc(100vh-4rem)] overflow-hidden transition-colors duration-300 ${isDarkMode
            ? 'bg-black text-white'
            : 'bg-white text-black'
            }`}>
            <motion.div 
                className={`h-full overflow-y-auto p-4 md:p-8 ${
                    isDarkMode 
                        ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30'
                        : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20 hover:scrollbar-thumb-black/30'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="w-full max-w-5xl mx-auto pb-8">
                {/* Header */}
                <div className={`flex justify-between items-center mb-8 pb-6 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                    <div>
                        <h1 className="text-3xl font-light tracking-tight mb-1">
                            Directorio de Personal
                        </h1>
                        <p className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                            Gestiona el personal autorizado y sus áreas
                        </p>
                    </div>
                    <SectionRealtimeToggle 
                        sectionName="Directorio" 
                        isConnected={realtimeConnected} 
                    />
                </div>

                {/* Search and Add Button */}
                <motion.div 
                    className="mb-8 space-y-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {/* Search */}
                    <div className="relative">
                        <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm transition-all ${isDarkMode
                                ? 'bg-black border-white/10 text-white placeholder:text-white/40 focus:border-white/20'
                                : 'bg-white border-black/10 text-black placeholder:text-black/40 focus:border-black/20'
                                } focus:outline-none`}
                        />
                    </div>

                    {/* Add Button - Solo visible cuando no está agregando */}
                    <AnimatePresence>
                        {!isAddingNew && (
                            <motion.div
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all cursor-pointer ${isDarkMode
                                    ? 'border-white/10 hover:border-white/20'
                                    : 'border-black/10 hover:border-black/20'
                                    }`}
                                onClick={() => {
                                    setIsAddingNew(true);
                                    setTimeout(() => newEmployeeInputRef.current?.focus(), 100);
                                }}
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                whileHover={{ scale: 1.005 }}
                                whileTap={{ scale: 0.995 }}
                            >
                                <Plus size={16} className={`flex-shrink-0 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
                                <span className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                                    Agregar empleado...
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Add New Employee Form - Solo visible cuando está agregando */}
                    <AnimatePresence>
                        {isAddingNew && (
                            <motion.div 
                                className={`p-4 rounded-lg border space-y-3 ${isDarkMode
                                    ? 'border-white/20 bg-white/[0.02]'
                                    : 'border-black/20 bg-black/[0.02]'
                                    }`}
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Header con botón cerrar */}
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-xs font-medium ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                                        Nuevo empleado
                                    </span>
                                    <motion.button
                                        onClick={() => {
                                            setIsAddingNew(false);
                                            setNewEmployeeName('');
                                            setNewEmployeePuesto('');
                                            setNewEmployeeAreas([]);
                                            setNewAreaInputAdd('');
                                        }}
                                        className={`p-1 rounded transition-colors ${isDarkMode
                                            ? 'hover:bg-white/10'
                                            : 'hover:bg-black/10'
                                            }`}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <X size={14} />
                                    </motion.button>
                                </div>

                                {/* Nombre */}
                                <input
                                    ref={newEmployeeInputRef}
                                    type="text"
                                    placeholder="Nombre completo..."
                                    value={newEmployeeName}
                                    onChange={(e) => setNewEmployeeName(e.target.value.toUpperCase())}
                                    className={`w-full px-3 py-2 rounded-lg border text-sm transition-all ${isDarkMode
                                        ? 'bg-black border-white/10 text-white placeholder:text-white/40 focus:border-white/20'
                                        : 'bg-white border-black/10 text-black placeholder:text-black/40 focus:border-black/20'
                                        } focus:outline-none`}
                                />

                                {/* Puesto */}
                                <input
                                    type="text"
                                    placeholder="Puesto..."
                                    value={newEmployeePuesto}
                                    onChange={(e) => setNewEmployeePuesto(e.target.value.toUpperCase())}
                                    className={`w-full px-3 py-2 rounded-lg border text-sm transition-all ${isDarkMode
                                        ? 'bg-black border-white/10 text-white placeholder:text-white/40 focus:border-white/20'
                                        : 'bg-white border-black/10 text-black placeholder:text-black/40 focus:border-black/20'
                                        } focus:outline-none`}
                                />

                                {/* Áreas */}
                                <div className="space-y-2">
                                    <label className={`text-xs font-medium ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                                        Áreas (mínimo 1)
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        <AnimatePresence mode="popLayout">
                                            {newEmployeeAreas.map(id_area => {
                                                const areaObj = areasFromStore.find(a => a.id_area === id_area);
                                                return areaObj ? (
                                                    <motion.span 
                                                        key={`new-area-${id_area}`}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${isDarkMode
                                                            ? 'bg-white/10 text-white border border-white/20'
                                                            : 'bg-black/10 text-black border border-black/20'
                                                            }`}
                                                    >
                                                        {areaObj.nombre}
                                                        <motion.button
                                                            type="button"
                                                            onClick={() => setNewEmployeeAreas(newEmployeeAreas.filter(a => a !== id_area))}
                                                            className="hover:text-red-500 transition-colors"
                                                            whileHover={{ scale: 1.2 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            <X size={10} />
                                                        </motion.button>
                                                    </motion.span>
                                                ) : null;
                                            })}
                                        </AnimatePresence>
                                        <input
                                            type="text"
                                            placeholder="Agregar área..."
                                            className={`px-2 py-0.5 rounded-full text-xs border transition-all ${isDarkMode
                                                ? 'bg-black border-white/10 text-white placeholder:text-white/40 focus:border-white/20'
                                                : 'bg-white border-black/10 text-black placeholder:text-black/40 focus:border-black/20'
                                                } focus:outline-none`}
                                            value={newAreaInputAdd}
                                            onChange={e => setNewAreaInputAdd(e.target.value)}
                                            onKeyDown={async (e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const value = newAreaInputAdd.trim().toUpperCase();
                                                    if (value) {
                                                        await addAreaManually(value, false);
                                                        setNewAreaInputAdd('');
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Botón agregar */}
                                <AnimatePresence>
                                    {newEmployeeName.trim() && newEmployeeAreas.length > 0 && (
                                        <motion.button
                                            onClick={handleAddNewEmployee}
                                            disabled={isSubmitting}
                                            className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
                                                isSubmitting
                                                    ? isDarkMode
                                                        ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                                        : 'bg-black/5 text-black/20 cursor-not-allowed'
                                                    : isDarkMode
                                                        ? 'bg-white text-black hover:bg-white/90'
                                                        : 'bg-black text-white hover:bg-black/90'
                                            }`}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            whileHover={!isSubmitting ? { scale: 1.01 } : {}}
                                            whileTap={!isSubmitting ? { scale: 0.99 } : {}}
                                        >
                                            {isSubmitting ? (
                                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
                                            ) : (
                                                'Agregar'
                                            )}
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Lista de empleados */}
                <motion.div 
                    className="space-y-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <AnimatePresence mode="popLayout">
                        {filteredDirectorio.length === 0 ? (
                            <motion.div 
                                className={`text-center py-16 text-sm ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {searchTerm ? 'No se encontraron resultados' : 'No hay empleados registrados'}
                            </motion.div>
                        ) : (
                            filteredDirectorio.map((employee) => (
                                <motion.div
                                    key={employee.id_directorio}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ 
                                        layout: { type: 'spring', stiffness: 350, damping: 30 },
                                        opacity: { duration: 0.2 },
                                        y: { duration: 0.3 }
                                    }}
                                    className={`group rounded-lg border transition-all ${
                                        deletingId === employee.id_directorio
                                            ? isDarkMode
                                                ? 'bg-red-500/10 border-red-500/30'
                                                : 'bg-red-50 border-red-200'
                                            : isDarkMode
                                                ? 'bg-black border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                                                : 'bg-white border-black/5 hover:border-black/10 hover:bg-black/[0.02]'
                                    }`}
                                >
                                    {editingId === employee.id_directorio ? (
                                        // Modo edición
                                        <div className="p-4 space-y-3">
                                            {/* Nombre */}
                                            <input
                                                ref={editInputRef}
                                                type="text"
                                                value={editEmployee.nombre || ''}
                                                onChange={(e) => setEditEmployee({ ...editEmployee, nombre: e.target.value.toUpperCase() })}
                                                className={`w-full px-3 py-2 rounded-lg border text-sm font-medium transition-all ${isDarkMode
                                                    ? 'bg-black border-white/20 text-white focus:border-white/40'
                                                    : 'bg-white border-black/20 text-black focus:border-black/40'
                                                    } focus:outline-none`}
                                                placeholder="Nombre del empleado"
                                            />

                                            {/* Puesto */}
                                            <input
                                                type="text"
                                                value={editEmployee.puesto || ''}
                                                onChange={(e) => setEditEmployee({ ...editEmployee, puesto: e.target.value.toUpperCase() })}
                                                className={`w-full px-3 py-2 rounded-lg border text-sm transition-all ${isDarkMode
                                                    ? 'bg-black border-white/20 text-white focus:border-white/40'
                                                    : 'bg-white border-black/20 text-black focus:border-black/40'
                                                    } focus:outline-none`}
                                                placeholder="Puesto"
                                            />

                                            {/* Áreas */}
                                            <div className="space-y-2">
                                                <label className={`text-xs font-medium ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                                                    Áreas asignadas
                                                </label>
                                                <div className="flex flex-wrap gap-2">
                                                    <AnimatePresence mode="popLayout">
                                                        {editSelectedAreas.map(id_area => {
                                                            const areaObj = areasFromStore.find(a => a.id_area === id_area);
                                                            return areaObj ? (
                                                                <motion.span 
                                                                    key={`edit-area-${id_area}`}
                                                                    layout
                                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${isDarkMode
                                                                        ? 'bg-white/10 text-white border border-white/20'
                                                                        : 'bg-black/10 text-black border border-black/20'
                                                                        }`}
                                                                >
                                                                    {areaObj.nombre}
                                                                    <motion.button
                                                                        type="button"
                                                                        onClick={() => setEditSelectedAreas(editSelectedAreas.filter(a => a !== id_area))}
                                                                        className="hover:text-red-500 transition-colors"
                                                                        whileHover={{ scale: 1.2 }}
                                                                        whileTap={{ scale: 0.9 }}
                                                                    >
                                                                        <X size={12} />
                                                                    </motion.button>
                                                                </motion.span>
                                                            ) : null;
                                                        })}
                                                    </AnimatePresence>
                                                    <input
                                                        type="text"
                                                        placeholder="Agregar área..."
                                                        className={`px-2.5 py-1 rounded-full text-xs border transition-all ${isDarkMode
                                                            ? 'bg-black border-white/10 text-white placeholder:text-white/40 focus:border-white/20'
                                                            : 'bg-white border-black/10 text-black placeholder:text-black/40 focus:border-black/20'
                                                            } focus:outline-none`}
                                                        value={newAreaInput}
                                                        onChange={e => setNewAreaInput(e.target.value)}
                                                        onKeyDown={async (e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                const value = newAreaInput.trim().toUpperCase();
                                                                if (value) {
                                                                    await addAreaManually(value, true);
                                                                    setNewAreaInput('');
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Botones */}
                                            <div className="flex gap-2 pt-2">
                                                <motion.button
                                                    onClick={handleSubmitEdit}
                                                    disabled={isSubmitting}
                                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDarkMode
                                                        ? 'bg-white text-black hover:bg-white/90'
                                                        : 'bg-black text-white hover:bg-black/90'
                                                        }`}
                                                    whileHover={{ scale: 1.01 }}
                                                    whileTap={{ scale: 0.99 }}
                                                >
                                                    {isSubmitting ? (
                                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
                                                    ) : (
                                                        'Guardar'
                                                    )}
                                                </motion.button>
                                                <motion.button
                                                    onClick={handleCancelEdit}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDarkMode
                                                        ? 'hover:bg-white/5'
                                                        : 'hover:bg-black/5'
                                                        }`}
                                                    whileHover={{ scale: 1.01 }}
                                                    whileTap={{ scale: 0.99 }}
                                                >
                                                    Cancelar
                                                </motion.button>
                                            </div>
                                        </div>
                                    ) : deletingId === employee.id_directorio ? (
                                        // Modo eliminación
                                        <div className="p-4 flex items-center justify-between">
                                            <span className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                                                ¿Eliminar a {employee.nombre}?
                                            </span>
                                            <div className="flex gap-2">
                                                <motion.button
                                                    onClick={() => handleConfirmDelete(employee.id_directorio)}
                                                    disabled={isSubmitting}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-all"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    {isSubmitting ? (
                                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        'Confirmar'
                                                    )}
                                                </motion.button>
                                                <motion.button
                                                    onClick={handleCancelDelete}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isDarkMode
                                                        ? 'hover:bg-white/5'
                                                        : 'hover:bg-black/5'
                                                        }`}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    Cancelar
                                                </motion.button>
                                            </div>
                                        </div>
                                    ) : (
                                        // Modo visualización
                                        <div className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h3 className="text-sm font-medium mb-1">{employee.nombre}</h3>
                                                    {employee.puesto && (
                                                        <p className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                                                            {employee.puesto}
                                                        </p>
                                                    )}
                                                </div>
                                                <motion.div 
                                                    className="flex gap-1"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <motion.button
                                                        onClick={() => handleEdit(employee)}
                                                        className={`p-2 rounded-lg transition-colors ${isDarkMode
                                                            ? 'hover:bg-white/5'
                                                            : 'hover:bg-black/5'
                                                            }`}
                                                        title="Editar"
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <Edit size={14} />
                                                    </motion.button>
                                                    <motion.button
                                                        onClick={() => handleDelete(employee.id_directorio)}
                                                        className={`p-2 rounded-lg transition-colors ${isDarkMode
                                                            ? 'hover:bg-red-500/10 hover:text-red-400'
                                                            : 'hover:bg-red-50 hover:text-red-600'
                                                            }`}
                                                        title="Eliminar"
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </motion.button>
                                                </motion.div>
                                            </div>
                                            
                                            {/* Áreas */}
                                            <div className="flex flex-wrap gap-1.5">
                                                {(directorAreasMap[employee.id_directorio] || []).map(id_area => {
                                                    const areaObj = areasFromStore.find(a => a.id_area === id_area);
                                                    return areaObj ? (
                                                        <span 
                                                            key={`view-area-${id_area}`}
                                                            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${isDarkMode
                                                                ? 'bg-white/5 text-white/80 border border-white/10'
                                                                : 'bg-black/5 text-black/80 border border-black/10'
                                                                }`}
                                                        >
                                                            {areaObj.nombre}
                                                        </span>
                                                    ) : null;
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Footer */}
                <motion.div 
                    className={`mt-8 pt-4 border-t text-xs ${isDarkMode ? 'border-white/10 text-white/40' : 'border-black/10 text-black/40'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    {filteredDirectorio.length} de {directorioFromStore.length} empleados
                </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
