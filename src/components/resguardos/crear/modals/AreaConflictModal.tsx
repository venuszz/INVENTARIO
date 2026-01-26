import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { AlertTriangle, Building2, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AreaConflictModal Component
 * 
 * Modal dialog that warns the user when attempting to select items
 * from different areas. All items in a resguardo must belong to the
 * same area for organization and traceability.
 */
interface AreaConflictModalProps {
  show: boolean;
  conflictArea: string;
  onClose: () => void;
}

export default function AreaConflictModal({
  show,
  conflictArea,
  onClose
}: AreaConflictModalProps) {
  const { isDarkMode } = useTheme();

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
                    isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'
                  }`}>
                    <AlertTriangle size={20} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Conflicto de área
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`}>
                      Áreas diferentes
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

              {/* Message */}
              <p className={`text-sm mb-4 ${
                isDarkMode ? 'text-white/70' : 'text-black/70'
              }`}>
                No es posible agregar artículos de diferentes áreas en un mismo resguardo.
              </p>

              {/* Conflict area */}
              <div className={`rounded-lg border p-3 mb-4 ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <label className={`block text-xs font-medium mb-1.5 ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                  Área en conflicto
                </label>
                <div className="flex items-center gap-2">
                  <Building2 size={16} className={isDarkMode ? 'text-white/60' : 'text-black/60'} />
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {conflictArea || 'Sin especificar'}
                  </span>
                </div>
              </div>

              {/* Info box */}
              <div className={`rounded-lg border p-3 mb-6 ${
                isDarkMode
                  ? 'bg-blue-500/5 border-blue-500/20'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start gap-2">
                  <Info size={14} className={`mt-0.5 flex-shrink-0 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                  <p className={`text-xs ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-700'
                  }`}>
                    Los artículos en un resguardo deben pertenecer a la misma área para mantener la organización y trazabilidad.
                  </p>
                </div>
              </div>

              {/* Action button */}
              <motion.button
                onClick={onClose}
                className={`w-full px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  isDarkMode
                    ? 'bg-black border-white/10 text-white hover:border-white/20 hover:bg-white/[0.02]'
                    : 'bg-white border-black/10 text-black hover:border-black/20 hover:bg-black/[0.02]'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                Entendido
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

