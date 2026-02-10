import { Edit, Save, X, Trash2, AlertTriangle } from 'lucide-react';

interface ActionButtonsProps {
  isEditing: boolean;
  uploading: boolean;
  onStartEdit: () => void;
  onSaveChanges: () => void;
  onCancelEdit: () => void;
  onMarkAsBaja: () => void;
  onMarkAsInactive: () => void;
  isDarkMode: boolean;
}

export default function ActionButtons({
  isEditing,
  uploading,
  onStartEdit,
  onSaveChanges,
  onCancelEdit,
  onMarkAsBaja,
  onMarkAsInactive,
  isDarkMode
}: ActionButtonsProps) {
  if (isEditing) {
    return (
      <div className="flex gap-2">
        <button
          onClick={onSaveChanges}
          disabled={uploading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            uploading
              ? isDarkMode
                ? 'bg-white/5 text-white/40 cursor-not-allowed'
                : 'bg-black/5 text-black/40 cursor-not-allowed'
              : isDarkMode
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                : 'bg-green-500/20 text-green-600 hover:bg-green-500/30 border border-green-500/30'
          }`}
        >
          <Save className="h-4 w-4" />
          {uploading ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          onClick={onCancelEdit}
          disabled={uploading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            uploading
              ? isDarkMode
                ? 'bg-white/5 text-white/40 cursor-not-allowed'
                : 'bg-black/5 text-black/40 cursor-not-allowed'
              : isDarkMode
                ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                : 'bg-black/5 text-black hover:bg-black/10 border border-black/10'
          }`}
        >
          <X className="h-4 w-4" />
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={onStartEdit}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          isDarkMode
            ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30'
            : 'bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 border border-blue-500/30'
        }`}
      >
        <Edit className="h-4 w-4" />
        Editar
      </button>
      <button
        onClick={onMarkAsInactive}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          isDarkMode
            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30'
            : 'bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30 border border-yellow-500/30'
        }`}
      >
        <AlertTriangle className="h-4 w-4" />
        Marcar Inactivo
      </button>
      <button
        onClick={onMarkAsBaja}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          isDarkMode
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
            : 'bg-red-500/20 text-red-600 hover:bg-red-500/30 border border-red-500/30'
        }`}
      >
        <Trash2 className="h-4 w-4" />
        Dar de Baja
      </button>
    </div>
  );
}
