// Tipo principal de mueble ITEA (importado desde @/types/indexation)
export type { MuebleITEA as Mueble } from '@/types/indexation';

// Nota: MuebleITEA incluye los campos relacionales:
// - id_area: number | null
// - id_directorio: number | null
// - area: { id_area: number; nombre: string } | null (JOIN)
// - directorio: { id_directorio: number; nombre: string; puesto: string } | null (JOIN)

// Tipo de mensaje
export interface Message {
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
}

// Opciones de filtro
export interface FilterOptions {
  estados: string[];
  estatus: string[];
  areas: string[];
  rubros: string[];
  formasAdq: string[];
  directores: { nombre: string; area: string }[];
}

// Área
export interface Area {
  id_area: number;
  nombre: string;
}

// Directorio
export interface Directorio {
  id_directorio: number;
  nombre: string | null;
  area: string | null;
  puesto: string | null;
}

// Detalle de resguardo
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

// Filtro activo
export interface ActiveFilter {
  term: string;
  type: 'id' | 'descripcion' | 'rubro' | 'estado' | 'estatus' | 'area' | 'usufinal' | 'resguardante' | 'color' | null;
}
