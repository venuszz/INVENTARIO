/**
 * AreaPuestoInputs component
 * Input fields for puesto and area selection with mismatch warnings
 */

import { AlertTriangle } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface AreaPuestoInputsProps {
  puesto: string;
  area: string;
  onPuestoChange: (value: string) => void;
  onAreaChange: (value: string) => void;
  disabled: boolean;
  availableAreas: Array<{ id_area: number; nombre: string }>;
  hasAreaMismatch: boolean;
  areaSuggestion: string | null;
  onAcceptAreaSuggestion: () => void;
  directorSelected: boolean;
}

/**
 * Component for puesto and area input fields
 */
export function AreaPuestoInputs({
  puesto,
  area,
  onPuestoChange,
  onAreaChange,
  disabled,
  availableAreas,
  hasAreaMismatch,
  areaSuggestion,
  onAcceptAreaSuggestion,
  directorSelected
}: AreaPuestoInputsProps) {
  const { isDarkMode } = useTheme();

  const showAreaSuggestion = directorSelected && areaSuggestion && area !== areaSuggestion;

  return (
    <div className="mb-4 flex gap-4">
      {/* Puesto Input */}
      <div className="flex-1">
        <label className={`text-sm font-medium mb-1 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Puesto
        </label>
        <input
          type="text"
          value={puesto}
          onChange={(e) => onPuestoChange(e.target.value)}
          placeholder="Puesto del director"
          className={`w-full border rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 transition-colors ${
            isDarkMode
              ? 'bg-black border-gray-800 text-white placeholder-gray-500 focus:ring-blue-500 hover:border-blue-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 hover:border-blue-400'
          }`}
          disabled={disabled}
        />
      </div>

      {/* Area Select */}
      <div className="flex-1">
        <label className={`text-sm font-medium mb-1 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Área
        </label>
        <select
          title="Selecciona un área"
          value={area}
          onChange={(e) => onAreaChange(e.target.value)}
          disabled={!directorSelected}
          className={`w-full border rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 transition-colors ${
            isDarkMode
              ? 'bg-black border-gray-800 text-white focus:ring-blue-500 hover:border-blue-500'
              : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 hover:border-blue-400'
          }`}
        >
          <option value="">Selecciona un área</option>
          {availableAreas.map(a => (
            <option key={a.id_area} value={a.nombre}>{a.nombre}</option>
          ))}
        </select>

        {/* Area mismatch warning */}
        {hasAreaMismatch && (
          <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border ${
            isDarkMode
              ? 'bg-yellow-900/20 border-yellow-700/50 text-yellow-300'
              : 'bg-yellow-50 border-yellow-300 text-yellow-800'
          }`}>
            <AlertTriangle className="h-4 w-4 flex-shrink-0 animate-pulse" />
            <span className="text-xs font-medium">
              El área del director no coincide con el área de algunos bienes seleccionados
            </span>
          </div>
        )}

        {/* Area suggestion chip */}
        {showAreaSuggestion && (
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onAcceptAreaSuggestion();
              }}
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow transition-all ${
                isDarkMode
                  ? 'bg-blue-900/30 text-blue-200 border-blue-700 hover:bg-blue-900/50 hover:text-white'
                  : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 hover:text-blue-800'
              }`}
              title={`Usar sugerencia: ${areaSuggestion}`}
            >
              <span className="font-bold">Sugerido:</span> {areaSuggestion}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
