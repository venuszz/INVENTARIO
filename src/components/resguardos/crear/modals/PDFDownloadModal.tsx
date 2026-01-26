import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { FileText, Download, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PdfData } from '../types';

/**
 * PDFDownloadModal Component
 * 
 * Modal dialog displayed after successfully saving a resguardo.
 * Prompts the user to download the PDF document.
 */
interface PDFDownloadModalProps {
  show: boolean;
  pdfData: PdfData | null;
  onDownload: () => void;
  onClose: () => void;
  isGenerating: boolean;
}

export default function PDFDownloadModal({
  show,
  pdfData,
  onDownload,
  onClose,
  isGenerating
}: PDFDownloadModalProps) {
  const { isDarkMode } = useTheme();

  return (
    <AnimatePresence>
      {show && pdfData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[110] flex items-center justify-center px-4 backdrop-blur-sm ${
            isDarkMode ? 'bg-black/80' : 'bg-black/50'
          }`}
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
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
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isDarkMode ? 'bg-green-500/10' : 'bg-green-50'
                  }`}>
                    <FileText size={20} className={isDarkMode ? 'text-green-400' : 'text-green-600'} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Resguardo generado
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`}>
                      Listo para descargar
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
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

              {/* Folio info */}
              <div className={`rounded-lg border p-3 mb-6 ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <label className={`block text-xs font-medium mb-1.5 ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                  Folio del resguardo
                </label>
                <div className="flex items-center gap-2">
                  <FileText size={16} className={isDarkMode ? 'text-white/60' : 'text-black/60'} />
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {pdfData.folio}
                  </span>
                </div>
              </div>

              {/* Download button */}
              <motion.button
                onClick={onDownload}
                disabled={isGenerating}
                className={`w-full px-4 py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  isGenerating
                    ? isDarkMode
                      ? 'bg-black border-white/5 text-white/40 cursor-not-allowed'
                      : 'bg-white border-black/5 text-black/40 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-white text-black border-white hover:bg-white/90'
                      : 'bg-black text-white border-black hover:bg-black/90'
                }`}
                whileHover={!isGenerating ? { scale: 1.01 } : {}}
                whileTap={!isGenerating ? { scale: 0.99 } : {}}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    Descargar PDF
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
