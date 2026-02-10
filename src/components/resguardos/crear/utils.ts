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
