'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

/**
 * TransferProgressModal Component
 * 
 * Progress indicator for large transfer operations (>100 bienes).
 * Shows real-time progress with percentage, count, and time estimation.
 * 
 * Features:
 * - Progress bar with percentage (15.2)
 * - Current/total count display (15.4)
 * - Batch progress updates (15.5)
 * - Time estimation (15.5)
 * - Animated progress bar
 * - Dark mode support
 * 
 * Requirements: 15.2, 15.4, 15.5
 */

interface TransferProgressModalProps {
  show: boolean;
  totalBienes: number;
  processedBienes: number;
  currentBatch: number;
  totalBatches: number;
  estimatedTimeRemaining?: number; // in seconds
}

export function TransferProgressModal({
  show,
  totalBienes,
  processedBienes,
  currentBatch,
  totalBatches,
  estimatedTimeRemaining,
}: TransferProgressModalProps) {
  const { isDarkMode } = useTheme();
  
  if (!show) return null;

  const percentage = totalBienes > 0 ? Math.round((processedBienes / totalBienes) * 100) : 0;

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`
          w-full max-w-md p-6
          rounded-xl shadow-xl
          border
          ${isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/10'}
        `}
      >
        {/* Spinner */}
        <div className="flex justify-center mb-6">
          <Loader2 className={`w-12 h-12 animate-spin ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        </div>

        {/* Title */}
        <h3 className={`text-lg font-semibold text-center mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Procesando Transferencia
        </h3>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-white/70' : 'text-black/70'}`}>
              Progreso
            </span>
            <span className={`text-sm font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {percentage}%
            </span>
          </div>
          
          <div className={`h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            />
          </div>
        </div>

        {/* Count Display */}
        <div className={`mb-4 p-4 rounded-lg border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
              Bienes Procesados
            </span>
            <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {processedBienes} / {totalBienes}
            </span>
          </div>
        </div>

        {/* Batch Progress */}
        <div className={`mb-4 p-4 rounded-lg border ${isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
              Lote Actual
            </span>
            <span className={`text-lg font-bold ${isDarkMode ? 'text-blue-200' : 'text-blue-900'}`}>
              {currentBatch} / {totalBatches}
            </span>
          </div>
        </div>

        {/* Time Estimation */}
        {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
          <div className="text-center">
            <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
              Tiempo estimado restante:{' '}
              <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {formatTimeRemaining(estimatedTimeRemaining)}
              </span>
            </p>
          </div>
        )}

        {/* Info Message */}
        <p className={`text-xs text-center mt-4 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
          Por favor no cierre esta ventana
        </p>
      </motion.div>
    </div>
  );
}
