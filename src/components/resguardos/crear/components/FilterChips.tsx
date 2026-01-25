/**
 * FilterChips component
 * Displays active filters as removable chips
 */

import { X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { getTypeIcon, getTypeLabel } from '../utils';
import type { ActiveFilter } from '../types';

interface FilterChipsProps {
  filters: ActiveFilter[];
  onRemoveFilter: (index: number) => void;
  onClearAll?: () => void;
}

/**
 * Component for displaying active filters as chips
 */
export function FilterChips({ filters, onRemoveFilter, onClearAll }: FilterChipsProps) {
  const { isDarkMode } = useTheme();

  if (filters.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2 w-full">
      {filters.map((filter, index) => {
        const colorClass = isDarkMode
          ? 'bg-white/10 border-white/30 text-white/90'
          : 'bg-blue-50 border-blue-200 text-blue-800';

        const shortLabel = 
          filter.type === 'id' ? 'ID' :
          filter.type === 'descripcion' ? 'Desc' :
          filter.type === 'rubro' ? 'Rubro' :
          filter.type === 'estado' ? 'Edo' :
          filter.type === 'estatus' ? 'Est' :
          filter.type === 'area' ? 'Área' :
          filter.type === 'usufinal' ? 'Usu' :
          filter.type === 'resguardante' ? 'Resg' :
          filter.type;

        return (
          <div
            key={index}
            className={`inline-flex items-center px-2 py-0.5 rounded-full ${colorClass} text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200 border`}
          >
            <span className="uppercase font-semibold opacity-70 mr-1 text-[10px]">
              {shortLabel}
            </span>
            <span className="truncate max-w-[120px]">{filter.term}</span>
            <button
              onClick={() => onRemoveFilter(index)}
              className={`ml-1 p-0.5 rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors ${
                isDarkMode
                  ? 'text-white/60 hover:text-white'
                  : 'text-blue-600/60 hover:text-blue-800'
              }`}
              title="Eliminar filtro"
              tabIndex={0}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
      {filters.length > 1 && onClearAll && (
        <button
          onClick={onClearAll}
          className={`px-2 py-0.5 rounded-full border text-xs bg-transparent transition-colors ${
            isDarkMode
              ? 'border-gray-700 text-gray-400 hover:text-white hover:border-white'
              : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'
          }`}
          title="Limpiar todos los filtros"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}
