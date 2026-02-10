/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Get icon for a specific type (placeholder for future use)
 */
export function getTypeIcon(type: string) {
  // Placeholder function for future icon mapping
  return null;
}

/**
 * Format date to readable format
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}
