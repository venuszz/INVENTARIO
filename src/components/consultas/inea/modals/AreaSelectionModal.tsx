import { LayoutGrid, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Area, Directorio } from '../types';

interface AreaSelectionModalProps {
    show: boolean;
    areaOptions: Area[];
    incompleteDirector: Directorio | null;
    isDarkMode: boolean;
    onClose: () => void;
    onSelectArea: (area: Area) => void;
}

export default function AreaSelectionModal({
    show,
    areaOptions,
    incompleteDirector,
    isDarkMode,
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
                    className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${
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
                                    <LayoutGrid className={`h-6 w-6 ${
                                        isDarkMode ? 'text-white/60' : 'text-black/60'
                                    }`} />
                                </div>
                                <h2 className={`text-lg font-light tracking-tight ${
                                    isDarkMode ? 'text-white' : 'text-black'
                                }`}>
                                    Selecciona un área
                                </h2>
                                <p className={`text-sm font-light mt-1 ${
                                    isDarkMode ? 'text-white/60' : 'text-black/60'
                                }`}>
                                    Elige el área correspondiente para este artículo
                                </p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            {/* Director Info */}
                            <div className={`rounded-lg border p-4 ${
                                isDarkMode
                                    ? 'border-white/10 bg-white/[0.02]'
                                    : 'border-black/10 bg-black/[0.02]'
                            }`}>
                                <label className={`text-xs uppercase tracking-wider mb-2 block font-medium ${
                                    isDarkMode ? 'text-white/60' : 'text-black/60'
                                }`}>
                                    Director asignado
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
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-light ${
                                            isDarkMode ? 'text-white' : 'text-black'
                                        }`}>
                                            {incompleteDirector?.nombre}
                                        </span>
                                        <span className={`text-xs font-light ${
                                            isDarkMode ? 'text-white/40' : 'text-black/40'
                                        }`}>
                                            {incompleteDirector?.puesto || 'Sin puesto asignado'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Areas List */}
                            <div className="space-y-2">
                                <label className={`text-xs uppercase tracking-wider block mb-3 font-medium ${
                                    isDarkMode ? 'text-white/60' : 'text-black/60'
                                }`}>
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
                                            className={`w-full px-4 py-3 rounded-lg border text-sm font-light text-left transition-all focus:outline-none ${
                                                isDarkMode
                                                    ? 'bg-white/[0.02] border-white/10 text-white/90 hover:border-white/20 hover:bg-white/[0.04]'
                                                    : 'bg-black/[0.02] border-black/10 text-black/90 hover:border-black/20 hover:bg-black/[0.04]'
                                            }`}
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
