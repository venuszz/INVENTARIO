import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { AlertTriangle, UserCheck, Briefcase, Users, X, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { Directorio } from '../types';

/**
 * DirectorModal Component
 * 
 * Modal dialog for completing missing director information (area and puesto).
 * Displayed when a director is selected but lacks required data.
 * 
 * @param show - Whether to display the modal
 * @param director - The director object with incomplete data
 * @param area - Current area value
 * @param puesto - Current puesto value
 * @param onAreaChange - Handler for area input changes
 * @param onPuestoChange - Handler for puesto input changes
 * @param onSave - Handler for saving director information
 * @param onClose - Handler for closing the modal
 * @param isSaving - Whether the save operation is in progress
 * @param isUsuario - Whether the current user is a regular user (not admin)
 */
interface DirectorModalProps {
  show: boolean;
  director: Directorio | null;
  area: string;
  puesto: string;
  onAreaChange: (value: string) => void;
  onPuestoChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
  isSaving: boolean;
  isUsuario: boolean;
}

export default function DirectorModal({
  show,
  director,
  area,
  puesto,
  onAreaChange,
  onPuestoChange,
  onSave,
  onClose,
  isSaving,
  isUsuario
}: DirectorModalProps) {
  const { isDarkMode } = useTheme();

  if (!show) return null;

  const isFormValid = area.trim() !== '' && puesto.trim() !== '';

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn ${
      isDarkMode ? 'bg-black/90' : 'bg-gray-900/50'
    }`}>
      <div className={`rounded-2xl shadow-2xl border w-full max-w-md overflow-hidden transition-all duration-300 transform ${
        isDarkMode
          ? 'bg-black border-yellow-600/30 hover:border-yellow-500/50'
          : 'bg-white border-yellow-300'
      }`}>
        <div className={`relative p-6 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500/40 animate-pulse"></div>

          <div className="flex flex-col items-center text-center mb-4">
            <div className="p-3 bg-yellow-500/10 rounded-full border border-yellow-500/30 mb-3 animate-pulse">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              ¡Ups! Falta información
            </h3>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Necesitamos algunos datos adicionales del director seleccionado para Continuar
            </p>
          </div>

          <div className="space-y-5 mt-6">
            <div className={`rounded-lg border p-4 transition-colors ${
              isDarkMode
                ? 'border-gray-800 bg-gray-900/50 hover:border-yellow-500'
                : 'border-gray-200 bg-gray-50 hover:border-yellow-400'
            }`}>
              <label className={`block text-xs uppercase tracking-wider mb-1 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>
                Director seleccionado
              </label>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  <UserCheck className="h-4 w-4 text-yellow-400 animate-pulse" />
                </div>
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {director?.nombre || 'Director'}
                </span>
              </div>
            </div>

            <div>
              <label className={`text-sm font-medium mb-2 flex items-center gap-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Briefcase className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                Área
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => onAreaChange(e.target.value)}
                placeholder="Escribe el área asignada al director"
                className={`block w-full border rounded-lg py-3 px-4 focus:outline-none focus:ring-1 transition-colors ${
                  isDarkMode
                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-yellow-500 focus:ring-yellow-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500'
                }`}
              />
            </div>

            <div>
              <label className={`text-sm font-medium mb-2 flex items-center gap-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Users className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                Puesto
              </label>
              <input
                type="text"
                value={puesto}
                onChange={(e) => onPuestoChange(e.target.value)}
                placeholder="Ej: Director General, Gerente, Supervisor..."
                className={`block w-full border rounded-lg py-3 px-4 focus:outline-none focus:ring-1 transition-colors ${
                  isDarkMode
                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-yellow-500 focus:ring-yellow-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500'
                }`}
                disabled={isUsuario}
              />
              {isUsuario && (
                <div className="text-xs text-yellow-400 mt-1">
                  Solo un administrador puede editar estos campos
                </div>
              )}
              {!isFormValid && !isUsuario && (
                <p className="text-xs text-yellow-500/80 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 animate-pulse" />
                  Ambos campos son requeridos para continuar
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={`p-5 border-t flex justify-end gap-3 ${
          isDarkMode ? 'bg-black border-gray-800' : 'bg-gray-50 border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-lg text-sm border transition-colors flex items-center gap-2 ${
              isDarkMode
                ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-800 hover:border-yellow-500'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-yellow-400'
            }`}
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={isSaving || !isFormValid || isUsuario}
            className={`px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all duration-300 transform hover:scale-[1.02] ${
              isSaving || !isFormValid || isUsuario
                ? (isDarkMode
                  ? 'bg-gray-900 text-gray-500 cursor-not-allowed border border-gray-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                )
                : 'bg-yellow-600 text-black font-medium hover:shadow-lg hover:shadow-yellow-500/20'
            }`}
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Guardando...' : 'Guardar y Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
