/**
 * ResguardosTable Component
 * 
 * Displays paginated resguardos with sorting and selection
 */

'use client';

import { ArrowUpDown, FileDigit, RefreshCw, AlertCircle, Search, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface Resguardo {
  folio: string;
  f_resguardo: string;
  dir_area: string;
  area_resguardo: string;
}

interface ResguardosTableProps {
  resguardos: Resguardo[];
  allResguardos: Resguardo[];
  selectedFolio: string | null;
  onFolioClick: (folio: string) => void;
  sortField: 'folio' | 'f_resguardo' | 'dir_area';
  sortDirection: 'asc' | 'desc';
  onSort: (field: 'folio' | 'f_resguardo' | 'dir_area') => void;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filterResguardante: string;
  onRetry: () => void;
  onResetSearch: () => void;
  rowsPerPage: number;
}

/**
 * ResguardosTable - Display paginated resguardos with sorting
 */
export default function ResguardosTable({
  resguardos,
  allResguardos,
  selectedFolio,
  onFolioClick,
  sortField,
  sortDirection,
  onSort,
  loading,
  error,
  searchTerm,
  filterResguardante,
  onRetry,
  onResetSearch,
  rowsPerPage
}: ResguardosTableProps) {
  const { isDarkMode } = useTheme();

  // Get unique folios
  const foliosUnicos = Array.from(
    new Map(resguardos.map(r => [r.folio, r])).values()
  );

  // Function to count articles by folio
  const getArticuloCount = (folio: string) => {
    return allResguardos.filter(r => r.folio === folio).length;
  };

  // Calculate skeleton rows needed
  const skeletonRowsCount = Math.max(0, rowsPerPage - foliosUnicos.length);

  return (
    <div className={`rounded-lg border overflow-hidden mb-4 flex flex-col h-[calc(131vh)] ${
      isDarkMode
        ? 'bg-white/[0.02] border-white/10'
        : 'bg-black/[0.02] border-black/10'
    }`}>
      <div className="flex-grow overflow-y-auto overflow-x-hidden">
        <table className="w-full table-fixed">
          <thead className={`sticky top-0 z-10 backdrop-blur-xl ${
            isDarkMode ? 'bg-black/95 border-b border-white/10' : 'bg-white/95 border-b border-black/10'
          }`}>
            <tr>
              <th
                onClick={() => onSort('folio')}
                className={`w-[20%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-all ${
                  sortField === 'folio'
                    ? isDarkMode 
                      ? 'text-white bg-white/[0.02]' 
                      : 'text-black bg-black/[0.02]'
                    : isDarkMode 
                      ? 'text-white/60 hover:bg-white/[0.02] hover:text-white' 
                      : 'text-black/60 hover:bg-black/[0.02] hover:text-black'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  Folio
                  <ArrowUpDown size={12} className={sortField === 'folio' ? 'opacity-100' : 'opacity-40'} />
                </div>
              </th>
              <th
                onClick={() => onSort('f_resguardo')}
                className={`w-[15%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-all ${
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
                className={`w-[50%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-all ${
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
                  Responsable
                  <ArrowUpDown size={12} className={sortField === 'dir_area' ? 'opacity-100' : 'opacity-40'} />
                </div>
              </th>
              <th className={`w-[15%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                isDarkMode ? 'text-white/60' : 'text-black/60'
              }`}>
                Artículos
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="h-96">
                <td colSpan={4} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className={`h-12 w-12 animate-spin ${
                      isDarkMode ? 'text-white/40' : 'text-black/40'
                    }`} />
                    <p className={`text-sm ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`}>
                      Cargando resguardos...
                    </p>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr className="h-96">
                <td colSpan={4} className="px-6 py-24 text-center">
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
            ) : resguardos.length === 0 ? (
              <tr className="h-96">
                <td colSpan={4} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Search className={`h-12 w-12 ${
                      isDarkMode ? 'text-white/20' : 'text-black/20'
                    }`} />
                    <p className={`text-sm ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`}>
                      No se encontraron resguardos
                    </p>
                    {searchTerm && (
                      <button
                        onClick={onResetSearch}
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
              foliosUnicos.map((resguardo) => {
                const itemCount = getArticuloCount(resguardo.folio);
                
                return (
                  <tr
                    key={resguardo.folio}
                    onClick={() => {
                      // Toggle selection: deselect if already selected
                      if (selectedFolio === resguardo.folio) {
                        onFolioClick('');
                      } else {
                        onFolioClick(resguardo.folio);
                      }
                    }}
                    className={`border-b transition-colors cursor-pointer ${
                      isDarkMode 
                        ? 'border-white/5 hover:bg-white/[0.02]' 
                        : 'border-black/5 hover:bg-black/[0.02]'
                    } ${selectedFolio === resguardo.folio ? (isDarkMode ? 'bg-white/[0.02]' : 'bg-black/[0.02]') : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className={`text-sm font-medium flex items-center gap-2 ${
                        isDarkMode ? 'text-white' : 'text-black'
                      }`}>
                        <FileDigit className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{resguardo.folio}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-sm ${
                      isDarkMode ? 'text-white/80' : 'text-black/80'
                    }`}>
                      {resguardo.f_resguardo.slice(0, 10).split('-').reverse().join('/')}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-sm truncate ${
                        isDarkMode ? 'text-white/80' : 'text-black/80'
                      }`}>
                        {resguardo.dir_area}
                      </div>
                      {resguardo.area_resguardo && (
                        <div className={`text-xs truncate ${
                          isDarkMode ? 'text-white/60' : 'text-black/60'
                        }`}>
                          {resguardo.area_resguardo}
                        </div>
                      )}

                      {filterResguardante && (
                        <div className="mt-1">
                          {Array.from(new Set(allResguardos
                            .filter(r => r.folio === resguardo.folio && (r as any).usufinal?.toLowerCase().includes(filterResguardante.toLowerCase()))
                            .map(r => (r as any).usufinal)))
                            .map((matchedResguardante, idx) => (
                              <div
                                key={idx}
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs mr-1 mb-1 border ${
                                  isDarkMode
                                    ? 'bg-white/10 text-white border-white/20'
                                    : 'bg-black/10 text-black border-black/20'
                                }`}
                              >
                                {matchedResguardante}
                              </div>
                            ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        isDarkMode 
                          ? 'bg-white/5 text-white/80 border-white/10' 
                          : 'bg-black/5 text-black/80 border-black/10'
                      }`}>
                        {itemCount}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
            
            {/* Skeleton rows to fill the page */}
            {!loading && !error && skeletonRowsCount > 0 && Array.from({ length: skeletonRowsCount }).map((_, idx) => (
              <tr
                key={`skeleton-${idx}`}
                className={`border-b ${
                  isDarkMode ? 'border-white/5' : 'border-black/5'
                }`}
              >
                <td className="px-4 py-3">
                  <div className={`h-4 w-24 rounded ${
                    isDarkMode ? 'bg-white/5' : 'bg-black/5'
                  }`} />
                </td>
                <td className="px-4 py-3">
                  <div className={`h-4 w-20 rounded ${
                    isDarkMode ? 'bg-white/5' : 'bg-black/5'
                  }`} />
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className={`h-4 w-full rounded ${
                      isDarkMode ? 'bg-white/5' : 'bg-black/5'
                    }`} />
                    <div className={`h-3 w-32 rounded ${
                      isDarkMode ? 'bg-white/5' : 'bg-black/5'
                    }`} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className={`h-6 w-8 rounded-full ${
                    isDarkMode ? 'bg-white/5' : 'bg-black/5'
                  }`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
