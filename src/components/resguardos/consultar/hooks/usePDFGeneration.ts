/**
 * Hook for generating PDF data for resguardos and bajas
 * Fetches resguardo data and firmas from database
 */

import { useState, useCallback } from 'react';
import supabase from '@/app/lib/supabase/client';
import { useIneaStore } from '@/stores/ineaStore';
import { useIteaStore } from '@/stores/iteaStore';
import { useNoListadoStore } from '@/stores/noListadoStore';
import { useAdminStore } from '@/stores/adminStore';
import { PdfData, PdfDataBaja, PdfFirma } from '../types';

interface UsePDFGenerationReturn {
  generateResguardoPDF: (folio: string, resguardante?: string) => Promise<PdfData | null>;
  generateBajaPDF: (
    folioBaja: string,
    folioResguardo: string,
    articulos: Array<{
      id_inv: string;
      descripcion: string;
      rubro: string;
      estado: string;
      origen?: string | null;
      resguardante: string;
    }>
  ) => Promise<PdfDataBaja | null>;
  generating: boolean;
  error: string | null;
}

/**
 * Custom hook for generating PDF data
 * @returns Object with PDF generation functions and state
 */
export function usePDFGeneration(): UsePDFGenerationReturn {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get muebles stores for area lookup
  const ineaMuebles = useIneaStore(state => state.muebles);
  const iteaMuebles = useIteaStore(state => state.muebles);
  const noListadoMuebles = useNoListadoStore(state => state.muebles);
  
  // Get areas store for area name lookup
  const areas = useAdminStore(state => state.areas);

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
   * Generate PDF data for a resguardo
   * @param folio - Resguardo folio
   * @param resguardante - Optional resguardante filter
   * @returns PdfData object or null on error
   */
  const generateResguardoPDF = useCallback(async (
    folio: string,
    resguardante?: string
  ): Promise<PdfData | null> => {
    setGenerating(true);
    setError(null);

    try {
      // Fetch resguardo data with relational data
      let query = supabase
        .from('resguardos')
        .select(`
          id,
          folio,
          f_resguardo,
          id_directorio,
          directorio!inner (
            nombre,
            puesto
          ),
          id_mueble,
          origen,
          puesto_resguardo,
          resguardante,
          created_by
        `)
        .eq('folio', folio);

      // Filter by resguardante if specified
      if (resguardante) {
        query = query.eq('resguardante', resguardante);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      if (!data || data.length === 0) {
        setError('No se encontraron datos para el folio especificado');
        return null;
      }

      // Get first item for header info
      const firstItem = data[0];

      // Get firmas
      const firmas = await getFirmas();

      // Format date correctly (avoid timezone offset)
      const [year, month, day] = firstItem.f_resguardo.slice(0, 10).split('-').map(Number);
      const fechaLocal = new Date(year, month - 1, day);

      // Get area from first mueble (same logic as useResguardosData)
      let areaNombre = 'Sin área';
      let idArea: number | null = null;
      
      // Find the mueble to get id_area
      if (firstItem.origen === 'INEA') {
        const mueble = ineaMuebles.find(m => m.id === firstItem.id_mueble);
        idArea = mueble?.id_area ?? null;
      } else if (firstItem.origen === 'ITEA') {
        const mueble = iteaMuebles.find(m => m.id === firstItem.id_mueble);
        idArea = mueble?.id_area ?? null;
      } else if (firstItem.origen === 'NO_LISTADO') {
        const mueble = noListadoMuebles.find(m => m.id === firstItem.id_mueble);
        idArea = mueble?.id_area ?? null;
      }
      
      // Get area name from areas store
      if (idArea !== null) {
        const area = areas.find(a => a.id_area === idArea);
        areaNombre = area?.nombre ?? 'Sin área';
      }

      // Fetch mueble details for each item
      const articulosWithDetails = await Promise.all(
        data.map(async (item) => {
          // Determine which table to query based on origen
          const tableName = item.origen === 'ITEA' ? 'mueblesitea' : 
                          item.origen === 'NO_LISTADO' ? 'mueblestlaxcala' : 
                          'muebles';
          
          // Fetch mueble details
          const { data: muebleData, error: muebleError } = await supabase
            .from(tableName)
            .select('id, id_inv, descripcion, rubro, estado')
            .eq('id', item.id_mueble)
            .single();

          if (muebleError) {
            console.error(`Error fetching mueble from ${tableName}:`, muebleError);
            return {
              id_inv: 'N/A',
              descripcion: 'Error al cargar',
              rubro: '',
              estado: '',
              origen: item.origen === 'NO_LISTADO' ? 'TLAXCALA' : item.origen, // Map back to TLAXCALA for display
              resguardante: item.resguardante
            };
          }

          return {
            id_inv: muebleData.id_inv || '',
            descripcion: muebleData.descripcion || '',
            rubro: muebleData.rubro || '',
            estado: muebleData.estado || '',
            origen: item.origen === 'NO_LISTADO' ? 'TLAXCALA' : item.origen, // Map back to TLAXCALA for display
            resguardante: item.resguardante
          };
        })
      );

      // Create PdfData structure
      const pdfData: PdfData = {
        folio: firstItem.folio,
        fecha: fechaLocal.toLocaleDateString(),
        director: (firstItem.directorio as any)?.nombre || '',
        area: areaNombre,
        puesto: firstItem.puesto_resguardo || (firstItem.directorio as any)?.puesto || '',
        resguardante: resguardante || firstItem.resguardante || '',
        articulos: articulosWithDetails,
        firmas: firmas
      };

      return pdfData;
    } catch (err) {
      console.error('Error al generar datos del PDF:', err);
      setError('Error al generar el PDF');
      return null;
    } finally {
      setGenerating(false);
    }
  }, [getFirmas]);

  /**
   * Generate PDF data for a baja
   * @param folioBaja - Baja folio
   * @param folioResguardo - Original resguardo folio
   * @param articulos - Articles to include in baja
   * @returns PdfDataBaja object or null on error
   */
  const generateBajaPDF = useCallback(async (
    folioBaja: string,
    folioResguardo: string,
    articulos: Array<{
      id_inv: string;
      descripcion: string;
      rubro: string;
      estado: string;
      origen?: string | null;
      resguardante: string;
    }>
  ): Promise<PdfDataBaja | null> => {
    setGenerating(true);
    setError(null);

    try {
      // Fetch resguardo data for header info with relational data
      const { data, error: queryError } = await supabase
        .from('resguardos')
        .select(`
          id,
          folio,
          f_resguardo,
          id_directorio,
          directorio!inner (
            nombre,
            puesto
          ),
          id_mueble,
          origen,
          puesto_resguardo,
          resguardante,
          created_by
        `)
        .eq('folio', folioResguardo)
        .limit(1);

      if (queryError) throw queryError;

      if (!data || data.length === 0) {
        setError('No se encontraron datos para el folio especificado');
        return null;
      }

      const firstItem = data[0];

      // Get firmas
      const firmas = await getFirmas();

      // Get area from first mueble (same logic as useResguardosData)
      let areaNombre = 'Sin área';
      let idArea: number | null = null;
      
      // Find the mueble to get id_area
      if (firstItem.origen === 'INEA') {
        const mueble = ineaMuebles.find(m => m.id === firstItem.id_mueble);
        idArea = mueble?.id_area ?? null;
      } else if (firstItem.origen === 'ITEA') {
        const mueble = iteaMuebles.find(m => m.id === firstItem.id_mueble);
        idArea = mueble?.id_area ?? null;
      } else if (firstItem.origen === 'NO_LISTADO') {
        const mueble = noListadoMuebles.find(m => m.id === firstItem.id_mueble);
        idArea = mueble?.id_area ?? null;
      }
      
      // Get area name from areas store
      if (idArea !== null) {
        const area = areas.find(a => a.id_area === idArea);
        areaNombre = area?.nombre ?? 'Sin área';
      }

      // Create PdfDataBaja structure
      const pdfDataBaja: PdfDataBaja = {
        folioBaja: folioBaja,
        folioOriginal: folioResguardo,
        fecha: new Date().toLocaleDateString(),
        director: (firstItem.directorio as any)?.nombre || '',
        area: areaNombre,
        puesto: firstItem.puesto_resguardo || (firstItem.directorio as any)?.puesto || '',
        resguardante: firstItem.resguardante || '',
        articulos: articulos.map(art => ({
          ...art,
          origen: art.origen === 'NO_LISTADO' ? 'TLAXCALA' : art.origen // Map back to TLAXCALA for display
        })),
        firmas: firmas
      };

      return pdfDataBaja;
    } catch (err) {
      console.error('Error al generar datos del PDF de baja:', err);
      setError('Error al generar el PDF de baja');
      return null;
    } finally {
      setGenerating(false);
    }
  }, [getFirmas]);

  return {
    generateResguardoPDF,
    generateBajaPDF,
    generating,
    error
  };
}
