import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { FileDigit, FileText, Download, X } from 'lucide-react';
import { PdfData } from '../types';

/**
 * PDFDownloadModal Component
 * 
 * Modal dialog displayed after successfully saving a resguardo.
 * Prompts the user to download the PDF document.
 * 
 * @param show - Whether to display the modal
 * @param pdfData - The PDF data for the resguardo
 * @param onDownload - Handler for downloading the PDF
 * @param onClose - Handler for closing the modal (with warning check)
 * @param isGenerating - Whether the PDF is currently being generated
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

  if (!show || !pdfData) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn ${
        isDarkMode ? 'bg-black/90' : 'bg-gray-900/50'
      }`}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`rounded-2xl shadow-2xl border w-full max-w-md overflow-hidden transition-all duration-300 transform ${
          isDarkMode
            ? 'bg-black border-green-600/30 hover:border-green-500/50'
            : 'bg-white border-green-300'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`relative p-6 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-green-500/40 animate-pulse"></div>

          <button
            onClick={onClose}
            className={`absolute top-3 right-3 p-2 rounded-full border transition-colors ${
              isDarkMode
                ? 'bg-black/60 hover:bg-gray-900 text-green-400 hover:text-green-500 border-green-500/30'
                : 'bg-gray-100 hover:bg-gray-200 text-green-600 hover:text-green-700 border-green-300'
            }`}
            title="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col items-center text-center mb-4">
            <div className="p-3 bg-green-500/10 rounded-full border border-green-500/30 mb-3 animate-pulse">
              <FileDigit className="h-8 w-8 text-green-500" />
            </div>
            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Resguardo generado
            </h3>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Descarga el PDF del resguardo para imprimir o compartir
            </p>
          </div>

          <div className="space-y-5 mt-6">
            <div className={`rounded-lg border p-4 transition-colors ${
              isDarkMode
                ? 'border-gray-800 bg-gray-900/50 hover:border-green-500'
                : 'border-gray-200 bg-gray-50 hover:border-green-400'
            }`}>
              <label className={`block text-xs uppercase tracking-wider mb-1 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>
                Documento generado
              </label>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  <FileText className="h-4 w-4 text-green-400 animate-pulse" />
                </div>
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Resguardo {pdfData.folio}
                </span>
              </div>
            </div>
            <button
              onClick={onDownload}
              disabled={isGenerating}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-500 text-black font-medium rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-green-500/30"
            >
              <Download className="h-4 w-4" />
              {isGenerating ? 'Generando PDF...' : 'Descargar PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
