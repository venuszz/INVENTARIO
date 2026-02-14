import { ListChecks, X, FileDigit, Calendar } from 'lucide-react';
import RoleGuard from '@/components/roleGuard';
import type { ResguardoBajaDetalle, ResguardoBajaArticulo } from '../types';

interface ArticulosListPanelProps {
  selectedBaja: ResguardoBajaDetalle | null;
  groupedItems: { [key: string]: ResguardoBajaArticulo[] };
  selectedItems: { [key: string]: boolean };
  onItemSelection: (articleId: number) => void;
  onGroupSelection: (folioBaja: string, groupArticles: ResguardoBajaArticulo[]) => void;
  onClearSelections: () => void;
  onDeleteSelected: () => void;
  onDeleteSingle: (articulo: ResguardoBajaArticulo) => void;
  userRole: string | null;
  isDarkMode: boolean;
}

/**
 * Articulos list panel component
 * Displays the list of articles in the selected baja with selection and deletion options
 */
export const ArticulosListPanel: React.FC<ArticulosListPanelProps> = ({
  selectedBaja,
  groupedItems,
  selectedItems,
  onItemSelection,
  onGroupSelection,
  onClearSelections,
  onDeleteSelected,
  onDeleteSingle,
  userRole,
  isDarkMode
}) => {
  const selectedCount = Object.values(selectedItems).filter(Boolean).length;

  return (
    <div className={`rounded-xl border p-4 flex-grow shadow-inner relative max-h-[70vh] overflow-hidden ${
      isDarkMode
        ? 'bg-gray-900/30 border-gray-800'
        : 'bg-white border-gray-200'
    }`}>
      <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 sticky top-0 z-20 p-2 -m-2 backdrop-blur-md ${
        isDarkMode
          ? 'text-gray-100 bg-black'
          : 'text-gray-900 bg-white'
      }`}>
        <ListChecks className={`h-5 w-5 ${
          isDarkMode ? 'text-red-400' : 'text-red-600'
        }`} />
        Artículos Dados de Baja ({selectedBaja?.articulos.length || 0})
      </h2>

      {selectedBaja ? (
        <div className="space-y-3 mt-2 overflow-auto max-h-[54vh]">
          {/* Sticky header with actions */}
          <div className={`sticky top-0 z-10 backdrop-blur-sm p-2 -mx-2 mb-2 border-b ${
            isDarkMode
              ? 'bg-gradient-to-b from-black/90 to-black/80 border-gray-800/50'
              : 'bg-gradient-to-b from-white/90 to-white/80 border-gray-200/50'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={onClearSelections}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-300 border ${
                    isDarkMode
                      ? 'bg-black text-gray-400 hover:bg-gray-900 border-gray-800/50 hover:text-gray-300'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Limpiar Selección
                </button>
                {selectedCount > 0 && (
                  <RoleGuard roles={["admin", "superadmin"]} userRole={userRole ?? undefined}>
                    <button
                      onClick={onDeleteSelected}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-300 border flex items-center gap-2 ${
                        isDarkMode
                          ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30 border-red-900/50 hover:text-white'
                          : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-300 hover:text-red-800'
                      }`}
                    >
                      <X className="h-3 w-3" />
                      Eliminar Seleccionados
                    </button>
                  </RoleGuard>
                )}
              </div>
              <span className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {selectedCount} seleccionados
              </span>
            </div>
          </div>

          {/* Grouped articles */}
          {Object.entries(groupedItems).map(([folioBaja, articulos]) => (
            <div key={folioBaja} className={`mb-6 p-4 rounded-xl border ${
              isDarkMode
                ? 'bg-gray-900/20 border-gray-800/50'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-medium flex items-center gap-2 group ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  <FileDigit className="h-4 w-4 group-hover:animate-pulse" />
                  Folio de Baja: {folioBaja}
                </h3>
                <button
                  onClick={() => onGroupSelection(folioBaja, articulos)}
                  className={`px-2 py-1 text-xs rounded-lg transition-all duration-300 border ${
                    isDarkMode
                      ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30 border-red-900/50 hover:text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-300 hover:text-red-800'
                  }`}
                >
                  {articulos.every(art => selectedItems[art.id]) ? 'Deseleccionar Grupo' : 'Seleccionar Grupo'}
                </button>
              </div>

              <div className="space-y-2">
                {articulos.map((articulo, index) => (
                  <div
                    key={`${folioBaja}-${index}`}
                    className={`rounded-lg p-4 border-2 transition-all duration-300 hover:shadow-md ${
                      selectedItems[articulo.id]
                        ? (isDarkMode
                          ? 'bg-gradient-to-b from-red-900/20 to-red-900/10 border-red-500 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]'
                          : 'bg-gradient-to-b from-red-100 to-red-50 border-red-400 shadow-[0_0_15px_-3px_rgba(239,68,68,0.1)]'
                        )
                        : (isDarkMode
                          ? 'bg-gradient-to-b from-black/40 to-black/30 border-gray-800/50 hover:border-gray-700/50'
                          : 'bg-gradient-to-b from-gray-50 to-white border-gray-200 hover:border-gray-300'
                        )
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div
                        onClick={() => onItemSelection(articulo.id)}
                        className="flex-1 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`text-sm font-medium transition-colors ${
                            isDarkMode
                              ? 'text-white group-hover:text-red-400'
                              : 'text-gray-900 group-hover:text-red-600'
                          }`}>
                            {articulo.num_inventario}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            isDarkMode
                              ? 'bg-gray-800/70 text-gray-400'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {articulo.rubro}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            articulo.origen?.startsWith('INEA') || articulo.num_inventario.startsWith('INEA')
                              ? (isDarkMode
                                ? 'bg-blue-900/70 text-blue-200 border-blue-700/50'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                              )
                              : (isDarkMode
                                ? 'bg-purple-900/70 text-purple-200 border-purple-700/50'
                                : 'bg-purple-100 text-purple-800 border-purple-300'
                              )
                          }`}>
                            {articulo.origen?.startsWith('INEA') || articulo.num_inventario.startsWith('INEA') ? 'INEA' : 'ITEA'}
                          </span>
                        </div>
                        <p className={`text-sm transition-colors ${
                          isDarkMode
                            ? 'text-gray-300 group-hover:text-white'
                            : 'text-gray-700 group-hover:text-gray-900'
                        }`}>
                          {articulo.descripcion}
                        </p>
                        <div className={`flex items-center gap-2 text-xs mt-1 transition-colors ${
                          isDarkMode
                            ? 'text-gray-500 group-hover:text-gray-400'
                            : 'text-gray-600 group-hover:text-gray-700'
                        }`}>
                          <span>Condición: {articulo.condicion}</span>
                          <span className={isDarkMode ? 'text-gray-600' : 'text-gray-500'}>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {selectedBaja?.f_resguardo.slice(0, 10).split('-').reverse().join('/')}
                          </span>
                        </div>
                      </div>
                      <RoleGuard roles={["admin", "superadmin"]} userRole={userRole ?? undefined}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSingle(articulo);
                          }}
                          className={`p-2 rounded-lg transition-all duration-300 border shadow-lg ${
                            isDarkMode
                              ? 'bg-gradient-to-b from-red-900/20 to-red-900/10 text-red-400 hover:from-red-900/30 hover:to-red-900/20 border-red-900/50 hover:text-white hover:shadow-red-500/20'
                              : 'bg-gradient-to-b from-red-100 to-red-50 text-red-700 hover:from-red-200 hover:to-red-100 border-red-300 hover:text-red-800'
                          }`}
                          title="Eliminar artículo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </RoleGuard>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center h-full min-h-[200px] ${
          isDarkMode ? 'text-gray-500' : 'text-gray-600'
        }`}>
          <ListChecks className={`h-12 w-12 mb-2 animate-pulse ${
            isDarkMode ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <p className="text-sm">No hay artículos para mostrar</p>
          <p className="text-xs mt-1">Seleccione una baja para ver sus artículos</p>
        </div>
      )}
    </div>
  );
};
