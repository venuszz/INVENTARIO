"use client"
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Plus, Trash2, Edit, X, Search } from 'lucide-react';
import SectionRealtimeToggle from '@/components/SectionRealtimeToggle';
import { useAdminIndexation } from '@/hooks/indexation/useAdminIndexation';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfigItem {
    id: number;
    tipo: string;
    concepto: string;
}

// Define los tipos de configuración disponibles
const CONFIG_TYPES = [
    { id: 'estatus', label: 'Estatus' },
    { id: 'rubro', label: 'Rubros' },
    { id: 'formadq', label: 'Formas de Adquisición' }
];

export default function ConfigManagementComponent() {
    const { isDarkMode } = useTheme();
    
    // Usar config desde el hook de indexación admin
    const { config: configItems, realtimeConnected } = useAdminIndexation();
    
    // Estados
    const [editingRow, setEditingRow] = useState<number | null>(null);
    const [deletingRow, setDeletingRow] = useState<number | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>('estatus');
    const [newItemValue, setNewItemValue] = useState<string>('');

    const editInputRef = useRef<HTMLInputElement>(null);
    const newItemInputRef = useRef<HTMLInputElement>(null);

    // Efecto para enfocar el input de edición cuando se activa
    useEffect(() => {
        if (editingRow !== null && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingRow]);

    // Filtrar elementos según el tipo activo y término de búsqueda
    const filteredItems = configItems.filter(item =>
        item.tipo === activeTab &&
        (item.concepto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toString().includes(searchTerm))
    );

    // Manejadores de eventos
    const handleEdit = (item: ConfigItem) => {
        if (editingRow !== null && editingRow !== item.id) {
            setEditingRow(null);
        }
        setEditingRow(item.id);
        setEditValue(item.concepto || '');
        setDeletingRow(null);
    };

    const handleDelete = (itemId: number) => {
        if (deletingRow !== null && deletingRow !== itemId) {
            setDeletingRow(null);
        }
        setDeletingRow(deletingRow === itemId ? null : itemId);
        setEditingRow(null);
    };

    const cancelRowEdit = () => {
        setEditingRow(null);
        setEditValue('');
    };

    const cancelDelete = () => {
        setDeletingRow(null);
    };

    const confirmDelete = async (itemId: number) => {
        setIsSubmitting(true);
        try {
            const item = configItems.find(i => i.id === itemId);
            
            const response = await fetch('/api/supabase-proxy?target=' + encodeURIComponent(`/rest/v1/config?id=eq.${itemId}`), {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al eliminar');
            }

            setDeletingRow(null);
            // Notification removed
        } catch (error: unknown) {
            const errorMessage = (error instanceof Error) ? error.message : 'Ha ocurrido un error';
            // Notification removed
        } finally {
            setIsSubmitting(false);
        }
    };

    const saveRowEdit = async (itemId: number) => {
        setIsSubmitting(true);

        try {
            if (!editValue || editValue.trim() === '') {
                throw new Error('El concepto es obligatorio');
            }

            const conceptoValue = editValue.trim().toUpperCase();

            const existingItem = configItems.find(item =>
                item.concepto?.toUpperCase() === conceptoValue &&
                item.tipo === activeTab &&
                item.id !== itemId
            );

            if (existingItem) {
                throw new Error('Este concepto ya existe');
            }

            const oldItem = configItems.find(item => item.id === itemId);

            const response = await fetch('/api/supabase-proxy?target=' + encodeURIComponent(`/rest/v1/config?id=eq.${itemId}&select=*`), {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({ concepto: conceptoValue })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al actualizar');
            }

            setEditingRow(null);
            // Notification removed
        } catch (error: unknown) {
            const errorMessage = (error instanceof Error) ? error.message : 'Ha ocurrido un error';
            // Notification removed
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddNewItem = async () => {
        if (!newItemValue.trim()) return;
        
        setIsSubmitting(true);

        try {
            const conceptoValue = newItemValue.trim().toUpperCase();

            const existingItem = configItems.find(item =>
                item.concepto?.toUpperCase() === conceptoValue &&
                item.tipo === activeTab
            );

            if (existingItem) {
                throw new Error('Este concepto ya existe');
            }

            const response = await fetch('/api/supabase-proxy?target=' + encodeURIComponent('/rest/v1/config?select=*'), {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({ tipo: activeTab, concepto: conceptoValue })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al insertar');
            }

            setNewItemValue('');
            newItemInputRef.current?.focus();
            // Notification removed
        } catch (error: unknown) {
            const errorMessage = (error instanceof Error) ? error.message : 'Ha ocurrido un error';
            // Notification removed
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setSearchTerm('');
        setEditingRow(null);
        setDeletingRow(null);
        setNewItemValue('');
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
                            Gestión de Configuración
                        </h1>
                        <p className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                            Administra los catálogos del sistema
                        </p>
                    </div>
                    <SectionRealtimeToggle 
                        sectionName="Configuración" 
                        isConnected={realtimeConnected} 
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-8 mb-8">
                    {CONFIG_TYPES.map((type, index) => (
                        <motion.button
                            key={type.id}
                            onClick={() => handleTabChange(type.id)}
                            className={`relative text-sm font-medium pb-3 transition-colors ${activeTab === type.id
                                ? isDarkMode ? 'text-white' : 'text-black'
                                : isDarkMode ? 'text-white/40 hover:text-white/60' : 'text-black/40 hover:text-black/60'
                                }`}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            {type.label}
                            {activeTab === type.id && (
                                <motion.div
                                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDarkMode ? 'bg-white' : 'bg-black'}`}
                                    layoutId="activeTab"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                            )}
                        </motion.button>
                    ))}
                </div>

                {/* Search and Add */}
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

                    {/* Add New Item - Inline style */}
                    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${
                        newItemValue.trim() 
                            ? isDarkMode 
                                ? 'border-white/20 bg-white/[0.02]' 
                                : 'border-black/20 bg-black/[0.02]'
                            : isDarkMode
                                ? 'border-white/10'
                                : 'border-black/10'
                    }`}>
                        <Plus size={16} className={`flex-shrink-0 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
                        <input
                            ref={newItemInputRef}
                            type="text"
                            placeholder="Agregar concepto..."
                            value={newItemValue}
                            onChange={(e) => setNewItemValue(e.target.value.toUpperCase())}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newItemValue.trim()) {
                                    handleAddNewItem();
                                }
                            }}
                            className={`flex-1 bg-transparent border-none text-sm transition-colors ${isDarkMode
                                ? 'text-white placeholder:text-white/40'
                                : 'text-black placeholder:text-black/40'
                                } focus:outline-none`}
                        />
                        <AnimatePresence>
                            {newItemValue.trim() && (
                                <motion.button
                                    onClick={handleAddNewItem}
                                    disabled={isSubmitting}
                                    className={`flex-shrink-0 px-3 py-1 rounded text-xs font-medium transition-all ${
                                        isSubmitting
                                            ? isDarkMode
                                                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                                : 'bg-black/5 text-black/20 cursor-not-allowed'
                                            : isDarkMode
                                                ? 'bg-white text-black hover:bg-white/90'
                                                : 'bg-black text-white hover:bg-black/90'
                                    }`}
                                    initial={{ opacity: 0, scale: 0.8, width: 0 }}
                                    animate={{ opacity: 1, scale: 1, width: 'auto' }}
                                    exit={{ opacity: 0, scale: 0.8, width: 0 }}
                                    transition={{ duration: 0.2 }}
                                    whileHover={!isSubmitting ? { scale: 1.05 } : {}}
                                    whileTap={!isSubmitting ? { scale: 0.95 } : {}}
                                >
                                    {isSubmitting ? (
                                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        'Enter'
                                    )}
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Lista de items */}
                <motion.div 
                    className="space-y-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <AnimatePresence mode="popLayout">
                        {filteredItems.length === 0 ? (
                            <motion.div 
                                className={`text-center py-16 text-sm ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {searchTerm ? 'No se encontraron resultados' : 'No hay conceptos registrados'}
                            </motion.div>
                        ) : (
                            filteredItems.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ 
                                        layout: { type: 'spring', stiffness: 350, damping: 30 },
                                        opacity: { duration: 0.2 },
                                        y: { duration: 0.3 }
                                    }}
                                    className={`group flex items-center justify-between px-4 py-3.5 rounded-lg border transition-all ${
                                        deletingRow === item.id
                                            ? isDarkMode
                                                ? 'bg-red-500/10 border-red-500/30'
                                                : 'bg-red-50 border-red-200'
                                            : isDarkMode
                                                ? 'bg-black border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                                                : 'bg-white border-black/5 hover:border-black/10 hover:bg-black/[0.02]'
                                    }`}
                                >
                                    {editingRow === item.id ? (
                                        <>
                                            <input
                                                ref={editInputRef}
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        saveRowEdit(item.id);
                                                    } else if (e.key === 'Escape') {
                                                        cancelRowEdit();
                                                    }
                                                }}
                                                className={`flex-1 px-3 py-1.5 rounded-lg border text-sm transition-colors ${isDarkMode
                                                    ? 'bg-black border-white/20 text-white focus:border-white/40'
                                                    : 'bg-white border-black/20 text-black focus:border-black/40'
                                                    } focus:outline-none`}
                                                disabled={isSubmitting}
                                            />
                                            <div className="flex gap-2 ml-3">
                                                <motion.button
                                                    onClick={() => saveRowEdit(item.id)}
                                                    disabled={isSubmitting}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isDarkMode
                                                        ? 'bg-white text-black hover:bg-white/90'
                                                        : 'bg-black text-white hover:bg-black/90'
                                                        }`}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    {isSubmitting ? (
                                                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        'Guardar'
                                                    )}
                                                </motion.button>
                                                <motion.button
                                                    onClick={cancelRowEdit}
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
                                        </>
                                    ) : deletingRow === item.id ? (
                                        <>
                                            <span className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                                                ¿Eliminar "{item.concepto}"?
                                            </span>
                                            <div className="flex gap-2">
                                                <motion.button
                                                    onClick={() => confirmDelete(item.id)}
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
                                                    onClick={cancelDelete}
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
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-sm font-medium">{item.concepto}</span>
                                            <motion.div 
                                                className="flex gap-1"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <motion.button
                                                    onClick={() => handleEdit(item)}
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
                                                    onClick={() => handleDelete(item.id)}
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
                                        </>
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
                    {filteredItems.length} de {configItems.filter(item => item.tipo === activeTab).length} conceptos
                </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
