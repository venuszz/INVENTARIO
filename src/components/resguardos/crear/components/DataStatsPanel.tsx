/**
 * DataStatsPanel component
 * Displays statistics about inventory data sources and filtering
 */

import { Database, ChevronRight, CheckCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { useState } from 'react';

interface DataStatsPanelProps {
  ineaTotal: number;
  ineaTotalWithBaja: number;
  ineaActive: number;
  ineaBaja: number;
  iteaTotal: number;
  iteaActive: number;
  iteaInactive: number;
  tlaxcalaTotal: number;
  totalRaw: number;
  excludedByStatus: number;
  excludedByResguardo: number;
  availableCount: number;
  filteredCount: number;
  hasActiveFilters: boolean;
}

/**
 * Panel showing data statistics and filtering information
 */
export function DataStatsPanel({
  ineaTotal,
  ineaTotalWithBaja,
  ineaBaja,
  iteaTotal,
  iteaActive,
  iteaInactive,
  tlaxcalaTotal,
  availableCount
}: DataStatsPanelProps) {
  const { isDarkMode } = useTheme();
  const [showHelp, setShowHelp] = useState(false);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);

  return (
    <motion.div 
      className={`mb-4 py-2 px-4 rounded-lg border transition-all relative ${
        isDarkMode
          ? 'bg-white/[0.02] border-white/10'
          : 'bg-black/[0.02] border-black/10'
      }`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="flex items-center justify-center gap-4">
        {/* INEA */}
        <div 
          className="flex items-center gap-1.5 relative cursor-help"
          onMouseEnter={() => setHoveredStat('inea')}
          onMouseLeave={() => setHoveredStat(null)}
        >
          <Database size={12} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
          <span className={`text-[10px] uppercase font-medium ${
            isDarkMode ? 'text-white/40' : 'text-black/40'
          }`}>
            INEA:
          </span>
          <span className={`text-xs font-semibold ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            {ineaTotal.toLocaleString()}
          </span>

          {/* INEA Tooltip */}
          <AnimatePresence>
            {hoveredStat === 'inea' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 rounded-lg border shadow-lg z-50 whitespace-nowrap text-[10px] ${
                  isDarkMode
                    ? 'bg-black border-white/20 text-white'
                    : 'bg-white border-black/20 text-black'
                }`}
              >
                <div className="font-medium mb-0.5">
                  {ineaTotal.toLocaleString()} de {ineaTotalWithBaja.toLocaleString()} registros
                </div>
                <div className={isDarkMode ? 'text-white/60' : 'text-black/60'}>
                  Excluye {ineaBaja > 0 ? `${ineaBaja.toLocaleString()} con` : ''} estatus BAJA
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Separator */}
        <div className={`h-3 w-px ${
          isDarkMode ? 'bg-white/10' : 'bg-black/10'
        }`} />

        {/* ITEA */}
        <div 
          className="flex items-center gap-1.5 relative cursor-help"
          onMouseEnter={() => setHoveredStat('itea')}
          onMouseLeave={() => setHoveredStat(null)}
        >
          <Database size={12} className={isDarkMode ? 'text-pink-400' : 'text-pink-600'} />
          <span className={`text-[10px] uppercase font-medium ${
            isDarkMode ? 'text-white/40' : 'text-black/40'
          }`}>
            ITEA:
          </span>
          <span className={`text-xs font-semibold ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            {iteaActive.toLocaleString()}
          </span>

          {/* ITEA Tooltip */}
          <AnimatePresence>
            {hoveredStat === 'itea' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 rounded-lg border shadow-lg z-50 whitespace-nowrap text-[10px] ${
                  isDarkMode
                    ? 'bg-black border-white/20 text-white'
                    : 'bg-white border-black/20 text-black'
                }`}
              >
                <div className="font-medium mb-0.5">
                  {iteaActive.toLocaleString()} de {iteaTotal.toLocaleString()} registros
                </div>
                <div className={isDarkMode ? 'text-white/60' : 'text-black/60'}>
                  Solo ACTIVO ({iteaInactive.toLocaleString()} excluidos)
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Separator */}
        <div className={`h-3 w-px ${
          isDarkMode ? 'bg-white/10' : 'bg-black/10'
        }`} />

        {/* TLAXCALA */}
        <div 
          className="flex items-center gap-1.5 relative cursor-help"
          onMouseEnter={() => setHoveredStat('tlax')}
          onMouseLeave={() => setHoveredStat(null)}
        >
          <Database size={12} className={isDarkMode ? 'text-purple-400' : 'text-purple-600'} />
          <span className={`text-[10px] uppercase font-medium ${
            isDarkMode ? 'text-white/40' : 'text-black/40'
          }`}>
            TLAX:
          </span>
          <span className={`text-xs font-semibold ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            {tlaxcalaTotal.toLocaleString()}
          </span>

          {/* TLAX Tooltip */}
          <AnimatePresence>
            {hoveredStat === 'tlax' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 rounded-lg border shadow-lg z-50 whitespace-nowrap text-[10px] ${
                  isDarkMode
                    ? 'bg-black border-white/20 text-white'
                    : 'bg-white border-black/20 text-black'
                }`}
              >
                <div className="font-medium mb-0.5">
                  {tlaxcalaTotal.toLocaleString()} registros
                </div>
                <div className={isDarkMode ? 'text-white/60' : 'text-black/60'}>
                  Todos los registros incluidos
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Separator */}
        <div className={`h-3 w-px ${
          isDarkMode ? 'bg-white/10' : 'bg-black/10'
        }`} />

        {/* Available */}
        <div 
          className="flex items-center gap-1.5 relative cursor-help"
          onMouseEnter={() => setHoveredStat('available')}
          onMouseLeave={() => setHoveredStat(null)}
        >
          <ChevronRight size={12} className={isDarkMode ? 'text-white/20' : 'text-black/20'} />
          <CheckCircle size={12} className={isDarkMode ? 'text-green-400' : 'text-green-600'} />
          <span className={`text-[10px] uppercase font-medium ${
            isDarkMode ? 'text-white/40' : 'text-black/40'
          }`}>
            Disponibles:
          </span>
          <span className={`text-xs font-semibold ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            {availableCount.toLocaleString()}
          </span>

          {/* Available Tooltip */}
          <AnimatePresence>
            {hoveredStat === 'available' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 rounded-lg border shadow-lg z-50 whitespace-nowrap text-[10px] ${
                  isDarkMode
                    ? 'bg-black border-white/20 text-white'
                    : 'bg-white border-black/20 text-black'
                }`}
              >
                <div className="font-medium mb-0.5">
                  {availableCount.toLocaleString()} registros disponibles
                </div>
                <div className={isDarkMode ? 'text-white/60' : 'text-black/60'}>
                  Sin resguardo asignado
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Help Icon */}
        <div className="relative ml-2">
          <button
            onMouseEnter={() => setShowHelp(true)}
            onMouseLeave={() => setShowHelp(false)}
            className={`p-1 rounded-full transition-colors ${
              isDarkMode
                ? 'hover:bg-white/5 text-white/40 hover:text-white/60'
                : 'hover:bg-black/5 text-black/40 hover:text-black/60'
            }`}
          >
            <HelpCircle size={12} />
          </button>

          {/* Help Tooltip */}
          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
                className={`absolute top-full right-0 mt-2 w-64 px-3 py-2 rounded-lg border shadow-lg z-50 text-[10px] ${
                  isDarkMode
                    ? 'bg-black border-white/20 text-white'
                    : 'bg-white border-black/20 text-black'
                }`}
              >
                <div className="font-medium mb-1">Información de filtrado</div>
                <div className={`leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                  Los filtros de datos están configurados a nivel de sistema. Si necesita algún cambio, comuníquese con un desarrollador.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
