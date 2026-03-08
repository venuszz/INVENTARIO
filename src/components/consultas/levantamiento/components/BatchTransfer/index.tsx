/**
 * Componente orquestador de transferencia en lote
 * 
 * Este componente se carga de forma lazy solo cuando el usuario
 * activa el modo de transferencia. Debe estar envuelto en TransferModeProvider.
 */

import { useEffect, useCallback, useState } from 'react';
import { useTransferMode } from './TransferModeProvider';
import { useTransferValidation } from './hooks/useTransferValidation';
import useBatchOrigenTransfer from '@/hooks/useBatchOrigenTransfer';
import { TransferFAB } from '../TransferFAB';
import { BatchTransferConfirmationModal } from '../../modals/BatchTransferConfirmationModal';
import { BatchTransferProgressModal } from '../../modals/BatchTransferProgressModal';
import type { LevMueble } from '../../types';
import type { OrigenType } from '@/types/batchOrigenTransfer';

interface BatchTransferProps {
  filteredMuebles: LevMueble[];
  onSuccess: () => void;
  isDarkMode: boolean;
}

export function BatchTransfer({ filteredMuebles, onSuccess, isDarkMode }: BatchTransferProps) {
  console.log('🎯 [Batch Transfer] Componente montado');

  const [activeTransferItems, setActiveTransferItems] = useState<any[]>([]);

  const {
    selectedItems,
    blockedItems,
    setBlockedItems,
    setSelectedItems,
    showConfirmationModal,
    showProgressModal,
    setShowConfirmationModal,
    setShowProgressModal,
    isValidating,
    setIsValidating,
    transferResult,
    setTransferResult,
    setTransferTargetOrigen,
    clearAll,
  } = useTransferMode();

  const { validateItems } = useTransferValidation();

  const {
    transferBatch,
    isTransferring,
    progress,
  } = useBatchOrigenTransfer({
    onSuccess,
    onProgress: (current, total) => {
      console.log(`📊 [Batch Transfer] Progreso: ${current}/${total}`);
    },
  });

  // Adaptar selección cuando cambian los filtros
  useEffect(() => {
    const filteredIds = new Set(filteredMuebles.map(m => m.id));

    // Remover items bloqueados que ya no están en los filtros
    const updated = new Map(blockedItems);
    Array.from(updated.keys()).forEach((id: string) => {
      if (!filteredIds.has(id)) {
        updated.delete(id);
      }
    });

    // Solo actualizar si hay cambios
    if (updated.size !== blockedItems.size) {
      setBlockedItems(updated);
    }
  }, [filteredMuebles, blockedItems, setBlockedItems]);

  // Manejar click en FAB
  const handleFABClick = useCallback(async () => {
    if (selectedItems.size === 0) {
      console.warn('⚠️ [Batch Transfer] No hay items seleccionados');
      return;
    }

    console.log('🚀 [Batch Transfer] Iniciando validación de', selectedItems.size, 'items');
    setIsValidating(true);

    try {
      const selectedMuebles = filteredMuebles.filter(m => selectedItems.has(m.id));
      const { blockedItems: blocked } = validateItems(selectedMuebles);

      setBlockedItems(blocked);
      setShowConfirmationModal(true);
    } catch (error) {
      console.error('❌ [Batch Transfer] Error en validación:', error);
    } finally {
      setIsValidating(false);
    }
  }, [selectedItems, filteredMuebles, validateItems, setIsValidating, setBlockedItems, setShowConfirmationModal]);

  // Manejar cierre de modal de progreso
  const handleProgressClose = useCallback(() => {
    setActiveTransferItems([]);
    clearAll();
  }, [clearAll]);

  // Manejar confirmación de transferencia
  const handleTransferConfirm = useCallback(async (targetOrigen: OrigenType) => {
    setShowConfirmationModal(false);
    setShowProgressModal(true);
    setTransferTargetOrigen(targetOrigen);

    try {
      const selectedMuebles = filteredMuebles.filter(m => selectedItems.has(m.id));

      if (selectedMuebles.length === 0) {
        console.error('❌ [Batch Transfer] No hay items válidos para transferir');
        setShowProgressModal(false);
        return;
      }

      // Snapshot items avoiding real-time updates disappearing elements from modal
      setActiveTransferItems(
        selectedMuebles.map(item => ({
          id: item.id,
          idInventario: item.id_inv,
          descripcion: item.descripcion || '',
          currentOrigen: item.origen as OrigenType,
          status: 'pending' as const
        }))
      );

      const result = await transferBatch(selectedMuebles, targetOrigen);
      setTransferResult(result);

      // Limpiar selección inmediatamente en UI de fondo
      setSelectedItems(new Set());

      console.log('✅ [Batch Transfer] Transferencia completada:', {
        exitosas: result.successful.length,
        fallidas: result.failed.length,
        omitidas: result.skipped.length,
      });

      // Si todo fue exitoso o completado (incluso con errores puntuales),
      // cerramos el modal después de mostrar el resumen por un momento.
      setTimeout(() => {
        handleProgressClose();
      }, 5000); // 5 segundos para ver el resumen antes de cerrar
    } catch (error: any) {
      console.error('❌ [Batch Transfer] Error durante transferencia:', error);
      setShowProgressModal(false);
    }
  }, [
    filteredMuebles,
    selectedItems,
    transferBatch,
    setShowConfirmationModal,
    setShowProgressModal,
    setTransferTargetOrigen,
    setTransferResult,
    setSelectedItems,
    handleProgressClose
  ]);

  // Manejar cancelación
  const handleTransferCancel = useCallback(() => {
    setShowConfirmationModal(false);
  }, [setShowConfirmationModal]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      console.log('🧹 [Batch Transfer] Componente desmontado - limpiando');
    };
  }, []);

  return (
    <>
      {/* FAB flotante */}
      {selectedItems.size > 0 && (
        <TransferFAB
          selectedCount={selectedItems.size}
          onClick={handleFABClick}
          isDarkMode={isDarkMode}
          isLoading={isValidating}
        />
      )}

      {/* Modal de confirmación */}
      <BatchTransferConfirmationModal
        show={showConfirmationModal}
        selectedItems={filteredMuebles.filter(m => selectedItems.has(m.id))}
        blockedItems={blockedItems}
        onConfirm={handleTransferConfirm}
        onCancel={handleTransferCancel}
        isDarkMode={isDarkMode}
      />

      {/* Modal de progreso */}
      <BatchTransferProgressModal
        show={showProgressModal}
        items={transferResult ? [
          ...transferResult.successful,
          ...transferResult.failed,
          ...transferResult.skipped
        ] : activeTransferItems}
        currentIndex={progress.current}
        totalItems={progress.total > 0 ? progress.total : selectedItems.size}
        onClose={handleProgressClose}
        processing={isTransferring}
        isDarkMode={isDarkMode}
      />
    </>
  );
}
