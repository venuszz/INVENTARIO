// Tipo principal de mueble INEA (importado desde @/types/indexation)
export type { MuebleINEA as Mueble } from '@/types/indexation';

// Nota: MuebleINEA incluye los campos relacionales:
// - id_area: number | null
// - id_directorio: number | null
// - area: { id_area: number; nombre: string } | null (JOIN)
// - directorio: { id_directorio: number; nombre: string; puesto: string } | null (JOIN)

/**
 * Tipo de mensaje para notificaciones
 */
export interface Message {
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
}

/**
 * Opciones de filtro disponibles
 */
export interface FilterOptions {
  estados: string[];
  estatus: string[];
  areas: string[];
  rubros: string[];
  formasAdq: string[];
  directores: { nombre: string; area: string }[];
}

/**
 * Área de la organización
 */
export interface Area {
  id_area: number;
  nombre: string;
}

/**
 * Director o jefe de área
 */
export interface Directorio {
  id_directorio: number;
  nombre: string | null;
  area: string | null;
  puesto: string | null;
}

/**
 * Detalle de un resguardo
 */
export interface ResguardoDetalle {
  folio: string;
  f_resguardo: string;
  area_resguardo: string | null;
  dir_area: string;
  puesto: string;
  origen: string;
  usufinal: string | null;
  descripcion: string;
  rubro: string;
  condicion: string;
  created_by: string;
}

/**
 * Filtro activo en la búsqueda omnibox
 */
export interface ActiveFilter {
  term: string;
  type: 'id' | 'descripcion' | 'rubro' | 'estado' | 'estatus' | 'area' | 'usufinal' | 'resguardante' | null;
}
