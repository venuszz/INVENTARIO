/**
 * Type definitions for the Asset Transfer feature (Transferencia de Bienes)
 * 
 * This module defines all TypeScript interfaces and types used in the transfer workflow,
 * including state management, API requests/responses, and UI component props.
 */

/**
 * Transfer mode state machine states
 */
export type TransferMode =
  | 'idle'
  | 'selecting_source'
  | 'selecting_target'
  | 'previewing'
  | 'validating'
  | 'confirming'
  | 'executing'
  | 'success'
  | 'error'
  | 'completing';

/**
 * Type of transfer operation
 */
export type TransferType = 'complete_area' | 'partial_bienes';

/**
 * Source of a bien (asset)
 */
export type BienSource = 'inea' | 'itea' | 'no_listado';

/**
 * Validation error types
 */
export type ValidationErrorType =
  | 'resguardos'
  | 'duplicate_area'
  | 'same_director'
  | 'no_selection'
  | 'no_target_area';

/**
 * Validation error object
 */
export interface ValidationError {
  type: ValidationErrorType;
  message: string;
  details?: any;
}

/**
 * Selected bien for partial transfer
 */
export interface SelectedBien {
  id: string; // UUID string
  id_inv: string;
  descripcion: string;
  valor: number;
  source: BienSource;
  id_area: number;
}

/**
 * Bien preview for display in transfer summary
 */
export interface BienPreview {
  id: string; // UUID string
  id_inv: string;
  descripcion: string;
  valor: number;
  source: BienSource;
  area: string;
}

/**
 * Director with areas for preview
 */
export interface DirectorWithAreas {
  id_directorio: number;
  nombre: string;
  puesto?: string;
  areas: Array<{
    id_area: number;
    nombre: string;
    bienCount?: number;
  }>;
}

/**
 * Transfer preview data shown before confirmation
 */
export interface TransferPreview {
  sourceDirector: DirectorWithAreas;
  targetDirector: DirectorWithAreas;
  bienesToTransfer: BienPreview[];
  totalCount: number;
  totalValue: number;
  affectedResguardos: number;
  transferType: TransferType;
  targetArea?: {
    id_area: number;
    nombre: string;
  };
  allBienesSelected?: boolean; // True if all bienes from the area are selected
}

/**
 * Main transfer mode state
 */
export interface TransferModeState {
  mode: TransferMode;
  sourceDirector: { id_directorio: number; nombre: string; puesto?: string } | null;
  targetDirector: { id_directorio: number; nombre: string; puesto?: string } | null;
  selectedAreas: number[];
  selectedBienes: SelectedBien[];
  transferType: TransferType | null;
  targetAreaId: number | null;
  showConfirmation: boolean;
  isExecuting: boolean;
  error: string | null;
}

/**
 * API Request: Transfer complete area
 */
export interface TransferCompleteAreaRequest {
  action: 'transfer_complete_area';
  sourceDirectorId: number;
  targetDirectorId: number;
  sourceAreaId: number;
  targetAreaId: number | null; // null or -1 = create new area, number = merge to existing
}

/**
 * API Request: Transfer partial bienes
 */
export interface TransferPartialBienesRequest {
  action: 'transfer_partial_bienes';
  sourceDirectorId: number;
  targetDirectorId: number;
  targetAreaId: number;
  bienIds: {
    inea: string[]; // UUID strings
    itea: string[]; // UUID strings
    no_listado: string[]; // UUID strings
  };
}

/**
 * Combined API request type
 */
export type TransferRequest = TransferCompleteAreaRequest | TransferPartialBienesRequest;

/**
 * API Response: Transfer result
 */
export interface TransferResult {
  success: boolean;
  message: string;
  data?: {
    bienesTransferred: number;
    areasUpdated: number;
    ineaUpdated: number;
    iteaUpdated: number;
    noListadoUpdated: number;
  };
  error?: string;
  validationErrors?: ValidationError[];
  rollback?: boolean;
}

/**
 * API Response: Success
 */
export interface TransferSuccessResponse {
  success: true;
  message: string;
  data: {
    bienesTransferred: number;
    areasUpdated: number;
    ineaUpdated: number;
    iteaUpdated: number;
    noListadoUpdated: number;
  };
}

/**
 * API Response: Error
 */
export interface TransferErrorResponse {
  success: false;
  error: string;
  validationErrors?: ValidationError[];
  rollback?: boolean;
  details?: Array<{
    field: string;
    issue: string;
  }>;
}

/**
 * Combined API response type
 */
export type TransferResponse = TransferSuccessResponse | TransferErrorResponse;

/**
 * Transfer log entry
 */
export interface TransferLog {
  timestamp: string;
  userId?: string;
  action?: string;
  sourceDirectorId?: number;
  targetDirectorId?: number;
  bienesTransferred?: number;
  success: boolean;
  error?: string;
}
