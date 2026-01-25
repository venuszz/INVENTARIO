/**
 * InventoryTable Component
 * 
 * Renders the data table with sortable columns, origin badges,
 * resguardo badges, and status badges.
 */

import React from 'react';
import { ArrowUpDown, BadgeCheck } from 'lucide-react';
import { LevMueble, SortDirection } from '../types';
import { getOrigenColors, getEstatusColors, truncateText } from '../utils';

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
  isDarkMode: boolean;
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
 * 
 * @example
 * <InventoryTable
 *   muebles={paginatedMuebles}
 *   sortField={sortField}
 *   sortDirection={sortDirection}
 *   onSort={handleSort}
 *   foliosResguardo={foliosResguardo}
 *   onFolioClick={handleFolioClick}
 *   isDarkMode={isDarkMode}
 * />
 */
export function InventoryTable({
  muebles,
  sortField,
  sortDirection,
  onSort,
  foliosResguardo,
  onFolioClick,
  isDarkMode
}: InventoryTableProps): React.ReactElement {
  
  const origenColors = getOrigenColors(isDarkMode);
  const estatusColors = getEstatusColors(isDarkMode);

  /**
   * Sortable column header component
   */
  function SortableHeader({ 
    field, 
    label 
  }: { 
    field: keyof LevMueble; 
    label: string 
  }): React.ReactElement {
    return (
      <th
        onClick={() => onSort(field)}
        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${
          isDarkMode 
            ? 'text-white hover:bg-white/10' 
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        title={`Ordenar por ${label}`}
      >
        <div className="flex items-center gap-1">
          {label}
          <ArrowUpDown className="h-3 w-3" />
        </div>
      </th>
    );
  }

  return (
    <div className={`rounded-lg border overflow-x-auto overflow-y-auto flex flex-col flex-grow max-h-[70vh] ${
      isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
    }`}>
      <table className={`min-w-full ${
        isDarkMode ? 'divide-y divide-gray-800' : 'divide-y divide-gray-200'
      }`}>
        {/* Table Header */}
        <thead className={`sticky top-0 z-10 border-b ${
          isDarkMode ? 'bg-black/80 border-white/10' : 'bg-gray-50 border-gray-200'
        }`}>
          <tr>
            <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
              isDarkMode ? 'text-white' : 'text-gray-700'
            }`}>
              Origen
            </th>
            <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
              isDarkMode ? 'text-white' : 'text-gray-700'
            }`}>
              Resguardo
            </th>
            <SortableHeader field="id_inv" label="ID Inventario" />
            <SortableHeader field="descripcion" label="Descripción" />
            <SortableHeader field="area" label="Área" />
            <SortableHeader field="usufinal" label="Jefe/Director de Área" />
            <SortableHeader field="estatus" label="Estatus" />
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className={`divide-y ${
          isDarkMode ? 'bg-black/60 divide-gray-800' : 'bg-white divide-gray-200'
        }`}>
          {muebles.map((item, index) => (
            <tr
              key={`${item.origen}-${item.id || ''}-${item.id_inv || ''}-${index}`}
              className={`transition-colors ${
                isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
              }`}
            >
              {/* Origen Badge */}
              <td className="px-4 py-3 text-xs">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold ${
                  origenColors[item.origen]
                }`}>
                  {item.origen}
                </span>
              </td>

              {/* Resguardo Badge */}
              <td className="px-4 py-3 text-xs">
                {item.id_inv && foliosResguardo[item.id_inv as string] ? (
                  <button
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold border shadow-sm hover:scale-105 transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-white/10 text-white border-white/30 hover:bg-white/20 hover:text-white' 
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    }`}
                    title={`Ver resguardo ${foliosResguardo[item.id_inv as string]}`}
                    onClick={() => onFolioClick(foliosResguardo[item.id_inv as string])}
                  >
                    <BadgeCheck className={`h-4 w-4 mr-1 ${
                      isDarkMode ? 'text-white/80' : 'text-blue-600'
                    }`} />
                    {foliosResguardo[item.id_inv as string]}
                  </button>
                ) : (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold border ${
                    isDarkMode 
                      ? 'bg-gray-900/60 text-gray-400 border-gray-700' 
                      : 'bg-gray-100 text-gray-600 border-gray-300'
                  }`}>
                    Sin resguardo
                  </span>
                )}
              </td>

              {/* ID Inventario */}
              <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {item.id_inv}
              </td>

              {/* Descripción */}
              <td className={`px-4 py-3 text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {truncateText(item.descripcion, 40)}
              </td>

              {/* Área */}
              <td className={`px-4 py-3 text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {truncateText(item.area, 20)}
              </td>

              {/* Usuario Final / Resguardante */}
              <td className={`px-4 py-3 text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <div className="flex flex-col gap-1">
                  <span className={`font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {truncateText(item.usufinal, 20) || (
                      <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>
                        Sin director
                      </span>
                    )}
                  </span>
                  {item.resguardante && (
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border shadow-sm ${
                      isDarkMode 
                        ? 'bg-white/10 text-white border-white/20' 
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {truncateText(item.resguardante, 20)}
                    </span>
                  )}
                </div>
              </td>

              {/* Estatus Badge */}
              <td className="px-4 py-3 text-sm">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  item.estatus === 'ACTIVO' 
                    ? estatusColors.ACTIVO
                    : item.estatus === 'INACTIVO' 
                      ? estatusColors.INACTIVO
                      : item.estatus === 'NO LOCALIZADO' 
                        ? estatusColors['NO LOCALIZADO']
                        : estatusColors.DEFAULT
                }`}>
                  {item.estatus}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
