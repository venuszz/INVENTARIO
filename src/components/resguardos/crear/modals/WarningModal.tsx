import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { AlertTriangle } from 'lucide-react';

/**
 * WarningModal Component
 * 
 * Generic warning modal displayed when the user attempts to close
 * the PDF download modal without downloading the document.
 * 
 * @param show - Whether to display the modal
 * @param onConfirm - Handler for confirming the action (close without downloading)
 * @param onCancel - Handler for canceling the action (return to PDF modal)
 */
interface WarningModalProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function WarningModal({
  show,
  onConfirm,
  onCancel
}: WarningModalProps) {
  const { isDarkMode } = useTheme();

  if (!show) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-[60] px-4 animate-fadeIn ${
      isDarkMode ? 'bg-black/95' : 'bg-gray-900/50'
    }`}>
      <div className={`rounded-xl shadow-2xl border w-full max-w-sm p-6 transition-colors ${
        isDarkMode
          ? 'bg-gray-900 border-red-500/30 hover:border-red-500/50'
          : 'bg-white border-red-300'
      }`}>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-full border border-red-500/30 animate-pulse">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>

          <div>
            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              ¿Cerrar sin descargar?
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No has descargado el PDF. Si cierras esta ventana, no podrás volver a generar este documento por ahora.
            </p>
          </div>

          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onCancel}
              className={`flex-1 py-2 px-4 border rounded-lg transition-colors ${
                isDarkMode
                  ? 'border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-blue-500'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-blue-400'
              }`}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors hover:border-red-500 border border-transparent"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
