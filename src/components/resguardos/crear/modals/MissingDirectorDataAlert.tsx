import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { AlertTriangle } from 'lucide-react';

/**
 * MissingDirectorDataAlert Component
 * 
 * Alert banner displayed when the selected director is missing
 * required data (area or puesto). Provides a button to complete
 * the missing information.
 * 
 * @param show - Whether to display the alert
 * @param onComplete - Handler for opening the director modal to complete data
 */
interface MissingDirectorDataAlertProps {
  show: boolean;
  onComplete: () => void;
}

export default function MissingDirectorDataAlert({
  show,
  onComplete
}: MissingDirectorDataAlertProps) {
  const { isDarkMode } = useTheme();

  if (!show) return null;

  return (
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-lg shadow-lg border flex items-center gap-4 animate-fade-in ${
      isDarkMode
        ? 'bg-yellow-900/90 text-yellow-100 border-yellow-700'
        : 'bg-yellow-50 text-yellow-800 border-yellow-200'
    }`}>
      <AlertTriangle className={`h-5 w-5 animate-pulse ${
        isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
      }`} />
      <span className="font-medium">
        Faltan datos del director. Debes completar el área y el puesto para continuar.
      </span>
      <button
        onClick={onComplete}
        className={`ml-4 px-3 py-1 rounded font-semibold transition-colors ${
          isDarkMode
            ? 'bg-yellow-600 text-black hover:bg-yellow-500'
            : 'bg-yellow-600 text-white hover:bg-yellow-700'
        }`}
      >
        Completar datos
      </button>
    </div>
  );
}
