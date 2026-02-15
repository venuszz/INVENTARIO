/**
 * SearchAndFilters component
 * Provides search input with autocomplete suggestions
 */

import React from 'react';
import { Search, Hash, MapPin, User, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { RefObject } from 'react';

interface Suggestion {
  value: string;
  type: 'id' | 'descripcion' | 'rubro' | 'estado' | 'estatus' | 'area' | 'usufinal' | 'resguardante' | 'director' | 'origen' | null;
  displayValue?: string;
}

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  suggestions: Suggestion[];
  showSuggestions: boolean;
  highlightedIndex: number;
  onSuggestionClick: (index: number) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onSaveFilter: () => void;
  searchMatchType: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onShowSuggestionsChange: (show: boolean) => void;
  onHighlightChange: (index: number) => void;
  totalRecords?: number;
  activeFilters?: Array<{ term: string; type: string | null; displayTerm?: string }>;
  onRemoveFilter?: (index: number) => void;
}

/**
 * Search input with autocomplete suggestions
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

  const getFilterTypeLabel = (type: string | null): string => {
    switch (type) {
      case 'id': return 'ID';
      case 'descripcion': return 'Descripción';
      case 'rubro': return 'Rubro';
      case 'estado': return 'Estado';
      case 'estatus': return 'Estatus';
      case 'area': return 'Área';
      case 'usufinal': return 'Director';
      case 'director': return 'Director';
      case 'resguardante': return 'Resguardante';
      case 'origen': return 'Origen';
      default: return type || 'Filtro';
    }
  };

  const getIconForType = (type: string | null) => {
    if (!type) return <Search className="w-3.5 h-3.5" />;
    switch (type) {
      case 'id': return <Hash className="w-3.5 h-3.5" />;
      case 'area': return <MapPin className="w-3.5 h-3.5" />;
      case 'usufinal': return <User className="w-3.5 h-3.5" />;
      case 'resguardante': return <User className="w-3.5 h-3.5" />;
      case 'descripcion': return <FileText className="w-3.5 h-3.5" />;
      default: return <Search className="w-3.5 h-3.5" />;
    }
  };

  const getTypeLabel = (type: string | null) => {
    if (!type) return 'Búsqueda';
    switch (type) {
      case 'id': return 'ID';
      case 'area': return 'Área';
      case 'usufinal': return 'Director';
      case 'director': return 'Director';
      case 'resguardante': return 'Resguardante';
      case 'descripcion': return 'Descripción';
      case 'rubro': return 'Rubro';
      case 'estado': return 'Estado';
      case 'estatus': return 'Estatus';
      case 'origen': return 'Origen';
      default: return 'Búsqueda';
    }
  };

  const getOrigenChipStyles = (origen: string) => {
    switch (origen) {
      case 'INEA':
        return isDarkMode 
          ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' 
          : 'bg-blue-100 text-blue-700 border-blue-300';
      case 'ITEA':
        return isDarkMode 
          ? 'bg-pink-500/10 text-pink-300 border-pink-500/30' 
          : 'bg-pink-100 text-pink-700 border-pink-300';
      case 'TLAXCALA':
        return isDarkMode 
          ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' 
          : 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return isDarkMode 
          ? 'bg-white/10 text-white border-white/20' 
          : 'bg-black/10 text-black border-black/20';
    }
  };

  const getEstadoChipStyles = (estado: string) => {
    switch (estado.toUpperCase()) {
      case 'B':
        return isDarkMode 
          ? 'bg-green-500/10 text-green-300 border-green-500/30' 
          : 'bg-green-100 text-green-700 border-green-300';
      case 'R':
        return isDarkMode 
          ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' 
          : 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'M':
        return isDarkMode 
          ? 'bg-red-500/10 text-red-300 border-red-500/30' 
          : 'bg-red-100 text-red-700 border-red-300';
      default:
        return isDarkMode 
          ? 'bg-white/10 text-white border-white/20' 
          : 'bg-black/10 text-black border-black/20';
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
          placeholder="Buscar por ID, descripción, área, director, origen, estado..."
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
            {activeFilters.map((filter, index) => {
              const displayValue = filter.displayTerm || filter.term;
              const chipStyles = filter.type === 'origen' 
                ? getOrigenChipStyles(filter.term)
                : filter.type === 'estado'
                  ? getEstadoChipStyles(filter.term)
                  : isDarkMode
                    ? 'bg-white/10 text-white border-white/20'
                    : 'bg-black/10 text-black border-black/20';
              
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
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all ${chipStyles}`}
                >
                  {/* Filter type label */}
                  <span className={`text-[9px] font-semibold uppercase ${
                    filter.type === 'origen' || filter.type === 'estado'
                      ? 'opacity-70'
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
                    onClick={() => onRemoveFilter(index)}
                    className={`p-0.5 rounded-full transition-colors ${
                      filter.type === 'origen' || filter.type === 'estado'
                        ? 'hover:bg-black/10 opacity-60 hover:opacity-100'
                        : isDarkMode
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
              );
            })}
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
          {totalRecords.toLocaleString()} registros
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
                const displayValue = suggestion.displayValue || suggestion.value;
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
                        {displayValue}
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
