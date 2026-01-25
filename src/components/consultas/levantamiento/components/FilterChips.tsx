/**
 * FilterChips Component
 * 
 * Displays active filters as removable chips/tags.
 * Provides visual feedback and easy filter removal.
 */

import React from 'react';
import { X } from 'lucide-react';
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
function getFilterTypeAbbreviation(type: ActiveFilter['type']): string {
  switch (type) {
    case 'id': return 'ID';
    case 'descripcion': return 'Desc';
    case 'rubro': return 'Rubro';
    case 'estado': return 'Edo';
    case 'estatus': return 'Est';
    case 'area': return 'Área';
    case 'usufinal': return 'Usu';
    case 'resguardante': return 'Resg';
    default: return type || '';
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
}: FilterChipsProps): React.ReactElement | null {
  
  // Don't render if no filters
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-1 px-1">
      {activeFilters.map((filter, index) => {
        const colorClass = isDarkMode
          ? 'bg-white/10 border-white/30 text-white/90'
          : 'bg-blue-50 border-blue-200 text-blue-800';

        return (
          <div
            key={index}
            className={`inline-flex items-center px-2 py-0.5 rounded-full ${colorClass} text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200 border`}
          >
            {/* Filter type label */}
            <span className="uppercase font-semibold opacity-70 mr-1 text-[10px]">
              {getFilterTypeAbbreviation(filter.type)}
            </span>

            {/* Filter value */}
            <span className="truncate max-w-[120px]">
              {filter.term}
            </span>

            {/* Remove button */}
            <button
              onClick={() => onRemoveFilter(index)}
              className={`ml-1 p-0.5 rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors ${
                isDarkMode
                  ? 'text-white/60 hover:text-white'
                  : 'text-blue-600/60 hover:text-blue-800'
              }`}
              title="Eliminar filtro"
              tabIndex={0}
              aria-label={`Eliminar filtro ${getFilterTypeAbbreviation(filter.type)}: ${filter.term}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
