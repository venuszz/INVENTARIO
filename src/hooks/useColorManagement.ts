import { useState, useCallback, useEffect } from 'react';

export interface Color {
  id: string;
  nombre: string;
  significado: string | null;
}

export function useColorManagement() {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all colors using API route (bypasses RLS)
  const fetchColors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/colores');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch colors');
      }

      const { colors } = await response.json();
      setColors(colors || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar colores');
    } finally {
      setLoading(false);
    }
  }, []);

  // Assign color to a mueble
  const assignColor = useCallback(async (muebleId: string, colorId: string) => {
    try {
      const response = await fetch('/api/colores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ muebleId, colorId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign color');
      }

      return true;
    } catch (err: any) {
      setError(err.message || 'Error al asignar color');
      return false;
    }
  }, []);

  // Remove color from a mueble
  const removeColor = useCallback(async (muebleId: string) => {
    try {
      const response = await fetch(`/api/colores?muebleId=${encodeURIComponent(muebleId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove color');
      }

      return true;
    } catch (err: any) {
      setError(err.message || 'Error al remover color');
      return false;
    }
  }, []);

  // Get color by ID
  const getColorById = useCallback((colorId: string | null) => {
    if (!colorId) return null;
    return colors.find(c => c.id === colorId) || null;
  }, [colors]);

  // Get color hex value
  const getColorHex = useCallback((colorName: string | null) => {
    if (!colorName) return '#9ca3af'; // gray default
    
    const name = colorName.toUpperCase();
    switch (name) {
      case 'ROJO': return '#ef4444';
      case 'BLANCO': return '#ffffff';
      case 'VERDE': return '#22c55e';
      case 'AMARILLO': return '#eab308';
      case 'AZUL': return '#3b82f6';
      case 'NARANJA': return '#f97316';
      default: return '#9ca3af';
    }
  }, []);

  // Load colors on mount
  useEffect(() => {
    fetchColors();
  }, [fetchColors]);

  return {
    colors,
    loading,
    error,
    fetchColors,
    assignColor,
    removeColor,
    getColorById,
    getColorHex
  };
}
