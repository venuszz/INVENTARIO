import { X, CircleX } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { ResguardoArticulo } from '../types';

/**
 * Props for DeleteItemModal component
 */
interface DeleteItemModalProps {
  show: boolean;
  articulo: ResguardoArticulo | null;
  folio: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

/**
 * DeleteItemModal - Confirmation modal for deleting a single article
 * 
 * Displays a warning message with article details and confirmation buttons.
 * Uses red theme to indicate destructive action.
 * 
 * @param show - Whether to show the modal
 * @param articulo - The article to delete
 * @param folio - The resguardo folio
 * @param onConfirm - Handler for confirm button
 * @param onCancel - Handler for cancel button
 * @param isDeleting - Whether deletion is in progress
 */
export default function DeleteItemModal({
  show,
  articulo,
  folio,
  onConfirm,
  onCancel,
  isDeleting
}: DeleteItemModalProps) {
  const { isDarkMode } = useTheme();

  if (!show || !articulo) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm ${
      isDarkMode ? 'bg-black/80' : 'bg-black/50'
    }`}>
      <div className={`rounded-lg border w-full max-w-md overflow-hidden backdrop-blur-xl ${
        isDarkMode ? 'bg-black/95 border-white/10' : 'bg-white/95 border-black/10'
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                isDarkMode ? 'bg-red-500/10' : 'bg-red-50'
              }`}>
                <CircleX size={20} className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
              </div>
              <div>
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  ¿Eliminar este artículo?
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-white/10 text-white'
                  : 'hover:bg-black/10 text-black'
              }`}
            >
              <X size={16} />
            </button>
          </div>

          {/* Message */}
          <div className={`rounded-lg border p-3 mb-6 ${
            isDarkMode
              ? 'bg-white/[0.02] border-white/10'
              : 'bg-black/[0.02] border-black/10'
          }`}>
            <p className={`text-sm ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}>
              El artículo{' '}
              <span className={`font-medium ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{articulo.num_inventario}</span>{' '}
              será eliminado del resguardo{' '}
              <span className={`font-medium ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{folio}</span>.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'border-white/10 hover:bg-white/5 text-white'
                  : 'border-black/10 hover:bg-black/5 text-black'
              }`}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDeleting
                  ? 'bg-red-600/50 text-white cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
