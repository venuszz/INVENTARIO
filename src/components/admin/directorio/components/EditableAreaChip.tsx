"use client"
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Check, X, Package, FileText } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface EditableAreaChipProps {
    areaId: number;
    areaName: string;
    directorId: number;
    bienesCount: number;
    resguardosCount: number;
    hasConflict: boolean;
    conflictTooltip?: string;
    isHighlighted?: boolean;
    onRemove?: () => void;
    canRemove?: boolean;
    onAreaNameUpdate?: (areaId: number, newName: string) => Promise<void>;
    isEditMode?: boolean; // Nuevo: indica si el director está en modo edición
}

export function EditableAreaChip({
    areaId,
    areaName,
    directorId,
    bienesCount,
    resguardosCount,
    hasConflict,
    conflictTooltip,
    isHighlighted = false,
    onRemove,
    canRemove = true,
    onAreaNameUpdate,
    isEditMode = false
}: EditableAreaChipProps) {
    const { isDarkMode } = useTheme();
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(areaName);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Determinar si se puede editar: debe estar en modo edición del director, no tener resguardos ni conflictos
    const canEdit = isEditMode && resguardosCount === 0 && !hasConflict && onAreaNameUpdate;

    // Sincronizar el estado local cuando el prop areaName cambia (actualización desde indexación)
    useEffect(() => {
        setEditValue(areaName);
    }, [areaName]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleStartEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (canEdit) {
            setIsEditing(true);
            setEditValue(areaName);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditValue(areaName);
    };

    const handleSaveEdit = async () => {
        const trimmedValue = editValue.trim().toUpperCase();
        
        if (!trimmedValue || trimmedValue === areaName) {
            handleCancelEdit();
            return;
        }

        setIsSubmitting(true);
        try {
            if (onAreaNameUpdate) {
                await onAreaNameUpdate(areaId, trimmedValue);
            }
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating area name:', error);
            setEditValue(areaName);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };

    if (isEditing) {
        return (
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full border ${
                    isDarkMode
                        ? 'bg-white/10 border-white/30'
                        : 'bg-black/10 border-black/30'
                }`}
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown}
                    disabled={isSubmitting}
                    className={`w-32 px-1 py-0.5 text-xs font-medium bg-transparent border-none outline-none ${
                        isDarkMode ? 'text-white' : 'text-black'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                />
                <motion.button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isSubmitting}
                    className={`p-0.5 rounded transition-colors ${
                        isDarkMode
                            ? 'hover:bg-green-500/20 text-green-400'
                            : 'hover:bg-green-100 text-green-600'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    {isSubmitting ? (
                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Check size={12} />
                    )}
                </motion.button>
                <motion.button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                    className={`p-0.5 rounded transition-colors ${
                        isDarkMode
                            ? 'hover:bg-red-500/20 text-red-400'
                            : 'hover:bg-red-100 text-red-600'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <X size={12} />
                </motion.button>
            </motion.div>
        );
    }

    return (
        <motion.span
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`group/chip relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                hasConflict
                    ? isDarkMode
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                        : 'bg-red-50 text-red-600 border border-red-200'
                    : isHighlighted
                        ? isDarkMode
                            ? 'bg-white/20 text-white border border-white/40 ring-2 ring-white/20'
                            : 'bg-black/20 text-black border border-black/40 ring-2 ring-black/20'
                        : isDarkMode
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'bg-black/10 text-black border border-black/20'
            }`}
            title={conflictTooltip}
        >
            {hasConflict && (
                <motion.span
                    className={`absolute -top-1 -left-1 w-2 h-2 rounded-full ${
                        isDarkMode ? 'bg-red-400' : 'bg-red-600'
                    }`}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
            )}
            
            <span className="flex items-center gap-1">
                {areaName}
                {bienesCount > 0 && (
                    <span className={`flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                        isDarkMode 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-green-100 text-green-700'
                    }`}>
                        <Package size={10} />
                        {bienesCount}
                    </span>
                )}
                {resguardosCount > 0 && (
                    <span className={`flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                        isDarkMode 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-blue-100 text-blue-700'
                    }`}>
                        <FileText size={10} />
                        {resguardosCount}
                    </span>
                )}
            </span>

            <div className="flex items-center gap-0.5">
                {/* Botón de editar - solo visible si se puede editar */}
                {canEdit && (
                    <motion.button
                        type="button"
                        onClick={handleStartEdit}
                        className={`opacity-0 group-hover/chip:opacity-100 p-0.5 rounded transition-all ${
                            isDarkMode
                                ? 'hover:bg-white/20 text-white/60 hover:text-white'
                                : 'hover:bg-black/20 text-black/60 hover:text-black'
                        }`}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        title="Editar nombre del área"
                    >
                        <Edit2 size={10} />
                    </motion.button>
                )}

                {/* Botón de eliminar */}
                {onRemove && (
                    canRemove ? (
                        <motion.button
                            type="button"
                            onClick={onRemove}
                            className="hover:text-red-500 transition-colors"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            title="Eliminar área"
                        >
                            <X size={12} />
                        </motion.button>
                    ) : (
                        <span 
                            className="opacity-30 cursor-not-allowed"
                            title={`No se puede eliminar: ${bienesCount} bien(es) y ${resguardosCount} resguardo(s) en esta área`}
                        >
                            <X size={12} />
                        </span>
                    )
                )}
            </div>
        </motion.span>
    );
}
