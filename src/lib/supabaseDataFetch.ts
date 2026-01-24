/**
 * Helper para fetch de datos de Supabase
 * 
 * Usa el proxy para que funcione tanto con usuarios locales como de AXpert.
 * El proxy maneja la autenticación correctamente para ambos casos.
 */

interface FetchOptions {
  table: string;
  select?: string;
  filters?: Record<string, any>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

export async function fetchFromSupabase<T = any>(options: FetchOptions): Promise<T[]> {
  const { table, select = '*', filters = {}, order, limit, offset } = options;
  
  // Construir query string
  const params = new URLSearchParams();
  params.append('select', select);
  
  // Agregar filtros
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, `eq.${value}`);
    }
  });
  
  // Agregar orden
  if (order) {
    params.append('order', `${order.column}.${order.ascending !== false ? 'asc' : 'desc'}`);
  }
  
  // Agregar paginación
  if (limit !== undefined) {
    params.append('limit', limit.toString());
  }
  if (offset !== undefined) {
    params.append('offset', offset.toString());
  }
  
  // Construir URL del proxy
  const target = `/rest/v1/${table}?${params.toString()}`;
  const proxyUrl = `/api/supabase-proxy?target=${encodeURIComponent(target)}`;
  
  // Hacer la petición
  const response = await fetch(proxyUrl, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}
