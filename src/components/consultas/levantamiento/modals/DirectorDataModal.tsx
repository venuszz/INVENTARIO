/**
 * Director data completion modal component
 * 
 * Modal for completing missing director information (admin only).
 */

import React, { useState, useEffect } from 'react';
import { FileUp, AlertCircle, BadgeCheck, RefreshCw } from 'lucide-react';
import { DirectorioOption } from '../types';

/**
 * Component props interface
 */
interface DirectorDataModalProps {
  show: boolean;
  director: DirectorioOption | null;
  onSave: (director: DirectorioOption) => void;
  onCancel: () => void;
  loading: boolean;
  isDarkMode: boolean;
}

/**
 * DirectorDataModal component
 * 
 * Renders a modal for completing director information with:
 * - Nombre input (uppercase conversion)
 * - Puesto input (uppercase conversion)
 * - Validation (both fields required)
 * - Save/Cancel buttons
 * - Loading state during save
 * - Admin-only access
 * 
 * @param props - Component props
 * @returns Director data modal UI or null if not shown
 */
export function DirectorDataModal({
  show,
  director,
  onSave,
  onCancel,
  loading,
  isDarkMode
}: DirectorDataModalProps) {
  
  const [formData, setFormData] = useState<DirectorioOption | null>(null);

  // Initialize form data when director changes
  useEffect(() => {
    if (director) {
      setFormData({ ...director });
    }
  }, [director]);

  if (!show || !director || !formData) return null;

  /**
   * Handle nombre input change (convert to uppercase)
   */
  const handleNombreChange = (value: string) => {
    setFormData(prev => prev ? { ...prev, nombre: value.toUpperCase() } : null);
  };

  /**
   * Handle puesto input change (convert to uppercase)
   */
  const handlePuestoChange = (value: string) => {
    setFormData(prev => prev ? { ...prev, puesto: value.toUpperCase() } : null);
  };

  /**
   * Handle save button click
   */
  const handleSave = () => {
    if (formData && formData.nombre.trim() && formData.puesto.trim()) {
      onSave(formData);
    }
  };

  /**
   * Check if save button should be disabled
   */
  const isSaveDisabled = 
    loading ||
    !formData ||
    !formData.nombre.trim() ||
    !formData.puesto.trim();

  return (
    <div className={`fixed inset-0 z-[110] flex items-center justify-center backdrop-blur-sm px-4 animate-fadeIn ${isDarkMode ? 'bg-black/90' : 'bg-black/50'}`}>
      <div className={`border-2 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transition-all duration-300 transform ${isDarkMode ? 'bg-black border-white/30' : 'bg-white border-yellow-200'}`}>
        <div className="relative p-7 sm:p-8">
          {/* Top accent bar */}
          <div className={`absolute top-0 left-0 w-full h-1 ${isDarkMode ? 'bg-white/30' : 'bg-yellow-200'}`} />

          {/* Header */}
          <h2 className={`text-2xl font-extrabold mb-2 flex items-center gap-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <FileUp className={`h-6 w-6 ${isDarkMode ? 'text-white' : 'text-yellow-600'}`} />
            Completar datos del director
          </h2>

          {/* Description */}
          <p className={`text-base mb-6 font-medium flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <AlertCircle className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-yellow-500'}`} />
            El director seleccionado no tiene todos sus datos completos. Por favor, completa la información faltante.
          </p>

          {/* Form fields */}
          <div className="flex flex-col gap-6">
            {/* Nombre input */}
            <div>
              <label className={`block text-xs uppercase tracking-wider mb-1 font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Nombre
              </label>
              <input
                type="text"
                className={`w-full border-2 rounded-xl px-4 py-3 text-lg font-semibold shadow-inner focus:outline-none transition-all duration-200 ${isDarkMode ? 'bg-gray-900 border-white/30 focus:border-white/60 text-white placeholder:text-gray-400/60' : 'bg-white border-yellow-300 focus:border-yellow-500 text-gray-900 placeholder:text-gray-500'}`}
                value={formData.nombre ?? ''}
                onChange={e => handleNombreChange(e.target.value)}
                placeholder="Ej: JUAN PÉREZ GÓMEZ"
                autoFocus
                maxLength={80}
              />
            </div>

            {/* Puesto input */}
            <div>
              <label className={`block text-xs uppercase tracking-wider mb-1 font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Cargo
              </label>
              <input
                type="text"
                className={`w-full border-2 rounded-xl px-4 py-3 text-lg font-semibold shadow-inner focus:outline-none transition-all duration-200 ${isDarkMode ? 'bg-gray-900 border-white/30 focus:border-white/60 text-white placeholder:text-gray-400/60' : 'bg-white border-yellow-300 focus:border-yellow-500 text-gray-900 placeholder:text-gray-500'}`}
                value={formData.puesto ?? ''}
                onChange={e => handlePuestoChange(e.target.value)}
                placeholder="Ej: DIRECTOR, JEFE DE ÁREA..."
                maxLength={60}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 mt-8">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-200 shadow ${isDarkMode ? 'border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800' : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-200 shadow border
                ${isDarkMode ? 'bg-white/10 text-white border-white/30' : 'bg-yellow-600 text-white border-yellow-600'}
                ${isSaveDisabled ? 'opacity-60 cursor-not-allowed' : isDarkMode ? 'hover:bg-white/20' : 'hover:bg-yellow-700'}
              `}
              onClick={handleSave}
              disabled={isSaveDisabled}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <BadgeCheck className="h-4 w-4" />
              )}
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
