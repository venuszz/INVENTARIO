import React from 'react';
import { LayoutGrid, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Area, Directorio, Mueble } from '../types';

interface AreaSelectionModalProps {
    show: boolean;
    areaOptions: Area[];
    incompleteDirector: Directorio | null;
    editFormData: Mueble | null;
    selectedItem: Mueble | null;
    onClose: () => void;
    onSelectArea: (area: Area) => void;
}

export default function AreaSelectionModal({
    show,
    areaOptions,
    incompleteDirector,
    editFormData,
    selectedItem,
    onClose,
    onSelectArea
}: AreaSelectionModalProps) {
    if (!show) return null;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="bg-black border border-white/10 rounded-lg shadow-2xl w-full max-w-md overflow-hidden"
                    >
                        {/* Header */}
                        <div className="relative px-6 py-5 border-b border-white/10">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
                                aria-label="Cerrar"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="flex flex-col items-center text-center">
                                <div className="p-3 bg-white/[0.02] rounded-lg border border-white/10 mb-3">
                                    <LayoutGrid className="h-6 w-6 text-white/60" />
                                </div>
                                <h2 className="text-lg font-light tracking-tight text-white">
                                    Selecciona un área
                                </h2>
                                <p className="text-sm font-light text-white/60 mt-1">
                                    Elige el área correspondiente para este artículo
                                </p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            {/* Director Info */}
                            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                                <label className="text-xs uppercase tracking-wider text-white/60 mb-2 block font-medium">
                                    Director asignado
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/[0.02] rounded-lg border border-white/10">
                                        <User className="h-4 w-4 text-white/60" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-light text-white">
                                            {incompleteDirector?.nombre}
                                        </span>
                                        <span className="text-xs font-light text-white/40">
                                            {incompleteDirector?.puesto || 'Sin puesto asignado'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Areas List */}
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-white/60 block mb-3 font-medium">
                                    Áreas disponibles
                                </label>
                                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30">
                                    {areaOptions.map((area, index) => (
                                        <motion.button
                                            key={area.id_area}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => onSelectArea(area)}
                                            className="w-full px-4 py-3 rounded-lg bg-white/[0.02] border border-white/10 text-white/90 hover:border-white/20 hover:bg-white/[0.04] focus:outline-none transition-all text-sm font-light text-left"
                                        >
                                            {area.nombre}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
