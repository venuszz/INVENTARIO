/**
 * Estatus interface representing a status from config table
 */
export interface Estatus {
  id: number;
  concepto: string;
}

/**
 * Response structure for estatus API endpoint
 */
export interface EstatusResponse {
  estatus: Estatus[];
}

/**
 * Fetch estatus from config table via API proxy
 * 
 * Uses the Supabase proxy endpoint for consistency with the rest of the application.
 * Filters by tipo='estatus' and orders by concepto.
 * 
 * @returns Promise with estatus array
 * @throws Error if request fails
 * 
 * @example
 * ```typescript
 * const { estatus } = await fetchEstatus();
 * console.log(estatus); // [{ id: 1, concepto: 'ACTIVO' }, ...]
 * ```
 */
export async function fetchEstatus(): Promise<EstatusResponse> {
  // Use API proxy for consistency with other components
  const target = '/rest/v1/config?tipo=eq.estatus&select=id,concepto&order=concepto';
  const response = await fetch(
    '/api/supabase-proxy?target=' + encodeURIComponent(target),
    {
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = new Error('Error al cargar estatus');
    (error as any).status = response.status;
    (error as any).details = await response.text();
    throw error;
  }

  const data = await response.json();
  return { estatus: data };
}
