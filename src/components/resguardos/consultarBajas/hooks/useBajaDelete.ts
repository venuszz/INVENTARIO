import { useState } from 'react';
import supabase from '@/app/lib/supabase/client';
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

  const deleteFolio = async (folioResguardo: string) => {
    setDeleting(true);
    try {
      const result = await supabase
        .from('resguardos_bajas')
        .delete()
        .eq('folio_resguardo', folioResguardo);

      if (result.error) throw result.error;

      // Generate PDF data after deletion
      const folioBajaArticulos = allBajas.filter(b => b.folio_resguardo === folioResguardo);
      if (folioBajaArticulos.length > 0) {
        // Notification removed - keeping PDF data generation for potential future use
      }

      onSuccess();
      setError(null);
    } catch (err) {
      setError('Error al eliminar el folio');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const deleteSelected = async (articulos: ResguardoBajaArticulo[]) => {
    setDeleting(true);
    try {
      const ids = articulos.map(art => art.id);
      const result = await supabase
        .from('resguardos_bajas')
        .delete()
        .in('id', ids);

      if (result.error) throw result.error;

      // Notification removed
      onSuccess();
      setError(null);
    } catch (err) {
      setError('Error al eliminar los artículos seleccionados');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const deleteSingle = async (articulo: ResguardoBajaArticulo) => {
    setDeleting(true);
    try {
      const result = await supabase
        .from('resguardos_bajas')
        .delete()
        .eq('id', articulo.id);

      if (result.error) throw result.error;

      // Notification removed
      onSuccess();
      setError(null);
    } catch (err) {
      setError('Error al eliminar el artículo');
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
