'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTransferMode } from '../../hooks/useTransferMode';
import { useTransferActions } from '../../hooks/useTransferActions';
import { useSession } from '@/hooks/useSession';
import { useIneaStore } from '@/stores/ineaStore';
import { useIteaStore } from '@/stores/iteaStore';
import { useNoListadoStore } from '@/stores/noListadoStore';
import { useResguardosStore } from '@/stores/resguardosStore';
import { TransferHeader } from './TransferHeader';
import { TransferLayout } from './TransferLayout';
import { SourceSelectionPanel } from './SourceSelectionPanel';
import { BienesSelectionPanel } from './BienesSelectionPanel';
import { TransferPreviewPanel } from './TransferPreviewPanel';
import { TransferConfirmationModal } from '../../modals/TransferConfirmationModal';
import { CompletionScreen } from './CompletionScreen';
import type { TransferResult } from '../../types/transfer';

/**
 * TransferMode Component
 * 
 * Main orchestrator component for the asset transfer workflow.
 * Manages the complete transfer process from source selection to completion.
 * 
 * Features:
 * - State management with useTransferMode hook
 * - Transfer execution with useTransferActions hook
 * - Keyboard navigation (Escape to exit)
 * - Animated transitions between states
 * - Dark mode support
 * 
 * Requirements: 1.1, 1.2, 1.4, 1.5, 13.1
 */

interface TransferModeProps {
  directors: Array<{ id_directorio: number; nombre: string; puesto?: string }>;
  areas: Array<{ id_area: number; nombre: string }>;
  directorioAreas: Array<{ id_directorio: number; id_area: number }>;
  onExit: () => void;
}

