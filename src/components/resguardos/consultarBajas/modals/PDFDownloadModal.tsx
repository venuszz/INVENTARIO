import { X, FileDigit, FileText, Download } from 'lucide-react';
import type { PdfDataBaja } from '../types';

interface PDFDownloadModalProps {
  show: boolean;
  pdfData: PdfDataBaja | null;
  onClose: () => void;
  onDownload: () => Promise<void>;
  isDarkMode: boolean;
}

/**
 * PDF download modal
 * Displays PDF information and download button
 */
export const PDFDownloadModal: React.FC<PDFDownloadModalProps> = ({
  show,
  pdfData,
  onClose,
  onDownload,
  isDarkMode
}) => {
  if (!show || !pdfData) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm ${
      isDarkMode ? 'bg-black/80' : 'bg-black/50'
    }`}>
      <div className={`rounded-lg border w-full max-w-md overflow-hidden backdrop-blur-xl ${
        isDarkMode ? 'bg-black/95 border-white/10' : 'bg-white/95 border-black/10'
      }`}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'
              }`}>
                <FileDigit size={20} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
              </div>
              <div>
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Baja generada
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                  Descarga el PDF de la baja
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-white/10 text-white'
                  : 'hover:bg-black/10 text-black'
              }`}
            >
              <X size={16} />
            </button>
          </div>

          <div className={`rounded-lg border p-3 mb-6 ${
            isDarkMode
              ? 'bg-white/[0.02] border-white/10'
              : 'bg-black/[0.02] border-black/10'
          }`}>
            <div className="flex items-center gap-3">
              <FileText className={`h-4 w-4 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                Baja {pdfData.folio_baja}
              </span>
            </div>
          </div>

          <button
            onClick={onDownload}
            className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Download className="h-4 w-4" />
            Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
};
