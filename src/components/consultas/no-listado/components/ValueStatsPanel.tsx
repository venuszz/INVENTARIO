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
      className={`mb-[1.5vw] p-[1vw] rounded-lg border transition-colors ${
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
          <div className={`font-medium mb-[0.25vw] ${
            isDarkMode ? 'text-white/60' : 'text-black/60'
          }`} style={{ fontSize: 'clamp(0.625rem, 0.75vw, 0.75rem)' }}>
            {hasActiveFilters ? 'Bienes Filtrados' : 'Total de Bienes'}
          </div>
          <div className="font-light tracking-tight" style={{ fontSize: 'clamp(1.25rem, 1.5vw, 1.5rem)' }}>
            {filteredCount.toLocaleString('es-MX')}
          </div>
          {hasActiveFilters && (
            <div className={`mt-[0.25vw] ${
              isDarkMode ? 'text-white/40' : 'text-black/40'
            }`} style={{ fontSize: 'clamp(0.625rem, 0.75vw, 0.75rem)' }}>
              de {totalCount.toLocaleString('es-MX')} totales
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
