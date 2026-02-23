'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Package, FileText, Trash2, X, Folder } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import type { InconsistencyWithStats } from '../../../types/resolver';

type ResolutionOption = 'remove_from_director' | 'delete_area' | 'keep';

interface EmptyAreaResolverProps {
  inconsistency: InconsistencyWithStats;
  onResolve: () => Promise<void>;
  onSelectionChange?: (option: ResolutionOption, directorId?: number) => void;
}

export function EmptyAreaResolver({
  inconsistency,
  onResolve,
  onSelectionChange,
}: EmptyAreaResolverProps) {
  const { isDarkMode } = useTheme();
  const [selectedOption, setSelectedOption] = useState<ResolutionOption | null>(null);
  const [selectedDirectorId, setSelectedDirectorId] = useState<number | null>(null);

  if (!inconsistency.directors || inconsistency.directors.length === 0) {
    return <div>No hay directores disponibles</div>;
  }

  const handleOptionSelect = (option: ResolutionOption) => {
    setSelectedOption(option);
    if (option === 'remove_from_director') {
      // Don't call onSelectionChange yet, wait for director selection
    } else {
      onSelectionChange?.(option);
    }
  };

  const handleDirectorSelect = (directorId: number) => {
    // Permitir des-seleccionar si se hace clic en el mismo director
    const newSelection = selectedDirectorId === directorId ? null : directorId;
    setSelectedDirectorId(newSelection);
  };

  const handleResolveWithDirector = () => {
    if (selectedOption === 'remove_from_director' && selectedDirectorId) {
      onSelectionChange?.(selectedOption, selectedDirectorId);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ gap: 'clamp(1rem, 1.5vw, 1.5rem)' }}>
      {/* Description - Más prominente */}
      <div className={`rounded-lg border ${
        isDarkMode 
          ? 'bg-neutral-900/50 border-neutral-700' 
          : 'bg-neutral-50 border-neutral-200'
      }`} style={{ padding: 'clamp(0.75rem, 1vw, 1rem)' }}>
        <p className={`${isDarkMode ? 'text-neutral-300' : 'text-neutral-700'}`} style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>
          El área <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{inconsistency.areaName}</span> tiene directores asignados
          pero no tiene bienes registrados.
        </p>
      </div>

      {/* Options - Más grandes */}
      <div className="flex-1 flex flex-col" style={{ gap: 'clamp(0.75rem, 1vw, 1rem)' }}>
        <h4 className={`font-medium uppercase tracking-wider ${
          isDarkMode ? 'text-neutral-500' : 'text-neutral-500'
        }`} style={{ fontSize: 'clamp(0.625rem, 0.75vw, 0.75rem)' }}>
          Selecciona una acción
        </h4>

        <div className="flex-1 overflow-y-auto" style={{ 
          gap: 'clamp(0.75rem, 1vw, 1rem)',
          display: 'flex',
          flexDirection: 'column',
          paddingRight: 'clamp(0.5rem, 0.75vw, 0.75rem)',
          paddingLeft: 'clamp(0.125rem, 0.25vw, 0.25rem)'
        }}>
          {/* Option 1: Remove from specific director */}
          <div className={`
            rounded-lg border transition-all
            ${selectedOption === 'remove_from_director'
              ? isDarkMode
                ? 'border-neutral-400 bg-neutral-800/50'
                : 'border-neutral-400 bg-neutral-100'
              : isDarkMode
                ? 'border-neutral-700 bg-neutral-900/30'
                : 'border-neutral-300 bg-white'
            }
          `}>
            <button
              onClick={() => setSelectedOption('remove_from_director')}
              className="w-full p-5 text-left"
            >
              <div className="flex items-start gap-3">
                <X className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
                }`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-neutral-100' : 'text-neutral-900'
                  }`}>
                    Remover área de un director
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    Selecciona el director del que deseas remover esta área
                  </p>
                  <span className={`inline-block mt-2 px-1.5 py-0.5 text-xs rounded border ${
                    isDarkMode 
                      ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    Recomendado
                  </span>
                </div>
              </div>
            </button>

            {selectedOption === 'remove_from_director' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4 space-y-3 pr-3"
              >
                {inconsistency.directors.map((director) => {
                  const isSelected = selectedDirectorId === director.id;
                  const bienesInOtherAreas = director.stats?.bienesCount || 0;
                  const resguardosInOtherAreas = director.stats?.resguardosCount || 0;

                  return (
                    <button
                      key={`director-select-${director.id}`}
                      onClick={() => handleDirectorSelect(director.id)}
                      className={`
                        w-full p-4 rounded-lg border transition-all text-left
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
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={`
                            w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors
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
                              <div className={`w-1 h-1 rounded-full ${
                                isDarkMode ? 'bg-neutral-900' : 'bg-white'
                              }`} />
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <User className={`w-3 h-3 ${
                              isDarkMode ? 'text-neutral-500' : 'text-neutral-500'
                            }`} />
                            <span className={`text-xs font-medium ${
                              isDarkMode ? 'text-neutral-100' : 'text-neutral-900'
                            }`}>
                              {director.nombre}
                            </span>
                          </div>

                          <div className={`flex items-center gap-2.5 text-xs ${
                            isDarkMode ? 'text-neutral-500' : 'text-neutral-500'
                          }`}>
                            <div className="flex items-center gap-1">
                              <Package className="w-2.5 h-2.5" />
                              <span>{bienesInOtherAreas}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="w-2.5 h-2.5" />
                              <span>{resguardosInOtherAreas}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}

                <button
                  onClick={handleResolveWithDirector}
                  disabled={!selectedDirectorId}
                  className={`w-full mt-2 px-4 py-2 text-xs font-medium text-white rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'bg-neutral-700 hover:bg-neutral-600' 
                      : 'bg-neutral-800 hover:bg-neutral-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Remover área del director seleccionado
                </button>
              </motion.div>
            )}
          </div>

          {/* Option 2: Delete Area */}
          <motion.button
            onClick={() => handleOptionSelect('delete_area')}
            whileHover={{ scale: 1.002 }}
            whileTap={{ scale: 0.998 }}
            className={`
              w-full p-5 rounded-lg border transition-all text-left
              ${selectedOption === 'delete_area'
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
              <Trash2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
              }`} />
              <div>
                <p className={`text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-neutral-100' : 'text-neutral-900'
                }`}>
                  Eliminar área completa
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Se eliminará el área de todos los directores
                </p>
              </div>
            </div>
          </motion.button>

          {/* Option 3: Keep */}
          <motion.button
            onClick={() => handleOptionSelect('keep')}
            whileHover={{ scale: 1.002 }}
            whileTap={{ scale: 0.998 }}
            className={`
              w-full p-5 rounded-lg border transition-all text-left
              ${selectedOption === 'keep'
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
              <Folder className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
              }`} />
              <div>
                <p className={`text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-neutral-100' : 'text-neutral-900'
                }`}>
                  Mantener como está
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  El área puede recibir bienes en el futuro
                </p>
              </div>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Directors List - Compacto al final */}
      <div className={`rounded-lg border ${
        isDarkMode 
          ? 'bg-neutral-900/50 border-neutral-700' 
          : 'bg-neutral-50 border-neutral-200'
      }`} style={{ padding: 'clamp(0.5rem, 0.75vw, 0.75rem)' }}>
        <h5 className={`font-medium uppercase tracking-wider ${
          isDarkMode ? 'text-neutral-500' : 'text-neutral-500'
        }`} style={{ 
          fontSize: 'clamp(0.625rem, 0.75vw, 0.75rem)',
          marginBottom: 'clamp(0.375rem, 0.5vw, 0.5rem)'
        }}>
          Directores asignados ({inconsistency.directors.length})
        </h5>
        <div className="flex flex-wrap" style={{ gap: 'clamp(0.25rem, 0.375vw, 0.375rem)' }}>
          {inconsistency.directors.map((director) => (
            <span 
              key={`director-chip-${director.id}`} 
              className={`inline-flex items-center rounded border ${
                isDarkMode 
                  ? 'bg-neutral-800 text-neutral-300 border-neutral-700' 
                  : 'bg-white text-neutral-700 border-neutral-300'
              }`}
              style={{ 
                gap: 'clamp(0.125rem, 0.25vw, 0.25rem)',
                padding: 'clamp(0.125rem, 0.125vw, 0.125rem) clamp(0.375rem, 0.5vw, 0.5rem)',
                fontSize: 'clamp(0.625rem, 0.75vw, 0.75rem)'
              }}
            >
              <User style={{ width: 'clamp(0.5rem, 0.625vw, 0.625rem)', height: 'clamp(0.5rem, 0.625vw, 0.625rem)' }} />
              {director.nombre}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
