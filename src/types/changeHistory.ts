// Types for change history tracking across all inventory modules

export type TablaOrigen = 'muebles' | 'mueblesitea' | 'mueblestlaxcala';

export type TipoCambio = 'edicion' | 'creacion' | 'eliminacion';

export interface CambioInventario {
  id: string;
  id_mueble: string; // UUID del bien
  tabla_origen: TablaOrigen;
  campo_modificado: string;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  usuario_id: string;
  fecha_cambio: string;
  metadata?: {
    campo_display?: string;
    tipo_cambio?: TipoCambio;
    contexto_adicional?: Record<string, any>;
  };
  usuario?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface ChangeHistoryEntry {
  campo: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
  campoDisplay?: string;
}

export interface RegistrarCambiosParams {
  idMueble: string; // UUID del bien
  tablaOrigen: TablaOrigen;
  cambios: ChangeHistoryEntry[];
  razonCambio?: string;
}
