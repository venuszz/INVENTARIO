'use client';

import React from 'react';
import { LayoutGrid, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Directorio, Area } from '../types';

interface AreaSelectionModalProps {
  show: boolean;
  areaOptions: Area[];
  incompleteDirector: Directorio | null;
  isDarkMode: boolean;
  onClose: () => void;
  onSelectArea: (area: Area) => void;
}

/**
 * AreaSelectionModal Component
 * 
 * Modal for selecting an area when a director has multiple areas assigned.
 * Displays all available areas for the selected director.
 */
export const AreaSelectionModal: React.FC<AreaSelectionModalProps> = ({
  show,
  areaOptions,
  incompleteDirector,
  isDarkMode,
  onClose,
  onSelectArea
}) => {
  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${
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
                className={`absolute top-4 right-4 p-1.5 rounded-lg transition-all ${
                  isDarkMode
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
                  <LayoutGrid className={`h-6 w-6 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </div>
                <h2 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Selecciona un área
                </h2>
                <p className={`text-sm mt-1 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Elige el área correspondiente para este artículo
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Director Info */}
              <div className={`rounded-lg border p-4 ${
                isDarkMode
                  ? 'border-gray-700 bg-gray-800/50'
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <label className={`text-xs uppercase tracking-wider mb-2 block font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Director asignado
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
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {incompleteDirector?.nombre}
                    </span>
                  </div>
                </div>
              </div>

              {/* Areas List */}
              <div className="space-y-2">
                <label className={`text-xs uppercase tracking-wider block mb-3 font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Áreas disponibles ({areaOptions.length})
                </label>
                <div className={`space-y-2 max-h-64 overflow-y-auto ${
                  isDarkMode
                    ? 'scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-700 hover:scrollbar-thumb-gray-600'
                    : 'scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400'
                }`}>
                  {areaOptions.map((area, index) => (
                    <motion.button
                      key={`${area.nombre}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => onSelectArea(area)}
                      className={`w-full px-4 py-3 rounded-lg border text-sm text-left transition-all focus:outline-none focus:ring-2 ${
                        isDarkMode
                          ? 'bg-gray-800/50 border-gray-700 text-white hover:border-gray-600 hover:bg-gray-800 focus:ring-white/50'
                          : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300 hover:bg-gray-50 focus:ring-blue-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <LayoutGrid className={`h-4 w-4 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        <span className="font-medium">{area.nombre}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
