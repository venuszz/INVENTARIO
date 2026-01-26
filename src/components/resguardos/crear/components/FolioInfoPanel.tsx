/**
 * FolioInfoPanel component
 * Displays folio, director name, and current date
 */

import { FileDigit, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

interface FolioInfoPanelProps {
  folio: string;
  directorName: string;
  onResetFolio: () => void;
}

/**
 * Panel showing folio information, director, and date
 */
export function FolioInfoPanel({ folio }: FolioInfoPanelProps) {
  const { isDarkMode } = useTheme();

  return (
    <motion.div 
      className={`mb-4 py-2 px-4 rounded-lg border transition-all ${
        isDarkMode
          ? 'bg-white/[0.02] border-white/10'
          : 'bg-black/[0.02] border-black/10'
      }`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-center gap-6">
        {/* Folio */}
        <div className="flex items-center gap-2">
          <FileDigit 
            size={14} 
            className={isDarkMode ? 'text-white/40' : 'text-black/40'} 
          />
          <div className="flex items-baseline gap-1.5">
            <span className={`text-[10px] uppercase font-medium ${
              isDarkMode ? 'text-white/40' : 'text-black/40'
            }`}>
              Folio:
            </span>
            <span className={`text-sm font-medium ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              {folio || 'Generando...'}
            </span>
          </div>
        </div>

        {/* Separator */}
        <div className={`h-4 w-px ${
          isDarkMode ? 'bg-white/10' : 'bg-black/10'
        }`} />

        {/* Date */}
        <div className="flex items-center gap-2">
          <Calendar 
            size={14} 
            className={isDarkMode ? 'text-white/40' : 'text-black/40'} 
          />
          <div className="flex items-baseline gap-1.5">
            <span className={`text-[10px] uppercase font-medium ${
              isDarkMode ? 'text-white/40' : 'text-black/40'
            }`}>
              Fecha:
            </span>
            <span className={`text-sm ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              {new Date().toLocaleDateString('es-MX', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
