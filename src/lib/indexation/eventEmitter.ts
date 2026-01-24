// ============================================================================
// EVENT EMITTER UTILITY
// ============================================================================
// Sistema de eventos para notificar a componentes UI de cambios en tiempo real.
// Permite desacoplar la lógica de indexación de la UI.

import type { EventCallback, UnsubscribeFunction, RealtimeEvent } from '@/types/indexation';

/**
 * Event Emitter genérico para notificaciones de cambios
 * 
 * @template T - Tipo de datos que se emitirán en los eventos
 * 
 * @example
 * ```typescript
 * const emitter = new EventEmitter<{ id: number; name: string }>();
 * 
 * // Suscribirse a eventos
 * const unsubscribe = emitter.subscribe((data) => {
 *   console.log('Received:', data);
 * });
 * 
 * // Emitir evento
 * emitter.emit({ id: 1, name: 'Test' });
 * 
 * // Limpiar suscripción
 * unsubscribe();
 * ```
 */
export class EventEmitter<T = any> {
  private listeners = new Set<EventCallback<T>>();
  
  /**
   * Suscribe un callback para recibir eventos
   * 
   * @param callback - Función que se ejecutará cuando se emita un evento
   * @returns Función de cleanup para cancelar la suscripción
   */
  subscribe(callback: EventCallback<T>): UnsubscribeFunction {
    this.listeners.add(callback);
    
    // Retornar función de cleanup
    return () => {
      this.listeners.delete(callback);
    };
  }
  
  /**
   * Emite un evento a todos los listeners suscritos
   * 
   * @param data - Datos del evento a emitir
   */
  emit(data: T): void {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in event listener:', error);
        // No lanzar el error para no interrumpir otros listeners
      }
    });
  }
  
  /**
   * Limpia todos los listeners suscritos
   * Útil para cleanup en unmount de componentes
   */
  clear(): void {
    this.listeners.clear();
  }
  
  /**
   * Retorna el número de listeners actualmente suscritos
   * Útil para debugging y testing
   */
  get listenerCount(): number {
    return this.listeners.size;
  }
}

// ============================================================================
// EMITTERS POR MÓDULO
// ============================================================================
// Cada módulo tiene su propio emitter para eventos de tiempo real

/**
 * Emitter para eventos de INEA (tabla: muebles)
 */
export const ineaEmitter = new EventEmitter<RealtimeEvent>();

/**
 * Emitter para eventos de ITEA (tabla: mueblestlax)
 */
export const iteaEmitter = new EventEmitter<RealtimeEvent>();

/**
 * Emitter para eventos de INEA Obsoletos (tabla: muebles con estatus BAJA)
 */
export const ineaObsoletosEmitter = new EventEmitter<RealtimeEvent>();

/**
 * Emitter para eventos de ITEA Obsoletos (tabla: mueblestlax con estatus BAJA)
 */
export const iteaObsoletosEmitter = new EventEmitter<RealtimeEvent>();

/**
 * Emitter para eventos de No Listado (tabla: mueblestlaxcala)
 */
export const noListadoEmitter = new EventEmitter<RealtimeEvent>();

/**
 * Emitter para eventos de Resguardos (tabla: resguardos)
 */
export const resguardosEmitter = new EventEmitter<RealtimeEvent>();

/**
 * Emitter para eventos de Resguardos Bajas (tabla: resguardos_bajas)
 */
export const resguardosBajasEmitter = new EventEmitter<RealtimeEvent>();

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Mapa de emitters por clave de módulo
 * Útil para acceso dinámico a emitters
 */
export const emittersByModule = {
  inea: ineaEmitter,
  itea: iteaEmitter,
  ineaObsoletos: ineaObsoletosEmitter,
  iteaObsoletos: iteaObsoletosEmitter,
  noListado: noListadoEmitter,
  resguardos: resguardosEmitter,
  resguardosBajas: resguardosBajasEmitter,
} as const;

/**
 * Tipo para las claves de módulos disponibles
 */
export type ModuleKey = keyof typeof emittersByModule;

/**
 * Obtiene el emitter para un módulo específico
 * 
 * @param moduleKey - Clave del módulo
 * @returns Emitter del módulo
 * 
 * @example
 * ```typescript
 * const emitter = getEmitterForModule('inea');
 * emitter.emit({ type: 'INSERT', data: newMueble });
 * ```
 */
export function getEmitterForModule(moduleKey: ModuleKey): EventEmitter<RealtimeEvent> {
  return emittersByModule[moduleKey];
}

/**
 * Limpia todos los emitters de todos los módulos
 * Útil para cleanup global o en logout
 */
export function clearAllEmitters(): void {
  Object.values(emittersByModule).forEach(emitter => {
    emitter.clear();
  });
}
