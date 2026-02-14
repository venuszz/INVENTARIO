/**
 * ResguardosTable Component
 * 
 * Displays paginated resguardos with sorting and selection
 */

'use client';

import { ArrowUpDown, FileDigit, User, RefreshCw, AlertCircle, Search, X } from 'lucide-react';
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
  onResetSearch
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
                onClick={() => onSort('folio')}
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-all ${
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
                    onClick={() => onFolioClick(resguardo.folio)}
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
                        <FileDigit className="h-4 w-4" />
                        {resguardo.folio}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-sm ${
                      isDarkMode ? 'text-white/80' : 'text-black/80'
                    }`}>
                      {resguardo.f_resguardo.slice(0, 10).split('-').reverse().join('/')}
                    </td>
                    <td className="px-4 py-3 group relative">
                      <div className={`text-sm ${
                        isDarkMode ? 'text-white/80' : 'text-black/80'
                      }`}>
                        {resguardo.dir_area}
                      </div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-white/60' : 'text-black/60'
                      }`}>
                        {resguardo.area_resguardo}
                      </div>

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

                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-max max-w-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999]">
                        <div className={`absolute left-1/2 -top-2 -translate-x-1/2 border-8 border-transparent ${
                          isDarkMode ? 'border-b-black' : 'border-b-white'
                        }`}></div>
                        <div className={`rounded-lg shadow-xl p-4 border ${
                          isDarkMode
                            ? 'bg-black border-white/10'
                            : 'bg-white border-black/10'
                        }`}>
                          <h4 className={`text-sm font-medium mb-2 flex items-center gap-2 ${
                            isDarkMode ? 'text-white/80' : 'text-black/80'
                          }`}>
                            <User className="h-4 w-4" />
                            Resguardantes
                          </h4>
                          <div className="flex flex-col gap-2">
                            {Array.from(new Set(allResguardos
                              .filter(r => r.folio === resguardo.folio)
                              .map(r => (r as any).usufinal || 'Sin asignar')))
                              .map((resguardante, idx) => (
                                <div
                                  key={idx}
                                  className={`flex items-center gap-2 text-sm px-2 py-1 rounded-lg ${
                                    isDarkMode
                                      ? 'text-white/60 bg-white/5'
                                      : 'text-black/60 bg-black/5'
                                  }`}
                                >
                                  <div className={`h-2 w-2 rounded-full ${
                                    isDarkMode ? 'bg-white' : 'bg-black'
                                  }`}></div>
                                  {resguardante}
                                </div>
                              ))}
                          </div>
                        </div>
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
}
