/**
 * FolioInfoPanel component
 * Displays folio, director name, and current date
 */

import { FileDigit, Building2, Calendar, RefreshCw } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface FolioInfoPanelProps {
  folio: string;
  directorName: string;
  onResetFolio: () => void;
}

/**
 * Panel showing folio information, director, and date
 */
export function FolioInfoPanel({ folio, directorName, onResetFolio }: FolioInfoPanelProps) {
  const { isDarkMode } = useTheme();

  return (
    <div className={`mb-6 p-4 rounded-xl border shadow-inner hover:shadow-lg transition-shadow ${
      isDarkMode
        ? 'bg-gray-900/30 border-gray-800'
        : 'bg-gray-50/50 border-gray-200'
    }`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Folio */}
        <div className={`p-3 rounded-lg border flex flex-col transition-colors ${
          isDarkMode
            ? 'bg-black border-gray-800 hover:border-white'
            : 'bg-white border-gray-200 hover:border-blue-400'
        }`}>
          <div className="flex justify-between items-center mb-1">
            <span className={`text-xs uppercase font-medium ${
              isDarkMode ? 'text-gray-500' : 'text-gray-600'
            }`}>
              Folio
            </span>
            <button
              onClick={onResetFolio}
              className={`text-xs flex items-center gap-1 px-2 py-1 rounded border transition-all ${
                isDarkMode
                  ? 'bg-gray-900/20 hover:bg-gray-900/30 text-white hover:text-gray-300 border-white/50'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border-gray-300'
              }`}
            >
              <RefreshCw className="h-3 w-3" />
              Nuevo
            </button>
          </div>
          <div className="flex items-center">
            <FileDigit className={`h-4 w-4 mr-2 animate-pulse ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`} />
            <span className={`text-sm font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {folio || 'Generando...'}
            </span>
          </div>
        </div>

        {/* Director */}
        <div className={`p-3 rounded-lg border flex flex-col transition-colors ${
          isDarkMode
            ? 'bg-black border-gray-800 hover:border-white'
            : 'bg-white border-gray-200 hover:border-blue-400'
        }`}>
          <span className={`text-xs uppercase font-medium mb-1 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-600'
          }`}>
            Director de Área
          </span>
          <div className="flex items-center">
            <Building2 className={`h-4 w-4 mr-2 animate-pulse ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`} />
            <span className={`text-sm ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {directorName || 'Seleccionar'}
            </span>
          </div>
        </div>

        {/* Date */}
        <div className={`p-3 rounded-lg border flex flex-col transition-colors ${
          isDarkMode
            ? 'bg-black border-gray-800 hover:border-white'
            : 'bg-white border-gray-200 hover:border-blue-400'
        }`}>
          <span className={`text-xs uppercase font-medium mb-1 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-600'
          }`}>
            Fecha
          </span>
          <div className="flex items-center">
            <Calendar className={`h-4 w-4 mr-2 animate-pulse ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`} />
            <span className={`text-sm ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
