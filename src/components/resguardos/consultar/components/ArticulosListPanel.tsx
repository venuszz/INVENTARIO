/**
 * ArticulosListPanel Component
 * 
 * Display and manage articles grouped by resguardante
 */

'use client';

import { ListChecks, User, FileText, Briefcase, CircleX, XOctagon, X, Pencil } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import RoleGuard from '@/components/roleGuard';
import { ResguardoArticulo } from '../types';

interface ArticulosListPanelProps {
  articulos: ResguardoArticulo[];
  editResguardanteMode: boolean;
  editedResguardantes: { [id: number]: string };
  selectedArticulos: string[];
  onToggleEditMode: () => void;
  onResguardanteChange: (id: number, value: string) => void;
  onSaveResguardantes: () => void;
  onCancelEdit: () => void;
  onToggleSelection: (numInventario: string) => void;
  onDeleteSelected: () => void;
  onDeleteSingle: (articulo: ResguardoArticulo) => void;
  onGeneratePDFByResguardante: (resguardante: string, articulos: ResguardoArticulo[]) => void;
  onClearSelection: () => void;
  savingResguardantes: boolean;
  userRole: string | null;
}

/**
 * ArticulosListPanel - Display articles grouped by resguardante
 */
export default function ArticulosListPanel({
  articulos,
  editResguardanteMode,
  editedResguardantes,
  selectedArticulos,
  onToggleEditMode,
  onResguardanteChange,
  onSaveResguardantes,
  onCancelEdit,
  onToggleSelection,
  onDeleteSelected,
  onDeleteSingle,
  onGeneratePDFByResguardante,
  onClearSelection,
  savingResguardantes,
  userRole
}: ArticulosListPanelProps) {
  const { isDarkMode } = useTheme();

  // Group articles by resguardante
  const groupedArticulos = articulos.reduce((groups: { [key: string]: ResguardoArticulo[] }, articulo) => {
    const resguardante = articulo.resguardante || 'Sin asignar';
    if (!groups[resguardante]) {
      groups[resguardante] = [];
    }
    groups[resguardante].push(articulo);
    return groups;
  }, {});

  return (
    <div className={`rounded-lg border flex-grow flex flex-col overflow-hidden ${
      isDarkMode
        ? 'bg-white/[0.02] border-white/10'
        : 'bg-black/[0.02] border-black/10'
    }`}>
      <div className={`p-4 backdrop-blur-md border-b sticky top-0 z-20 flex items-center justify-between ${
        isDarkMode
          ? 'bg-black/80 border-white/10'
          : 'bg-white/80 border-black/10'
      }`}>
        <h2 className={`text-lg font-medium flex items-center gap-2 ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}>
          <ListChecks className="h-5 w-5" />
          Artículos del Resguardo ({articulos.length})
        </h2>
        {articulos.length > 0 && (
          <RoleGuard roles={["admin", "superadmin"]} userRole={userRole || undefined}>
            <button
              title={editResguardanteMode ? 'Cancelar edición' : 'Editar resguardantes'}
              onClick={onToggleEditMode}
              className={`ml-2 p-2 rounded-lg border transition-colors flex items-center gap-1 ${
                isDarkMode
                  ? 'border-white/10 hover:bg-white/5 text-white'
                  : 'border-black/10 hover:bg-black/5 text-black'
              } ${editResguardanteMode ? 'ring-2 ring-blue-400' : ''}`}
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">{editResguardanteMode ? 'Cancelar' : 'Editar'}</span>
            </button>
          </RoleGuard>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 max-h-[70vh]">
        {articulos.length > 0 ? (
          <>
            {selectedArticulos.length > 0 && (
              <div className="flex justify-end items-center gap-2 mb-4 overflow-auto">
                <RoleGuard roles={["admin", "superadmin"]} userRole={userRole || undefined}>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
                      isDarkMode
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                    onClick={onDeleteSelected}
                  >
                    <XOctagon className="h-4 w-4" />
                    Eliminar seleccionados ({selectedArticulos.length})
                  </button>
                </RoleGuard>
                <button
                  className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 border transition-colors ${
                    isDarkMode
                      ? 'border-white/10 hover:bg-white/5 text-white'
                      : 'border-black/10 hover:bg-black/5 text-black'
                  }`}
                  onClick={onClearSelection}
                >
                  <X className="h-4 w-4" />
                  Limpiar selección
                </button>
              </div>
            )}
            {Object.entries(groupedArticulos).map(([resguardante, articulosGrupo]) => (
              <div key={resguardante} className={`mb-8 rounded-lg border ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <div className={`flex items-center justify-between px-6 py-3 border-b ${
                  isDarkMode ? 'border-white/10' : 'border-black/10'
                }`}>
                  <div className="flex items-center gap-2">
                    <User className={`h-5 w-5 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <span className={`font-medium text-sm ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>
                      {resguardante}
                    </span>
                    <span className={`ml-2 text-xs ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`}>
                      {articulosGrupo.length} artículo{articulosGrupo.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => onGeneratePDFByResguardante(resguardante, articulosGrupo)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs border transition-colors ${
                      isDarkMode
                        ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-600'
                        : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                </div>
                <ul className={`divide-y ${
                  isDarkMode
                    ? 'divide-white/5'
                    : 'divide-black/5'
                }`}>
                  {articulosGrupo.map((articulo) => (
                    <li
                      key={articulo.id}
                      className={`flex items-start gap-4 px-6 py-3 transition-colors ${
                        selectedArticulos.includes(articulo.num_inventario)
                          ? (isDarkMode ? 'bg-white/[0.02]' : 'bg-black/[0.02]')
                          : (isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.02]')
                      }`}
                    >
                      <div
                        onClick={() => onToggleSelection(articulo.num_inventario)}
                        className={`flex items-center justify-center w-5 h-5 rounded border cursor-pointer transition-all mt-1 mr-2 ${
                          selectedArticulos.includes(articulo.num_inventario)
                            ? (isDarkMode ? 'bg-white/20 border-white/40' : 'bg-black/20 border-black/40')
                            : (isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10')
                        }`}
                        title="Seleccionar artículo"
                      >
                        {selectedArticulos.includes(articulo.num_inventario) && (
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
                            articulo.origen === 'INEA' ? (isDarkMode ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-300') :
                            articulo.origen === 'ITEA' ? (isDarkMode ? 'bg-pink-500/10 text-pink-300 border-pink-500/30' : 'bg-pink-100 text-pink-700 border-pink-300') :
                            (isDarkMode ? 'bg-white/5 text-white/60 border-white/20' : 'bg-black/5 text-black/60 border-black/20')
                          }`}>
                            {articulo.origen}
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
                        {editResguardanteMode ? (
                          <div className="mt-3 flex items-center gap-2">
                            <input
                              type="text"
                              value={editedResguardantes[articulo.id] || ''}
                              onChange={e => onResguardanteChange(articulo.id, e.target.value)}
                              placeholder="Resguardante (opcional)"
                              className={`block w-full border rounded-lg py-1.5 px-3 text-sm transition-all ${
                                isDarkMode
                                  ? 'bg-black border-white/10 text-white placeholder:text-white/40 focus:border-white/20'
                                  : 'bg-white border-black/10 text-black placeholder:text-black/40 focus:border-black/20'
                              } focus:outline-none`}
                            />
                            {editedResguardantes[articulo.id] && (
                              <button
                                title="Limpiar resguardante"
                                onClick={() => onResguardanteChange(articulo.id, '')}
                                className={`p-1 rounded-full transition-colors ${
                                  isDarkMode
                                    ? 'text-white/40 hover:text-red-400 hover:bg-white/5'
                                    : 'text-black/40 hover:text-red-600 hover:bg-black/5'
                                }`}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className={`mt-3 text-xs flex items-center gap-2 ${
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          }`}>
                            <User className="h-3.5 w-3.5" />
                            {articulo.resguardante || <span className={`italic ${
                              isDarkMode ? 'text-white/60' : 'text-black/60'
                            }`}>Sin asignar</span>}
                          </div>
                        )}
                      </div>
                      <RoleGuard roles={["admin", "superadmin"]} userRole={userRole || undefined}>
                        <button
                          title="Eliminar artículo"
                          onClick={() => onDeleteSingle(articulo)}
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
                {editResguardanteMode && (
                  <div className={`flex justify-end items-center gap-2 px-6 py-2 border-t ${
                    isDarkMode ? 'border-white/10' : 'border-black/10'
                  }`}>
                    <button
                      className={`px-4 py-2 border rounded-lg transition-colors text-sm ${
                        isDarkMode
                          ? 'border-white/10 hover:bg-white/5 text-white'
                          : 'border-black/10 hover:bg-black/5 text-black'
                      }`}
                      onClick={onCancelEdit}
                      disabled={savingResguardantes}
                    >
                      Cancelar
                    </button>
                    <button
                      className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                        isDarkMode
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                      onClick={onSaveResguardantes}
                      disabled={savingResguardantes}
                    >
                      {savingResguardantes ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                )}
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
            <p className="text-xs mt-1">Seleccione un resguardo para ver sus artículos</p>
          </div>
        )}
      </div>
    </div>
  );
}
