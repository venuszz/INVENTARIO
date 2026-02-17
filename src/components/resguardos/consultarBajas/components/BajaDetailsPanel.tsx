import { FileText, FileDigit, Calendar, Building2, User, Download, X, Package, Loader2 } from 'lucide-react';
import RoleGuard from '@/components/roleGuard';
import type { ResguardoBajaDetalle } from '../types';

interface BajaDetailsPanelProps {
  selectedBaja: ResguardoBajaDetalle | null;
  selectedItemsCount: number;
  onGeneratePDF: () => void;
  onDeleteFolio: () => void;
  isGeneratingPDF?: boolean;
  isDeleting?: boolean;
  userRole: string | null;
  isDarkMode: boolean;
}

/**
 * Baja details panel component
 * Displays the details of the selected baja
 */
export const BajaDetailsPanel: React.FC<BajaDetailsPanelProps> = ({
  selectedBaja,
  selectedItemsCount,
  onGeneratePDF,
  onDeleteFolio,
  isGeneratingPDF = false,
  isDeleting = false,
  userRole,
  isDarkMode
}) => {
  return (
    <div className={`rounded-lg border h-[75vh] flex flex-col ${
      isDarkMode
        ? 'bg-white/[0.02] border-white/10'
        : 'bg-black/[0.02] border-black/10'
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b flex-shrink-0 ${
        isDarkMode ? 'border-white/10' : 'border-black/10'
      }`}>
        <h2 className={`text-sm font-medium ${
          isDarkMode ? 'text-white/60' : 'text-black/60'
        }`}>
          Información del Resguardo
        </h2>
      </div>

      {selectedBaja ? (
        <>
          {/* Content - Sin scroll, todos los elementos se adaptan proporcionalmente */}
          <div className="flex-1 px-4 py-3 flex flex-col gap-3 overflow-hidden">
            {/* Folio Resguardo y Folio(s) Baja - En una sola fila - flex-[2] */}
            <div className="grid grid-cols-2 gap-2 flex-[2]">
              {/* Folio Resguardo */}
              <div className={`rounded-lg border p-2.5 flex flex-col justify-center ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <FileDigit className={`h-3 w-3 ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`} />
                  <span className={`text-xs uppercase font-medium ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`}>
                    Folio Resguardo
                  </span>
                </div>
                <div className={`text-sm font-semibold ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {selectedBaja.folio_resguardo}
                </div>
              </div>

              {/* Folio(s) Baja */}
              <div className={`rounded-lg border p-2.5 flex flex-col justify-center ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText className={`h-3 w-3 ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`} />
                  <span className={`text-xs uppercase font-medium ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`}>
                    {Array.from(new Set(selectedBaja.articulos.map(a => a.folio_baja))).length > 1 ? 'Folios Baja' : 'Folio Baja'}
                  </span>
                </div>
                <div className={`text-sm font-semibold ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {Array.from(new Set(selectedBaja.articulos.map(a => a.folio_baja))).join(', ')}
                </div>
              </div>
            </div>

            {/* Fecha y Artículos - En una sola fila - flex-[2] */}
            <div className="grid grid-cols-2 gap-2 flex-[2]">

              {/* Fecha */}
              <div className={`rounded-lg border p-2.5 flex flex-col justify-center ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className={`h-3 w-3 ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`} />
                  <span className={`text-xs uppercase font-medium ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`}>
                    Fecha
                  </span>
                </div>
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {selectedBaja.f_resguardo.slice(0, 10).split('-').reverse().join('/')}
                </div>
              </div>

              {/* Artículos */}
              <div className={`rounded-lg border p-2.5 flex flex-col justify-center ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Package className={`h-3 w-3 ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`} />
                  <span className={`text-xs uppercase font-medium ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`}>
                    Artículos
                  </span>
                </div>
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {selectedBaja.articulos.length}
                </div>
              </div>
            </div>

            {/* Director - flex-[2] */}
            <div className={`rounded-lg border p-2.5 flex-[2] flex flex-col justify-center ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10'
                : 'bg-black/[0.02] border-black/10'
            }`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Building2 className={`h-3 w-3 ${
                  isDarkMode ? 'text-white/40' : 'text-black/40'
                }`} />
                <span className={`text-xs uppercase font-medium ${
                  isDarkMode ? 'text-white/40' : 'text-black/40'
                }`}>
                  Responsable
                </span>
              </div>
              <div className={`text-sm font-medium leading-relaxed ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                {selectedBaja.dir_area}
              </div>
            </div>

            {/* Área - flex-[1.5] */}
            {selectedBaja.area_resguardo && (
              <div className={`rounded-lg border p-2.5 flex-[1.5] flex flex-col justify-center ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Building2 className={`h-3 w-3 ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`} />
                  <span className={`text-xs uppercase font-medium ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`}>
                    Área
                  </span>
                </div>
                <div className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {selectedBaja.area_resguardo}
                </div>
              </div>
            )}

            {/* Resguardantes - flex-[3] para más espacio con scroll interno */}
            <div className={`rounded-lg border p-2.5 flex-[3] flex flex-col overflow-hidden ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10'
                : 'bg-black/[0.02] border-black/10'
            }`}>
              <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
                <User className={`h-3 w-3 ${
                  isDarkMode ? 'text-white/40' : 'text-black/40'
                }`} />
                <span className={`text-xs uppercase font-medium ${
                  isDarkMode ? 'text-white/40' : 'text-black/40'
                }`}>
                  Resguardantes ({Array.from(new Set(selectedBaja.articulos.map(a => a.usufinal || 'Sin asignar'))).length})
                </span>
              </div>
              <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
                {Array.from(new Set(selectedBaja.articulos.map(a => a.usufinal || 'Sin asignar'))).map((resguardante, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded border text-sm flex-shrink-0 ${
                      isDarkMode
                        ? 'bg-white/5 border-white/10 text-white'
                        : 'bg-black/5 border-black/10 text-black'
                    }`}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                      isDarkMode ? 'bg-white' : 'bg-black'
                    }`} />
                    <span className="font-medium">{resguardante}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions - flex-[1] */}
            <div className="grid grid-cols-2 gap-2 flex-[1]">
              <button
                onClick={onGeneratePDF}
                disabled={isGeneratingPDF}
                className={`py-2 px-3 border rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm font-medium ${
                  isGeneratingPDF
                    ? isDarkMode
                      ? 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed'
                      : 'bg-black/5 text-black/40 border-black/10 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                      : 'bg-black/5 hover:bg-black/10 text-black border-black/10'
                }`}
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Preparando...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>{selectedItemsCount > 0 ? `PDF (${selectedItemsCount})` : 'PDF'}</span>
                  </>
                )}
              </button>
              <RoleGuard roles={["admin", "superadmin"]} userRole={userRole ?? undefined}>
                <button
                  onClick={onDeleteFolio}
                  disabled={isDeleting}
                  className={`py-2 px-3 border rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm font-medium ${
                    isDeleting
                      ? isDarkMode
                        ? 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed'
                        : 'bg-black/5 text-black/40 border-black/10 cursor-not-allowed'
                      : isDarkMode
                        ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                        : 'bg-black/5 hover:bg-black/10 text-black border-black/10'
                  }`}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Borrando...</span>
                    </>
                  ) : (
                    <>
                      <X className="h-3.5 w-3.5" />
                      <span>Borrar</span>
                    </>
                  )}
                </button>
              </RoleGuard>
            </div>
          </div>
        </>
      ) : (
        <div className={`flex-1 flex flex-col items-center justify-center p-8 ${
          isDarkMode ? 'text-white/40' : 'text-black/40'
        }`}>
          <FileText className="h-12 w-12 mb-3" />
          <p className="text-sm">Seleccione un resguardo</p>
          <p className="text-xs mt-1">Haga clic en un folio para ver los detalles</p>
        </div>
      )}
    </div>
  );
};
