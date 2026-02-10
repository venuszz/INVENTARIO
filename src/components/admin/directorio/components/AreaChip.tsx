'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import type { Area } from '@/types/admin';

interface AreaChipProps {
  area: Area;
  isHighlighted?: boolean;
  onRemove?: () => void;
  editable?: boolean;
}

/**
 * Area chip component with highlight animation for search matches
 */
export function AreaChip({ area, isHighlighted = false, onRemove, editable = false }: AreaChipProps) {
  const { isDarkMode } = useTheme();
  
  return (
    <motion.span
      animate={isHighlighted ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.3 }}
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
        transition-all duration-200
        ${isHighlighted 
          ? isDarkMode
            ? 'bg-white/20 text-white border border-white/40 ring-2 ring-white/20'
            : 'bg-black/20 text-black border border-black/40 ring-2 ring-black/20'
          : isDarkMode
            ? 'bg-white/5 text-white/80 border border-white/10'
            : 'bg-black/5 text-black/80 border border-black/10'
        }
      `}
    >
      <span>{area.nombre}</span>
      {editable && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={`rounded-sm p-0.5 transition-colors ${
            isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
          }`}
          aria-label={`Remover área ${area.nombre}`}
        >
          <X size={12} />
        </button>
      )}
    </motion.span>
  );
}
