import { useState, useCallback } from 'react';
import { useSession } from '@/hooks/useSession';
import { useFolioGenerator } from '@/hooks/useFolioGenerator';
import { ResguardoArticulo, PdfDataBaja, PdfFirma } from '../types';

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

export function useResguardoDelete(
  onSuccess: () => void
): UseResguardoDeleteReturn {
  const { generateFolio } = useFolioGenerator();
  const { user } = useSession();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pdfBajaData, setPdfBajaData] = useState<PdfDataBaja | null>(null);

  const processBajaViaAPI = useCallback(async (
    articulos: ResguardoArticulo[],
    folioResguardo: string,
    folioBaja: string,
    fecha: string,
    director: string,
    area: string,
    puesto: string,
    resguardante: string,
    deleteByFolio: boolean = false
  ) => {
    if (!user || !user.id) {
      throw new Error('No se pudo obtener el usuario actual. Por favor, inicia sesión nuevamente.');
    }

    const bajasData = articulos.map((articulo) => ({
      folio_resguardo: folioResguardo,
      folio_baja: folioBaja,
      f_resguardo: fecha,
      area_resguardo: area,
      dir_area: director,
      num_inventario: articulo.num_inventario,
      descripcion: articulo.descripcion,
      rubro: articulo.rubro,
      condicion: articulo.condicion,
      usufinal: resguardante,
      puesto: puesto,
      origen: articulo.origen
    }));

    const resguardosIds = articulos.map(art => art.id);
    const mueblesData = articulos.map(art => ({
      id_inv: art.num_inventario,
      origen: art.origen
    }));
    
    const response = await fetch('/api/resguardos/baja', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        bajasData,
        resguardosIds: deleteByFolio ? [] : resguardosIds,
        mueblesData,
        deleteByFolio,
        folio: folioResguardo,
        userId: user.id
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al procesar la baja');
    }

    return await response.json();
  }, [user]);

  const getFirmas = useCallback(async (): Promise<PdfFirma[] | undefined> => {
    try {
      const response = await fetch('/api/supabase-proxy?target=' + encodeURIComponent('/rest/v1/firmas?select=*&order=id.asc'), {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        return undefined;
      }

      const data = await response.json();
      return data || undefined;
    } catch (error) {
      return undefined;
    }
  }, []);

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
      const folioBaja = await generateFolio('BAJA');
      const firmas = await getFirmas();

      await processBajaViaAPI(
        [articulo], 
        folio, 
        folioBaja, 
        fecha, 
        director, 
        area, 
        puesto, 
        resguardante,
        false
      );

      const pdfData = {
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
      };
      setPdfBajaData(pdfData);

      setSuccess('Artículo eliminado correctamente');
      onSuccess();
    } catch (err) {
      setError('Error al procesar la baja del artículo');
    } finally {
      setDeleting(false);
    }
  }, [generateFolio, getFirmas, processBajaViaAPI, onSuccess]);

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
      const folioBaja = await generateFolio('BAJA');
      const firmas = await getFirmas();

      await processBajaViaAPI(
        articulos, 
        folio, 
        folioBaja, 
        fecha, 
        director, 
        area, 
        puesto, 
        resguardante,
        false
      );

      const pdfData = {
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
      };
      setPdfBajaData(pdfData);

      setSuccess('Artículos eliminados correctamente');
      onSuccess();
    } catch (err) {
      setError('Error al procesar la baja de los artículos seleccionados');
    } finally {
      setDeleting(false);
    }
  }, [generateFolio, getFirmas, processBajaViaAPI, onSuccess]);

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
      const folioBaja = await generateFolio('BAJA');
      const firmas = await getFirmas();

      await processBajaViaAPI(
        articulos, 
        folio, 
        folioBaja, 
        fecha, 
        director, 
        area, 
        puesto, 
        resguardante,
        true
      );

      const pdfData = {
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
      };
      setPdfBajaData(pdfData);

      setSuccess('Resguardo eliminado correctamente');
      onSuccess();
    } catch (err) {
      setError('Error al procesar la baja del resguardo');
    } finally {
      setDeleting(false);
    }
  }, [generateFolio, getFirmas, processBajaViaAPI, onSuccess]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

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
