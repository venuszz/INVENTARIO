'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

/**
 * TransferHeader Component
 * 
 * Header for the transfer mode showing title and exit button.
 * 
 * Features:
 * - Back button to exit transfer mode (1.1, 1.5)
 * - Title "Transferir Bienes"
 * - Entrance animation with Framer Motion (13.1, 13.4)
 * - Dark mode support with useTheme
 * 
 * Requirements: 1.1, 1.5, 13.1, 13.4
 */

interface TransferHeaderProps {
  onExit: () => void;
  showBackButton?: boolean;
}

export function TransferHeader({ onExit, showBackButton = false }: TransferHeaderProps) {
  const { isDarkMode } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={`
        px-6 py-4
        border-b
        ${isDarkMode ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}
      `}
    >
      <div className="flex items-center justify-between">
        {/* Left: Back button and title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className={`
              flex items-center gap-2
              px-3 py-2 rounded-lg
              ${isDarkMode 
                ? 'text-white/70 hover:text-white hover:bg-white/5' 
                : 'text-black/70 hover:text-black hover:bg-black/5'
              }
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500/50
            `}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">
              {showBackButton ? 'Atrás' : 'Volver al directorio'}
            </span>
          </button>

          <div className={`h-6 w-px ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />

          <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Transferir Bienes
          </h1>
        </div>
      </div>
    </motion.div>
  );
}
