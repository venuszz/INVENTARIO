/**
 * Custom hook for managing unified search with suggestions and active filters
 * Adapted for Consultar Resguardos (Resguardo data structure)
 */

import { useState, useEffect, useMemo, useDeferredValue, useCallback, useRef } from 'react';
import type { Resguardo, ActiveFilter, SearchMatchType, Suggestion } from '../types';

export interface UseSearchAndFiltersReturn {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  deferredSearchTerm: string;
  searchMatchType: SearchMatchType | null;
  activeFilters: ActiveFilter[];
  addFilter: (filter: ActiveFilter) => void;
  removeFilter: (index: number) => void;
  suggestions: Suggestion[];
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleBlur: () => void;
  saveCurrentFilter: () => void;
}

/**
 * Hook for managing search and filters for Consultar Resguardos
 */
export function useSearchAndFilters(
  allResguardos: Resguardo[]
): UseSearchAndFiltersReturn {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [searchMatchType, setSearchMatchType] = useState<SearchMatchType | null>(null);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Create a stable reference for allResguardos to prevent unnecessary recalculations
  const allResguardosRef = useRef<Resguardo[]>([]);
  const allResguardosVersion = useRef(0);
  
  useEffect(() => {
    // Check if data actually changed (not just reference)
    const hasChanged = allResguardos.length !== allResguardosRef.current.length ||
      allResguardos.some((r, i) => {
        const prev = allResguardosRef.current[i];
        if (!prev) return true;
        return r.folio !== prev.folio || r.director !== prev.director || r.resguardantes !== prev.resguardantes;
      });
    
    if (hasChanged) {
      allResguardosRef.current = allResguardos;
      allResguardosVersion.current += 1;
    }
  }, [allResguardos]);

  // Pre-calculate searchable vectors - only recalculate when version changes
  const searchableData = useMemo(() => {
    const resguardos = allResguardosRef.current;
    if (!resguardos || resguardos.length === 0) return null;
    
    return {
      folio: resguardos.map((r: Resguardo) => r.folio || '').filter(Boolean),
      director: resguardos.map((r: Resguardo) => r.director || '').filter(Boolean),
      resguardante: resguardos.map((r: Resguardo) => r.resguardantes || '').filter(Boolean),
      fecha: resguardos.map((r: Resguardo) => r.fecha || '').filter(Boolean),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allResguardosVersion.current]);

  // Detect search match type
  useEffect(() => {
    const resguardos = allResguardosRef.current;
    if (!deferredSearchTerm || !resguardos.length) {
      setSearchMatchType(null);
      return;
    }

    const term = deferredSearchTerm.toLowerCase().trim();
    let bestMatch = { type: null, value: '', score: 0 } as { type: SearchMatchType, value: string, score: number };

    const isMatch = (val: string | null | undefined) => val && val.toLowerCase().includes(term);
    const isExact = (val: string | null | undefined) => val && val.toLowerCase() === term;

    for (const item of resguardos) {
      // Director has highest priority
      if (isMatch(item.director)) {
        const exact = isExact(item.director);
        const score = exact ? 6 : 5;
        if (score > bestMatch.score) bestMatch = { type: 'director', value: item.director, score };
      }
      // Folio second priority
      else if (isMatch(item.folio)) {
        const exact = isExact(item.folio);
        const score = exact ? 5 : 4;
        if (score > bestMatch.score) bestMatch = { type: 'folio', value: item.folio, score };
      }
      // Resguardante third priority
      else if (isMatch(item.resguardantes)) {
        const exact = isExact(item.resguardantes);
        const score = exact ? 4 : 3;
        if (score > bestMatch.score) bestMatch = { type: 'resguardante', value: item.resguardantes, score };
      }
      // Fecha lowest priority
      else if (isMatch(item.fecha)) {
        const exact = isExact(item.fecha);
        const score = exact ? 3 : 2;
        if (score > bestMatch.score) bestMatch = { type: 'fecha', value: item.fecha, score };
      }
    }

    setSearchMatchType(bestMatch.type);
  }, [deferredSearchTerm, allResguardosVersion.current]);

  // Generate suggestions
  useEffect(() => {
    if (!deferredSearchTerm || !searchableData) {
      setSuggestions([]);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      return;
    }

    const term = deferredSearchTerm.toLowerCase().trim();
    if (term.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const seen = new Set<string>();
    const fields = [
      { type: 'folio' as SearchMatchType, data: searchableData.folio },
      { type: 'director' as SearchMatchType, data: searchableData.director },
      { type: 'resguardante' as SearchMatchType, data: searchableData.resguardante },
      { type: 'fecha' as SearchMatchType, data: searchableData.fecha },
    ];

    let allSuggestions: Suggestion[] = [];
    let count = 0;
    const maxSuggestions = 10;

    for (const f of fields) {
      if (count >= maxSuggestions) break;
      for (const v of f.data) {
        const vLower = v.toLowerCase();
        if (vLower.includes(term)) {
          const key = f.type + ':' + vLower;
          if (!seen.has(key)) {
            allSuggestions.push({ value: v, type: f.type });
            seen.add(key);
            count++;
            if (count >= maxSuggestions) break;
          }
        }
      }
    }

    allSuggestions.sort((a, b) => {
      const aStarts = a.value.toLowerCase().startsWith(term);
      const bStarts = b.value.toLowerCase().startsWith(term);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });

    setSuggestions(allSuggestions.slice(0, 7));
    setShowSuggestions(allSuggestions.length > 0);
    setHighlightedIndex(allSuggestions.length > 0 ? 0 : -1);
  }, [deferredSearchTerm, searchableData]);

  const addFilter = useCallback((filter: ActiveFilter) => {
    setActiveFilters(prev => [...prev, filter]);
  }, []);

  const removeFilter = useCallback((index: number) => {
    setActiveFilters(prev => prev.filter((_, i) => i !== index));
  }, []);

  const saveCurrentFilter = useCallback(() => {
    if (searchTerm && searchMatchType) {
      setActiveFilters(prev => [...prev, { term: searchTerm, type: searchMatchType }]);
      setSearchTerm('');
      setSearchMatchType(null);
    }
  }, [searchTerm, searchMatchType]);

  const handleSuggestionClick = useCallback((index: number) => {
    const s = suggestions[index];
    if (!s) return;
    setActiveFilters(prev => [...prev, { term: s.value, type: s.type }]);
    setSearchTerm('');
    setSearchMatchType(null);
    setShowSuggestions(false);
  }, [suggestions]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(i => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(i => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleSuggestionClick(highlightedIndex);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [showSuggestions, suggestions, highlightedIndex, handleSuggestionClick]);

  const handleBlur = useCallback(() => {
    setTimeout(() => setShowSuggestions(false), 100);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    deferredSearchTerm,
    searchMatchType,
    activeFilters,
    addFilter,
    removeFilter,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    highlightedIndex,
    setHighlightedIndex,
    handleKeyDown,
    handleBlur,
    saveCurrentFilter,
  };
}
