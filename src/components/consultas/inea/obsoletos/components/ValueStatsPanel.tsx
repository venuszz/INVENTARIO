import { motion } from 'framer-motion';

interface ValueStatsPanelProps {
  filteredCount: number;
  totalValue: number;
  loading: boolean;
  isDarkMode: boolean;
}

export function ValueStatsPanel({
  filteredCount,
  totalValue,
  loading,
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
      <div className="flex items-center justify-center gap-8">
        {/* Conteo de Bienes */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-center"
        >
          <div className={`text-xs font-medium mb-1 ${
            isDarkMode ? 'text-white/60' : 'text-black/60'
          }`}>
            Artículos de Baja
          </div>
          <div className="text-2xl font-light tracking-tight">
            {loading ? '...' : filteredCount.toLocaleString('es-MX')}
          </div>
        </motion.div>

        {/* Separador vertical */}
        <div className={`h-12 w-px ${
          isDarkMode ? 'bg-white/10' : 'bg-black/10'
        }`} />

        {/* Valor Total */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="text-center"
        >
          <div className={`text-xs font-medium mb-1 ${
            isDarkMode ? 'text-white/60' : 'text-black/60'
          }`}>
            Valor Total
          </div>
          <div className="text-2xl font-light tracking-tight">
            {loading ? '...' : `$${totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
