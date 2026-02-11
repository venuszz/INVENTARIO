'use client';

import React from 'react';
import { AlertCircle, User, LayoutGrid, X, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Directorio } from '../types';

interface DirectorModalProps {
  show: boolean;
  incompleteDirector: Directorio | null;
  directorFormData: { directorName: string; areaName: string };
  savingDirector: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onSave: () => void;
  onAreaChange: (area: string) => void;
}

/**
 * DirectorModal Component
 * 
 * Modal for adding area information to a director who doesn't have one assigned.
 * Required when selecting a director without an area.
 */
export const DirectorModal: React.FC<DirectorModalProps> = ({
  show,
  incompleteDirector,
  directorFormData,
  savingDirector,
  isDarkMode,
  onClose,
  onSave,
  onAreaChange
}) => {
  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 flex items-center justify-center z-50 px-4 ${
            isDarkMode ? 'bg-black/90' : 'bg-black/50'
          } backdrop-blur-sm`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`rounded-lg shadow-2xl border w-full max-w-md overflow-hidden ${
              isDarkMode
                ? 'bg-black border-gray-800'
                : 'bg-white border-gray-200'
            }`}
          >
            {/* Header */}
            <div className={`relative px-6 py-5 border-b ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <button
                onClick={onClose}
                disabled={savingDirector}
                className={`absolute top-4 right-4 p-1.5 rounded-lg transition-all ${
                  savingDirector
                    ? 'opacity-50 cursor-not-allowed'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className={`p-3 rounded-lg border mb-3 ${
                  isDarkMode
                    ? 'bg-gray-800/50 border-gray-700'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <AlertCircle className={`h-6 w-6 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </div>
                <h3 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Información requerida
                </h3>
                <p className={`mt-1 text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Por favor complete el área del director/jefe de área seleccionado
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Director Info */}
              <div className={`rounded-lg border p-4 ${
                isDarkMode
                  ? 'border-gray-700 bg-gray-800/50'
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <label className={`text-xs font-medium uppercase tracking-wider mb-2 block ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Director/Jefe seleccionado
                </label>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}>
                    <User className={`h-4 w-4 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                  </div>
                  <span className={`font-medium text-sm ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {incompleteDirector?.nombre || 'Director'}
                  </span>
                </div>
              </div>

              {/* Area Input */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <LayoutGrid className="h-4 w-4" />
                  Área
                </label>
                <input
                  type="text"
                  value={directorFormData.areaName}
                  onChange={(e) => onAreaChange(e.target.value)}
                  placeholder="Ej: Administración, Recursos Humanos, Contabilidad..."
                  className={`block w-full border rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-white/50'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500'
                  }`}
                  required
                  disabled={savingDirector}
                />
                {!directorFormData.areaName && (
                  <p className={`text-xs mt-2 flex items-center gap-1 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    <AlertCircle className="h-3 w-3" />
                    Este campo es obligatorio
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={`p-5 border-t flex justify-end gap-3 ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <button
                onClick={onClose}
                disabled={savingDirector}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  savingDirector
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                } ${
                  isDarkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
              <button
                onClick={onSave}
                disabled={savingDirector || !directorFormData.areaName}
                className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 font-medium transition-colors ${
                  savingDirector || !directorFormData.areaName
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                } ${
                  isDarkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {savingDirector ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {savingDirector ? 'Guardando...' : 'Guardar y Continuar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
