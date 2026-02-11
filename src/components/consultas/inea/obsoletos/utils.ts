/**
 * Utility functions for INEA Obsoletos component
 * 
 * This file contains helper functions for formatting, validation,
 * and data manipulation used throughout the obsolete items system.
 */

/**
 * Formats a date string to a localized format
 * 
 * @param dateStr - Date string in ISO format or YYYY-MM-DD
 * @returns Formatted date string in DD/MM/YYYY format or empty string if null
 * 
 * @example
 * formatDate('2024-01-15') // Returns '15/01/2024'
 * formatDate(null) // Returns ''
 */
export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '';
  
  // If the string is YYYY-MM-DD, display it as is (reversed)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr.split('-').reverse().join('/');
  }
  
  // Otherwise, try to parse and display in local format
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    // Adjust for timezone offset
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() + userTimezoneOffset);
    return localDate.toLocaleDateString('es-MX');
  }
  
  return dateStr;
};

/**
 * Truncates text to a specified length and adds ellipsis
 * 
 * @param text - Text to truncate
 * @param length - Maximum length before truncation (default: 50)
 * @returns Truncated text with ellipsis or "No Data" if null
 * 
 * @example
 * truncateText('This is a very long text', 10) // Returns 'This is a ...'
 * truncateText(null) // Returns 'No Data'
 */
export const truncateText = (text: string | null, length: number = 50): string => {
  if (!text) return "No Data";
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

/**
 * Formats a number as currency in Mexican Peso format
 * 
 * @param value - Numeric value to format
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1234.56) // Returns '$1,234.56'
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Formats a number with thousand separators
 * 
 * @param value - Numeric value to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(1234567) // Returns '1,234,567'
 * formatNumber(1234.567, 2) // Returns '1,234.57'
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Validates if a string is a valid UUID
 * 
 * @param uuid - String to validate
 * @returns True if valid UUID, false otherwise
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Generates page numbers for pagination with ellipsis
 * 
 * @param currentPage - Current active page
 * @param totalPages - Total number of pages
 * @param maxVisiblePages - Maximum number of page buttons to show (default: 5)
 * @returns Array of page numbers and ellipsis strings
 * 
 * @example
 * getPageNumbers(5, 10) // Returns [1, '...', 4, 5, 6, '...', 10]
 */
export const getPageNumbers = (
  currentPage: number,
  totalPages: number,
  maxVisiblePages: number = 5
): (number | string)[] => {
  const pages: (number | string)[] = [];

  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) {
      endPage = Math.min(totalPages - 1, 4);
    }

    if (currentPage >= totalPages - 2) {
      startPage = Math.max(2, totalPages - 3);
    }

    if (startPage > 2) {
      pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages - 1) {
      pages.push('...');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }
  }

  return pages;
};

/**
 * Validates image file type and size
 * 
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in megabytes (default: 5)
 * @returns Object with isValid flag and error message if invalid
 */
export const validateImageFile = (
  file: File,
  maxSizeMB: number = 5
): { isValid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Formato no válido. Use JPG, PNG, GIF o WebP'
    };
  }
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `El archivo es demasiado grande. Máximo ${maxSizeMB}MB.`
    };
  }
  
  return { isValid: true };
};
