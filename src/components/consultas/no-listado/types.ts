export interface Mueble {
    id: string; // UUID
    id_inv: string;
    rubro: string | null;
    descripcion: string | null;
    valor: string | null;
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
    
    // Nested objects from JOINs
    area: { id_area: number; nombre: string } | null;
    directorio: { id_directorio: number; nombre: string; puesto: string } | null;
    
    fechabaja: string | null;
    causadebaja: string | null;
    resguardante?: string | null;
    image_path?: string | null;
}

export interface FilterOptions {
    estados: string[];
    estatus: string[];
    areas: string[];
    rubros: string[] | null;
    formadq: string[] | null;
    directores: { nombre: string }[];
}

export interface Area {
    id_area: number;
    nombre: string;
}

export interface Directorio {
    id_directorio: number;
    nombre: string;
    puesto: string | null;
}

export interface DirectorioArea {
    id: string; // UUID
    id_directorio: number;
    id_area: number;
}

export interface Message {
    type: 'success' | 'error' | 'info' | 'warning';
    text: string;
}

export interface ActiveFilter {
    term: string;
    type: 'id' | 'descripcion' | 'rubro' | 'estado' | 'estatus' | 'area' | 'usufinal' | 'resguardante' | null;
}

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

export interface BadgeColors {
    bg: string;
    border: string;
    text: string;
    style: Record<string, string>;
}
