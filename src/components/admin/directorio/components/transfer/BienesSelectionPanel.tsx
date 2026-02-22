'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Search, Package } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import type { SelectedBien } from '../../types/transfer';

/**
 * BienesSelectionPanel Component
 * 
 * Central panel for selecting individual bienes for partial transfer.
 * Smooth, minimalist design with grayscale colors only.
 * 
 * Features:
 * - Searchbar for filtering bienes
 * - Checkbox selection
 * - Quick actions (Select all / Clear)
 * - Smooth animations
 * - Empty state
 */

interface Bien {
  id: string; // UUID string
  id_inv: string;
  descripcion: string;
  valor: number;
  id_area: number;
  source: 'inea' | 'itea' | 'no_listado';
}

interface BienesSelectionPanelProps {
  selectedSourceArea: number | null;
  bienes: Bien[];
  selectedBienes: SelectedBien[];
  onSelectBienes: (bienes: SelectedBien[]) => void;
  areaName?: string;
  onContinue?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function BienesSelectionPanel({
  selectedSourceArea,
  bienes,
  selectedBienes,
  onSelectBienes,
  areaName,
  onContinue,
  showBackButton = false,
  onBack,
}: BienesSelectionPanelProps) {
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get bienes for selected source area
  const areaBienes = useMemo(() => {
    if (!selectedSourceArea) return [];
    return bienes.filter(b => b.id_area === selectedSourceArea);
  }, [selectedSourceArea, bienes]);

  // Filter bienes by search query
  const filteredBienes = useMemo(() => {
    if (!searchQuery) return areaBienes;

    const query = searchQuery.toLowerCase();
    return areaBienes.filter(b =>
      b.id_inv.toLowerCase().includes(query) ||
      b.descripcion.toLowerCase().includes(query)
    );
  }, [areaBienes, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredBienes.length / itemsPerPage);
  const paginatedBienes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBienes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBienes, currentPage]);

  // Reset page when search changes or area changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSourceArea]);

  // Handle bien toggle
  const handleBienToggle = (bien: Bien) => {
    const isSelected = selectedBienes.some(b => b.id === bien.id && b.source === bien.source);

    if (isSelected) {
      const remainingBienes = selectedBienes.filter(b => !(b.id === bien.id && b.source === bien.source));
      onSelectBienes(remainingBienes);
    } else {
      const selectedBien: SelectedBien = {
        id: bien.id,
        id_inv: bien.id_inv,
        descripcion: bien.descripcion,
        valor: bien.valor,
        source: bien.source,
        id_area: bien.id_area,
      };
      onSelectBienes([...selectedBienes, selectedBien]);
    }
  };

  // Check if all area bienes are selected (for "Transfer complete area" button)
  const allAreaBienesSelected = useMemo(() => {
    if (areaBienes.length === 0) return false;
    return areaBienes.every(bien =>
      selectedBienes.some(b => b.id === bien.id && b.source === bien.source)
    );
  }, [areaBienes, selectedBienes]);

  // Check if all filtered bienes are selected
  const allFilteredSelected = useMemo(() => {
    if (filteredBienes.length === 0) return false;
    return filteredBienes.every(bien =>
      selectedBienes.some(b => b.id === bien.id && b.source === bien.source)
    );
  }, [filteredBienes, selectedBienes]);

  // Handle select all bienes
  const handleSelectAll = () => {
    const allBienes: SelectedBien[] = filteredBienes.map(b => ({
      id: b.id,
      id_inv: b.id_inv,
      descripcion: b.descripcion,
      valor: b.valor,
      source: b.source,
      id_area: b.id_area,
    }));
    onSelectBienes(allBienes);
  };

  // Handle clear all
  const handleClearAll = () => {
    onSelectBienes([]);
  };

