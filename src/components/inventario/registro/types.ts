import { ChangeEvent, FocusEvent, FormEvent } from 'react';

// Core data types
export type Estado = string;
export type Estatus = string;
export type Institucion = 'INEA' | 'ITEA';

// Form data interface
export interface FormData {
  id_inv: string;
  rubro: string;
  descripcion: string;
  valor: string;
  f_adq: string;
  formadq: string;
  proveedor: string;
  factura: string;
  ubicacion_es: string;
  ubicacion_mu: string;
  ubicacion_no: string;
  estado: Estado;
  estatus: Estatus;
  area: string;
  usufinal: string;
  fechabaja: string;
  causadebaja: string;
  resguardante: string;
  image_path: string;
}

// Filter options interface
export interface FilterOptions {
  estados: string[];
  estatus: string[];
  areas: string[];
  rubros: string[];
  formasAdquisicion: string[];
  causasBaja: string[];
  usuarios: { nombre: string; area: string }[];
}

// Message interface
export interface Message {
  type: 'success' | 'error' | '';
  text: string;
}

// Directorio interface
export interface Directorio {
  id_directorio: number;
  nombre: string;
  area: string | null;
  puesto: string | null;
}

// Area interface
export interface Area {
  id_area: number;
  nombre: string;
}

// Component prop interfaces

export interface FormHeaderProps {
  currentStep: number;
  isDarkMode: boolean;
}

export interface FormStepIndicatorProps {
  currentStep: number;
  isStepComplete: (step: number) => boolean;
  onStepClick: (step: number) => void;
  isDarkMode: boolean;
}

export interface FormNavigationProps {
  currentStep: number;
  isStepComplete: (step: number) => boolean;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: (e: FormEvent) => void;
  isDarkMode: boolean;
}

export interface Step1Props {
  formData: FormData;
  filterOptions: FilterOptions;
  touched: Record<string, boolean>;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onBlur: (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onCurrencyChange: (e: ChangeEvent<HTMLInputElement>) => void;
  isFieldValid: (fieldName: string) => boolean;
  isDarkMode: boolean;
}

export interface Step2Props {
  formData: FormData;
  filterOptions: FilterOptions;
  touched: Record<string, boolean>;
  showAreaWarning?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onBlur: (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onDirectorSelect: (nombre: string) => void;
  onAreaWarningClick?: () => void;
  isFieldValid: (fieldName: string) => boolean;
  isDarkMode: boolean;
}

export interface Step3Props {
  formData: FormData;
  institucion: Institucion;
  imagePreview: string | null;
  touched: Record<string, boolean>;
  onChange: (e: ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur: (e: FocusEvent<HTMLTextAreaElement>) => void;
  onImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
  onInstitucionChange: (value: Institucion) => void;
  isFieldValid: (fieldName: string) => boolean;
  isDarkMode: boolean;
}

export interface DirectorInfoModalProps {
  isOpen: boolean;
  director: Directorio | null;
  areaValue: string;
  isSaving: boolean;
  onAreaChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

export interface AreaSelectionModalProps {
  isOpen: boolean;
  director: Directorio | null;
  areas: Area[];
  onSelect: (areaName: string) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}
