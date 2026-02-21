'use client';

import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Package, FileText, ArrowRight, Loader2, AlertTriangle, Search } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useIteaStore } from '@/stores/iteaStore';
import { useIneaStore } from '@/stores/ineaStore';
import { useNoListadoStore } from '@/stores/noListadoStore';
import type { InconsistencyWithStats } from '../../../types/resolver';

interface DuplicateAreaConfirmationProps {
  inconsistency: InconsistencyWithStats;
  selectedDirectorId: number;
  onBack: () => void;
  onConfirm: () => Promise<void>;
}

interface BienToTransfer {
  id: string;
  descripcion: string;
  no_inventario: string;
  valor: number;
  origen: 'ITEA' | 'INEA' | 'TLAXCALA';
}

interface SearchSuggestion {
  value: string;
  label: string;
  bien: BienToTransfer;
}

export function DuplicateAreaConfirmation({
  inconsistency,
  selectedDirectorId,
  onBack,
  onConfirm,
}: DuplicateAreaConfirmationProps) {
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [bienes, setBienes] = useState<BienToTransfer[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Show 20 items per page

  // Defer search term to avoid blocking input
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // Get data from stores
  const iteaMuebles = useIteaStore(state => state.muebles);
  const ineaMuebles = useIneaStore(state => state.muebles);
  const noListadoMuebles = useNoListadoStore(state => state.muebles);

  const selectedDirector = inconsistency.directors?.find(d => d.id === selectedDirectorId);
  const otherDirectors = useMemo(
    () => inconsistency.directors?.filter(d => d.id !== selectedDirectorId) || [],
    [inconsistency.directors, selectedDirectorId]
  );

  useEffect(() => {
    // Cargar bienes de los directores que NO fueron seleccionados
    const loadBienes = async () => {
      setIsLoading(true);
      try {
        const bienesATransferir: BienToTransfer[] = [];
        
        // Para cada director que NO fue seleccionado
        otherDirectors.forEach((director) => {
          // Buscar bienes en ITEA
          const iteaBienes = iteaMuebles.filter(m => 
            m.id_directorio === director.id && 
            m.area?.nombre === inconsistency.areaName
          );
          
          iteaBienes.forEach(bien => {
            bienesATransferir.push({
              id: bien.id,
              descripcion: bien.descripcion || 'Sin descripción',
              no_inventario: bien.id_inv || 'N/A',
              valor: typeof bien.valor === 'string' ? parseFloat(bien.valor) || 0 : bien.valor || 0,
              origen: 'ITEA'
            });
          });

          // Buscar bienes en INEA
          const ineaBienes = ineaMuebles.filter(m => 
            m.id_directorio === director.id && 
            m.area?.nombre === inconsistency.areaName
          );
          
          ineaBienes.forEach(bien => {
            bienesATransferir.push({
              id: bien.id,
              descripcion: bien.descripcion || 'Sin descripción',
              no_inventario: bien.id_inv || 'N/A',
              valor: typeof bien.valor === 'number' ? bien.valor : 0,
              origen: 'INEA'
            });
          });

          // Buscar bienes en No Listado
          const noListadoBienes = noListadoMuebles.filter(m => 
            m.id_directorio === director.id && 
            m.area?.nombre === inconsistency.areaName
          );
          
          noListadoBienes.forEach(bien => {
            bienesATransferir.push({
              id: bien.id,
              descripcion: bien.descripcion || 'Sin descripción',
              no_inventario: bien.id_inv || 'N/A',
              valor: typeof bien.valor === 'string' ? parseFloat(bien.valor) || 0 : bien.valor || 0,
              origen: 'TLAXCALA'
            });
          });
        });
        
        setBienes(bienesATransferir);
      } catch (error) {
        console.error('Error loading bienes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBienes();
  }, [otherDirectors, inconsistency.areaName, iteaMuebles, ineaMuebles, noListadoMuebles]);

  // Filter bienes based on deferred search term
  const filteredBienes = useMemo(() => {
    if (!deferredSearchTerm.trim()) return bienes;
    
    const term = deferredSearchTerm.toLowerCase();
    return bienes.filter(bien => 
      bien.descripcion.toLowerCase().includes(term) ||
      bien.no_inventario.toLowerCase().includes(term) ||
      bien.origen.toLowerCase().includes(term)
    );
  }, [bienes, deferredSearchTerm]);

  // Generate search suggestions based on deferred search term
  const searchSuggestions = useMemo(() => {
    if (!deferredSearchTerm.trim() || deferredSearchTerm.length < 2) return [];
    
    const term = deferredSearchTerm.toLowerCase();
    const suggestions: SearchSuggestion[] = [];
    const seen = new Set<string>();
    
    bienes.forEach(bien => {
      // Match by descripcion
      if (bien.descripcion.toLowerCase().includes(term)) {
        const key = `desc-${bien.id}`;
        if (!seen.has(key)) {
          suggestions.push({
            value: bien.descripcion,
            label: `${bien.descripcion} (${bien.no_inventario})`,
            bien
          });
          seen.add(key);
        }
      }
      // Match by no_inventario
      else if (bien.no_inventario.toLowerCase().includes(term)) {
        const key = `inv-${bien.id}`;
        if (!seen.has(key)) {
          suggestions.push({
            value: bien.no_inventario,
            label: `${bien.no_inventario} - ${bien.descripcion}`,
            bien
          });
          seen.add(key);
        }
      }
    });
    
    // Limit to 5 suggestions
    return suggestions.slice(0, 5);
  }, [bienes, deferredSearchTerm]);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || searchSuggestions.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % searchSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + searchSuggestions.length) % searchSuggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && searchSuggestions[highlightedIndex]) {
        setSearchTerm(searchSuggestions[highlightedIndex].value);
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const totalBienesToTransfer = filteredBienes.length;
  const totalValue = filteredBienes.reduce((sum, bien) => sum + bien.valor, 0);
  
  // Pagination
  const totalPages = Math.ceil(totalBienesToTransfer / itemsPerPage);
  const paginatedBienes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBienes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBienes, currentPage, itemsPerPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchTerm]);
  
  // Calculate total bienes for selected director after transfer
  const selectedDirectorCurrentBienes = selectedDirector?.stats?.bienesCount || 0;
  const selectedDirectorFinalBienes = selectedDirectorCurrentBienes + bienes.length;

  return (
    <div className={`h-full rounded-lg border ${
      isDarkMode ? 'bg-black/40 border-white/5' : 'bg-white border-neutral-200'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className={`p-6 border-b ${isDarkMode ? 'border-white/5' : 'border-neutral-200'}`}>
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className={`w-5 h-5 ${isDarkMode ? 'text-yellow-500/80' : 'text-yellow-600'}`} />
            <div className="flex-1">
              <p className={`text-xs ${isDarkMode ? 'text-white/30' : 'text-black/40'}`}>
                Confirmación de transferencia
              </p>
              <h3 className={`text-lg font-light tracking-tight ${
                isDarkMode ? 'text-white/90' : 'text-black'
              }`}>
                {inconsistency.areaName}
              </h3>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${
            isDarkMode 
              ? 'bg-white/[0.02] border-white/5' 
              : 'bg-neutral-50 border-neutral-200'
          }`}>
            <p className={`text-xs uppercase tracking-wider mb-3 ${
              isDarkMode ? 'text-white/30' : 'text-neutral-500'
            }`}>
              Transferencia de bienes
            </p>
            
            {/* Transfer flow visualization */}
            <div className="space-y-2">
              {otherDirectors.map((director, index) => (
                <div key={`transfer-${director.id}`} className="flex items-center gap-3">
                  {/* Source director */}
                  <div className={`flex-1 px-3 py-2 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-white/[0.02] border-white/5' 
                      : 'bg-white border-neutral-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <User className={`w-3.5 h-3.5 flex-shrink-0 ${
                        isDarkMode ? 'text-white/30' : 'text-neutral-400'
                      }`} />
                      <span className={`text-sm truncate ${
                        isDarkMode ? 'text-white/60' : 'text-neutral-700'
                      }`}>
                        {director.nombre}
                      </span>
                    </div>
                    <div className={`flex items-center gap-3 mt-1 text-xs ${
                      isDarkMode ? 'text-white/40' : 'text-neutral-500'
                    }`}>
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        <span>{director.stats?.bienesCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{director.stats?.resguardosCount || 0}</span>
                      </div>
                    </div>
                    <p className={`text-xs mt-1.5 ${
                      isDarkMode ? 'text-white/30' : 'text-neutral-400'
                    }`}>
                      Se eliminará el área de este director
                    </p>
                  </div>
                  
                  {/* Arrow */}
                  <ArrowRight className={`w-5 h-5 flex-shrink-0 ${
                    isDarkMode ? 'text-white/20' : 'text-neutral-300'
                  }`} />
                  
                  {/* Target director (only show on first item) */}
                  {index === 0 && (
                    <div className={`flex-1 px-3 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-green-500/5 border-green-500/20' 
                        : 'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <User className={`w-3.5 h-3.5 flex-shrink-0 ${
                          isDarkMode ? 'text-green-400/80' : 'text-green-600'
                        }`} />
                        <span className={`text-sm font-medium truncate ${
                          isDarkMode ? 'text-green-400/90' : 'text-green-700'
                        }`}>
                          {selectedDirector?.nombre}
                        </span>
                      </div>
                      <div className={`flex items-center gap-2 mt-1 text-xs ${
                        isDarkMode ? 'text-green-400/70' : 'text-green-600'
                      }`}>
                        <Package className="w-3 h-3" />
                        <span>
                          {selectedDirectorCurrentBienes} → {selectedDirectorFinalBienes} bienes
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${
                        isDarkMode ? 'text-green-400/60' : 'text-green-600'
                      }`}>
                        Conservará el área
                      </p>
                    </div>
                  )}
                  
                  {/* Spacer for alignment on subsequent items */}
                  {index > 0 && <div className="flex-1" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">

          {/* Search bar */}
          <div className="space-y-3">
            <h4 className={`text-xs font-medium uppercase tracking-wider ${
              isDarkMode ? 'text-white/30' : 'text-neutral-500'
            }`}>
              Bienes a transferir ({totalBienesToTransfer})
            </h4>

            {!isLoading && bienes.length > 0 && (
              <div className="relative">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowSuggestions(true);
                      setHighlightedIndex(-1);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Buscar bienes..."
                    className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border transition-all ${
                      isDarkMode
                        ? 'bg-black border-white/10 text-white placeholder:text-white/40 focus:border-white/20'
                        : 'bg-white border-black/10 text-black placeholder:text-black/40 focus:border-black/20'
                    } focus:outline-none`}
                  />
                </div>

                {/* Search suggestions */}
                <AnimatePresence>
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute z-50 w-full mt-2 rounded-lg border shadow-lg overflow-hidden ${
                        isDarkMode 
                          ? 'bg-black border-white/10' 
                          : 'bg-white border-black/10'
                      }`}
                    >
                      <div className={`max-h-60 overflow-y-auto p-1 ${
                        isDarkMode 
                          ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30'
                          : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20 hover:scrollbar-thumb-black/30'
                      }`}>
                        {searchSuggestions.map((suggestion, index) => {
                          const isSelected = index === highlightedIndex;
                          
                          return (
                            <button
                              key={suggestion.bien.id}
                              onClick={() => {
                                setSearchTerm(suggestion.value);
                                setShowSuggestions(false);
                              }}
                              className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150 ${
                                isSelected
                                  ? isDarkMode 
                                    ? 'bg-white/10 text-white' 
                                    : 'bg-black/10 text-black'
                                  : isDarkMode
                                    ? 'hover:bg-white/[0.04] text-white/90'
                                    : 'hover:bg-black/[0.03] text-black/90'
                              }`}
                            >
                              <span className={`px-2 py-0.5 text-xs font-medium rounded flex-shrink-0 ${
                                suggestion.bien.origen === 'ITEA' 
                                  ? isDarkMode ? 'bg-blue-500/10 text-blue-400/80' : 'bg-blue-50 text-blue-700'
                                  : suggestion.bien.origen === 'INEA'
                                  ? isDarkMode ? 'bg-purple-500/10 text-purple-400/80' : 'bg-purple-50 text-purple-700'
                                  : isDarkMode ? 'bg-green-500/10 text-green-400/80' : 'bg-green-50 text-green-700'
                              }`}>
                                {suggestion.bien.origen}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${
                                  isDarkMode ? 'text-white/80' : 'text-black'
                                }`}>
                                  {suggestion.bien.descripcion}
                                </p>
                                <p className={`text-xs mt-0.5 truncate ${
                                  isSelected
                                    ? (isDarkMode ? 'text-white/60' : 'text-black/60')
                                    : (isDarkMode ? 'text-white/40' : 'text-black/40')
                                }`}>
                                  {suggestion.bien.no_inventario}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Scrollbar styles */}
                <style jsx>{`
                  .scrollbar-thin {
                    scrollbar-width: thin;
                  }
                  
                  .scrollbar-thin::-webkit-scrollbar {
                    width: 6px;
                  }
                  
                  .scrollbar-thin::-webkit-scrollbar-track {
                    background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
                    border-radius: 3px;
                  }
                  
                  .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
                    border-radius: 3px;
                  }
                  
                  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: ${isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
                  }
                `}</style>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className={`w-6 h-6 animate-spin ${
                  isDarkMode ? 'text-white/20' : 'text-neutral-400'
                }`} />
              </div>
            ) : filteredBienes.length === 0 ? (
              <div className={`p-8 rounded-lg border text-center ${
                isDarkMode 
                  ? 'bg-white/[0.02] border-white/5' 
                  : 'bg-neutral-50 border-neutral-200'
              }`}>
                <p className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                  {searchTerm ? 'No se encontraron bienes con ese criterio' : 'No hay bienes para transferir'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedBienes.map((bien) => (
                  <motion.div
                    key={bien.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-white/[0.02] border-white/5' 
                        : 'bg-white border-neutral-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`px-1.5 py-0.5 text-xs rounded flex-shrink-0 ${
                        bien.origen === 'ITEA' 
                          ? isDarkMode ? 'bg-blue-500/10 text-blue-400/80' : 'bg-blue-50 text-blue-700'
                          : bien.origen === 'INEA'
                          ? isDarkMode ? 'bg-purple-500/10 text-purple-400/80' : 'bg-purple-50 text-purple-700'
                          : isDarkMode ? 'bg-green-500/10 text-green-400/80' : 'bg-green-50 text-green-700'
                      }`}>
                        {bien.origen}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isDarkMode ? 'text-white/70' : 'text-black'
                        }`}>
                          {bien.descripcion}
                        </p>
                        <p className={`text-xs ${
                          isDarkMode ? 'text-white/40' : 'text-black/40'
                        }`}>
                          {bien.no_inventario}
                        </p>
                      </div>
                      <span className={`text-xs font-medium flex-shrink-0 ${
                        isDarkMode ? 'text-white/50' : 'text-black/60'
                      }`}>
                        ${bien.valor.toLocaleString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && filteredBienes.length > itemsPerPage && (
              <div className={`flex items-center justify-between px-4 py-3 border-t ${
                isDarkMode ? 'border-white/5' : 'border-neutral-200'
              }`}>
                <div className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalBienesToTransfer)} de {totalBienesToTransfer}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 text-xs rounded-lg border transition-all ${
                      currentPage === 1
                        ? isDarkMode
                          ? 'bg-white/[0.02] border-white/5 text-white/20 cursor-not-allowed'
                          : 'bg-black/[0.02] border-black/5 text-black/20 cursor-not-allowed'
                        : isDarkMode
                          ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                          : 'bg-black/5 border-black/10 text-black/60 hover:bg-black/10'
                    }`}
                  >
                    Anterior
                  </button>
                  <span className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 text-xs rounded-lg border transition-all ${
                      currentPage === totalPages
                        ? isDarkMode
                          ? 'bg-white/[0.02] border-white/5 text-white/20 cursor-not-allowed'
                          : 'bg-black/[0.02] border-black/5 text-black/20 cursor-not-allowed'
                        : isDarkMode
                          ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                          : 'bg-black/5 border-black/10 text-black/60 hover:bg-black/10'
                    }`}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Total Value */}
          {!isLoading && filteredBienes.length > 0 && (
            <div className={`p-4 rounded-lg border ${
              isDarkMode 
                ? 'bg-white/[0.02] border-white/5' 
                : 'bg-neutral-50 border-neutral-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDarkMode ? 'text-white/50' : 'text-neutral-600'}`}>
                  Valor total a transferir
                </span>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white/80' : 'text-black'}`}>
                  ${totalValue.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={`p-4 border-t ${
          isDarkMode ? 'border-white/5' : 'border-neutral-200'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              disabled={isConfirming}
              className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDarkMode
                  ? 'text-white/50 border border-white/10 hover:bg-white/5'
                  : 'text-black/60 border border-black/10 hover:bg-black/5'
              }`}
            >
              Atrás
            </button>
            <button
              onClick={handleConfirm}
              disabled={isConfirming || isLoading}
              className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDarkMode
                  ? 'bg-red-500/90 hover:bg-red-500 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isConfirming ? 'Confirmando...' : 'Confirmar transferencia'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
