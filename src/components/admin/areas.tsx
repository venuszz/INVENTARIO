"use client"
import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Save, Trash2, Edit, AlertTriangle, CheckCircle, X, Search, RefreshCw, Layers } from 'lucide-react';
import supabase from "@/app/lib/supabase/client";
import { useNotifications } from '@/hooks/useNotifications';

interface ConfigItem {
    id: number;
    tipo: string;
    concepto: string;
}

interface Message {
    type: 'success' | 'error' | '';
    text: string;
}

// Define los tipos de configuración disponibles
const CONFIG_TYPES = [
    { id: 'estatus', label: 'Estatus' },
    { id: 'rubro', label: 'Rubros' },
    { id: 'formadq', label: 'Formas de Adquisición' }
];

export default function ConfigManagementComponent() {
    // Estados
    const [configItems, setConfigItems] = useState<ConfigItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [formMode, setFormMode] = useState<'add' | ''>('');
    const [editingRow, setEditingRow] = useState<number | null>(null);
    const [deletingRow, setDeletingRow] = useState<number | null>(null);
    const [currentItem, setCurrentItem] = useState<ConfigItem>({ id: 0, tipo: 'estatus', concepto: '' });
    const [editValue, setEditValue] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [message, setMessage] = useState<Message>({ type: '', text: '' });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [activeTab, setActiveTab] = useState<string>('estatus');

    const inputRef = useRef<HTMLInputElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);

    const { createNotification } = useNotifications();

    // Cargar datos de configuración
    const fetchConfigItems = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('config')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;
            setConfigItems(data || []);
        } catch (error) {
            console.error('Error cargando configuraciones:', error);
            setError('Error al cargar las configuraciones');
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar datos al montar el componente
    useEffect(() => {
        fetchConfigItems();
    }, [fetchConfigItems]);

    // Efecto para enfocar el input de edición cuando se activa
    useEffect(() => {
        if (editingRow !== null && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingRow]);

    // Filtrar elementos según el tipo activo y término de búsqueda
    const filteredItems = configItems.filter(item =>
        item.tipo === activeTab &&
        (item.concepto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toString().includes(searchTerm))
    );

    // Manejadores de eventos
    const handleAdd = () => {
        setFormMode('add');
        setCurrentItem({ id: 0, tipo: activeTab, concepto: '' });
        setEditingRow(null);
        setDeletingRow(null);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleEdit = (item: ConfigItem) => {
        // Si ya estamos editando otra fila, cancelar esa edición
        if (editingRow !== null && editingRow !== item.id) {
            cancelRowEdit();
        }

        setEditingRow(item.id);
        setEditValue(item.concepto || '');
        setDeletingRow(null);
        setFormMode('');
    };

    const handleDelete = (itemId: number) => {
        // Si ya estamos confirmando borrar otra fila, cancelar esa confirmación
        if (deletingRow !== null && deletingRow !== itemId) {
            setDeletingRow(null);
        }

        // Toggle el estado de borrado para esta fila
        setDeletingRow(deletingRow === itemId ? null : itemId);
        setEditingRow(null);
        setFormMode('');
    };

    const handleCancel = () => {
        setFormMode('');
        setCurrentItem({ id: 0, tipo: activeTab, concepto: '' });
        setError('');
    };

    const cancelRowEdit = () => {
        setEditingRow(null);
        setEditValue('');
        setError('');
    };

    const cancelDelete = () => {
        setDeletingRow(null);
    };

    const confirmDelete = async (itemId: number) => {
        setIsSubmitting(true);
        try {
            const item = configItems.find(i => i.id === itemId);
            const { error } = await supabase
                .from('config')
                .delete()
                .eq('id', itemId);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Registro eliminado correctamente' });
            setDeletingRow(null);
            fetchConfigItems();

            // Notificación de eliminación
            await createNotification({
                title: `Concepto eliminado (${item?.tipo})`,
                description: `Se eliminó el concepto "${item?.concepto}" del tipo "${item?.tipo}" en configuración.`,
                type: 'danger',
                category: 'config',
                device: 'web',
                importance: 'high',
                data: { changes: [`Eliminado: ${item?.concepto}`], affectedTables: ['config'] }
            });
        } catch (error: unknown) {
            console.error('Error:', error);
            const errorMessage = (error instanceof Error) ? error.message : 'Ha ocurrido un error';
            setMessage({ type: 'error', text: errorMessage || 'Ha ocurrido un error al eliminar el registro' });

            // Notificación de error
            await createNotification({
                title: 'Error al eliminar concepto',
                description: errorMessage,
                type: 'danger',
                category: 'config',
                device: 'web',
                importance: 'high',
                data: { affectedTables: ['config'] }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const saveRowEdit = async (itemId: number) => {
        setIsSubmitting(true);
        setError('');

        try {
            // Validación
            if (!editValue || editValue.trim() === '') {
                throw new Error('El concepto es obligatorio');
            }

            // Ya no necesitamos convertir aquí porque se convierte en tiempo real
            const conceptoValue = editValue;

            // Verificar si el nuevo concepto ya existe (excluyendo el item actual)
            const existingItem = configItems.find(item =>
                item.concepto?.toUpperCase() === conceptoValue &&
                item.tipo === activeTab &&
                item.id !== itemId
            );

            if (existingItem) {
                throw new Error('Este concepto ya existe');
            }

            const oldItem = configItems.find(item => item.id === itemId);

            // Editar configuración existente
            const { error } = await supabase
                .from('config')
                .update({ concepto: conceptoValue })
                .eq('id', itemId);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Registro actualizado correctamente' });
            setEditingRow(null);
            fetchConfigItems();

            // Notificación de edición
            await createNotification({
                title: `Concepto actualizado (${oldItem?.tipo})`,
                description: `Se actualizó el concepto "${oldItem?.concepto}" a "${conceptoValue}" en el tipo "${oldItem?.tipo}" de configuración.`,
                type: 'info',
                category: 'config',
                device: 'web',
                importance: 'medium',
                data: { changes: [`Edición: ${oldItem?.concepto} → ${conceptoValue}`], affectedTables: ['config'] }
            });
        } catch (error: unknown) {
            console.error('Error:', error);
            const errorMessage = (error instanceof Error) ? error.message : 'Ha ocurrido un error';
            setError(errorMessage);
            setMessage({ type: 'error', text: errorMessage || 'Ha ocurrido un error al actualizar el registro' });

            // Notificación de error
            await createNotification({
                title: 'Error al editar concepto',
                description: errorMessage,
                type: 'danger',
                category: 'config',
                device: 'web',
                importance: 'high',
                data: { affectedTables: ['config'] }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            // Validación de campos
            if (!currentItem.concepto || currentItem.concepto.trim() === '') {
                throw new Error('El concepto es obligatorio');
            }

            // Ya no necesitamos convertir aquí porque se convierte en tiempo real
            const conceptoValue = currentItem.concepto;

            // Verificar si el concepto ya existe
            const existingItem = configItems.find(item =>
                item.concepto?.toUpperCase() === conceptoValue &&
                item.tipo === activeTab
            );

            if (existingItem) {
                throw new Error('Este concepto ya existe');
            }

            // Agregar nuevo item de configuración
            const { error } = await supabase
                .from('config')
                .insert([{ tipo: activeTab, concepto: conceptoValue }])
                .select();

            if (error) throw error;

            setMessage({ type: 'success', text: 'Registro agregado correctamente' });

            // Recargar datos después de la operación
            fetchConfigItems();
            setFormMode('');
            setCurrentItem({ id: 0, tipo: activeTab, concepto: '' });

            // Notificación de alta
            await createNotification({
                title: `Concepto agregado (${activeTab})`,
                description: `Se agregó el concepto "${conceptoValue}" al tipo "${activeTab}" en configuración.`,
                type: 'success',
                category: 'config',
                device: 'web',
                importance: 'medium',
                data: { changes: [`Alta: ${conceptoValue}`], affectedTables: ['config'] }
            });
        } catch (error: unknown) {
            console.error('Error:', error);
            const errorMessage = (error instanceof Error) ? error.message : 'Ha ocurrido un error';
            setError(errorMessage);
            setMessage({ type: 'error', text: errorMessage || 'Ha ocurrido un error al procesar la solicitud' });

            // Notificación de error
            await createNotification({
                title: 'Error al agregar concepto',
                description: errorMessage,
                type: 'danger',
                category: 'config',
                device: 'web',
                importance: 'high',
                data: { affectedTables: ['config'] }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseMessage = () => setMessage({ type: '', text: '' });

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setSearchTerm('');
        setFormMode('');
        setEditingRow(null);
        setDeletingRow(null);
        setError('');
    };

    // Obtener el título según el tipo activo
    const getActiveTabLabel = () => {
        const activeTabObj = CONFIG_TYPES.find(type => type.id === activeTab);
        return activeTabObj ? activeTabObj.label : 'Configuración';
    };

    return (
        <div className="bg-black text-white min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 animate-gradient-x">
            <div className="w-full mx-auto bg-black/50 rounded-lg sm:rounded-xl shadow-2xl overflow-hidden transition-all duration-500 transform border border-gray-800/50 backdrop-blur-sm hover:border-gray-700/50">
                {/* Header con título y efecto glassmorphism */}
                <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800/50 gap-2 sm:gap-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-200 to-blue-400 animate-text">
                        <span className="mr-2 sm:mr-3 bg-blue-500/10 text-blue-300 p-1 sm:p-2 rounded-lg border border-blue-500/20 text-sm sm:text-base shadow-lg shadow-blue-500/5 hover:shadow-blue-500/10 transition-all">ADM</span>
                        Gestión de Configuración
                    </h1>
                </div>

                {/* Tabs con efecto hover y gradientes */}
                <div className="px-2 sm:px-4 md:px-6 pt-4 sm:pt-6 border-b border-gray-800">
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                        {CONFIG_TYPES.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => handleTabChange(type.id)}
                                className={`px-3 py-2 rounded-t-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                                    activeTab === type.id
                                        ? 'bg-gradient-to-r from-blue-900/50 via-blue-800/50 to-blue-900/50 text-blue-200 border-t border-l border-r border-blue-500/30 shadow-lg shadow-blue-500/20'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-900/50 hover:shadow-md'
                                }`}
                            >
                                <div className="flex items-center">
                                    <Layers size={16} className={`mr-1.5 ${activeTab === type.id ? 'text-blue-400 animate-pulse' : ''}`} />
                                    {type.label}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mensajes con animación mejorada */}
                {message.text && (
                    <div className={`mx-2 sm:mx-4 md:mx-6 mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg flex items-center justify-between transition-all duration-500 animate-slide-in-right ${
                        message.type === 'success' 
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
                                placeholder={`Buscar ${getActiveTabLabel().toLowerCase()}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-64 bg-black/50 border border-gray-700 rounded-lg p-2 pl-8 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-sm backdrop-blur-sm group-hover:border-gray-600"
                            />
                            <Search size={18} className="absolute left-2 top-2.5 text-gray-500 group-hover:text-gray-400 transition-colors" />
                        </div>

                        {/* Botones con gradientes y efectos hover */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleAdd}
                                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600/20 via-blue-500/20 to-blue-600/20 hover:from-blue-600/30 hover:via-blue-500/30 hover:to-blue-600/30 border border-blue-500/30 rounded-lg transition-all duration-300 text-sm transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 group"
                            >
                                <Plus size={16} className="mr-1.5 text-blue-400 group-hover:rotate-90 transition-transform duration-300" />
                                Agregar {getActiveTabLabel()}
                            </button>
                            <button
                                title='Recargar'
                                onClick={fetchConfigItems}
                                className="p-2 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 hover:from-gray-700 hover:via-gray-600 hover:to-gray-700 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
                            >
                                <RefreshCw size={16} className="text-gray-300 group-hover:rotate-180 transition-transform duration-500" />
                            </button>
                        </div>
                    </div>

                    {/* Formulario con efectos de glassmorphism */}
                    {formMode === 'add' && (
                        <div className="mb-6 bg-gradient-to-br from-gray-900/50 via-black/50 to-gray-900/50 p-4 rounded-lg border border-gray-800/50 animate-fade-in backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                            <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-800">
                                Agregar Nuevo {getActiveTabLabel()}
                            </h2>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="block mb-1 text-sm font-medium">
                                        Concepto <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={currentItem.concepto || ''}
                                        onChange={(e) => setCurrentItem({ ...currentItem, concepto: e.target.value.toUpperCase() })}
                                        className={`w-full bg-black border ${error ? 'border-red-500' : 'border-gray-700'} rounded-lg p-2 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all`}
                                        placeholder={`Nombre del ${getActiveTabLabel().toLowerCase()}`}
                                    />
                                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    {currentItem.concepto && currentItem.concepto.trim() !== '' ? (
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1
                                            ${activeTab === 'estatus' ? 'bg-blue-900/40 text-blue-200 border border-blue-700' :
                                              activeTab === 'rubro' ? 'bg-green-900/40 text-green-200 border border-green-700' :
                                              activeTab === 'formadq' ? 'bg-purple-900/40 text-purple-200 border border-purple-700' :
                                              'bg-gray-900/40 text-gray-200 border border-gray-700'}
                                        `}>
                                            {currentItem.concepto}
                                        </span>
                                    ) : (
                                        <span className="text-amber-400 flex items-center gap-1 bg-amber-900/30 border border-amber-500 rounded-full px-2 py-0.5 text-xs font-semibold animate-fade-in">
                                            <AlertTriangle size={14} />
                                            <span>Sin concepto</span>
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-3 py-1.5 rounded-lg transition-colors text-sm flex items-center bg-white text-black hover:bg-gray-200"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-gray-400 border-t-white rounded-full animate-spin mr-2"></div>
                                                Procesando...
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={16} className="mr-1" />
                                                Agregar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Tabla con efectos mejorados */}
                    <div className="overflow-x-auto border border-gray-800/50 rounded-lg backdrop-blur-sm shadow-xl">
                        <table className="min-w-full divide-y divide-gray-800/50">
                            <thead className="bg-gradient-to-r from-gray-900 via-black to-gray-900">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        {getActiveTabLabel()}
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-black/50 divide-y divide-gray-800/30">
                                {loading ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-4 text-center text-sm">
                                            <div className="flex justify-center items-center">
                                                <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin mr-2"></div>
                                                Cargando datos...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-4 text-center text-sm">
                                            {searchTerm
                                                ? `No se encontraron ${getActiveTabLabel().toLowerCase()} con el término de búsqueda.`
                                                : `No hay ${getActiveTabLabel().toLowerCase()} registrados.`}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item) => (
                                        <tr key={item.id} className={`hover:bg-gray-900 transition-colors ${deletingRow === item.id ? 'bg-red-900 bg-opacity-20' : ''}`}>
                                            <td className="px-4 py-3 text-sm">
                                                {editingRow === item.id ? (
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            ref={editInputRef}
                                                            type="text"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                                                            className={`w-full bg-black border ${error && editingRow === item.id ? 'border-red-500' : 'border-gray-700'} rounded-lg p-1 focus:border-white focus:ring focus:ring-gray-700 focus:ring-opacity-50 transition-all text-sm`}
                                                            placeholder={`Nombre del ${getActiveTabLabel().toLowerCase()}`}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    saveRowEdit(item.id);
                                                                } else if (e.key === 'Escape') {
                                                                    cancelRowEdit();
                                                                }
                                                            }}
                                                        />
                                                        <div className="flex space-x-1">
                                                            <button
                                                                onClick={() => saveRowEdit(item.id)}
                                                                className="p-1 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
                                                                title="Guardar"
                                                                disabled={isSubmitting}
                                                            >
                                                                {isSubmitting ? (
                                                                    <div className="w-3 h-3 border-2 border-gray-500 border-t-white rounded-full animate-spin"></div>
                                                                ) : (
                                                                    <Save size={16} />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={cancelRowEdit}
                                                                className="p-1 hover:bg-gray-700 rounded-md transition-colors"
                                                                title="Cancelar"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    item.concepto && item.concepto.trim() !== '' ? (
                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1
                                                            ${item.tipo === 'estatus' ? 'bg-blue-900/40 text-blue-200 border border-blue-700' :
                                                              item.tipo === 'rubro' ? 'bg-green-900/40 text-green-200 border border-green-700' :
                                                              item.tipo === 'formadq' ? 'bg-purple-900/40 text-purple-200 border border-purple-700' :
                                                              'bg-gray-900/40 text-gray-200 border border-gray-700'}
                                                        `}>
                                                            {item.concepto}
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-400 flex items-center gap-1 bg-amber-900/30 border border-amber-500 rounded-full px-2 py-0.5 text-xs font-semibold animate-fade-in">
                                                            <AlertTriangle size={14} />
                                                            <span>Sin concepto</span>
                                                        </span>
                                                    )
                                                )}
                                                {error && editingRow === item.id && (
                                                    <p className="text-red-500 text-xs mt-1">{error}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right">
                                                {editingRow === item.id ? (
                                                    <div className="flex justify-end space-x-1 opacity-50">
                                                        <button
                                                            title='Editar'
                                                            className="p-1 hover:bg-gray-700 rounded-md transition-colors cursor-not-allowed"
                                                            disabled
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            title='Eliminar'
                                                            className="p-1 hover:bg-red-900 rounded-md transition-colors cursor-not-allowed"
                                                            disabled
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ) : deletingRow === item.id ? (
                                                    <div className="flex justify-end space-x-1 items-center">
                                                        <span className="text-xs mr-2 text-red-300">¿Eliminar?</span>
                                                        <button
                                                            onClick={() => confirmDelete(item.id)}
                                                            className="p-1 bg-red-700 hover:bg-red-600 rounded-md transition-colors"
                                                            title="Confirmar eliminación"
                                                            disabled={isSubmitting}
                                                        >
                                                            {isSubmitting ? (
                                                                <div className="w-3 h-3 border-2 border-gray-500 border-t-white rounded-full animate-spin"></div>
                                                            ) : (
                                                                <CheckCircle size={16} />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={cancelDelete}
                                                            className="p-1 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
                                                            title="Cancelar"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end space-x-1">
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="p-1 hover:bg-gray-700 rounded-md transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-1 hover:bg-red-900 rounded-md transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Contador de resultados */}
                    <div className="mt-4 text-sm text-gray-400">
                        Mostrando {filteredItems.length} de {configItems.filter(item => item.tipo === activeTab).length} {getActiveTabLabel().toLowerCase()}
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