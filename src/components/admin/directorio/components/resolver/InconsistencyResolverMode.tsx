'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ResolverHeader } from './ResolverHeader';
import { ResolverLayout } from './ResolverLayout';
import { InconsistencyList } from './InconsistencyList';
import { ResolutionPanel } from './ResolutionPanel';
import { CompletionScreen } from './CompletionScreen';
import { DuplicateAreaResolver } from './resolvers/DuplicateAreaResolver';
import { EmptyDirectorResolver } from './resolvers/EmptyDirectorResolver';
import { EmptyAreaResolver } from './resolvers/EmptyAreaResolver';
import { useInconsistencyResolver } from '../../hooks/useInconsistencyResolver';
import { useInconsistencyActions } from '../../hooks/useInconsistencyActions';
import type { InconsistencyWithStats } from '../../types/resolver';

interface InconsistencyResolverModeProps {
  inconsistencies: InconsistencyWithStats[];
  onExit: () => void;
}

export function InconsistencyResolverMode({
  inconsistencies,
  onExit,
}: InconsistencyResolverModeProps) {
  const {
    mode,
    selectedIndex,
    selectedInconsistency,
    pendingInconsistencies,
    pendingCount,
    resolvedCount,
    selectInconsistency,
    markAsResolved,
    nextInconsistency,
  } = useInconsistencyResolver({ inconsistencies });

  const {
    keepOneDirector,
    removeAreaFromDirector,
    deleteDirector,
    deleteArea,
    isExecuting,
    error,
  } = useInconsistencyActions();

  // Store resolution data
  const resolutionDataRef = useRef<any>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode !== 'active') return;

      switch (e.key) {
        case 'Escape':
          onExit();
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (selectedIndex > 0) {
            selectInconsistency(selectedIndex - 1);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (selectedIndex < pendingInconsistencies.length - 1) {
            selectInconsistency(selectedIndex + 1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, selectedIndex, pendingInconsistencies.length, selectInconsistency, onExit]);

  const handleResolve = async () => {
    if (!selectedInconsistency || !resolutionDataRef.current) return;

    try {
      const { type, areaId, directorId } = selectedInconsistency;

      switch (type) {
        case 'duplicate_area':
          if (areaId && resolutionDataRef.current.directorId) {
            await keepOneDirector(areaId, resolutionDataRef.current.directorId);
          }
          break;

        case 'empty_director':
          if (directorId) {
            // Solo hay una opción: eliminar el director completo
            await deleteDirector(directorId);
          }
          break;

        case 'empty_area':
          if (areaId) {
            const { option, directorId: targetDirectorId } = resolutionDataRef.current;
            if (option === 'remove_from_director' && targetDirectorId) {
              await removeAreaFromDirector(areaId, targetDirectorId);
            } else if (option === 'delete_area') {
              await deleteArea(areaId);
            }
            // 'keep' option does nothing
          }
          break;
      }

      // Mark as resolved and move to next
      markAsResolved(selectedInconsistency.id);
      resolutionDataRef.current = null;
    } catch (err) {
      console.error('Error resolving inconsistency:', err);
    }
  };

  const handleSkip = () => {
    resolutionDataRef.current = null;
    nextInconsistency();
  };

  // Render completion screen
  if (mode === 'completing') {
    return (
      <CompletionScreen
        resolvedCount={resolvedCount}
        onExit={onExit}
      />
    );
  }

  return (
    <>
      <ResolverHeader
        pendingCount={pendingCount}
        onExit={onExit}
      />

      <div className="mt-6">
        <ResolverLayout
          leftPanel={
            <InconsistencyList
              inconsistencies={pendingInconsistencies}
              selectedIndex={selectedIndex}
              resolvedIds={new Set()}
              onSelect={selectInconsistency}
            />
          }
          rightPanel={
            <ResolutionPanel
              inconsistency={selectedInconsistency}
              onSkip={handleSkip}
              onResolve={handleResolve}
              isResolving={isExecuting}
              pendingCount={pendingCount}
              inconsistencies={pendingInconsistencies}
            >
              <AnimatePresence mode="wait">
                {selectedInconsistency && (
                  <>
                    {selectedInconsistency.type === 'duplicate_area' && (
                      <DuplicateAreaResolver
                        key={selectedInconsistency.id}
                        inconsistency={selectedInconsistency}
                        onResolve={handleResolve}
                        onSelectionChange={(directorId) => {
                          resolutionDataRef.current = { directorId };
                        }}
                      />
                    )}

                    {selectedInconsistency.type === 'empty_director' && (
                      <EmptyDirectorResolver
                        key={selectedInconsistency.id}
                        inconsistency={selectedInconsistency}
                        onResolve={handleResolve}
                        onSelectionChange={(option) => {
                          resolutionDataRef.current = { option };
                        }}
                      />
                    )}

                    {selectedInconsistency.type === 'empty_area' && (
                      <EmptyAreaResolver
                        key={selectedInconsistency.id}
                        inconsistency={selectedInconsistency}
                        onResolve={handleResolve}
                        onSelectionChange={(option, directorId) => {
                          resolutionDataRef.current = { option, directorId };
                        }}
                      />
                    )}
                  </>
                )}
              </AnimatePresence>
            </ResolutionPanel>
          }
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </>
  );
}
