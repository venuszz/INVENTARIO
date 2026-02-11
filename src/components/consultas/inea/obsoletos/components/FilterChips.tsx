import { X } from 'lucide-react';
import type { FilterState } from '../types';

interface FilterChipsProps {
  filters: FilterState;
  onRemoveFilter: (key: keyof FilterState) => void;
  onClearAll: () => void;
  isDarkMode: boolean;
}

export function FilterChips({ filters, onRemoveFilter, onClearAll, isDarkMode }: FilterChipsProps) {
  const activeFilters = Object.entries(filters).filter(([_, value]) => value !== '');
  
  if (activeFilters.length === 0) return null;
  
  return (
    <div className="flex flex-wrap items-center gap-2 mt-4">
      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Filtros activos:
      </span>
      {activeFilters.map(([key, value]) => (
        <div
          key={key}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 animate-fadeIn ${
            isDarkMode
              ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
              : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
          }`}
        >
          <span className="capitalize">{key}:</span>
          <span className="font-semibold">{value}</span>
          <button
            onClick={() => onRemoveFilter(key as keyof FilterState)}
            className={`ml-1 hover:scale-110 transition-transform ${
              isDarkMode ? 'text-gray-300 hover:text-white' : 'text-blue-600 hover:text-blue-800'
            }`}
            aria-label={`Remover filtro ${key}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={onClearAll}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          isDarkMode
            ? 'bg-red-900/20 text-red-400 border border-red-800/50 hover:bg-red-900/30'
            : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
        }`}
      >
        <X className="h-3.5 w-3.5" />
        Limpiar todos
      </button>
    </div>
  );
}
