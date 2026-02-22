'use client';

import { useTheme } from '@/context/ThemeContext';

/**
 * LoadingSkeleton Component
 * 
 * Skeleton loading state for lazy-loaded components.
 * Provides a smooth loading experience while components are being loaded.
 */

export function LoadingSkeleton() {
  const { isDarkMode } = useTheme();

  return (
    <div className={`h-full overflow-y-auto p-4 md:p-8 ${
      isDarkMode 
        ? 'bg-black text-white'
        : 'bg-white text-black'
    }`}>
      <div className="w-full max-w-7xl mx-auto pb-8 animate-pulse">
        {/* Header Skeleton */}
        <div className={`mb-8 pb-6 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
          <div className={`h-8 w-64 rounded-lg mb-2 ${
            isDarkMode ? 'bg-white/10' : 'bg-black/10'
          }`} />
          <div className={`h-4 w-48 rounded-lg ${
            isDarkMode ? 'bg-white/5' : 'bg-black/5'
          }`} />
        </div>

        {/* Content Skeleton */}
        <div className="space-y-4">
          {/* Search bar skeleton */}
          <div className={`h-10 w-full rounded-lg ${
            isDarkMode ? 'bg-white/10' : 'bg-black/10'
          }`} />

          {/* Cards skeleton */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i}
              className={`h-24 w-full rounded-lg ${
                isDarkMode ? 'bg-white/5' : 'bg-black/5'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
