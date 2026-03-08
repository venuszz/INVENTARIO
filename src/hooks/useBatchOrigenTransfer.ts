/**
 * Custom hook for batch origen transfer operations
 * 
 * Manages the complete lifecycle of batch transfers including:
 * - Pre-transfer validation
 * - Sequential processing
 * - Progress tracking
 * - Error handling
 * - Audit trail creation
 */

import { useState, useCallback } from 'react';
import supabase from '@/app/lib/supabase/client';
import {
  OrigenType,
  BlockReason,
  ValidationResult,
  BatchTransferResult,
  TransferProgress,
  TransferItem,
} from '@/types/batchOrigenTransfer';
import { LevMueble } from '@/components/consultas/levantamiento/types';

interface UseBatchOrigenTransferParams {
  onSuccess?: () => void;
  onProgress?: (current: number, total: number) => void;
}

interface UseBatchOrigenTransferReturn {
  transferBatch: (
    items: LevMueble[],
    targetOrigen: OrigenType
  ) => Promise<BatchTransferResult>;
  validateItems: (items: LevMueble[]) => Promise<ValidationResult>;
  isTransferring: boolean;
  progress: TransferProgress;
  cancelTransfer: () => void;
}

// Map OrigenType to table names
const ORIGEN_TO_TABLE: Record<OrigenType, string> = {
  'INEA': 'muebles',
  'ITEJPA': 'mueblesitea',
  'TLAXCALA': 'mueblestlaxcala',
};

// Map OrigenType to internal hook format
const ORIGEN_TO_HOOK_FORMAT: Record<OrigenType, 'inea' | 'itea' | 'no-listado'> = {
  'INEA': 'inea',
  'ITEJPA': 'itea',
  'TLAXCALA': 'no-listado',
};

// Map internal format to table names (matches useOrigenTransfer's TABLE_MAP)
const TABLE_MAP: Record<string, string> = {
  'inea': 'muebles',
  'itea': 'mueblesitea',
  'no-listado': 'mueblestlaxcala',
};

/**
 * Perform a single item transfer directly (non-hook version of useOrigenTransfer logic).
 * This is a plain async function, safe to call inside loops and callbacks.
 */
async function transferSingleItem(
  recordId: string,
  idInventario: string,
  currentOrigen: 'inea' | 'itea' | 'no-listado',
  targetOrigen: 'inea' | 'itea' | 'no-listado'
): Promise<void> {
  const sourceTable = TABLE_MAP[currentOrigen];
  const destTable = TABLE_MAP[targetOrigen];

  // 1. Check for active resguardo
  const { data: resguardos } = await supabase
    .from('resguardos')
    .select('id')
    .eq('id_mueble', recordId)
    .limit(1);

  if (resguardos && resguardos.length > 0) {
    throw new Error('No se puede transferir: el registro tiene un resguardo activo');
  }

  // 2. Read source record
  const { data: sourceRecord, error: selectError } = await supabase
    .from(sourceTable)
    .select('*')
    .eq('id', recordId)
    .single();

  if (selectError || !sourceRecord) {
    console.error('Error reading source record:', selectError);
    throw new Error('No se pudo leer el registro origen');
  }

  // 3. Check for duplicate in destination
  const { data: duplicateCheck } = await supabase
    .from(destTable)
    .select('id')
    .eq('id_inv', idInventario)
    .limit(1);

  if (duplicateCheck && duplicateCheck.length > 0) {
    throw new Error('El ID de inventario ya existe en la tabla destino');
  }

  // 4. Prepare data for insertion (exclude id, created_at, updated_at)
  const { id, created_at, updated_at, ...recordData } = sourceRecord;

  // If transferring from ITEA, remove 'color' field (exclusive to ITEA)
  if (currentOrigen === 'itea' && 'color' in recordData) {
    delete (recordData as any).color;
    console.log('[transferSingleItem] Campo "color" eliminado (exclusivo de ITEA)');
  }

  // Sanitize: convert empty strings to null to avoid
  // "invalid input syntax for type numeric" errors in PostgreSQL
  const sanitizedData = Object.fromEntries(
    Object.entries(recordData).map(([key, value]) => [
      key,
      value === '' ? null : value,
    ])
  );

  // 5. Insert into destination table via supabase-proxy
  const insertResponse = await fetch(
    '/api/supabase-proxy?target=' + encodeURIComponent(`/rest/v1/${destTable}`),
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(sanitizedData),
    }
  );

  if (!insertResponse.ok) {
    const error = await insertResponse.json();
    throw new Error(error.message || 'Error al insertar en tabla destino');
  }

  // 6. Delete from source table via supabase-proxy
  const deleteResponse = await fetch(
    '/api/supabase-proxy?target=' + encodeURIComponent(`/rest/v1/${sourceTable}?id=eq.${recordId}`),
    {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
    }
  );

  if (!deleteResponse.ok) {
    const error = await deleteResponse.json();
    throw new Error(error.message || 'Error al eliminar de tabla origen');
  }

  console.log('[transferSingleItem] ✓ Transfer exitoso para:', recordId);
}

