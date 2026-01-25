/**
 * InventoryTable Component
 * 
 * Renders the data table with sortable columns, origin badges,
 * resguardo badges, and status badges.
 */

import { ArrowUpDown, BadgeCheck } from 'lucide-react';
import { motion } from 'framer-motion';
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
 */
export function InventoryTable({
  muebles,
  sortField,
  sortDirection,
  onSort,
  foliosResguardo,
  onFolioClick,
  isDarkMode
}: InventoryTableProps) {
  
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

  return (
    <div className={`rounded-lg border overflow-hidden ${
      isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/10'
    }`}>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          {/* Table Header */}
          <thead className={`sticky top-0 z-10 backdrop-blur-xl ${
            isDarkMode ? 'bg-black/95 border-b border-white/10' : 'bg-white/95 border-b border-black/10'
          }`}>
            <tr>
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                isDarkMode ? 'text-white/60' : 'text-black/60'
              }`}>
                Origen
              </th>
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                isDarkMode ? 'text-white/60' : 'text-black/60'
              }`}>
                Resguardo
              </th>
              <SortableHeader field="id_inv" label="ID Inventario" />
              <SortableHeader field="descripcion" label="Descripción" />
              <SortableHeader field="area" label="Área" />
              <SortableHeader field="usufinal" label="Jefe/Director" />
              <SortableHeader field="estatus" label="Estatus" />
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {muebles.map((item, index) => (
              <motion.tr
                key={`${item.origen}-${item.id || ''}-${item.id_inv || ''}-${index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
                className={`border-b transition-colors ${
                  isDarkMode 
                    ? 'border-white/5 hover:bg-white/[0.02]' 
                    : 'border-black/5 hover:bg-black/[0.02]'
                }`}
              >
                {/* Origen Badge */}
                <td className="px-4 py-3 text-xs">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                    origenColors[item.origen]
                  }`}>
                    {item.origen}
                  </span>
                </td>

                {/* Resguardo Badge */}
                <td className="px-4 py-3 text-xs">
                  {item.id_inv && foliosResguardo[item.id_inv as string] ? (
                    <motion.button
                      onClick={() => onFolioClick(foliosResguardo[item.id_inv as string])}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
                        isDarkMode 
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
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                      isDarkMode 
                        ? 'bg-white/[0.02] text-white/40 border-white/10' 
                        : 'bg-black/[0.02] text-black/40 border-black/10'
                    }`}>
                      Sin resguardo
                    </span>
                  )}
                </td>

                {/* ID Inventario */}
                <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {item.id_inv}
                </td>

                {/* Descripción */}
                <td className={`px-4 py-3 text-sm ${
                  isDarkMode ? 'text-white/80' : 'text-black/80'
                }`}>
                  {truncateText(item.descripcion, 40)}
                </td>

                {/* Área */}
                <td className={`px-4 py-3 text-sm ${
                  isDarkMode ? 'text-white/80' : 'text-black/80'
                }`}>
                  {truncateText(item.area, 20)}
                </td>

                {/* Usuario Final / Resguardante */}
                <td className={`px-4 py-3 text-sm ${
                  isDarkMode ? 'text-white/80' : 'text-black/80'
                }`}>
                  <div className="flex flex-col gap-1">
                    <span className={`font-medium ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>
                      {truncateText(item.usufinal, 20) || (
                        <span className={isDarkMode ? 'text-white/40' : 'text-black/40'}>
                          Sin director
                        </span>
                      )}
                    </span>
                    {item.resguardante && (
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${
                        isDarkMode 
                          ? 'bg-white/5 text-white/80 border-white/10' 
                          : 'bg-black/5 text-black/80 border-black/10'
                      }`}>
                        {truncateText(item.resguardante, 20)}
                      </span>
                    )}
                  </div>
                </td>

                {/* Estatus Badge */}
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
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
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
