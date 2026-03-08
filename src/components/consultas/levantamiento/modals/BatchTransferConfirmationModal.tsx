/**
 * BatchTransferConfirmationModal Component
 * 
 * Minimalist modal for confirming batch origen transfer operations.
 * Displays summary stats, target origen selector, and warnings.
 * Features:
 * - Visual origen selector (prevents selecting current origen)
 * - Two-column layout with items list
 * - Search functionality for items
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, AlertTriangle, X, Search } from 'lucide-react';
import { OrigenType, BLOCK_REASON_MESSAGES } from '@/types/batchOrigenTransfer';
import { LevMueble } from '../types';

interface BatchTransferConfirmationModalProps {
  show: boolean;
  selectedItems: LevMueble[];
  blockedItems: Map<string, string>;
  onConfirm: (targetOrigen: OrigenType) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

// Origen labels and visual configuration
const ORIGEN_LABELS: Record<OrigenType, string> = {
  'INEA': 'INEA',
  'ITEJPA': 'ITEJPA',
  'TLAXCALA': 'TLAXCALA',
};

const getOrigenConfig = (isDarkMode: boolean): Record<OrigenType, string> => ({
  'INEA': isDarkMode 
    ? 'bg-white/90 text-gray-900 border-white/80' 
    : 'bg-blue-50 text-blue-900 border-blue-200',
  'ITEJPA': isDarkMode 
    ? 'bg-white/80 text-gray-900 border-white/70' 
    : 'bg-green-50 text-green-900 border-green-200',
  'TLAXCALA': isDarkMode 
    ? 'bg-white/70 text-gray-900 border-white/60' 
    : 'bg-purple-50 text-purple-900 border-purple-200',
});

export function BatchTransferConfirmationModal({
  show,
  selectedItems,
  blockedItems,
  onConfirm,
  onCancel,
  isDarkMode,
}: BatchTransferConfirmationModalProps) {
  const [targetOrigen, setTargetOrigen] = useState<OrigenType | null>(null);
  const [warningsAcknowledged, setWarningsAcknowledged] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const itemsPerPage = 20;
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  const origenConfig = getOrigenConfig(isDarkMode);

  // Calculate summary stats ONCE (only depends on props, not state)
  const { summary, currentOrigen, availableOrigenes, transferableItems, blockedItemsList } = useMemo(() => {
    const origenCounts: Record<string, number> = {};
    selectedItems.forEach(item => {
      const origen = item.origen || 'Unknown';
      origenCounts[origen] = (origenCounts[origen] || 0) + 1;
    });

    const summaryData = {
      total: selectedItems.length,
      byOrigen: origenCounts,
      blocked: blockedItems.size,
      transferable: selectedItems.length - blockedItems.size,
    };

    // Get current origen (most common one)
    const entries = Object.entries(origenCounts);
    entries.sort((a, b) => b[1] - a[1]);
    const currentOrigenData = entries.length > 0 ? entries[0][0] as OrigenType : null;

    // Get available target origenes (exclude current origen)
    const all: OrigenType[] = ['INEA', 'ITEJPA', 'TLAXCALA'];
    const availableOrigenesData = all.filter(origen => origen !== currentOrigenData);

    // Get transferable items (not blocked)
    const transferableItemsData = selectedItems.filter(item => !blockedItems.has(item.id));

    // Get blocked items list
    const blockedItemsListData = selectedItems.filter(item => blockedItems.has(item.id));

    return {
      summary: summaryData,
      currentOrigen: currentOrigenData,
      availableOrigenes: availableOrigenesData,
      transferableItems: transferableItemsData,
      blockedItemsList: blockedItemsListData,
    };
  }, [selectedItems, blockedItems]);

  // Filter items by search term (simple filter, no debounce needed with small lists)
  const filteredTransferableItems = useMemo(() => {
    if (!searchTerm.trim()) return transferableItems;
    
    const term = searchTerm.toLowerCase();
    return transferableItems.filter(item => 
      item.id_inv?.toLowerCase().includes(term) ||
      item.descripcion?.toLowerCase().includes(term) ||
      item.area?.nombre?.toLowerCase().includes(term) ||
      item.directorio?.nombre?.toLowerCase().includes(term)
    );
  }, [transferableItems, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredTransferableItems.length / itemsPerPage);
  const paginatedItems = filteredTransferableItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const hasWarnings = blockedItemsList.length > 0;
  const canConfirm = targetOrigen !== null && (!hasWarnings || warningsAcknowledged);

  const handleConfirm = () => {
    if (canConfirm && targetOrigen !== null) {
      onConfirm(targetOrigen);
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (show) {
      setTargetOrigen(null);
      setWarningsAcknowledged(false);
      setSearchTerm('');
      setCurrentPage(1);
      setTimeout(() => firstFocusableRef.current?.focus(), 100);
    }
  }, [show]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Handle page change with animation control
  const handlePageChange = (newPage: number) => {
    if (isAnimating) return; // Prevent rapid clicks during animation
    setIsAnimating(true);
    setCurrentPage(newPage);
    setTimeout(() => setIsAnimating(false), 250); // Match animation duration
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter' && canConfirm) {
        handleConfirm();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, canConfirm, onCancel]);

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${
            isDarkMode ? 'bg-black/90' : 'bg-black/50'
          } backdrop-blur-sm`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`rounded-lg shadow-2xl border w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden ${
              isDarkMode
                ? 'bg-black border-gray-800'
                : 'bg-white border-gray-200'
            }`}
          >
            {/* Header */}
            <div className={`relative px-6 py-4 border-b flex-shrink-0 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <button
                onClick={onCancel}
                className={`absolute top-3 right-4 p-1.5 rounded-lg transition-all ${
                  isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-800/50 border-gray-700'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <ArrowRight className={`h-5 w-5 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </div>
                <div>
                  <h2 className={`text-base font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Transferencia en lote
                  </h2>
                  <p className={`text-xs mt-0.5 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {summary.transferable} {summary.transferable === 1 ? 'artículo seleccionado' : 'artículos seleccionados'}
                  </p>
                </div>
              </div>
            </div>

            {/* Content - Two Column Layout - Fixed height, no scroll */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 flex-1 overflow-hidden">
              {/* Left Column - Transfer Configuration */}
              <div className="flex flex-col justify-center space-y-5 overflow-hidden">
                {/* Visual Transfer Flow - Centered */}
                <div className={`rounded-lg border p-5 ${
                  isDarkMode
                    ? 'border-gray-700 bg-gray-800/30'
                    : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center justify-center gap-6">
                    {/* Current Origen */}
                    <div className="flex flex-col items-center">
                      <p className={`text-[10px] uppercase tracking-wider font-medium mb-2.5 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        Origen actual
                      </p>
                      {currentOrigen && (
                        <div className={`inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold border ${origenConfig[currentOrigen]}`}>
                          {ORIGEN_LABELS[currentOrigen]}
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0 pt-6">
                      <ArrowRight className={`w-6 h-6 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    </div>

                    {/* Target Origen */}
                    <div className="flex flex-col items-center">
                      <p className={`text-[10px] uppercase tracking-wider font-medium mb-2.5 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        Origen destino
                      </p>
                      <div 
                        className={`inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold border ${
                          targetOrigen 
                            ? origenConfig[targetOrigen]
                            : isDarkMode 
                              ? 'bg-gray-800 text-gray-600 border-gray-700'
                              : 'bg-gray-100 text-gray-400 border-gray-300'
                        }`}
                      >
                        {targetOrigen ? ORIGEN_LABELS[targetOrigen] : 'Seleccionar'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Origen Selector Buttons */}
                <div>
                  <label className={`text-xs uppercase tracking-wider block mb-3 font-medium text-center ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Seleccionar destino
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                    {availableOrigenes.map((origen, index) => (
                      <button
                        key={origen}
                        ref={index === 0 ? firstFocusableRef : undefined}
                        onClick={() => setTargetOrigen(origen)}
                        className={`px-5 py-3.5 rounded-lg border text-sm font-semibold ${
                          targetOrigen === origen
                            ? isDarkMode
                              ? 'bg-white text-black border-white shadow-lg'
                              : 'bg-black text-white border-black shadow-lg'
                            : isDarkMode
                              ? 'bg-gray-800/50 border-gray-700 text-white hover:border-gray-600 hover:bg-gray-800'
                              : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {ORIGEN_LABELS[origen]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary Stats - Centered with bottom margin and minimal height */}
                <div className={`rounded-xl border p-3 max-w-md mx-auto w-full mb-2 ${
                  isDarkMode
                    ? 'border-gray-700 bg-gray-800/30'
                    : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="text-center mb-2">
                    <span className={`text-[10px] uppercase tracking-wider font-medium block mb-1.5 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Resumen de transferencia
                    </span>
                    <div className={`text-2xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {summary.transferable}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      {summary.transferable === 1 ? 'artículo transferible' : 'artículos transferibles'}
                    </div>
                  </div>
                  
                  {/* Origen breakdown */}
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {Object.entries(summary.byOrigen).map(([origen, count]) => (
                      <div
                        key={origen}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] ${
                          isDarkMode
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <span className={`font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {origen}
                        </span>
                        <span className={`font-bold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warnings Section */}
                {hasWarnings && (
                  <div
                    className={`rounded-lg border p-4 max-w-md mx-auto w-full ${
                      isDarkMode
                        ? 'bg-yellow-500/10 border-yellow-500/20'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${
                        isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                      }`} />
                      <div className="flex-1">
                        <h3 className={`text-sm font-semibold mb-1 ${
                          isDarkMode ? 'text-yellow-400' : 'text-yellow-800'
                        }`}>
                          {summary.blocked} {summary.blocked === 1 ? 'artículo bloqueado' : 'artículos bloqueados'}
                        </h3>
                        <div className={`text-xs space-y-1 max-h-20 overflow-y-auto ${
                          isDarkMode ? 'text-yellow-400/80' : 'text-yellow-700'
                        }`}>
                          {blockedItemsList.slice(0, 3).map((item) => {
                            const reason = blockedItems.get(item.id);
                            return (
                              <div key={item.id}>
                                {item.id_inv}: {reason ? BLOCK_REASON_MESSAGES[reason as keyof typeof BLOCK_REASON_MESSAGES] : 'Bloqueado'}
                              </div>
                            );
                          })}
                          {blockedItemsList.length > 3 && (
                            <div className="italic">
                              +{blockedItemsList.length - 3} más...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={warningsAcknowledged}
                          onChange={(e) => setWarningsAcknowledged(e.target.checked)}
                          className="sr-only peer"
                        />
                        <motion.div 
                          className={`
                            w-5 h-5 rounded border-2 transition-all duration-200
                            flex items-center justify-center
                            ${isDarkMode
                              ? 'border-yellow-400/50 peer-checked:bg-yellow-400 peer-checked:border-yellow-400'
                              : 'border-yellow-600/50 peer-checked:bg-yellow-600 peer-checked:border-yellow-600'
                            }
                            group-hover:border-opacity-70
                          `}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <AnimatePresence>
                            {warningsAcknowledged && (
                              <motion.svg 
                                className="w-3 h-3 text-white" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor" 
                                strokeWidth={3}
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 180 }}
                                transition={{ 
                                  type: 'spring',
                                  stiffness: 500,
                                  damping: 25
                                }}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </motion.svg>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </div>
                      <span className="text-xs">
                        Entiendo que estos artículos no serán transferidos
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Right Column - Items List with Pagination */}
              <div className="flex flex-col overflow-hidden h-full">
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <span className={`text-xs uppercase tracking-wider font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Artículos a transferir
                  </span>
                  <span className={`text-xs ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    {filteredTransferableItems.length} de {transferableItems.length}
                  </span>
                </div>

                {/* Search Bar - Uncontrolled for performance */}
                <div className="relative mb-3 flex-shrink-0">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por ID, descripción, área..."
                    autoComplete="off"
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm focus:outline-none ${
                      isDarkMode
                        ? 'bg-black border-white/10 text-white placeholder:text-white/40 focus:border-white/20'
                        : 'bg-white border-black/10 text-black placeholder:text-black/40 focus:border-black/20'
                    }`}
                  />
                </div>

                {/* Items List - Scrollable with animation */}
                <div className={`rounded-lg border flex-1 overflow-hidden flex flex-col ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <AnimatePresence initial={false} mode="wait">
                    <motion.div
                      key={currentPage}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ 
                        duration: 0.2,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      className="flex-1 overflow-y-auto"
                    >
                      {filteredTransferableItems.length === 0 ? (
                        <div className={`p-8 text-center ${
                          isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          <p className="text-sm">
                            {searchTerm ? 'No se encontraron artículos' : 'No hay artículos para transferir'}
                          </p>
                        </div>
                      ) : (
                        <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                          {paginatedItems.map((item) => (
                            <div
                              key={item.id}
                              className={`p-3 ${
                                isDarkMode
                                  ? 'hover:bg-gray-800/50'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-mono font-medium mb-1 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {item.id_inv}
                                  </p>
                                  <p className={`text-xs line-clamp-2 mb-1 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
                                    {item.descripcion || 'Sin descripción'}
                                  </p>
                                  {(item.area?.nombre || item.directorio?.nombre) && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {item.area?.nombre && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                          isDarkMode
                                            ? 'bg-gray-700 text-gray-300'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                          {item.area.nombre}
                                        </span>
                                      )}
                                      {item.directorio?.nombre && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                          isDarkMode
                                            ? 'bg-gray-700 text-gray-300'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                          {item.directorio.nombre}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <span className={`text-[10px] px-2 py-1 rounded-full border flex-shrink-0 ${
                                  origenConfig[item.origen as OrigenType]
                                }`}>
                                  {item.origen}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Sticky Pagination */}
                  {totalPages > 1 && (
                    <div className={`sticky bottom-0 border-t px-3 py-2 flex items-center justify-between ${
                      isDarkMode
                        ? 'bg-black border-gray-700'
                        : 'bg-white border-gray-200'
                    }`}>
                      <span className={`text-xs ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Página {currentPage} de {totalPages}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1 || isAnimating}
                          className={`px-3 py-1 rounded text-xs ${
                            currentPage === 1 || isAnimating
                              ? isDarkMode
                                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : isDarkMode
                                ? 'bg-gray-800 text-white hover:bg-gray-700'
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          }`}
                        >
                          Anterior
                        </button>
                        <button
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages || isAnimating}
                          className={`px-3 py-1 rounded text-xs ${
                            currentPage === totalPages || isAnimating
                              ? isDarkMode
                                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : isDarkMode
                                ? 'bg-gray-800 text-white hover:bg-gray-700'
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          }`}
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 border-t flex justify-end gap-3 flex-shrink-0 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <button
                onClick={onCancel}
                className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                  isDarkMode
                    ? 'bg-gray-800/50 border-gray-700 text-white hover:bg-gray-800 hover:border-gray-600'
                    : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!canConfirm}
                className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                  canConfirm
                    ? isDarkMode
                      ? 'bg-white text-black border-white hover:bg-gray-100'
                      : 'bg-black text-white border-black hover:bg-gray-900'
                    : isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Confirmar transferencia
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
