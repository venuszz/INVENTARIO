import React from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActiveFilter } from '../types';
import SuggestionDropdown from './SuggestionDropdown';

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
          <SuggestionDropdown
            suggestions={suggestions}
            highlightedIndex={highlightedIndex}
            onSuggestionClick={onSuggestionClick}
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
