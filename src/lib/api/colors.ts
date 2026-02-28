/**
 * Color interface representing a color from the API
 */
export interface Color {
  id: number;
  nombre: string;
}

/**
 * Response structure for colors API endpoint
 */
export interface ColorsResponse {
  colors: Color[];
}

/**
 * Fetch colors from API
 * 
 * @returns Promise with colors array
 * @throws Error if request fails
 * 
 * @example
 * ```typescript
 * const { colors } = await fetchColors();
 * console.log(colors); // [{ id: 1, nombre: 'ROJO' }, ...]
 * ```
 */
export async function fetchColors(): Promise<ColorsResponse> {
  const response = await fetch('/api/colores', {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = new Error('Error al cargar colores');
    (error as any).status = response.status;
    (error as any).details = await response.text();
    throw error;
  }

  return response.json();
}
