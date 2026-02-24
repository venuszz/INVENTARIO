/**
 * Custom hook for managing search, filters, suggestions, and data filtering
 * 
 * This hook handles all search and filter logic for the levantamiento component,
 * including autocomplete suggestions, active filters, and data filtering/sorting.
 */

import { useState, useMemo, useEffect, useDeferredValue, Dispatch, SetStateAction } from 'react';
import { LevMueble, ActiveFilter, Suggestion, SearchMatchType, SearchableData } from '../types';

/**
 * Hook parameters
 */
interface UseSearchAndFiltersParams {
  muebles: LevMueble[];
  sortField: keyof LevMueble;
  sortDirection: 'asc' | 'desc';
}

/**
 * Hook return interface
 */
interface UseSearchAndFiltersReturn {
  searchTerm: string;
  deferredSearchTerm: string;
  setSearchTerm: (term: string) => void;
  activeFilters: ActiveFilter[];
  setActiveFilters: Dispatch<SetStateAction<ActiveFilter[]>>;
  removeFilter: (index: number) => void;
  suggestions: Suggestion[];
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  highlightedIndex: number;
  setHighlightedIndex: Dispatch<SetStateAction<number>>;
  filteredMuebles: LevMueble[];
  searchMatchType: SearchMatchType | null;
  isCustomPDFEnabled: boolean;
}

/**
 * Custom hook for search and filter management
 * 
 * @param params - Hook parameters
 * @returns Search and filter state and functions
 * 
 * @example
 * const {
 *   searchTerm,
 *   setSearchTerm,
 *   activeFilters,
 *   filteredMuebles
 * } = useSearchAndFilters({
 *   muebles: inventoryData,
 *   sortField: 'id_inv',
 *   sortDirection: 'asc'
 * });
 */
