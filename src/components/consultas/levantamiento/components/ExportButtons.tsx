/**
 * Export buttons component for Excel and PDF export
 * 
 * Provides buttons for exporting data to Excel and PDF formats,
 * with special styling for custom PDF export when enabled.
 */

import { FileSpreadsheet, FileText, ArrowRightLeft, X } from 'lucide-react';
import { motion } from 'framer-motion';

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
  // Transfer mode props
  hasOrigenFilter?: boolean;
  transferMode?: boolean;
  onTransferModeToggle?: () => void;
}

/**
 * ExportButtons component
 * 
 * Renders export action buttons with:
 * - Excel export button
 * - PDF export button (with custom PDF indicator when enabled)
 * 
 * @param props - Component props
 * @returns Export buttons UI
 */
export function ExportButtons({
  onExcelClick,
  onPDFClick,
  isCustomPDFEnabled,
  isDarkMode,
  hasOrigenFilter = false,
  transferMode = false,
  onTransferModeToggle
}: ExportButtonsProps) {
  
  return (
    <div className="flex gap-2">
      {/* Transfer Mode Button - Only visible when origen filter is active */}
      {hasOrigenFilter && onTransferModeToggle && (
        <motion.button
          onClick={onTransferModeToggle}
          className={`px-3 py-2 rounded-lg border text-sm font-light flex items-center gap-2 transition-all ${
            transferMode
              ? isDarkMode
                ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/15 hover:border-red-500/30'
                : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300'
              : isDarkMode
                ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                : 'bg-black/5 border-black/10 text-black hover:bg-black/10 hover:border-black/20'
          }`}
          title={transferMode ? 'Cancelar transferencia' : 'Transferir origen de items seleccionados'}
          aria-label={transferMode ? 'Cancelar transferencia' : 'Transferir origen de items seleccionados'}
          aria-pressed={transferMode}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {transferMode ? <X size={16} /> : <ArrowRightLeft size={16} />}
          <span className="hidden sm:inline">
            {transferMode ? 'Cancelar' : 'Transferir Origen'}
          </span>
        </motion.button>
      )}

      {/* Excel Export Button */}
      <motion.button
        onClick={onExcelClick}
        className={`px-3 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition-all ${
          isDarkMode 
            ? 'bg-black border-white/10 text-white hover:border-white/20 hover:bg-white/[0.02]' 
            : 'bg-white border-black/10 text-black hover:border-black/20 hover:bg-black/[0.02]'
        }`}
        title="Exportar a Excel"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <FileSpreadsheet size={16} />
        <span className="hidden sm:inline">Excel</span>
      </motion.button>

      {/* PDF Export Button */}
      <motion.button
        onClick={onPDFClick}
        className={`px-3 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition-all ${
          isCustomPDFEnabled
            ? isDarkMode
              ? 'bg-white text-black border-white hover:bg-white/90'
              : 'bg-black text-white border-black hover:bg-black/90'
            : isDarkMode
              ? 'bg-black border-white/10 text-white hover:border-white/20 hover:bg-white/[0.02]'
              : 'bg-white border-black/10 text-black hover:border-black/20 hover:bg-black/[0.02]'
        }`}
        title={isCustomPDFEnabled 
          ? 'Exportar PDF personalizado por área y director' 
          : 'Exportar a PDF'
        }
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <FileText size={16} />
        <span className="hidden sm:inline">
          {isCustomPDFEnabled ? 'PDF Personalizado' : 'PDF'}
        </span>
        {isCustomPDFEnabled && (
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`ml-1 px-1.5 py-0.5 text-xs rounded-full font-medium ${
              isDarkMode
                ? 'bg-black/20 text-white border border-black/30'
                : 'bg-white/20 text-black border border-white/30'
            }`}
          >
            Área+Director
          </motion.span>
        )}
      </motion.button>
    </div>
  );
}
