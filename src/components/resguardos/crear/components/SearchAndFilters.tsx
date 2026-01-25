/**
 * SearchAndFilters component
 * Omnibox search with intelligent suggestions and filter management
 */

import { Plus } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { getTypeIcon, getTypeLabel } from '../utils';
import { SuggestionDropdown } from './SuggestionDropdown';
import type { SearchMatchType } from '../types';

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  suggestions: Array<{ value: string; type: SearchMatchType }>;
  showSuggestions: boolean;
  highlightedIndex: number;
  onSuggestionClick: (index: number) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onBlur: () => void;
  onSaveFilter: () => void;
  searchMatchType: SearchMatchType | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onShowSuggestionsChange: (show: boolean) => void;
  onHighlightChange: (index: number) => void;
}

/**
 * Search input with omnibox suggestions and filter management
 */
export function SearchAndFilters({
  searchTerm,
  onSearchChange,
  suggestions,
  showSuggestions,
  highlightedIndex,
  onSuggestionClick,
  onKeyDown,
  onBlur,
  onSaveFilter,
  searchMatchType,
  inputRef,
  onShowSuggestionsChange,
  onHighlightChange
}: SearchAndFiltersProps) {
  const { isDarkMode } = useTheme();

  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
      <div className="relative flex-1">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={e => {
                onSearchChange(e.target.value);
                onShowSuggestionsChange(true);
              }}
              onKeyDown={onKeyDown}
              onBlur={onBlur}
              placeholder="Buscar por cualquier campo..."
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${
                isDarkMode
                  ? 'bg-black/50 border-gray-800 text-white placeholder-gray-500 focus:ring-white hover:border-white/50'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 hover:border-blue-400'
              }`}
              aria-autocomplete="list"
              aria-controls="omnibox-suggestions"
              {...(highlightedIndex >= 0 && { 'aria-activedescendant': `omnibox-suggestion-${highlightedIndex}` })}
              autoComplete="off"
            />
            <SuggestionDropdown
              items={suggestions}
              renderItem={(item, index, isHighlighted) => (
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 text-xs whitespace-normal break-words w-full transition-colors ${
                    isHighlighted
                      ? (isDarkMode ? 'bg-white/5 text-white' : 'bg-blue-50 text-blue-900')
                      : (isDarkMode ? 'text-white/80 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50')
                  }`}
                >
                  <span className={`shrink-0 ${
                    isDarkMode ? 'text-white/70' : 'text-gray-600'
                  }`}>
                    {getTypeIcon(item.type)}
                  </span>
                  <span className="font-normal whitespace-normal break-words w-full truncate">
                    {item.value}
                  </span>
                  <span className={`ml-auto text-[10px] font-mono ${
                    isDarkMode ? 'text-white/60' : 'text-gray-500'
                  }`}>
                    {getTypeLabel(item.type)}
                  </span>
                </div>
              )}
              onItemClick={(item, index) => onSuggestionClick(index)}
              highlightedIndex={highlightedIndex}
              onHighlightChange={onHighlightChange}
              show={showSuggestions}
              ariaLabel="Sugerencias de búsqueda"
            />
          </div>
          <button
            onClick={onSaveFilter}
            disabled={!searchTerm || !searchMatchType}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all duration-200 hover:scale-105 ${
              searchTerm && searchMatchType
                ? (isDarkMode
                  ? 'bg-gray-600 hover:bg-gray-700 border-white text-white'
                  : 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white'
                )
                : (isDarkMode
                  ? 'bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
                )
            }`}
            title="Agregar filtro actual a la lista de filtros activos"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar Filtro</span>
          </button>
        </div>
      </div>
    </div>
  );
}
