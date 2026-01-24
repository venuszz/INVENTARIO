// ============================================================================
// MODULE CONFIGURATIONS
// ============================================================================
// Configuración centralizada de todos los módulos de indexación.
// Define etapas, pesos, colores y metadatos para cada módulo.

import { Database, FileText, Package, FolderArchive } from 'lucide-react';
import type { ModuleConfig } from '@/types/indexation';

// ============================================================================
// CONFIGURACIONES DE MÓDULOS
// ============================================================================

/**
 * Configuración de módulo INEA
 * Tabla: muebles (sin estatus BAJA)
 */
export const INEA_CONFIG: ModuleConfig = {
  key: 'inea',
  name: 'INEA',
  table: 'muebles',
  stages: [
    { key: 'fetch_muebles', label: 'Cargando muebles INEA', weight: 90 },
    { key: 'setup_realtime', label: 'Configurando tiempo real', weight: 10 },
  ],
  glowColor: '#3b82f6', // blue-500
  icon: Database,
};

/**
 * Configuración de módulo ITEA
 * Tabla: mueblesitea (sin estatus BAJA)
 */
export const ITEA_CONFIG: ModuleConfig = {
  key: 'itea',
  name: 'ITEA',
  table: 'mueblesitea',
  stages: [
    { key: 'fetch_muebles', label: 'Cargando muebles ITEA', weight: 90 },
    { key: 'setup_realtime', label: 'Configurando tiempo real', weight: 10 },
  ],
  glowColor: '#10b981', // emerald-500
  icon: Database,
};

/**
 * Configuración de módulo INEA Obsoletos
 * Tabla: muebles (solo estatus BAJA)
 */
export const INEA_OBSOLETOS_CONFIG: ModuleConfig = {
  key: 'ineaObsoletos',
  name: 'INEA Obsoletos',
  table: 'muebles',
  stages: [
    { key: 'fetch_obsoletos', label: 'Cargando muebles obsoletos INEA', weight: 90 },
    { key: 'setup_realtime', label: 'Configurando tiempo real', weight: 10 },
  ],
  glowColor: '#f59e0b', // amber-500
  icon: FolderArchive,
};

/**
 * Configuración de módulo ITEA Obsoletos
 * Tabla: mueblesitea (solo estatus BAJA)
 */
export const ITEA_OBSOLETOS_CONFIG: ModuleConfig = {
  key: 'iteaObsoletos',
  name: 'ITEA Obsoletos',
  table: 'mueblesitea',
  stages: [
    { key: 'fetch_obsoletos', label: 'Cargando muebles obsoletos ITEA', weight: 90 },
    { key: 'setup_realtime', label: 'Configurando tiempo real', weight: 10 },
  ],
  glowColor: '#f97316', // orange-500
  icon: FolderArchive,
};

/**
 * Configuración de módulo No Listado
 * Tabla: mueblestlaxcala (sin estatus BAJA)
 */
export const NO_LISTADO_CONFIG: ModuleConfig = {
  key: 'noListado',
  name: 'No Listado',
  table: 'mueblestlaxcala',
  stages: [
    { key: 'fetch_muebles', label: 'Cargando muebles no listados', weight: 90 },
    { key: 'setup_realtime', label: 'Configurando tiempo real', weight: 10 },
  ],
  glowColor: '#8b5cf6', // violet-500
  icon: FileText,
};

/**
 * Configuración de módulo Resguardos
 * Tabla: resguardos
 */
export const RESGUARDOS_CONFIG: ModuleConfig = {
  key: 'resguardos',
  name: 'Resguardos',
  table: 'resguardos',
  stages: [
    { key: 'fetch_resguardos', label: 'Cargando resguardos', weight: 90 },
    { key: 'setup_realtime', label: 'Configurando tiempo real', weight: 10 },
  ],
  glowColor: '#06b6d4', // cyan-500
  icon: Package,
};

/**
 * Configuración de módulo Resguardos Bajas
 * Tabla: resguardos_bajas
 */
export const RESGUARDOS_BAJAS_CONFIG: ModuleConfig = {
  key: 'resguardosBajas',
  name: 'Resguardos Bajas',
  table: 'resguardos_bajas',
  stages: [
    { key: 'fetch_bajas', label: 'Cargando resguardos dados de baja', weight: 90 },
    { key: 'setup_realtime', label: 'Configurando tiempo real', weight: 10 },
  ],
  glowColor: '#ef4444', // red-500
  icon: FolderArchive,
};

// ============================================================================
// MAPA DE CONFIGURACIONES
// ============================================================================

/**
 * Mapa de todas las configuraciones de módulos
 * Útil para acceso dinámico por clave
 */
export const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  inea: INEA_CONFIG,
  itea: ITEA_CONFIG,
  ineaObsoletos: INEA_OBSOLETOS_CONFIG,
  iteaObsoletos: ITEA_OBSOLETOS_CONFIG,
  noListado: NO_LISTADO_CONFIG,
  resguardos: RESGUARDOS_CONFIG,
  resguardosBajas: RESGUARDOS_BAJAS_CONFIG,
};

/**
 * Array de todas las configuraciones de módulos
 * Útil para iteración
 */
export const ALL_MODULE_CONFIGS = Object.values(MODULE_CONFIGS);

/**
 * Tipo para las claves de módulos disponibles
 */
export type ModuleKey = keyof typeof MODULE_CONFIGS;

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Obtiene la configuración de un módulo por su clave
 * 
 * @param moduleKey - Clave del módulo
 * @returns Configuración del módulo o undefined si no existe
 */
export function getModuleConfig(moduleKey: string): ModuleConfig | undefined {
  return MODULE_CONFIGS[moduleKey];
}

/**
 * Verifica si una clave de módulo es válida
 * 
 * @param moduleKey - Clave a verificar
 * @returns true si la clave existe en las configuraciones
 */
export function isValidModuleKey(moduleKey: string): moduleKey is ModuleKey {
  return moduleKey in MODULE_CONFIGS;
}

/**
 * Valida que la suma de pesos de las etapas de un módulo sea 100
 * 
 * @param config - Configuración del módulo a validar
 * @returns true si la suma es 100, false en caso contrario
 */
export function validateStageWeights(config: ModuleConfig): boolean {
  const totalWeight = config.stages.reduce((sum, stage) => sum + stage.weight, 0);
  return totalWeight === 100;
}

/**
 * Valida todas las configuraciones de módulos
 * Lanza error si alguna configuración es inválida
 */
export function validateAllModuleConfigs(): void {
  ALL_MODULE_CONFIGS.forEach(config => {
    if (!validateStageWeights(config)) {
      throw new Error(
        `Invalid stage weights for module "${config.key}": ` +
        `total weight is ${config.stages.reduce((sum, s) => sum + s.weight, 0)}, expected 100`
      );
    }
  });
}

// Validar configuraciones al importar el módulo
validateAllModuleConfigs();
