import { Edit, Save, X, Trash2, AlertTriangle } from 'lucide-react';

interface ActionButtonsProps {
  isEditing: boolean;
  uploading: boolean;
  userRole: string | null;
  onStartEdit: () => void;
  onSaveChanges: () => void;
  onCancelEdit: () => void;
  onMarkAsInactive: () => void;
  onMarkAsBaja: () => void;
  isDarkMode: boolean;
}

export default function ActionButtons({
  isEditing,
  uploading,
  userRole,
  onStartEdit,
  onSaveChanges,
  onCancelEdit,
  onMarkAsInactive,
  onMarkAsBaja,
  isDarkMode
}: ActionButtonsProps) {
  const canEdit = userRole === 'admin' || userRole === 'superadmin';

  if (!canEdit) return null;

  return (
    <div className={`border-t px-6 py-4 flex flex-wrap gap-2 ${
      isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/10'
    }`}>
      {isEditing ? (
        <>
          <button
            onClick={onSaveChanges}
            disabled={uploading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              uploading
                ? isDarkMode
                  ? 'bg-white/5 text-white/40 cursor-not-allowed'
                  : 'bg-black/5 text-black/40 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'bg-black text-white hover:bg-black/90'
            }`}
          >
            <Save size={16} />
            {uploading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button
            onClick={onCancelEdit}
            disabled={uploading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              uploading
                ? isDarkMode
                  ? 'border-white/10 text-white/40 cursor-not-allowed'
                  : 'border-black/10 text-black/40 cursor-not-allowed'
                : isDarkMode
                  ? 'border-white/10 text-white hover:bg-white/5'
                  : 'border-black/10 text-black hover:bg-black/5'
            }`}
          >
            <X size={16} />
            Cancelar
          </button>
        </>
      ) : (
        <>
          <button
            onClick={onStartEdit}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isDarkMode
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-black text-white hover:bg-black/90'
            }`}
          >
            <Edit size={16} />
            Editar
          </button>
          <button
            onClick={onMarkAsInactive}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              isDarkMode
                ? 'border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10'
                : 'border-yellow-500/20 text-yellow-600 hover:bg-yellow-50'
            }`}
          >
            <AlertTriangle size={16} />
            Marcar Inactivo
          </button>
          <button
            onClick={onMarkAsBaja}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              isDarkMode
                ? 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                : 'border-red-500/20 text-red-600 hover:bg-red-50'
            }`}
          >
            <Trash2 size={16} />
            Dar de Baja
          </button>
        </>
      )}
    </div>
  );
}
