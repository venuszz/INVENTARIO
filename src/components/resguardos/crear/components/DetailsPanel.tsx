import React from 'react';
import { useTheme } from '@/context/ThemeContext';

/**
 * DetailsPanel Component
 * 
 * Container component for the right panel that displays resguardo form details
 * and selected items. Provides consistent styling and responsive layout.
 * 
 * @param children - Child components to render inside the panel
 */
interface DetailsPanelProps {
  children: React.ReactNode;
}

export default function DetailsPanel({ children }: DetailsPanelProps) {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`flex-1 p-4 border-t lg:border-t-0 lg:border-l flex flex-col lg:col-span-2 ${
        isDarkMode
          ? 'bg-white/[0.02] border-white/10'
          : 'bg-black/[0.02] border-black/10'
      }`}
    >
      {children}
    </div>
  );
}
