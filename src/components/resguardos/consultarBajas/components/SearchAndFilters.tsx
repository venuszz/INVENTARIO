import { Search, X, RefreshCw } from 'lucide-react';

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
 * Search and filters component for the Bajas consultation page
 * Includes search input, date filter, director filter, and resguardante filter
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
  resetSearch,
  clearFilters,
  onRefresh,
  loading,
  isDarkMode,
  setCurrentPage
}) => {
  return (
    <>
      {/* Search */}
      <div className={`mb-6 p-4 rounded-xl border shadow-inner ${
        isDarkMode
          ? 'bg-gradient-to-br from-gray-900/50 to-red-900/10 border-gray-800'
          : 'bg-gradient-to-br from-gray-50 to-red-50/30 border-gray-200'
      }`}>
        <div className="flex flex-col gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className={`h-5 w-5 ${
                isDarkMode ? 'text-red-400/80' : 'text-gray-500'
              }`} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por folio de resguardo o baja..."
              className={`pl-10 pr-4 py-3 w-full border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${
                isDarkMode
                  ? 'bg-black border-gray-800 text-white placeholder-gray-500 focus:ring-red-500 hover:border-gray-700'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-red-500 hover:border-red-400'
              }`}
            />
          </div>

          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={resetSearch}
                disabled={!searchTerm}
                className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 text-sm ${
                  !searchTerm
                    ? 'opacity-50 cursor-not-allowed'
                    : isDarkMode
                    ? 'bg-black border-gray-800 text-gray-400 hover:bg-gray-900 hover:border-gray-700 hover:text-gray-300'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-red-400 hover:text-red-600'
                } ${
                  !searchTerm && (isDarkMode ? 'bg-black border-gray-800 text-gray-400' : 'bg-white border-gray-300 text-gray-600')
                }`}
              >
                <X className="h-4 w-4" />
                Limpiar búsqueda
              </button>
            </div>
            <button
              onClick={onRefresh}
              className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 text-sm ${
                isDarkMode
                  ? 'bg-gray-900/20 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600 hover:text-white'
                  : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-red-400 hover:text-red-600'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className={`mb-6 p-4 rounded-xl border shadow-inner ${
        isDarkMode
          ? 'bg-gray-900/30 border-gray-800'
          : 'bg-gray-50/50 border-gray-200'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block text-xs uppercase tracking-wider mb-1 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-600'
            }`}>
              Filtrar por fecha
            </label>
            <input
              title='Fecha de resguardo'
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={filterDate}
              onChange={e => {
                setCurrentPage(1);
                setFilterDate(e.target.value);
              }}
              className={`w-full border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 transition-all duration-300 ${
                isDarkMode
                  ? 'bg-black border-gray-800 text-white focus:ring-red-500 hover:border-gray-700'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-red-500 hover:border-red-400'
              }`}
            />
          </div>
          <div>
            <label className={`block text-xs uppercase tracking-wider mb-1 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-600'
            }`}>
              Filtrar por director
            </label>
            <input
              type="text"
              placeholder="Nombre del director..."
              value={filterDirector}
              onChange={e => {
                setCurrentPage(1);
                setFilterDirector(e.target.value);
              }}
              className={`w-full border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 transition-all duration-300 ${
                isDarkMode
                  ? 'bg-black border-gray-800 text-white placeholder-gray-500 focus:ring-red-500 hover:border-gray-700'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-red-500 hover:border-red-400'
              }`}
            />
          </div>
          <div>
            <label className={`block text-xs uppercase tracking-wider mb-1 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-600'
            }`}>
              Filtrar por resguardante
            </label>
            <input
              type="text"
              placeholder="Nombre del resguardante..."
              value={filterResguardante}
              onChange={e => {
                setCurrentPage(1);
                setFilterResguardante(e.target.value);
              }}
              className={`w-full border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 transition-all duration-300 ${
                isDarkMode
                  ? 'bg-black border-gray-800 text-white placeholder-gray-500 focus:ring-red-500 hover:border-gray-700'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-red-500 hover:border-red-400'
              }`}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={clearFilters}
            className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 text-sm ${
              isDarkMode
                ? 'bg-black border-gray-800 text-gray-400 hover:bg-gray-900 hover:border-gray-700 hover:text-gray-300'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-red-400 hover:text-red-600'
            }`}
          >
            <X className="h-4 w-4" />
            Limpiar filtros
          </button>
        </div>
      </div>
    </>
  );
};
