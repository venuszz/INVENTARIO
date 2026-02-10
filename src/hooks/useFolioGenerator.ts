/**
 * Hook para generar folios consecutivos desde la base de datos
 * Usa API routes para evitar problemas con RLS
 */

import { useCallback } from 'react';

export type TipoFolio = 'RESGUARDO' | 'BAJA';

export function useFolioGenerator() {
  /**
   * Genera un nuevo folio del tipo especificado
   * Utiliza la función de PostgreSQL para garantizar atomicidad
   */
  const generateFolio = useCallback(async (tipo: TipoFolio): Promise<string> => {
    try {
      const response = await fetch('/api/folios/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tipo }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al generar folio');
      }

      const { folio } = await response.json();
      return folio;
    } catch (error) {
      console.error('Error en generateFolio:', error);
      throw error;
    }
  }, []);

  /**
   * Obtiene el siguiente folio sin incrementar el consecutivo (preview)
   */
  const previewNextFolio = useCallback(async (tipo: TipoFolio): Promise<string> => {
    try {
      const response = await fetch(`/api/folios/preview?tipo=${tipo}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al obtener preview del folio');
      }

      const { folio } = await response.json();
      return folio;
    } catch (error) {
      console.error('Error en previewNextFolio:', error);
      throw error;
    }
  }, []);

  return {
    generateFolio,
    previewNextFolio,
  };
}
