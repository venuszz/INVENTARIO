'use client';

import { motion } from 'framer-motion';
import { Edit, Trash2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { AreaChip } from './AreaChip';
import type { DirectorioWithStats } from '../types';

interface DirectorioCardProps {
  employee: DirectorioWithStats;
  highlightedAreas: Set<number>;
  onEdit: (employee: DirectorioWithStats) => void;
  onDelete: (employee: DirectorioWithStats) => void;
}

/**
 * Individual employee card component with edit and delete actions
 */
export function DirectorioCard({ 
  employee, 
  highlightedAreas, 
  onEdit, 
  onDelete 
}: DirectorioCardProps) {
  const { isDarkMode } = useTheme();
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        layout: { type: 'spring', stiffness: 350, damping: 30 },
        opacity: { duration: 0.2 }
      }}
      whileHover={{ scale: 1.005 }}
      className={`
        p-4 rounded-lg border transition-colors duration-200
        ${isDarkMode 
          ? 'bg-black border-white/10 hover:border-white/20' 
          : 'bg-white border-black/10 hover:border-black/20'
        }
      `}
      role="listitem"
      id={`employee-${employee.id_directorio}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Employee name and position */}
          <div className="mb-2">
            <h3 className={`text-base font-medium truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {employee.nombre || 'Sin nombre'}
            </h3>
            {employee.puesto && (
              <p className={`text-sm truncate ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                {employee.puesto}
              </p>
            )}
          </div>

          {/* Areas */}
          {employee.areas.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {employee.areas.map((area) => (
                <AreaChip
                  key={area.id_area}
                  area={area}
                  isHighlighted={highlightedAreas.has(area.id_area)}
                />
              ))}
            </div>
          )}

          {/* Statistics */}
          <div className={`mt-3 flex gap-4 text-xs ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
            <span>
              Resguardos: <strong className={isDarkMode ? 'text-white/70' : 'text-black/70'}>{employee.stats.resguardos}</strong>
            </span>
            <span>
              Bienes: <strong className={isDarkMode ? 'text-white/70' : 'text-black/70'}>{employee.stats.bienesACargo}</strong>
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(employee)}
            className={`
              p-2 rounded-md transition-colors
              ${isDarkMode 
                ? 'bg-white/5 hover:bg-white/10 text-white/70' 
                : 'bg-black/5 hover:bg-black/10 text-black/70'
              }
            `}
            aria-label={`Editar ${employee.nombre}`}
            title="Editar"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(employee)}
            className={`
              p-2 rounded-md transition-colors hover:bg-red-500/10
              ${isDarkMode 
                ? 'bg-white/5 text-white/70 hover:text-red-400' 
                : 'bg-black/5 text-black/70 hover:text-red-600'
              }
            `}
            aria-label={`Eliminar ${employee.nombre}`}
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
