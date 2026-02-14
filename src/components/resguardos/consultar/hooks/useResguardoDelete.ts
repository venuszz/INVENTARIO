/**
 * Hook for managing resguardo deletion operations
 * Handles deletion of individual articles, multiple articles, and complete resguardos
 * Generates baja folios and moves records to resguardos_bajas table
 */

import { useState, useCallback } from 'react';
import supabase from '@/app/lib/supabase/client';
import { useFolioGenerator } from '@/hooks/useFolioGenerator';
import { ResguardoArticulo, PdfDataBaja, PdfFirma } from '../types';
import { limpiarDatosArticulo } from '../utils';

interface UseResguardoDeleteReturn {
  deleteArticulo: (
    articulo: ResguardoArticulo,
    folio: string,
    fecha: string,
    director: string,
    area: string,
    puesto: string,
    resguardante: string
  ) => Promise<void>;
  deleteSelected: (
    articulos: ResguardoArticulo[],
    folio: string,
    fecha: string,
    director: string,
    area: string,
    puesto: string,
    resguardante: string
  ) => Promise<void>;
  deleteAll: (
    articulos: ResguardoArticulo[],
    folio: string,
    fecha: string,
    director: string,
    area: string,
    puesto: string,
    resguardante: string
  ) => Promise<void>;
  deleting: boolean;
  error: string | null;
  success: string | null;
  pdfBajaData: PdfDataBaja | null;
  clearMessages: () => void;
  clearPdfBajaData: () => void;
}

/**
 * Custom hook for managing resguardo deletion operations
 * @param onSuccess - Callback to execute after successful deletion
 * @returns Object with deletion functions and state
 */
