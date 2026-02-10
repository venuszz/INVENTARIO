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
    ? directorio.find(d => d.id_directorio.toString() === selectedDirectorId)?.nombre || value || ''
    : value || '';

  return (
    <div className="mb-4">
      <label className={`block text-xs font-medium mb-1.5 ${
        isDarkMode ? 'text-white/60' : 'text-black/60'
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
          className={`w-full border rounded py-2 px-3 text-sm transition-colors focus:outline-none ${
            isDarkMode
              ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-white/30'
              : 'bg-black/5 border-black/10 text-black placeholder-black/40 focus:border-black/30'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={disabled}
          autoComplete="off"
        />
        <SuggestionDropdown
          items={suggestions}
          renderItem={(director, index, isHighlighted) => {
            const isSuggested = !forceShowAll && suggestedDirector && director.id_directorio === suggestedDirector.id_directorio;
            return (
              <div
                className={`flex flex-col px-3 py-2 text-xs border-b last:border-b-0 transition-colors ${
                  isDarkMode
                    ? `border-white/5 ${isHighlighted ? 'bg-white/10' : 'bg-white/5'} hover:bg-white/10`
                    : `border-black/5 ${isHighlighted ? 'bg-black/10' : 'bg-black/5'} hover:bg-black/10`
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`font-medium ${
                    isDarkMode ? 'text-white' : 'text-black'
                  } ${isSuggested ? 'font-semibold' : ''}`}>
                    {director.nombre || <span className="italic text-white/40">Sin nombre</span>}
                  </span>
                  {isSuggested && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] border ${
                      isDarkMode 
                        ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' 
                        : 'bg-blue-100 text-blue-700 border-blue-300'
                    }`}>
                      Sugerido
                    </span>
                  )}
                </span>
                <span className={`text-[10px] mt-0.5 ${
                  isDarkMode ? 'text-white/40' : 'text-black/40'
                }`}>
                  {director.puesto || <span className="italic">Sin puesto</span>}
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
      {!disabled && (!value && !selectedDirectorId && suggestedDirector && initialSuggestion) && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onSuggestionClick(suggestedDirector);
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-colors ${
              isDarkMode
                ? 'bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20'
                : 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
            }`}
            title={`Usar sugerencia: ${suggestedDirector.nombre}`}
          >
            <span className="font-medium">Sugerido:</span> {suggestedDirector.nombre || 'Sin nombre'}
          </button>
        </div>
      )}
      
      {/* Show all directors button */}
      {!disabled && (!value && !selectedDirectorId && suggestedDirector && initialSuggestion) && (
        <div className="mt-2">
          <button
            type="button"
            className={`px-3 py-1 rounded text-xs border transition-colors ${
              isDarkMode
                ? 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
                : 'bg-black/5 text-black/80 border-black/10 hover:bg-black/10'
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
