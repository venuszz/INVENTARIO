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
    <div className="flex flex-col h-full justify-center items-center text-center" style={{ 
      gap: 'clamp(1rem, 1.5vw, 1.5rem)',
      padding: 'clamp(0.75rem, 1vw, 1rem)'
    }}>
      {/* Icon */}
      <div className={`rounded-full flex items-center justify-center ${
        isDarkMode ? 'bg-red-500/10' : 'bg-red-50'
      }`} style={{ 
        width: 'clamp(3rem, 4vw, 4rem)', 
        height: 'clamp(3rem, 4vw, 4rem)'
      }}>
        <Trash2 className={`${
          isDarkMode ? 'text-red-400' : 'text-red-600'
        }`} style={{ 
          width: 'clamp(1.5rem, 2vw, 2rem)', 
          height: 'clamp(1.5rem, 2vw, 2rem)'
        }} />
      </div>

      {/* Message */}
      <div className="max-w-md" style={{ gap: 'clamp(0.5rem, 0.75vw, 0.75rem)', display: 'flex', flexDirection: 'column' }}>
        <h4 className={`font-light tracking-tight ${
          isDarkMode ? 'text-white' : 'text-black'
        }`} style={{ fontSize: 'clamp(1rem, 1.125vw, 1.125rem)' }}>
          Director sin bienes
        </h4>
        <p className={`${isDarkMode ? 'text-white/60' : 'text-black/60'}`} style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>
          <span className={`font-medium ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}>
            {inconsistency.directorName}
          </span> no tiene bienes asignados en ninguna de sus {inconsistency.areas.length} {inconsistency.areas.length === 1 ? 'área' : 'áreas'}. 
          Se eliminará el director y se liberarán sus asignaciones.
        </p>
      </div>

      {/* Areas chips - más compacto */}
      <div className={`rounded-lg max-w-md ${
        isDarkMode ? 'bg-white/5' : 'bg-black/5'
      }`} style={{ padding: 'clamp(0.5rem, 0.75vw, 0.75rem)' }}>
        <div className="flex flex-wrap justify-center" style={{ gap: 'clamp(0.25rem, 0.375vw, 0.375rem)' }}>
          {inconsistency.areas.map((area) => (
            <span 
              key={`area-chip-${area.id}`} 
              className={`rounded ${
                isDarkMode ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'
              }`}
              style={{ 
                padding: 'clamp(0.125rem, 0.125vw, 0.125rem) clamp(0.375rem, 0.5vw, 0.5rem)',
                fontSize: 'clamp(0.625rem, 0.75vw, 0.75rem)'
              }}
            >
              {area.nombre}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
