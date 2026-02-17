import { X, FileText } from 'lucide-react';
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
 * Follows the same design as consultar
 */
export const PDFDownloadModal: React.FC<PDFDownloadModalProps> = ({
  show,
  pdfData,
  onClose,
  onDownload,
  isDarkMode
}) => {
  if (!show || !pdfData) return null;

  // Get unique folio_baja values
  const foliosBaja = Array.from(new Set(pdfData.articulos.map(a => a.folio_baja)));
  const multipleFolios = foliosBaja.length > 1;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${
      isDarkMode ? 'bg-black/80' : 'bg-black/50'
    }`}>
      <div className={`rounded-lg border w-full max-w-md overflow-hidden ${
        isDarkMode ? 'bg-black/95 border-white/10' : 'bg-white/95 border-black/10'
      }`}>
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
                  Baja generada
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                  Listo para descargar
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

          {/* Folio info */}
          <div className={`rounded-lg border p-3 mb-6 ${
            isDarkMode
              ? 'bg-white/[0.02] border-white/10'
              : 'bg-black/[0.02] border-black/10'
          }`}>
            <label className={`block text-xs font-medium mb-1.5 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}>
              {multipleFolios ? 'Folios de baja' : 'Folio de baja'}
            </label>
            <div className="flex items-center gap-2">
              <FileText size={16} className={isDarkMode ? 'text-white/60' : 'text-black/60'} />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {pdfData.folio_baja}
              </span>
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={onDownload}
            className={`w-full px-4 py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              isDarkMode
                ? 'bg-white text-black border-white hover:bg-white/90'
                : 'bg-black text-white border-black hover:bg-black/90'
            }`}
          >
            <FileText size={14} />
            Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
};
