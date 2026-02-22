import { useState, useCallback, useMemo } from 'react';
import type {
  TransferMode,
  TransferType,
  TransferModeState,
  TransferPreview,
  SelectedBien,
  ValidationError,
  BienPreview,
  DirectorWithAreas,
} from '../types/transfer';

/**
 * Hook for managing transfer mode state and operations
 * 
 * This hook follows the same pattern as useInconsistencyResolver,
 * providing a state machine for the transfer workflow.
 */

interface UseTransferModeProps {
  directors: Array<{ id_directorio: number; nombre: string; puesto?: string }>;
  areas: Array<{ id_area: number; nombre: string }>;
  directorioAreas: Array<{ id_directorio: number; id_area: number }>;
}

export interface UseTransferModeReturn {
  // State
  mode: TransferMode;
  sourceDirector: { id_directorio: number; nombre: string; puesto?: string } | null;
  targetDirector: { id_directorio: number; nombre: string; puesto?: string } | null;
  selectedAreas: number[];
  selectedBienes: SelectedBien[];
  transferType: TransferType | null;
  targetAreaId: number | null;
  validationErrors: ValidationError[];

  // Preview data
  previewData: TransferPreview | null;

  // Actions
  enterTransferMode: () => void;
  exitTransferMode: () => void;
  selectSourceDirector: (directorId: number) => void;
  selectTargetDirector: (directorId: number) => void;
  selectArea: (areaId: number) => void;
  deselectArea: (areaId: number) => void;
  selectBienes: (bienes: SelectedBien[]) => void;
  deselectBienes: (bienIds: string[]) => void;
  selectTargetArea: (areaId: number) => void;
  validateTransfer: () => Promise<boolean>;
  confirmTransfer: () => void;
  cancelTransfer: () => void;
  reset: () => void;
  setModeToSuccess: () => void;
}

