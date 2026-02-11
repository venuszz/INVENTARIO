import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActiveFilter } from '../hooks/useSearchAndFilters';

interface SuggestionDropdownProps {
  suggestions: { value: string; type: ActiveFilter['type'] }[];
  highlightedIndex: number;
  onSuggestionClick: (index: number) => void;
  isDarkMode: boolean;
}

export function SuggestionDropdown({
  suggestions,
  highlightedIndex,
  onSuggestionClick,
  isDarkMode
}: SuggestionDropdownProps) {
  const getTypeLabel = (type: ActiveFilter['type']) => {
    switch (type) {
      case 'id': return 'ID';
      case 'descripcion': return 'Descripción';
      case 'area': return 'Área';
      case 'usufinal': return 'Director';
      case 'resguardante': return 'Resguardante';
      case 'rubro': return 'Rubro';
      case 'estado': return 'Estado';
      case 'estatus': return 'Estatus';
      default: return '';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg overflow-hidden z-50 ${
          isDarkMode
            ? 'bg-black border-white/10'
            : 'bg-white border-black/10'
        }`}
      >
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onMouseDown={(e) => {
              e.preventDefault();
              onSuggestionClick(index);
            }}
            className={`w-full px-4 py-2 text-left text-sm font-light tracking-tight transition-colors flex items-center justify-between ${
              index === highlightedIndex
                ? isDarkMode
                  ? 'bg-white/10 text-white'
                  : 'bg-black/10 text-black'
                : isDarkMode
                ? 'text-white hover:bg-white/5'
                : 'text-black hover:bg-black/5'
            }`}
          >
            <span className="truncate">{suggestion.value}</span>
            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
              isDarkMode
                ? 'bg-white/10 text-white/60'
                : 'bg-black/10 text-black/60'
            }`}>
              {getTypeLabel(suggestion.type)}
            </span>
          </button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
