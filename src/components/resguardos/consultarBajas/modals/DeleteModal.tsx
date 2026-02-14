import { AlertCircle, FileDigit, ListChecks } from 'lucide-react';
import type { DeleteType, ItemToDelete } from '../types';

interface DeleteModalProps {
  show: boolean;
  deleteType: DeleteType | null;
  itemToDelete: ItemToDelete | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

/**
 * Unified delete confirmation modal
 * Handles deletion of folio, selected items, or single item
 */
export const DeleteModal: React.FC<DeleteModalProps> = ({
  show,
  deleteType,
  itemToDelete,
  onConfirm,
  onCancel,
  isDarkMode
}) => {
  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm ${
      isDarkMode ? 'bg-black/80' : 'bg-black/50'
    }`}>
      <div className={`rounded-lg border w-full max-w-md overflow-hidden backdrop-blur-xl ${
        isDarkMode ? 'bg-black/95 border-white/10' : 'bg-white/95 border-black/10'
      }`}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                isDarkMode ? 'bg-red-500/10' : 'bg-red-50'
              }`}>
                <AlertCircle size={20} className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
              </div>
              <div>
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Confirmar eliminación
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-lg border p-3 mb-6 ${
            isDarkMode
              ? 'bg-white/[0.02] border-white/10'
              : 'bg-black/[0.02] border-black/10'
          }`}>
            {deleteType === 'folio' && itemToDelete?.folioResguardo && (
              <div className="flex items-center gap-3">
                <FileDigit className={`h-4 w-4 ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`} />
                <div>
                  <p className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    Folio: {itemToDelete.folioResguardo}
                  </p>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-black/60'
                  }`}>
                    Se eliminarán todos los artículos asociados
                  </p>
                </div>
              </div>
            )}

            {deleteType === 'selected' && itemToDelete?.articulos && (
              <div className="flex items-center gap-3">
                <ListChecks className={`h-4 w-4 ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`} />
                <div>
                  <p className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    {itemToDelete.articulos.length} artículos seleccionados
                  </p>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-black/60'
                  }`}>
                    Se eliminarán los artículos marcados
                  </p>
                </div>
              </div>
            )}

            {deleteType === 'single' && itemToDelete?.singleArticulo && (
              <div className="flex items-center gap-3">
                <FileDigit className={`h-4 w-4 ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`} />
                <div>
                  <p className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    {itemToDelete.singleArticulo.num_inventario}
                  </p>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-white/60' : 'text-black/60'
                  }`}>
                    {itemToDelete.singleArticulo.descripcion}
                  </p>
                </div>
              </div>
            )}
          </div>

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
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
