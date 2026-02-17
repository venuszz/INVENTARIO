export interface SearchResult {
    id: string; // UUID
    id_inv: string | null;
    descripcion: string | null;
    rubro: string | null;
    valor: string | null;
    area: string | null;
    estado: string | null;
    estatus: string | null;
    resguardante: string | null;
    origen: 'INEA' | 'ITEA' | 'NO_LISTADO' | 'INEA_OBS' | 'ITEA_OBS' | 'RESGUARDO' | 'RESGUARDO_BAJA' | 'AREA' | 'DIRECTOR';
    // Campos específicos para resguardos
    folio?: string | null;
    folio_resguardo?: string | null;
    folio_baja?: string | null;
    f_resguardo?: string | null;
    f_baja?: string | null;
    dir_area?: string | null;
    area_resguardo?: string | null;
    usufinal?: string | null;
    num_inventario?: string | null;
    condicion?: string | null;
    motivo_baja?: string | null;
    created_by_nombre?: string | null;
    // Campos específicos para áreas y directores
    nombre?: string | null;
    puesto?: string | null;
    areas_asignadas?: string[] | null;
}

export interface SearchResultsByOrigin {
    inea: SearchResult[];
    itea: SearchResult[];
    noListado: SearchResult[];
    ineaObs: SearchResult[];
    iteaObs: SearchResult[];
    resguardos: SearchResult[];
    resguardosBajas: SearchResult[];
    areas: SearchResult[];
    directores: SearchResult[];
}
