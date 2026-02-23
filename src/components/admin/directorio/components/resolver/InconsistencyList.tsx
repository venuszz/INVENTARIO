'use client';

import { motion } from 'framer-motion';
import { Check, AlertTriangle, UserX, FolderX } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import type { InconsistencyWithStats } from '../../types/resolver';

interface InconsistencyListProps {
  inconsistencies: InconsistencyWithStats[];
  selectedIndex: number;
  resolvedIds: Set<string>;
  onSelect: (index: number) => void;
}

const typeConfig = {
  duplicate_area: {
    icon: AlertTriangle,
    label: 'Áreas Duplicadas',
  },
  empty_director: {
    icon: UserX,
    label: 'Directores sin Bienes',
  },
  empty_area: {
    icon: FolderX,
    label: 'Áreas sin Bienes',
  },
};

export function InconsistencyList({
  inconsistencies,
  selectedIndex,
  resolvedIds,
  onSelect,
}: InconsistencyListProps) {
  const { isDarkMode } = useTheme();
  
  // Group inconsistencies by type
  const grouped = inconsistencies.reduce((acc, inc, index) => {
    if (!acc[inc.type]) {
      acc[inc.type] = [];
    }
    acc[inc.type].push({ ...inc, originalIndex: index });
    return acc;
  }, {} as Record<string, Array<InconsistencyWithStats & { originalIndex: number }>>);

  return (
    <div style={{ padding: 'clamp(0.75rem, 1vw, 1rem)', gap: 'clamp(0.75rem, 1vw, 1rem)', display: 'flex', flexDirection: 'column' }}>
      {Object.entries(grouped).map(([type, items]) => {
        const config = typeConfig[type as keyof typeof typeConfig];
        const Icon = config.icon;

        return (
          <div key={type} style={{ gap: 'clamp(0.375rem, 0.5vw, 0.5rem)', display: 'flex', flexDirection: 'column' }}>
            {/* Group Header */}
            <div className={`flex items-center font-medium ${
              isDarkMode ? 'text-white/70' : 'text-black/70'
            }`} style={{ 
              gap: 'clamp(0.375rem, 0.5vw, 0.5rem)',
              padding: 'clamp(0.375rem, 0.5vw, 0.5rem) clamp(0.5rem, 0.75vw, 0.75rem)',
              fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)'
            }}>
              <Icon className={`${isDarkMode ? 'text-white/50' : 'text-black/50'}`} style={{ width: 'clamp(0.75rem, 1vw, 1rem)', height: 'clamp(0.75rem, 1vw, 1rem)' }} />
              <span>{config.label}</span>
              <span className={`ml-auto ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} style={{ fontSize: 'clamp(0.625rem, 0.75vw, 0.75rem)' }}>
                {items.length}
              </span>
            </div>

            {/* Items */}
            <div style={{ gap: 'clamp(0.25rem, 0.25vw, 0.25rem)', display: 'flex', flexDirection: 'column' }}>
              {items.map((item, idx) => {
                const isSelected = item.originalIndex === selectedIndex;
                const isResolved = resolvedIds.has(item.id);
                const uniqueKey = `${type}-${item.id}-${item.originalIndex}`;

                return (
                  <motion.button
                    key={uniqueKey}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: idx * 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    onClick={() => !isResolved && onSelect(item.originalIndex)}
                    disabled={isResolved}
                    className={`
                      w-full text-left rounded-lg transition-all
                      ${isSelected && !isResolved
                        ? isDarkMode
                          ? 'bg-white/5 border-2 border-white/20'
                          : 'bg-black/5 border-2 border-black/20'
                        : isDarkMode
                          ? 'border-2 border-transparent hover:bg-white/5'
                          : 'border-2 border-transparent hover:bg-black/5'
                      }
                      ${isResolved ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    style={{ padding: 'clamp(0.5rem, 0.75vw, 0.75rem)' }}
                    aria-selected={isSelected}
                    aria-label={`Inconsistencia: ${item.areaName || item.directorName}`}
                  >
                    <div className="flex items-start" style={{ gap: 'clamp(0.5rem, 0.75vw, 0.75rem)' }}>
                      {/* Icon or Check */}
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        isDarkMode ? 'bg-white/10' : 'bg-black/10'
                      }`}>
                        {isResolved ? (
                          <Check className={`w-3 h-3 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                        ) : (
                          <Icon className={`w-3 h-3 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isResolved ? 'line-through' : ''} ${
                          isDarkMode ? 'text-white' : 'text-black'
                        } truncate`}>
                          {item.areaName || item.directorName}
                        </p>
                        {item.type === 'duplicate_area' && item.directors && (
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                            {item.directors.length} directores
                          </p>
                        )}
                        {item.type === 'empty_director' && item.areas && (
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                            {item.areas.length} áreas
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
