import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import type { Mueble, ActiveFilter } from '../types';

/**
 * Hook para manejar toda la lógica de búsqueda, filtrado y sugerencias
 * @param muebles - Lista completa de muebles ITEA
 * @returns Objeto con estados y funciones de búsqueda/filtrado
 */
export function useSearchAndFilters(muebles: Mueble[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMatchType, setSearchMatchType] = useState<ActiveFilter['type']>(null);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [suggestions, setSuggestions] = useState<{ value: string; type: ActiveFilter['type'] }[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Defer search term to avoid blocking input
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // Pre-calculate searchable vectors to avoid mapping on every keystroke
  const searchableData = useMemo(() => {
    if (!muebles || muebles.length === 0) return null;
    return {
      id: muebles.map(m => m.id_inv || '').filter(Boolean),
      area: muebles.map(m => m.area?.nombre || '').filter(Boolean),
      usufinal: muebles.map(m => m.directorio?.nombre || '').filter(Boolean),
      resguardante: muebles.map(m => m.resguardante || '').filter(Boolean),
      descripcion: muebles.map(m => m.descripcion || '').filter(Boolean),
      rubro: muebles.map(m => m.rubro || '').filter(Boolean),
      estado: muebles.map(m => m.estado || '').filter(Boolean),
      estatus: muebles.map(m => m.estatus || '').filter(Boolean),
      color: muebles.map(m => m.colores?.nombre || '').filter(Boolean),
    };
  }, [muebles]);

  // Detect search match type
  useEffect(() => {
    if (!deferredSearchTerm || muebles.length === 0) {
      setSearchMatchType(null);
      return;
    }

    const term = deferredSearchTerm.toLowerCase().trim();
    let bestMatch = { type: null, value: '', score: 0 } as { type: ActiveFilter['type'], value: string, score: number };

    // Simple iteration without heavy regex
    for (const item of muebles) {
      // Color
      const colorNombre = item.colores?.nombre || '';
      if (colorNombre && colorNombre.toLowerCase().includes(term)) {
        const exact = colorNombre.toLowerCase() === term;
        const score = exact ? 12 : 11;
        if (score > bestMatch.score) bestMatch = { type: 'color', value: colorNombre, score };
      }
      // Usufinal/Resguardante (using relational field)
      const usufinal = item.directorio?.nombre || '';
      const resguardante = item.resguardante || '';
      
      if ((usufinal && usufinal.toLowerCase().includes(term)) || (resguardante && resguardante.toLowerCase().includes(term))) {
        const exact = (usufinal.toLowerCase() === term) || (resguardante.toLowerCase() === term);
        const score = exact ? 10 : 9;
        if (score > bestMatch.score) bestMatch = { type: 'usufinal', value: usufinal || resguardante, score };
      }
      // Area (using relational field)
      else if (item.area?.nombre && item.area.nombre.toLowerCase().includes(term)) {
        const exact = item.area.nombre.toLowerCase() === term;
        const score = exact ? 8 : 7;
        if (score > bestMatch.score) bestMatch = { type: 'area', value: item.area.nombre, score };
      }
      // ID
      else if (item.id_inv && item.id_inv.toLowerCase().includes(term)) {
        const exact = item.id_inv.toLowerCase() === term;
        const score = exact ? 6 : 5;
        if (score > bestMatch.score) bestMatch = { type: 'id', value: item.id_inv, score };
      }
      // Description
      else if (item.descripcion && item.descripcion.toLowerCase().includes(term)) {
        const exact = item.descripcion.toLowerCase() === term;
        const score = exact ? 4 : 3;
        if (score > bestMatch.score) bestMatch = { type: 'descripcion', value: item.descripcion, score };
      }

      // Short-circuit if we found an exact high-priority match
      if (bestMatch.score >= 10) break;
    }

    setSearchMatchType(bestMatch.type);
  }, [deferredSearchTerm, muebles]);

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
      { type: 'color' as ActiveFilter['type'], label: 'Color', data: searchableData.color },
      { type: 'id' as ActiveFilter['type'], label: 'ID', data: searchableData.id },
      { type: 'area' as ActiveFilter['type'], label: 'Área', data: searchableData.area },
      { type: 'usufinal' as ActiveFilter['type'], label: 'Director', data: searchableData.usufinal },
      { type: 'resguardante' as ActiveFilter['type'], label: 'Resguardante', data: searchableData.resguardante },
      { type: 'descripcion' as ActiveFilter['type'], label: 'Descripción', data: searchableData.descripcion },
      { type: 'rubro' as ActiveFilter['type'], label: 'Rubro', data: searchableData.rubro },
      { type: 'estado' as ActiveFilter['type'], label: 'Estado', data: searchableData.estado },
      { type: 'estatus' as ActiveFilter['type'], label: 'Estatus', data: searchableData.estatus },
    ];

    let allSuggestions: { value: string; type: ActiveFilter['type'] }[] = [];
    let count = 0;
    const maxSuggestions = 10;

    // Iterate fields efficiently
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

    // Prioritize exact matches
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

  // Filter muebles
  const filteredMueblesOmni = useMemo(() => {
    const term = deferredSearchTerm.toLowerCase().trim();

    return muebles.filter(item => {
      // Active filters (AND logic)
      if (activeFilters.length === 0 && !term) return true;

      const passesActiveFilters = activeFilters.every(filter => {
        const filterTerm = filter.term.toLowerCase();
        if (!filterTerm) return true;

        switch (filter.type) {
          case 'id': return (item.id_inv?.toLowerCase() || '').includes(filterTerm);
          case 'descripcion': return (item.descripcion?.toLowerCase() || '').includes(filterTerm);
          case 'rubro': return (item.rubro?.toLowerCase() || '').includes(filterTerm);
          case 'estado': return (item.estado?.toLowerCase() || '').includes(filterTerm);
          case 'estatus': return (item.estatus?.toLowerCase() || '').includes(filterTerm);
          case 'area': return (item.area?.nombre?.toLowerCase() || '').includes(filterTerm);
          case 'usufinal': return (item.directorio?.nombre?.toLowerCase() || '').includes(filterTerm);
          case 'resguardante': return (item.resguardante?.toLowerCase() || '').includes(filterTerm);
          case 'color': return (item.colores?.nombre?.toLowerCase() || '').includes(filterTerm);
          default: return true;
        }
      });

      if (!passesActiveFilters) return false;

      // General search (GlobalSearch style)
      if (!term) return true;

      return (
        (item.id_inv?.toLowerCase() || '').includes(term) ||
        (item.descripcion?.toLowerCase() || '').includes(term) ||
        (item.rubro?.toLowerCase() || '').includes(term) ||
        (item.estado?.toLowerCase() || '').includes(term) ||
        (item.estatus?.toLowerCase() || '').includes(term) ||
        (item.area?.nombre?.toLowerCase() || '').includes(term) ||
        (item.directorio?.nombre?.toLowerCase() || '').includes(term) ||
        (item.resguardante?.toLowerCase() || '').includes(term) ||
        (item.colores?.nombre?.toLowerCase() || '').includes(term)
      );
    });
  }, [muebles, activeFilters, deferredSearchTerm]);

  // Save current filter
  const saveCurrentFilter = () => {
    if (searchTerm && searchMatchType) {
      setActiveFilters(prev => [...prev, { term: searchTerm, type: searchMatchType }]);
      setSearchTerm('');
      setSearchMatchType(null);
    }
  };

  // Remove a filter
  const removeFilter = (index: number) => {
    setActiveFilters(prev => prev.filter((_, i) => i !== index));
  };

  // Remove all filters
  const clearAllFilters = () => {
    setActiveFilters([]);
    setSearchTerm('');
    setSearchMatchType(null);
  };

  // Handle suggestion click
  const handleSuggestionClick = (index: number) => {
    const s = suggestions[index];
    if (!s) return;
    setActiveFilters(prev => [...prev, { term: s.value, type: s.type }]);
    setSearchTerm('');
    setSearchMatchType(null);
    setShowSuggestions(false);
  };

  // Handle input key down
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
  };

  // Handle input blur
  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 100);
  };

  return {
    searchTerm,
    setSearchTerm,
    searchMatchType,
    activeFilters,
    suggestions,
    highlightedIndex,
    showSuggestions,
    filteredMueblesOmni,
    saveCurrentFilter,
    removeFilter,
    clearAllFilters,
    handleSuggestionClick,
    handleInputKeyDown,
    handleInputBlur
  };
}
