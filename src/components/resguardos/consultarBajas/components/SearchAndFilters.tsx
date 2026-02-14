/**
 * SearchAndFilters component for Consultar Bajas
 * Simplified search interface following the design pattern from crear and consultar modules
 */

import { Search, X } from 'lucide-react';

interface SearchAndFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterDate: string;
  setFilterDate: (value: string) => void;
  filterDirector: string;
  setFilterDirector: (value: string) => void;
  filterResguardante: string;
  setFilterResguardante: (value: string) => void;
  resetSearch: () => void;
  clearFilters: () => void;
  onRefresh: () => void;
  loading: boolean;
  isDarkMode: boolean;
  setCurrentPage: (page: number) => void;
}

/**
 * Search and filters component
 */
export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterDate,
  setFilterDate,
  filterDirector,
  setFilterDirector,
  filterResguardante,
  setFilterResguardante,
  clearFilters,
  isDarkMode,
  setCurrentPage
}) => {
  const hasActiveFilters = filterDate || filterDirector || filterResguardante;

  return (
    <div className={`rounded-lg border p-4 ${
      isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-black/[0.02] border-black/10'
    }`}>
      {/* Search input */}
      <div className="relative mb-4">
        <Search 
          size={16} 
          className={`absolute left-3 top-1/2 -translate-y-1/2 ${
            isDarkMode ? 'text-white/40' : 'text-black/40'
          }`}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por folio de resguardo o baja..."
          className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm transition-colors ${
            isDarkMode
              ? 'bg-white/[0.02] border-white/10 text-white placeholder-white/40 focus:border-white/30 focus:ring-1 focus:ring-white/20'
              : 'bg-black/[0.02] border-black/10 text-black placeholder-black/40 focus:border-black/30 focus:ring-1 focus:ring-black/20'
          } focus:outline-none`}
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className={`block text-xs mb-1.5 ${
            isDarkMode ? 'text-white/60' : 'text-black/60'
          }`}>
            Fecha
          </label>
          <input
            type="date"
            max={new Date().toISOString().split('T')[0]}
            value={filterDate}
            onChange={e => {
              setCurrentPage(1);
              setFilterDate(e.target.value);
            }}
            className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10 text-white focus:border-white/30'
                : 'bg-black/[0.02] border-black/10 text-black focus:border-black/30'
            } focus:outline-none`}
          />
        </div>
        <div>
          <label className={`block text-xs mb-1.5 ${
            isDarkMode ? 'text-white/60' : 'text-black/60'
          }`}>
            Director
          </label>
          <input
            type="text"
            placeholder="Nombre del director..."
            value={filterDirector}
            onChange={e => {
              setCurrentPage(1);
              setFilterDirector(e.target.value);
            }}
            className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10 text-white placeholder-white/40 focus:border-white/30'
                : 'bg-black/[0.02] border-black/10 text-black placeholder-black/40 focus:border-black/30'
            } focus:outline-none`}
          />
        </div>
        <div>
          <label className={`block text-xs mb-1.5 ${
            isDarkMode ? 'text-white/60' : 'text-black/60'
          }`}>
            Resguardante
          </label>
          <input
            type="text"
            placeholder="Nombre del resguardante..."
            value={filterResguardante}
            onChange={e => {
              setCurrentPage(1);
              setFilterResguardante(e.target.value);
            }}
            className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10 text-white placeholder-white/40 focus:border-white/30'
                : 'bg-black/[0.02] border-black/10 text-black placeholder-black/40 focus:border-black/30'
            } focus:outline-none`}
          />
        </div>
      </div>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={clearFilters}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${
              isDarkMode
                ? 'border-white/10 hover:bg-white/5 text-white'
                : 'border-black/10 hover:bg-black/5 text-black'
            }`}
          >
            <X className="h-4 w-4" />
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
};
