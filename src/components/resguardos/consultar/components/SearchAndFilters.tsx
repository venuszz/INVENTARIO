/**
 * SearchAndFilters component for Consultar Resguardos
 * Provides unified search input with autocomplete suggestions and filter chips
 */

import React from 'react';
import { Search, FileText, User, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { RefObject } from 'react';
import type { Suggestion, ActiveFilter, SearchMatchType } from '../types';

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  suggestions: Suggestion[];
  showSuggestions: boolean;
  highlightedIndex: number;
  onSuggestionClick: (index: number) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  searchMatchType: SearchMatchType | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onShowSuggestionsChange: (show: boolean) => void;
  onHighlightChange: (index: number) => void;
  totalRecords?: number;
  activeFilters?: ActiveFilter[];
  onRemoveFilter?: (index: number) => void;
}

/**
 * Search input with autocomplete suggestions for Consultar Resguardos
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
  searchMatchType,
  inputRef,
  onShowSuggestionsChange,
  onHighlightChange,
  totalRecords = 0,
  activeFilters = [],
  onRemoveFilter
}: SearchAndFiltersProps) {
  const { isDarkMode } = useTheme();

  const getFilterTypeLabel = (type: SearchMatchType | null): string => {
    switch (type) {
      case 'folio': return 'Folio';
      case 'director': return 'Director';
      case 'resguardante': return 'Resguardante';
      case 'fecha': return 'Fecha';
      default: return type || 'Filtro';
    }
  };

  const getIconForType = (type: SearchMatchType | null) => {
    if (!type) return <Search className="w-3.5 h-3.5" />;
    switch (type) {
      case 'folio': return <FileText className="w-3.5 h-3.5" />;
      case 'director': return <User className="w-3.5 h-3.5" />;
      case 'resguardante': return <User className="w-3.5 h-3.5" />;
      case 'fecha': return <Calendar className="w-3.5 h-3.5" />;
      default: return <Search className="w-3.5 h-3.5" />;
    }
  };

  const getTypeLabel = (type: SearchMatchType | null) => {
    if (!type) return 'Búsqueda';
    switch (type) {
      case 'folio': return 'Folio';
      case 'director': return 'Director';
      case 'resguardante': return 'Resguardante';
      case 'fecha': return 'Fecha';
      default: return 'Búsqueda';
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search 
          size={16} 
          className={`absolute left-3 top-1/2 -translate-y-1/2 ${
            isDarkMode ? 'text-white/40' : 'text-black/40'
          }`}
        />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar por folio, director, resguardante, fecha..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          onFocus={() => onShowSuggestionsChange(true)}
          className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm transition-all ${
            isDarkMode
              ? 'bg-black border-white/10 text-white placeholder:text-white/40 focus:border-white/20'
              : 'bg-white border-black/10 text-black placeholder:text-black/40 focus:border-black/20'
          } focus:outline-none`}
        />
        {searchMatchType && (
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded-full font-medium ${
              isDarkMode 
                ? 'bg-white/10 text-white/80 border border-white/20' 
                : 'bg-black/10 text-black/80 border border-black/20'
            }`}
          >
            {getTypeLabel(searchMatchType)}
          </motion.span>
        )}
      </div>

      {/* Filter chips */}
      {activeFilters.length > 0 && onRemoveFilter && (
        <div className="flex flex-wrap gap-1.5 mt-2">
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
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all ${
                  isDarkMode
                    ? 'bg-white/10 text-white border-white/20'
                    : 'bg-black/10 text-black border-black/20'
                }`}
              >
                {/* Filter type label */}
                <span className={`text-[9px] font-semibold uppercase ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                  {getFilterTypeLabel(filter.type)}
                </span>

                {/* Filter value */}
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
                  <X size={10} />
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Total records display */}
      {totalRecords > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-center mt-2 text-xs ${
            isDarkMode ? 'text-white/40' : 'text-black/40'
          }`}
        >
          {totalRecords.toLocaleString()} resguardos
        </motion.div>
      )}

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 w-full mt-2 rounded-lg border shadow-lg overflow-hidden ${
              isDarkMode
                ? 'bg-black border-white/10'
                : 'bg-white border-black/10'
            }`}
          >
            <div className={`max-h-60 overflow-y-auto p-1 ${
              isDarkMode 
                ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30'
                : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20 hover:scrollbar-thumb-black/30'
            }`}>
              {suggestions.map((suggestion, index) => {
                const isSelected = index === highlightedIndex;
                return (
                  <button
                    key={`${suggestion.type}-${suggestion.value}-${index}`}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSuggestionClick(index);
                    }}
                    onMouseEnter={() => onHighlightChange(index)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150 ${
                      isSelected
                        ? isDarkMode 
                          ? 'bg-white/10 text-white' 
                          : 'bg-black/10 text-black'
                        : isDarkMode
                          ? 'hover:bg-white/[0.04] text-white/90'
                          : 'hover:bg-black/[0.03] text-black/90'
                    }`}
                  >
                    {/* Icon based on type */}
                    <span className={isSelected 
                      ? (isDarkMode ? 'text-white' : 'text-black')
                      : (isDarkMode ? 'text-white/40' : 'text-black/40')
                    }>
                      {getIconForType(suggestion.type)}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate font-medium">
                        {suggestion.value}
                      </div>
                      <div className={`text-xs truncate ${
                        isSelected
                          ? (isDarkMode ? 'text-white/60' : 'text-black/60')
                          : (isDarkMode ? 'text-white/40' : 'text-black/40')
                      }`}>
                        {getTypeLabel(suggestion.type)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollbar styles */}
      <style jsx>{`
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
        }
      `}</style>
    </div>
  );
}
