import { useTheme } from '@/context/ThemeContext';

/**
 * FieldSkeleton Component
 * 
 * Displays a skeleton loader for detail panel fields during sync operations.
 * Provides visual feedback when field data is being updated.
 */
export function FieldSkeleton() {
  const { isDarkMode } = useTheme();
  
  return (
    <div 
      className={`h-5 rounded animate-pulse ${
        isDarkMode ? 'bg-white/10' : 'bg-black/10'
      }`} 
      style={{ width: '60%' }} 
    />
  );
}
