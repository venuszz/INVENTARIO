import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { AlertTriangle, X } from 'lucide-react';

/**
 * UsufinalConflictModal Component
 * 
 * Modal dialog that warns the user when attempting to select items
 * with different responsables (usufinal). Only items with the same
 * responsable can be selected together.
 * 
 * @param show - Whether to display the modal
 * @param conflictUsufinal - The conflicting responsable name
 * @param onClose - Handler for closing the modal
 */
interface UsufinalConflictModalProps {
  show: boolean;
  conflictUsufinal: string;
  onClose: () => void;
}

export default function UsufinalConflictModal({
  show,
  conflictUsufinal,
  onClose
}: UsufinalConflictModalProps) {
  const { isDarkMode } = useTheme();

  if (!show) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn ${
      isDarkMode ? 'bg-black/90' : 'bg-gray-900/50'
    }`}>
      <div className={`rounded-2xl shadow-2xl border w-full max-w-md overflow-hidden transition-all duration-300 transform ${
        isDarkMode
          ? 'bg-black border-red-600/30 hover:border-red-500/50'
          : 'bg-white border-red-300'
      }`}>
        <div className={`relative p-6 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500/40 animate-pulse"></div>
          
          <div className="flex flex-col items-center text-center mb-4">
            <div className="p-3 bg-red-500/10 rounded-full border border-red-500/30 mb-3 animate-pulse">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              No se puede agregar
            </h3>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Solo puedes seleccionar bienes que pertenezcan al mismo responsable.
            </p>
            <p className={`mt-2 text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
              El bien que intentas agregar actualmente pertenece a:{' '}
              <span className="font-semibold">{conflictUsufinal}</span>
            </p>
            <p className={`text-xs italic pt-3 ${isDarkMode ? 'text-gray-700' : 'text-gray-500'}`}>
              Te sugerimos editar las características del bien.
            </p>
          </div>
        </div>
        
        <div className={`p-5 border-t flex justify-end gap-3 ${
          isDarkMode ? 'bg-black border-gray-800' : 'bg-gray-50 border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-lg text-sm border transition-colors flex items-center gap-2 ${
              isDarkMode
                ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-800 hover:border-red-500'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-red-400'
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
