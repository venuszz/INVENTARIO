'use client';

import { Users } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface EmptyStateProps {
  message?: string;
  submessage?: string;
}

/**
 * Empty state component when no employees are found
 */
export function EmptyState({ 
  message = 'No hay empleados registrados',
  submessage = 'Agrega un nuevo empleado para comenzar'
}: EmptyStateProps) {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
        isDarkMode ? 'bg-white/5' : 'bg-black/5'
      }`}>
        <Users className={`w-8 h-8 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
      </div>
      <h3 className={`text-lg font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>
        {message}
      </h3>
      <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
        {submessage}
      </p>
    </div>
  );
}
