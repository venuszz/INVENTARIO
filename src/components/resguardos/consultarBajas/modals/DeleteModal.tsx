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
    <div className={`fixed inset-0 flex items-center justify-center z-50 px-4 animate-fadeIn ${
      isDarkMode ? 'bg-black/90' : 'bg-gray-900/50'
    }`}>
      <div className={`rounded-2xl shadow-2xl border w-full max-w-md overflow-hidden ${
        isDarkMode
          ? 'bg-black border-red-900/30'
          : 'bg-white border-red-300'
      }`}>
        <div className={`relative p-6 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
          <div className={`absolute top-0 left-0 w-full h-1 ${
            isDarkMode ? 'bg-red-800/60' : 'bg-red-400'
          }`}></div>

          <div className="flex flex-col items-center text-center mb-4">
            <div className={`p-3 rounded-full border mb-3 animate-pulse ${
              isDarkMode
                ? 'bg-red-900/20 border-red-900/30'
                : 'bg-red-100 border-red-300'
            }`}>
              <AlertCircle className={`h-8 w-8 ${
                isDarkMode ? 'text-red-500' : 'text-red-600'
              }`} />
            </div>
            <h3 className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Confirmar eliminación
            </h3>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {deleteType === 'folio' && "¿Estás seguro de que deseas eliminar todo el folio de baja? Esta acción no se puede deshacer."}
              {deleteType === 'selected' && "¿Estás seguro de que deseas eliminar los artículos seleccionados? Esta acción no se puede deshacer."}
              {deleteType === 'single' && "¿Estás seguro de que deseas eliminar este artículo? Esta acción no se puede deshacer."}
            </p>
          </div>

          <div className="space-y-4 mt-6">
            {deleteType === 'folio' && itemToDelete?.folioResguardo && (
              <div className={`rounded-lg border p-4 ${
                isDarkMode
                  ? 'border-gray-800 bg-gradient-to-b from-gray-900/50 to-gray-900/30'
                  : 'border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isDarkMode ? 'bg-gray-800/70' : 'bg-gray-200'
                  }`}>
                    <FileDigit className={`h-4 w-4 ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <span className={`font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Folio: {itemToDelete.folioResguardo}
                    </span>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      Se eliminarán todos los artículos asociados
                    </p>
                  </div>
                </div>
              </div>
            )}

            {deleteType === 'selected' && itemToDelete?.articulos && (
              <div className={`rounded-lg border p-4 ${
                isDarkMode
                  ? 'border-gray-800 bg-gradient-to-b from-gray-900/50 to-gray-900/30'
                  : 'border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isDarkMode ? 'bg-gray-800/70' : 'bg-gray-200'
                  }`}>
                    <ListChecks className={`h-4 w-4 ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <span className={`font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {itemToDelete.articulos.length} artículos seleccionados
                    </span>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      Se eliminarán los artículos marcados
                    </p>
                  </div>
                </div>
              </div>
            )}

            {deleteType === 'single' && itemToDelete?.singleArticulo && (
              <div className={`rounded-lg border p-4 ${
                isDarkMode
                  ? 'border-gray-800 bg-gradient-to-b from-gray-900/50 to-gray-900/30'
                  : 'border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isDarkMode ? 'bg-gray-800/70' : 'bg-gray-200'
                  }`}>
                    <FileDigit className={`h-4 w-4 ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <span className={`font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Artículo: {itemToDelete.singleArticulo.num_inventario}
                    </span>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      {itemToDelete.singleArticulo.descripcion}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={onCancel}
                className={`flex-1 py-2.5 px-4 rounded-lg transition-all duration-300 border ${
                  isDarkMode
                    ? 'bg-gradient-to-b from-gray-900/50 to-gray-900/30 text-gray-300 hover:from-gray-800/60 hover:to-gray-800/40 border-gray-800/50 hover:text-white'
                    : 'bg-gradient-to-b from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 border-gray-300 hover:text-gray-900'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 py-2.5 px-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-all duration-300 shadow-lg ${
                  isDarkMode
                    ? 'hover:shadow-red-500/30'
                    : 'hover:shadow-red-500/30'
                }`}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
