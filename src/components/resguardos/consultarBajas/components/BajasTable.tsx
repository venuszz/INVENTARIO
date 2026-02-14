import { ArrowUpDown, RefreshCw, AlertCircle, Search, FileDigit, Calendar, User, X } from 'lucide-react';
import type { ResguardoBaja, SortField } from '../types';
import { getItemCountBgColor } from '../utils';

interface BajasTableProps {
  bajas: ResguardoBaja[];
  loading: boolean;
  error: string | null;
  sortField: SortField;
  sortDirection: 'asc' | 'desc';
  selectedFolioResguardo: string | null;
  allBajas: ResguardoBaja[];
  filterResguardante: string;
  searchTerm: string;
  onSort: (field: SortField) => void;
  onRowClick: (folioResguardo: string) => void;
  onRetry: () => void;
  resetSearch: () => void;
  getArticuloCount: (folioResguardo: string) => number;
  isDarkMode: boolean;
}

/**
 * Bajas table component
 * Displays the list of bajas with sortable columns and row selection
 */
export const BajasTable: React.FC<BajasTableProps> = ({
  bajas,
  loading,
  error,
  sortField,
  sortDirection,
  selectedFolioResguardo,
  allBajas,
  filterResguardante,
  searchTerm,
  onSort,
  onRowClick,
  onRetry,
  resetSearch,
  getArticuloCount,
  isDarkMode
}) => {
  const foliosUnicos = Array.from(new Map(bajas.map(r => [r.folio_resguardo, r])).values());

  return (
    <div className={`rounded-xl border overflow-x-auto overflow-y-auto mb-6 flex flex-col flex-grow shadow-lg h-[40vh] max-h-[78vh] ${
      isDarkMode
        ? 'bg-gray-900/30 border-gray-800'
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex-grow min-w-[800px]">
        <table className={`min-w-full divide-y ${
          isDarkMode ? 'divide-gray-800' : 'divide-gray-200'
        }`}>
          <thead className={`sticky top-0 z-10 ${
            isDarkMode ? 'bg-black' : 'bg-gray-50'
          }`}>
            <tr>
              <th
                onClick={() => onSort('folio_resguardo')}
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors group ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-gray-900'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  Folio Resguardo
                  <ArrowUpDown className={`h-3.5 w-3.5 ${
                    sortField === 'folio_resguardo'
                      ? (isDarkMode ? 'text-red-400 animate-bounce' : 'text-red-600 animate-bounce')
                      : (isDarkMode ? 'text-gray-500 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-900')
                  }`} />
                </div>
              </th>
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Folio Baja
              </th>
              <th
                onClick={() => onSort('f_resguardo')}
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors group ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-gray-900'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  Fecha
                  <ArrowUpDown className={`h-3.5 w-3.5 ${
                    sortField === 'f_resguardo'
                      ? (isDarkMode ? 'text-red-400 animate-bounce' : 'text-red-600 animate-bounce')
                      : (isDarkMode ? 'text-gray-500 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-900')
                  }`} />
                </div>
              </th>
              <th
                onClick={() => onSort('dir_area')}
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors group ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-gray-900'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  Director
                  <ArrowUpDown className={`h-3.5 w-3.5 ${
                    sortField === 'dir_area'
                      ? (isDarkMode ? 'text-red-400 animate-bounce' : 'text-red-600 animate-bounce')
                      : (isDarkMode ? 'text-gray-500 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-900')
                  }`} />
                </div>
              </th>
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Artículos
              </th>
            </tr>
          </thead>
          <tbody className={`bg-transparent divide-y ${
            isDarkMode ? 'divide-gray-800/50' : 'divide-gray-200/50'
          }`}>
            {loading ? (
              <tr className="h-96">
                <td colSpan={5} className={`px-6 py-24 text-center ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <RefreshCw className={`h-12 w-12 animate-spin ${
                      isDarkMode ? 'text-red-500' : 'text-red-600'
                    }`} />
                    <p className="text-lg font-medium">Cargando resguardos dados de baja...</p>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr className="h-96">
                <td colSpan={5} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4 text-red-400">
                    <AlertCircle className="h-12 w-12" />
                    <p className="text-lg font-medium">Error al cargar resguardos dados de baja</p>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>{error}</p>
                    <button
                      onClick={onRetry}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors border ${
                        isDarkMode
                          ? 'bg-black text-red-300 hover:bg-gray-900 border-gray-800 hover:border-gray-700'
                          : 'bg-white text-red-600 hover:bg-gray-50 border-gray-300 hover:border-red-400'
                      }`}
                    >
                      Intentar nuevamente
                    </button>
                  </div>
                </td>
              </tr>
            ) : bajas.length === 0 ? (
              <tr className="h-96">
                <td colSpan={5} className={`px-6 py-24 text-center ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Search className={`h-12 w-12 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                    <p className="text-lg font-medium">No se encontraron resguardos dados de baja</p>
                    {searchTerm && (
                      <button
                        onClick={resetSearch}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 border ${
                          isDarkMode
                            ? 'bg-black text-red-400 hover:bg-gray-900 border-gray-800 hover:border-gray-700'
                            : 'bg-white text-red-600 hover:bg-gray-50 border-gray-300 hover:border-red-400'
                        }`}
                      >
                        <X className="h-4 w-4" />
                        Limpiar búsqueda
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              foliosUnicos.map((baja) => {
                const itemCount = getArticuloCount(baja.folio_resguardo);
                return (
                  <tr
                    key={baja.id}
                    className={`cursor-pointer transition-colors group ${
                      isDarkMode
                        ? 'hover:bg-gray-900/50'
                        : 'hover:bg-gray-50'
                    } ${
                      selectedFolioResguardo === baja.folio_resguardo
                        ? (isDarkMode
                          ? 'bg-red-900/10 border-l-4 border-red-500'
                          : 'bg-red-50 border-l-4 border-red-500'
                        )
                        : ''
                    }`}
                    onClick={() => onRowClick(baja.folio_resguardo)}
                  >
                    <td className="px-4 py-4">
                      <div className={`text-sm font-medium flex items-center gap-2 transition-colors ${
                        isDarkMode
                          ? 'text-red-400 group-hover:text-red-300'
                          : 'text-red-600 group-hover:text-red-700'
                      }`}>
                        <FileDigit className="h-4 w-4" />
                        {baja.folio_resguardo}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`text-sm font-medium flex items-center gap-2 transition-colors ${
                        isDarkMode
                          ? 'text-gray-400 group-hover:text-red-400'
                          : 'text-gray-600 group-hover:text-red-600'
                      }`}>
                        <FileDigit className="h-4 w-4" />
                        {baja.folio_baja}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`text-sm flex items-center gap-2 transition-colors ${
                        isDarkMode
                          ? 'text-white group-hover:text-gray-200'
                          : 'text-gray-900 group-hover:text-gray-700'
                      }`}>
                        <Calendar className={`h-4 w-4 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        {baja.f_resguardo.slice(0, 10).split('-').reverse().join('/')}
                      </div>
                    </td>
                    <td className="px-4 py-4 group relative">
                      <div className={`text-sm transition-colors ${
                        isDarkMode
                          ? 'text-white hover:text-red-400'
                          : 'text-gray-900 hover:text-red-600'
                      }`}>
                        {baja.dir_area}
                      </div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-600'
                      }`}>{baja.area_resguardo}</div>

                      {filterResguardante && (
                        <div className="mt-1">
                          {Array.from(new Set(allBajas
                            .filter(r => r.folio_resguardo === baja.folio_resguardo && r.usufinal?.toLowerCase().includes(filterResguardante.toLowerCase()))
                            .map(r => r.usufinal)))
                            .map((matchedResguardante, idx) => (
                              <div
                                key={idx}
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs mr-1 mb-1 border ${
                                  isDarkMode
                                    ? 'bg-red-500/20 border-red-500/30 text-red-300'
                                    : 'bg-red-100 border-red-300 text-red-700'
                                }`}
                              >
                                {matchedResguardante}
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Tooltip */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-max max-w-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999]">
                        <div className={`absolute left-1/2 -top-2 -translate-x-1/2 border-8 border-transparent ${
                          isDarkMode ? 'border-b-gray-800' : 'border-b-white'
                        }`}></div>
                        <div className={`border rounded-lg shadow-xl p-4 ${
                          isDarkMode
                            ? 'bg-black border-gray-800'
                            : 'bg-white border-gray-200'
                        }`}>
                          <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            <User className={`h-4 w-4 ${
                              isDarkMode ? 'text-red-400' : 'text-red-600'
                            }`} />
                            Resguardantes
                          </h4>
                          <div className="flex flex-col gap-2">
                            {Array.from(new Set(allBajas
                              .filter(r => r.folio_resguardo === baja.folio_resguardo)
                              .map(r => r.usufinal || 'Sin asignar')))
                              .map((resguardante, idx) => (
                                <div
                                  key={idx}
                                  className={`flex items-center gap-2 text-sm px-2 py-1 rounded-lg w-full transition-colors ${
                                    isDarkMode
                                      ? 'text-gray-400 bg-gray-900/50 hover:bg-gray-800/70'
                                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                                  }`}
                                >
                                  <div className={`h-2 w-2 rounded-full animate-pulse ${
                                    isDarkMode ? 'bg-red-500' : 'bg-red-600'
                                  }`}></div>
                                  {resguardante}
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getItemCountBgColor(itemCount)} shadow-inner transition-all duration-300 hover:scale-105`}>
                        {itemCount} artículo{itemCount !== 1 ? 's' : ''}
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
};
