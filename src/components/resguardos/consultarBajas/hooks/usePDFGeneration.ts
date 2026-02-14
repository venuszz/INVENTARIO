import { useState } from 'react';
import supabase from '@/app/lib/supabase/client';
import type { ResguardoBajaDetalle, PdfDataBaja } from '../types';

export function usePDFGeneration() {
  const [pdfBajaData, setPdfBajaData] = useState<PdfDataBaja | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFirmas = async () => {
    const { data, error } = await supabase
      .from('firmas')
      .select('*');

    if (error) {
      console.error('Error al obtener firmas:', error);
      return null;
    }
    return data;
  };

  const preparePDFData = async (
    selectedBaja: ResguardoBajaDetalle,
    selectedItems: { [key: string]: boolean }
  ) => {
    setGenerating(true);
    try {
      // Get selected items or use all items
      const selectedArticles = selectedBaja.articulos.filter(art => selectedItems[art.id]);
      const articlesToUse = selectedArticles.length > 0 ? selectedArticles : selectedBaja.articulos;

      // Group by folio_baja
      const grouped = articlesToUse.reduce((acc, art) => {
        const found = acc.find(g => g.folio_baja === art.folio_baja);
        if (found) {
          found.articulos.push(art);
        } else {
          acc.push({
            folio_baja: art.folio_baja,
            articulos: [art]
          });
        }
        return acc;
      }, [] as Array<{ folio_baja: string, articulos: any[] }>);

      const firstGroup = grouped[0];
      const firmas = await getFirmas();

      setPdfBajaData({
        folio_resguardo: selectedBaja.folio_resguardo,
        folio_baja: firstGroup.folio_baja,
        fecha: new Date(selectedBaja.f_resguardo).toLocaleDateString(),
        director: selectedBaja.dir_area,
        area: selectedBaja.area_resguardo || '',
        puesto: selectedBaja.puesto,
        resguardante: selectedBaja.usufinal || '',
        articulos: firstGroup.articulos.map(art => ({
          id_inv: art.num_inventario,
          descripcion: art.descripcion,
          rubro: art.rubro,
          estado: art.condicion,
          origen: art.origen,
          folio_baja: art.folio_baja,
          resguardante: art.usufinal || selectedBaja.usufinal || ''
        })),
        firmas: firmas || undefined
      });

      setError(null);
    } catch (err) {
      setError('Error al preparar el PDF de baja');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const generatePDF = async () => {
    // This will be called from the component with the actual PDF generation logic
    // The hook just prepares the data
  };

  const clearPDFData = () => {
    setPdfBajaData(null);
  };

  return {
    pdfBajaData,
    generating,
    error,
    preparePDFData,
    generatePDF,
    clearPDFData,
  };
}
