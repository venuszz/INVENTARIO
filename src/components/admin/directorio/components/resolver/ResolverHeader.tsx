'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface ResolverHeaderProps {
  pendingCount: number;
  onExit: () => void;
}

export function ResolverHeader({ pendingCount, onExit }: ResolverHeaderProps) {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`flex items-center justify-between pb-6 border-b ${
      isDarkMode ? 'border-white/10' : 'border-black/10'
    }`}>
      <div className="flex items-center gap-4">
        <button
          onClick={onExit}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-colors rounded-lg ${
            isDarkMode 
              ? 'text-white/60 hover:text-white hover:bg-white/5' 
              : 'text-black/60 hover:text-black hover:bg-black/5'
          }`}
          aria-label="Volver al directorio"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>
        
        <div className={`h-4 w-px ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />
        
        <h2 className={`text-2xl font-light tracking-tight ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}>
          Resolver Inconsistencias
        </h2>
      </div>
      
      <motion.div
        key={pendingCount}
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.15 }}
        className={`px-3 py-1.5 rounded-lg text-sm ${
          isDarkMode 
            ? 'bg-white/5 text-white/60' 
            : 'bg-black/5 text-black/60'
        }`}
        aria-live="polite"
      >
        {pendingCount} {pendingCount === 1 ? 'pendiente' : 'pendientes'}
      </motion.div>
    </div>
  );
}
