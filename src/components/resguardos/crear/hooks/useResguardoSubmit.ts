/**
 * Custom hook for handling resguardo submission and PDF generation
 */

import { useState, useCallback } from 'react';
import { useSession } from '@/hooks/useSession';
import { useResguardosStore } from '@/stores/resguardosStore';
import { validateResguardoConsistency } from '../utils';
import type { ResguardoForm, Mueble, Directorio, PdfData } from '../types';

export interface UseResguardoSubmitReturn {
  handleSubmit: () => Promise<void>;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  pdfData: PdfData | null;
  showPDFButton: boolean;
  setShowPDFButton: (show: boolean) => void;
  generatePDF: () => Promise<void>;
  generatingPDF: boolean;
}

/**
 * Hook for handling resguardo submission
 * 
 * @param formData - Form data (folio will be replaced with generated one)
 * @param selectedMuebles - Selected items
 * @param directorio - Array of directors
 * @param generateFolio - Function to generate the actual folio
 * @param onSuccess - Callback on successful submission
 * @returns Object containing submission state and functions
 */
export function useResguardoSubmit(
  formData: ResguardoForm,
  selectedMuebles: Mueble[],
  directorio: Directorio[],
  generateFolio: () => Promise<string | null>,
  onSuccess: () => void
): UseResguardoSubmitReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<PdfData | null>(null);
  const [showPDFButton, setShowPDFButton] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  const { user } = useSession();
  const addResguardoBatch = useResguardosStore(state => state.addResguardoBatch);
  
  const handleSubmit = useCallback(async () => {
    console.log('🚀 [RESGUARDO] Iniciando handleSubmit');
    console.log('📋 [RESGUARDO] Validación de formulario:', { formData, selectedMueblesCount: selectedMuebles.length });

    try {
      setLoading(true);
      console.log('⏳ [RESGUARDO] Loading activado');

      // VALIDACIÓN: Verificar consistencia de área y director
      console.log('🔍 [RESGUARDO] Validando consistencia de área y director...');
      const validation = validateResguardoConsistency(selectedMuebles);
      
      if (!validation.valid) {
        console.error('❌ [RESGUARDO] Validación fallida:', validation.error);
        setError(validation.error || 'Error de validación');
        setLoading(false);
        return;
      }
      
      console.log('✅ [RESGUARDO] Validación exitosa:', {
        id_area: validation.id_area,
        id_directorio: validation.id_directorio
      });

      // Generate actual folio NOW (this increments the counter)
      const actualFolio = await generateFolio();
      
      if (!actualFolio) {
        setError('No se pudo generar el folio');
        return;
      }

      // Validate user session
      if (!user || !user.id) {
        console.error('❌ [RESGUARDO] No hay usuario en sesión');
        throw new Error('No se pudo obtener el usuario actual. Por favor, inicia sesión nuevamente.');
      }
      console.log('✅ [RESGUARDO] Usuario de sesión:', { id: user.id, email: user.email, provider: user.oauthProvider });

      console.log('📝 [RESGUARDO] Consultando firmas...');
      const firmasResponse = await fetch('/api/supabase-proxy?target=' + encodeURIComponent('/rest/v1/firmas?select=*&order=id.asc'), {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!firmasResponse.ok) {
        console.error('❌ [RESGUARDO] Error al consultar firmas');
        throw new Error('Error al consultar firmas');
      }

      const firmasData = await firmasResponse.json();
      console.log('✅ [RESGUARDO] Firmas obtenidas:', firmasData?.length || 0);

      setShowPDFButton(true);
      console.log('📄 [RESGUARDO] Botón PDF activado');

      const directorNombre = directorio.find(d => d.id_directorio.toString() === formData.directorId)?.nombre?.toUpperCase() || '';
      console.log('👤 [RESGUARDO] Director encontrado:', directorNombre);

      const pdfDataToSet = {
        folio: actualFolio,
        fecha: new Date().toLocaleDateString(),
        director: directorNombre,
        area: formData.area.trim().toUpperCase(),
        puesto: formData.puesto.trim().toUpperCase(),
        resguardante: formData.resguardante,
        articulos: selectedMuebles.map(m => ({
          id_inv: m.id_inv,
          descripcion: m.descripcion,
          rubro: m.rubro,
          estado: m.estado,
          origen: m.origen || null,
          resguardante: m.resguardanteAsignado || ''
        })),
        firmas: firmasData || []
      };
      console.log('📦 [RESGUARDO] PDF Data preparado:', pdfDataToSet);
      setPdfData(pdfDataToSet);

      console.log('💾 [RESGUARDO] Iniciando guardado de artículos...');
      
      // Prepare all resguardos data
      const resguardosData = selectedMuebles.map((mueble, index) => {
        const resguardanteToUse = mueble.resguardanteAsignado || formData.resguardante;

        console.log(`📦 [RESGUARDO] Artículo ${index + 1}/${selectedMuebles.length}:`, {
          id: mueble.id,
          id_inv: mueble.id_inv,
          resguardante: resguardanteToUse,
          director: directorNombre,
          area: formData.area,
          id_area: validation.id_area,
          origen: mueble.origen
        });

        // Map origen: TLAXCALA -> NO_LISTADO for database constraint
        const origenMapped = mueble.origen === 'TLAXCALA' ? 'NO_LISTADO' : (mueble.origen || 'INEA');

        return {
          folio: actualFolio,
          f_resguardo: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString(),
          id_directorio: parseInt(formData.directorId),
          id_mueble: mueble.id,
          origen: origenMapped,
          resguardante: resguardanteToUse,
          id_area: validation.id_area, // Incluir id_area en el payload
        };
      });

      console.log(`➕ [RESGUARDO] Insertando ${resguardosData.length} resguardos via API...`);

      // Call API route to insert resguardos securely
      const response = await fetch('/api/resguardos/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resguardos: resguardosData,
          userId: user.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [RESGUARDO] Error API response:', errorData);
        throw new Error(errorData.error || 'Failed to create resguardos');
      }

      const result = await response.json();
      console.log('✅ [RESGUARDO] Todos los artículos guardados exitosamente:', result);

      // Update store immediately with optimistic update
      try {
        if (result.data && Array.isArray(result.data)) {
          console.log('📦 [RESGUARDO] Actualizando store con', result.data.length, 'resguardos');
          addResguardoBatch(result.data);
        } else {
          console.warn('⚠️ [RESGUARDO] API did not return expected data format');
        }
      } catch (storeError) {
        console.error('⚠️ [RESGUARDO] Error updating store:', storeError);
        // Don't fail the operation, realtime will sync
      }

      sessionStorage.setItem('pdfDownloaded', 'false');
      console.log('💾 [RESGUARDO] SessionStorage actualizado');

      // Notification system removed - no longer needed

      console.log('🧹 [RESGUARDO] Limpiando formulario...');
      setSuccessMessage(`Resguardo ${actualFolio} creado correctamente con ${selectedMuebles.length} artículo(s)`);
      setTimeout(() => setSuccessMessage(null), 3000);

      console.log('✅ [RESGUARDO] Proceso completado exitosamente');
      onSuccess();

    } catch (err) {
      console.error('❌ [RESGUARDO] ERROR CRÍTICO:', err);
      console.error('📊 [RESGUARDO] Detalles del error:', {
        message: err instanceof Error ? err.message : 'Error desconocido',
        stack: err instanceof Error ? err.stack : undefined,
        error: err
      });
      setError('Error al guardar el resguardo');
    } finally {
      setLoading(false);
      console.log('🏁 [RESGUARDO] handleSubmit finalizado');
    }
  }, [formData, selectedMuebles, directorio, generateFolio, user, onSuccess]);

  const generatePDF = useCallback(async () => {
    setGeneratingPDF(true);
    try {
      if (pdfData) {
        // Import dynamically to avoid circular dependencies
        const { generateResguardoPDF } = await import('../../ResguardoPDFReport');
        await generateResguardoPDF(pdfData);
        sessionStorage.setItem('pdfDownloaded', 'true');
      }
    } catch (error) {
      setError('Error al generar el PDF');
    } finally {
      setGeneratingPDF(false);
      setShowPDFButton(false);
    }
  }, [pdfData]);

  return {
    handleSubmit,
    loading,
    error,
    successMessage,
    pdfData,
    showPDFButton,
    setShowPDFButton,
    generatePDF,
    generatingPDF,
  };
}
