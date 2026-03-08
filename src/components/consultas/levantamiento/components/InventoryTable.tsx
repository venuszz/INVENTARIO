/**
 * InventoryTable Component
 * 
 * Renders the data table with sortable columns, origin badges,
 * resguardo badges, and status badges.
 */

import { BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LevMueble, SortDirection } from '../types';
import { getOrigenColors, getEstatusColors } from '../utils';
import { SortableHeader } from './SortableHeader';
import { CellSkeleton } from '@/components/shared/CellSkeleton';
import OrigenBadge from '@/components/consultas/shared/OrigenBadge';
import { useTransferModeContext } from './BatchTransfer/useTransferModeContext';

/**
 * Component props interface
 */
interface InventoryTableProps {
  muebles: LevMueble[];
  sortField: keyof LevMueble;
  sortDirection: SortDirection;
  onSort: (field: keyof LevMueble) => void;
  foliosResguardo: Record<string, string>;
  onFolioClick: (folio: string) => void;
  syncingIds: string[];
  isDarkMode: boolean;
  // Transfer mode props
  transferMode?: boolean;
  selectedItems?: Set<string>;
  onItemSelect?: (itemId: string) => void;
  onSelectAll?: () => void;
  allSelected?: boolean;
  blockedItems?: Map<string, string>;
  // All filtered items for select all functionality
  allFilteredMuebles?: LevMueble[];
}

/**
 * InventoryTable component
 * 
 * Displays inventory data in a table format with:
 * - Sortable column headers
 * - Origin badges (INEA, ITEA, TLAXCALA)
 * - Resguardo badges with click handlers
 * - Status badges with color coding
 * - Text truncation for long fields
 * - Sticky header
 * 
 * @param props - Component props
 * @returns JSX element with inventory table
 */
