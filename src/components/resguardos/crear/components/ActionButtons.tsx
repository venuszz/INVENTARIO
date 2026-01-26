/**
 * ActionButtons component
 * Clear and save buttons for resguardo actions
 */

import { Trash2, Save, Loader2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface ActionButtonsProps {
  onClear: () => void;
  onSave: () => void;
  canClear: boolean;
  canSave: boolean;
  isSaving: boolean;
  selectedCount: number;
}

/**
 * Action buttons for clearing selection and saving resguardo
 */
export function ActionButtons({
  onClear,
  onSave,
  canClear,
  canSave,
  isSaving,
  selectedCount
}: ActionButtonsProps) {
  const { isDarkMode } = useTheme();

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2">
      {/* Clear button */}
      <button
        onClick={onClear}
        disabled={!canClear || isSaving}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
          !canClear || isSaving
            ? (isDarkMode
              ? 'bg-white/5 border-white/5 text-white/30 cursor-not-allowed'
              : 'bg-black/5 border-black/5 text-black/30 cursor-not-allowed'
            )
            : (isDarkMode
              ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              : 'bg-black/5 border-black/10 text-black hover:bg-black/10'
            )
        }`}
      >
        <Trash2 size={14} />
        Limpiar Selección
      </button>

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={!canSave || isSaving}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all flex-grow sm:flex-grow-0 ${
          !canSave || isSaving
            ? (isDarkMode
              ? 'bg-white/5 border-white/5 text-white/30 cursor-not-allowed'
              : 'bg-black/5 border-black/5 text-black/30 cursor-not-allowed'
            )
            : (isDarkMode
              ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              : 'bg-black/5 border-black/10 text-black hover:bg-black/10'
            )
        }`}
      >
        {isSaving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Save size={14} />
        )}
        Guardar Resguardo ({selectedCount})
      </button>
    </div>
  );
}

