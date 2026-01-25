/**
 * Director data completion modal component
 * 
 * Modal for completing missing director information (admin only).
 */

import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DirectorioOption } from '../types';

/**
 * Component props interface
 */
interface DirectorDataModalProps {
  show: boolean;
  director: DirectorioOption | null;
  onSave: (director: DirectorioOption) => void;
  onCancel: () => void;
  loading: boolean;
  isDarkMode: boolean;
}

/**
 * DirectorDataModal component
 * 
 * Renders a modal for completing director information with:
 * - Nombre input (uppercase conversion)
 * - Puesto input (uppercase conversion)
 * - Validation (both fields required)
 * - Save/Cancel buttons
 * - Loading state during save
 * - Admin-only access
 * 
 * @param props - Component props
 * @returns Director data modal UI or null if not shown
 */
export function DirectorDataModal({
  show,
  director,
  onSave,
  onCancel,
  loading,
  isDarkMode
}: DirectorDataModalProps) {
  
  const [formData, setFormData] = useState<DirectorioOption | null>(null);

  // Initialize form data when director changes
  useEffect(() => {
    if (director) {
      setFormData({ ...director });
    }
  }, [director]);

  if (!show || !director || !formData) return null;

  /**
   * Handle nombre input change (convert to uppercase)
   */
  const handleNombreChange = (value: string) => {
    setFormData(prev => prev ? { ...prev, nombre: value.toUpperCase() } : null);
  };

  /**
   * Handle puesto input change (convert to uppercase)
   */
  const handlePuestoChange = (value: string) => {
    setFormData(prev => prev ? { ...prev, puesto: value.toUpperCase() } : null);
  };

  /**
   * Handle save button click
   */
  const handleSave = () => {
    if (formData && formData.nombre.trim() && formData.puesto.trim()) {
      onSave(formData);
    }
  };

  /**
   * Check if save button should be disabled
   */
  const isSaveDisabled = 
    loading ||
    !formData ||
    !formData.nombre?.trim() ||
    !formData.puesto?.trim();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[110] flex items-center justify-center px-4 backdrop-blur-sm ${
            isDarkMode ? 'bg-black/80' : 'bg-black/50'
          }`}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`rounded-lg border w-full max-w-md overflow-hidden backdrop-blur-xl ${
              isDarkMode ? 'bg-black/95 border-white/10' : 'bg-white/95 border-black/10'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isDarkMode ? 'bg-yellow-500/10' : 'bg-yellow-50'
                  }`}>
                    <AlertTriangle size={20} className={isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Completar datos del director
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`}>
                      Información faltante
                    </p>
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
                {/* Nombre input */}
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${
                    isDarkMode ? 'text-white/60' : 'text-black/60'
                  }`}>
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 rounded-lg border text-sm transition-all ${
                      isDarkMode
                        ? 'bg-black border-white/10 text-white placeholder:text-white/40 focus:border-white/20'
                        : 'bg-white border-black/10 text-black placeholder:text-black/40 focus:border-black/20'
                    } focus:outline-none`}
                    value={formData.nombre ?? ''}
                    onChange={e => handleNombreChange(e.target.value)}
                    placeholder="Ej: JUAN PÉREZ GÓMEZ"
                    autoFocus
                    maxLength={80}
                  />
                </div>

                {/* Puesto input */}
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${
                    isDarkMode ? 'text-white/60' : 'text-black/60'
                  }`}>
                    Cargo o puesto
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 rounded-lg border text-sm transition-all ${
                      isDarkMode
                        ? 'bg-black border-white/10 text-white placeholder:text-white/40 focus:border-white/20'
                        : 'bg-white border-black/10 text-black placeholder:text-black/40 focus:border-black/20'
                    } focus:outline-none`}
                    value={formData.puesto ?? ''}
                    onChange={e => handlePuestoChange(e.target.value)}
                    placeholder="Ej: DIRECTOR, JEFE DE ÁREA..."
                    maxLength={60}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <motion.button
                  onClick={onCancel}
                  disabled={loading}
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
                  onClick={handleSave}
                  disabled={isSaveDisabled}
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    isSaveDisabled
                      ? isDarkMode
                        ? 'bg-black border-white/5 text-white/40 cursor-not-allowed'
                        : 'bg-white border-black/5 text-black/40 cursor-not-allowed'
                      : isDarkMode
                        ? 'bg-white text-black border-white hover:bg-white/90'
                        : 'bg-black text-white border-black hover:bg-black/90'
                  }`}
                  whileHover={!isSaveDisabled ? { scale: 1.01 } : {}}
                  whileTap={!isSaveDisabled ? { scale: 0.99 } : {}}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar'
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
