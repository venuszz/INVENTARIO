'use client';

import { useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import type { InconsistencyWithStats } from '../../../types/resolver';

interface EmptyDirectorResolverProps {
  inconsistency: InconsistencyWithStats;
  onResolve: () => Promise<void>;
  onSelectionChange?: (option: 'delete_all') => void;
}

export function EmptyDirectorResolver({
  inconsistency,
  onSelectionChange,
}: EmptyDirectorResolverProps) {
  const { isDarkMode } = useTheme();

  // Automáticamente seleccionar la opción de eliminar
  useEffect(() => {
    onSelectionChange?.('delete_all');
  }, [onSelectionChange]);

  if (!inconsistency.areas || inconsistency.areas.length === 0) {
    return <div>No hay áreas disponibles</div>;
  }

  return (
    <div className="flex flex-col h-full justify-center items-center text-center space-y-6 px-4">
      {/* Icon */}
      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
        isDarkMode ? 'bg-red-500/10' : 'bg-red-50'
      }`}>
        <Trash2 className={`w-8 h-8 ${
          isDarkMode ? 'text-red-400' : 'text-red-600'
        }`} />
      </div>

      {/* Message */}
      <div className="space-y-3 max-w-md">
        <h4 className={`text-lg font-light tracking-tight ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}>
          Director sin bienes
        </h4>
        <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
          <span className={`font-medium ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}>
            {inconsistency.directorName}
          </span> no tiene bienes asignados en ninguna de sus {inconsistency.areas.length} {inconsistency.areas.length === 1 ? 'área' : 'áreas'}. 
          Se eliminará el director y se liberarán sus asignaciones.
        </p>
      </div>

      {/* Areas chips - más compacto */}
      <div className={`p-3 rounded-lg max-w-md ${
        isDarkMode ? 'bg-white/5' : 'bg-black/5'
      }`}>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {inconsistency.areas.map((area) => (
            <span 
              key={`area-chip-${area.id}`} 
              className={`px-2 py-0.5 rounded text-xs ${
                isDarkMode ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'
              }`}
            >
              {area.nombre}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
