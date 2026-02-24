/**
 * FilterChips Component
 * 
 * Displays active filters as removable chips/tags.
 * Provides visual feedback and easy filter removal.
 * Uses special colors for origen and resguardo filters to match table badges.
 */

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActiveFilter } from '../types';
import { getFilterChipColors } from '../utils';

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
    case 'origen': return 'Origen';
    case 'resguardo': return 'Resguardo';
    case 'color': return 'Color';
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
        {activeFilters.map((filter, index) => {
          // Get special colors for origen and resguardo filters
          const chipColors = getFilterChipColors(filter.type, filter.term, isDarkMode);
          
          // Check if this is a color filter for special styling
          const isColorFilter = filter.type === 'color';
          const colorName = isColorFilter ? filter.term.toUpperCase() : '';
          
          // Get color-specific styles
          let colorStyle = {};
          if (isColorFilter) {
            switch (colorName) {
              case 'ROJO':
                colorStyle = {
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: isDarkMode ? '#fca5a5' : '#dc2626',
                  borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.5)'
                };
                break;
              case 'VERDE':
                colorStyle = {
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  color: isDarkMode ? '#86efac' : '#16a34a',
                  borderColor: isDarkMode ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.5)'
                };
                break;
              case 'BLANCO':
                colorStyle = {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                  color: isDarkMode ? '#ffffff' : '#000000',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)'
                };
                break;
              case 'AMARILLO':
                colorStyle = {
                  backgroundColor: 'rgba(234, 179, 8, 0.15)',
                  color: isDarkMode ? '#fde047' : '#ca8a04',
                  borderColor: isDarkMode ? 'rgba(234, 179, 8, 0.4)' : 'rgba(234, 179, 8, 0.5)'
                };
                break;
              case 'AZUL':
                colorStyle = {
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  color: isDarkMode ? '#93c5fd' : '#2563eb',
                  borderColor: isDarkMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.5)'
                };
                break;
              case 'NARANJA':
                colorStyle = {
                  backgroundColor: 'rgba(249, 115, 22, 0.15)',
                  color: isDarkMode ? '#fdba74' : '#ea580c',
                  borderColor: isDarkMode ? 'rgba(249, 115, 22, 0.4)' : 'rgba(249, 115, 22, 0.5)'
                };
                break;
            }
          }
          
          return (
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
                isColorFilter ? '' : chipColors
              }`}
              style={isColorFilter ? colorStyle : undefined}
            >
              {/* Filter type label */}
              <span className={`text-[10px] font-semibold ${
                filter.type === 'origen' 
                  ? 'opacity-80'
                  : isColorFilter
                    ? 'opacity-90'
                    : isDarkMode ? 'text-white/60' : 'text-black/60'
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
                  filter.type === 'origen'
                    ? 'hover:bg-black/10 text-gray-700 hover:text-gray-900'
                    : isColorFilter
                      ? 'hover:bg-black/10 opacity-70 hover:opacity-100'
                      : isDarkMode
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
          );
        })}
      </AnimatePresence>
    </div>
  );
}
