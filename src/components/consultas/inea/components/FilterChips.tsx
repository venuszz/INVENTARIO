import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActiveFilter } from '../types';

interface FilterChipsProps {
  activeFilters: ActiveFilter[];
  removeFilter: (index: number) => void;
  clearAllFilters: () => void;
  isDarkMode: boolean;
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
    case 'resguardante': return 'Resguardante';
    case 'folio': return 'Folio';
    case 'sin_id': return 'Concepto';
    case 'con_resguardo': return 'Concepto';
    case 'sin_resguardo': return 'Concepto';
    default: return type || 'Filtro';
  }
}

/**
 * Get display value for filter term (expand estado abbreviations)
 */
function getDisplayValue(term: string, type: ActiveFilter['type']): string {
  if (type === 'estado') {
    const upperTerm = term.toUpperCase();
    switch (upperTerm) {
      case 'P': return 'Pendiente';
      case 'B': return 'Bueno';
      case 'M': return 'Malo';
      case 'R': return 'Regular';
      default: return term;
    }
  }
  return term;
}

/**
 * Get color classes for estado filters
 */
function getEstadoColors(term: string, isDarkMode: boolean): { bg: string; border: string; text: string } {
  const upperTerm = term.toUpperCase();
  
  switch (upperTerm) {
    case 'P':
    case 'PENDIENTE':
      return isDarkMode
        ? { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' }
        : { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' };
    case 'B':
    case 'BUENO':
      return isDarkMode
        ? { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' }
        : { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' };
    case 'M':
    case 'MALO':
      return isDarkMode
        ? { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' }
        : { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' };
    case 'R':
    case 'REGULAR':
      return isDarkMode
        ? { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' }
        : { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' };
    default:
      return isDarkMode
        ? { bg: 'bg-white/10', border: 'border-white/20', text: 'text-white' }
        : { bg: 'bg-black/10', border: 'border-black/20', text: 'text-black' };
  }
}

export default function FilterChips({
  activeFilters,
  removeFilter,
  clearAllFilters,
  isDarkMode
}: FilterChipsProps) {
  
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      <AnimatePresence mode="popLayout">
        {activeFilters.map((filter, index) => {
          // Get colors for estado filters
          const isEstado = filter.type === 'estado';
          const estadoColors = isEstado ? getEstadoColors(filter.term, isDarkMode) : null;
          const displayValue = getDisplayValue(filter.term, filter.type);
          
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
                estadoColors
                  ? `${estadoColors.bg} ${estadoColors.border} ${estadoColors.text}`
                  : isDarkMode
                    ? 'bg-white/10 text-white border-white/20'
                    : 'bg-black/10 text-black border-black/20'
              }`}
            >
              {/* Filter type label */}
              <span className={`text-[10px] font-semibold ${
                estadoColors
                  ? estadoColors.text
                  : isDarkMode ? 'text-white/60' : 'text-black/60'
              }`}>
                {getFilterTypeLabel(filter.type)}
              </span>

              {/* Filter value */}
              <span className="whitespace-nowrap">
                {displayValue}
              </span>

              {/* Remove button */}
              <motion.button
                onClick={() => removeFilter(index)}
                className={`p-0.5 rounded-full transition-colors ${
                  estadoColors
                    ? `hover:bg-current/10 ${estadoColors.text}`
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

        {/* Clear all button - only show if more than 1 filter */}
        {activeFilters.length > 1 && (
          <motion.button
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={clearAllFilters}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              isDarkMode
                ? 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
                : 'bg-black/5 text-black/80 border-black/10 hover:bg-black/10'
            }`}
            title="Limpiar todos los filtros"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X size={12} />
            Limpiar todo
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