export default function useBatchOrigenTransfer({
  onSuccess,
  onProgress,
}: UseBatchOrigenTransferParams): UseBatchOrigenTransferReturn {
  const [isTransferring, setIsTransferring] = useState(false);
  const [progress, setProgress] = useState<TransferProgress>({
    current: 0,
    total: 0,
    currentItem: null,
  });
  const [shouldCancel, setShouldCancel] = useState(false);

  /**
   * Validate items before transfer
   * 
   * NOTE: This function is deprecated and should not be used.
   * Use useTransferValidation hook instead for optimized validation.
   * 
   * @deprecated Use useTransferValidation hook from BatchTransfer component
   */
  const validateItems = useCallback(
    async (items: LevMueble[]): Promise<ValidationResult> => {
      console.warn('⚠️ [BATCH TRANSFER] validateItems is deprecated. Use useTransferValidation hook instead.');

      // Return empty validation - actual validation happens in useTransferValidation
      return {
        validItems: items,
        blockedItems: new Map(),
      };
    },
    []
  );

  /**
   * Transfer a batch of items sequentially.
   * Uses inlined transfer logic (not hooks) so it's safe to call in loops/callbacks.
   */
  const transferBatch = useCallback(
    async (
      items: LevMueble[],
      targetOrigen: OrigenType
    ): Promise<BatchTransferResult> => {
      setIsTransferring(true);
      setShouldCancel(false);

      const result: BatchTransferResult = {
        successful: [],
        failed: [],
        skipped: [],
        totalProcessed: 0,
      };

      // Validate items first
      const { validItems, blockedItems } = await validateItems(items);

      // Add blocked items to skipped
      items.forEach(item => {
        if (blockedItems.has(item.id)) {
          result.skipped.push({
            id: item.id,
            idInventario: item.id_inv,
            descripcion: item.descripcion || '',
            currentOrigen: item.origen as OrigenType,
            status: 'skipped',
            reason: blockedItems.get(item.id),
          });
        }
      });

      setProgress({
        current: 0,
        total: validItems.length,
        currentItem: null,
      });

      // Process each valid item sequentially
      for (let i = 0; i < validItems.length; i++) {
        if (shouldCancel) {
          console.log('Transfer cancelled by user');
          break;
        }

        const item = validItems[i];

        setProgress({
          current: i + 1,
          total: validItems.length,
          currentItem: item,
        });

        onProgress?.(i + 1, validItems.length);

        try {
          // Get the origen formats for table mapping
          const currentOrigenFormat = ORIGEN_TO_HOOK_FORMAT[item.origen as OrigenType];
          const targetOrigenFormat = ORIGEN_TO_HOOK_FORMAT[targetOrigen];

          // Use the plain async function (NOT a hook) to transfer
          await transferSingleItem(
            item.id,
            item.id_inv,
            currentOrigenFormat,
            targetOrigenFormat
          );

          result.successful.push({
            id: item.id,
            idInventario: item.id_inv,
            descripcion: item.descripcion || '',
            currentOrigen: item.origen as OrigenType,
            status: 'success',
          });
        } catch (error: any) {
          console.error('Error transferring item:', error);
          result.failed.push({
            id: item.id,
            idInventario: item.id_inv,
            descripcion: item.descripcion || '',
            currentOrigen: item.origen as OrigenType,
            status: 'failed',
            error: error.message || 'Error desconocido',
          });
        }

        result.totalProcessed++;

        // Add delay between transfers to prevent API overload
        if (i < validItems.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setIsTransferring(false);
      // We don't reset progress to 0 here because the UI needs to see 100% completion state
      setProgress(prev => ({
        ...prev,
        currentItem: null,
      }));

      if (onSuccess && result.successful.length > 0) {
        onSuccess();
      }

      return result;
    },
    [validateItems, onSuccess, onProgress, shouldCancel]
  );

  /**
   * Cancel ongoing transfer
   */
  const cancelTransfer = useCallback(() => {
    setShouldCancel(true);
  }, []);

  return {
    transferBatch,
    validateItems,
    isTransferring,
    progress,
    cancelTransfer,
  };
}
