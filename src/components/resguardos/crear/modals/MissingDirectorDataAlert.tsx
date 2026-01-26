import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MissingDirectorDataAlert Component
 * 
 * Alert banner displayed when the selected director is missing
 * required data (area or puesto). Provides a button to complete
 * the missing information.
 */
interface MissingDirectorDataAlertProps {
  show: boolean;
  onComplete: () => void;
}

export default function MissingDirectorDataAlert({
  show,
  onComplete
}: MissingDirectorDataAlertProps) {
  const { isDarkMode } = useTheme();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-3 rounded-lg border flex items-center gap-3 backdrop-blur-xl shadow-lg max-w-2xl ${
            isDarkMode
              ? 'bg-yellow-500/10 border-yellow-500/30'
              : 'bg-yellow-50 border-yellow-300'
          }`}
        >
          <AlertTriangle size={18} className={
            isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
          } />
          <span className={`text-sm font-medium ${
            isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
          }`}>
            Faltan datos del director. Completa el área y el puesto para continuar.
          </span>
          <motion.button
            onClick={onComplete}
            className={`ml-2 px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
              isDarkMode
                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/30'
                : 'bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Completar
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
