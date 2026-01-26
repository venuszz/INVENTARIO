import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * WarningModal Component
 * 
 * Generic warning modal displayed when the user attempts to close
 * the PDF download modal without downloading the document.
 */
interface WarningModalProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function WarningModal({
  show,
  onConfirm,
  onCancel
}: WarningModalProps) {
  const { isDarkMode } = useTheme();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[120] flex items-center justify-center px-4 backdrop-blur-sm ${
            isDarkMode ? 'bg-black/80' : 'bg-black/50'
          }`}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`rounded-lg border w-full max-w-sm overflow-hidden backdrop-blur-xl ${
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
                      ¿Cerrar sin descargar?
                    </h3>
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

              {/* Message */}
              <p className={`text-sm mb-6 ${
                isDarkMode ? 'text-white/60' : 'text-black/60'
              }`}>
                No has descargado el PDF. Si cierras esta ventana, no podrás volver a generar este documento por ahora.
              </p>

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
                  onClick={onConfirm}
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    isDarkMode
                      ? 'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20'
                      : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Cerrar de todos modos
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

