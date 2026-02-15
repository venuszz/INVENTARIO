import { ArrowUpDown, RefreshCw, AlertCircle, Search, X } from 'lucide-react';
import type { ResguardoBaja, SortField } from '../types';

interface BajasTableProps {
  bajas: ResguardoBaja[];
  loading: boolean;
  error: string | null;
  sortField: SortField;
  sortDirection: 'asc' | 'desc';
  selectedFolioResguardo: string | null;
  allBajas: ResguardoBaja[];
  onSort: (field: SortField) => void;
  onRowClick: (folioResguardo: string) => void;
  onRetry: () => void;
  getArticuloCount: (folioResguardo: string) => number;
  isDarkMode: boolean;
}

/**
 * Bajas table component
 */
export const BajasTable: React.FC<BajasTableProps> = ({
  bajas,
  loading,
  error,
  sortField,
  sortDirection,
  selectedFolioResguardo,
  allBajas,
  onSort,
  onRowClick,
  onRetry,
  getArticuloCount,
  isDarkMode
}) => {
  const foliosUnicos = Array.from(new Map(bajas.map(r => [r.folio_resguardo, r])).values());

  return (
    <div className={`rounded-lg border overflow-hidden mb-4 flex flex-col flex-grow max-h-[78vh] ${
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
              <th
                onClick={() => onSort('folio_resguardo')}
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-all ${
                  sortField === 'folio_resguardo'
                    ? isDarkMode 
                      ? 'text-white bg-white/[0.02]' 
                      : 'text-black bg-black/[0.02]'
                    : isDarkMode 
                      ? 'text-white/60 hover:bg-white/[0.02] hover:text-white' 
                      : 'text-black/60 hover:bg-black/[0.02] hover:text-black'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  Folio Resguardo
                  <ArrowUpDown size={12} className={sortField === 'folio_resguardo' ? 'opacity-100' : 'opacity-40'} />
                </div>
              </th>
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                isDarkMode ? 'text-white/60' : 'text-black/60'
              }`}>
                Folio Baja
              </th>
              <th
                onClick={() => onSort('f_resguardo')}
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-all ${
                  sortField === 'f_resguardo'
                    ? isDarkMode 
                      ? 'text-white bg-white/[0.02]' 
                      : 'text-black bg-black/[0.02]'
                    : isDarkMode 
                      ? 'text-white/60 hover:bg-white/[0.02] hover:text-white' 
                      : 'text-black/60 hover:bg-black/[0.02] hover:text-black'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  Fecha
                  <ArrowUpDown size={12} className={sortField === 'f_resguardo' ? 'opacity-100' : 'opacity-40'} />
                </div>
              </th>
              <th
                onClick={() => onSort('dir_area')}
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-all ${
                  sortField === 'dir_area'
                    ? isDarkMode 
                      ? 'text-white bg-white/[0.02]' 
                      : 'text-black bg-black/[0.02]'
                    : isDarkMode 
                      ? 'text-white/60 hover:bg-white/[0.02] hover:text-white' 
                      : 'text-black/60 hover:bg-black/[0.02] hover:text-black'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  Director
                  <ArrowUpDown size={12} className={sortField === 'dir_area' ? 'opacity-100' : 'opacity-40'} />
                </div>
              </th>
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                isDarkMode ? 'text-white/60' : 'text-black/60'
              }`}>
                Artículos
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="h-96">
                <td colSpan={5} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className={`h-12 w-12 animate-spin ${
                      isDarkMode ? 'text-white/40' : 'text-black/40'
                    }`} />
                    <p className={`text-sm ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`}>
                      Cargando resguardos dados de baja...
                    </p>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr className="h-96">
                <td colSpan={5} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <AlertCircle className={`h-12 w-12 ${
                      isDarkMode ? 'text-red-400' : 'text-red-500'
                    }`} />
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-red-400' : 'text-red-500'
                    }`}>
                      Error al cargar resguardos
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
            ) : bajas.length === 0 ? (
              <tr className="h-96">
                <td colSpan={5} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Search className={`h-12 w-12 ${
                      isDarkMode ? 'text-white/20' : 'text-black/20'
                    }`} />
                    <p className={`text-sm ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`}>
                      No se encontraron resguardos dados de baja
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              foliosUnicos.map((baja) => {
                const itemCount = getArticuloCount(baja.folio_resguardo);
                
                return (
                  <tr
                    key={baja.id}
                    onClick={() => onRowClick(baja.folio_resguardo)}
                    className={`border-b transition-colors cursor-pointer ${
                      isDarkMode 
                        ? 'border-white/5 hover:bg-white/[0.02]' 
                        : 'border-black/5 hover:bg-black/[0.02]'
                    } ${selectedFolioResguardo === baja.folio_resguardo ? (isDarkMode ? 'bg-white/[0.02]' : 'bg-black/[0.02]') : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-black'
                      }`}>
                        {baja.folio_resguardo}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-sm ${
                      isDarkMode ? 'text-white/80' : 'text-black/80'
                    }`}>
                      {baja.folio_baja}
                    </td>
                    <td className={`px-4 py-3 text-sm ${
                      isDarkMode ? 'text-white/80' : 'text-black/80'
                    }`}>
                      {baja.f_resguardo.slice(0, 10).split('-').reverse().join('/')}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-sm ${
                        isDarkMode ? 'text-white/80' : 'text-black/80'
                      }`}>
                        {baja.dir_area}
                      </div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-white/60' : 'text-black/60'
                      }`}>
                        {baja.area_resguardo}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        isDarkMode 
                          ? 'bg-white/5 text-white/80 border-white/10' 
                          : 'bg-black/5 text-black/80 border-black/10'
                      }`}>
                        {itemCount} artículo{itemCount !== 1 ? 's' : ''}
                      </span>
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
};