  // Handle toggle all switch
  const handleToggleAll = () => {
    if (allFilteredSelected) {
      // When deselecting all, keep at least one selected to prevent panel from closing
      // Or simply clear all - the panel should stay open because selectedAreas is still set
      handleClearAll();
    } else {
      handleSelectAll();
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Bienes
          </h2>
          {selectedSourceArea && areaBienes.length > 0 && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'
              }`}>
              <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {selectedBienes.length}
              </span>
              <span className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                / {areaBienes.length} seleccionados
              </span>
            </div>
          )}
        </div>
        {areaName && (
          <div className={`text-sm mt-1 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
            {areaName}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 pb-20">
        <AnimatePresence mode="wait">
          {!selectedSourceArea ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'
                }`}>
                <Package className={`w-8 h-8 ${isDarkMode ? 'text-white/20' : 'text-black/20'}`} />
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                Selecciona un área para ver sus bienes
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="bienes-list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Search and Actions */}
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-white/30' : 'text-black/30'
                    }`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar..."
                    className={`
                      w-full pl-10 pr-4 py-2.5 rounded-lg
                      border transition-all duration-200
                      focus:outline-none focus:ring-1
                      ${isDarkMode
                        ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:ring-white/20 focus:border-white/20'
                        : 'border-black/10 bg-black/5 text-black placeholder:text-black/30 focus:ring-black/20 focus:border-black/20'
                      }
                    `}
                  />
                </div>

                {/* Select All Switch */}
                {areaBienes.length > 0 && (
                  <div className={`
                    flex items-center justify-between
                    px-4 py-3 rounded-lg
                    border transition-all duration-200
                    ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}
                  `}>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Seleccionar todos
                    </span>
                    <button
                      onClick={handleToggleAll}
                      className={`
                        relative w-11 h-6 rounded-full
                        transition-all duration-300 ease-in-out
                        focus:outline-none focus:ring-2 focus:ring-offset-2
                        ${allFilteredSelected
                          ? isDarkMode
                            ? 'bg-white focus:ring-white/30'
                            : 'bg-black focus:ring-black/30'
                          : isDarkMode
                            ? 'bg-white/20 focus:ring-white/30'
                            : 'bg-black/20 focus:ring-black/30'
                        }
                      `}
                      aria-label={allFilteredSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    >
                      <motion.div
                        className={`
                          absolute top-0.5 left-0.5
                          w-5 h-5 rounded-full
                          shadow-md
                          ${allFilteredSelected
                            ? isDarkMode ? 'bg-black' : 'bg-white'
                            : isDarkMode ? 'bg-white' : 'bg-white'
                          }
                        `}
                        animate={{
                          x: allFilteredSelected ? 20 : 0,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* Bienes List */}
              <div className="space-y-2">
                {paginatedBienes.map((bien, index) => {
                  const isSelected = selectedBienes.some(b => b.id === bien.id && b.source === bien.source);

                  return (
                    <motion.button
                      key={`bien-${bien.source}-${bien.id}-${bien.id_area}-${index}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02, duration: 0.2 }}
                      onClick={() => handleBienToggle(bien)}
                      className={`
                        w-full px-4 py-3 rounded-lg
                        border transition-all duration-200
                        text-left
                        focus:outline-none focus:ring-1
                        ${isSelected
                          ? isDarkMode
                            ? 'border-white/20 bg-white/5 ring-1 ring-white/10'
                            : 'border-black/20 bg-black/5 ring-1 ring-black/10'
                          : isDarkMode
                            ? 'border-white/10 hover:border-white/15 hover:bg-white/[0.02]'
                            : 'border-black/10 hover:border-black/15 hover:bg-black/[0.02]'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div className={`
                          w-4 h-4 rounded border-2 flex items-center justify-center mt-0.5
                          transition-all duration-200
                          ${isSelected
                            ? isDarkMode
                              ? 'border-white bg-white'
                              : 'border-black bg-black'
                            : isDarkMode
                              ? 'border-white/20'
                              : 'border-black/20'
                          }
                        `}>
                          {isSelected && (
                            <motion.svg
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              className={`w-3 h-3 ${isDarkMode ? 'text-black' : 'text-white'}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </motion.svg>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-sm mb-0.5 ${isDarkMode ? 'text-white' : 'text-black'
                            }`}>
                            {bien.id_inv}
                          </div>
                          <div className={`text-xs truncate mb-1.5 ${isDarkMode ? 'text-white/60' : 'text-black/60'
                            }`}>
                            {bien.descripcion}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-black/40'
                              }`}>
                              ${bien.valor.toLocaleString()}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-white/5 text-white/40' : 'bg-black/5 text-black/40'
                              }`}>
                              {bien.source.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-black/10'}">
                  <div className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs
                        transition-all duration-200
                        focus:outline-none focus:ring-1
                        ${currentPage === 1
                          ? isDarkMode
                            ? 'bg-white/5 text-white/30 cursor-not-allowed'
                            : 'bg-black/5 text-black/30 cursor-not-allowed'
                          : isDarkMode
                            ? 'bg-white/10 text-white hover:bg-white/15'
                            : 'bg-black/10 text-black hover:bg-black/15'
                        }
                      `}
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs
                        transition-all duration-200
                        focus:outline-none focus:ring-1
                        ${currentPage === totalPages
                          ? isDarkMode
                            ? 'bg-white/5 text-white/30 cursor-not-allowed'
                            : 'bg-black/5 text-black/30 cursor-not-allowed'
                          : isDarkMode
                            ? 'bg-white/10 text-white hover:bg-white/15'
                            : 'bg-black/10 text-black hover:bg-black/15'
                        }
                      `}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}

              {/* Empty Search Results */}
              {filteredBienes.length === 0 && searchQuery && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-center py-12 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}
                >
                  <div className="text-sm">No se encontraron bienes</div>
                  <div className="text-xs mt-1">Intenta con otro término de búsqueda</div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Continue/Back Button - Fixed at bottom */}
      <AnimatePresence>
        {selectedBienes.length > 0 && (onContinue || onBack) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`
              absolute bottom-0 left-0 right-0
              px-6 py-4
              border-t
              ${isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/10'}
            `}
          >
            {showBackButton && onBack ? (
              <motion.button
                onClick={onBack}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`
                  w-full px-6 py-2 rounded-lg
                  text-sm font-medium
                  border transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  flex items-center justify-center gap-2
                  ${isDarkMode
                    ? 'bg-white/5 text-white border-white/20 hover:bg-white/10 focus:ring-white/30 focus:ring-offset-black'
                    : 'bg-black/5 text-black border-black/20 hover:bg-black/10 focus:ring-black/30 focus:ring-offset-white'
                  }
                `}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                <span>Atrás</span>
              </motion.button>
            ) : onContinue ? (
              <motion.button
                onClick={onContinue}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`
                  w-full px-6 py-2 rounded-lg
                  text-sm font-medium
                  border transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  flex items-center justify-center gap-2
                  ${isDarkMode
                    ? 'bg-white text-black border-white hover:bg-white/90 focus:ring-white/30 focus:ring-offset-black'
                    : 'bg-black text-white border-black hover:bg-black/90 focus:ring-black/30 focus:ring-offset-white'
                  }
                `}
              >
                <span>
                  {allAreaBienesSelected
                    ? 'Transferir área completa'
                    : `Continuar (${selectedBienes.length})`
                  }
                </span>
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </motion.button>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
