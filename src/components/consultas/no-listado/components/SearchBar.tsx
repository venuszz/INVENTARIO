import React from 'react';
import { Search, Hash, MapPin, User, FileText, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActiveFilter } from '../types';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchMatchType: ActiveFilter['type'];
  showSuggestions: boolean;
  suggestions: { value: string; type: ActiveFilter['type'] }[];
  highlightedIndex: number;
  onSuggestionClick: (index: number) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  isDarkMode: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export default function SearchBar({
  searchTerm,
  setSearchTerm,
  searchMatchType,
  showSuggestions,
  suggestions,
  highlightedIndex,
  onSuggestionClick,
  onKeyDown,
  onBlur,
  isDarkMode,
  inputRef
}: SearchBarProps) {
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
          placeholder="Buscar por ID, descripción, área, director..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
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
            {searchMatchType === 'usufinal' ? 'director' : searchMatchType}
          </motion.span>
        )}
      </div>

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
                    onClick={() => onSuggestionClick(index)}
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
                      {suggestion.type === 'id' ? <Hash className="w-3.5 h-3.5" /> : 
                       suggestion.type === 'area' ? <MapPin className="w-3.5 h-3.5" /> :
                       suggestion.type === 'usufinal' ? <User className="w-3.5 h-3.5" /> :
                       suggestion.type === 'descripcion' ? <FileText className="w-3.5 h-3.5" /> : 
                       suggestion.type === 'resguardante' ? <User className="w-3.5 h-3.5" /> :
                       suggestion.type === 'rubro' ? <Package className="w-3.5 h-3.5" /> :
                       <Search className="w-3.5 h-3.5" />}
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
                        {suggestion.type === 'id' ? 'ID de Inventario' :
                         suggestion.type === 'area' ? 'Área' :
                         suggestion.type === 'usufinal' ? 'Director' :
                         suggestion.type === 'descripcion' ? 'Descripción' :
                         suggestion.type === 'resguardante' ? 'Resguardante' :
                         suggestion.type === 'rubro' ? 'Rubro' :
                         suggestion.type === 'estado' ? 'Estado' :
                         suggestion.type === 'estatus' ? 'Estatus' :
                         suggestion.type || 'Búsqueda'}
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
