/**
 * Type definitions for the Levantamiento component
 * 
 * This file contains all TypeScript interfaces and types used across
 * the levantamiento component and its sub-components.
 */

/**
 * Unified inventory item type combining data from INEA, ITEA, and TLAXCALA sources
 */
export interface LevMueble {
  id: string; // UUID
  id_inv: string;
  rubro: string | null;
  descripcion: string | null;
  valor: number | string | null;
  f_adq: string | null;
  formadq: string | null;
  proveedor: string | null;
  factura: string | null;
  ubicacion_es: string | null;
  ubicacion_mu: string | null;
  ubicacion_no: string | null;
  estado: string | null;
  estatus: string | null;
  
  // Relational fields
  id_area: number | null;
  id_directorio: number | null;
  area: { id_area: number; nombre: string } | null;
  directorio: { id_directorio: number; nombre: string; puesto: string } | null;
  
  fechabaja: string | null;
  causadebaja: string | null;
  resguardante: string | null;
  image_path: string | null;
  origen: 'INEA' | 'ITEJPA' | 'TLAXCALA';
  color: string | null;
  colores: { id: string; nombre: string; significado: string | null } | null;
}

/**
 * Message notification type for user feedback
 */
export interface Message {
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
}

/**
 * Area de la organización
 */
export interface Area {
  id_area: number;
  nombre: string;
}

/**
 * Director/Area manager information from directorio table
 */
export interface DirectorioOption {
  id_directorio: number;
  nombre: string;
  puesto: string;
  area: string;
}

/**
 * Active filter applied to the inventory data
 */
export interface ActiveFilter {
  term: string;
  type: 'id' | 'descripcion' | 'area' | 'usufinal' | 'resguardante' | 'rubro' | 'estado' | 'estatus' | 'origen' | 'resguardo' | 'color' | null;
}

/**
 * Autocomplete suggestion for the search bar
 */
export interface Suggestion {
  value: string;
  type: ActiveFilter['type'];
}

/**
 * Type of search match detected
 */
export type SearchMatchType = 'id' | 'descripcion' | 'usufinal' | 'area' | 'resguardante' | 'rubro' | 'estado' | 'estatus' | 'origen' | 'resguardo' | 'color' | null;

/**
 * Searchable data vectors for optimized filtering
 */
export interface SearchableData {
  id: string[];
  area: string[];        // From area.nombre
  usufinal: string[];    // From directorio.nombre
  resguardante: string[];
  descripcion: string[];
  rubro: string[];
  estado: string[];
  estatus: string[];
  origen: string[];      // INEA, ITEA, TLAXCALA
  resguardo: string[];   // "Con resguardo", "Sin resguardo"
  color: string[];       // Color names from ITEJPA items
}

/**
 * Export type for file generation
 */
export type ExportType = 'excel' | 'pdf' | null;

/**
 * Sort direction for table columns
 */
export type SortDirection = 'asc' | 'desc';
