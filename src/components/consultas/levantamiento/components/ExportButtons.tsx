/**
 * Export buttons component for Excel and PDF export
 * 
 * Provides buttons for exporting data to Excel and PDF formats,
 * with special styling for custom PDF export when enabled.
 */

import { FileSpreadsheet, FileText } from 'lucide-react';
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
  isDarkMode
}: ExportButtonsProps) {
  
  return (
    <div className="flex gap-2">
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
