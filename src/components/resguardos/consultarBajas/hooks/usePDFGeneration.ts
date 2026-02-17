import { useState } from 'react';
import supabase from '@/app/lib/supabase/client';
import type { ResguardoBajaDetalle, PdfDataBaja } from '../types';

export function usePDFGeneration() {
  const [pdfBajaData, setPdfBajaData] = useState<PdfDataBaja | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firmas, setFirmas] = useState<any[] | null>(null);

  // Pre-load firmas on mount
  const loadFirmas = async () => {
    if (firmas) return firmas; // Return cached firmas
    
    const { data, error } = await supabase
      .from('firmas')
      .select('*');

    if (error) {
      console.error('Error al obtener firmas:', error);
      return null;
    }
    setFirmas(data);
    return data;
  };

  const preparePDFData = (
    selectedBaja: ResguardoBajaDetalle,
    selectedItems: { [key: string]: boolean }
  ) => {
    // Synchronous preparation - no await needed
    setGenerating(true);
    try {
      // Get selected items or use all items
      const selectedArticles = selectedBaja.articulos.filter(art => selectedItems[art.id]);
      const articlesToUse = selectedArticles.length > 0 ? selectedArticles : selectedBaja.articulos;

      // Get all unique folio_baja values
      const foliosBaja = Array.from(new Set(articlesToUse.map(art => art.folio_baja)));
      
      // Create title that includes all folios if multiple
      const folioTitle = foliosBaja.length > 1 
        ? foliosBaja.join(', ')
        : foliosBaja[0];

      // Include ALL articles with their respective folio_baja
      setPdfBajaData({
        folio_resguardo: selectedBaja.folio_resguardo,
        folio_baja: folioTitle, // This will show all folios in the title
        fecha: new Date(selectedBaja.f_resguardo).toLocaleDateString(),
        director: selectedBaja.dir_area,
        area: selectedBaja.area_resguardo || '',
        puesto: selectedBaja.puesto,
        resguardante: selectedBaja.usufinal || '',
        articulos: articlesToUse.map(art => ({
          id_inv: art.num_inventario,
          descripcion: art.descripcion,
          rubro: art.rubro,
          estado: art.condicion,
          origen: art.origen,
          folio_baja: art.folio_baja, // Keep individual folio_baja for each article
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
    loadFirmas,
  };
}
