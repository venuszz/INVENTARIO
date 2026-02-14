/**
 * PDFBajaModal Component
 * 
 * Modal for downloading baja PDF after deletion
 */

'use client';

import { X, FileDigit, FileText, Download } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { PdfDataBaja } from '../types';

interface PDFBajaModalProps {
  show: boolean;
  pdfData: PdfDataBaja | null;
  onDownload: () => Promise<void>;
  onClose: () => void;
}

/**
 * PDFBajaModal - Display modal for baja PDF download
 */
export default function PDFBajaModal({
  show,
  pdfData,
  onDownload,
  onClose
}: PDFBajaModalProps) {
  const { isDarkMode } = useTheme();

  if (!show || !pdfData) return null;

  return (
    <div className={`fixed inset-0 ${isDarkMode ? 'bg-black/90' : 'bg-gray-900/80'} flex items-center justify-center z-50 px-4 animate-fadeIn`}>
      <div className={`${isDarkMode ? 'bg-black' : 'bg-white'} rounded-2xl shadow-2xl border ${isDarkMode ? 'border-red-600/30' : 'border-red-500/50'} w-full max-w-md overflow-hidden transition-all duration-300 transform`}>
        <div className={`relative p-6 ${isDarkMode ? 'bg-gradient-to-b from-black to-gray-900' : 'bg-gradient-to-b from-white to-gray-50'}`}>
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isDarkMode ? 'from-red-500/60 via-red-400 to-red-500/60' : 'from-red-500 via-red-400 to-red-500'}`}></div>

          <button
            onClick={onClose}
            className={`absolute top-3 right-3 p-2 rounded-full ${isDarkMode ? 'bg-black/60 hover:bg-gray-900 text-red-400 hover:text-red-500 border border-red-500/30' : 'bg-white/80 hover:bg-gray-100 text-red-600 hover:text-red-700 border border-red-500/50'} transition-colors`}
            title="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col items-center text-center mb-4">
            <div className={`p-3 ${isDarkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'} rounded-full border mb-3 animate-pulse`}>
              <FileDigit className={`h-8 w-8 ${isDarkMode ? 'text-red-500' : 'text-red-600'}`} />
            </div>
            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Baja generada</h3>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Descarga el PDF de la baja para imprimir o compartir
            </p>
          </div>
          <div className="space-y-5 mt-6">
            <div className={`rounded-lg border ${isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'} p-4`}>
              <label className={`block text-xs uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-600'} mb-1`}>Documento generado</label>
              <div className="flex items-center gap-3">
                <div className={`p-2 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg`}>
                  <FileText className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                </div>
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Baja {pdfData.folioBaja}</span>
              </div>
            </div>

            <div className="w-full">
              <button
                onClick={onDownload}
                className={`w-full py-3.5 px-5 ${isDarkMode ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg hover:shadow-red-500/30' : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg hover:shadow-red-500/20'} rounded-lg font-semibold transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 border ${isDarkMode ? 'border-red-700/50' : 'border-red-600/30'}`}
              >
                <Download className="h-5 w-5" />
                Descargar PDF de Baja
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
