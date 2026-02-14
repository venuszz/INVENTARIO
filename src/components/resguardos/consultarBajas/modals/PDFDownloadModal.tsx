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
    <div className={`fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn ${
      isDarkMode ? 'bg-black/90' : 'bg-gray-900/50'
    }`}>
      <div className={`rounded-2xl shadow-2xl border w-full max-w-md overflow-hidden transition-all duration-300 transform ${
        isDarkMode
          ? 'bg-black border-red-600/30'
          : 'bg-white border-red-300'
      }`}>
        <div className={`relative p-6 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
          <div className={`absolute top-0 left-0 w-full h-1 ${
            isDarkMode ? 'bg-red-500/60' : 'bg-red-400'
          }`}></div>

          <button
            onClick={onClose}
            className={`absolute top-3 right-3 p-2 rounded-full border transition-colors ${
              isDarkMode
                ? 'bg-black/60 hover:bg-gray-900 text-red-400 hover:text-red-500 border-red-500/30'
                : 'bg-gray-100 hover:bg-gray-200 text-red-600 hover:text-red-700 border-red-300'
            }`}
            title="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col items-center text-center mb-4">
            <div className={`p-3 rounded-full border mb-3 animate-pulse ${
              isDarkMode
                ? 'bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/30'
                : 'bg-gradient-to-br from-red-100 to-red-200 border-red-300'
            }`}>
              <FileDigit className={`h-8 w-8 ${
                isDarkMode ? 'text-red-500' : 'text-red-600'
              }`} />
            </div>
            <h3 className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Baja generada
            </h3>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Descarga el PDF de la baja para imprimir o compartir
            </p>
          </div>

          <div className="space-y-5 mt-6">
            <div className={`rounded-lg border p-4 ${
              isDarkMode
                ? 'border-gray-800 bg-gradient-to-b from-gray-900/50 to-gray-900/30'
                : 'border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100'
            }`}>
              <label className={`block text-xs uppercase tracking-wider mb-1 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>
                Documento generado
              </label>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-gray-800/70' : 'bg-gray-200'
                }`}>
                  <FileText className={`h-4 w-4 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`} />
                </div>
                <span className={`font-medium ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Baja {pdfData.folio_baja}
                </span>
              </div>
            </div>

            <div className="w-full">
              <button
                onClick={onDownload}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-[1.02] shadow-lg ${
                  isDarkMode
                    ? 'bg-red-600 text-white hover:bg-red-500 hover:shadow-red-500/30'
                    : 'bg-red-600 text-white hover:bg-red-500 hover:shadow-red-500/30'
                }`}
              >
                <Download className="h-4 w-4" />
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
