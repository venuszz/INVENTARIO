import { motion } from 'framer-motion';

interface ValueStatsPanelProps {
  filteredCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  isDarkMode: boolean;
}

export default function ValueStatsPanel({
  filteredCount,
  totalCount,
  hasActiveFilters,
  isDarkMode
}: ValueStatsPanelProps) {
  return (
    <motion.div 
      className={`mb-6 p-4 rounded-lg border transition-colors ${
        isDarkMode 
          ? 'bg-white/[0.02] border-white/10' 
          : 'bg-black/[0.02] border-black/10'
      }`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-center"
        >
          <div className={`text-xs font-medium mb-1 ${
            isDarkMode ? 'text-white/60' : 'text-black/60'
          }`}>
            {hasActiveFilters ? 'Bienes Filtrados' : 'Total de Bienes'}
          </div>
          <div className="text-2xl font-light tracking-tight">
            {filteredCount.toLocaleString('es-MX')}
          </div>
          {hasActiveFilters && (
            <div className={`text-xs mt-1 ${
              isDarkMode ? 'text-white/40' : 'text-black/40'
            }`}>
              de {totalCount.toLocaleString('es-MX')} totales
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
