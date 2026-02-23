'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ResolverHeader } from './ResolverHeader';
import { ResolverLayout } from './ResolverLayout';
import { InconsistencyList } from './InconsistencyList';
import { ResolutionPanel } from './ResolutionPanel';
import { CompletionScreen } from './CompletionScreen';
import { DuplicateAreaResolver } from './resolvers/DuplicateAreaResolver';
import { EmptyDirectorResolver } from './resolvers/EmptyDirectorResolver';
import { EmptyAreaResolver } from './resolvers/EmptyAreaResolver';
import { DuplicateAreaConfirmation } from './resolvers/DuplicateAreaConfirmation';
import { EmptyDirectorConfirmation } from './resolvers/EmptyDirectorConfirmation';
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
  
  // Confirmation mode state
  const [showConfirmation, setShowConfirmation] = useState(false);

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

    // Show confirmation panel instead of executing immediately
    setShowConfirmation(true);
  };

  const handleConfirmResolve = async (additionalData?: any) => {
    if (!selectedInconsistency) return;

    let operationSuccess = false;

    try {
      const { type, id_area, id_directorio } = selectedInconsistency as any;
      const areaId = id_area;
      const directorId = id_directorio;

      switch (type) {
        case 'duplicate_area':
          if (!areaId || !resolutionDataRef.current?.directorId) {
            throw new Error('Faltan datos necesarios para la operación');
          }
          
          await keepOneDirector(areaId, resolutionDataRef.current.directorId);
          operationSuccess = true;
          break;

        case 'empty_director':
          if (!directorId) {
            throw new Error('Falta directorId para la operación');
          }
          
          const emptyDirectorOption = additionalData?.option || 'delete_all';
          const emptyDirectorTargetId = additionalData?.targetDirectorId;
          
          if (emptyDirectorOption === 'delete_all' || emptyDirectorOption === 'keep_areas') {
            await deleteDirector(directorId);
            operationSuccess = true;
          } else if (emptyDirectorOption === 'reassign_areas' && emptyDirectorTargetId) {
            await deleteDirector(directorId, emptyDirectorOption, emptyDirectorTargetId);
            operationSuccess = true;
          } else {
            throw new Error('Opción no válida o faltan datos para la operación');
          }
          break;

        case 'empty_area':
          if (!areaId) {
            throw new Error('Falta areaId para la operación');
          }
          
          const { option: areaOption, directorId: emptyAreaDirectorId } = resolutionDataRef.current || {};
          
          if (areaOption === 'remove_from_director' && emptyAreaDirectorId) {
            await removeAreaFromDirector(areaId, emptyAreaDirectorId);
            operationSuccess = true;
          } else if (areaOption === 'delete_area') {
            await deleteArea(areaId);
            operationSuccess = true;
          } else if (areaOption === 'keep') {
            operationSuccess = true;
          } else {
            throw new Error('Opción no válida o faltan datos para la operación');
          }
          break;

        default:
          throw new Error(`Tipo de inconsistencia no reconocido: ${type}`);
      }

      if (operationSuccess) {
        markAsResolved(selectedInconsistency.id);
        resolutionDataRef.current = null;
        setShowConfirmation(false);
      } else {
        throw new Error('La operación no se completó exitosamente');
      }
    } catch (err) {
      // Error will be displayed via error state
    }
  };

  const handleBackFromConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleSkip = () => {
    resolutionDataRef.current = null;
    setShowConfirmation(false);
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

  // Render confirmation panel (full screen)
  if (showConfirmation && selectedInconsistency) {
    return (
      <>
        <ResolverHeader
          pendingCount={pendingCount}
          onExit={onExit}
        />

        <div className="mt-[1.5vw]">
          {selectedInconsistency.type === 'duplicate_area' && resolutionDataRef.current?.directorId && (
            <DuplicateAreaConfirmation
              inconsistency={selectedInconsistency}
              selectedDirectorId={resolutionDataRef.current.directorId}
              onBack={handleBackFromConfirmation}
              onConfirm={handleConfirmResolve}
            />
          )}

          {selectedInconsistency.type === 'empty_director' && (
            <EmptyDirectorConfirmation
              inconsistency={selectedInconsistency}
              onBack={handleBackFromConfirmation}
              onConfirm={async (option, targetDirectorId) => {
                await handleConfirmResolve({ option, targetDirectorId });
              }}
            />
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-[1vw] bg-red-500/10 border border-red-500/20 rounded-lg" style={{ marginTop: 'clamp(0.75rem, 1vw, 1rem)' }}>
            <p className="text-red-600 dark:text-red-400" style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>{error}</p>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <ResolverHeader
        pendingCount={pendingCount}
        onExit={onExit}
      />

      <div className="mt-[1.5vw]">
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
        <div className="p-[1vw] bg-red-500/10 border border-red-500/20 rounded-lg" style={{ marginTop: 'clamp(0.75rem, 1vw, 1rem)' }}>
          <p className="text-red-600 dark:text-red-400" style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>{error}</p>
        </div>
      )}
    </>
  );
}
