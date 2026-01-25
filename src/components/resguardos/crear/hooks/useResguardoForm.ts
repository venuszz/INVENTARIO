/**
 * Custom hook for managing resguardo form state
 * 
 * Manages form fields: folio, directorId, area, puesto, resguardante
 */

import { useState, useCallback, useMemo } from 'react';
import type { ResguardoForm } from '../types';

export interface UseResguardoFormReturn {
  formData: ResguardoForm;
  setFormData: React.Dispatch<React.SetStateAction<ResguardoForm>>;
  updateField: (field: keyof ResguardoForm, value: string) => void;
  resetForm: () => void;
  isFormValid: boolean;
}

/**
 * Hook for managing resguardo form state
 * 
 * @param initialFolio - Initial folio value
 * @returns Object containing form data, update functions, and validation state
 */
export function useResguardoForm(initialFolio: string): UseResguardoFormReturn {
  const [formData, setFormData] = useState<ResguardoForm>({
    folio: initialFolio,
    directorId: '',
    area: '',
    puesto: '',
    resguardante: '',
  });

  const updateField = useCallback((field: keyof ResguardoForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      folio: initialFolio,
      directorId: '',
      area: '',
      puesto: '',
      resguardante: '',
    });
  }, [initialFolio]);

  const isFormValid = useMemo(() => {
    return (
      formData.directorId.trim() !== '' &&
      formData.area.trim() !== '' &&
      formData.puesto.trim() !== ''
    );
  }, [formData.directorId, formData.area, formData.puesto]);

  return {
    formData,
    setFormData,
    updateField,
    resetForm,
    isFormValid,
  };
}
