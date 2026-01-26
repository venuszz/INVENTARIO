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
    <div className="mb-4 grid grid-cols-2 gap-3">
      {/* Puesto Input */}
      <div className="w-full">
        <label className={`block text-xs font-medium mb-1.5 ${
          isDarkMode ? 'text-white/60' : 'text-black/60'
        }`}>
          Puesto
        </label>
        <input
          type="text"
          value={puesto}
          onChange={(e) => onPuestoChange(e.target.value)}
          placeholder="Puesto del director"
          className={`w-full border rounded py-2 px-3 text-sm transition-colors focus:outline-none h-[38px] ${
            isDarkMode
              ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-white/30'
              : 'bg-black/5 border-black/10 text-black placeholder-black/40 focus:border-black/30'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={disabled}
        />
      </div>

      {/* Area Select */}
      <div className="w-full">
        <label className={`block text-xs font-medium mb-1.5 ${
          isDarkMode ? 'text-white/60' : 'text-black/60'
        }`}>
          Área
        </label>
        <select
          title="Selecciona un área"
          value={area}
          onChange={(e) => onAreaChange(e.target.value)}
          disabled={!directorSelected}
          className={`w-full border rounded py-2 px-3 text-sm transition-colors focus:outline-none h-[38px] ${
            isDarkMode
              ? 'bg-white/5 border-white/10 text-white focus:border-white/30'
              : 'bg-black/5 border-black/10 text-black focus:border-black/30'
          } ${!directorSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <option value="">Selecciona un área</option>
          {availableAreas.map(a => (
            <option key={a.id_area} value={a.nombre}>{a.nombre}</option>
          ))}
        </select>

        {/* Badges container - only shows when needed */}
        {(showAreaSuggestion || hasAreaMismatch) && (
          <div className="mt-1.5 flex flex-col items-center gap-1">
            {/* Area suggestion - shown first */}
            {showAreaSuggestion && (
              <button
                type="button"
                onClick={onAcceptAreaSuggestion}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] border transition-all break-words ${
                  isDarkMode
                    ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    : 'bg-black/10 text-black border-black/20 hover:bg-black/20'
                }`}
              >
                <span className={`text-[10px] font-semibold flex-shrink-0 ${
                  isDarkMode ? 'text-white/70' : 'text-black/70'
                }`}>
                  Sugerencia:
                </span>
                <span className="break-words">{areaSuggestion}</span>
              </button>
            )}
            
            {/* Area mismatch warning - shown second */}
            {hasAreaMismatch && (
              <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] border break-words ${
                isDarkMode
                  ? 'bg-yellow-500/10 text-yellow-300/90 border-yellow-500/30'
                  : 'bg-yellow-100 text-yellow-700 border-yellow-300'
              }`}>
                <AlertTriangle size={9} className="flex-shrink-0" />
                <span className="break-words">No coincide</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
