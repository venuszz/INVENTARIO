/**
 * DirectorSelection component
 * Autocomplete input for director selection with suggestions
 */

import { useTheme } from '@/context/ThemeContext';
import { SuggestionDropdown } from './SuggestionDropdown';
import type { Directorio } from '../types';

interface DirectorSelectionProps {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  disabled: boolean;
  suggestions: Directorio[];
  showSuggestions: boolean;
  highlightedIndex: number;
  onSuggestionClick: (director: Directorio) => void;
  suggestedDirector: Directorio | null;
  showAllDirectors: boolean;
  onShowAllDirectors: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  placeholder?: string;
  initialSuggestion: string;
  selectedDirectorId: string;
  directorio: Directorio[];
  onHighlightChange: (index: number) => void;
  forceShowAll: boolean;
}

/**
 * Director autocomplete selection component
 */
export function DirectorSelection({
  value,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  disabled,
  suggestions,
  showSuggestions,
  highlightedIndex,
  onSuggestionClick,
  suggestedDirector,
  showAllDirectors,
  onShowAllDirectors,
  inputRef,
  placeholder,
  initialSuggestion,
  selectedDirectorId,
  directorio,
  onHighlightChange,
  forceShowAll
}: DirectorSelectionProps) {
  const { isDarkMode } = useTheme();

  const displayValue = selectedDirectorId
    ? directorio.find(d => d.id_directorio.toString() === selectedDirectorId)?.nombre || value
    : value;

  return (
    <div className="mb-4">
      <label className={`text-sm font-medium mb-1 ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Director de Área
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          placeholder={placeholder || (initialSuggestion ? 'Buscar director...' : 'Buscar director por nombre...')}
          className={`w-full border rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 transition-colors ${
            isDarkMode
              ? 'bg-black border-gray-800 text-white placeholder-gray-500 focus:ring-blue-500 hover:border-blue-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 hover:border-blue-400'
          }`}
          disabled={disabled}
          autoComplete="off"
        />
        <SuggestionDropdown
          items={suggestions}
          renderItem={(director, index, isHighlighted) => {
            const isSuggested = !forceShowAll && suggestedDirector && director.id_directorio === suggestedDirector.id_directorio;
            return (
              <div
                className={`flex flex-col px-3 py-2 text-xs whitespace-normal break-words w-full border-b last:border-b-0 transition-colors ${
                  isDarkMode
                    ? `border-gray-800 ${isHighlighted ? 'bg-gray-800/80 text-white' : 'text-gray-300'} hover:bg-gray-800/80`
                    : `border-gray-200 ${isHighlighted ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`
                } ${isSuggested ? (isDarkMode ? 'font-bold text-white' : 'font-bold text-gray-900') : ''}`}
              >
                <span className="flex items-center gap-2">
                  <span className="font-semibold">{director.nombre}</span>
                  {isSuggested && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-700/60 text-xs text-white">
                      Sugerido
                    </span>
                  )}
                </span>
                <span className={`text-[10px] ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {director.puesto || <span className="italic text-yellow-400">Sin puesto</span>}
                </span>
              </div>
            );
          }}
          onItemClick={(director) => onSuggestionClick(director)}
          highlightedIndex={highlightedIndex}
          onHighlightChange={onHighlightChange}
          show={showSuggestions}
          ariaLabel="Lista de directores sugeridos"
        />
      </div>
      
      {/* Suggested director chip */}
      {(!value && !selectedDirectorId && suggestedDirector && initialSuggestion) && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onSuggestionClick(suggestedDirector);
            }}
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow transition-all ${
              isDarkMode
                ? 'bg-blue-900/30 text-blue-200 border-blue-700 hover:bg-blue-900/50 hover:text-white'
                : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 hover:text-blue-800'
            }`}
            title={`Usar sugerencia: ${suggestedDirector.nombre}`}
          >
            <span className="font-bold">Sugerido:</span> {suggestedDirector.nombre}
          </button>
        </div>
      )}
      
      {/* Show all directors button */}
      {(!value && !selectedDirectorId && suggestedDirector && initialSuggestion) && (
        <div className="mt-2">
          <button
            type="button"
            className={`px-4 py-1.5 rounded-lg border text-xs font-semibold shadow transition-all ${
              isDarkMode
                ? 'bg-gray-900 text-gray-200 border-gray-700 hover:bg-gray-900/30 hover:text-white'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:text-gray-900'
            }`}
            onMouseDown={(e) => {
              e.preventDefault();
              onShowAllDirectors();
            }}
          >
            Ver todo el directorio
          </button>
        </div>
      )}
    </div>
  );
}