export function TransferMode({
  directors,
  areas,
  directorioAreas,
  onExit,
}: TransferModeProps) {
  // Hooks
  const transferMode = useTransferMode({ directors, areas, directorioAreas });
  const transferActions = useTransferActions();
  const { user } = useSession();

  // Get bienes from stores
  const ineaMuebles = useIneaStore(state => state.muebles);
  const iteaMuebles = useIteaStore(state => state.muebles);
  const noListadoMuebles = useNoListadoStore(state => state.muebles);

  // Local state for transfer result and view mode
  const [transferResult, setTransferResult] = useState<TransferResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);

  // Handle keyboard navigation (Escape to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && transferMode.mode === 'selecting_source') {
        onExit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [transferMode.mode, onExit]);

  // Handle transfer confirmation
  const handleConfirmTransfer = async () => {
    if (!enhancedPreview || !user) return;

    try {
      let result: TransferResult;

      if (enhancedPreview.transferType === 'complete_area') {
        if (!transferMode.sourceDirector || !transferMode.targetDirector || transferMode.selectedAreas.length === 0) {
          return;
        }

        result = await transferActions.transferCompleteArea(
          transferMode.sourceDirector.id_directorio,
          transferMode.targetDirector.id_directorio,
          transferMode.selectedAreas[0],
          transferMode.targetAreaId,
          user.id
        );
      } else if (enhancedPreview.transferType === 'partial_bienes') {
        if (!transferMode.sourceDirector || !transferMode.targetDirector || !transferMode.targetAreaId) {
          return;
        }

        const bienIds = {
          inea: transferMode.selectedBienes.filter(b => b.source === 'inea').map(b => b.id),
          itea: transferMode.selectedBienes.filter(b => b.source === 'itea').map(b => b.id),
          no_listado: transferMode.selectedBienes.filter(b => b.source === 'no_listado').map(b => b.id),
        };

        result = await transferActions.transferPartialBienes(
          transferMode.sourceDirector.id_directorio,
          transferMode.targetDirector.id_directorio,
          transferMode.targetAreaId,
          bienIds,
          user.id
        );
      } else {
        return;
      }

      setTransferResult(result);

      if (result.success) {
        setShowCompletionScreen(true);
        transferMode.setModeToSuccess();
      }
    } catch {
      // Error is handled by transferActions.error state
    }
  };

  // ============================================================
  // ALL HOOKS MUST BE ABOVE ANY EARLY RETURNS (React rules of hooks)
  // ============================================================

  // Compute bienes for all areas (combined from all stores)
  const allBienes = useMemo(() => {
    const bienes: Array<{
      id: string;
      id_inv: string;
      descripcion: string;
      valor: number;
      id_area: number;
      source: 'inea' | 'itea' | 'no_listado';
    }> = [];

    ineaMuebles.forEach(m => {
      if (m.id_area !== null && m.id_area !== undefined) {
        bienes.push({
          id: String(m.id), // Ensure ID is string (UUID)
          id_inv: m.id_inv,
          descripcion: m.descripcion || '',
          valor: m.valor || 0,
          id_area: m.id_area as number,
          source: 'inea',
        });
      }
    });

    iteaMuebles.forEach(m => {
      if (m.id_area !== null && m.id_area !== undefined) {
        const valorNum = typeof m.valor === 'string' ? parseFloat(m.valor) || 0 : (m.valor || 0);
        bienes.push({
          id: String(m.id), // Ensure ID is string (UUID)
          id_inv: m.id_inv,
          descripcion: m.descripcion || '',
          valor: valorNum,
          id_area: m.id_area,
          source: 'itea',
        });
      }
    });

    noListadoMuebles.forEach(m => {
      if (m.id_area !== null && m.id_area !== undefined) {
        const valorNum = typeof m.valor === 'string' ? parseFloat(m.valor) || 0 : (m.valor || 0);
        bienes.push({
          id: String(m.id), // Ensure ID is string (UUID)
          id_inv: m.id_inv,
          descripcion: m.descripcion || '',
          valor: valorNum,
          id_area: m.id_area,
          source: 'no_listado',
        });
      }
    });

    return bienes;
  }, [ineaMuebles, iteaMuebles, noListadoMuebles]);

  // Compute area stats (bien count and resguardo count per area)
  const areaStatsMap = useMemo(() => {
    const statsMap = new Map<number, { bienCount: number; resguardoCount: number }>();

    allBienes.forEach(bien => {
      const current = statsMap.get(bien.id_area) || { bienCount: 0, resguardoCount: 0 };
      current.bienCount++;
      statsMap.set(bien.id_area, current);
    });

    const resguardos = useResguardosStore.getState().resguardos;
    resguardos.forEach(resguardo => {
      const bien = allBienes.find(b => {
        // Convert resguardo id_mueble to string for comparison (all IDs are UUIDs)
        const resguardoIdMueble = String(resguardo.id_mueble);
        if (resguardo.origen === 'INEA' && b.source === 'inea') return b.id === resguardoIdMueble;
        if (resguardo.origen === 'ITEA' && b.source === 'itea') return b.id === resguardoIdMueble;
        if (resguardo.origen === 'NO_LISTADO' && b.source === 'no_listado') return b.id === resguardoIdMueble;
        return false;
      });

      if (bien) {
        const current = statsMap.get(bien.id_area) || { bienCount: 0, resguardoCount: 0 };
        current.resguardoCount++;
        statsMap.set(bien.id_area, current);
      }
    });

    return statsMap;
  }, [allBienes]);

  // Calculate if all bienes from the selected area are selected
  const allBienesSelected = useMemo(() => {
    if (!transferMode.selectedAreas[0] || transferMode.selectedBienes.length === 0) {
      return false;
    }

    const areaId = transferMode.selectedAreas[0];
    const areaBienes = allBienes.filter(b => b.id_area === areaId);

    if (areaBienes.length === 0) return false;

    return areaBienes.every(bien =>
      transferMode.selectedBienes.some(b => b.id === bien.id && b.source === bien.source)
    );
  }, [transferMode.selectedAreas, transferMode.selectedBienes, allBienes]);

  // Enhanced preview data with allBienesSelected flag
  const enhancedPreview = useMemo(() => {
    if (!transferMode.previewData) return null;

    return {
      ...transferMode.previewData,
      allBienesSelected,
      transferType: (transferMode.previewData.transferType === 'partial_bienes' && allBienesSelected)
        ? 'complete_area' as const
        : transferMode.previewData.transferType,
    };
  }, [transferMode.previewData, allBienesSelected]);

  // Stable reset handler for CompletionScreen
  const handleReset = useCallback(() => {
    setTransferResult(null);
    setShowPreview(false);
    setShowCompletionScreen(false);
    transferMode.reset();
  }, [transferMode]);

  // ============================================================
  // EARLY RETURNS (safe — all hooks have been called above)
  // ============================================================

  if (showCompletionScreen && transferResult) {
    return (
      <CompletionScreen
        bienesTransferred={transferResult.data?.bienesTransferred || 0}
        ineaUpdated={transferResult.data?.ineaUpdated || 0}
        iteaUpdated={transferResult.data?.iteaUpdated || 0}
        noListadoUpdated={transferResult.data?.noListadoUpdated || 0}
        onReset={handleReset}
      />
    );
  }

  // Get source director areas with stats
  const sourceDirectorAreas = transferMode.sourceDirector
    ? directorioAreas
      .filter(da => da.id_directorio === transferMode.sourceDirector!.id_directorio)
      .map(da => {
        const area = areas.find(a => a.id_area === da.id_area);
        if (!area) return null;

        const stats = areaStatsMap.get(area.id_area) || { bienCount: 0, resguardoCount: 0 };
        return {
          id_area: area.id_area,
          nombre: area.nombre,
          bienCount: stats.bienCount,
          resguardoCount: stats.resguardoCount,
        };
      })
      .filter((a): a is { id_area: number; nombre: string; bienCount: number; resguardoCount: number } => a !== null)
    : [];

  // Get target director areas with stats
  const targetDirectorAreas = transferMode.targetDirector
    ? directorioAreas
      .filter(da => da.id_directorio === transferMode.targetDirector!.id_directorio)
      .map(da => {
        const area = areas.find(a => a.id_area === da.id_area);
        if (!area) return null;

        const stats = areaStatsMap.get(area.id_area) || { bienCount: 0, resguardoCount: 0 };
        return {
          id_area: area.id_area,
          nombre: area.nombre,
          bienCount: stats.bienCount,
        };
      })
      .filter((a): a is { id_area: number; nombre: string; bienCount: number } => a !== null)
    : [];

  // Filter out source director from target directors list
  const availableTargetDirectors = transferMode.sourceDirector
    ? directors.filter(d => d.id_directorio !== transferMode.sourceDirector!.id_directorio)
    : directors;

  const handleContinue = () => {
    setShowPreview(true);
  };

  const handleBack = () => {
    setShowPreview(false);
  };

  return (
    <div className="flex flex-col min-h-0">
      {/* Header */}
      <TransferHeader
        onExit={showPreview ? handleBack : onExit}
        showBackButton={showPreview}
      />

      {/* Main Layout */}
      <div className="mt-6">
        <TransferLayout
          leftPanel={
            !showPreview ? (
              <SourceSelectionPanel
                directors={directors}
                selectedDirector={transferMode.sourceDirector}
                areas={sourceDirectorAreas}
                selectedAreas={transferMode.selectedAreas}
                selectedBienes={transferMode.selectedBienes}
                onSelectDirector={transferMode.selectSourceDirector}
                onSelectArea={transferMode.selectArea}
                onDeselectArea={transferMode.deselectArea}
                onSelectBienes={transferMode.selectBienes}
                onDeselectBienes={transferMode.deselectBienes}
                directorioAreas={directorioAreas}
                bienes={allBienes}
              />
            ) : undefined
          }
          centerPanel={
            transferMode.sourceDirector && transferMode.selectedAreas.length > 0 ? (
              <BienesSelectionPanel
                selectedSourceArea={transferMode.selectedAreas[0]}
                bienes={allBienes}
                selectedBienes={transferMode.selectedBienes}
                onSelectBienes={transferMode.selectBienes}
                areaName={
                  sourceDirectorAreas.find(a => a.id_area === transferMode.selectedAreas[0])?.nombre
                }
                onContinue={!showPreview ? handleContinue : undefined}
                showBackButton={false}
                onBack={undefined}
              />
            ) : undefined
          }
          rightPanel={
            showPreview ? (
              <TransferPreviewPanel
                preview={enhancedPreview}
                targetDirectors={availableTargetDirectors}
                selectedTargetDirector={transferMode.targetDirector}
                targetAreas={targetDirectorAreas}
                selectedTargetArea={transferMode.targetAreaId}
                onSelectTargetDirector={transferMode.selectTargetDirector}
                onSelectTargetArea={transferMode.selectTargetArea}
                onConfirm={transferMode.confirmTransfer}
                isValidating={false}
                validationErrors={transferMode.validationErrors}
              />
            ) : undefined
          }
        />
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {transferMode.mode === 'confirming' && enhancedPreview && (
          <TransferConfirmationModal
            show={true}
            preview={enhancedPreview}
            onConfirm={handleConfirmTransfer}
            onCancel={transferMode.cancelTransfer}
            isExecuting={transferActions.isExecuting}
            error={transferActions.error}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
