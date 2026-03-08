/**
 * Type definitions for Batch Origen Transfer feature
 * 
 * This file contains all TypeScript interfaces and types used for the batch
 * origen transfer functionality in the Levantamiento module.
 */

import { LevMueble } from '@/components/consultas/levantamiento/types';

/**
 * Origen type for inventory items
 */
export type OrigenType = 'INEA' | 'ITEJPA' | 'TLAXCALA';

/**
 * Reason why an item cannot be transferred
 */
export type BlockReason =
  | 'resguardo_activo'
  | 'estatus_baja'
  | 'insufficient_permissions'
  | 'validation_error';

/**
 * Human-readable messages for block reasons
 */
export const BLOCK_REASON_MESSAGES: Record<BlockReason, string> = {
  resguardo_activo: 'Tiene resguardo activo',
  estatus_baja: 'Estatus BAJA',
  insufficient_permissions: 'Sin permisos',
  validation_error: 'Error de validación',
};

/**
 * Transfer mode state
 */
export interface TransferModeState {
  active: boolean;
  selectedItems: Set<string>; // Set of item IDs
  blockedItems: Map<string, BlockReason>; // itemId -> block reason
  targetOrigen: OrigenType | null;
}

/**
 * Status of an item during transfer processing
 */
export type TransferItemStatus = 'pending' | 'processing' | 'success' | 'failed' | 'skipped';

/**
 * Item being transferred with its status
 */
export interface TransferItem {
  id: string;
  idInventario: string;
  descripcion: string;
  currentOrigen: OrigenType;
  status: TransferItemStatus;
  error?: string;
  reason?: string; // For skipped items
}

/**
 * Validation result for a set of items
 */
export interface ValidationResult {
  validItems: LevMueble[];
  blockedItems: Map<string, BlockReason>; // itemId -> reason
}

/**
 * Result of a batch transfer operation
 */
export interface BatchTransferResult {
  successful: TransferItem[];
  failed: TransferItem[];
  skipped: TransferItem[];
  totalProcessed: number;
}

/**
 * Progress tracking during transfer
 */
export interface TransferProgress {
  current: number;
  total: number;
  currentItem: LevMueble | null;
}

/**
 * Report item for download
 */
export interface ReportItem {
  idInventario: string;
  descripcion: string;
  origenAnterior: OrigenType;
  origenNuevo?: OrigenType;
  error?: string;
  reason?: string;
}

/**
 * Complete transfer report data
 */
export interface TransferReport {
  timestamp: string;
  userId: string;
  userName: string;
  targetOrigen: OrigenType;
  summary: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
  };
  items: {
    successful: ReportItem[];
    failed: ReportItem[];
    skipped: ReportItem[];
  };
}
