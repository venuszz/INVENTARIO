/**
 * SelectedItemsList component
 * Displays list of selected items with individual resguardante inputs
 */

import { LayoutGrid, TagIcon, Trash2, Briefcase, MapPin } from 'lucide-react';
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
    <div className={`rounded-lg border p-4 flex-grow overflow-y-hidden relative max-h-[70vh] ${
      isDarkMode
        ? 'bg-white/[0.02] border-white/10'
        : 'bg-black/[0.02] border-black/10'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between mb-3 pb-3 border-b ${
        isDarkMode ? 'border-white/10' : 'border-black/10'
      }`}>
        <div className="flex items-center gap-2">
          <LayoutGrid className={`h-4 w-4 ${
            isDarkMode ? 'text-white/60' : 'text-black/60'
          }`} />
          <span className={`text-sm font-medium ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Artículos Seleccionados
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            isDarkMode 
              ? 'bg-white/10 text-white border-white/20' 
              : 'bg-black/10 text-black border-black/20'
          }`}>
            {items.length}
          </span>
        </div>
        
        {/* Clear all button */}
        {items.length > 0 && (
          <button
            onClick={onClearAll}
            className={`px-2 py-1 rounded text-xs border transition-colors flex items-center gap-1 ${
              isDarkMode
                ? 'bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/20'
                : 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'
            }`}
            title="Eliminar todos los artículos seleccionados"
          >
            <Trash2 size={12} />
            Limpiar
          </button>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className={`flex flex-col items-center justify-center h-full min-h-[200px] ${
          isDarkMode ? 'text-white/40' : 'text-black/40'
        }`}>
          <TagIcon className={`h-10 w-10 mb-2 ${
            isDarkMode ? 'text-white/20' : 'text-black/20'
          }`} />
          <p className="text-sm">No hay artículos seleccionados</p>
          <p className="text-xs mt-1">Selecciona artículos de la tabla</p>
        </div>
      ) : (
        /* Items list */
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {items.map((mueble) => {
            // Helper function to get estado label
            const getEstadoLabel = (estado: string | null) => {
              if (!estado) return 'Sin estado';
              switch (estado) {
                case 'B': return 'Bueno';
                case 'R': return 'Regular';
                case 'M': return 'Malo';
                case 'N': return 'Nuevo';
                default: return estado;
              }
            };

            return (
            <div
              key={`selected-${mueble.id}`}
              className={`rounded-lg p-3 flex justify-between items-start border transition-colors ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]'
                  : 'bg-black/[0.02] border-black/10 hover:bg-black/[0.04]'
              }`}
            >
              <div className="flex-1 min-w-0">
                {/* ID and badges row */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {/* ID Inventario */}
                  <div className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    {mueble.id_inv || (
                      <span className={`italic ${
                        isDarkMode ? 'text-white/40' : 'text-black/40'
                      }`}>
                        Sin ID
                      </span>
                    )}
                  </div>
                  
                  {/* Estado badge */}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border
                    ${mueble.estado === 'B' ?
                      (isDarkMode ? 'bg-green-500/10 text-green-300 border-green-500/30' : 'bg-green-100 text-green-700 border-green-300') :
                      mueble.estado === 'R' ?
                        (isDarkMode ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' : 'bg-yellow-100 text-yellow-700 border-yellow-300') :
                        mueble.estado === 'M' ?
                          (isDarkMode ? 'bg-red-500/10 text-red-300 border-red-500/30' : 'bg-red-100 text-red-700 border-red-300') :
                          mueble.estado === 'N' ?
                            (isDarkMode ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-300') :
                            (isDarkMode ? 'bg-white/5 text-white/60 border-white/20' : 'bg-black/5 text-black/60 border-black/20')}`}>
                    {getEstadoLabel(mueble.estado)}
                  </span>
                  
                  {/* Origen badge */}
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border
                    ${mueble.origen === 'INEA' ?
                      (isDarkMode ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-300') :
                      mueble.origen === 'ITEA' ?
                        (isDarkMode ? 'bg-pink-500/10 text-pink-300 border-pink-500/30' : 'bg-pink-100 text-pink-700 border-pink-300') :
                        mueble.origen === 'TLAXCALA' ?
                          (isDarkMode ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-300') :
                          (isDarkMode ? 'bg-white/5 text-white/60 border-white/20' : 'bg-black/5 text-black/60 border-black/20')}`}>
                    {mueble.origen || 'Sin origen'}
                  </span>
                </div>

                {/* Description */}
                <p className={`text-xs mb-1.5 line-clamp-2 ${
                  isDarkMode ? 'text-white/70' : 'text-black/70'
                }`}>
                  {mueble.descripcion || (
                    <span className={`italic ${
                      isDarkMode ? 'text-white/40' : 'text-black/40'
                    }`}>
                      Sin descripción
                    </span>
                  )}
                </p>

                {/* Rubro and Area - smaller and full display */}
                <div className="flex flex-col gap-0.5 mb-2">
                  {mueble.rubro && (
                    <div className={`text-[10px] flex items-center gap-1 ${
                      isDarkMode ? 'text-white/40' : 'text-black/40'
                    }`}>
                      <Briefcase size={9} />
                      <span>{mueble.rubro}</span>
                    </div>
                  )}
                  
                  {mueble.area && (
                    <div className={`text-[10px] flex items-center gap-1 ${
                      isDarkMode ? 'text-white/40' : 'text-black/40'
                    }`}>
                      <MapPin size={9} />
                      <span>{mueble.area}</span>
                    </div>
                  )}
                  
                  {!mueble.rubro && !mueble.area && (
                    <div className={`text-[10px] italic ${
                      isDarkMode ? 'text-white/30' : 'text-black/30'
                    }`}>
                      Sin rubro ni área
                    </div>
                  )}
                </div>

                {/* Individual resguardante input */}
                <input
                  type="text"
                  value={mueble.resguardanteAsignado || ''}
                  onChange={(e) => onUpdateItemResguardante(mueble.id, e.target.value)}
                  placeholder="Resguardante individual (opcional)"
                  className={`block w-full border rounded py-1.5 px-2 text-xs transition-colors ${
                    isDarkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-white/30 focus:outline-none'
                      : 'bg-black/5 border-black/10 text-black placeholder-black/40 focus:border-black/30 focus:outline-none'
                  }`}
                />
              </div>

              {/* Remove button */}
              <button
                title='Eliminar artículo'
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveItem(mueble);
                }}
                className={`ml-2 p-1 rounded transition-colors ${
                  isDarkMode
                    ? 'text-white/40 hover:text-red-400 hover:bg-white/5'
                    : 'text-black/40 hover:text-red-600 hover:bg-black/5'
                }`}
              >
                <Trash2 size={14} />
              </button>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
