/**
 * LoadingStates Component
 * 
 * Renders loading, error, and empty state UI for the levantamiento component.
 * Provides consistent styling and animations across all states.
 */

import React from 'react';
import { RefreshCw, AlertCircle, Search } from 'lucide-react';

/**
 * Component props interface
 */
interface LoadingStatesProps {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  onRetry: () => void;
  isDarkMode: boolean;
}

/**
 * LoadingStates component
 * 
 * Displays appropriate UI based on the current state:
 * - Loading: Animated spinner with loading message
 * - Error: Error icon with message and retry button
 * - Empty: Search icon with no results message and reload button
 * 
 * @param props - Component props
 * @returns JSX element with appropriate state UI
 * 
 * @example
 * <LoadingStates
 *   loading={isLoading}
 *   error={errorMessage}
 *   isEmpty={filteredData.length === 0}
 *   onRetry={handleReindex}
 *   isDarkMode={isDarkMode}
 * />
 */
export function LoadingStates({
  loading,
  error,
  isEmpty,
  onRetry,
  isDarkMode
}: LoadingStatesProps): React.ReactElement | null {
  
  // Loading state
  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[300px] w-full rounded-lg animate-fadeIn ${
        isDarkMode ? 'bg-black/80' : 'bg-gray-100'
      }`}>
        <div className="flex flex-col items-center gap-4 py-12">
          <RefreshCw className={`h-14 w-14 animate-spin ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <span className={`text-2xl font-bold ${
            isDarkMode ? 'text-white drop-shadow-white/30' : 'text-gray-900'
          }`}>
            Cargando datos...
          </span>
          <span className={`text-base ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Por favor espera un momento
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[300px] w-full rounded-lg animate-fadeIn ${
        isDarkMode ? 'bg-black/80' : 'bg-gray-100'
      }`}>
        <div className="flex flex-col items-center gap-4 py-12">
          <AlertCircle className={`h-14 w-14 animate-bounce ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <span className={`text-2xl font-bold ${
            isDarkMode ? 'text-white drop-shadow-white/30' : 'text-gray-900'
          }`}>
            Error al cargar los datos
          </span>
          <span className={`text-base mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {error}
          </span>
          <button
            onClick={onRetry}
            className={`px-6 py-3 rounded-xl font-bold text-lg shadow-lg border transition-all duration-200 flex items-center gap-2 mt-2 ${
              isDarkMode 
                ? 'bg-white/10 text-white border-white/30 hover:bg-white/20' 
                : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
            }`}
            title="Reintentar carga de datos"
          >
            <RefreshCw className="h-5 w-5" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[300px] w-full rounded-lg animate-fadeIn ${
        isDarkMode ? 'bg-black/80' : 'bg-gray-100'
      }`}>
        <div className="flex flex-col items-center gap-4 py-12">
          <Search className={`h-14 w-14 animate-pulse ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <span className={`text-2xl font-bold ${
            isDarkMode ? 'text-white drop-shadow-white/30' : 'text-gray-900'
          }`}>
            No se encontraron resultados
          </span>
          <span className={`text-base mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Intenta ajustar los filtros o la búsqueda.
          </span>
          <button
            onClick={onRetry}
            className={`px-6 py-3 rounded-xl font-bold text-lg shadow-lg border transition-all duration-200 flex items-center gap-2 mt-2 ${
              isDarkMode 
                ? 'bg-white/10 text-white border-white/30 hover:bg-white/20' 
                : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
            }`}
            title="Recargar inventario"
          >
            <RefreshCw className="h-5 w-5" />
            Recargar inventario
          </button>
        </div>
      </div>
    );
  }

  // No state to render
  return null;
}
