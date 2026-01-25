/**
 * FilterChips Component
 * 
 * Displays active filters as removable chips/tags.
 * Provides visual feedback and easy filter removal.
 */

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActiveFilter } from '../types';

/**
 * Component props interface
 */
interface FilterChipsProps {
  activeFilters: ActiveFilter[];
  onRemoveFilter: (index: number) => void;
  isDarkMode: boolean;
}

/**
 * Get abbreviated label for filter type
 * Used in chip display for compact representation
 */
function getFilterTypeLabel(type: ActiveFilter['type']): string {
  switch (type) {
    case 'id': return 'ID';
    case 'descripcion': return 'Descripción';
    case 'rubro': return 'Rubro';
    case 'estado': return 'Estado';
    case 'estatus': return 'Estatus';
    case 'area': return 'Área';
    case 'usufinal': return 'Usuario';
    case 'resguardante': return 'Resguardante';
    default: return type || 'Filtro';
  }
}

/**
 * FilterChips component
 * 
 * Renders active filters as removable chips with type labels and icons.
 * Supports dark mode and provides hover effects.
 * 
 * @param props - Component props
 * @returns JSX element with filter chips or null if no filters
 * 
 * @example
 * <FilterChips
 *   activeFilters={activeFilters}
 *   onRemoveFilter={removeFilter}
 *   isDarkMode={isDarkMode}
 * />
 */
export function FilterChips({
  activeFilters,
  onRemoveFilter,
  isDarkMode
}: FilterChipsProps) {
  
  // Don't render if no filters
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <AnimatePresence mode="popLayout">
        {activeFilters.map((filter, index) => (
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

            {/* Filter value - sin truncar */}
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
