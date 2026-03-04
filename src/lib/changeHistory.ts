// Utilities for managing change history across inventory modules

import type { 
  CambioInventario, 
  ChangeHistoryEntry, 
  RegistrarCambiosParams,
  TablaOrigen 
} from '@/types/changeHistory';

/**
 * Registers changes to inventory items in the change history table
 * Uses secure API endpoint with service role key to bypass RLS
 * @param params - Parameters for registering changes
 * @param userId - UUID of the authenticated user
 * @returns Promise that resolves when changes are registered
 * @throws Error if registration fails
 */
export async function registrarCambios(
  params: RegistrarCambiosParams,
  userId: string
): Promise<void> {
  const { idMueble, tablaOrigen, cambios, razonCambio } = params;

  if (!userId) {
    throw new Error('Usuario no autenticado');
  }

  if (cambios.length === 0) {
    return; // Nothing to register
  }

  // Call secure API endpoint
  const response = await fetch('/api/cambios-inventario', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      idMueble,
      tablaOrigen,
      cambios,
      razonCambio,
      userId
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error al registrar cambios en historial:', error);
    throw new Error(error.error || 'Error al registrar cambios');
  }

  const result = await response.json();
  console.log(`✅ [Change History] ${result.count} cambios registrados`);
}

/**
 * Retrieves change history for a specific inventory item
 * Uses secure API endpoint with service role key to bypass RLS
 * @param idMueble - The UUID of the inventory item
 * @param tablaOrigen - Optional: filter by source table
 * @param limit - Optional: limit number of results (default: 50)
 * @returns Promise with array of change records
 */
export async function obtenerHistorialCambios(
  idMueble: string,
  tablaOrigen?: TablaOrigen,
  limit: number = 50
): Promise<CambioInventario[]> {
  console.log('🔵🔵🔵 [obtenerHistorialCambios] ===== STARTING =====');
  console.log('🔵 [obtenerHistorialCambios] Input params:', {
    idMueble,
    tablaOrigen,
    limit,
    idMuebleType: typeof idMueble,
    idMuebleLength: idMueble?.length
  });

  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (tablaOrigen) {
      params.append('tabla_origen', tablaOrigen);
      console.log('🔵 [obtenerHistorialCambios] Added tabla_origen param:', tablaOrigen);
    }
    params.append('limit', limit.toString());

    const url = `/api/cambios-inventario/${idMueble}${params.toString() ? `?${params.toString()}` : ''}`;
    console.log('🔵 [obtenerHistorialCambios] Full URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    console.log('🔵 [obtenerHistorialCambios] Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('🔴 [obtenerHistorialCambios] API Error:', error);
      return [];
    }

    const result = await response.json();
    
    console.log('🔵 [obtenerHistorialCambios] API Response:', {
      recordCount: result.count || 0,
      dataLength: result.data?.length || 0,
      firstRecord: result.data?.[0],
      allRecords: result.data
    });
    console.log('🔵🔵🔵 [obtenerHistorialCambios] ===== FINISHED =====');

    return result.data || [];
  } catch (error) {
    console.error('🔴🔴🔴 [obtenerHistorialCambios] Unexpected error:', error);
    return [];
  }
}

/**
 * Gets a summary of recent changes for an inventory item
 * @param idMueble - The UUID of the inventory item
 * @param tablaOrigen - Optional: filter by source table
 * @returns Promise with summary information
 */
export async function obtenerResumenCambios(
  idMueble: string,
  tablaOrigen?: TablaOrigen
): Promise<{
  totalCambios: number;
  ultimoCambio: CambioInventario | null;
  usuariosUnicos: string[];
}> {
  const historial = await obtenerHistorialCambios(idMueble, tablaOrigen, 100);

  const usuariosUnicos = Array.from(
    new Set(historial.map(h => h.usuario_id))
  );

  return {
    totalCambios: historial.length,
    ultimoCambio: historial[0] || null,
    usuariosUnicos
  };
}

/**
 * Formats a change entry for display
 * @param cambio - The change record to format
 * @returns Formatted string for display
 */
export function formatearCambio(cambio: CambioInventario): string {
  const campo = cambio.metadata?.campo_display || cambio.campo_modificado;
  const fecha = new Date(cambio.fecha_cambio).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `${campo}: "${cambio.valor_anterior || 'vacío'}" → "${cambio.valor_nuevo || 'vacío'}" (${fecha})`;
}