export function InventoryTable({
  muebles,
  sortField,
  sortDirection,
  onSort,
  foliosResguardo,
  onFolioClick,
  syncingIds,
  isDarkMode,
  transferMode: transferModeProp = false,
  selectedItems: selectedItemsProp = new Set(),
  onItemSelect: onItemSelectProp,
  onSelectAll: onSelectAllProp,
  allSelected: allSelectedProp = false,
  blockedItems: blockedItemsProp = new Map(),
  allFilteredMuebles,
}: InventoryTableProps) {

  // Try to get transfer mode context
  const transferContext = useTransferModeContext();
  
  // Use context values if available, otherwise use props
  const transferMode = transferContext ? true : transferModeProp;
  const selectedItems = transferContext?.selectedItems ?? selectedItemsProp;
  const onItemSelect = transferContext?.handleItemSelect ?? onItemSelectProp;
  
  // Use allFilteredMuebles for select all logic if provided, otherwise use muebles
  const mueblesForSelectAll = allFilteredMuebles || muebles;
  
  const onSelectAll = transferContext 
    ? () => transferContext.handleSelectAll(mueblesForSelectAll)
    : onSelectAllProp;
  const allSelected = transferContext 
    ? transferContext.isAllSelected(mueblesForSelectAll)
    : allSelectedProp;
  const blockedItems = transferContext?.blockedItems ?? blockedItemsProp;

  const origenColors = getOrigenColors(isDarkMode);
  const estatusColors = getEstatusColors(isDarkMode);

  /**
   * Check if a mueble is currently syncing
   */
  const isMuebleSyncing = (muebleId: string) => {
    return syncingIds.includes(muebleId);
  };

  /**
   * Check if an item is blocked from transfer
   */
  const isItemBlocked = (itemId: string) => {
    return blockedItems.has(itemId);
  };

  /**
   * Get block reason for an item
   */
  const getBlockReason = (itemId: string) => {
    return blockedItems.get(itemId);
  };

  return (
    <div className={`rounded-lg border overflow-hidden ${isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/10'
      }`}>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          {/* Table Header */}
          <thead className={`sticky top-0 z-10 backdrop-blur-xl ${isDarkMode ? 'bg-black/95 border-b border-white/10' : 'bg-white/95 border-b border-black/10'
            }`}>
            <tr>
              {/* Checkbox Column - Only visible in transfer mode */}
              {transferMode && (
                <th className={`px-4 py-3 text-left w-12 ${isDarkMode ? 'text-white/60' : 'text-black/60'
                  }`}>
                  <div className="flex items-center justify-center">
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={onSelectAll}
                        className="sr-only peer"
                        aria-label="Seleccionar todos los items"
                      />
                      <motion.div 
                        className={`
                          w-5 h-5 rounded border-2 transition-all duration-200
                          flex items-center justify-center
                          ${isDarkMode
                            ? 'border-white/30 peer-checked:bg-white peer-checked:border-white'
                            : 'border-black/30 peer-checked:bg-black peer-checked:border-black'
                          }
                          group-hover:border-opacity-60
                        `}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <AnimatePresence>
                          {allSelected && (
                            <motion.svg 
                              className={`w-3 h-3 ${isDarkMode ? 'text-black' : 'text-white'}`} 
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
                    </label>
                  </div>
                </th>
              )}
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                Origen
              </th>
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                Resguardo
              </th>
              <SortableHeader
                field="id_inv"
                label="ID Inventario"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={onSort}
              />
              <SortableHeader
                field="descripcion"
                label="Descripción"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={onSort}
              />
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                Área
              </th>
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                Jefe/Director
              </th>
              <SortableHeader
                field="estatus"
                label="Estatus"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={onSort}
              />
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {muebles.map((item, index) => {
              const isBlocked = isItemBlocked(item.id);
              const blockReason = getBlockReason(item.id);
              const isSelected = selectedItems.has(item.id);

              return (
              <motion.tr
                key={`${item.origen}-${item.id || ''}-${item.id_inv || ''}-${index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
                onClick={() => {
                  if (transferMode && !isBlocked) {
                    onItemSelect?.(item.id);
                  }
                }}
                className={`border-b transition-colors ${
                  isBlocked && transferMode
                    ? isDarkMode
                      ? 'opacity-50 bg-white/[0.01] border-white/5 cursor-not-allowed'
                      : 'opacity-50 bg-black/[0.01] border-black/5 cursor-not-allowed'
                    : isDarkMode
                      ? `border-white/5 hover:bg-white/[0.02] ${transferMode && !isBlocked ? 'cursor-pointer' : ''}`
                      : `border-black/5 hover:bg-black/[0.02] ${transferMode && !isBlocked ? 'cursor-pointer' : ''}`
                }`}
              >
                {/* Checkbox Cell - Only visible in transfer mode */}
                {transferMode && (
                  <td className="px-4 py-3 text-xs" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isBlocked}
                          onChange={() => onItemSelect?.(item.id)}
                          className="sr-only peer"
                          aria-label={`Seleccionar item ${item.id_inv}`}
                          aria-checked={isSelected}
                          title={isBlocked ? blockReason : undefined}
                        />
                        <motion.div 
                          className={`
                            w-5 h-5 rounded border-2 transition-all duration-200
                            flex items-center justify-center
                            ${isBlocked
                              ? isDarkMode
                                ? 'border-white/10 bg-white/5 cursor-not-allowed'
                                : 'border-black/10 bg-black/5 cursor-not-allowed'
                              : isDarkMode
                                ? 'border-white/30 peer-checked:bg-white peer-checked:border-white group-hover:border-white/50'
                                : 'border-black/30 peer-checked:bg-black peer-checked:border-black group-hover:border-black/50'
                            }
                          `}
                          whileHover={!isBlocked ? { scale: 1.1 } : {}}
                          whileTap={!isBlocked ? { scale: 0.9 } : {}}
                        >
                          <AnimatePresence>
                            {isSelected && !isBlocked && (
                              <motion.svg 
                                className={`w-3 h-3 ${isDarkMode ? 'text-black' : 'text-white'}`} 
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
                      </label>
                      {isBlocked && (
                        <span
                          className={`text-xs ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}
                          title={blockReason}
                        >
                          ⚠
                        </span>
                      )}
                    </div>
                  </td>
                )}

                {/* Origen Badge */}
                <td className="px-4 py-3 text-xs" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    {/* Color indicator for ITEJPA items */}
                    {item.origen === 'ITEJPA' && item.colores?.nombre && (() => {
                      const colorHex =
                        item.colores.nombre === 'ROJO' ? '#ef4444' :
                          item.colores.nombre === 'BLANCO' ? '#ffffff' :
                            item.colores.nombre === 'VERDE' ? '#22c55e' :
                              item.colores.nombre === 'AMARILLO' ? '#eab308' :
                                item.colores.nombre === 'AZUL' ? '#3b82f6' :
                                  item.colores.nombre === 'NARANJA' ? '#f97316' :
                                    '#9ca3af';

                      const isWhite = item.colores.nombre === 'BLANCO';

                      return (
                        <div className="relative group/color">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200 cursor-help group-hover/color:scale-150 group-hover/color:shadow-lg"
                            style={{
                              backgroundColor: colorHex,
                              border: isWhite
                                ? `1.5px solid ${isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'}`
                                : 'none',
                              opacity: 0.9,
                              boxShadow: `0 0 8px ${colorHex}40`
                            }}
                          />
                          {/* Popover on hover */}
                          <div
                            className="absolute left-0 top-full mt-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover/color:opacity-100 transition-all duration-200 z-50 shadow-xl backdrop-blur-sm"
                            style={{
                              backgroundColor: `${colorHex}f5`,
                              border: `2px solid ${colorHex}`,
                              color: isWhite ? '#000000' : '#ffffff',
                              minWidth: '120px'
                            }}
                          >
                            {/* Arrow */}
                            <div
                              className="absolute -top-1.5 left-2 w-3 h-3 rotate-45"
                              style={{
                                backgroundColor: colorHex,
                                borderTop: `2px solid ${colorHex}`,
                                borderLeft: `2px solid ${colorHex}`,
                                borderRight: 'none',
                                borderBottom: 'none'
                              }}
                            />
                            <div className="relative">
                              <div className="font-bold text-sm tracking-wide mb-1">
                                {item.colores.nombre}
                              </div>
                              {item.colores.significado && (
                                <div
                                  className="text-[11px] leading-tight font-light"
                                  style={{
                                    color: isWhite ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)'
                                  }}
                                >
                                  {item.colores.significado}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    <OrigenBadge
                      currentOrigen={item.origen as 'INEA' | 'ITEJPA' | 'TLAXCALA'}
                      idInventario={item.id_inv}
                      recordId={item.id}
                      onTransferSuccess={() => {
                        // No llamar onRefetch/reindex aquí.
                        // El realtime ya maneja el INSERT (en destino) y DELETE (en origen)
                        // de forma incremental via addMueble/removeMueble en cada store.
                      }}
                      hasActiveResguardo={!!(item.id_inv && foliosResguardo[item.id_inv as string])}
                      isDarkMode={isDarkMode}
                      variant="levantamiento"
                      itemDescription={item.descripcion || ''}
                      itemArea={item.area?.nombre || ''}
                      itemDirector={item.directorio?.nombre || ''}
                      itemColor={item.color || null}
                      itemColorName={item.colores?.nombre || null}
                      itemColorSignificado={item.colores?.significado || null}
                      disabled={transferMode}
                    />
                  </div>
                </td>

                {/* Resguardo Badge */}
                <td className="px-4 py-3 text-xs">
                  {item.id_inv && foliosResguardo[item.id_inv as string] ? (
                    <motion.button
                      onClick={() => onFolioClick(foliosResguardo[item.id_inv as string])}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${isDarkMode
                        ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                        : 'bg-black/10 text-black border-black/20 hover:bg-black/20'
                        }`}
                      title={`Ver resguardo ${foliosResguardo[item.id_inv as string]}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <BadgeCheck size={12} />
                      {foliosResguardo[item.id_inv as string]}
                    </motion.button>
                  ) : (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${isDarkMode
                      ? 'bg-white/[0.02] text-white/40 border-white/10'
                      : 'bg-black/[0.02] text-black/40 border-black/10'
                      }`}>
                      Sin resguardo
                    </span>
                  )}
                </td>

                {/* ID Inventario */}
                <td className={`px-4 py-4 align-top text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                  {item.id_inv}
                </td>

                {/* Descripción */}
                <td className={`px-4 py-4 align-top text-sm ${isDarkMode ? 'text-white/80' : 'text-black/80'
                  }`}>
                  <div className="line-clamp-3" title={item.descripcion || ''}>
                    {item.descripcion}
                  </div>
                </td>

                {/* Área */}
                <td className={`px-4 py-4 align-top text-sm ${isDarkMode ? 'text-white/80' : 'text-black/80'
                  }`}>
                  {isMuebleSyncing(item.id) ? (
                    <CellSkeleton />
                  ) : (
                    <div className="line-clamp-3" title={item.area?.nombre || ''}>
                      {item.area?.nombre || '-'}
                    </div>
                  )}
                </td>

                {/* Usuario Final / Resguardante */}
                <td className={`px-4 py-4 align-top text-sm ${isDarkMode ? 'text-white/80' : 'text-black/80'
                  }`}>
                  {isMuebleSyncing(item.id) ? (
                    <div className="flex flex-col gap-1">
                      <CellSkeleton />
                      {item.resguardante && <CellSkeleton />}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <span className={`font-medium line-clamp-3 ${isDarkMode ? 'text-white' : 'text-black'
                        }`} title={item.directorio?.nombre || ''}>
                        {item.directorio?.nombre || (
                          <span className={isDarkMode ? 'text-white/40' : 'text-black/40'}>
                            Sin director
                          </span>
                        )}
                      </span>
                      {item.resguardante && (
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border line-clamp-3 ${isDarkMode
                          ? 'bg-white/5 text-white/80 border-white/10'
                          : 'bg-black/5 text-black/80 border-black/10'
                          }`} title={item.resguardante}>
                          {item.resguardante}
                        </span>
                      )}
                    </div>
                  )}
                </td>

                {/* Estatus Badge */}
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${(item.config_estatus?.concepto || item.estatus) === 'ACTIVO'
                    ? estatusColors.ACTIVO
                    : (item.config_estatus?.concepto || item.estatus) === 'INACTIVO'
                      ? estatusColors.INACTIVO
                      : (item.config_estatus?.concepto || item.estatus) === 'NO LOCALIZADO'
                        ? estatusColors['NO LOCALIZADO']
                        : estatusColors.DEFAULT
                    }`}>
                    {item.config_estatus?.concepto || item.estatus}
                  </span>
                </td>
              </motion.tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
