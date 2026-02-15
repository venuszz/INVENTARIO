/**
 * ArticulosListPanel Component
 * 
 * Display and manage articles grouped by resguardante
 */

'use client';

import { User, FileText, Briefcase, CircleX, XOctagon, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import RoleGuard from '@/components/roleGuard';
import { ResguardoArticulo } from '../types';

interface ArticulosListPanelProps {
  articulos: ResguardoArticulo[];
  selectedArticulos: string[];
  onToggleSelection: (numInventario: string) => void;
  onDeleteSelected: () => void;
  onDeleteSingle: (articulo: ResguardoArticulo) => void;
  onGeneratePDFByResguardante: (resguardante: string, articulos: ResguardoArticulo[]) => void;
  onClearSelection: () => void;
  userRole: string | null;
}

/**
 * ArticulosListPanel - Display articles grouped by resguardante
 */
export default function ArticulosListPanel({
  articulos,
  selectedArticulos,
  onToggleSelection,
  onDeleteSelected,
  onDeleteSingle,
  onGeneratePDFByResguardante,
  onClearSelection,
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
    <div className={`rounded-lg border h-[70vh] flex flex-col ${
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
            Artículos del Resguardo
          </h2>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            isDarkMode 
              ? 'bg-white/10 text-white border-white/20' 
              : 'bg-black/10 text-black border-black/20'
          }`}>
            {articulos.length}
          </span>
        </div>
        
        {articulos.length > 0 && selectedArticulos.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={onClearSelection}
              className={`px-2 py-1 rounded border transition-colors flex items-center gap-1 text-xs ${
                isDarkMode
                  ? 'border-white/10 hover:bg-white/5 text-white'
                  : 'border-black/10 hover:bg-black/5 text-black'
              }`}
            >
              <X className="h-3 w-3" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
            <RoleGuard roles={["admin", "superadmin"]} userRole={userRole || undefined}>
              <button
                onClick={onDeleteSelected}
                className={`px-2 py-1 rounded border transition-colors flex items-center gap-1 text-xs ${
                  isDarkMode
                    ? 'border-white/10 hover:bg-white/5 text-white'
                    : 'border-black/10 hover:bg-black/5 text-black'
                }`}
              >
                <XOctagon className="h-3 w-3" />
                <span className="hidden sm:inline">Eliminar ({selectedArticulos.length})</span>
                <span className="sm:hidden">({selectedArticulos.length})</span>
              </button>
            </RoleGuard>
          </div>
        )}
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {Object.entries(groupedArticulos).map(([resguardante, articulosGrupo]) => (
          <div key={resguardante} className="mb-3 last:mb-0">
            {/* Resguardante Header */}
            <div className={`rounded-lg border p-2.5 mb-2 flex items-center justify-between ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10'
                : 'bg-black/[0.02] border-black/10'
            }`}>
              <div className="flex items-center gap-2">
                <User className={`h-3.5 w-3.5 ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`} />
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {resguardante}
                </span>
                <span className={`text-xs ${
                  isDarkMode ? 'text-white/40' : 'text-black/40'
                }`}>
                  ({articulosGrupo.length})
                </span>
              </div>
              <button
                onClick={() => onGeneratePDFByResguardante(resguardante, articulosGrupo)}
                className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors text-xs ${
                  isDarkMode
                    ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                    : 'bg-black/5 hover:bg-black/10 text-black border-black/10'
                }`}
              >
                <FileText className="h-3 w-3" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>

            {/* Articles List */}
            <div className="space-y-2.5">
              {articulosGrupo.map((articulo) => (
                <div
                  key={articulo.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    selectedArticulos.includes(articulo.num_inventario)
                      ? (isDarkMode ? 'bg-white/[0.04] border-white/20' : 'bg-black/[0.04] border-black/20')
                      : (isDarkMode ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.03]' : 'bg-black/[0.02] border-black/10 hover:bg-black/[0.03]')
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div
                      onClick={() => onToggleSelection(articulo.num_inventario)}
                      className={`flex items-center justify-center w-5 h-5 rounded border cursor-pointer transition-all mt-0.5 flex-shrink-0 ${
                        selectedArticulos.includes(articulo.num_inventario)
                          ? (isDarkMode ? 'bg-white/20 border-white/40' : 'bg-black/20 border-black/40')
                          : (isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/10')
                      }`}
                    >
                      {selectedArticulos.includes(articulo.num_inventario) && (
                        <div className={`w-2 h-2 rounded-full ${
                          isDarkMode ? 'bg-white' : 'bg-black'
                        }`}></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* ID and Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-base font-semibold ${
                          isDarkMode ? 'text-white' : 'text-black'
                        }`}>
                          {articulo.num_inventario}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                          articulo.condicion === 'B' ? (isDarkMode ? 'bg-green-500/10 text-green-300 border-green-500/30' : 'bg-green-100 text-green-700 border-green-300') :
                          articulo.condicion === 'R' ? (isDarkMode ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' : 'bg-yellow-100 text-yellow-700 border-yellow-300') :
                          articulo.condicion === 'M' ? (isDarkMode ? 'bg-red-500/10 text-red-300 border-red-500/30' : 'bg-red-100 text-red-700 border-red-300') :
                          (isDarkMode ? 'bg-white/5 text-white/60 border-white/20' : 'bg-black/5 text-black/60 border-black/20')
                        }`}>
                          {articulo.condicion}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                          articulo.origen === 'INEA' ? (isDarkMode ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-300') :
                          articulo.origen === 'ITEA' ? (isDarkMode ? 'bg-pink-500/10 text-pink-300 border-pink-500/30' : 'bg-pink-100 text-pink-700 border-pink-300') :
                          (articulo.origen === 'NO_LISTADO' || articulo.origen === 'TLAXCALA') ? (isDarkMode ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-300') :
                          (isDarkMode ? 'bg-white/5 text-white/60 border-white/20' : 'bg-black/5 text-black/60 border-black/20')
                        }`}>
                          {articulo.origen === 'NO_LISTADO' ? 'TLAXCALA' : articulo.origen}
                        </span>
                      </div>

                      {/* Description */}
                      <div className={`text-sm mb-2 line-clamp-2 leading-relaxed ${
                        isDarkMode ? 'text-white/70' : 'text-black/70'
                      }`}>
                        {articulo.descripcion}
                      </div>

                      {/* Rubro */}
                      <div className={`text-xs flex items-center gap-1.5 ${
                        isDarkMode ? 'text-white/40' : 'text-black/40'
                      }`}>
                        <Briefcase className="h-3 w-3" />
                        {articulo.rubro}
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
                        <CircleX className="h-4 w-4" />
                      </button>
                    </RoleGuard>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