export function useTransferMode({
  directors,
  areas,
  directorioAreas,
}: UseTransferModeProps): UseTransferModeReturn {
  // State
  const [mode, setMode] = useState<TransferMode>('idle');
  const [sourceDirector, setSourceDirector] = useState<{ id_directorio: number; nombre: string; puesto?: string } | null>(null);
  const [targetDirector, setTargetDirector] = useState<{ id_directorio: number; nombre: string; puesto?: string } | null>(null);
  const [selectedAreas, setSelectedAreas] = useState<number[]>([]);
  const [selectedBienes, setSelectedBienes] = useState<SelectedBien[]>([]);
  const [transferType, setTransferType] = useState<TransferType | null>(null);
  const [targetAreaId, setTargetAreaId] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Enter transfer mode
  const enterTransferMode = useCallback(() => {
    setMode('selecting_source');
    setSourceDirector(null);
    setTargetDirector(null);
    setSelectedAreas([]);
    setSelectedBienes([]);
    setTransferType(null);
    setTargetAreaId(null);
    setValidationErrors([]);
  }, []);

  // Exit transfer mode
  const exitTransferMode = useCallback(() => {
    setMode('idle');
    setSourceDirector(null);
    setTargetDirector(null);
    setSelectedAreas([]);
    setSelectedBienes([]);
    setTransferType(null);
    setTargetAreaId(null);
    setValidationErrors([]);
  }, []);

  // Select source director
  const selectSourceDirector = useCallback((directorId: number) => {
    const director = directors.find(d => d.id_directorio === directorId);
    if (!director) return;

    setSourceDirector(director);
    setSelectedAreas([]);
    setSelectedBienes([]);
    setTransferType(null);
    setMode('selecting_source');
  }, [directors]);

  // Select target director
  const selectTargetDirector = useCallback((directorId: number) => {
    const director = directors.find(d => d.id_directorio === directorId);
    if (!director) return;

    setTargetDirector(director);
    setTargetAreaId(null);
    setMode('previewing');
  }, [directors]);

  // Select area (for complete area transfer)
  const selectArea = useCallback((areaId: number) => {
    setSelectedAreas(prev => {
      if (prev.includes(areaId)) return prev;
      return [...prev, areaId];
    });
    setSelectedBienes([]);
    setTransferType('complete_area');
  }, []);

  // Deselect area
  const deselectArea = useCallback((areaId: number) => {
    setSelectedAreas(prev => prev.filter(id => id !== areaId));
    if (selectedAreas.length === 1 && selectedAreas[0] === areaId) {
      setTransferType(null);
    }
  }, [selectedAreas]);

  // Select bienes (for partial transfer)
  const selectBienes = useCallback((bienes: SelectedBien[]) => {
    // Validate that all bienes are from the same area
    if (bienes.length > 0) {
      const firstAreaId = bienes[0].id_area;
      const allSameArea = bienes.every(b => b.id_area === firstAreaId);

      if (!allSameArea) {
        setValidationErrors([{
          type: 'no_selection',
          message: 'All selected bienes must be from the same area',
        }]);
        return;
      }

      // Keep the area selected so the panel stays open
      setSelectedAreas([firstAreaId]);
    }
    // DO NOT clear selectedAreas when bienes.length === 0
    // The panel should stay open even when all bienes are deselected

    setSelectedBienes(bienes);
    setTransferType(bienes.length > 0 ? 'partial_bienes' : null);
  }, []);

  // Deselect bienes
  const deselectBienes = useCallback((bienIds: string[]) => {
    setSelectedBienes(prev => prev.filter(b => !bienIds.includes(b.id)));
    if (selectedBienes.length === bienIds.length) {
      setTransferType(null);
    }
  }, [selectedBienes]);

  // Select target area (for partial transfer)
  const selectTargetArea = useCallback((areaId: number) => {
    setTargetAreaId(areaId);
  }, []);

  // Validate transfer
  const validateTransfer = useCallback(async (): Promise<boolean> => {
    const errors: ValidationError[] = [];

    // Rule 1: Source ≠ Target
    if (sourceDirector && targetDirector && sourceDirector.id_directorio === targetDirector.id_directorio) {
      errors.push({
        type: 'same_director',
        message: 'Source and target directors must be different',
      });
    }

    // Rule 2: Require selection
    if (transferType === 'complete_area' && selectedAreas.length === 0) {
      errors.push({
        type: 'no_selection',
        message: 'At least one area must be selected',
      });
    }

    if (transferType === 'partial_bienes' && selectedBienes.length === 0) {
      errors.push({
        type: 'no_selection',
        message: 'At least one bien must be selected',
      });
    }

    // Rule 3: Require target area for partial transfer
    if (transferType === 'partial_bienes' && !targetAreaId) {
      errors.push({
        type: 'no_target_area',
        message: 'Target area must be selected for partial transfer',
      });
    }

    // Rule 4: Check for duplicate area (complete transfer only)
    if (transferType === 'complete_area' && targetDirector) {
      for (const areaId of selectedAreas) {
        const targetHasArea = directorioAreas.some(
          da => da.id_directorio === targetDirector.id_directorio && da.id_area === areaId
        );

        if (targetHasArea) {
          const area = areas.find(a => a.id_area === areaId);
          errors.push({
            type: 'duplicate_area',
            message: `Target director already has area "${area?.nombre}". Use Inconsistency Resolver.`,
          });
        }
      }
    }

    // TODO: Rule 5: Check for active resguardos (requires API call)
    // This will be implemented when we have the API endpoint

    setValidationErrors(errors);
    return errors.length === 0;
  }, [sourceDirector, targetDirector, selectedAreas, selectedBienes, transferType, targetAreaId, directorioAreas, areas]);

  // Confirm transfer
  const confirmTransfer = useCallback(() => {
    setMode('confirming');
  }, []);

  // Cancel transfer
  const cancelTransfer = useCallback(() => {
    setMode('previewing');
  }, []);

  // Reset to initial state (after successful transfer)
  const reset = useCallback(() => {
    setMode('selecting_source');
    setSourceDirector(null);
    setTargetDirector(null);
    setSelectedAreas([]);
    setSelectedBienes([]);
    setTransferType(null);
    setTargetAreaId(null);
    setValidationErrors([]);
  }, [mode]);

  // Set mode to success (after successful transfer)
  const setModeToSuccess = useCallback(() => {
    setMode('success');
  }, [mode]);

  // Generate preview data
  const previewData = useMemo((): TransferPreview | null => {
    // Need at least source director and transfer type
    if (!sourceDirector || !transferType) return null;

    // Get source director areas
    const sourceAreas = directorioAreas
      .filter(da => da.id_directorio === sourceDirector.id_directorio)
      .map(da => {
        const area = areas.find(a => a.id_area === da.id_area);
        return area ? { id_area: area.id_area, nombre: area.nombre } : null;
      })
      .filter((a): a is { id_area: number; nombre: string } => a !== null);

    // Get target director areas (if target director is selected)
    const targetAreas = targetDirector
      ? directorioAreas
        .filter(da => da.id_directorio === targetDirector.id_directorio)
        .map(da => {
          const area = areas.find(a => a.id_area === da.id_area);
          return area ? { id_area: area.id_area, nombre: area.nombre } : null;
        })
        .filter((a): a is { id_area: number; nombre: string } => a !== null)
      : [];

    // Build bienes preview
    let bienesToTransfer: BienPreview[] = [];
    let totalCount = 0;
    let totalValue = 0;

    if (transferType === 'partial_bienes') {
      bienesToTransfer = selectedBienes.map(b => {
        const area = areas.find(a => a.id_area === b.id_area);
        return {
          id: b.id,
          id_inv: b.id_inv,
          descripcion: b.descripcion,
          valor: b.valor,
          source: b.source,
          area: area?.nombre || 'Unknown',
        };
      });
      totalCount = selectedBienes.length;
      totalValue = selectedBienes.reduce((sum, b) => sum + (b.valor || 0), 0);
    }

    // Get target area for partial transfer
    let targetArea: { id_area: number; nombre: string } | undefined;
    if (transferType === 'partial_bienes' && targetAreaId) {
      const area = areas.find(a => a.id_area === targetAreaId);
      if (area) {
        targetArea = { id_area: area.id_area, nombre: area.nombre };
      }
    }

    // Create preview with or without target director
    return {
      sourceDirector: {
        id_directorio: sourceDirector.id_directorio,
        nombre: sourceDirector.nombre,
        puesto: sourceDirector.puesto,
        areas: sourceAreas,
      },
      targetDirector: targetDirector
        ? {
          id_directorio: targetDirector.id_directorio,
          nombre: targetDirector.nombre,
          puesto: targetDirector.puesto,
          areas: targetAreas,
        }
        : {
          id_directorio: 0,
          nombre: 'Seleccionar destino...',
          puesto: undefined,
          areas: [],
        },
      bienesToTransfer,
      totalCount,
      totalValue,
      affectedResguardos: 0, // TODO: Calculate from API
      transferType,
      targetArea,
    };
  }, [sourceDirector, targetDirector, transferType, selectedAreas, selectedBienes, targetAreaId, directorioAreas, areas]);

  return {
    mode,
    sourceDirector,
    targetDirector,
    selectedAreas,
    selectedBienes,
    transferType,
    targetAreaId,
    validationErrors,
    previewData,
    enterTransferMode,
    exitTransferMode,
    selectSourceDirector,
    selectTargetDirector,
    selectArea,
    deselectArea,
    selectBienes,
    deselectBienes,
    selectTargetArea,
    validateTransfer,
    confirmTransfer,
    cancelTransfer,
    reset,
    setModeToSuccess,
  };
}
