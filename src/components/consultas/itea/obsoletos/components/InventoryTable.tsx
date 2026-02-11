'use client';

import React from 'react';
import { ArrowUpDown, RefreshCw, AlertCircle, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { MuebleITEA } from '../types';
import { truncateText, formatDate } from '../utils';

interface InventoryTableProps {
  /** Array of all furniture items */
  muebles: MuebleITEA[];
  /** Currently paginated items to display */
  paginatedMuebles: MuebleITEA[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Currently selected item */
  selectedItem: MuebleITEA | null;
  /** Current sort field */
  sortField: keyof MuebleITEA;
  /** Current sort direction */
  sortDirection: 'asc' | 'desc';
  /** Dark mode flag */
  isDarkMode: boolean;
  /** Handler for column sort */
  onSort: (field: keyof MuebleITEA) => void;
  /** Handler for item selection */
  onSelectItem: (item: MuebleITEA) => void;
  /** Handler to retry loading on error */
  onRetry: () => void;
  /** Handler to clear filters */
  onClearFilters: () => void;
  /** Whether search or filters are active */
  hasActiveFilters: boolean;
  /** IDs of items currently syncing */
  syncingIds?: string[];
}

/**
 * InventoryTable Component
 * 
 * Displays the ITEA obsolete items inventory in a sortable table format.
 * Handles loading, error, and empty states.
 */
export const InventoryTable: React.FC<InventoryTableProps> = ({
  paginatedMuebles,
  loading,
  error,
  selectedItem,
  sortField,
  isDarkMode,
  onSort,
  onSelectItem,
  onRetry,
  onClearFilters,
  hasActiveFilters,
  syncingIds = []
}) => {
  /**
   * Sortable header component
   */
  function SortableHeader({ 
    field, 
    label 
  }: { 
    field: keyof MuebleITEA; 
    label: string 
  }) {
    const isActive = sortField === field;
    
    return (
      <th
        onClick={() => onSort(field)}
        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-all ${
          isActive
            ? isDarkMode 
              ? 'text-white bg-white/[0.02]' 
              : 'text-black bg-black/[0.02]'
            : isDarkMode 
              ? 'text-white/60 hover:bg-white/[0.02] hover:text-white' 
              : 'text-black/60 hover:bg-black/[0.02] hover:text-black'
        }`}
        title={`Ordenar por ${label}`}
      >
        <div className="flex items-center gap-1.5">
          {label}
          <ArrowUpDown size={12} className={isActive ? 'opacity-100' : 'opacity-40'} />
        </div>
      </th>
    );
  }

  /**
   * Skeleton loader for syncing cells
   */
  function CellSkeleton() {
    return (
      <div className={`h-4 rounded animate-pulse ${
        isDarkMode ? 'bg-white/10' : 'bg-black/10'
      }`} style={{ width: '80%' }} />
    );
  }

  return (
    <div className={`rounded-lg border overflow-hidden h-full flex flex-col ${
      isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/10'
    }`}>
      <div className={`overflow-auto flex-1 ${
        isDarkMode 
          ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30'
          : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20 hover:scrollbar-thumb-black/30'
      }`}>
        <table className="min-w-full">
          {/* Table Header */}
          <thead className={`sticky top-0 z-10 backdrop-blur-xl ${
            isDarkMode ? 'bg-black/95 border-b border-white/10' : 'bg-white/95 border-b border-black/10'
          }`}>
            <tr>
              <SortableHeader field="id_inv" label="ID Inventario" />
              <SortableHeader field="descripcion" label="Descripción" />
              <SortableHeader field="area" label="Área" />
              <SortableHeader field="directorio" label="Director/Jefe de Área" />
              <SortableHeader field="fechabaja" label="Fecha de Baja" />
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className={isDarkMode ? 'bg-black' : 'bg-white'}>
            {/* Loading State */}
            {loading ? (
              <tr className="h-96">
                <td colSpan={5} className={`px-6 py-24 text-center ${
                  isDarkMode ? 'text-white/40' : 'text-black/40'
                }`}>
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <RefreshCw className={`h-12 w-12 animate-spin ${
                      isDarkMode ? 'text-white/20' : 'text-black/20'
                    }`} />
                    <p className="text-lg font-light">Cargando datos...</p>
                    <p className={`text-sm font-light ${
                      isDarkMode ? 'text-white/30' : 'text-black/30'
                    }`}>Por favor espere mientras se cargan los registros de bajas</p>
                  </div>
                </td>
              </tr>
            ) : error ? (
              /* Error State */
              <tr className="h-96">
                <td colSpan={5} className="px-6 py-24 text-center">
                  <div className={`flex flex-col items-center justify-center space-y-4 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                    <AlertCircle className="h-12 w-12" />
                    <p className="text-lg font-medium">Error al cargar datos</p>
                    <p className={`text-sm max-w-lg mx-auto mb-2 font-light ${
                      isDarkMode ? 'text-white/40' : 'text-black/40'
                    }`}>{error}</p>
                    <button
                      onClick={onRetry}
                      className={`px-4 py-2 rounded-lg text-sm font-light transition-all border ${
                        isDarkMode 
                          ? 'bg-white/[0.02] hover:bg-white/[0.04] text-white border-white/10 hover:border-white/20' 
                          : 'bg-black/[0.02] hover:bg-black/[0.04] text-black border-black/10 hover:border-black/20'
                      }`}
                    >
                      Intentar nuevamente
                    </button>
                  </div>
                </td>
              </tr>
            ) : !paginatedMuebles || paginatedMuebles.length === 0 ? (
              /* Empty State */
              <tr className="h-96">
                <td colSpan={5} className={`px-6 py-24 text-center ${
                  isDarkMode ? 'text-white/40' : 'text-black/40'
                }`}>
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Search className={`h-12 w-12 ${
                      isDarkMode ? 'text-white/20' : 'text-black/20'
                    }`} />
                    <p className="text-lg font-light">No se encontraron bajas</p>
                    {hasActiveFilters ? (
                      <>
                        <p className={`text-sm max-w-lg mx-auto font-light ${
                          isDarkMode ? 'text-white/30' : 'text-black/30'
                        }`}>
                          No hay elementos que coincidan con los criterios de búsqueda actuales
                        </p>
                        <button
                          onClick={onClearFilters}
                          className={`px-4 py-2 rounded-lg text-sm font-light transition-all flex items-center gap-2 border ${
                            isDarkMode 
                              ? 'bg-white/[0.02] hover:bg-white/[0.04] text-white border-white/10 hover:border-white/20' 
                              : 'bg-black/[0.02] hover:bg-black/[0.04] text-black border-black/10 hover:border-black/20'
                          }`}
                        >
                          <X className="h-4 w-4" />
                          Limpiar filtros
                        </button>
                      </>
                    ) : (
                      <p className={`text-sm font-light ${
                        isDarkMode ? 'text-white/30' : 'text-black/30'
                      }`}>No hay registros de bajas en el inventario</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              /* Data Rows */
              paginatedMuebles.map((item, index) => {
                const isSyncing = syncingIds.includes(item.id);
                
                return (
                  <motion.tr
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className={`group cursor-pointer transition-all border-b ${
                      isDarkMode ? 'border-white/5' : 'border-black/5'
                    } ${
                      selectedItem?.id === item.id 
                        ? isDarkMode
                          ? 'bg-white/[0.08] border-l-2 !border-l-white/60'
                          : 'bg-black/[0.08] border-l-2 !border-l-black/60'
                        : isDarkMode
                          ? 'hover:bg-white/[0.03]'
                          : 'hover:bg-black/[0.03]'
                    } ${isSyncing ? 'opacity-50' : ''}`}
                  >
                    <td className={`px-4 py-3.5 whitespace-nowrap text-sm transition-all ${
                      isDarkMode ? 'text-white' : 'text-black'
                    } ${selectedItem?.id === item.id ? 'font-medium' : 'font-light'}`}>
                      <span className={`${selectedItem?.id === item.id ? 'opacity-100' : 'opacity-90'}`}>
                        {item.id_inv}
                      </span>
                      {isSyncing && (
                        <RefreshCw className="inline-block ml-2 h-3 w-3 animate-spin" />
                      )}
                    </td>
                    <td className={`px-4 py-3.5 text-sm font-light transition-all ${
                      isDarkMode ? 'text-white/90' : 'text-black/90'
                    }`}>
                      <div className={`max-w-md ${selectedItem?.id === item.id ? 'font-normal' : ''}`}>
                        {truncateText(item.descripcion, 50)}
                      </div>
                    </td>
                    <td className={`px-4 py-3.5 text-sm font-light ${
                      isDarkMode ? 'text-white/80' : 'text-black/80'
                    }`}>
                      {isSyncing ? <CellSkeleton /> : truncateText(item.area?.nombre || '', 25)}
                    </td>
                    <td className={`px-4 py-3.5 text-sm font-light ${
                      isDarkMode ? 'text-white/80' : 'text-black/80'
                    }`}>
                      {isSyncing ? <CellSkeleton /> : truncateText(item.directorio?.nombre || '', 25)}
                    </td>
                    <td className={`px-4 py-3.5 text-sm font-light ${
                      isDarkMode ? 'text-white/80' : 'text-black/80'
                    }`}>
                      {formatDate(item.fechabaja) || 'No especificada'}
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
