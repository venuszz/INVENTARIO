/**
 * ActionButtons component
 * Clear and save buttons for resguardo actions
 */

import { X, Save, RefreshCw } from 'lucide-react';
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
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
      <button
        onClick={onClear}
        disabled={!canClear || isSaving}
        className={`px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-all border ${
          !canClear || isSaving
            ? (isDarkMode
              ? 'bg-black text-gray-600 border-gray-800 cursor-not-allowed'
              : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
            )
            : (isDarkMode
              ? 'bg-black text-gray-300 border-gray-700 hover:bg-gray-900 hover:border-blue-500 hover:text-blue-300'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600'
            )
        }`}
      >
        <X className="h-4 w-4" />
        Limpiar Selección
      </button>
      <button
        onClick={onSave}
        disabled={!canSave || isSaving}
        className={`px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 flex-grow sm:flex-grow-0 transition-all transform hover:scale-[1.02] ${
          !canSave || isSaving
            ? (isDarkMode
              ? 'bg-blue-900/10 text-blue-300/50 border border-blue-900/20 cursor-not-allowed'
              : 'bg-blue-100 text-blue-400 border border-blue-200 cursor-not-allowed'
            )
            : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg hover:shadow-blue-500/30'
        }`}
      >
        {isSaving ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Guardar Resguardo ({selectedCount})
      </button>
    </div>
  );
}
