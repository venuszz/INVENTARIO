/**
 * Custom hook for director search and autocomplete
 */

import { useState, useMemo, useCallback } from 'react';
import type { Directorio } from '../types';

export interface UseDirectorAutocompleteReturn {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
  filteredDirectors: Directorio[];
  suggestedDirector: Directorio | null;
  forceShowAll: boolean;
  setForceShowAll: (show: boolean) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleBlur: () => void;
}

/**
 * Utility function to clean and normalize text for comparison
 */
function clean(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Hook for director autocomplete functionality
 * 
 * @param directorio - Array of directors
 * @param initialSuggestion - Initial suggestion based on selected items
 * @returns Object containing autocomplete state and functions
 */
export function useDirectorAutocomplete(
  directorio: Directorio[],
  initialSuggestion: string
): UseDirectorAutocompleteReturn {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [forceShowAll, setForceShowAll] = useState(false);

  // Find suggested director based on search term or initial suggestion
  const suggestedDirector = useMemo(() => {
    const term = searchTerm || initialSuggestion;
    if (!term) return null;
    
    const targetNombre = clean(term);
    
    // 1. Exact match by name
    let match = directorio.find(opt => clean(opt.nombre) === targetNombre);
    
    // 2. Partial match by name (more flexible)
    if (!match) {
      const nombreParts = targetNombre.split(/\s+/);
      const matches = directorio
        .map(opt => {
          const optNombre = clean(opt.nombre);
          const matchCount = nombreParts.filter(part =>
            optNombre.includes(part) || (part.length > 3 && optNombre.includes(part.slice(0, -1)))
          ).length;
          return { opt, matchCount };
        })
        .filter(({ matchCount }) => matchCount > 0)
        .sort((a, b) => b.matchCount - a.matchCount);
      
      if (matches.length > 0) {
        match = matches[0].opt;
      }
    }
    
    return match || null;
  }, [directorio, searchTerm, initialSuggestion]);

  // Filter directors based on search term
  const filteredDirectors = useMemo(() => {
    let options = directorio;
    const filterTerm = forceShowAll ? '' : (searchTerm || initialSuggestion);
    
    if (filterTerm) {
      options = options.filter(opt => clean(opt.nombre).includes(clean(filterTerm)));
    }
    
    // Put suggested director first
    if (!forceShowAll && suggestedDirector) {
      options = [
        suggestedDirector,
        ...options.filter(opt => opt.id_directorio !== suggestedDirector.id_directorio)
      ];
    }
    
    return options;
  }, [directorio, searchTerm, initialSuggestion, forceShowAll, suggestedDirector]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredDirectors.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(i => (i + 1) % filteredDirectors.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(i => (i - 1 + filteredDirectors.length) % filteredDirectors.length);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [showSuggestions, filteredDirectors.length]);

  const handleBlur = useCallback(() => {
    setTimeout(() => setShowSuggestions(false), 100);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    showSuggestions,
    setShowSuggestions,
    highlightedIndex,
    setHighlightedIndex,
    filteredDirectors,
    suggestedDirector,
    forceShowAll,
    setForceShowAll,
    handleKeyDown,
    handleBlur,
  };
}