export function useSearchAndFilters({
  muebles,
  sortField,
  sortDirection
}: UseSearchAndFiltersParams): UseSearchAndFiltersReturn {
  
  // Search term state with deferred value for performance
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // Active filters state
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  // Search match type state
  const [searchMatchType, setSearchMatchType] = useState<SearchMatchType | null>(null);

  /**
   * Pre-calculate searchable vectors for optimized filtering
   * Extracts all unique values for each searchable field
   */
  const searchableData = useMemo<SearchableData | null>(() => {
    if (!muebles || muebles.length === 0) return null;
    
    return {
      id: muebles.map(m => m.id_inv || '').filter(Boolean),
      area: muebles.map(m => m.area?.nombre || '').filter(Boolean),
      usufinal: muebles.map(m => m.directorio?.nombre || '').filter(Boolean), // FROM directorio.nombre
      resguardante: muebles.map(m => (m as any).resguardante || '').filter(Boolean),
      descripcion: muebles.map(m => m.descripcion || '').filter(Boolean),
      rubro: muebles.map(m => m.rubro || '').filter(Boolean),
      estado: muebles.map(m => m.estado || '').filter(Boolean),
      estatus: muebles.map(m => m.estatus || '').filter(Boolean),
      origen: ['INEA', 'ITEJPA', 'TLAXCALA'],
      resguardo: ['Con resguardo', 'Sin resguardo'],
      color: Array.from(new Set(muebles.map(m => m.colores?.nombre).filter((c): c is string => !!c))),
    };
  }, [muebles]);

  /**
   * Remove a filter by index
   */
  const removeFilter = (index: number) => {
    setActiveFilters(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Determine if custom PDF export is enabled
   * Requires EXACTLY ONE area filter and EXACTLY ONE usufinal filter with valid values
   */
  const isCustomPDFEnabled = useMemo(() => {
    const areaFilters = activeFilters.filter(f => f.type === 'area');
    const directorFilters = activeFilters.filter(f => f.type === 'usufinal');
    
    // Must have exactly one of each type
    if (areaFilters.length !== 1 || directorFilters.length !== 1) return false;

    const areaFilter = areaFilters[0];
    const directorFilter = directorFilters[0];

    const cleanVal = (v: string) => 
      (v || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

    // Get unique areas and directors from relational data
    const uniqueAreas = Array.from(
      new Set(muebles.map(m => m.area?.nombre).filter((a): a is string => !!a))
    ).map(a => cleanVal(a));
    
    const uniqueDirectores = Array.from(
      new Set(muebles.map(m => m.directorio?.nombre).filter((u): u is string => !!u))
    ).map(u => cleanVal(u));

    const areaIsValid = uniqueAreas.includes(cleanVal(areaFilter.term));
    const directorIsValid = uniqueDirectores.includes(cleanVal(directorFilter.term));

    return areaIsValid && directorIsValid;
  }, [activeFilters, muebles]);

  /**
   * Analyze search term to determine best match type
   * Uses scoring system to prioritize exact matches and high-value fields
   */
  useEffect(() => {
    if (!deferredSearchTerm || !muebles.length) {
      setSearchMatchType(null);
      return;
    }

    const term = deferredSearchTerm.toLowerCase().trim();
    let bestMatch = { 
      type: null as SearchMatchType, 
      value: '', 
      score: 0 
    };

    const isMatch = (val: string | null | undefined) => 
      val && val.toLowerCase().includes(term);
    const isExact = (val: string | null | undefined) => 
      val && val.toLowerCase() === term;

    for (const item of muebles) {
      // ID match (highest priority)
      if (isMatch(item.id_inv)) {
        const exact = isExact(item.id_inv);
        const score = exact ? 6 : 4;
        if (score > bestMatch.score) {
          bestMatch = { type: 'id', value: item.id_inv!, score };
        }
      }
      // Area match (from area.nombre)
      else if (isMatch(item.area?.nombre)) {
        const exact = isExact(item.area?.nombre);
        const score = exact ? 5 : 3;
        if (score > bestMatch.score) {
          bestMatch = { type: 'area', value: item.area!.nombre, score };
        }
      }
      // Usufinal/Resguardante match (from directorio.nombre)
      else if (isMatch(item.directorio?.nombre) || isMatch((item as any).resguardante)) {
        const exact = isExact(item.directorio?.nombre) || isExact((item as any).resguardante);
        const score = exact ? 4 : 2;
        if (score > bestMatch.score) {
          bestMatch = { 
            type: 'usufinal', 
            value: item.directorio?.nombre || (item as any).resguardante || '', 
            score 
          };
        }
      }

      // Early exit if we found a perfect match
      if (bestMatch.score >= 6) break;
    }

    // Fallback to other fields if no high-priority match
    if (!bestMatch.type) {
      for (const item of muebles) {
        if (isMatch(item.descripcion)) {
          setSearchMatchType('descripcion');
          return;
        }
        if (isMatch(item.rubro)) {
          setSearchMatchType('rubro');
          return;
        }
        if (isMatch(item.estado)) {
          setSearchMatchType('estado');
          return;
        }
        if (isMatch(item.estatus)) {
          setSearchMatchType('estatus');
          return;
        }
      }
    } else {
      setSearchMatchType(bestMatch.type);
    }
  }, [deferredSearchTerm, muebles]);

  /**
   * Generate autocomplete suggestions based on search term
   * Limits to 7 suggestions, prioritizes exact matches
   */
  useEffect(() => {
    if (!deferredSearchTerm || !searchableData) {
      setSuggestions([]);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      return;
    }

    const term = deferredSearchTerm.toLowerCase().trim();
    
    // Minimum 2 characters for suggestions
    if (term.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const seen = new Set<string>();
    
    // Priority 1: Origen, Resguardo, and Color (always first)
    const priorityFields = [
      { type: 'origen' as ActiveFilter['type'], data: searchableData.origen },
      { type: 'resguardo' as ActiveFilter['type'], data: searchableData.resguardo },
      { type: 'color' as ActiveFilter['type'], data: searchableData.color },
    ];
    
    // Priority 2: Other fields
    const regularFields = [
      { type: 'id' as ActiveFilter['type'], data: searchableData.id },
      { type: 'area' as ActiveFilter['type'], data: searchableData.area },
      { type: 'usufinal' as ActiveFilter['type'], data: searchableData.usufinal },
      { type: 'descripcion' as ActiveFilter['type'], data: searchableData.descripcion },
      { type: 'rubro' as ActiveFilter['type'], data: searchableData.rubro },
      { type: 'estado' as ActiveFilter['type'], data: searchableData.estado },
      { type: 'estatus' as ActiveFilter['type'], data: searchableData.estatus },
    ];

    let allSuggestions: Suggestion[] = [];
    let count = 0;
    const maxSuggestions = 10;

    // First, collect suggestions from priority fields (origen and resguardo)
    for (const f of priorityFields) {
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

    // Then, collect suggestions from regular fields
    for (const f of regularFields) {
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

    // Sort within each priority group: exact matches first, then starts-with matches
    // But keep priority fields (origen, resguardo) always at the top
    const prioritySuggestions = allSuggestions.filter(s => 
      s.type === 'origen' || s.type === 'resguardo'
    );
    const regularSuggestions = allSuggestions.filter(s => 
      s.type !== 'origen' && s.type !== 'resguardo'
    );

    // Sort each group independently
    const sortByRelevance = (a: Suggestion, b: Suggestion) => {
      const aStarts = a.value.toLowerCase().startsWith(term);
      const bStarts = b.value.toLowerCase().startsWith(term);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    };

    prioritySuggestions.sort(sortByRelevance);
    regularSuggestions.sort(sortByRelevance);

    // Combine: priority suggestions first, then regular suggestions
    const sortedSuggestions = [...prioritySuggestions, ...regularSuggestions];

    // Filter out suggestions that are already in active filters
    const activeFilterValues = new Set(
      activeFilters.map(f => f.term.toLowerCase())
    );
    const filteredSuggestions = sortedSuggestions.filter(
      s => !activeFilterValues.has(s.value.toLowerCase())
    );

    // Limit to 7 suggestions
    const finalSuggestions = filteredSuggestions.slice(0, 7);
    setSuggestions(finalSuggestions);
    setShowSuggestions(finalSuggestions.length > 0);
    setHighlightedIndex(finalSuggestions.length > 0 ? 0 : -1);
  }, [deferredSearchTerm, searchableData, activeFilters]);

  /**
   * Filter and sort muebles based on active filters and search term
   * Uses OR logic within same filter type, AND logic between different types
   */
  const filteredMuebles = useMemo(() => {
    const term = deferredSearchTerm.toLowerCase().trim();
    let result = muebles;
    
    // Apply filters if any are active or search term exists
    if (activeFilters.length > 0 || term) {
      result = muebles.filter(item => {
        // Group filters by type for OR logic within same type
        const filtersByType = activeFilters.reduce((acc, filter) => {
          const type = filter.type || 'unknown';
          if (!acc[type]) acc[type] = [];
          acc[type].push(filter);
          return acc;
        }, {} as Record<string, ActiveFilter[]>);

        // Check active filters: AND between types, OR within same type
        const passesActiveFilters = Object.entries(filtersByType).every(([type, filters]) => {
          // Within same type, item must match at least ONE filter (OR logic)
          return filters.some(filter => {
            const filterTerm = filter.term.toLowerCase();
            if (!filterTerm) return true;

            switch (filter.type) {
              case 'id':
                return (item.id_inv?.toLowerCase() || '').includes(filterTerm);
              case 'descripcion':
                return (item.descripcion?.toLowerCase() || '').includes(filterTerm);
              case 'rubro':
                return (item.rubro?.toLowerCase() || '').includes(filterTerm);
              case 'estado':
                return (item.estado?.toLowerCase() || '').includes(filterTerm);
              case 'estatus':
                return (item.estatus?.toLowerCase() || '').includes(filterTerm);
              case 'area':
                return (item.area?.nombre?.toLowerCase() || '').includes(filterTerm);
              case 'usufinal':
                return (item.directorio?.nombre?.toLowerCase() || '').includes(filterTerm);
              case 'resguardante':
                return ((item as any).resguardante?.toLowerCase() || '').includes(filterTerm);
              case 'origen':
                return (item.origen?.toLowerCase() || '').includes(filterTerm);
              case 'resguardo':
                // Check for "con resguardo" or "sin resguardo"
                if (filterTerm.includes('con') || filterTerm.includes('si')) {
                  // Has resguardo: check if resguardante exists
                  return !!(item as any).resguardante;
                } else if (filterTerm.includes('sin') || filterTerm.includes('no')) {
                  // No resguardo: check if resguardante is empty
                  return !(item as any).resguardante;
                }
                return true;
              case 'color':
                // Filter by color name (only ITEJPA items have colors)
                return (item.colores?.nombre?.toLowerCase() || '').includes(filterTerm);
              default:
                return true;
            }
          });
        });

        if (!passesActiveFilters) return false;

        // Apply general search term
        if (!term) return true;

        return (
          (item.id_inv?.toLowerCase() || '').includes(term) ||
          (item.descripcion?.toLowerCase() || '').includes(term) ||
          (item.area?.nombre?.toLowerCase() || '').includes(term) ||
          (item.directorio?.nombre?.toLowerCase() || '').includes(term) ||
          ((item as any).resguardante?.toLowerCase() || '').includes(term) ||
          (item.rubro?.toLowerCase() || '').includes(term) ||
          (item.estado?.toLowerCase() || '').includes(term) ||
          (item.estatus?.toLowerCase() || '').includes(term) ||
          (item.origen?.toLowerCase() || '').includes(term) ||
          (item.colores?.nombre?.toLowerCase() || '').includes(term)
        );
      });
    }

    // Apply sorting
    return [...result].sort((a, b) => {
      if (!sortField) return 0;
      
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const compareResult = aVal > bVal ? 1 : -1;
      return sortDirection === 'asc' ? compareResult : -compareResult;
    });
  }, [muebles, activeFilters, deferredSearchTerm, sortField, sortDirection]);

  return {
    searchTerm,
    deferredSearchTerm,
    setSearchTerm,
    activeFilters,
    setActiveFilters,
    removeFilter,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    highlightedIndex,
    setHighlightedIndex,
    filteredMuebles,
    searchMatchType,
    isCustomPDFEnabled,
  };
}
