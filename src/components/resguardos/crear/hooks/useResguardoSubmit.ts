/**
 * Custom hook for handling resguardo submission and PDF generation
 */

import { useState, useCallback } from 'react';
import supabase from '@/app/lib/supabase/client';
import { useSession } from '@/hooks/useSession';
import { useNotifications } from '@/hooks/useNotifications';
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
 * @param formData - Form data
 * @param selectedMuebles - Selected items
 * @param directorio - Array of directors
 * @param onSuccess - Callback on successful submission
 * @returns Object containing submission state and functions
 */
export function useResguardoSubmit(
  formData: ResguardoForm,
  selectedMuebles: Mueble[],
  directorio: Directorio[],
  onSuccess: () => void
): UseResguardoSubmitReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<PdfData | null>(null);
  const [showPDFButton, setShowPDFButton] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  const { user } = useSession();
  const { createNotification } = useNotifications();

  const handleSubmit = useCallback(async () => {
    console.log('🚀 [RESGUARDO] Iniciando handleSubmit');
    console.log('📋 [RESGUARDO] Validación de formulario:', { formData, selectedMueblesCount: selectedMuebles.length });

    if (!formData.folio) {
      console.error('❌ [RESGUARDO] No hay folio');
      setError('No se pudo generar el folio');
      return;
    }

    try {
      setLoading(true);
      console.log('⏳ [RESGUARDO] Loading activado');

      // Validate user session
      if (!user || !user.id) {
        console.error('❌ [RESGUARDO] No hay usuario en sesión');
        throw new Error('No se pudo obtener el usuario actual. Por favor, inicia sesión nuevamente.');
      }
      console.log('✅ [RESGUARDO] Usuario de sesión:', { id: user.id, email: user.email, provider: user.oauthProvider });

      console.log('📝 [RESGUARDO] Consultando firmas...');
      const { data: firmasData, error: firmasError } = await supabase
        .from('firmas')
        .select('*')
        .order('id', { ascending: true });

      if (firmasError) {
        console.error('❌ [RESGUARDO] Error al consultar firmas:', firmasError);
        throw firmasError;
      }
      console.log('✅ [RESGUARDO] Firmas obtenidas:', firmasData?.length || 0);

      setShowPDFButton(true);
      console.log('📄 [RESGUARDO] Botón PDF activado');

      const directorNombre = directorio.find(d => d.id_directorio.toString() === formData.directorId)?.nombre?.toUpperCase() || '';
      console.log('👤 [RESGUARDO] Director encontrado:', directorNombre);

      const pdfDataToSet = {
        folio: formData.folio,
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
      const resguardoPromises = selectedMuebles.map(async (mueble, index) => {
        const tableName = mueble.origen === 'ITEA' ? 'mueblesitea' : mueble.origen === 'TLAXCALA' ? 'mueblestlaxcala' : 'muebles';
        const resguardanteToUse = mueble.resguardanteAsignado || formData.resguardante;

        console.log(`📦 [RESGUARDO] Artículo ${index + 1}/${selectedMuebles.length}:`, {
          id: mueble.id,
          id_inv: mueble.id_inv,
          tableName,
          resguardante: resguardanteToUse,
          director: directorNombre,
          area: formData.area
        });

        // UPDATE del mueble
        console.log(`🔄 [RESGUARDO] Actualizando ${tableName} id=${mueble.id}...`);
        const { error: updateError } = await supabase
          .from(tableName)
          .update({
            resguardante: resguardanteToUse,
            usufinal: directorNombre,
            area: formData.area
          })
          .eq('id', mueble.id);

        if (updateError) {
          console.error(`❌ [RESGUARDO] Error UPDATE ${tableName}:`, updateError);
          throw updateError;
        }
        console.log(`✅ [RESGUARDO] UPDATE exitoso en ${tableName}`);

        // INSERT en resguardos
        const resguardoData = {
          folio: formData.folio,
          f_resguardo: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString(),
          area_resguardo: formData.area,
          dir_area: directorNombre,
          num_inventario: mueble.id_inv,
          descripcion: mueble.descripcion,
          rubro: mueble.rubro,
          condicion: mueble.estado,
          usufinal: resguardanteToUse,
          puesto: formData.puesto,
          origen: mueble.origen || '',
          created_by: user.id,
        };
        console.log(`➕ [RESGUARDO] Insertando en resguardos:`, resguardoData);

        const { error: insertError } = await supabase.from('resguardos').insert(resguardoData);

        if (insertError) {
          console.error(`❌ [RESGUARDO] Error INSERT resguardos:`, insertError);
          throw insertError;
        }
        console.log(`✅ [RESGUARDO] INSERT exitoso en resguardos`);
      });

      console.log('⏳ [RESGUARDO] Esperando todas las promesas...');
      await Promise.all(resguardoPromises);
      console.log('✅ [RESGUARDO] Todos los artículos guardados exitosamente');

      sessionStorage.setItem('pdfDownloaded', 'false');
      console.log('💾 [RESGUARDO] SessionStorage actualizado');

      try {
        console.log('🔔 [RESGUARDO] Creando notificación...');
        const notificationDescription = `Se ha creado un nuevo resguardo para el área "${formData.area}" bajo la dirección de "${directorNombre}" con ${selectedMuebles.length} artículo(s).`;
        await createNotification({
          title: `Nuevo resguardo creado: ${formData.folio}`,
          description: notificationDescription,
          type: 'success',
          category: 'system',
          device: navigator.userAgent,
          importance: 'high',
          data: {
            changes: [
              `Área: ${formData.area}`,
              `Puesto: ${formData.puesto}`,
              `Resguardante: ${formData.resguardante}`,
              `Artículos: ${selectedMuebles.map(m => m.id_inv).join(', ')}`
            ],
            affectedTables: ['resguardos', 'muebles', 'mueblesitea']
          }
        });
        console.log('✅ [RESGUARDO] Notificación creada');
      } catch (notifErr) {
        console.warn('⚠️ [RESGUARDO] Error en notificación (no crítico):', notifErr);
      }

      console.log('🧹 [RESGUARDO] Limpiando formulario...');
      setSuccessMessage(`Resguardo ${formData.folio} creado correctamente con ${selectedMuebles.length} artículo(s)`);
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
  }, [formData, selectedMuebles, directorio, user, createNotification, onSuccess]);

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
