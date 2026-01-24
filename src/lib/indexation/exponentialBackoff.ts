// ============================================================================
// EXPONENTIAL BACKOFF UTILITY
// ============================================================================
// Utilidad para reintentar operaciones fallidas con delays incrementales
// exponenciales. Útil para manejar errores temporales de red o base de datos.

import type { ExponentialBackoffConfig } from '@/types/indexation';

/**
 * Ejecuta una función con estrategia de exponential backoff
 * 
 * @template T - Tipo de retorno de la función
 * @param fn - Función asíncrona a ejecutar con reintentos
 * @param config - Configuración de exponential backoff
 * @returns Promesa con el resultado de la función
 * @throws Error si se agotan todos los intentos
 * 
 * @example
 * ```typescript
 * const data = await withExponentialBackoff(
 *   async () => {
 *     const { data, error } = await supabase.from('table').select('*');
 *     if (error) throw error;
 *     return data;
 *   },
 *   {
 *     maxAttempts: 3,
 *     baseDelay: 1000,
 *     maxDelay: 10000,
 *     multiplier: 2
 *   }
 * );
 * ```
 */
export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  config: ExponentialBackoffConfig
): Promise<T> {
  const { maxAttempts, baseDelay, maxDelay, multiplier } = config;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Intentar ejecutar la función
      const result = await fn();
      
      // Si tiene éxito, retornar resultado
      if (attempt > 0) {
        console.log(`✅ Operation succeeded on attempt ${attempt + 1}`);
      }
      
      return result;
      
    } catch (error) {
      lastError = error as Error;
      
      // Si es el último intento, lanzar error
      if (attempt === maxAttempts - 1) {
        console.error(`❌ Operation failed after ${maxAttempts} attempts:`, lastError);
        throw lastError;
      }
      
      // Calcular delay con exponential backoff
      // Formula: min(baseDelay * (multiplier ^ attempt), maxDelay)
      const calculatedDelay = baseDelay * Math.pow(multiplier, attempt);
      const delay = Math.min(calculatedDelay, maxDelay);
      
      console.warn(
        `⚠️ Attempt ${attempt + 1}/${maxAttempts} failed: ${lastError.message}`,
        `\n   Retrying in ${delay}ms...`
      );
      
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Este código nunca debería ejecutarse, pero TypeScript lo requiere
  throw lastError || new Error('Unknown error in exponential backoff');
}

/**
 * Configuración predefinida para operaciones de fetch de datos
 * - 3 intentos máximos
 * - Delay base de 1000ms (1 segundo)
 * - Delay máximo de 10000ms (10 segundos)
 * - Multiplicador de 2 (delays: 1s, 2s, 4s)
 */
export const FETCH_RETRY_CONFIG: ExponentialBackoffConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  multiplier: 2,
};

/**
 * Configuración predefinida para reconexión de WebSocket
 * - 5 intentos máximos
 * - Delay base de 2000ms (2 segundos)
 * - Delay máximo de 30000ms (30 segundos)
 * - Multiplicador de 2 (delays: 2s, 4s, 8s, 16s, 30s)
 */
export const RECONNECTION_CONFIG: ExponentialBackoffConfig = {
  maxAttempts: 5,
  baseDelay: 2000,
  maxDelay: 30000,
  multiplier: 2,
};

/**
 * Calcula el delay para un intento específico sin ejecutar la función
 * Útil para testing o para mostrar información al usuario
 * 
 * @param attempt - Número de intento (0-indexed)
 * @param config - Configuración de exponential backoff
 * @returns Delay en milisegundos
 * 
 * @example
 * ```typescript
 * const delay = calculateDelay(2, FETCH_RETRY_CONFIG);
 * console.log(`Next retry in ${delay}ms`); // "Next retry in 4000ms"
 * ```
 */
export function calculateDelay(
  attempt: number,
  config: ExponentialBackoffConfig
): number {
  const { baseDelay, maxDelay, multiplier } = config;
  const calculatedDelay = baseDelay * Math.pow(multiplier, attempt);
  return Math.min(calculatedDelay, maxDelay);
}
