/**
 * Base interface for a resguardo baja item in the table
 */
export interface ResguardoBaja {
  id: number;
  folio_resguardo: string;
  folio_baja: string;
  f_resguardo: string;
  area_resguardo: string | null;
  dir_area: string;
  num_inventario: string;
  descripcion: string;
  rubro: string;
  condicion: string;
  usufinal: string | null;
  puesto: string;
  origen: string;
  selected?: boolean;
}

/**
 * Extended interface with articles for detail view
 */
export interface ResguardoBajaDetalle extends ResguardoBaja {
  articulos: Array<ResguardoBajaArticulo>;
}

/**
 * Individual article in a baja
 */
export interface ResguardoBajaArticulo {
  id: number;
  num_inventario: string;
  descripcion: string;
  rubro: string;
  condicion: string;
  origen: string;
  folio_baja: string;
  usufinal?: string | null;
  area_resguardo?: string | null;
}

/**
 * PDF data structure for baja reports
 */
export interface PdfDataBaja {
  folio_resguardo: string;
  folio_baja: string;
  fecha: string;
  director: string;
  area: string;
  puesto: string;
  resguardante: string;
  articulos: Array<{
    id_inv: string;
    descripcion: string;
    rubro: string;
    estado: string;
    origen?: string | null;
    folio_baja: string;
    resguardante: string;
  }>;
  firmas?: Array<{
    cargo: string;
    nombre: string;
    firma?: string;
    concepto: string;
    puesto: string;
  }>;
}

/**
 * Sort field options
 */
export type SortField = 'id' | 'folio_resguardo' | 'f_resguardo' | 'dir_area';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Delete operation type
 */
export type DeleteType = 'folio' | 'selected' | 'single';

/**
 * Item to delete data structure
 */
export interface ItemToDelete {
  folioResguardo?: string;
  folioBaja?: string;
  articulos?: ResguardoBajaArticulo[];
  singleArticulo?: ResguardoBajaArticulo;
}
