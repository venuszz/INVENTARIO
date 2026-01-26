/**
 * InventoryTable component
 * Main table for displaying and selecting inventory items
 */

import { ArrowUpDown, CheckCircle, AlertCircle, Search, X, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { TableSkeleton } from './TableSkeleton';
import type { Mueble } from '../types';

interface InventoryTableProps {
  items: Mueble[];
  selectedItems: Mueble[];
  onToggleSelection: (item: Mueble) => void;
  onSelectAllPage: () => void;
  areAllPageSelected: boolean;
  isSomePageSelected: boolean;
  canSelectAllPage: boolean;
  sortField: keyof Mueble;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof Mueble) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  searchTerm: string;
  onClearSearch: () => void;
}

/**
 * Inventory table with selection, sorting, and pagination
 */
export function InventoryTable({
  items,
  selectedItems,
  onToggleSelection,
  onSelectAllPage,
  areAllPageSelected,
  isSomePageSelected,
  canSelectAllPage,
  sortField,
  sortDirection,
  onSort,
  loading,
  error,
  onRetry,
  searchTerm,
  onClearSearch
}: InventoryTableProps) {
  const { isDarkMode } = useTheme();

  const columns = [
    { field: 'id_inv' as keyof Mueble, label: 'ID Inventario' },
    { field: 'descripcion' as keyof Mueble, label: 'Descripción' },
    { field: 'area' as keyof Mueble, label: 'Área' },
    { field: 'usufinal' as keyof Mueble, label: 'Responsable' },
    { field: 'estado' as keyof Mueble, label: 'Estado' },
  ];

  return (
    <div className={`rounded-lg border overflow-hidden mb-4 flex flex-col flex-grow max-h-[60vh] ${
      isDarkMode
        ? 'bg-white/[0.02] border-white/10'
        : 'bg-black/[0.02] border-black/10'
    }`}>
      <div className="flex-grow min-w-[800px] overflow-x-auto overflow-y-auto">
        <table className="min-w-full">
        <thead className={`sticky top-0 z-10 backdrop-blur-xl ${
          isDarkMode ? 'bg-black/95 border-b border-white/10' : 'bg-white/95 border-b border-black/10'
        }`}>
          <tr>
            {/* Select All Column */}
            <th className="px-2 py-3 w-10">
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={onSelectAllPage}
                  disabled={items.length === 0 || !canSelectAllPage}
                  className="relative group flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Seleccionar todos los artículos de la página"
                >
                  <div className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${
                    areAllPageSelected
                      ? (isDarkMode
                        ? 'bg-white/20 border-white/40'
                        : 'bg-black/20 border-black/40')
                      : isSomePageSelected
                        ? (isDarkMode
                          ? 'bg-white/10 border-white/30'
                          : 'bg-black/10 border-black/30')
                        : (isDarkMode
                          ? 'border-white/20 bg-white/5 hover:bg-white/10'
                          : 'border-black/20 bg-black/5 hover:bg-black/10')
                  }`}>
                    {areAllPageSelected ? (
                      <CheckCircle className={`h-4 w-4 ${
                        isDarkMode ? 'text-white' : 'text-black'
                      }`} />
                    ) : isSomePageSelected ? (
                      <div className={`h-2 w-2 rounded-sm ${
                        isDarkMode ? 'bg-white' : 'bg-black'
                      }`} />
                    ) : null}
                  </div>
                  <span className={`absolute left-0 top-8 z-40 px-2 py-1 rounded text-[10px] border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap ${
                    isDarkMode
                      ? 'bg-black text-white border-white/20'
                      : 'bg-white text-black border-black/20'
                  }`}>
                    {areAllPageSelected ? 'Deseleccionar página' : 'Seleccionar página'}
                  </span>
                </button>
              </div>
            </th>

            {/* Sortable Columns */}
            {columns.map(({ field, label }) => (
              <th
                key={field}
                onClick={() => onSort(field)}
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-all ${
                  sortField === field
                    ? isDarkMode 
                      ? 'text-white bg-white/[0.02]' 
                      : 'text-black bg-black/[0.02]'
                    : isDarkMode 
                      ? 'text-white/60 hover:bg-white/[0.02] hover:text-white' 
                      : 'text-black/60 hover:bg-black/[0.02] hover:text-black'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {label}
                  <ArrowUpDown size={12} className={sortField === field ? 'opacity-100' : 'opacity-40'} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeleton />
          ) : error ? (
            <tr className="h-96">
              <td colSpan={6} className="px-6 py-24 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <AlertCircle className={`h-12 w-12 ${
                    isDarkMode ? 'text-red-400' : 'text-red-500'
                  }`} />
                  <p className={`text-sm font-medium ${
                    isDarkMode ? 'text-red-400' : 'text-red-500'
                  }`}>
                    Error al cargar datos
                  </p>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`}>
                    {error}
                  </p>
                  <button
                    onClick={onRetry}
                    className={`px-3 py-1.5 rounded text-xs border transition-colors ${
                      isDarkMode
                        ? 'bg-white/5 text-white border-white/20 hover:bg-white/10'
                        : 'bg-black/5 text-black border-black/20 hover:bg-black/10'
                    }`}
                  >
                    Intentar nuevamente
                  </button>
                </div>
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr className="h-96">
              <td colSpan={6} className="px-6 py-24 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <Search className={`h-12 w-12 ${
                    isDarkMode ? 'text-white/20' : 'text-black/20'
                  }`} />
                  <p className={`text-sm ${
                    isDarkMode ? 'text-white/60' : 'text-black/60'
                  }`}>
                    No se encontraron resultados
                  </p>
                  {searchTerm && (
                    <button
                      onClick={onClearSearch}
                      className={`px-3 py-1.5 rounded text-xs border transition-colors flex items-center gap-1.5 ${
                        isDarkMode
                          ? 'bg-white/5 text-white border-white/20 hover:bg-white/10'
                          : 'bg-black/5 text-black border-black/20 hover:bg-black/10'
                      }`}
                    >
                      <X size={12} />
                      Limpiar búsqueda
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            items.map((mueble, index) => {
              const isSelected = selectedItems.some(m => m.id === mueble.id);
              return (
                <motion.tr
                  key={mueble.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02, duration: 0.2 }}
                  onClick={() => onToggleSelection(mueble)}
                  className={`border-b transition-colors cursor-pointer ${
                    isDarkMode 
                      ? 'border-white/5 hover:bg-white/[0.02]' 
                      : 'border-black/5 hover:bg-black/[0.02]'
                  } ${isSelected ? (isDarkMode ? 'bg-white/[0.02]' : 'bg-black/[0.02]') : ''}`}
                >
                  {/* Checkbox Cell */}
                  <td className="px-2 py-3">
                    <div className="flex justify-center">
                      <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all pointer-events-none ${
                        isSelected
                          ? (isDarkMode
                            ? 'bg-white/20 border-white/40'
                            : 'bg-black/20 border-black/40'
                          )
                          : (isDarkMode
                            ? 'border-white/20'
                            : 'border-black/20'
                          )
                      }`}>
                        {isSelected && (
                          <CheckCircle className={`h-3 w-3 ${
                            isDarkMode ? 'text-white' : 'text-black'
                          }`} />
                        )}
                      </div>
                    </div>
                  </td>

                  {/* ID Cell */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <div className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-black'
                      }`}>
                        {mueble.id_inv}
                      </div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-white/60' : 'text-black/60'
                      }`}>
                        {mueble.rubro}
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border inline-block w-fit
                        ${mueble.origen === 'INEA' ?
                          (isDarkMode ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-300') :
                          mueble.origen === 'ITEA' ?
                            (isDarkMode ? 'bg-pink-500/10 text-pink-300 border-pink-500/30' : 'bg-pink-100 text-pink-700 border-pink-300') :
                            mueble.origen === 'TLAXCALA' ?
                              (isDarkMode ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-300') :
                              (isDarkMode ? 'bg-white/5 text-white/60 border-white/20' : 'bg-black/5 text-black/60 border-black/20')}`}
                      >
                        {mueble.origen}
                      </span>
                    </div>
                  </td>

                  {/* Description Cell */}
                  <td className={`px-4 py-3 text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-black/80'
                  }`}>
                    <div className="line-clamp-2">
                      {mueble.descripcion}
                    </div>
                  </td>

                  {/* Area Cell */}
                  <td className={`px-4 py-3 text-sm ${
                    isDarkMode ? 'text-white/80' : 'text-black/80'
                  }`}>
                    {mueble.area || 'No especificada'}
                  </td>

                  {/* Usufinal Cell */}
                  <td className="px-4 py-3">
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                      isDarkMode 
                        ? 'bg-white/5 text-white/80 border-white/10' 
                        : 'bg-black/5 text-black/80 border-black/10'
                    }`}>
                      <User size={12} />
                      {mueble.usufinal || 'No asignado'}
                    </div>
                  </td>

                  {/* Estado Cell */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border
                      ${mueble.estado === 'B' ?
                        (isDarkMode ? 'bg-green-500/10 text-green-300 border-green-500/30' : 'bg-green-100 text-green-700 border-green-300') :
                        mueble.estado === 'R' ?
                          (isDarkMode ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' : 'bg-yellow-100 text-yellow-700 border-yellow-300') :
                          mueble.estado === 'M' ?
                            (isDarkMode ? 'bg-red-500/10 text-red-300 border-red-500/30' : 'bg-red-100 text-red-700 border-red-300') :
                            mueble.estado === 'N' ?
                              (isDarkMode ? 'bg-white/10 text-white border-white/20' : 'bg-black/10 text-black border-black/20') :
                              (isDarkMode ? 'bg-white/5 text-white/60 border-white/20' : 'bg-black/5 text-black/60 border-black/20')}`}
                    >
                      {mueble.estado}
                    </span>
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
}
