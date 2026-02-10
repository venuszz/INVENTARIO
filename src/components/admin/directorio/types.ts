import type { Directorio, Area, DirectorioArea } from '@/types/admin';

/**
 * Statistics for a resguardante (custodian)
 */
export interface ResguardanteStats {
  resguardos: number;      // Count of active custody documents
  bienesACargo: number;    // Count of goods assigned via key_resguardante
}

/**
 * Extended employee data with computed fields
 */
export interface DirectorioWithStats extends Directorio {
  areas: Area[];           // Resolved areas from N:M relationship
  stats: ResguardanteStats;
}

/**
 * Form data for add/edit operations
 */
export interface DirectorioFormData {
  nombre: string;
  puesto: string;
  selectedAreas: number[]; // Array of area IDs
}

/**
 * Resguardo summary for display in modal
 */
export interface ResguardoSummary {
  id: number;
  folio: string;
  fecha: string;
  bienesCount: number;
  bienes: GoodSummary[];
}

/**
 * Good summary for display in modal
 */
export interface GoodSummary {
  id: string;
  numero_inventario: string | null;
  descripcion: string | null;
  estado_fisico: string | null;
  rubro: string | null;
}

/**
 * Reassignment operation data
 */
export interface ReassignmentData {
  fromResguardanteId: number;
  toResguardanteId: number;
  goodIds: string[];
}

/**
 * Modal state management
 */
export type ModalType = 
  | 'none'
  | 'add'
  | 'edit'
  | 'delete'
  | 'resguardos-active'
  | 'bienes-a-cargo'
  | 'reassignment-confirm'
  | 'future-feature';

export interface ModalState {
  type: ModalType;
  data?: any;
}
