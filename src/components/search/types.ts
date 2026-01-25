export interface SearchResult {
    id: number;
    id_inv: string | null;
    descripcion: string | null;
    rubro: string | null;
    valor: string | null;
    area: string | null;
    estado: string | null;
    estatus: string | null;
    resguardante: string | null;
    origen: 'INEA' | 'ITEA' | 'INEA_OBS' | 'ITEA_OBS' | 'RESGUARDO' | 'RESGUARDO_BAJA';
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
}

export interface SearchResultsByOrigin {
    inea: SearchResult[];
    itea: SearchResult[];
    ineaObs: SearchResult[];
    iteaObs: SearchResult[];
    resguardos: SearchResult[];
    resguardosBajas: SearchResult[];
}
