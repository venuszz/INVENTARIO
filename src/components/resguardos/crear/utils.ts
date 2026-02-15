/**
 * Utility functions for Resguardos Crear component
 */

import { colorPaletteDark, colorPaletteLight } from './constants';
import type { ActiveFilter } from './types';

/**
 * Generates a consistent color class for a given value based on theme
 * Uses a hash function to ensure the same value always gets the same color
 * 
 * @param value - The value to generate a color for
 * @param isDarkMode - Whether dark mode is active
 * @returns A Tailwind CSS class string for styling
 */
export function getColorClass(value: string | null | undefined, isDarkMode: boolean): string {
  if (!value) {
    return isDarkMode
      ? 'bg-gray-900/20 text-gray-300 border border-gray-900 hover:bg-gray-900/30'
      : 'bg-gray-100 text-gray-600 border border-gray-400 hover:bg-gray-200';
  }
  
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const palette = isDarkMode ? colorPaletteDark : colorPaletteLight;
  const idx = Math.abs(hash) % palette.length;
  return palette[idx];
}

/**
 * Returns an icon identifier for a given filter type
 * Used to display filter type badges in the UI
 * 
 * @param type - The filter type
 * @returns A string identifier for the icon
 */
export function getTypeIcon(type: ActiveFilter['type']): string {
  switch (type) {
    case 'id': return 'ID';
    case 'area': return 'AR';
    case 'director': return 'DI';
    case 'descripcion': return 'DE';
    case 'rubro': return 'RU';
    case 'estado': return 'ED';
    case 'estatus': return 'ES';
    default: return '';
  }
}

/**
 * Returns a human-readable label for a given filter type
 * 
 * @param type - The filter type
 * @returns A string label for the filter type
 */
export function getTypeLabel(type: ActiveFilter['type']): string {
  switch (type) {
    case 'id': return 'ID';
    case 'area': return 'ÁREA';
    case 'director': return 'DIRECTOR';
    case 'descripcion': return 'DESCRIPCIÓN';
    case 'rubro': return 'RUBRO';
    case 'estado': return 'ESTADO';
    case 'estatus': return 'ESTATUS';
    default: return '';
  }
}

/**
 * Validation result for resguardo consistency check
 */
export interface ResguardoValidationResult {
  valid: boolean;
  error?: string;
  id_area?: number;
  id_directorio?: number;
}

/**
 * Validates that all selected muebles have the same id_area and id_directorio
 * This ensures data consistency before creating a resguardo
 * 
 * @param muebles - Array of selected muebles
 * @returns Validation result with id_area and id_directorio if valid
 */
export function validateResguardoConsistency(muebles: any[]): ResguardoValidationResult {
  if (muebles.length === 0) {
    return { valid: false, error: 'No hay muebles seleccionados' };
  }

  // Get id_area and id_directorio from first mueble
  const firstMueble = muebles[0];
  const firstArea = firstMueble.area;
  const firstDirectorio = firstMueble.directorio;

  // Validate first mueble has area
  if (!firstArea || typeof firstArea !== 'object' || !firstArea.id_area) {
    return { 
      valid: false, 
      error: `El mueble ${firstMueble.id_inv || 'sin ID'} no tiene área asignada` 
    };
  }

  // Validate first mueble has director
  if (!firstDirectorio || typeof firstDirectorio !== 'object' || !firstDirectorio.id_directorio) {
    return { 
      valid: false, 
      error: `El mueble ${firstMueble.id_inv || 'sin ID'} no tiene director asignado` 
    };
  }

  const expectedAreaId = firstArea.id_area;
  const expectedDirectorId = firstDirectorio.id_directorio;
  const expectedAreaName = firstArea.nombre;
  const expectedDirectorName = firstDirectorio.nombre;

  // Validate all muebles have the same id_area and id_directorio
  for (let i = 1; i < muebles.length; i++) {
    const mueble = muebles[i];
    const area = mueble.area;
    const directorio = mueble.directorio;

    // Check area consistency
    if (!area || typeof area !== 'object' || area.id_area !== expectedAreaId) {
      const currentAreaName = area && typeof area === 'object' ? area.nombre : 'sin área';
      return {
        valid: false,
        error: `El mueble ${mueble.id_inv || 'sin ID'} pertenece a "${currentAreaName}" pero los demás pertenecen a "${expectedAreaName}". Todos los muebles deben pertenecer a la misma área.`
      };
    }

    // Check director consistency
    if (!directorio || typeof directorio !== 'object' || directorio.id_directorio !== expectedDirectorId) {
      const currentDirectorName = directorio && typeof directorio === 'object' ? directorio.nombre : 'sin director';
      return {
        valid: false,
        error: `El mueble ${mueble.id_inv || 'sin ID'} está asignado a "${currentDirectorName}" pero los demás están asignados a "${expectedDirectorName}". Todos los muebles deben pertenecer al mismo director.`
      };
    }
  }

  return {
    valid: true,
    id_area: expectedAreaId,
    id_directorio: expectedDirectorId
  };
}
