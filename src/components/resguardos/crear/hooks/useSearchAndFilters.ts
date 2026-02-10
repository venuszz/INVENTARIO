/**
 * Custom hook for managing omnibox search with suggestions and active filters
 */

import { useState, useEffect, useMemo, useDeferredValue, useCallback, useRef } from 'react';
import type { Mueble, ActiveFilter, SearchMatchType } from '../types';

export interface UseSearchAndFiltersReturn {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  deferredSearchTerm: string;
  searchMatchType: SearchMatchType | null;
  activeFilters: ActiveFilter[];
  addFilter: (filter: ActiveFilter) => void;
  removeFilter: (index: number) => void;
  suggestions: Array<{ value: string; type: SearchMatchType }>;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleBlur: () => void;
  saveCurrentFilter: () => void;
}

/**
 * Hook for managing search and filters
 */
export function useSearchAndFilters(
  allMuebles: Mueble[]
): UseSearchAndFiltersReturn {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [searchMatchType, setSearchMatchType] = useState<SearchMatchType | null>(null);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [suggestions, setSuggestions] = useState<Array<{ value: string; type: SearchMatchType }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Create a stable reference for allMuebles to prevent unnecessary recalculations
  // Only update when the actual data changes, not just the reference
  const allMueblesRef = useRef<Mueble[]>([]);
  const allMueblesVersion = useRef(0);
  
  useEffect(() => {
    // Check if data actually changed (not just reference)
    const hasChanged = allMuebles.length !== allMueblesRef.current.length ||
      allMuebles.some((m, i) => {
        const prev = allMueblesRef.current[i];
        if (!prev) return true;
        // Only check if relational fields changed
        const areaChanged = JSON.stringify(m.area) !== JSON.stringify(prev.area);
        const directorChanged = JSON.stringify(m.directorio) !== JSON.stringify(prev.directorio);
        return areaChanged || directorChanged || m.id !== prev.id;
      });
    
    if (hasChanged) {
      allMueblesRef.current = allMuebles;
      allMueblesVersion.current += 1;
    }
  }, [allMuebles]);

  // Pre-calculate searchable vectors - only recalculate when version changes
  const searchableData = useMemo(() => {
    const muebles = allMueblesRef.current;
    if (!muebles || muebles.length === 0) return null;
    
    // Helper to get string value from relational field
    const getAreaValue = (area: Mueble['area']): string => {
      if (!area) return '';
      return typeof area === 'object' ? area.nombre : area;
    };
    
    const getDirectorValue = (directorio: Mueble['directorio']): string => {
      if (!directorio) return '';
      return typeof directorio === 'object' ? directorio.nombre : '';
    };
    
    return {
      id: muebles.map((m: Mueble) => m.id_inv || '').filter(Boolean),
      area: muebles.map((m: Mueble) => getAreaValue(m.area)).filter(Boolean),
      director: muebles.map((m: Mueble) => getDirectorValue(m.directorio)).filter(Boolean),
      descripcion: muebles.map((m: Mueble) => m.descripcion || '').filter(Boolean),
      rubro: muebles.map((m: Mueble) => m.rubro || '').filter(Boolean),
      estado: muebles.map((m: Mueble) => m.estado || '').filter(Boolean),
      estatus: muebles.map((m: Mueble) => m.estatus || '').filter(Boolean),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMueblesVersion.current]);

  // Detect search match type
  useEffect(() => {
    const muebles = allMueblesRef.current;
    if (!deferredSearchTerm || !muebles.length) {
      setSearchMatchType(null);
      return;
    }

    const term = deferredSearchTerm.toLowerCase().trim();
    let bestMatch = { type: null, value: '', score: 0 } as { type: SearchMatchType, value: string, score: number };

    // Helper to get string value from relational field
    const getAreaValue = (area: Mueble['area']): string => {
      if (!area) return '';
      return typeof area === 'object' ? area.nombre : area;
    };
    
    const getDirectorValue = (directorio: Mueble['directorio']): string => {
      if (!directorio) return '';
      return typeof directorio === 'object' ? directorio.nombre : '';
    };

    const isMatch = (val: string | null | undefined) => val && val.toLowerCase().includes(term);
    const isExact = (val: string | null | undefined) => val && val.toLowerCase() === term;

    for (const item of muebles) {
      const directorValue = getDirectorValue(item.directorio);
      const areaValue = getAreaValue(item.area);
      
      if (isMatch(directorValue)) {
        const exact = isExact(directorValue);
        const score = exact ? 6 : 5;
        if (score > bestMatch.score) bestMatch = { type: 'director', value: directorValue, score };
      }
      else if (isMatch(areaValue)) {
        const exact = isExact(areaValue);
        const score = exact ? 5 : 4;
        if (score > bestMatch.score) bestMatch = { type: 'area', value: areaValue, score };
      }
      else if (isMatch(item.id_inv)) {
        const exact = isExact(item.id_inv);
        const score = exact ? 4 : 3;
        if (score > bestMatch.score) bestMatch = { type: 'id', value: item.id_inv!, score };
      }
      else if (isMatch(item.descripcion)) {
        const exact = isExact(item.descripcion);
        const score = exact ? 3 : 2;
        if (score > bestMatch.score) bestMatch = { type: 'descripcion', value: item.descripcion!, score };
      }
    }

    setSearchMatchType(bestMatch.type);
  }, [deferredSearchTerm, allMueblesVersion.current]);

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
      { type: 'id' as SearchMatchType, data: searchableData.id },
      { type: 'area' as SearchMatchType, data: searchableData.area },
      { type: 'director' as SearchMatchType, data: searchableData.director },
      { type: 'descripcion' as SearchMatchType, data: searchableData.descripcion },
      { type: 'rubro' as SearchMatchType, data: searchableData.rubro },
      { type: 'estado' as SearchMatchType, data: searchableData.estado },
      { type: 'estatus' as SearchMatchType, data: searchableData.estatus },
    ];

    let allSuggestions: { value: string; type: SearchMatchType }[] = [];
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
