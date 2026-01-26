/**
 * FilterChips component
 * Displays active filters as removable chips
 */

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import type { ActiveFilter } from '../types';

interface FilterChipsProps {
  filters: ActiveFilter[];
  onRemoveFilter: (index: number) => void;
  onClearAll?: () => void;
}

/**
 * Get abbreviated label for filter type
 */
function getFilterTypeLabel(type: ActiveFilter['type']): string {
  switch (type) {
    case 'id': return 'ID';
    case 'descripcion': return 'Descripción';
    case 'rubro': return 'Rubro';
    case 'estado': return 'Estado';
    case 'estatus': return 'Estatus';
    case 'area': return 'Área';
    case 'usufinal': return 'Director';
    case 'director': return 'Director';
    case 'resguardante': return 'Resguardante';
    default: return type || 'Filtro';
  }
}

/**
 * Component for displaying active filters as chips
 */
export function FilterChips({ filters, onRemoveFilter }: FilterChipsProps) {
  const { isDarkMode } = useTheme();

  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      <AnimatePresence mode="popLayout">
        {filters.map((filter, index) => (
          <motion.div
            key={`${filter.type}-${filter.term}-${index}`}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ 
              layout: { type: 'spring', stiffness: 350, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              isDarkMode
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-black/10 text-black border-black/20'
            }`}
          >
            {/* Filter type label */}
            <span className={`text-[10px] font-semibold ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}>
              {getFilterTypeLabel(filter.type)}
            </span>

            {/* Filter value */}
            <span className="whitespace-nowrap">
              {filter.term}
            </span>

            {/* Remove button */}
            <motion.button
              onClick={() => onRemoveFilter(index)}
              className={`p-0.5 rounded-full transition-colors ${
                isDarkMode
                  ? 'hover:bg-white/10 text-white/60 hover:text-white'
                  : 'hover:bg-black/10 text-black/60 hover:text-black'
              }`}
              title="Eliminar filtro"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={12} />
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