export function useResguardoDelete(
  onSuccess: () => void
): UseResguardoDeleteReturn {
  const { generateFolio } = useFolioGenerator();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pdfBajaData, setPdfBajaData] = useState<PdfDataBaja | null>(null);

  /**
   * Move records to resguardos_bajas table
   */
  const moveToResguardosBajas = useCallback(async (
    articulos: ResguardoArticulo[],
    folioResguardo: string,
    folioBaja: string,
    fecha: string,
    director: string,
    area: string,
    puesto: string
  ) => {
    for (const articulo of articulos) {
      await supabase
        .from('resguardos_bajas')
        .insert({
          folio_resguardo: folioResguardo,
          folio_baja: folioBaja,
          f_resguardo: fecha,
          area_resguardo: area,
          dir_area: director,
          num_inventario: articulo.num_inventario,
          descripcion: articulo.descripcion,
          rubro: articulo.rubro,
          condicion: articulo.condicion,
          usufinal: articulo.resguardante || '',
          puesto: puesto,
          origen: articulo.origen
        });
    }
  }, []);

  /**
   * Get firmas from database
   */
  const getFirmas = useCallback(async (): Promise<PdfFirma[] | undefined> => {
    const { data, error: firmasError } = await supabase
      .from('firmas')
      .select('*')
      .order('id', { ascending: true });

    if (firmasError) {
      console.error('Error al obtener firmas:', firmasError);
      return undefined;
    }

    return data || undefined;
  }, []);

  /**
   * Delete a single article from a resguardo
   */
  const deleteArticulo = useCallback(async (
    articulo: ResguardoArticulo,
    folio: string,
    fecha: string,
    director: string,
    area: string,
    puesto: string,
    resguardante: string
  ) => {
    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      // Generate baja folio
      const folioBaja = await generateFolio('BAJA');

      // Get firmas
      const firmas = await getFirmas();

      // Move record to resguardos_bajas
      await moveToResguardosBajas([articulo], folio, folioBaja, fecha, director, area, puesto);

      // Prepare PDF baja data
      setPdfBajaData({
        folioBaja: folioBaja,
        folioOriginal: folio,
        fecha: new Date().toLocaleDateString(),
        director: director,
        area: area,
        puesto: puesto,
        resguardante: resguardante,
        articulos: [
          {
            id_inv: articulo.num_inventario,
            descripcion: articulo.descripcion,
            rubro: articulo.rubro,
            estado: articulo.condicion,
            origen: articulo.origen,
            resguardante: articulo.resguardante || ''
          }
        ],
        firmas: firmas
      });

      // Delete record from resguardos by id
      const { error: deleteError } = await supabase
        .from('resguardos')
        .delete()
        .eq('id', articulo.id);

      if (deleteError) throw deleteError;

      // Clear resguardante in muebles table
      await limpiarDatosArticulo(articulo.num_inventario || '', articulo.origen);

      setSuccess('Artículo eliminado correctamente');
      onSuccess();
    } catch (err) {
      console.error('Error al eliminar artículo:', err);
      setError('Error al procesar la baja del artículo');
    } finally {
      setDeleting(false);
    }
  }, [generateFolio, getFirmas, moveToResguardosBajas, onSuccess]);

  /**
   * Delete multiple selected articles from a resguardo
   */
  const deleteSelected = useCallback(async (
    articulos: ResguardoArticulo[],
    folio: string,
    fecha: string,
    director: string,
    area: string,
    puesto: string,
    resguardante: string
  ) => {
    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      // Generate baja folio
      const folioBaja = await generateFolio('BAJA');

      // Get firmas
      const firmas = await getFirmas();

      // Move records to resguardos_bajas
      await moveToResguardosBajas(articulos, folio, folioBaja, fecha, director, area, puesto);

      // Prepare PDF baja data
      setPdfBajaData({
        folioBaja: folioBaja,
        folioOriginal: folio,
        fecha: new Date().toLocaleDateString(),
        director: director,
        area: area,
        puesto: puesto,
        resguardante: resguardante,
        articulos: articulos.map(art => ({
          id_inv: art.num_inventario,
          descripcion: art.descripcion,
          rubro: art.rubro,
          estado: art.condicion,
          origen: art.origen,
          resguardante: art.resguardante || ''
        })),
        firmas: firmas
      });

      // Delete records from resguardos by id
      for (const articulo of articulos) {
        await supabase
          .from('resguardos')
          .delete()
          .eq('id', articulo.id);
      }

      // Clear resguardante for each article
      for (const articulo of articulos) {
        await limpiarDatosArticulo(articulo.num_inventario || '', articulo.origen);
      }

      setSuccess('Artículos eliminados correctamente');
      onSuccess();
    } catch (err) {
      console.error('Error al eliminar artículos seleccionados:', err);
      setError('Error al procesar la baja de los artículos seleccionados');
    } finally {
      setDeleting(false);
    }
  }, [generateFolio, getFirmas, moveToResguardosBajas, onSuccess]);

  /**
   * Delete all articles from a resguardo (complete resguardo deletion)
   */
  const deleteAll = useCallback(async (
    articulos: ResguardoArticulo[],
    folio: string,
    fecha: string,
    director: string,
    area: string,
    puesto: string,
    resguardante: string
  ) => {
    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      // Generate baja folio
      const folioBaja = await generateFolio('BAJA');

      // Get firmas
      const firmas = await getFirmas();

      // Move records to resguardos_bajas
      await moveToResguardosBajas(articulos, folio, folioBaja, fecha, director, area, puesto);

      // Prepare PDF baja data
      setPdfBajaData({
        folioBaja: folioBaja,
        folioOriginal: folio,
        fecha: new Date().toLocaleDateString(),
        director: director,
        area: area,
        puesto: puesto,
        resguardante: resguardante,
        articulos: articulos.map(art => ({
          id_inv: art.num_inventario,
          descripcion: art.descripcion,
          rubro: art.rubro,
          estado: art.condicion,
          origen: art.origen,
          resguardante: art.resguardante || ''
        })),
        firmas: firmas
      });

      // Delete all records from resguardos by folio
      const { error: deleteError } = await supabase
        .from('resguardos')
        .delete()
        .eq('folio', folio);

      if (deleteError) throw deleteError;

      // Clear resguardante for each article
      for (const articulo of articulos) {
        await limpiarDatosArticulo(articulo.num_inventario || '', articulo.origen);
      }

      setSuccess('Resguardo eliminado correctamente');
      onSuccess();
    } catch (err) {
      console.error('Error al eliminar resguardo completo:', err);
      setError('Error al procesar la baja del resguardo');
    } finally {
      setDeleting(false);
    }
  }, [generateFolio, getFirmas, moveToResguardosBajas, onSuccess]);

  /**
   * Clear error and success messages
   */
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  /**
   * Clear PDF baja data
   */
  const clearPdfBajaData = useCallback(() => {
    setPdfBajaData(null);
  }, []);

  return {
    deleteArticulo,
    deleteSelected,
    deleteAll,
    deleting,
    error,
    success,
    pdfBajaData,
    clearMessages,
    clearPdfBajaData
  };
}
