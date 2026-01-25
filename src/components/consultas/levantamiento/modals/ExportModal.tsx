/**
 * Export confirmation modal component
 * 
 * Displays a modal for confirming Excel or PDF export operations.
 */

import { X, FileSpreadsheet, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExportType } from '../types';

/**
 * Component props interface
 */
interface ExportModalProps {
  show: boolean;
  exportType: ExportType;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  isDarkMode: boolean;
}

/**
 * ExportModal component
 * 
 * Renders a confirmation modal for export operations with:
 * - Export type display (Excel or PDF)
 * - Filename preview
 * - Confirm and cancel buttons
 * - Loading state during export
 * 
 * @param props - Component props
 * @returns Export modal UI or null if not shown
 */
export function ExportModal({
  show,
  exportType,
  onConfirm,
  onCancel,
  loading,
  isDarkMode
}: ExportModalProps) {
  
  if (!show) return null;

  const fileName = `Reporte_inventario_${new Date().toISOString().slice(0, 10)}.${exportType === 'excel' ? 'xlsx' : 'pdf'}`;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 flex items-center justify-center z-50 px-4 backdrop-blur-sm ${
            isDarkMode ? 'bg-black/80' : 'bg-black/50'
          }`}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`rounded-lg border w-full max-w-md overflow-hidden backdrop-blur-xl ${
              isDarkMode ? 'bg-black/95 border-white/10' : 'bg-white/95 border-black/10'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isDarkMode ? 'bg-white/10' : 'bg-black/10'
                  }`}>
                    {exportType === 'excel' ? (
                      <FileSpreadsheet size={20} className={isDarkMode ? 'text-white' : 'text-black'} />
                    ) : (
                      <FileText size={20} className={isDarkMode ? 'text-white' : 'text-black'} />
                    )}
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Exportar a {exportType === 'excel' ? 'Excel' : 'PDF'}
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`}>
                      {exportType === 'excel' ? 'Archivo para análisis' : 'Documento para visualización'}
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={onCancel}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'hover:bg-white/10 text-white'
                      : 'hover:bg-black/10 text-black'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* File preview */}
              <div className={`p-3 rounded-lg border mb-6 ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <label className={`block text-xs font-medium mb-1 ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                  Archivo a generar
                </label>
                <div className="flex items-center gap-2">
                  {exportType === 'excel' ? (
                    <FileSpreadsheet size={16} className={isDarkMode ? 'text-white/60' : 'text-black/60'} />
                  ) : (
                    <FileText size={16} className={isDarkMode ? 'text-white/60' : 'text-black/60'} />
                  )}
                  <span className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {fileName}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <motion.button
                  onClick={onCancel}
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    isDarkMode
                      ? 'bg-black border-white/10 text-white hover:border-white/20 hover:bg-white/[0.02]'
                      : 'bg-white border-black/10 text-black hover:border-black/20 hover:bg-black/[0.02]'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    loading
                      ? isDarkMode
                        ? 'bg-black border-white/5 text-white/40 cursor-not-allowed'
                        : 'bg-white border-black/5 text-black/40 cursor-not-allowed'
                      : isDarkMode
                        ? 'bg-white text-black border-white hover:bg-white/90'
                        : 'bg-black text-white border-black hover:bg-black/90'
                  }`}
                  whileHover={!loading ? { scale: 1.01 } : {}}
                  whileTap={!loading ? { scale: 0.99 } : {}}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      {exportType === 'excel' ? (
                        <FileSpreadsheet size={16} />
                      ) : (
                        <FileText size={16} />
                      )}
                      Descargar
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
