// ============================================================================
// INDEXATION SYSTEM TYPES
// ============================================================================
// Este archivo contiene todos los tipos TypeScript para el sistema de indexación
// basado en Zustand con soporte de tiempo real y reconexión automática.

import type { LucideIcon } from 'lucide-react';

// ============================================================================
// ESTADOS DE RECONEXIÓN
// ============================================================================

/**
 * Estado del proceso de reconexión de WebSocket
 * - idle: Conexión normal, todo funcionando
 * - reconnecting: Intentando reconectar después de desconexión
 * - reconciling: Reconectado, sincronizando datos perdidos
 * - failed: Falló después de máximo de intentos
 */
export type ReconnectionStatus = 'idle' | 'reconnecting' | 'reconciling' | 'failed';

// ============================================================================
// EVENTOS DE TIEMPO REAL
// ============================================================================

/**
 * Tipos de eventos de PostgreSQL que escuchamos via Supabase Realtime
 */
export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

/**
 * Datos de un evento de tiempo real
 */
export interface RealtimeEvent<T = any> {
  type: RealtimeEventType;
  data: T;
  timestamp?: string;
}

// ============================================================================
// ETAPAS DE INDEXACIÓN
// ============================================================================

/**
 * Etapa individual del proceso de indexación
 * El peso se usa para calcular el progreso total (suma de pesos debe ser 100)
 */
export interface IndexationStage {
  /** Identificador único de la etapa */
  key: string;
  /** Descripción legible para mostrar al usuario */
  label: string;
  /** Peso de la etapa para cálculo de progreso (0-100) */
  weight: number;
}

// ============================================================================
// ESTADO DE INDEXACIÓN DE MÓDULO
// ============================================================================

/**
 * Estado completo de indexación para un módulo específico
 * Este estado se mantiene en el Global Indexation Store
 */
export interface ModuleIndexationState {
  /** Indica si el módulo está completamente indexado */
  isIndexed: boolean;
  /** Indica si la indexación está en progreso */
  isIndexing: boolean;
  /** Porcentaje de progreso (0-100) */
  progress: number;
  /** Descripción de la etapa actual */
  currentStage: string | null;
  /** Mensaje de error si la indexación falló */
  error: string | null;
  /** Estado de la conexión WebSocket */
  realtimeConnected: boolean;
  /** Timestamp de última indexación exitosa */
  lastIndexedAt: string | null;
  /** Timestamp del último evento recibido via realtime */
  lastEventReceivedAt: string | null;
  /** Timestamp de cuando se detectó desconexión */
  disconnectedAt: string | null;
  /** Contador de intentos de reconexión */
  reconnectionAttempts: number;
  /** Estado actual del proceso de reconexión */
  reconnectionStatus: ReconnectionStatus;
  /** Límite máximo de intentos de reconexión */
  maxReconnectionAttempts: number;
}

// ============================================================================
// CONFIGURACIÓN DE MÓDULO
// ============================================================================

/**
 * Configuración completa de un módulo de indexación
 */
export interface ModuleConfig {
  /** Identificador único del módulo */
  key: string;
  /** Nombre legible del módulo */
  name: string;
  /** Nombre de la tabla en Supabase */
  table: string;
  /** Etapas de indexación con pesos */
  stages: IndexationStage[];
  /** Color para efectos visuales (hex) */
  glowColor: string;
  /** Ícono del módulo (componente de Lucide) */
  icon: LucideIcon;
}

// ============================================================================
// EVENT EMITTER
// ============================================================================

/**
 * Callback para eventos del event emitter
 */
export type EventCallback<T = any> = (data: T) => void;

/**
 * Función de cleanup retornada al suscribirse a eventos
 */
export type UnsubscribeFunction = () => void;

// ============================================================================
// EXPONENTIAL BACKOFF
// ============================================================================

/**
 * Configuración para estrategia de exponential backoff
 */
export interface ExponentialBackoffConfig {
  /** Número máximo de intentos */
  maxAttempts: number;
  /** Delay base en milisegundos */
  baseDelay: number;
  /** Delay máximo en milisegundos */
  maxDelay: number;
  /** Multiplicador para cálculo exponencial */
  multiplier: number;
}

// ============================================================================
// DATOS DE MÓDULOS
// ============================================================================

/**
 * Mueble de INEA (tabla: muebles)
 */
export interface MuebleINEA {
  id: number;
  id_inv: string;
  rubro: string | null;
  descripcion: string | null;
  valor: number | null;
  f_adq: string | null;
  formadq: string | null;
  proveedor: string | null;
  factura: string | null;
  ubicacion_es: string | null;
  ubicacion_mu: string | null;
  ubicacion_no: string | null;
  estado: string | null;
  estatus: string | null;
  area: string | null;
  usufinal: string | null;
  fechabaja: string | null;
  causadebaja: string | null;
  resguardante: string | null;
  image_path: string | null;
}

/**
 * Mueble de ITEA (tabla: mueblestlax)
 */
export interface MuebleITEA {
  id: number;
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
  area: string | null;
  usufinal: string | null;
  fechabaja: string | null;
  causadebaja: string | null;
  resguardante: string | null;
  image_path: string | null;
}

/**
 * Mueble de No Listado (tabla: mueblestlaxcala)
 */
export interface MuebleNoListado {
  id: number;
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
  area: string | null;
  usufinal: string | null;
  fechabaja: string | null;
  causadebaja: string | null;
  resguardante?: string | null;
  image_path?: string | null;
}

/**
 * Resguardo (tabla: resguardos)
 */
export interface Resguardo {
  id: number;
  folio: string;
  f_resguardo: string;
  dir_area: string | null;
  area_resguardo: string | null;
  usufinal: string | null;
  num_inventario: string | null;
  descripcion: string | null;
  rubro: string | null;
  condicion: string | null;
  [key: string]: unknown;
}

/**
 * Resguardo Baja (tabla: resguardos_bajas)
 */
export interface ResguardoBaja {
  id: number;
  folio: string;
  f_baja: string;
  motivo: string | null;
  num_inventario: string | null;
  descripcion: string | null;
  [key: string]: unknown;
}

// ============================================================================
// CONTADORES DE DATOS PARA UI
// ============================================================================

/**
 * Contadores de datos para mostrar en IndexationPopover
 */
export interface DataCounts {
  [key: string]: number;
}

// ============================================================================
// PROPS DE COMPONENTES UI
// ============================================================================

/**
 * Props para RealtimeIndicator component
 */
export interface RealtimeIndicatorProps {
  /** Variante visual del indicador */
  variant?: 'minimal' | 'default' | 'detailed';
  /** Estado de conexión */
  isConnected: boolean;
  /** Callback cuando se hace click en reindexar */
  onReindexClick?: () => void;
}

/**
 * Props para IndexationPopover component
 */
export interface IndexationPopoverProps {
  /** Callback para reintentar indexación de un módulo */
  onRetry?: (moduleKey: string) => void;
}
