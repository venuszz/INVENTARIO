import { AlertTriangle, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mueble } from '../types';

interface InactiveModalProps {
    show: boolean;
    selectedItem: Mueble | null;
    isDarkMode: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function InactiveModal({
    show,
    selectedItem,
    isDarkMode,
    onClose,
    onConfirm
}: InactiveModalProps) {
    if (!show || !selectedItem) return null;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`fixed inset-0 flex items-center justify-center z-50 px-4 ${
                        isDarkMode ? 'bg-black/90' : 'bg-black/50'
                    } backdrop-blur-sm`}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`rounded-lg shadow-2xl border w-full max-w-md overflow-hidden ${
                            isDarkMode
                                ? 'bg-black border-white/10'
                                : 'bg-white border-black/10'
                        }`}
                    >
                        {/* Header */}
                        <div className={`relative px-6 py-5 border-b ${
                            isDarkMode ? 'border-white/10' : 'border-black/10'
                        }`}>
                            <button
                                onClick={onClose}
                                className={`absolute top-4 right-4 p-1.5 rounded-lg transition-all ${
                                    isDarkMode
                                        ? 'text-white/60 hover:text-white hover:bg-white/5'
                                        : 'text-black/60 hover:text-black hover:bg-black/5'
                                }`}
                                aria-label="Cerrar"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="flex flex-col items-center text-center">
                                <div className={`p-3 rounded-lg border mb-3 ${
                                    isDarkMode
                                        ? 'bg-white/[0.02] border-white/10'
                                        : 'bg-black/[0.02] border-black/10'
                                }`}>
                                    <AlertTriangle className={`h-6 w-6 ${
                                        isDarkMode ? 'text-white/60' : 'text-black/60'
                                    }`} />
                                </div>
                                <h3 className={`text-lg font-light tracking-tight ${
                                    isDarkMode ? 'text-white' : 'text-black'
                                }`}>
                                    ¿Marcar como inactivo?
                                </h3>
                                <p className={`mt-1 text-sm font-light ${
                                    isDarkMode ? 'text-white/60' : 'text-black/60'
                                }`}>
                                    Este artículo será marcado como inactivo
                                </p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* Item Info */}
                            <div className={`rounded-lg border p-4 ${
                                isDarkMode
                                    ? 'border-white/10 bg-white/[0.02]'
                                    : 'border-black/10 bg-black/[0.02]'
                            }`}>
                                <div className={`text-sm font-light space-y-1 ${
                                    isDarkMode ? 'text-white/80' : 'text-black/80'
                                }`}>
                                    <div>
                                        <span className={`font-medium ${
                                            isDarkMode ? 'text-white' : 'text-black'
                                        }`}>ID:</span> {selectedItem.id_inv}
                                    </div>
                                    <div>
                                        <span className={`font-medium ${
                                            isDarkMode ? 'text-white' : 'text-black'
                                        }`}>Descripción:</span> {selectedItem.descripcion}
                                    </div>
                                    <div>
                                        <span className={`font-medium ${
                                            isDarkMode ? 'text-white' : 'text-black'
                                        }`}>Área:</span> {selectedItem.area?.nombre || 'No especificado'}
                                    </div>
                                </div>
                            </div>

                            {/* Warning */}
                            <div className={`mt-4 rounded-lg border p-3 flex items-start gap-3 ${
                                isDarkMode
                                    ? 'border-white/10 bg-white/[0.02]'
                                    : 'border-black/10 bg-black/[0.02]'
                            }`}>
                                <AlertCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                                    isDarkMode ? 'text-white/60' : 'text-black/60'
                                }`} />
                                <p className={`text-xs font-light ${
                                    isDarkMode ? 'text-white/60' : 'text-black/60'
                                }`}>
                                    Los artículos inactivos no aparecerán en las búsquedas principales pero podrán ser consultados en el historial.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={`p-5 border-t flex justify-end gap-3 ${
                            isDarkMode
                                ? 'border-white/10'
                                : 'border-black/10'
                        }`}>
                            <button
                                onClick={onClose}
                                className={`px-4 py-2 rounded-lg text-sm border font-light transition-all flex items-center gap-2 ${
                                    isDarkMode
                                        ? 'bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/5 border-white/10'
                                        : 'bg-black/[0.02] text-black/60 hover:text-black hover:bg-black/5 border-black/10'
                                }`}
                            >
                                <X className="h-3.5 w-3.5" />
                                Cancelar
                            </button>
                            <button
                                onClick={onConfirm}
                                className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 font-light transition-all border ${
                                    isDarkMode
                                        ? 'bg-white/5 text-white hover:bg-white/10 border-white/10'
                                        : 'bg-black/5 text-black hover:bg-black/10 border-black/10'
                                }`}
                            >
                                <AlertCircle className="h-3.5 w-3.5" />
                                Marcar Inactivo
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
