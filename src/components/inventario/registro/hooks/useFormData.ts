import { useState, useCallback, ChangeEvent, FocusEvent, Dispatch, SetStateAction } from 'react';
import { FormData } from '../types';

interface UseFormDataReturn {
  formData: FormData;
  touched: Record<string, boolean>;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleCurrencyChange: (e: ChangeEvent<HTMLInputElement>) => void;
  setFormData: Dispatch<SetStateAction<FormData>>;
  setTouched: Dispatch<SetStateAction<Record<string, boolean>>>;
  resetForm: (defaultEstado: string, defaultEstatus: string) => void;
  isFieldValid: (fieldName: string) => boolean;
  isStepComplete: (step: number) => boolean;
  formatCurrency: (value: string) => string;
}

const initialFormData: FormData = {
  id_inv: '',
  rubro: '',
  descripcion: '',
  valor: '0.00',
  f_adq: '',
  formadq: '',
  proveedor: '',
  factura: '',
  ubicacion_es: '',
  ubicacion_mu: '',
  ubicacion_no: '',
  estado: '',
  estatus: '',
  area: '',
  usufinal: '',
  fechabaja: '',
  causadebaja: '',
  resguardante: '',
  image_path: '',
};

const requiredFields = {
  1: ['id_inv', 'rubro', 'valor', 'formadq', 'f_adq'],
  2: ['estatus', 'area', 'usufinal'],
  3: ['descripcion']
};

export function useFormData(defaultEstado: string = '', defaultEstatus: string = ''): UseFormDataReturn {
  const [formData, setFormData] = useState<FormData>({
    ...initialFormData,
    estado: defaultEstado,
    estatus: defaultEstatus
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const formatCurrency = useCallback((value: string): string => {
    const num = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(num) ? '' : new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(num);
  }, []);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Convert to uppercase for text inputs and textareas (but not selects or date inputs)
    let newValue = value;
    if (
      (e.target.tagName === 'INPUT' && e.target.getAttribute('type') !== 'date') ||
      e.target.tagName === 'TEXTAREA'
    ) {
      newValue = value.toUpperCase();
    }
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const handleCurrencyChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d.]/g, '');
    setFormData(prev => ({ ...prev, valor: raw }));
    setTouched(prev => ({ ...prev, valor: true }));
  }, []);

  const handleBlur = useCallback((e: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Format currency on blur if it's the valor field
    if (name === 'valor' && formData.valor) {
      const formatted = formatCurrency(formData.valor);
      setFormData(prev => ({ ...prev, valor: formatted }));
    }
  }, [formData.valor, formatCurrency]);

  const isFieldValid = useCallback((fieldName: string): boolean => {
    if (!touched[fieldName]) return true;
    
    const allRequiredFields = Object.values(requiredFields).flat();
    if (!allRequiredFields.includes(fieldName)) return true;
    
    return formData[fieldName as keyof FormData]?.trim() !== '';
  }, [formData, touched]);

  const isStepComplete = useCallback((step: number): boolean => {
    return requiredFields[step as keyof typeof requiredFields]
      .every(field => formData[field as keyof FormData]?.trim() !== '');
  }, [formData]);

  const resetForm = useCallback((defaultEstado: string, defaultEstatus: string) => {
    setFormData({
      ...initialFormData,
      estado: defaultEstado,
      estatus: defaultEstatus
    });
    setTouched({});
  }, []);

  return {
    formData,
    touched,
    handleChange,
    handleBlur,
    handleCurrencyChange,
    setFormData,
    setTouched,
    resetForm,
    isFieldValid,
    isStepComplete,
    formatCurrency
  };
}
