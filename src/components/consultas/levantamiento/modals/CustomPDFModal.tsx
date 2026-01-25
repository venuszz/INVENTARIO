/**
 * Custom PDF export modal component
 * 
 * Modal for configuring and exporting PDF by area and director.
 */

import { useState, useMemo } from 'react';
import { X, FileText, AlertCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DirectorioOption } from '../types';
import { clean } from '../utils';

/**
 * Component props interface
 */
interface CustomPDFModalProps {
  show: boolean;
  area: string;
  director: string;
  directorOptions: DirectorioOption[];
  onConfirm: (directorData: { nombre: string; puesto: string }) => void;
  onCancel: () => void;
  onDirectorSelect: (director: DirectorioOption) => void;
  loading: boolean;
  error: string | null;
  recordCount: number;
  isDarkMode: boolean;
}

/**
 * CustomPDFModal component
 * 
 * Renders a modal for custom PDF export with:
 * - Pre-populated area field (read-only)
 * - Director search input
 * - Director list with suggested highlighting
 * - Puesto field (read-only)
 * - Record count badge
 * - Validation before export
 * 
 * @param props - Component props
 * @returns Custom PDF modal UI or null if not shown
 */
export function CustomPDFModal({
  show,
  area,
  director,
  directorOptions,
  onConfirm,
  onCancel,
  onDirectorSelect,
  loading,
  error,
  recordCount,
  isDarkMode
}: CustomPDFModalProps) {
  
  const [searchDirectorTerm, setSearchDirectorTerm] = useState('');
  const [selectedDirector, setSelectedDirector] = useState<{ nombre: string; puesto: string }>({ 
    nombre: '', 
    puesto: '' 
  });

  /**
   * Find suggested director based on name and area matching
   */
  const directorSugerido = useMemo(() => {
    if (!director) return null;

    const targetNombre = clean(director);
    const targetArea = clean(area);

    // Priority 1: Exact match by name and area
    let match = directorOptions.find(opt =>
      clean(opt.nombre) === targetNombre && clean(opt.area || '') === targetArea
    );

    // Priority 2: Exact match by name only
    if (!match) {
      match = directorOptions.find(opt => clean(opt.nombre) === targetNombre);
    }

    // Priority 3: Partial match by name (contains)
    if (!match) {
      match = directorOptions.find(opt => clean(opt.nombre).includes(targetNombre));
    }

    return match || null;
  }, [director, area, directorOptions]);

  /**
   * Filter director options based on search term
   */
  const filteredDirectorOptions = useMemo(() => {
    if (!searchDirectorTerm) return directorOptions;

    const searchClean = clean(searchDirectorTerm);
    return directorOptions.filter(opt =>
      clean(opt.nombre).includes(searchClean) ||
      clean(opt.puesto || '').includes(searchClean) ||
      clean(opt.area || '').includes(searchClean)
    );
  }, [searchDirectorTerm, directorOptions]);

  /**
   * Handle director selection
   */
  const handleDirectorClick = (opt: DirectorioOption) => {
    setSelectedDirector({ nombre: opt.nombre, puesto: opt.puesto });
    setSearchDirectorTerm(opt.nombre);
    onDirectorSelect(opt);
  };

  /**
   * Handle confirm button click
   */
  const handleConfirm = () => {
    if (selectedDirector.nombre && selectedDirector.puesto) {
      onConfirm(selectedDirector);
    }
  };

  /**
   * Check if confirm button should be disabled
   */
  const isConfirmDisabled = 
    loading ||
    recordCount === 0 ||
    !area.trim() ||
    !selectedDirector.nombre?.trim() ||
    !selectedDirector.puesto?.trim();

  // Early return after all hooks
  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 flex items-center justify-center z-50 px-4 backdrop-blur-sm ${
            isDarkMode ? 'bg-black/80' : 'bg-black/50'
          }`}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`rounded-lg border w-full max-w-lg overflow-hidden backdrop-blur-xl ${
              isDarkMode ? 'bg-black/95 border-white/10' : 'bg-white/95 border-black/10'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isDarkMode ? 'bg-white/10' : 'bg-black/10'
                  }`}>
                    <FileText size={20} className={isDarkMode ? 'text-white' : 'text-black'} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      PDF Personalizado
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className={`text-sm ${
                        isDarkMode ? 'text-white/60' : 'text-black/60'
                      }`}>
                        {recordCount} registros
                      </p>
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={onCancel}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'hover:bg-white/10 text-white'
                      : 'hover:bg-black/10 text-black'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* Form fields */}
              <div className="space-y-4 mb-6">
                {/* Area field (read-only) */}
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${
                    isDarkMode ? 'text-white/60' : 'text-black/60'
                  }`}>
                    Área seleccionada
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 rounded-lg border text-sm transition-all ${
                      isDarkMode
                        ? 'bg-white/[0.02] border-white/10 text-white'
                        : 'bg-black/[0.02] border-black/10 text-black'
                    } focus:outline-none cursor-not-allowed`}
                    value={area}
                    readOnly
                  />
                </div>

                {/* Director search and selection */}
                <div>
                  {/* Warning if director not found */}
                  {director && !directorSugerido && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={`mb-3 p-3 rounded-lg border flex items-start gap-2 ${
                        isDarkMode
                          ? 'bg-yellow-500/10 border-yellow-500/20'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <AlertCircle size={16} className={isDarkMode ? 'text-yellow-400 mt-0.5' : 'text-yellow-600 mt-0.5'} />
                      <div>
                        <p className={`text-sm font-medium ${
                          isDarkMode ? 'text-yellow-400' : 'text-yellow-800'
                        }`}>
                          Director no encontrado
                        </p>
                        <p className={`text-xs mt-0.5 ${
                          isDarkMode ? 'text-yellow-400/80' : 'text-yellow-700'
                        }`}>
                          &quot;{director}&quot;
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <label className={`block text-xs font-medium mb-1.5 ${
                    isDarkMode ? 'text-white/60' : 'text-black/60'
                  }`}>
                    Buscar director
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 rounded-lg border text-sm transition-all mb-2 ${
                      isDarkMode
                        ? 'bg-black border-white/10 text-white placeholder:text-white/40 focus:border-white/20'
                        : 'bg-white border-black/10 text-black placeholder:text-black/40 focus:border-black/20'
                    } focus:outline-none`}
                    placeholder="Buscar por nombre..."
                    value={searchDirectorTerm}
                    onChange={e => setSearchDirectorTerm(e.target.value)}
                    autoFocus
                  />

                  {/* Director list */}
                  <div className={`max-h-48 overflow-y-auto rounded-lg border ${
                    isDarkMode
                      ? 'bg-white/[0.02] border-white/10 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20'
                      : 'bg-black/[0.02] border-black/10 scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20'
                  }`}>
                    {filteredDirectorOptions.length === 0 ? (
                      <div className={`text-sm p-3 text-center ${
                        isDarkMode ? 'text-white/40' : 'text-black/40'
                      }`}>
                        No se encontraron directores
                      </div>
                    ) : (
                      <div className="p-1">
                        {filteredDirectorOptions.map(opt => {
                          const isSuggested = directorSugerido && opt.id_directorio === directorSugerido.id_directorio;
                          const isSelected = selectedDirector.nombre === opt.nombre;

                          return (
                            <motion.button
                              key={opt.id_directorio}
                              onClick={() => handleDirectorClick(opt)}
                              className={`w-full text-left px-2.5 py-2 rounded-lg mb-1 transition-all ${
                                isSuggested
                                  ? isDarkMode
                                    ? 'bg-white/10 border-l-2 border-white'
                                    : 'bg-black/10 border-l-2 border-black'
                                  : isSelected
                                    ? isDarkMode
                                      ? 'bg-white/[0.04] border-l-2 border-white/60'
                                      : 'bg-black/[0.04] border-l-2 border-black/60'
                                    : isDarkMode
                                      ? 'hover:bg-white/[0.02] border-l-2 border-transparent'
                                      : 'hover:bg-black/[0.02] border-l-2 border-transparent'
                              }`}
                              whileHover={{ x: 2 }}
                              transition={{ duration: 0.15 }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-medium flex items-center gap-2 ${
                                    isDarkMode ? 'text-white' : 'text-black'
                                  }`}>
                                    {opt.nombre}
                                    {isSuggested && (
                                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                        isDarkMode
                                          ? 'bg-white/10 text-white/80 border border-white/20'
                                          : 'bg-black/10 text-black/80 border border-black/20'
                                      }`}>
                                        Sugerido
                                      </span>
                                    )}
                                  </div>
                                  <div className={`text-xs truncate ${
                                    isDarkMode ? 'text-white/60' : 'text-black/60'
                                  }`}>
                                    {opt.puesto}
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check size={16} className={isDarkMode ? 'text-white' : 'text-black'} />
                                )}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Puesto field (read-only) */}
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${
                    isDarkMode ? 'text-white/60' : 'text-black/60'
                  }`}>
                    Puesto
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 rounded-lg border text-sm transition-all ${
                      isDarkMode
                        ? 'bg-white/[0.02] border-white/10 text-white'
                        : 'bg-black/[0.02] border-black/10 text-black'
                    } focus:outline-none cursor-not-allowed`}
                    value={selectedDirector.puesto || ''}
                    readOnly
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={`mb-4 p-3 rounded-lg border flex items-start gap-2 ${
                    isDarkMode
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <AlertCircle size={16} className={isDarkMode ? 'text-red-400 mt-0.5' : 'text-red-600 mt-0.5'} />
                  <p className={`text-sm ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                    {error}
                  </p>
                </motion.div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <motion.button
                  onClick={onCancel}
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    isDarkMode
                      ? 'bg-black border-white/10 text-white hover:border-white/20 hover:bg-white/[0.02]'
                      : 'bg-white border-black/10 text-black hover:border-black/20 hover:bg-black/[0.02]'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  onClick={handleConfirm}
                  disabled={isConfirmDisabled}
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    isConfirmDisabled
                      ? isDarkMode
                        ? 'bg-black border-white/5 text-white/40 cursor-not-allowed'
                        : 'bg-white border-black/5 text-black/40 cursor-not-allowed'
                      : isDarkMode
                        ? 'bg-white text-black border-white hover:bg-white/90'
                        : 'bg-black text-white border-black hover:bg-black/90'
                  }`}
                  whileHover={!isConfirmDisabled ? { scale: 1.01 } : {}}
                  whileTap={!isConfirmDisabled ? { scale: 0.99 } : {}}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <FileText size={16} />
                      Exportar PDF
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Scrollbar styles */}
          <style jsx>{`
            .scrollbar-thin {
              scrollbar-width: thin;
            }
            
            .scrollbar-thin::-webkit-scrollbar {
              width: 6px;
            }
            
            .scrollbar-thin::-webkit-scrollbar-track {
              background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
              border-radius: 3px;
            }
            
            .scrollbar-thin::-webkit-scrollbar-thumb {
              background: ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
              border-radius: 3px;
            }
            
            .scrollbar-thin::-webkit-scrollbar-thumb:hover {
              background: ${isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
