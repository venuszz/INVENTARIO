/**
 * InventoryTable component
 * Main table for displaying and selecting inventory items
 */

import { useRef, useEffect } from 'react';
import { ArrowUpDown, CheckCircle, AlertCircle, Search, X, User, RefreshCw } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { getColorClass } from '../utils';
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
  const selectAllRef = useRef<HTMLInputElement>(null);

  // Set indeterminate state for select-all checkbox
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = !areAllPageSelected && isSomePageSelected;
    }
  }, [areAllPageSelected, isSomePageSelected]);

  const columns = [
    { field: 'id_inv' as keyof Mueble, label: 'ID Inventario' },
    { field: 'descripcion' as keyof Mueble, label: 'Descripción' },
    { field: 'area' as keyof Mueble, label: 'Área' },
    { field: 'usufinal' as keyof Mueble, label: 'Responsable' },
    { field: 'estado' as keyof Mueble, label: 'Estado' },
  ];

  return (
    <div className={`rounded-xl border overflow-hidden mb-6 flex flex-col flex-grow max-h-[60vh] shadow-lg hover:shadow-xl transition-all duration-300 transform ${
      isDarkMode
        ? 'bg-gray-900/30 border-gray-800 hover:border-gray-700'
        : 'bg-white border-gray-200'
    }`}>
      <div className={`flex-grow min-w-[800px] overflow-x-auto overflow-y-auto scrollbar-thin ${
        isDarkMode
          ? 'scrollbar-track-gray-900 scrollbar-thumb-gray-800 hover:scrollbar-thumb-gray-700'
          : 'scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400'
      }`}>
        <table className={`min-w-full divide-y ${
          isDarkMode ? 'divide-gray-800/50' : 'divide-gray-200'
        }`}>
        <thead className={`backdrop-blur-sm sticky top-0 z-10 ${
          isDarkMode ? 'bg-black/90' : 'bg-gray-50/90'
        }`}>
          <tr className={`divide-x ${
            isDarkMode ? 'divide-gray-800/30' : 'divide-gray-200/30'
          }`}>
            {/* Select All Column */}
            <th className="px-2 py-3 w-10">
              <div className="flex justify-center">
                <div className="relative group flex items-center justify-center">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={areAllPageSelected}
                    onChange={onSelectAllPage}
                    disabled={items.length === 0 || !canSelectAllPage}
                    className={`appearance-none h-6 w-6 rounded-md border-2 transition-all duration-200 focus:ring-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md ${
                      isDarkMode
                        ? 'border-white bg-black focus:ring-white focus:border-white hover:border-white hover:shadow-white/30'
                        : 'border-gray-400 bg-white focus:ring-blue-500 focus:border-blue-500 hover:border-blue-500 hover:shadow-blue-500/30'
                    }`}
                    aria-label="Seleccionar todos los artículos de la página"
                  />
                  {areAllPageSelected && (
                    <span className="pointer-events-none absolute left-0 top-0 h-6 w-6 flex items-center justify-center">
                      <CheckCircle className={`h-5 w-5 drop-shadow-lg animate-pulse ${
                        isDarkMode ? 'text-white' : 'text-blue-600'
                      }`} />
                    </span>
                  )}
                  <span className={`absolute left-0 top-8 z-40 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xl border opacity-0 group-hover:opacity-100 group-hover:translate-y-1 transition-all pointer-events-none whitespace-nowrap w-auto min-w-[180px] ${
                    isDarkMode
                      ? 'bg-black text-white border-white'
                      : 'bg-white text-gray-900 border-gray-300'
                  }`}>
                    Seleccionar todos los artículos de la página
                  </span>
                </div>
              </div>
            </th>

            {/* Sortable Columns */}
            {columns.map(({ field, label }) => (
              <th
                key={field}
                onClick={() => onSort(field)}
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-all duration-200 group relative ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-gray-900/50'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  {label}
                  <ArrowUpDown className={`h-3.5 w-3.5 transition-all duration-200 transform ${
                    sortField === field
                      ? (isDarkMode ? 'text-white scale-110 animate-pulse' : 'text-gray-900 scale-110 animate-pulse')
                      : (isDarkMode ? 'text-gray-600 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-gray-600')
                  }`} />
                </div>
                {sortField === field && (
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 animate-pulse ${
                    isDarkMode ? 'bg-white/50' : 'bg-gray-900/50'
                  }`} />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`bg-transparent divide-y ${
          isDarkMode ? 'divide-gray-800/30' : 'divide-gray-200/30'
        }`}>
          {loading ? (
            <TableSkeleton />
          ) : error ? (
            <tr className="h-96">
              <td colSpan={6} className="px-6 py-24 text-center">
                <div className="flex flex-col items-center justify-center space-y-4 animate-fadeIn">
                  <div className="relative">
                    <AlertCircle className="h-16 w-16 text-red-500" />
                    <div className="absolute inset-0 w-16 h-16 border-4 border-red-500/20 rounded-full animate-ping" />
                  </div>
                  <p className="text-lg font-medium text-red-400">Error al cargar datos</p>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {error}
                  </p>
                  <button
                    onClick={onRetry}
                    className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 border hover:scale-105 transform ${
                      isDarkMode
                        ? 'bg-black text-white hover:bg-gray-900 border-gray-800 hover:border-white'
                        : 'bg-white text-gray-900 hover:bg-gray-50 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    Intentar nuevamente
                  </button>
                </div>
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr className="h-96">
              <td colSpan={6} className={`px-6 py-24 text-center ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <div className="flex flex-col items-center justify-center space-y-4 animate-fadeIn">
                  <div className="relative">
                    <Search className={`h-16 w-16 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                    <div className={`absolute inset-0 w-16 h-16 border-4 rounded-full animate-ping opacity-20 ${
                      isDarkMode ? 'border-gray-800' : 'border-gray-300'
                    }`} />
                  </div>
                  <p className="text-lg font-medium">No se encontraron resultados</p>
                  {searchTerm && (
                    <button
                      onClick={onClearSearch}
                      className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 flex items-center gap-2 border hover:scale-105 transform group ${
                        isDarkMode
                          ? 'bg-black text-white hover:bg-gray-900 border-gray-800 hover:border-white'
                          : 'bg-white text-gray-900 hover:bg-gray-50 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      <X className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
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
                <tr
                  key={mueble.id}
                  className={`group transition-all duration-200 animate-fadeIn border-l-2 cursor-pointer ${
                    isSelected
                      ? (isDarkMode
                        ? 'bg-gray-900/10 hover:bg-gray-900/20 border-white'
                        : 'bg-blue-50 hover:bg-blue-100 border-blue-500'
                      )
                      : (isDarkMode
                        ? 'hover:bg-gray-900/40 border-transparent hover:border-gray-700'
                        : 'hover:bg-gray-50 border-transparent hover:border-gray-300'
                      )
                  }`}
                  onClick={() => onToggleSelection(mueble)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Checkbox Cell */}
                  <td className="px-2 py-4">
                    <div className="flex justify-center">
                      <div className={`h-5 w-5 rounded-md border transform transition-all duration-300 flex items-center justify-center ${
                        isSelected
                          ? (isDarkMode
                            ? 'bg-white border-gray-300 scale-110'
                            : 'bg-blue-600 border-blue-600 scale-110'
                          )
                          : (isDarkMode
                            ? 'border-gray-700 group-hover:border-white'
                            : 'border-gray-300 group-hover:border-blue-500'
                          )
                      }`}>
                        {isSelected && (
                          <CheckCircle className={`h-4 w-4 animate-scale-check ${
                            isDarkMode ? 'text-black' : 'text-white'
                          }`} />
                        )}
                      </div>
                    </div>
                  </td>

                  {/* ID Cell */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col space-y-1">
                      <div className={`text-sm font-medium transition-colors ${
                        isDarkMode
                          ? 'text-white group-hover:text-gray-300'
                          : 'text-gray-900 group-hover:text-gray-700'
                      }`}>
                        {mueble.id_inv}
                      </div>
                      <div className={`text-xs transition-colors ${
                        isDarkMode
                          ? 'text-gray-500 group-hover:text-gray-400'
                          : 'text-gray-600 group-hover:text-gray-500'
                      }`}>
                        {mueble.rubro}
                      </div>
                      <div className={`text-[10px] font-mono px-2 py-0.5 rounded-full border inline-block w-fit transition-all duration-300
                        ${mueble.origen === 'INEA' ?
                          (isDarkMode ? 'bg-gray-900/30 text-white border-white group-hover:bg-gray-900/40' : 'bg-blue-100 text-blue-800 border-blue-400 group-hover:bg-blue-200') :
                          mueble.origen === 'ITEA' ?
                            (isDarkMode ? 'bg-pink-900/30 text-pink-200 border-pink-700 group-hover:bg-pink-900/40' : 'bg-pink-100 text-pink-800 border-pink-400 group-hover:bg-pink-200') :
                            mueble.origen === 'TLAXCALA' ?
                              (isDarkMode ? 'bg-purple-900/30 text-purple-200 border-purple-700 group-hover:bg-purple-900/40' : 'bg-purple-100 text-purple-800 border-purple-400 group-hover:bg-purple-200') :
                              (isDarkMode ? 'bg-gray-900/40 text-gray-400 border-gray-800 group-hover:bg-gray-900/60' : 'bg-gray-100 text-gray-600 border-gray-400 group-hover:bg-gray-200')}`}
                      >
                        {mueble.origen}
                      </div>
                    </div>
                  </td>

                  {/* Description Cell */}
                  <td className="px-4 py-4">
                    <div className={`text-sm transition-colors line-clamp-2 ${
                      isDarkMode
                        ? 'text-white group-hover:text-gray-300'
                        : 'text-gray-900 group-hover:text-gray-700'
                    }`}>
                      {mueble.descripcion}
                    </div>
                  </td>

                  {/* Area Cell */}
                  <td className="px-4 py-4">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all duration-300 
                      ${getColorClass(mueble.area, isDarkMode)} transform group-hover:scale-105`}>
                      {mueble.area || 'No especificada'}
                    </div>
                  </td>

                  {/* Usufinal Cell */}
                  <td className="px-4 py-4">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border gap-1 
                      ${getColorClass(mueble.usufinal, isDarkMode)} transform group-hover:scale-105 transition-all duration-300`}>
                      <User className={`h-3.5 w-3.5 ${
                        isDarkMode ? 'text-white' : 'text-gray-700'
                      }`} />
                      {mueble.usufinal || 'No asignado'}
                    </div>
                  </td>

                  {/* Estado Cell */}
                  <td className="px-4 py-4">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transform group-hover:scale-105 transition-all duration-300
                      ${mueble.estado === 'B' ?
                        (isDarkMode ? 'bg-green-900/20 text-green-300 border-green-900 group-hover:bg-green-900/30' : 'bg-green-100 text-green-800 border-green-400 group-hover:bg-green-200') :
                        mueble.estado === 'R' ?
                          (isDarkMode ? 'bg-yellow-900/20 text-yellow-300 border-yellow-900 group-hover:bg-yellow-900/30' : 'bg-yellow-100 text-yellow-800 border-yellow-400 group-hover:bg-yellow-200') :
                          mueble.estado === 'M' ?
                            (isDarkMode ? 'bg-red-900/20 text-red-300 border-red-900 group-hover:bg-red-900/30' : 'bg-red-100 text-red-800 border-red-400 group-hover:bg-red-200') :
                            mueble.estado === 'N' ?
                              (isDarkMode ? 'bg-gray-900/20 text-white border-gray-900 group-hover:bg-gray-900/30' : 'bg-gray-100 text-gray-800 border-gray-400 group-hover:bg-gray-200') :
                              (isDarkMode ? 'bg-gray-900/20 text-gray-300 border-gray-900 group-hover:bg-gray-900/30' : 'bg-gray-100 text-gray-600 border-gray-400 group-hover:bg-gray-200')}`}
                    >
                      {mueble.estado}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
  );
}
