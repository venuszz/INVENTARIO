/**
 * Context Provider para el modo de transferencia en lote
 * 
 * Encapsula todo el estado y lógica de transferencia para mantenerlo
 * aislado del componente principal
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { LevMueble } from '../../types';
import type { OrigenType, BlockReason, BatchTransferResult } from '@/types/batchOrigenTransfer';

interface TransferModeContextValue {
  // Estados de selección
  selectedItems: Set<string>;
  blockedItems: Map<string, BlockReason>;
  setSelectedItems: (items: Set<string>) => void;
  setBlockedItems: (items: Map<string, BlockReason>) => void;
  
  // Estados de modales
  showConfirmationModal: boolean;
  showProgressModal: boolean;
  setShowConfirmationModal: (show: boolean) => void;
  setShowProgressModal: (show: boolean) => void;
  
  // Estados de transferencia
  isValidating: boolean;
  setIsValidating: (validating: boolean) => void;
  transferResult: BatchTransferResult | null;
  setTransferResult: (result: BatchTransferResult | null) => void;
  transferTargetOrigen: OrigenType | null;
  setTransferTargetOrigen: (origen: OrigenType | null) => void;
  
  // Funciones de utilidad
  clearAll: () => void;
  handleItemSelect: (itemId: string) => void;
  handleSelectAll: (filteredMuebles: LevMueble[]) => void;
  isAllSelected: (filteredMuebles: LevMueble[]) => boolean;
}

export const TransferModeContext = createContext<TransferModeContextValue | null>(null);

export function TransferModeProvider({ children }: { children: ReactNode }) {
  // Estados de selección
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [blockedItems, setBlockedItems] = useState<Map<string, BlockReason>>(new Map());
  
  // Estados de modales
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  
  // Estados de transferencia
  const [isValidating, setIsValidating] = useState(false);
  const [transferResult, setTransferResult] = useState<BatchTransferResult | null>(null);
  const [transferTargetOrigen, setTransferTargetOrigen] = useState<OrigenType | null>(null);

  // Limpiar todos los estados
  const clearAll = useCallback(() => {
    console.log('🧹 [Transfer Mode] Limpiando todos los estados');
    setSelectedItems(new Set());
    setBlockedItems(new Map());
    setShowConfirmationModal(false);
    setShowProgressModal(false);
    setIsValidating(false);
    setTransferResult(null);
    setTransferTargetOrigen(null);
  }, []);

  // Manejar selección individual
  const handleItemSelect = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Manejar selección masiva
  const handleSelectAll = useCallback((filteredMuebles: LevMueble[]) => {
    setSelectedItems(prev => {
      const allSelected = filteredMuebles.length > 0 && 
        filteredMuebles.every(item => prev.has(item.id) || blockedItems.has(item.id));
      
      if (allSelected) {
        // Deseleccionar todos
        return new Set();
      } else {
        // Seleccionar todos (excepto bloqueados)
        const newSelection = new Set<string>();
        filteredMuebles.forEach(item => {
          if (!blockedItems.has(item.id)) {
            newSelection.add(item.id);
          }
        });
        return newSelection;
      }
    });
  }, [blockedItems]);

  // Verificar si todos están seleccionados
  const isAllSelected = useCallback((filteredMuebles: LevMueble[]) => {
    return filteredMuebles.length > 0 && 
      filteredMuebles.every(item => selectedItems.has(item.id) || blockedItems.has(item.id));
  }, [selectedItems, blockedItems]);

  const value: TransferModeContextValue = {
    selectedItems,
    blockedItems,
    setSelectedItems,
    setBlockedItems,
    showConfirmationModal,
    showProgressModal,
    setShowConfirmationModal,
    setShowProgressModal,
    isValidating,
    setIsValidating,
    transferResult,
    setTransferResult,
    transferTargetOrigen,
    setTransferTargetOrigen,
    clearAll,
    handleItemSelect,
    handleSelectAll,
    isAllSelected,
  };

  return (
    <TransferModeContext.Provider value={value}>
      {children}
    </TransferModeContext.Provider>
  );
}

export function useTransferMode() {
  const context = useContext(TransferModeContext);
  if (!context) {
    throw new Error('useTransferMode must be used within TransferModeProvider');
  }
  return context;
}
