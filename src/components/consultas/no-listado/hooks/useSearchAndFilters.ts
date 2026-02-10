import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { Mueble, ActiveFilter } from '../types';

export function useSearchAndFilters(muebles: Mueble[]) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchMatchType, setSearchMatchType] = useState<ActiveFilter['type']>(null);
    const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
    const [suggestions, setSuggestions] = useState<{ value: string; type: ActiveFilter['type'] }[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [sortField, setSortField] = useState<keyof Mueble>('id_inv');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const deferredSearchTerm = useDeferredValue(searchTerm);

    // Pre-calculate searchable vectors
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
        };
    }, [muebles]);

    // Match type detection
    useEffect(() => {
        if (!deferredSearchTerm || muebles.length === 0) {
            setSearchMatchType(null);
            return;
        }
        const term = deferredSearchTerm.toLowerCase().trim();
        let bestMatch = { type: null, value: '', score: 0 } as { type: ActiveFilter['type'], value: string, score: number };

        for (const item of muebles) {
            if ((item.directorio?.nombre && (item.directorio.nombre.toLowerCase().includes(term))) || (item.resguardante && item.resguardante.toLowerCase().includes(term))) {
                const exact = (item.directorio?.nombre?.toLowerCase() === term) || (item.resguardante?.toLowerCase() === term);
                const score = exact ? 10 : 9;
                if (score > bestMatch.score) bestMatch = { type: 'usufinal', value: item.directorio?.nombre || item.resguardante || '', score };
            }
            else if (item.area?.nombre && item.area.nombre.toLowerCase().includes(term)) {
                const exact = item.area.nombre.toLowerCase() === term;
                const score = exact ? 8 : 7;
                if (score > bestMatch.score) bestMatch = { type: 'area', value: item.area.nombre, score };
            }
            else if (item.id_inv && item.id_inv.toLowerCase().includes(term)) {
                const exact = item.id_inv.toLowerCase() === term;
                const score = exact ? 6 : 5;
                if (score > bestMatch.score) bestMatch = { type: 'id', value: item.id_inv, score };
            }
            else if (item.descripcion && item.descripcion.toLowerCase().includes(term)) {
                const exact = item.descripcion.toLowerCase() === term;
                const score = exact ? 4 : 3;
                if (score > bestMatch.score) bestMatch = { type: 'descripcion', value: item.descripcion, score };
            }

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

    // Filter and sort muebles
    const filteredMueblesOmni = useMemo(() => {
        const term = deferredSearchTerm.toLowerCase().trim();

        if (activeFilters.length === 0 && !term) return muebles;

        return muebles.filter(item => {
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
                    default: return true;
                }
            });

            if (!passesActiveFilters) return false;

            if (!term) return true;

            return (
                (item.id_inv?.toLowerCase() || '').includes(term) ||
                (item.descripcion?.toLowerCase() || '').includes(term) ||
                (item.rubro?.toLowerCase() || '').includes(term) ||
                (item.estado?.toLowerCase() || '').includes(term) ||
                (item.estatus?.toLowerCase() || '').includes(term) ||
                (item.area?.nombre?.toLowerCase() || '').includes(term) ||
                (item.directorio?.nombre?.toLowerCase() || '').includes(term) ||
                (item.resguardante?.toLowerCase() || '').includes(term)
            );
        });
    }, [muebles, activeFilters, deferredSearchTerm]);

    const handleSort = (field: keyof Mueble) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setActiveFilters([]);
        setSearchMatchType(null);
    };

    const saveCurrentFilter = () => {
        if (searchTerm && searchMatchType) {
            setActiveFilters(prev => [...prev, { term: searchTerm, type: searchMatchType }]);
            setSearchTerm('');
            setSearchMatchType(null);
        }
    };

    const removeFilter = (index: number) => {
        setActiveFilters(prev => prev.filter((_, i) => i !== index));
    };

    const clearAllFilters = () => {
        setActiveFilters([]);
        setSearchTerm('');
        setSearchMatchType(null);
    };

    const handleSuggestionClick = (index: number) => {
        const s = suggestions[index];
        if (!s) return;
        setActiveFilters(prev => [...prev, { term: s.value, type: s.type }]);
        setSearchTerm('');
        setSearchMatchType(null);
        setShowSuggestions(false);
    };

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

    const handleInputBlur = () => {
        setTimeout(() => setShowSuggestions(false), 100);
    };

    return {
        searchTerm,
        setSearchTerm,
        searchMatchType,
        setSearchMatchType,
        activeFilters,
        setActiveFilters,
        suggestions,
        highlightedIndex,
        showSuggestions,
        setShowSuggestions,
        sortField,
        sortDirection,
        filteredMueblesOmni,
        handleSort,
        clearFilters,
        saveCurrentFilter,
        removeFilter,
        clearAllFilters,
        handleSuggestionClick,
        handleInputKeyDown,
        handleInputBlur
    };
}
