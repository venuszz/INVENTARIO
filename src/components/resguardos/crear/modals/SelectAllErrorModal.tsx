import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { ListChecks, X } from 'lucide-react';

/**
 * SelectAllErrorModal Component
 * 
 * Modal dialog displayed when the select-all operation fails validation.
 * Shows an error message explaining why all items cannot be selected.
 * 
 * @param show - Whether to display the modal
 * @param message - The error message to display
 * @param onClose - Handler for closing the modal
 */
interface SelectAllErrorModalProps {
  show: boolean;
  message: string;
  onClose: () => void;
}

export default function SelectAllErrorModal({
  show,
  message,
  onClose
}: SelectAllErrorModalProps) {
  const { isDarkMode } = useTheme();

  if (!show) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-[100] px-4 animate-fadeIn ${
      isDarkMode ? 'bg-black/90' : 'bg-gray-900/50'
    }`}>
      <div className={`rounded-2xl shadow-2xl border-2 w-full max-w-md overflow-hidden transition-all duration-300 ${
        isDarkMode
          ? 'bg-black border-blue-700/40 hover:border-blue-500/60'
          : 'bg-white border-blue-300'
      }`}>
        <div className={`relative p-7 flex flex-col items-center text-center ${
          isDarkMode ? 'bg-black' : 'bg-white'
        }`}>
          <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/30 mb-3 animate-pulse">
            <ListChecks className="h-8 w-8 text-blue-400 animate-pulse" />
          </div>
          <h3 className={`text-2xl font-bold mb-2 tracking-tight ${
            isDarkMode ? 'text-blue-200' : 'text-blue-800'
          }`}>
            No se puede seleccionar todo
          </h3>
          <p className={`text-base mb-6 max-w-xs ${
            isDarkMode ? 'text-blue-100' : 'text-blue-700'
          }`}>
            {message}
          </p>
          <button
            onClick={onClose}
            className={`mt-2 px-6 py-2.5 rounded-lg font-semibold shadow-lg border transition-all flex items-center gap-2 ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-700'
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
            }`}
          >
            <X className="h-4 w-4" />
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
