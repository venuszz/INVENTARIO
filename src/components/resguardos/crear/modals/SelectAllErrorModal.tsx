import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { ListChecks, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SelectAllErrorModal Component
 * 
 * Modal dialog displayed when the select-all operation fails validation.
 * Shows an error message explaining why all items cannot be selected.
 */
interface SelectAllErrorModalProps {
  show: boolean;
  message: string;
  onClose: () => void;
}

export default function SelectAllErrorModal({
  show,
  message,
  onClose
}: SelectAllErrorModalProps) {
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
                    <ListChecks size={20} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      No se puede seleccionar todo
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`}>
                      Error de validación
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
              <p className={`text-sm mb-6 ${
                isDarkMode ? 'text-white/70' : 'text-black/70'
              }`}>
                {message}
              </p>

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
