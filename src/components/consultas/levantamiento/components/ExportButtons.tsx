/**
 * Export buttons component for Excel and PDF export
 * 
 * Provides buttons for exporting data to Excel and PDF formats,
 * with special styling for custom PDF export when enabled.
 */

import React from 'react';
import { FileUp, RefreshCw } from 'lucide-react';

/**
 * Component props interface
 */
interface ExportButtonsProps {
  onExcelClick: () => void;
  onPDFClick: () => void;
  onRefreshClick: () => void;
  isCustomPDFEnabled: boolean;
  loading: boolean;
  isDarkMode: boolean;
}

/**
 * ExportButtons component
 * 
 * Renders export action buttons with:
 * - Excel export button
 * - PDF export button (with custom PDF indicator when enabled)
 * - Refresh/reindex button with loading animation
 * 
 * @param props - Component props
 * @returns Export buttons UI
 */
export function ExportButtons({
  onExcelClick,
  onPDFClick,
  onRefreshClick,
  isCustomPDFEnabled,
  loading,
  isDarkMode
}: ExportButtonsProps) {
  
  return (
    <div className="flex gap-2">
      {/* Excel Export Button */}
      <button
        onClick={onExcelClick}
        className={`group relative px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-all duration-300 shadow-lg border
          ${isDarkMode 
            ? 'bg-white text-gray-900 border-white/80 hover:bg-white/90 hover:border-white' 
            : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700'
          }`}
        title="Exportar a Excel"
      >
        <FileUp className="h-4 w-4 transition-transform group-hover:scale-110 group-hover:-translate-y-0.5 duration-300" />
        <span className="hidden sm:flex items-center gap-1">
          Excel
          <span className="text-xs opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
            .xlsx
          </span>
        </span>
      </button>

      {/* PDF Export Button */}
      <button
        onClick={onPDFClick}
        className={`group relative px-4 py-2.5 rounded-lg font-medium 
          flex items-center gap-2.5 transition-all duration-300
          ${isCustomPDFEnabled
            ? isDarkMode
              ? 'bg-gradient-to-r from-white/90 to-white/70 text-gray-900 hover:from-white hover:to-white/80 border border-white/80 hover:border-white shadow-lg shadow-white/10'
              : 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 border border-green-600 hover:border-green-700 shadow-lg shadow-green-100'
            : isDarkMode
              ? 'bg-white/80 text-gray-900 hover:bg-white/70 border border-white/70 hover:border-white'
              : 'bg-red-600 text-white hover:bg-red-700 border border-red-600 hover:border-red-700'
          }`}
        title={isCustomPDFEnabled 
          ? 'Exportar PDF personalizado por área y director (solo si ambos filtros son exactos)' 
          : 'Exportar a PDF'
        }
      >
        <FileUp className="h-4 w-4 transition-transform group-hover:scale-110 group-hover:-translate-y-0.5 duration-300" />
        <span className="hidden sm:flex items-center gap-1">
          {isCustomPDFEnabled ? (
            <>
              PDF Personalizado
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-full border border-white/30 text-gray-900 font-semibold">
                Área+Director
              </span>
            </>
          ) : (
            'PDF'
          )}
        </span>
      </button>

      {/* Refresh Button */}
      <button
        onClick={onRefreshClick}
        className={`
          group relative px-4 py-2.5 rounded-lg font-medium 
          flex items-center gap-2.5 transition-all duration-300
          shadow-lg border overflow-hidden
          hover:scale-[1.02] active:scale-[0.98]
          ${isDarkMode
            ? 'bg-white/70 hover:bg-white/80 text-gray-900 border-white/60 hover:border-white/70'
            : 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600 hover:border-gray-700'
          }
        `}
        title="Actualizar datos"
        disabled={loading}
      >
        {/* Icon wrapper with animation */}
        <div className="relative">
          <RefreshCw className={`
            h-4 w-4 transition-transform duration-500 
            ${loading ? 'animate-spin' : 'group-hover:rotate-180 group-hover:scale-110'}
          `} />
        </div>

        {/* Text with underline animation */}
        <span className="relative hidden sm:block">
          Actualizar
          <span className="absolute inset-x-0 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
        </span>

        {/* Loading ripple effect */}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className={`absolute w-full h-full animate-ping rounded-lg ${isDarkMode ? 'bg-cyan-400/20' : 'bg-blue-400/20'}`}></span>
          </span>
        )}
      </button>
    </div>
  );
}
