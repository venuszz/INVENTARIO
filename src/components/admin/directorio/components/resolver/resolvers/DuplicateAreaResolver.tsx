'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Package, FileText, ChevronRight } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import type { InconsistencyWithStats } from '../../../types/resolver';

interface DuplicateAreaResolverProps {
  inconsistency: InconsistencyWithStats;
  onResolve: () => Promise<void>;
  onSelectionChange?: (directorId: number) => void;
}

export function DuplicateAreaResolver({
  inconsistency,
  onResolve,
  onSelectionChange,
}: DuplicateAreaResolverProps) {
  const { isDarkMode } = useTheme();
  const [selectedDirectorId, setSelectedDirectorId] = useState<number | null>(null);

  const handleSelect = (directorId: number) => {
    // Permitir des-seleccionar si se hace clic en el mismo director
    const newSelection = selectedDirectorId === directorId ? null : directorId;
    setSelectedDirectorId(newSelection);
    if (newSelection !== null) {
      onSelectionChange?.(newSelection);
    }
  };

  if (!inconsistency.directors || inconsistency.directors.length === 0) {
    return <div>No hay directores disponibles</div>;
  }

  // Find recommended director (most bienes + resguardos)
  const recommended = inconsistency.directors.reduce((best, current) => {
    const bestTotal = (best.stats?.bienesCount || 0) + (best.stats?.resguardosCount || 0);
    const currentTotal = (current.stats?.bienesCount || 0) + (current.stats?.resguardosCount || 0);
    return currentTotal > bestTotal ? current : best;
  }, inconsistency.directors[0]);

  // Calculate total stats for the area
  const totalBienes = inconsistency.directors.reduce((sum, dir) => sum + (dir.stats?.bienesCount || 0), 0);
  const totalResguardos = inconsistency.directors.reduce((sum, dir) => sum + (dir.stats?.resguardosCount || 0), 0);

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Description */}
      <div className={`p-4 rounded-lg border ${
        isDarkMode 
          ? 'bg-neutral-900/50 border-neutral-700' 
          : 'bg-neutral-50 border-neutral-200'
      }`}>
        <p className={`text-sm ${isDarkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
          El área <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{inconsistency.areaName}</span> está asignada a múltiples directores.
          Selecciona el director que debe mantener esta área.
        </p>
      </div>

      {/* Directors List - Más grande y espaciado */}
      <div className="flex-1 flex flex-col space-y-4">
        <h4 className={`text-xs font-medium uppercase tracking-wider ${
          isDarkMode ? 'text-neutral-500' : 'text-neutral-500'
        }`}>
          Selecciona el director a mantener
        </h4>

        <div className="flex-1 space-y-4 overflow-y-auto pr-3 pl-1">
          {inconsistency.directors.map((director, index) => {
            const isSelected = selectedDirectorId === director.id;
            const isRecommended = director.id === recommended.id;
            const bienesCount = director.stats?.bienesCount || 0;
            const resguardosCount = director.stats?.resguardosCount || 0;
            const uniqueKey = `director-${director.id || index}-${director.nombre}`;

            return (
              <motion.button
                key={uniqueKey}
                onClick={() => handleSelect(director.id)}
                whileHover={{ scale: 1.002 }}
                whileTap={{ scale: 0.998 }}
                className={`
                  w-full p-5 rounded-lg border transition-all text-left
                  ${isSelected
                    ? isDarkMode
                      ? 'border-neutral-400 bg-neutral-800/50'
                      : 'border-neutral-400 bg-neutral-100'
                    : isDarkMode
                      ? 'border-neutral-700 hover:border-neutral-600 bg-neutral-900/30'
                      : 'border-neutral-300 hover:border-neutral-400 bg-white'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Radio Button */}
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`
                      w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                      ${isSelected
                        ? isDarkMode
                          ? 'border-neutral-300 bg-neutral-300'
                          : 'border-neutral-700 bg-neutral-700'
                        : isDarkMode
                          ? 'border-neutral-600'
                          : 'border-neutral-400'
                      }
                    `}>
                      {isSelected && (
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          isDarkMode ? 'bg-neutral-900' : 'bg-white'
                        }`} />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <User className={`w-3.5 h-3.5 ${
                        isDarkMode ? 'text-neutral-500' : 'text-neutral-500'
                      }`} />
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-neutral-100' : 'text-neutral-900'
                      }`}>
                        {director.nombre}
                      </span>
                      {isRecommended && (
                        <span className={`px-1.5 py-0.5 text-xs rounded border ${
                          isDarkMode 
                            ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          Recomendado
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className={`flex items-center gap-3 text-xs ${
                      isDarkMode ? 'text-neutral-500' : 'text-neutral-500'
                    }`}>
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        <span>{bienesCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{resguardosCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className={`
                    w-4 h-4 flex-shrink-0 transition-opacity
                    ${isSelected 
                      ? isDarkMode 
                        ? 'opacity-100 text-neutral-400' 
                        : 'opacity-100 text-neutral-600'
                      : 'opacity-0'
                    }
                  `} />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Info */}
      {recommended && (
        <div className={`p-3 rounded-lg border ${
          isDarkMode 
            ? 'bg-neutral-900/50 border-neutral-700' 
            : 'bg-neutral-50 border-neutral-200'
        }`}>
          <p className={`text-xs ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
            💡 Se recomienda mantener al director con más bienes y resguardos.
          </p>
        </div>
      )}
    </div>
  );
}
