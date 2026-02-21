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
    <div className="p-4 space-y-4">
      {Object.entries(grouped).map(([type, items]) => {
        const config = typeConfig[type as keyof typeof typeConfig];
        const Icon = config.icon;

        return (
          <div key={type} className="space-y-2">
            {/* Group Header */}
            <div className={`flex items-center gap-2 px-3 py-2 text-sm font-medium ${
              isDarkMode ? 'text-white/70' : 'text-black/70'
            }`}>
              <Icon className={`w-4 h-4 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`} />
              <span>{config.label}</span>
              <span className={`ml-auto text-xs ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                {items.length}
              </span>
            </div>

            {/* Items */}
            <div className="space-y-1">
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
                      w-full text-left px-3 py-3 rounded-lg transition-all
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
                    aria-selected={isSelected}
                    aria-label={`Inconsistencia: ${item.areaName || item.directorName}`}
                  >
                    <div className="flex items-start gap-3">
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
