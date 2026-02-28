import { useTheme } from '@/context/ThemeContext';

/**
 * CellSkeleton Component
 * 
 * Displays a skeleton loader for table cells during sync operations.
 * Provides visual feedback when data is being updated.
 */
export function CellSkeleton() {
  const { isDarkMode } = useTheme();
  
  return (
    <div 
      className={`h-4 rounded animate-pulse ${
        isDarkMode ? 'bg-white/10' : 'bg-black/10'
      }`} 
      style={{ width: '80%' }} 
    />
  );
}
