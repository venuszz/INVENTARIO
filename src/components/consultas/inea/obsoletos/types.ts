/**
 * Represents a furniture item in the INEA obsolete inventory
 */
export interface Mueble {
  /** Unique identifier (UUID) */
  id: string;
  /** Inventory ID */
  id_inv: string;
  /** Category/type of item */
  rubro: string | null;
  /** Description of the item */
  descripcion: string | null;
  /** Monetary value */
  valor: number | null;
  /** Acquisition date */
  f_adq: string | null;
  /** Form of acquisition */
  formadq: string | null;
  /** Supplier name */
  proveedor: string | null;
  /** Invoice number */
  factura: string | null;
  /** State location */
  ubicacion_es: string | null;
  /** Municipality location */
  ubicacion_mu: string | null;
  /** Number location */
  ubicacion_no: string | null;
  /** Physical state/condition */
  estado: string | null;
  /** Status (ACTIVO/BAJA) */
  estatus: string | null;
  /** Area/department (relational) */
  area: { id_area: number; nombre: string } | null;
  /** Director information (relational) */
  directorio: { id_directorio: number; nombre: string; puesto: string } | null;
  /** Area ID (foreign key) */
  id_area: number | null;
  /** Director ID (foreign key) */
  id_directorio: number | null;
  /** Final user/director */
  usufinal: string | null;
  /** Date of deprecation */
  fechabaja: string | null;
  /** Reason for deprecation */
  causadebaja: string | null;
  /** Person responsible */
  resguardante: string | null;
  /** Path to item image */
  image_path: string | null;
}

/**
 * Filter options available for the inventory
 */
export interface FilterOptions {
  /** Available states */
  estados: string[];
  /** Available statuses */
  estatus: string[];
  /** Available areas */
  areas: string[];
  /** Available categories */
  rubros: string[];
  /** Available acquisition forms */
  formadq: string[];
  /** Available directors with their areas */
  directores: { nombre: string; areas: string[] }[];
}

/**
 * Current filter state
 */
export interface FilterState {
  /** Selected state filter */
  estado: string;
  /** Selected area filter */
  area: string;
  /** Selected category filter */
  rubro: string;
}

/**
 * Director information from the directory
 */
export interface Directorio {
  /** Director ID */
  id_directorio: number;
  /** Director name */
  nombre: string;
  /** Areas assigned to this director */
  areas: string[];
}

/**
 * Area information
 */
export interface Area {
  /** Area ID */
  id_area: number;
  /** Area name */
  nombre: string;
}

/**
 * Message notification
 */
export interface Message {
  /** Message type */
  type: 'success' | 'error' | 'info' | 'warning';
  /** Message text */
  text: string;
}

/**
 * Props for AnimatedCounter component
 */
export interface AnimatedCounterProps {
  /** Target value to count to */
  value: number;
  /** Additional CSS classes */
  className?: string;
  /** Text to show before the number */
  prefix?: string;
  /** Text to show after the number */
  suffix?: string;
  /** Whether the counter is in loading state */
  loading?: boolean;
  /** Whether to format as integer (no decimals) */
  isInteger?: boolean;
}

/**
 * Information about when and why an item was deprecated
 */
export interface BajaInfo {
  /** User who created the deprecation record */
  created_by: string;
  /** Timestamp of deprecation */
  created_at: string;
  /** Reason for deprecation */
  motive: string;
}

/**
 * Props for ImagePreview component
 */
export interface ImagePreviewProps {
  /** Path to the image in storage */
  imagePath: string | null;
}
