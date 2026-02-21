'use client';

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface CompletionScreenProps {
  resolvedCount: number;
  onExit: () => void;
}

export function CompletionScreen({ resolvedCount, onExit }: CompletionScreenProps) {
  const { isDarkMode } = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center justify-center min-h-[600px]"
    >
      <div className="text-center space-y-6 max-w-md">
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="flex justify-center"
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            isDarkMode ? 'bg-green-500/10' : 'bg-green-50'
          }`}>
            <CheckCircle2 className={`w-12 h-12 ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`} />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className={`text-2xl font-light tracking-tight mb-2 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            ¡Todas las inconsistencias resueltas!
          </h2>
          <p className={`${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
            Se resolvieron {resolvedCount} {resolvedCount === 1 ? 'inconsistencia' : 'inconsistencias'} exitosamente
          </p>
        </motion.div>

        {/* Action Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={onExit}
          className={`px-6 py-3 rounded-lg transition-colors font-medium ${
            isDarkMode 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          Volver al directorio
        </motion.button>

        {/* Confetti-like decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-4xl"
        >
          🎉
        </motion.div>
      </div>
    </motion.div>
  );
}
