/**
 * Type definitions for Resguardos Crear component
 */

/**
 * Represents an inventory item (mueble) that can be assigned in a resguardo
 */
export interface Mueble {
  id: string;                      // UUID primary key
  id_inv: string | null;           // Inventory number
  descripcion: string | null;      // Item description
  estado: string | null;           // Condition (B/R/M/N)
  estatus: string | null;          // Status (ACTIVO/INACTIVO)
  resguardante: string | null;     // Current custodian
  rubro: string | null;            // Category
  usufinal: string | null;         // Final user/responsible
  area: string | null;             // Area
  origen?: string;                 // Source (INEA/ITEA/TLAXCALA)
  resguardanteAsignado?: string;   // Individual override for resguardante
}

/**
 * Represents a director or manager responsible for an area
 */
export interface Directorio {
  id_directorio: number;           // Primary key
  nombre: string;                  // Director name
  area: string | null;             // Area (deprecated, now N:M)
  puesto: string | null;           // Position/title
}

/**
 * Form state for creating a resguardo
 */
export interface ResguardoForm {
  folio: string;                   // Unique folio identifier
  directorId: string;              // Selected director ID
  area: string;                    // Selected area
  puesto: string;                  // Director position
  resguardante: string;            // Default resguardante for all items
}

/**
 * Signature data for PDF generation
 */
export interface PdfFirma {
  concepto: string;
  nombre: string;
  puesto: string;
  cargo: string;
  firma?: string;
}

/**
 * Data structure for PDF generation
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
 * Represents an active search filter
 */
export interface ActiveFilter {
  term: string;
  type: 'id' | 'descripcion' | 'rubro' | 'estado' | 'estatus' | 'area' | 'usufinal' | 'resguardante' | null;
}

/**
 * Type for search field matching
 */
export type SearchMatchType = 'id' | 'descripcion' | 'rubro' | 'estado' | 'estatus' | 'area' | 'usufinal' | 'resguardante' | null;
