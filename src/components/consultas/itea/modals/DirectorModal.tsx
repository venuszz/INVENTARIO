import { AlertCircle, User, LayoutGrid, X, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Directorio } from '../types';

interface DirectorModalProps {
    show: boolean;
    incompleteDirector: Directorio | null;
    directorFormData: { area: string };
    savingDirector: boolean;
    isDarkMode: boolean;
    onClose: () => void;
    onSave: () => void;
    onAreaChange: (area: string) => void;
}

export default function DirectorModal({
    show,
    incompleteDirector,
    directorFormData,
    savingDirector,
    isDarkMode,
    onClose,
    onSave,
    onAreaChange
}: DirectorModalProps) {
    if (!show) return null;

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
                                    <AlertCircle className={`h-6 w-6 ${
                                        isDarkMode ? 'text-white/60' : 'text-black/60'
                                    }`} />
                                </div>
                                <h3 className={`text-lg font-light tracking-tight ${
                                    isDarkMode ? 'text-white' : 'text-black'
                                }`}>
                                    Información requerida
                                </h3>
                                <p className={`mt-1 text-sm font-light ${
                                    isDarkMode ? 'text-white/60' : 'text-black/60'
                                }`}>
                                    Por favor complete el área del director/jefe de área seleccionado
                                </p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-5">
                            {/* Director Info */}
                            <div className={`rounded-lg border p-4 ${
                                isDarkMode
                                    ? 'border-white/10 bg-white/[0.02]'
                                    : 'border-black/10 bg-black/[0.02]'
                            }`}>
                                <label className={`text-xs font-medium uppercase tracking-wider mb-2 block ${
                                    isDarkMode ? 'text-white/60' : 'text-black/60'
                                }`}>
                                    Director/Jefe seleccionado
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg border ${
                                        isDarkMode
                                            ? 'bg-white/[0.02] border-white/10'
                                            : 'bg-black/[0.02] border-black/10'
                                    }`}>
                                        <User className={`h-4 w-4 ${
                                            isDarkMode ? 'text-white/60' : 'text-black/60'
                                        }`} />
                                    </div>
                                    <span className={`font-light text-sm ${
                                        isDarkMode ? 'text-white' : 'text-black'
                                    }`}>
                                        {incompleteDirector?.nombre || 'Director'}
                                    </span>
                                </div>
                            </div>

                            {/* Area Input */}
                            <div>
                                <label className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-2 ${
                                    isDarkMode ? 'text-white/60' : 'text-black/60'
                                }`}>
                                    <LayoutGrid className="h-3.5 w-3.5" />
                                    Área
                                </label>
                                <input
                                    type="text"
                                    value={directorFormData.area}
                                    onChange={(e) => onAreaChange(e.target.value)}
                                    placeholder="Ej: Administración, Recursos Humanos, Contabilidad..."
                                    className={`block w-full border rounded-lg py-2.5 px-3 text-sm font-light focus:outline-none transition-all ${
                                        isDarkMode
                                            ? 'bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.04]'
                                            : 'bg-black/[0.02] border-black/10 text-black placeholder:text-black/30 focus:border-black/20 focus:bg-black/[0.04]'
                                    }`}
                                    required
                                />
                                {!directorFormData.area && (
                                    <p className={`text-xs mt-2 flex items-center gap-1 font-light ${
                                        isDarkMode ? 'text-white/40' : 'text-black/40'
                                    }`}>
                                        <AlertCircle className="h-3 w-3" />
                                        Este campo es obligatorio
                                    </p>
                                )}
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
                                onClick={onSave}
                                disabled={savingDirector || !directorFormData.area}
                                className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 font-light transition-all border ${
                                    savingDirector || !directorFormData.area
                                        ? isDarkMode
                                            ? 'bg-white/[0.02] text-white/20 cursor-not-allowed border-white/10'
                                            : 'bg-black/[0.02] text-black/20 cursor-not-allowed border-black/10'
                                        : isDarkMode
                                            ? 'bg-white/5 text-white hover:bg-white/10 border-white/10'
                                            : 'bg-black/5 text-black hover:bg-black/10 border-black/10'
                                }`}
                            >
                                {savingDirector ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Save className="h-3.5 w-3.5" />
                                )}
                                {savingDirector ? 'Guardando...' : 'Guardar y Continuar'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
