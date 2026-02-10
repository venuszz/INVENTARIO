'use client';

import { useTheme } from '@/context/ThemeContext';

/**
 * Loading skeleton component
 */
export function LoadingState() {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div 
          key={i} 
          className={`animate-pulse h-24 rounded-lg ${
            isDarkMode ? 'bg-white/5' : 'bg-black/5'
          }`}
          role="status"
          aria-label="Cargando empleados"
        />
      ))}
    </div>
  );
}
