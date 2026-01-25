/**
 * SelectedItemsList component
 * Displays list of selected items with individual resguardante inputs
 */

import { LayoutGrid, TagIcon, Trash2, Briefcase } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import type { Mueble } from '../types';

interface SelectedItemsListProps {
  items: Mueble[];
  onRemoveItem: (mueble: Mueble) => void;
  onUpdateItemResguardante: (itemId: string, resguardante: string) => void;
  onClearAll: () => void;
}

/**
 * Component for displaying and managing selected items
 */
export function SelectedItemsList({
  items,
  onRemoveItem,
  onUpdateItemResguardante,
  onClearAll
}: SelectedItemsListProps) {
  const { isDarkMode } = useTheme();

  return (
    <div className={`rounded-xl border p-4 flex-grow overflow-y-hidden shadow-inner relative max-h-[70vh] hover:shadow-lg transition-shadow ${
      isDarkMode
        ? 'bg-gray-900/30 border-gray-800'
        : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`flex items-center gap-2 mb-2 sticky top-0 z-30 p-2 -m-2 backdrop-blur-md ${
        isDarkMode ? 'bg-black/80' : 'bg-white/80'
      }`}>
        <LayoutGrid className={`h-5 w-5 animate-pulse ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`} />
        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
          Artículos Seleccionados ({items.length})
        </span>
        
        {/* Clear all button */}
        {items.length > 0 && (
          <button
            onClick={onClearAll}
            className={`ml-2 px-3 py-1 rounded text-xs font-semibold transition-colors border flex items-center gap-1 ${
              isDarkMode
                ? 'bg-red-700/80 text-white hover:bg-red-600 border-red-900'
                : 'bg-red-600 text-white hover:bg-red-700 border-red-700'
            }`}
            title="Eliminar todos los artículos seleccionados"
          >
            <Trash2 className="h-3 w-3" /> Eliminar todos
          </button>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className={`flex flex-col items-center justify-center h-full min-h-[200px] ${
          isDarkMode ? 'text-gray-500' : 'text-gray-600'
        }`}>
          <TagIcon className={`h-12 w-12 mb-2 ${
            isDarkMode ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <p className="text-sm">No hay artículos seleccionados</p>
          <p className="text-xs mt-1">Haga clic en un artículo para agregarlo</p>
        </div>
      ) : (
        /* Items list */
        <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto pr-1">
          {items.map((mueble) => (
            <div
              key={`selected-${mueble.id}`}
              className={`rounded-lg p-3 flex justify-between items-start border shadow-sm hover:shadow-md transition-all ${
                isDarkMode
                  ? 'bg-black border-gray-800 hover:border-blue-500'
                  : 'bg-gray-50 border-gray-200 hover:border-blue-400'
              }`}
            >
              <div className="flex-1 min-w-0">
                {/* ID and Estado */}
                <div className="flex items-center gap-2">
                  <div className={`text-sm font-medium truncate ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {mueble.id_inv}
                  </div>
                  <div className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium 
                    ${mueble.estado === 'B' ?
                      (isDarkMode ? 'bg-green-900/20 text-green-300 border border-green-900' : 'bg-green-100 text-green-800 border border-green-400') :
                      mueble.estado === 'R' ?
                        (isDarkMode ? 'bg-yellow-900/20 text-yellow-300 border border-yellow-900' : 'bg-yellow-100 text-yellow-800 border border-yellow-400') :
                        mueble.estado === 'M' ?
                          (isDarkMode ? 'bg-red-900/20 text-red-300 border border-red-900' : 'bg-red-100 text-red-800 border border-red-400') :
                          mueble.estado === 'N' ?
                            (isDarkMode ? 'bg-blue-900/20 text-blue-300 border border-blue-900' : 'bg-blue-100 text-blue-800 border border-blue-400') :
                            (isDarkMode ? 'bg-gray-900/20 text-gray-300 border border-gray-900' : 'bg-gray-100 text-gray-600 border border-gray-400')}`}>
                    {mueble.estado}
                  </div>
                </div>

                {/* Description */}
                <p className={`text-sm mt-1 truncate ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {mueble.descripcion}
                </p>

                {/* Rubro */}
                <div className={`text-xs mt-1 flex items-center gap-1 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-600'
                }`}>
                  <Briefcase className="h-3 w-3" />
                  {mueble.rubro}
                </div>

                {/* Origen badge */}
                <div className={`text-[10px] mt-1 font-mono px-2 py-0.5 rounded-full border inline-block
                  ${mueble.origen === 'INEA' ?
                    (isDarkMode ? 'bg-blue-900/30 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-800 border-blue-400') :
                    mueble.origen === 'ITEA' ?
                      (isDarkMode ? 'bg-pink-900/30 text-pink-200 border-pink-700' : 'bg-pink-100 text-pink-800 border-pink-400') :
                      mueble.origen === 'TLAXCALA' ?
                        (isDarkMode ? 'bg-purple-900/30 text-purple-200 border-purple-700' : 'bg-purple-100 text-purple-800 border-purple-400') :
                        (isDarkMode ? 'bg-gray-900/40 text-gray-400 border-gray-800' : 'bg-gray-100 text-gray-600 border-gray-400')}`}
                >
                  {mueble.origen}
                </div>

                {/* Individual resguardante input */}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={mueble.resguardanteAsignado || ''}
                    onChange={(e) => onUpdateItemResguardante(mueble.id, e.target.value)}
                    placeholder="Resguardante individual (opcional)"
                    className={`block w-full border rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-1 focus:border-blue-500 transition-colors ${
                      isDarkMode
                        ? 'bg-gray-900/50 border-gray-800 text-white placeholder-gray-500 focus:ring-blue-500 hover:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 hover:border-blue-400'
                    }`}
                  />
                </div>
              </div>

              {/* Remove button */}
              <button
                title='Eliminar artículo'
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveItem(mueble);
                }}
                className={`ml-2 p-1 rounded-full transition-colors ${
                  isDarkMode
                    ? 'text-gray-400 hover:text-red-400 hover:bg-gray-900/50'
                    : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'
                }`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
