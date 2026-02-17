import { ListChecks, X, FileDigit, User, Briefcase, CircleX, XOctagon } from 'lucide-react';
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
    <div className={`rounded-lg border h-[45vh] flex flex-col ${
      isDarkMode
        ? 'bg-white/[0.02] border-white/10'
        : 'bg-black/[0.02] border-black/10'
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b flex-shrink-0 flex items-center justify-between ${
        isDarkMode ? 'border-white/10' : 'border-black/10'
      }`}>
        <div className="flex items-center gap-2">
          <h2 className={`text-sm font-medium ${
            isDarkMode ? 'text-white/60' : 'text-black/60'
          }`}>
            Artículos Dados de Baja
          </h2>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            isDarkMode 
              ? 'bg-white/10 text-white border-white/20' 
              : 'bg-black/10 text-black border-black/20'
          }`}>
            {selectedBaja?.articulos.length || 0}
          </span>
        </div>
        
        {selectedBaja && selectedBaja.articulos.length > 0 && selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={onClearSelections}
              className={`px-2 py-1 rounded border transition-colors flex items-center gap-1 text-xs ${
                isDarkMode
                  ? 'border-white/10 hover:bg-white/5 text-white'
                  : 'border-black/10 hover:bg-black/5 text-black'
              }`}
            >
              <X className="h-3 w-3" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
            <RoleGuard roles={["admin", "superadmin"]} userRole={userRole ?? undefined}>
              <button
                onClick={onDeleteSelected}
                className={`px-2 py-1 rounded border transition-colors flex items-center gap-1 text-xs ${
                  isDarkMode
                    ? 'border-white/10 hover:bg-white/5 text-white'
                    : 'border-black/10 hover:bg-black/5 text-black'
                }`}
              >
                <XOctagon className="h-3 w-3" />
                <span className="hidden sm:inline">Eliminar ({selectedCount})</span>
                <span className="sm:hidden">({selectedCount})</span>
              </button>
            </RoleGuard>
          </div>
        )}
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {selectedBaja ? (
          <>
            {Object.entries(groupedItems).map(([folioBaja, articulosGrupo]) => (
              <div key={folioBaja} className="mb-3 last:mb-0">
                {/* Folio Baja Header */}
                <div className={`rounded-lg border p-2.5 mb-2 flex items-center justify-between ${
                  isDarkMode
                    ? 'bg-white/[0.02] border-white/10'
                    : 'bg-black/[0.02] border-black/10'
                }`}>
                  <div className="flex items-center gap-2">
                    <FileDigit className={`h-3.5 w-3.5 ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`} />
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>
                      {folioBaja}
                    </span>
                    <span className={`text-xs ${
                      isDarkMode ? 'text-white/40' : 'text-black/40'
                    }`}>
                      ({articulosGrupo.length})
                    </span>
                  </div>
                  <button
                    onClick={() => onGroupSelection(folioBaja, articulosGrupo)}
                    className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors text-xs ${
                      isDarkMode
                        ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                        : 'bg-black/5 hover:bg-black/10 text-black border-black/10'
                    }`}
                  >
                    {articulosGrupo.every(art => selectedItems[art.id]) ? 'Deseleccionar' : 'Seleccionar'}
                  </button>
                </div>

                {/* Articles List */}
                <div className="space-y-1.5">
                  {articulosGrupo.map((articulo) => (
                    <div
                      key={articulo.id}
                      className={`rounded-lg border p-2.5 transition-colors ${
                        selectedItems[articulo.id]
                          ? (isDarkMode ? 'bg-white/[0.04] border-white/20' : 'bg-black/[0.04] border-black/20')
                          : (isDarkMode ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.03]' : 'bg-black/[0.02] border-black/10 hover:bg-black/[0.03]')
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {/* Checkbox */}
                        <div
                          onClick={() => onItemSelection(articulo.id)}
                          className={`flex items-center justify-center w-4 h-4 rounded border cursor-pointer transition-all mt-0.5 flex-shrink-0 ${
                            selectedItems[articulo.id]
                              ? (isDarkMode ? 'bg-white/20 border-white/40' : 'bg-black/20 border-black/40')
                              : (isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10')
                          }`}
                        >
                          {selectedItems[articulo.id] && (
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              isDarkMode ? 'bg-white' : 'bg-black'
                            }`}></div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* ID and Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className={`text-sm font-semibold ${
                              isDarkMode ? 'text-white' : 'text-black'
                            }`}>
                              {articulo.num_inventario}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${
                              articulo.condicion === 'B' ? (isDarkMode ? 'bg-green-500/10 text-green-300 border-green-500/30' : 'bg-green-100 text-green-700 border-green-300') :
                              articulo.condicion === 'R' ? (isDarkMode ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' : 'bg-yellow-100 text-yellow-700 border-yellow-300') :
                              articulo.condicion === 'M' ? (isDarkMode ? 'bg-red-500/10 text-red-300 border-red-500/30' : 'bg-red-100 text-red-700 border-red-300') :
                              (isDarkMode ? 'bg-white/5 text-white/60 border-white/20' : 'bg-black/5 text-black/60 border-black/20')
                            }`}>
                              {articulo.condicion}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${
                              articulo.origen === 'INEA' ? (isDarkMode ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-300') :
                              articulo.origen === 'ITEA' ? (isDarkMode ? 'bg-pink-500/10 text-pink-300 border-pink-500/30' : 'bg-pink-100 text-pink-700 border-pink-300') :
                              (articulo.origen === 'NO_LISTADO' || articulo.origen === 'TLAXCALA') ? (isDarkMode ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-300') :
                              (isDarkMode ? 'bg-white/5 text-white/60 border-white/20' : 'bg-black/5 text-black/60 border-black/20')
                            }`}>
                              {articulo.origen === 'NO_LISTADO' ? 'TLAXCALA' : articulo.origen}
                            </span>
                          </div>

                          {/* Description */}
                          <div className={`text-xs mb-1 line-clamp-2 leading-relaxed ${
                            isDarkMode ? 'text-white/70' : 'text-black/70'
                          }`}>
                            {articulo.descripcion}
                          </div>

                          {/* Rubro */}
                          <div className={`text-xs flex items-center gap-1 mb-1 ${
                            isDarkMode ? 'text-white/40' : 'text-black/40'
                          }`}>
                            <Briefcase className="h-2.5 w-2.5" />
                            {articulo.rubro}
                          </div>

                          {/* Resguardante */}
                          <div className={`text-xs flex items-center gap-1 ${
                            isDarkMode ? 'text-white/40' : 'text-black/40'
                          }`}>
                            <User className="h-2.5 w-2.5" />
                            {articulo.usufinal || <span className="italic">Sin asignar</span>}
                          </div>
                        </div>

                        {/* Delete Button */}
                        <RoleGuard roles={["admin", "superadmin"]} userRole={userRole || undefined}>
                          <button
                            onClick={() => onDeleteSingle(articulo)}
                            className={`p-1 rounded transition-colors flex-shrink-0 ${
                              isDarkMode
                                ? 'text-white/40 hover:text-white hover:bg-white/5'
                                : 'text-black/40 hover:text-black hover:bg-black/5'
                            }`}
                          >
                            <CircleX className="h-3.5 w-3.5" />
                          </button>
                        </RoleGuard>
                      </div>
                    </div>
                  ))}
                </div>
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
