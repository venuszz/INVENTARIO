/**
 * TableSkeleton component
 * Loading skeleton for the inventory table
 */

import { Loader2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

/**
 * Animated skeleton loader for table rows
 */
export function TableSkeleton() {
  const { isDarkMode } = useTheme();

  return (
    <tr>
      <td colSpan={6} className="px-6 py-16">
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Spinner */}
          <Loader2 
            size={32} 
            className={`animate-spin ${
              isDarkMode ? 'text-white/40' : 'text-black/40'
            }`}
          />
          
          {/* Loading text */}
          <div className="text-center">
            <p className={`text-sm font-medium ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}>
              Cargando inventario...
            </p>
          </div>

          {/* Skeleton rows */}
          <div className="w-full max-w-4xl space-y-2 mt-4">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className={`flex gap-3 animate-pulse ${
                  isDarkMode ? 'opacity-50' : 'opacity-40'
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`h-4 w-8 rounded ${
                  isDarkMode ? 'bg-white/10' : 'bg-black/10'
                }`} />
                <div className={`h-4 w-24 rounded ${
                  isDarkMode ? 'bg-white/10' : 'bg-black/10'
                }`} />
                <div className={`h-4 flex-1 rounded ${
                  isDarkMode ? 'bg-white/10' : 'bg-black/10'
                }`} />
                <div className={`h-4 w-20 rounded ${
                  isDarkMode ? 'bg-white/10' : 'bg-black/10'
                }`} />
                <div className={`h-4 w-20 rounded ${
                  isDarkMode ? 'bg-white/10' : 'bg-black/10'
                }`} />
                <div className={`h-4 w-16 rounded ${
                  isDarkMode ? 'bg-white/10' : 'bg-black/10'
                }`} />
              </div>
            ))}
          </div>
        </div>
      </td>
    </tr>
  );
}
