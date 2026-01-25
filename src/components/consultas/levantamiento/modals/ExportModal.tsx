/**
 * Export confirmation modal component
 * 
 * Displays a modal for confirming Excel or PDF export operations.
 */

import React from 'react';
import { X, FileUp, File, RefreshCw } from 'lucide-react';
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
    <div className={`fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn ${isDarkMode ? 'bg-black/90' : 'bg-black/50'}`}>
      <div className={`rounded-2xl shadow-2xl border w-full max-w-md overflow-hidden transition-all duration-300 transform ${isDarkMode ? 'bg-black border-white/30' : 'bg-white border-gray-200'}`}>
        <div className={`relative p-6 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
          {/* Top accent bar */}
          <div className={`absolute top-0 left-0 w-full h-1 ${isDarkMode ? 'bg-white/30' : 'bg-blue-200'}`}></div>

          {/* Close button */}
          <button
            onClick={onCancel}
            className={`absolute top-3 right-3 p-2 rounded-full border transition-colors ${isDarkMode ? 'bg-black/60 hover:bg-white/10 text-white border-white/30' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-300'}`}
            title="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-4">
            <div className={`p-3 rounded-full border mb-3 ${isDarkMode ? 'border-white/30 bg-white/10' : 'bg-blue-200 bg-blue-50'}`}>
              {exportType === 'excel' ? (
                <FileUp className={`h-8 w-8 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
              ) : (
                <File className={`h-8 w-8 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
              )}
            </div>
            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Exportar a {exportType === 'excel' ? 'Excel' : 'PDF'}
            </h3>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Exportar los datos a un archivo {exportType === 'excel' ? 'Excel para su análisis' : 'PDF para su visualización'}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-5 mt-6">
            {/* File preview */}
            <div className={`rounded-lg border p-4 ${isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
              <label className={`block text-xs uppercase tracking-wider mb-1 font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                Documento a generar
              </label>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-blue-100'}`}>
                  {exportType === 'excel' ? (
                    <FileUp className={`h-4 w-4 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
                  ) : (
                    <File className={`h-4 w-4 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
                  )}
                </div>
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {fileName}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="w-full flex flex-col items-center gap-4">
              <div className="w-full">
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`w-full py-3 px-4 font-medium rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] shadow-lg border disabled:opacity-60 disabled:cursor-not-allowed ${isDarkMode ? 'bg-white/20 hover:bg-white/30 text-white border-white/30' : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'}`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      {`Generando ${exportType === 'excel' ? 'Excel' : 'PDF'}...`}
                    </>
                  ) : (
                    <>
                      {exportType === 'excel' ? (
                        <FileUp className="h-5 w-5" />
                      ) : (
                        <File className="h-5 w-5" />
                      )}
                      {`Descargar ${exportType === 'excel' ? 'Excel' : 'PDF'}`}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
