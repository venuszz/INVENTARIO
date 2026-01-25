/**
 * Custom PDF export modal component
 * 
 * Modal for configuring and exporting PDF by area and director.
 */

import React, { useState, useMemo } from 'react';
import { FileUp, AlertCircle, BadgeCheck } from 'lucide-react';
import { DirectorioOption } from '../types';
import { clean } from '../utils';

/**
 * Component props interface
 */
interface CustomPDFModalProps {
  show: boolean;
  area: string;
  director: string;
  directorOptions: DirectorioOption[];
  onConfirm: (directorData: { nombre: string; puesto: string }) => void;
  onCancel: () => void;
  onDirectorSelect: (director: DirectorioOption) => void;
  loading: boolean;
  error: string | null;
  recordCount: number;
  isDarkMode: boolean;
}

/**
 * CustomPDFModal component
 * 
 * Renders a modal for custom PDF export with:
 * - Pre-populated area field (read-only)
 * - Director search input
 * - Director list with suggested highlighting
 * - Puesto field (read-only)
 * - Record count badge
 * - Validation before export
 * 
 * @param props - Component props
 * @returns Custom PDF modal UI or null if not shown
 */
export function CustomPDFModal({
  show,
  area,
  director,
  directorOptions,
  onConfirm,
  onCancel,
  onDirectorSelect,
  loading,
  error,
  recordCount,
  isDarkMode
}: CustomPDFModalProps) {
  
  const [searchDirectorTerm, setSearchDirectorTerm] = useState('');
  const [selectedDirector, setSelectedDirector] = useState<{ nombre: string; puesto: string }>({ 
    nombre: '', 
    puesto: '' 
  });

  /**
   * Find suggested director based on name and area matching
   */
  const directorSugerido = useMemo(() => {
    if (!director) return null;

    const targetNombre = clean(director);
    const targetArea = clean(area);

    // Priority 1: Exact match by name and area
    let match = directorOptions.find(opt =>
      clean(opt.nombre) === targetNombre && clean(opt.area || '') === targetArea
    );

    // Priority 2: Exact match by name only
    if (!match) {
      match = directorOptions.find(opt => clean(opt.nombre) === targetNombre);
    }

    // Priority 3: Partial match by name (contains)
    if (!match) {
      match = directorOptions.find(opt => clean(opt.nombre).includes(targetNombre));
    }

    return match || null;
  }, [director, area, directorOptions]);

  /**
   * Filter director options based on search term
   */
  const filteredDirectorOptions = useMemo(() => {
    if (!searchDirectorTerm) return directorOptions;

    const searchClean = clean(searchDirectorTerm);
    return directorOptions.filter(opt =>
      clean(opt.nombre).includes(searchClean) ||
      clean(opt.puesto || '').includes(searchClean) ||
      clean(opt.area || '').includes(searchClean)
    );
  }, [searchDirectorTerm, directorOptions]);

  /**
   * Handle director selection
   */
  const handleDirectorClick = (opt: DirectorioOption) => {
    setSelectedDirector({ nombre: opt.nombre, puesto: opt.puesto });
    setSearchDirectorTerm(opt.nombre);
    onDirectorSelect(opt);
  };

  /**
   * Handle confirm button click
   */
  const handleConfirm = () => {
    if (selectedDirector.nombre && selectedDirector.puesto) {
      onConfirm(selectedDirector);
    }
  };

  /**
   * Check if confirm button should be disabled
   */
  const isConfirmDisabled = 
    loading ||
    recordCount === 0 ||
    !area.trim() ||
    !selectedDirector.nombre.trim() ||
    !selectedDirector.puesto.trim();

  // Early return after all hooks
  if (!show) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn ${isDarkMode ? 'bg-black/90' : 'bg-black/50'}`}>
      <div className={`rounded-2xl shadow-2xl border w-full max-w-lg overflow-hidden ${isDarkMode ? 'bg-black border-white/20' : 'bg-white border-gray-200'}`}>
        <div className="p-6">
          {/* Header */}
          <h2 className={`text-xl font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <FileUp className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
            Exportar PDF por Área y Director
          </h2>

          {/* Record count badge */}
          <div className={`mb-3 flex items-center gap-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <span>Registros a exportar</span>
            <span className={`inline-block px-2 py-0.5 rounded-full font-bold shadow border min-w-[32px] text-center ${isDarkMode ? 'bg-white/10 text-white border-white/30' : 'bg-blue-100 text-blue-900 border-blue-300'}`}>
              {recordCount}
            </span>
          </div>

          {/* Form fields */}
          <div className="mb-4">
            <div className="flex flex-col gap-2">
              {/* Area field (read-only) */}
              <div>
                <label className={`block text-xs uppercase tracking-wider mb-1 font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Área seleccionada
                </label>
                <input
                  type="text"
                  className={`w-full border-2 rounded-xl px-4 py-3 text-lg font-semibold shadow-inner focus:outline-none transition-all duration-200 ${isDarkMode ? 'bg-gray-800 border-white/30 focus:border-white/60 text-white placeholder:text-gray-400/60' : 'bg-gray-100 border-gray-300 focus:border-blue-500 text-gray-900 placeholder:text-gray-500'}`}
                  value={area}
                  readOnly
                  title="Área seleccionada para el PDF"
                />
              </div>

              {/* Director search and selection */}
              <div>
                {/* Warning if director not found */}
                {director && !directorSugerido && (
                  <div className={`mb-3 p-3 border rounded-lg ${isDarkMode ? 'bg-amber-900/30 border-amber-700/50' : 'bg-amber-50 border-amber-200'}`}>
                    <p className={`font-medium flex items-center gap-2 ${isDarkMode ? 'text-amber-200' : 'text-amber-800'}`}>
                      <AlertCircle className="h-4 w-4" />
                      Director buscado no encontrado
                    </p>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-amber-100/90' : 'text-amber-700'}`}>
                      &quot;{director}&quot;
                    </p>
                  </div>
                )}

                <label className={`block text-xs uppercase tracking-wider mb-1 font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Buscar director
                </label>
                <input
                  type="text"
                  className={`w-full border-2 rounded-xl px-4 py-3 text-lg font-semibold shadow-inner focus:outline-none transition-all duration-200 ${isDarkMode ? 'bg-gray-800 border-white/30 focus:border-white/60 text-white placeholder:text-gray-400/60' : 'bg-white border-gray-300 focus:border-blue-500 text-gray-900 placeholder:text-gray-500'}`}
                  placeholder="Buscar director por nombre..."
                  value={searchDirectorTerm}
                  onChange={e => setSearchDirectorTerm(e.target.value)}
                  title="Buscar director por nombre"
                  autoFocus
                />

                {/* Director list */}
                <div className={`max-h-48 overflow-y-auto rounded-lg border shadow-inner divide-y ${isDarkMode ? 'border-white/20 bg-gray-900/80 divide-white/10' : 'border-gray-200 bg-gray-50 divide-gray-200'}`}>
                  {filteredDirectorOptions.length === 0 ? (
                    <div className={`text-sm p-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      No se encontraron directores.
                    </div>
                  ) : (
                    filteredDirectorOptions.map(opt => {
                      const isSuggested = directorSugerido && opt.id_directorio === directorSugerido.id_directorio;
                      const isSelected = selectedDirector.nombre === opt.nombre;

                      return (
                        <button
                          key={opt.id_directorio}
                          className={`w-full text-left px-4 py-2 flex flex-col gap-0.5 transition-all duration-150 border-l-4
                            ${isSuggested
                              ? isDarkMode 
                                ? 'border-white bg-white/10 text-white font-bold shadow-lg' 
                                : 'border-blue-500 bg-blue-50 text-blue-900 font-bold shadow-lg'
                              : isSelected
                                ? isDarkMode 
                                  ? 'border-white/60 bg-white/5 text-white font-semibold' 
                                  : 'border-blue-300 bg-blue-25 text-blue-800 font-semibold'
                                : isDarkMode 
                                  ? 'border-transparent hover:bg-white/5 text-white' 
                                  : 'border-transparent hover:bg-gray-100 text-gray-900'
                            }
                          `}
                          onClick={() => handleDirectorClick(opt)}
                          type="button"
                          title={`Seleccionar ${opt.nombre}`}
                        >
                          <span className="text-base font-semibold flex items-center gap-2">
                            {opt.nombre}
                            {isSuggested && (
                              <BadgeCheck className={`inline h-4 w-4 ml-1 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
                            )}
                            {isSelected && (
                              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isDarkMode ? 'bg-white/20 text-white' : 'bg-blue-200 text-blue-800'}`}>
                                Seleccionado
                              </span>
                            )}
                          </span>
                          <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {opt.puesto}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Puesto field (read-only) */}
              <div>
                <label className={`block text-xs uppercase tracking-wider mb-1 font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Puesto
                </label>
                <input
                  type="text"
                  className={`w-full border-2 rounded-xl px-4 py-3 text-lg font-semibold shadow-inner focus:outline-none transition-all duration-200 ${isDarkMode ? 'bg-gray-800 border-white/30 focus:border-white/60 text-white placeholder:text-gray-400/60' : 'bg-gray-100 border-gray-300 focus:border-blue-500 text-gray-900 placeholder:text-gray-500'}`}
                  value={selectedDirector.puesto || ''}
                  readOnly
                  title="Puesto del director o jefe de área"
                />
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className={`mb-2 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              className={`px-4 py-2 rounded border transition-colors ${isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-gray-300'}`}
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button
              className={`px-4 py-2 rounded font-bold border disabled:opacity-50 transition-colors ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20 border-white/30' : 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600'}`}
              disabled={isConfirmDisabled}
              onClick={handleConfirm}
            >
              {loading ? 'Generando...' : 'Exportar PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
