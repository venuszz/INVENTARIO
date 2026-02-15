/**
 * TypeScript interfaces for Consultar Resguardos component
 */

/**
 * Resguardo - Grouped resguardo record
 */
export interface Resguardo {
  folio: string;
  fecha: string;
  director: string;
  area: string;
  resguardantes: string; // Comma-separated resguardantes
  articulosCount: number;
}

/**
 * ResguardoDetalle - Detailed resguardo information
 */
export interface ResguardoDetalle {
  folio: string;
  fecha: string;
  director: string;
}

/**
 * ResguardoArticulo - Article within a resguardo
 */
export interface ResguardoArticulo {
  id: number; // ID from resguardos table
  num_inventario: string;
  descripcion: string;
  rubro: string;
  condicion: string;
  origen: string; // INEA or ITEA
  resguardante?: string;
}

/**
 * PdfFirma - Signature data for PDF generation
 */
export interface PdfFirma {
  concepto: string;
  nombre: string;
  puesto: string;
  cargo: string;
  firma?: string;
}

/**
 * PdfData - Data structure for resguardo PDF generation
 */
export interface PdfData {
  folio: string;
  fecha: string;
  director: string | undefined;
  area: string;
  puesto: string;
  resguardante: string;
  articulos: Array<{
    id_inv: string | null;
    descripcion: string | null;
    rubro: string | null;
    estado: string | null;
    origen?: string | null;
    resguardante: string;
  }>;
  firmas?: PdfFirma[];
}

/**
 * PdfDataBaja - Data structure for baja PDF generation
 */
export interface PdfDataBaja {
  folioBaja: string;
  folioOriginal: string;
  fecha: string;
  director: string | undefined;
  area: string;
  puesto: string;
  resguardante: string;
  articulos: Array<{
    id_inv: string | null;
    descripcion: string | null;
    rubro: string | null;
    estado: string | null;
    origen?: string | null;
    resguardante: string;
  }>;
  firmas?: PdfFirma[];
}

/**
 * SearchMatchType - Field types for unified search
 */
export type SearchMatchType = 'folio' | 'director' | 'resguardante' | 'fecha' | null;

/**
 * ActiveFilter - Represents an active search filter
 */
export interface ActiveFilter {
  term: string;
  type: SearchMatchType | null;
}

/**
 * Suggestion - Represents an autocomplete suggestion
 */
export interface Suggestion {
  value: string;
  type: SearchMatchType | null;
}
