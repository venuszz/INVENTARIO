import { ListChecks, X, FileDigit, Calendar, User, Briefcase, CircleX, XOctagon } from 'lucide-react';
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
    <div className={`rounded-lg border p-4 flex-grow flex flex-col overflow-hidden ${
      isDarkMode
        ? 'bg-white/[0.02] border-white/10'
        : 'bg-black/[0.02] border-black/10'
    }`}>
      <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${
        isDarkMode ? 'text-white' : 'text-black'
      }`}>
        <ListChecks className="h-5 w-5" />
        Artículos Dados de Baja ({selectedBaja?.articulos.length || 0})
      </h2>

      <div className="flex-1 overflow-y-auto max-h-[70vh]">
        {selectedBaja ? (
          <>
            {selectedCount > 0 && (
              <div className="flex justify-end items-center gap-2 mb-4 overflow-auto">
                <RoleGuard roles={["admin", "superadmin"]} userRole={userRole ?? undefined}>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
                      isDarkMode
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                    onClick={onDeleteSelected}
                  >
                    <XOctagon className="h-4 w-4" />
                    Eliminar seleccionados ({selectedCount})
                  </button>
                </RoleGuard>
                <button
                  className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 border transition-colors ${
                    isDarkMode
                      ? 'border-white/10 hover:bg-white/5 text-white'
                      : 'border-black/10 hover:bg-black/5 text-black'
                  }`}
                  onClick={onClearSelections}
                >
                  <X className="h-4 w-4" />
                  Limpiar selección
                </button>
              </div>
            )}

            {Object.entries(groupedItems).map(([folioBaja, articulos]) => (
              <div key={folioBaja} className={`mb-8 rounded-lg border ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <div className={`flex items-center justify-between px-6 py-3 border-b ${
                  isDarkMode ? 'border-white/10' : 'border-black/10'
                }`}>
                  <div className="flex items-center gap-2">
                    <FileDigit className="h-4 w-4" />
                    <span className={`font-medium text-sm ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>
                      Folio de Baja: {folioBaja}
                    </span>
                    <span className={`ml-2 text-xs ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`}>
                      {articulos.length} artículo{articulos.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => onGroupSelection(folioBaja, articulos)}
                    className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                      isDarkMode
                        ? 'border-white/10 hover:bg-white/5 text-white'
                        : 'border-black/10 hover:bg-black/5 text-black'
                    }`}
                  >
                    {articulos.every(art => selectedItems[art.id]) ? 'Deseleccionar' : 'Seleccionar'}
                  </button>
                </div>

                <ul className={`divide-y ${
                  isDarkMode
                    ? 'divide-white/5'
                    : 'divide-black/5'
                }`}>
                  {articulos.map((articulo, index) => (
                    <li
                      key={`${folioBaja}-${index}`}
                      className={`flex items-start gap-4 px-6 py-3 transition-colors ${
                        selectedItems[articulo.id]
                          ? (isDarkMode ? 'bg-white/[0.02]' : 'bg-black/[0.02]')
                          : (isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.02]')
                      }`}
                    >
                      <div
                        onClick={() => onItemSelection(articulo.id)}
                        className={`flex items-center justify-center w-5 h-5 rounded border cursor-pointer transition-all mt-1 mr-2 ${
                          selectedItems[articulo.id]
                            ? (isDarkMode ? 'bg-white/20 border-white/40' : 'bg-black/20 border-black/40')
                            : (isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10')
                        }`}
                        title="Seleccionar artículo"
                      >
                        {selectedItems[articulo.id] && (
                          <div className={`w-2 h-2 rounded-full ${
                            isDarkMode ? 'bg-white' : 'bg-black'
                          }`}></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-sm font-medium truncate ${
                            isDarkMode ? 'text-white' : 'text-black'
                          }`}>
                            {articulo.num_inventario}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                            articulo.condicion === 'B' ? (isDarkMode ? 'bg-green-500/10 text-green-300 border-green-500/30' : 'bg-green-100 text-green-700 border-green-300') :
                            articulo.condicion === 'R' ? (isDarkMode ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' : 'bg-yellow-100 text-yellow-700 border-yellow-300') :
                            articulo.condicion === 'M' ? (isDarkMode ? 'bg-red-500/10 text-red-300 border-red-500/30' : 'bg-red-100 text-red-700 border-red-300') :
                            (isDarkMode ? 'bg-white/5 text-white/60 border-white/20' : 'bg-black/5 text-black/60 border-black/20')
                          }`}>
                            {articulo.condicion}
                          </span>
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium border ${
                            articulo.origen === 'INEA' || articulo.num_inventario.startsWith('INEA') ? (isDarkMode ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-300') :
                            articulo.origen === 'ITEA' || articulo.num_inventario.startsWith('ITEA') ? (isDarkMode ? 'bg-pink-500/10 text-pink-300 border-pink-500/30' : 'bg-pink-100 text-pink-700 border-pink-300') :
                            (isDarkMode ? 'bg-white/5 text-white/60 border-white/20' : 'bg-black/5 text-black/60 border-black/20')
                          }`}>
                            {articulo.origen?.startsWith('INEA') || articulo.num_inventario.startsWith('INEA') ? 'INEA' : 'ITEA'}
                          </span>
                        </div>
                        <div className={`text-xs mt-1 ${
                          isDarkMode ? 'text-white/80' : 'text-black/80'
                        }`}>
                          {articulo.descripcion}
                        </div>
                        <div className={`text-xs mt-1 flex items-center gap-1 ${
                          isDarkMode ? 'text-white/60' : 'text-black/60'
                        }`}>
                          <Briefcase className="h-3 w-3" />
                          {articulo.rubro}
                        </div>
                        <div className={`mt-3 text-xs flex items-center gap-2 ${
                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          <User className="h-3.5 w-3.5" />
                          {articulo.usufinal || <span className={`italic ${
                            isDarkMode ? 'text-white/60' : 'text-black/60'
                          }`}>Sin asignar</span>}
                        </div>
                      </div>
                      <RoleGuard roles={["admin", "superadmin"]} userRole={userRole ?? undefined}>
                        <button
                          title="Eliminar artículo"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSingle(articulo);
                          }}
                          className={`p-1 rounded-full self-center ml-auto transition-colors ${
                            isDarkMode
                              ? 'text-white/40 hover:text-red-400 hover:bg-white/5'
                              : 'text-black/40 hover:text-red-600 hover:bg-black/5'
                          }`}
                        >
                          <CircleX className="h-4 w-4" />
                        </button>
                      </RoleGuard>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        ) : (
          <div className={`flex flex-col items-center justify-center h-full min-h-[200px] ${
            isDarkMode ? 'text-white/60' : 'text-black/60'
          }`}>
            <ListChecks className={`h-12 w-12 mb-2 ${
              isDarkMode ? 'text-white/20' : 'text-black/20'
            }`} />
            <p className="text-sm">No hay artículos para mostrar</p>
            <p className="text-xs mt-1">Seleccione una baja para ver sus artículos</p>
          </div>
        )}
      </div>
    </div>
  );
};
