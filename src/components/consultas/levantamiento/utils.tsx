/**
 * Utility functions for the Levantamiento component
 * 
 * This file contains helper functions for text processing, styling,
 * and data formatting used across the levantamiento component.
 */

import React from 'react';
import { ActiveFilter } from './types';

/**
 * Clean and normalize text for comparison
 * Removes accents, converts to lowercase, and trims whitespace
 * 
 * @param str - The string to clean
 * @returns Normalized string
 * 
 * @example
 * clean("Área") // returns "area"
 * clean("  JOSÉ  ") // returns "jose"
 */
export function clean(str: string): string {
  return (str || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/**
 * Get Tailwind CSS classes for origen badges based on theme
 * 
 * @param isDarkMode - Whether dark mode is enabled
 * @returns Object mapping origen values to CSS classes
 */
export function getOrigenColors(isDarkMode: boolean): Record<string, string> {
  return {
    INEA: isDarkMode 
      ? 'bg-white/90 text-gray-900 border border-white/80' 
      : 'bg-blue-50 text-blue-900 border border-blue-200',
    ITEA: isDarkMode 
      ? 'bg-white/80 text-gray-900 border border-white/70' 
      : 'bg-green-50 text-green-900 border border-green-200',
    TLAXCALA: isDarkMode 
      ? 'bg-white/70 text-gray-900 border border-white/60' 
      : 'bg-purple-50 text-purple-900 border border-purple-200',
  };
}

/**
 * Get Tailwind CSS classes for estatus badges based on theme
 * 
 * @param isDarkMode - Whether dark mode is enabled
 * @returns Object mapping estatus values to CSS classes
 */
export function getEstatusColors(isDarkMode: boolean): Record<string, string> {
  return {
    ACTIVO: isDarkMode 
      ? 'bg-white/90 text-gray-900 border border-white/80' 
      : 'bg-green-50 text-green-900 border border-green-200',
    INACTIVO: isDarkMode 
      ? 'bg-white/80 text-gray-900 border border-white/70' 
      : 'bg-red-50 text-red-900 border border-red-200',
    'NO LOCALIZADO': isDarkMode 
      ? 'bg-white/70 text-gray-900 border border-white/60' 
      : 'bg-yellow-50 text-yellow-900 border border-yellow-200',
    DEFAULT: isDarkMode 
      ? 'bg-white/60 text-gray-900 border border-white/50' 
      : 'bg-gray-50 text-gray-900 border border-gray-200'
  };
}

/**
 * Truncate text to a specified length with ellipsis
 * 
 * @param text - The text to truncate
 * @param length - Maximum length before truncation (default: 50)
 * @returns Truncated text with ellipsis if needed
 * 
 * @example
 * truncateText("This is a very long description", 10) // returns "This is a ..."
 * truncateText("Short", 10) // returns "Short"
 * truncateText(null, 10) // returns ""
 */
export function truncateText(text: string | null, length: number = 50): string {
  if (!text) return '';
  return text.length > length ? `${text.substring(0, length)}...` : text;
}

/**
 * Get human-readable label for filter type
 * 
 * @param type - The filter type
 * @returns Localized label for the filter type
 */
export function getTypeLabel(type: ActiveFilter['type']): string {
  switch (type) {
    case 'id': return 'ID';
    case 'area': return 'ÁREA';
    case 'usufinal': return 'DIRECTOR';
    case 'resguardante': return 'RESGUARDANTE';
    case 'descripcion': return 'DESCRIPCIÓN';
    case 'rubro': return 'RUBRO';
    case 'estado': return 'ESTADO';
    case 'estatus': return 'ESTATUS';
    default: return '';
  }
}

/**
 * Get icon component for filter type
 * Returns a span element with abbreviated text
 * 
 * @param type - The filter type
 * @returns JSX element with filter type abbreviation
 */
export function getTypeIcon(type: ActiveFilter['type']): React.ReactElement | null {
  const baseClass = "h-4 w-6 inline-flex items-center justify-center font-medium text-[10px] opacity-80";
  
  switch (type) {
    case 'id': return <span className={baseClass}>ID</span>;
    case 'area': return <span className={baseClass}>AR</span>;
    case 'usufinal': return <span className={baseClass}>US</span>;
    case 'resguardante': return <span className={baseClass}>RE</span>;
    case 'descripcion': return <span className={baseClass}>DE</span>;
    case 'rubro': return <span className={baseClass}>RU</span>;
    case 'estado': return <span className={baseClass}>ED</span>;
    case 'estatus': return <span className={baseClass}>ES</span>;
    default: return null;
  }
}
