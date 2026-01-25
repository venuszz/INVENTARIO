/**
 * SearchBar Component
 * 
 * Omnibox search input with autocomplete dropdown.
 * Provides keyboard navigation and suggestion selection.
 */

'use client';

import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Search } from 'lucide-react';
import { Suggestion, SearchMatchType } from '../types';
import { getTypeLabel, getTypeIcon } from '../utils';

/**
 * Component props interface
 */
interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  suggestions: Suggestion[];
  showSuggestions: boolean;
  highlightedIndex: number;
  onSuggestionSelect: (suggestion: Suggestion) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  searchMatchType: SearchMatchType | null;
  isDarkMode: boolean;
}

/**
 * SearchBar component
 * 
 * Renders an omnibox-style search input with floating autocomplete dropdown.
 * Supports keyboard navigation (Arrow keys, Enter, Escape) and mouse interaction.
 * 
 * @param props - Component props
 * @returns JSX element with search input and suggestion dropdown
 * 
 * @example
 * <SearchBar
 *   searchTerm={searchTerm}
 *   onSearchChange={setSearchTerm}
 *   suggestions={suggestions}
 *   showSuggestions={showSuggestions}
 *   highlightedIndex={highlightedIndex}
 *   onSuggestionSelect={handleSuggestionSelect}
 *   onKeyDown={handleKeyDown}
 *   onBlur={handleBlur}
 *   searchMatchType={searchMatchType}
 *   isDarkMode={isDarkMode}
 * />
 */
export function SearchBar({
  searchTerm,
  onSearchChange,
  suggestions,
  showSuggestions,
  highlightedIndex,
  onSuggestionSelect,
  onKeyDown,
  onBlur,
  searchMatchType,
  isDarkMode
}: SearchBarProps): React.ReactElement {
  
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownClass, setDropdownClass] = useState<string>('');

  /**
   * Calculate dropdown position and create dynamic CSS class
   * Updates when suggestions visibility or count changes
   */
  useEffect(() => {
    if (showSuggestions && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const className = 'omnibox-dropdown-float';
      
      // Remove previous style if exists
      const prev = document.getElementById('omnibox-dropdown-style');
      if (prev) prev.remove();
      
      // Create new style element
      const style = document.createElement('style');
      style.id = 'omnibox-dropdown-style';
      style.innerHTML = `
        .${className} {
          position: fixed !important;
          left: ${rect.left}px !important;
          top: ${rect.bottom + window.scrollY}px !important;
          width: ${rect.width}px !important;
          z-index: 10000 !important;
        }
      `;
      document.head.appendChild(style);
      setDropdownClass(className);
    } else {
      setDropdownClass('');
      const prev = document.getElementById('omnibox-dropdown-style');
      if (prev) prev.remove();
    }
  }, [showSuggestions, suggestions.length]);

  /**
   * Suggestion dropdown sub-component
   * Rendered as a portal to document.body for proper positioning
   */
  function SuggestionDropdown(): React.ReactElement | null {
    if (!showSuggestions || !dropdownClass || suggestions.length === 0) {
      return null;
    }

    return ReactDOM.createPortal(
      <ul
        id="omnibox-suggestions"
        role="listbox"
        title="Sugerencias de búsqueda"
        className={`animate-fadeInUp max-h-60 overflow-y-auto rounded-lg shadow-sm border transition-all duration-200 ${
          isDarkMode 
            ? 'border-white/10 bg-black/95' 
            : 'border-gray-200 bg-white/95'
        } backdrop-blur-xl ${dropdownClass}`}
      >
        {suggestions.map((s, i) => {
          const isSelected = highlightedIndex === i;
          return (
            <li
              key={`${s.type}-${s.value}`}
              id={`omnibox-suggestion-${i}`}
              role="option"
              {...(isSelected && { 'aria-selected': 'true' })}
              tabIndex={-1}
              className={`flex items-center gap-1.5 px-2 py-1.5 cursor-pointer select-none text-xs
                transition-colors duration-150 ease-in-out
                ${isSelected
                  ? isDarkMode 
                    ? 'bg-white/5 text-white' 
                    : 'bg-blue-50 text-blue-900'
                  : isDarkMode 
                    ? 'hover:bg-white/5 text-white/70' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              onMouseDown={e => {
                e.preventDefault();
                onSuggestionSelect(s);
                inputRef.current?.focus();
              }}
              onMouseEnter={() => {
                // Update highlighted index on hover
                // This would need to be passed as a prop if we want to support it
              }}
            >
              <span className={`shrink-0 ${
                isDarkMode ? 'text-white/70' : 'text-gray-600'
              }`}>
                {getTypeIcon(s.type)}
              </span>
              <span className="flex-1 font-normal truncate tracking-wide">
                {s.value}
              </span>
              <span className={`ml-auto text-[10px] font-mono ${
                isDarkMode ? 'text-white/60' : 'text-gray-500'
              }`}>
                {getTypeLabel(s.type)}
              </span>
            </li>
          );
        })}
      </ul>,
      document.body
    );
  }

  return (
    <div className="relative flex items-center w-full group">
      {/* Search icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-300 group-focus-within:scale-110">
        <Search className={`h-5 w-5 transition-colors duration-300 ${
          isDarkMode 
            ? 'text-white/70 group-focus-within:text-white' 
            : 'text-gray-400 group-focus-within:text-gray-600'
        }`} />
      </div>

      {/* Search input */}
      <input
        ref={inputRef}
        spellCheck="false"
        type="text"
        value={searchTerm}
        onChange={e => onSearchChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        placeholder="Buscar por ID, área, director, descripción, etc..."
        className={`
          pl-14 pr-32 py-3 w-full transition-all duration-300
          text-lg font-semibold tracking-wide backdrop-blur-xl
          focus:outline-none focus:ring-2 rounded-2xl shadow-2xl
          ${isDarkMode
            ? 'bg-black/80 text-white placeholder-neutral-500 focus:ring-white/50 focus:border-white/50 border-neutral-800 hover:shadow-white/10 focus:scale-[1.03] focus:bg-black/90' + (searchMatchType ? ' border-white/80 shadow-white/20' : '')
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 focus:scale-[1.02]' + (searchMatchType ? ' border-blue-400 shadow-blue-100' : '')
          }
        `}
        title="Buscar"
        aria-autocomplete="list"
        aria-controls="omnibox-suggestions"
        aria-activedescendant={highlightedIndex >= 0 ? `omnibox-suggestion-${highlightedIndex}` : undefined}
        autoComplete="off"
      />

      {/* Dropdown de sugerencias omnibox flotante */}
      <SuggestionDropdown />
    </div>
  );
}
