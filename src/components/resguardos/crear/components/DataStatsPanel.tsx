/**
 * DataStatsPanel component
 * Displays statistics about inventory data sources and filtering
 */

import { Database, Filter, CheckCircle, XCircle, ChevronRight, ArrowRight, HelpCircle } from 'lucide-react';
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
  ineaActive,
  ineaBaja,
  iteaTotal,
  iteaActive,
  iteaInactive,
  tlaxcalaTotal,
  totalRaw,
  excludedByStatus,
  excludedByResguardo,
  availableCount,
  filteredCount,
  hasActiveFilters
}: DataStatsPanelProps) {
  const { isDarkMode } = useTheme();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={`mb-4 p-3 rounded-lg border transition-all ${
      isDarkMode
        ? 'bg-gray-900/30 border-gray-800'
        : 'bg-gray-50 border-gray-200'
    }`}>
      {/* Compact header with sources */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          {/* INEA */}
          <div className="flex items-center gap-1.5">
            <Database className={`h-3.5 w-3.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              INEA
            </span>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {ineaTotal.toLocaleString()}
            </span>
            <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              de {ineaTotalWithBaja.toLocaleString()}
            </span>
          </div>

          {/* ITEA */}
          <div className="flex items-center gap-1.5">
            <Database className={`h-3.5 w-3.5 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`} />
            <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              ITEA
            </span>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {iteaActive.toLocaleString()}
            </span>
            <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              de {iteaTotal.toLocaleString()}
            </span>
          </div>

          {/* TLAXCALA */}
          <div className="flex items-center gap-1.5">
            <Database className={`h-3.5 w-3.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              TLAX
            </span>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {tlaxcalaTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Help icon with tooltip */}
        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className={`p-1 rounded-full transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-800 text-gray-500 hover:text-gray-300'
                : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          
          {showTooltip && (
            <div className={`absolute right-0 top-full mt-2 w-64 p-3 rounded-lg shadow-lg border z-50 ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700 text-gray-200'
                : 'bg-white border-gray-300 text-gray-700'
            }`}>
              <p className="text-xs leading-relaxed">
                Los filtros de datos están configurados a nivel de sistema. Si necesitas cambiar el método de filtrado, contacta al desarrollador.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Processing flow */}
      <div className="flex items-center gap-2 text-xs">
        {/* Total */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded ${
          isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
        }`}>
          <span className="font-semibold">{totalRaw.toLocaleString()}</span>
          <span className="opacity-70">total</span>
        </div>

        <ChevronRight className={`h-3 w-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />

        {/* Excluded by status */}
        {excludedByStatus > 0 && (
          <>
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${
              isDarkMode ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-700'
            }`}>
              <XCircle className="h-3 w-3" />
              <span className="font-semibold">{excludedByStatus.toLocaleString()}</span>
              <span className="opacity-70">inactivos</span>
            </div>
            <ChevronRight className={`h-3 w-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          </>
        )}

        {/* Excluded by resguardo */}
        {excludedByResguardo > 0 && (
          <>
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${
              isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
            }`}>
              <XCircle className="h-3 w-3" />
              <span className="font-semibold">{excludedByResguardo.toLocaleString()}</span>
              <span className="opacity-70">resguardados</span>
            </div>
            <ChevronRight className={`h-3 w-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          </>
        )}

        {/* Available */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded ${
          isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
        }`}>
          <CheckCircle className="h-3 w-3" />
          <span className="font-semibold">{availableCount.toLocaleString()}</span>
          <span className="opacity-70">disponibles</span>
        </div>

        {/* Filtered */}
        {hasActiveFilters && (
          <>
            <ArrowRight className={`h-3 w-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${
              isDarkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
            }`}>
              <Filter className="h-3 w-3" />
              <span className="font-semibold">{filteredCount.toLocaleString()}</span>
              <span className="opacity-70">mostrados</span>
            </div>
          </>
        )}
      </div>

      {/* Detailed breakdown */}
      <div className={`mt-2 pt-2 border-t text-[10px] ${
        isDarkMode ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-600'
      }`}>
        <div className="flex items-center gap-4">
          <span>
            <span className="font-semibold">INEA:</span> Excluye {ineaBaja > 0 ? `${ineaBaja} con` : ''} estatus BAJA
          </span>
          <span>•</span>
          <span>
            <span className="font-semibold">ITEA:</span> Solo ACTIVO ({iteaInactive} excluidos)
          </span>
          <span>•</span>
          <span>
            <span className="font-semibold">TLAX:</span> Todos los registros
          </span>
          {excludedByResguardo > 0 && (
            <>
              <span>•</span>
              <span>
                <span className="font-semibold">Resguardados:</span> {excludedByResguardo} ya asignados
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
