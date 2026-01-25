/**
 * LoadingStates Component
 * 
 * Renders loading, error, and empty state UI for the levantamiento component.
 * Provides consistent styling and animations across all states.
 */

import { RefreshCw, AlertCircle, Search } from 'lucide-react';
import { motion } from 'framer-motion';

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
 */
export function LoadingStates({
  loading,
  error,
  isEmpty,
  onRetry,
  isDarkMode
}: LoadingStatesProps) {
  
  // Loading state
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex flex-col items-center justify-center min-h-[400px] w-full rounded-lg ${
          isDarkMode ? 'bg-black/50' : 'bg-white/50'
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <RefreshCw 
              size={48} 
              className={`animate-spin ${
                isDarkMode ? 'text-white/60' : 'text-black/60'
              }`}
            />
          </div>
          <div className="text-center">
            <h3 className={`text-lg font-medium mb-1 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              Cargando datos...
            </h3>
            <p className={`text-sm ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}>
              Por favor espera un momento
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex flex-col items-center justify-center min-h-[400px] w-full rounded-lg ${
          isDarkMode ? 'bg-black/50' : 'bg-white/50'
        }`}
      >
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className={`p-4 rounded-full ${
            isDarkMode ? 'bg-red-500/10' : 'bg-red-50'
          }`}>
            <AlertCircle 
              size={48} 
              className={isDarkMode ? 'text-red-400' : 'text-red-600'}
            />
          </div>
          <div>
            <h3 className={`text-lg font-medium mb-2 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              Error al cargar los datos
            </h3>
            <p className={`text-sm mb-4 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}>
              {error}
            </p>
          </div>
          <motion.button
            onClick={onRetry}
            className={`px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition-all ${
              isDarkMode
                ? 'bg-black border-white/10 text-white hover:border-white/20 hover:bg-white/[0.02]'
                : 'bg-white border-black/10 text-black hover:border-black/20 hover:bg-black/[0.02]'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw size={16} />
            Reintentar
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex flex-col items-center justify-center min-h-[400px] w-full rounded-lg ${
          isDarkMode ? 'bg-black/50' : 'bg-white/50'
        }`}
      >
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className={`p-4 rounded-full ${
            isDarkMode ? 'bg-white/10' : 'bg-black/10'
          }`}>
            <Search 
              size={48} 
              className={isDarkMode ? 'text-white/60' : 'text-black/60'}
            />
          </div>
          <div>
            <h3 className={`text-lg font-medium mb-2 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              No se encontraron resultados
            </h3>
            <p className={`text-sm mb-4 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}>
              Intenta ajustar los filtros o la búsqueda
            </p>
          </div>
          <motion.button
            onClick={onRetry}
            className={`px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition-all ${
              isDarkMode
                ? 'bg-black border-white/10 text-white hover:border-white/20 hover:bg-white/[0.02]'
                : 'bg-white border-black/10 text-black hover:border-black/20 hover:bg-black/[0.02]'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw size={16} />
            Recargar inventario
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // No state to render
  return null;
}
