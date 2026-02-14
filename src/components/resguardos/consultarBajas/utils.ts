/**
 * Get background color class for article count badge
 */
export function getItemCountBgColor(count: number): string {
  switch (count) {
    case 0: return 'bg-gray-900/40 text-gray-400 border border-gray-800';
    case 1: return 'bg-red-900/20 text-red-300 border border-red-900';
    case 2:
    case 3:
    case 4: return 'bg-red-800/40 text-red-300 border border-red-800';
    case 5:
    case 6:
    case 7:
    case 8:
    case 9: return 'bg-red-800/60 text-red-200 border border-red-700';
    default: return 'bg-red-700/60 text-red-100 border border-red-600';
  }
}

/**
 * Format date from ISO to DD/MM/YYYY
 */
export function formatDate(isoDate: string): string {
  return isoDate.slice(0, 10).split('-').reverse().join('/');
}
