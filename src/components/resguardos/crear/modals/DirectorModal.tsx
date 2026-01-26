import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { AlertTriangle, UserCheck, Briefcase, Users, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Directorio } from '../types';

/**
 * DirectorModal Component
 * 
 * Modal dialog for completing missing director information (area and puesto).
 * Displayed when a director is selected but lacks required data.
 */
interface DirectorModalProps {
  show: boolean;
  director: Directorio | null;
  area: string;
  puesto: string;
  onAreaChange: (value: string) => void;
  onPuestoChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
  isSaving: boolean;
  isUsuario: boolean;
}

export default function DirectorModal({
  show,
  director,
  area,
  puesto,
  onAreaChange,
  onPuestoChange,
  onSave,
  onClose,
  isSaving,
  isUsuario
}: DirectorModalProps) {
  const { isDarkMode } = useTheme();

  const isFormValid = area.trim() !== '' && puesto.trim() !== '';

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
          onClick={onClose}
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
                      Información faltante
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`}>
                      Completa los datos del director
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
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

              {/* Director info */}
              <div className={`rounded-lg border p-3 mb-4 ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <label className={`block text-xs font-medium mb-1.5 ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                  Director seleccionado
                </label>
                <div className="flex items-center gap-2">
                  <UserCheck size={16} className={isDarkMode ? 'text-white/60' : 'text-black/60'} />
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {director?.nombre || 'Director'}
                  </span>
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-4 mb-6">
                {/* Puesto input */}
                <div>
                  <label className={`flex items-center gap-2 text-xs font-medium mb-1.5 ${
                    isDarkMode ? 'text-white/60' : 'text-black/60'
                  }`}>
                    <Users size={14} />
                    Puesto
                  </label>
                  <input
                    type="text"
                    value={puesto}
                    onChange={(e) => onPuestoChange(e.target.value)}
                    placeholder="Ej: Director General, Gerente..."
                    disabled={isUsuario}
                    className={`w-full px-3 py-2 rounded-lg border text-sm transition-all ${
                      isDarkMode
                        ? 'bg-black border-white/10 text-white placeholder:text-white/40 focus:border-white/20'
                        : 'bg-white border-black/10 text-black placeholder:text-black/40 focus:border-black/20'
                    } focus:outline-none ${isUsuario ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  {isUsuario && (
                    <p className={`text-xs mt-1.5 ${
                      isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                    }`}>
                      Solo un administrador puede editar este campo
                    </p>
                  )}
                </div>

                {/* Area input */}
                <div>
                  <label className={`flex items-center gap-2 text-xs font-medium mb-1.5 ${
                    isDarkMode ? 'text-white/60' : 'text-black/60'
                  }`}>
                    <Briefcase size={14} />
                    Área
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => onAreaChange(e.target.value)}
                    placeholder="Escribe el área asignada"
                    className={`w-full px-3 py-2 rounded-lg border text-sm transition-all ${
                      isDarkMode
                        ? 'bg-black border-white/10 text-white placeholder:text-white/40 focus:border-white/20'
                        : 'bg-white border-black/10 text-black placeholder:text-black/40 focus:border-black/20'
                    } focus:outline-none`}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <motion.button
                  onClick={onClose}
                  disabled={isSaving}
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
                  onClick={onSave}
                  disabled={isSaving || !isFormValid || isUsuario}
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    isSaving || !isFormValid || isUsuario
                      ? isDarkMode
                        ? 'bg-black border-white/5 text-white/40 cursor-not-allowed'
                        : 'bg-white border-black/5 text-black/40 cursor-not-allowed'
                      : isDarkMode
                        ? 'bg-white text-black border-white hover:bg-white/90'
                        : 'bg-black text-white border-black hover:bg-black/90'
                  }`}
                  whileHover={!isSaving && isFormValid && !isUsuario ? { scale: 1.01 } : {}}
                  whileTap={!isSaving && isFormValid && !isUsuario ? { scale: 0.99 } : {}}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
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
