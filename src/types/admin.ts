// ============================================================================
// ADMIN TYPES
// ============================================================================
// Tipos para las tablas administrativas

export interface Directorio {
    id_directorio: number;
    nombre: string | null;
    area: string | null;
    puesto: string | null;
}

export interface Area {
    id_area: number;
    nombre: string;
}

export interface DirectorioArea {
    id: number;
    id_directorio: number;
    id_area: number;
}

export interface ConfigItem {
    id: number;
    tipo: string;
    concepto: string;
}

export interface Firma {
    id: number;
    concepto: string;
    nombre: string | null;
    puesto: string | null;
}
