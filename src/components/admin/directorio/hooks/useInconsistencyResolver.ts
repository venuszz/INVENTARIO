import { useState, useCallback, useMemo } from 'react';
import type { ResolverMode, InconsistencyWithStats } from '../types/resolver';

interface UseInconsistencyResolverProps {
  inconsistencies: InconsistencyWithStats[];
}

export function useInconsistencyResolver({ inconsistencies }: UseInconsistencyResolverProps) {
  const [mode, setMode] = useState<ResolverMode>('idle');
  const [selectedIndex, setSelectedIndex] = useState(-1); // -1 = ninguno seleccionado
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  // Filter out resolved inconsistencies
  const pendingInconsistencies = useMemo(
    () => inconsistencies.filter(inc => !resolvedIds.has(inc.id)),
    [inconsistencies, resolvedIds]
  );

  const selectedInconsistency = useMemo(
    () => selectedIndex >= 0 ? (pendingInconsistencies[selectedIndex] || null) : null,
    [pendingInconsistencies, selectedIndex]
  );

  const pendingCount = pendingInconsistencies.length;
  const resolvedCount = resolvedIds.size;

  const enterResolverMode = useCallback(() => {
    setMode('active');
    setSelectedIndex(-1); // Iniciar sin selección
    setResolvedIds(new Set());
  }, []);

  const exitResolverMode = useCallback(() => {
    setMode('idle');
    setSelectedIndex(-1);
    setResolvedIds(new Set());
  }, []);

  const selectInconsistency = useCallback((index: number) => {
    if (index >= 0 && index < pendingInconsistencies.length) {
      setSelectedIndex(index);
    }
  }, [pendingInconsistencies.length]);

  const nextInconsistency = useCallback(() => {
    if (selectedIndex < pendingInconsistencies.length - 1) {
      setSelectedIndex(prev => prev + 1);
    } else if (pendingInconsistencies.length === 0) {
      // All resolved, enter completing mode
      setMode('completing');
    }
  }, [selectedIndex, pendingInconsistencies.length]);

  const previousInconsistency = useCallback(() => {
    if (selectedIndex > 0) {
      setSelectedIndex(prev => prev - 1);
    }
  }, [selectedIndex]);

  const markAsResolved = useCallback((id: string) => {
    setResolvedIds(prev => new Set([...prev, id]));
    
    // Auto-advance to next inconsistency
    setTimeout(() => {
      const newPendingCount = pendingInconsistencies.length - 1;
      
      if (newPendingCount === 0) {
        // All resolved
        setMode('completing');
      } else if (selectedIndex >= newPendingCount) {
        // Was last item, go to previous
        setSelectedIndex(newPendingCount - 1);
      }
      // Otherwise stay at same index (which now shows next item)
    }, 600); // Wait for success animation
  }, [pendingInconsistencies.length, selectedIndex]);

  return {
    mode,
    selectedIndex,
    selectedInconsistency,
    pendingInconsistencies,
    pendingCount,
    resolvedCount,
    enterResolverMode,
    exitResolverMode,
    selectInconsistency,
    nextInconsistency,
    previousInconsistency,
    markAsResolved,
  };
}
