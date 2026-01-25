/**
 * TableSkeleton component
 * Loading skeleton for the inventory table
 */

import { useTheme } from '@/context/ThemeContext';

/**
 * Animated skeleton loader for table rows
 */
export function TableSkeleton() {
  const { isDarkMode } = useTheme();

  return (
    <tr>
      <td colSpan={6} className={`px-6 py-24 text-center ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        <div className="flex flex-col items-center justify-center space-y-4 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-4 w-full max-w-3xl mx-auto">
              <div className={`h-6 w-10 rounded ${
                isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'
              }`} />
              <div className={`h-6 w-32 rounded ${
                isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'
              }`} />
              <div className={`h-6 w-40 rounded ${
                isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'
              }`} />
              <div className={`h-6 w-28 rounded ${
                isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'
              }`} />
              <div className={`h-6 w-28 rounded ${
                isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'
              }`} />
              <div className={`h-6 w-16 rounded ${
                isDarkMode ? 'bg-gray-800/60' : 'bg-gray-200'
              }`} />
            </div>
          ))}
        </div>
      </td>
    </tr>
  );
}
