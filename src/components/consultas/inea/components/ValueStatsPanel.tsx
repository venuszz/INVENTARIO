import { motion } from 'framer-motion';

interface ValueStatsPanelProps {
  filteredCount: number;
  totalCount: number;
  filteredValue: number;
  totalValue: number;
  hasActiveFilters: boolean;
  isDarkMode: boolean;
}

export default function ValueStatsPanel({
  filteredCount,
  totalCount,
  filteredValue,
  totalValue,
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
      <div className="flex items-center justify-center gap-[2vw]">
        {/* Conteo de Bienes */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-center"
        >
          <div className={`text-[clamp(0.625rem,0.75vw,0.875rem)] font-medium mb-[0.25vw] ${
            isDarkMode ? 'text-white/60' : 'text-black/60'
          }`}>
            {hasActiveFilters ? 'Bienes Filtrados' : 'Total de Bienes'}
          </div>
          <div className="text-[clamp(1.25rem,2vw,2.5rem)] font-light tracking-tight">
            {filteredCount.toLocaleString('es-MX')}
          </div>
          {hasActiveFilters && (
            <div className={`text-[clamp(0.625rem,0.75vw,0.875rem)] mt-[0.25vw] ${
              isDarkMode ? 'text-white/40' : 'text-black/40'
            }`}>
              de {totalCount.toLocaleString('es-MX')} totales
            </div>
          )}
        </motion.div>

        {/* Separador vertical */}
        <div className={`h-[3vw] min-h-[48px] w-px ${
          isDarkMode ? 'bg-white/10' : 'bg-black/10'
        }`} />

        {/* Valor Total */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="text-center"
        >
          <div className={`text-[clamp(0.625rem,0.75vw,0.875rem)] font-medium mb-[0.25vw] ${
            isDarkMode ? 'text-white/60' : 'text-black/60'
          }`}>
            {hasActiveFilters ? 'Valor Filtrado' : 'Valor Total'}
          </div>
          <div className="text-[clamp(1.25rem,2vw,2.5rem)] font-light tracking-tight">
            ${filteredValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          {hasActiveFilters && (
            <div className={`text-[clamp(0.625rem,0.75vw,0.875rem)] mt-[0.25vw] ${
              isDarkMode ? 'text-white/40' : 'text-black/40'
            }`}>
              de ${totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
