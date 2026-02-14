import { X, XOctagon, FileText } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { ResguardoArticulo } from '../types';

/**
 * Props for DeleteSelectedModal component
 */
interface DeleteSelectedModalProps {
  show: boolean;
  selectedCount: number;
  articulos: ResguardoArticulo[];
  selectedArticulos: string[];
  folio: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

/**
 * DeleteSelectedModal - Confirmation modal for deleting multiple selected articles
 * 
 * Displays a warning message with the count of selected articles and a scrollable list.
 * Uses red theme to indicate destructive action.
 * 
 * @param show - Whether to show the modal
 * @param selectedCount - Number of selected articles
 * @param articulos - All articles in the resguardo
 * @param selectedArticulos - Array of selected article IDs
 * @param folio - The resguardo folio
 * @param onConfirm - Handler for confirm button
 * @param onCancel - Handler for cancel button
 * @param isDeleting - Whether deletion is in progress
 */
export default function DeleteSelectedModal({
  show,
  selectedCount,
  articulos,
  selectedArticulos,
  folio,
  onConfirm,
  onCancel,
  isDeleting
}: DeleteSelectedModalProps) {
  const { isDarkMode } = useTheme();

  if (!show) return null;

  const selectedArticulosData = articulos.filter(a => selectedArticulos.includes(a.num_inventario || ''));

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
                <XOctagon size={20} className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
              </div>
              <div>
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  ¿Eliminar artículos seleccionados?
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                  {selectedCount} {selectedCount === 1 ? 'artículo' : 'artículos'}
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

          {/* Message and list */}
          <div className={`rounded-lg border p-3 mb-6 ${
            isDarkMode
              ? 'bg-white/[0.02] border-white/10'
              : 'bg-black/[0.02] border-black/10'
          }`}>
            <p className={`text-sm mb-3 ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}>
              Se eliminarán los siguientes artículos del resguardo{' '}
              <span className={`font-medium ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{folio}</span>:
            </p>
            <ul className={`max-h-40 overflow-y-auto text-sm ${
              isDarkMode
                ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20'
                : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20'
            }`}>
              {selectedArticulosData.map(a => (
                <li key={a.num_inventario} className={`flex items-start gap-2 py-1.5 ${
                  isDarkMode ? 'text-white/70' : 'text-black/70'
                }`}>
                  <FileText size={14} className={`mt-0.5 flex-shrink-0 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`} />
                  <span className="font-mono text-xs">{a.num_inventario}</span>
                  <span className="text-xs truncate">{a.descripcion}</span>
                </li>
              ))}
            </ul>
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
              {isDeleting ? 'Eliminando...' : 'Eliminar seleccionados'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
