import React from 'react';
import { AlertCircle, User, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DirectorInfoModalProps } from '../types';

export default function DirectorInfoModal({
  isOpen,
  director,
  areaValue,
  isSaving,
  onAreaChange,
  onSave,
  onCancel,
  isDarkMode
}: DirectorInfoModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className={`w-full max-w-md overflow-hidden transition-colors ${
            isDarkMode ? 'bg-black' : 'bg-white'
          }`}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className={`p-6 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-yellow-500/10' : 'bg-yellow-50'
                }`}>
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-lg font-light tracking-tight mb-1">
                    Información Requerida
                  </h3>
                  <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                    Complete el área del director seleccionado
                  </p>
                </div>
              </div>
              <motion.button
                onClick={onCancel}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={18} />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Director Info */}
            <div className={`p-4 border-b ${
              isDarkMode ? 'border-white/10' : 'border-black/10'
            }`}>
              <label className={`block mb-2 text-xs font-medium uppercase tracking-wider ${
                isDarkMode ? 'text-white/40' : 'text-black/40'
              }`}>
                Director/Jefe Seleccionado
              </label>
              <div className="flex items-center gap-3">
                <User size={16} className={isDarkMode ? 'text-white/60' : 'text-black/60'} />
                <span className="text-sm font-medium">
                  {director?.nombre || 'Director'}
                </span>
              </div>
            </div>

            {/* Area Input */}
            <div>
              <label className={`block mb-2 text-xs font-medium uppercase tracking-wider ${
                isDarkMode ? 'text-white/60' : 'text-black/60'
              }`}>
                Área <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={areaValue}
                onChange={(e) => onAreaChange(e.target.value)}
                placeholder="Ej: Administración, Recursos Humanos..."
                className={`w-full px-0 pb-2 border-b-2 text-sm transition-all bg-transparent ${
                  areaValue
                    ? isDarkMode
                      ? 'border-white/40 hover:border-white/60 focus:border-white'
                      : 'border-black/40 hover:border-black/60 focus:border-black'
                    : isDarkMode
                      ? 'border-white/10 hover:border-white/20 focus:border-white'
                      : 'border-black/10 hover:border-black/20 focus:border-black'
                } ${isDarkMode ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'} focus:outline-none`}
                autoFocus
              />
              {!areaValue && (
                <motion.p 
                  className="text-red-500 text-xs mt-2 font-medium flex items-center gap-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle size={12} />
                  Este campo es obligatorio
                </motion.p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className={`p-6 border-t flex justify-end gap-3 ${
            isDarkMode ? 'border-white/10' : 'border-black/10'
          }`}>
            <motion.button
              onClick={onCancel}
              className={`px-6 py-2.5 text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'text-white/60 hover:text-white'
                  : 'text-black/60 hover:text-black'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancelar
            </motion.button>
            <motion.button
              onClick={onSave}
              disabled={isSaving || !areaValue}
              className={`px-6 py-2.5 text-sm font-medium transition-all ${
                isSaving || !areaValue
                  ? isDarkMode
                    ? 'bg-white/10 text-white/30 cursor-not-allowed'
                    : 'bg-black/10 text-black/30 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-black text-white hover:bg-black/90'
              }`}
              whileHover={!isSaving && areaValue ? { scale: 1.02 } : {}}
              whileTap={!isSaving && areaValue ? { scale: 0.98 } : {}}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <motion.div 
                    className={`w-4 h-4 border-2 rounded-full ${
                      isDarkMode 
                        ? 'border-black/20 border-t-black' 
                        : 'border-white/20 border-t-white'
                    }`}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Guardando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save size={16} />
                  Guardar
                </span>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
