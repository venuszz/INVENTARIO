import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * UsufinalConflictModal Component
 * 
 * Modal dialog that warns the user when attempting to select items
 * with different responsables (usufinal). Only items with the same
 * responsable can be selected together.
 */
interface UsufinalConflictModalProps {
  show: boolean;
  conflictUsufinal: string;
  onClose: () => void;
}

export default function UsufinalConflictModal({
  show,
  conflictUsufinal,
  onClose
}: UsufinalConflictModalProps) {
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
                    isDarkMode ? 'bg-red-500/10' : 'bg-red-50'
                  }`}>
                    <AlertTriangle size={20} className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      No se puede agregar
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`}>
                      Conflicto de responsable
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
              <div className="mb-6">
                <p className={`text-sm mb-3 ${
                  isDarkMode ? 'text-white/70' : 'text-black/70'
                }`}>
                  Solo puedes seleccionar bienes que pertenezcan al mismo responsable.
                </p>
                <div className={`rounded-lg border p-3 ${
                  isDarkMode
                    ? 'bg-red-500/5 border-red-500/20'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-red-300' : 'text-red-700'
                  }`}>
                    El bien que intentas agregar pertenece a:{' '}
                    <span className="font-semibold">{conflictUsufinal}</span>
                  </p>
                </div>
                <p className={`text-xs mt-3 italic ${
                  isDarkMode ? 'text-white/40' : 'text-black/40'
                }`}>
                  Te sugerimos editar las características del bien.
                </p>
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

