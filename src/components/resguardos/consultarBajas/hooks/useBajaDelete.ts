import { useState } from 'react';
import { useSession } from '@/hooks/useSession';
import type { ResguardoBajaArticulo, PdfDataBaja } from '../types';

interface UseBajaDeleteProps {
  allBajas: any[];
  selectedBaja: any;
  onSuccess: () => void;
}

export function useBajaDelete({ allBajas, selectedBaja, onSuccess }: UseBajaDeleteProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfBajaData, setPdfBajaData] = useState<PdfDataBaja | null>(null);
  const { user } = useSession();

  const deleteFolio = async (folioResguardo: string) => {
    setDeleting(true);
    try {
      const response = await fetch('/api/resguardos/bajas/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'folio',
          folioResguardo,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar el folio');
      }

      // Generate PDF data after deletion
      const folioBajaArticulos = allBajas.filter(b => b.folio_resguardo === folioResguardo);
      if (folioBajaArticulos.length > 0) {
        // Notification removed - keeping PDF data generation for potential future use
      }

      onSuccess();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el folio');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const deleteSelected = async (articulos: ResguardoBajaArticulo[]) => {
    setDeleting(true);
    try {
      const ids = articulos.map(art => art.id);
      
      const response = await fetch('/api/resguardos/bajas/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'selected',
          ids,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar los artículos seleccionados');
      }

      onSuccess();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar los artículos seleccionados');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const deleteSingle = async (articulo: ResguardoBajaArticulo) => {
    setDeleting(true);
    try {
      const response = await fetch('/api/resguardos/bajas/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'single',
          ids: [articulo.id],
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar el artículo');
      }

      onSuccess();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el artículo');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const clearPdfBajaData = () => {
    setPdfBajaData(null);
  };

  return {
    deleting,
    error,
    pdfBajaData,
    deleteFolio,
    deleteSelected,
    deleteSingle,
    clearPdfBajaData,
  };
}
