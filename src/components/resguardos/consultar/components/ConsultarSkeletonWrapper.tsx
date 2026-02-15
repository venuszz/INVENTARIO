'use client';

import { useTheme } from '@/context/ThemeContext';
import ConsultarSkeleton from './ConsultarSkeleton';

/**
 * Wrapper for ConsultarSkeleton that reads the theme from context
 * This is needed because Suspense fallback can't use hooks directly
 */
export default function ConsultarSkeletonWrapper() {
  const { isDarkMode } = useTheme();
  
  return <ConsultarSkeleton isDarkMode={isDarkMode} />;
}
