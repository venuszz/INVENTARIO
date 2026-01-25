import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { AlertTriangle, Building2, Info, CheckCircle } from 'lucide-react';

/**
 * AreaConflictModal Component
 * 
 * Modal dialog that warns the user when attempting to select items
 * from different areas. All items in a resguardo must belong to the
 * same area for organization and traceability.
 * 
 * @param show - Whether to display the modal
 * @param conflictArea - The conflicting area name
 * @param onClose - Handler for closing the modal
 */
interface AreaConflictModalProps {
  show: boolean;
  conflictArea: string;
  onClose: () => void;
}

export default function AreaConflictModal({
  show,
  conflictArea,
  onClose
}: AreaConflictModalProps) {
  const { isDarkMode } = useTheme();

  if (!show) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn ${
      isDarkMode ? 'bg-black/90' : 'bg-gray-900/50'
    }`}>
      <div className={`rounded-2xl shadow-2xl border w-full max-w-md overflow-hidden transition-all duration-300 transform ${
        isDarkMode
          ? 'bg-black border-blue-600/30 hover:border-blue-500/50'
          : 'bg-white border-blue-300'
      }`}>
        <div className={`relative p-6 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/40 animate-pulse"></div>

          <div className="flex flex-col items-center text-center mb-4">
            <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/30 mb-3 animate-pulse">
              <AlertTriangle className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Conflicto de Área
            </h3>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No es posible agregar artículos de diferentes áreas en un mismo resguardo
            </p>
          </div>

          <div className="space-y-5 mt-6">
            <div className={`rounded-lg border p-4 transition-colors ${
              isDarkMode
                ? 'border-gray-800 bg-gray-900/50 hover:border-blue-500'
                : 'border-gray-200 bg-gray-50 hover:border-blue-400'
            }`}>
              <label className={`block text-xs uppercase tracking-wider mb-1 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>
                Área en Conflicto
              </label>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  <Building2 className={`h-4 w-4 animate-pulse ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`} />
                </div>
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {conflictArea || 'Sin especificar'}
                </span>
              </div>
            </div>

            <div className={`border rounded-lg p-4 ${
              isDarkMode
                ? 'bg-blue-950/30 border-blue-900/50'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start gap-3">
                <Info className={`h-5 w-5 mt-0.5 ${
                  isDarkMode ? 'text-white' : 'text-blue-600'
                }`} />
                <p className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                  Los artículos en un resguardo deben pertenecer a la misma área para mantener la organización y trazabilidad.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={`p-5 border-t flex justify-end gap-3 ${
          isDarkMode ? 'bg-black border-gray-800' : 'bg-gray-50 border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-500 font-medium transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-blue-500/30"
          >
            <CheckCircle className="h-4 w-4" />
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
