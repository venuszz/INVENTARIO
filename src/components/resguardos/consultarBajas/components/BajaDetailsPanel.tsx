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
      <div className={`px-[1vw] py-[0.75vw] border-b flex-shrink-0 ${
        isDarkMode ? 'border-white/10' : 'border-black/10'
      }`}>
        <h2 className={`font-medium ${
          isDarkMode ? 'text-white/60' : 'text-black/60'
        }`} style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>
          Información del Resguardo
        </h2>
      </div>

      {selectedBaja ? (
        <>
          {/* Content - Sin scroll, todos los elementos se adaptan proporcionalmente */}
          <div className="flex-1 px-[1vw] py-[0.75vw] flex flex-col gap-[0.75vw] overflow-hidden">
            {/* Folio Resguardo y Folio(s) Baja - En una sola fila - flex-[2] */}
            <div className="grid grid-cols-2 gap-[0.5vw] flex-[2]">
              {/* Folio Resguardo */}
              <div className={`rounded-lg border p-[0.625vw] flex flex-col justify-center ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <div className="flex items-center gap-[0.375vw] mb-[0.25vw]">
                  <FileDigit className={`flex-shrink-0 ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`} style={{ width: 'clamp(12px, 0.75vw, 14px)', height: 'clamp(12px, 0.75vw, 14px)', minWidth: '12px', minHeight: '12px' }} />
                  <span className={`uppercase font-medium ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`} style={{ fontSize: 'clamp(0.625rem, 0.75vw, 0.75rem)' }}>
                    Folio Resguardo
                  </span>
                </div>
                <div className={`font-semibold ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`} style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>
                  {selectedBaja.folio_resguardo}
                </div>
              </div>

              {/* Folio(s) Baja */}
              <div className={`rounded-lg border p-[0.625vw] flex flex-col justify-center ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <div className="flex items-center gap-[0.375vw] mb-[0.25vw]">
                  <FileText className={`flex-shrink-0 ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`} style={{ width: 'clamp(12px, 0.75vw, 14px)', height: 'clamp(12px, 0.75vw, 14px)', minWidth: '12px', minHeight: '12px' }} />
                  <span className={`uppercase font-medium ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`} style={{ fontSize: 'clamp(0.625rem, 0.75vw, 0.75rem)' }}>
                    {Array.from(new Set(selectedBaja.articulos.map(a => a.folio_baja))).length > 1 ? 'Folios Baja' : 'Folio Baja'}
                  </span>
                </div>
                <div className={`font-semibold ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`} style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>
                  {Array.from(new Set(selectedBaja.articulos.map(a => a.folio_baja))).join(', ')}
                </div>
              </div>
            </div>

            {/* Fecha y Artículos - En una sola fila - flex-[2] */}
            <div className="grid grid-cols-2 gap-[0.5vw] flex-[2]">

              {/* Fecha */}
              <div className={`rounded-lg border p-[0.625vw] flex flex-col justify-center ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <div className="flex items-center gap-[0.375vw] mb-[0.25vw]">
                  <Calendar className={`flex-shrink-0 ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`} style={{ width: 'clamp(12px, 0.75vw, 14px)', height: 'clamp(12px, 0.75vw, 14px)', minWidth: '12px', minHeight: '12px' }} />
                  <span className={`uppercase font-medium ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`} style={{ fontSize: 'clamp(0.625rem, 0.75vw, 0.75rem)' }}>
                    Fecha
                  </span>
                </div>
                <div className={`font-medium ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`} style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>
                  {selectedBaja.f_resguardo.slice(0, 10).split('-').reverse().join('/')}
                </div>
              </div>

              {/* Artículos */}
              <div className={`rounded-lg border p-[0.625vw] flex flex-col justify-center ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <div className="flex items-center gap-[0.375vw] mb-[0.25vw]">
                  <Package className={`flex-shrink-0 ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`} style={{ width: 'clamp(12px, 0.75vw, 14px)', height: 'clamp(12px, 0.75vw, 14px)', minWidth: '12px', minHeight: '12px' }} />
                  <span className={`uppercase font-medium ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`} style={{ fontSize: 'clamp(0.625rem, 0.75vw, 0.75rem)' }}>
                    Artículos
                  </span>
                </div>
                <div className={`font-medium ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`} style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>
                  {selectedBaja.articulos.length}
                </div>
              </div>
            </div>

            {/* Director - flex-[2] */}
            <div className={`rounded-lg border p-[0.625vw] flex-[2] flex flex-col justify-center ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10'
                : 'bg-black/[0.02] border-black/10'
            }`}>
              <div className="flex items-center gap-[0.375vw] mb-[0.375vw]">
                <Building2 className={`flex-shrink-0 ${
                  isDarkMode ? 'text-white/40' : 'text-black/40'
                }`} style={{ width: 'clamp(12px, 0.75vw, 14px)', height: 'clamp(12px, 0.75vw, 14px)', minWidth: '12px', minHeight: '12px' }} />
                <span className={`uppercase font-medium ${
                  isDarkMode ? 'text-white/40' : 'text-black/40'
                }`} style={{ fontSize: 'clamp(0.625rem, 0.75vw, 0.75rem)' }}>
                  Responsable
                </span>
              </div>
              <div className={`font-medium leading-relaxed ${
                isDarkMode ? 'text-white' : 'text-black'
              }`} style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>
                {selectedBaja.dir_area}
              </div>
            </div>

            {/* Área - flex-[1.5] */}
            {selectedBaja.area_resguardo && (
              <div className={`rounded-lg border p-[0.625vw] flex-[1.5] flex flex-col justify-center ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <div className="flex items-center gap-[0.375vw] mb-[0.25vw]">
                  <Building2 className={`flex-shrink-0 ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`} style={{ width: 'clamp(12px, 0.75vw, 14px)', height: 'clamp(12px, 0.75vw, 14px)', minWidth: '12px', minHeight: '12px' }} />
                  <span className={`uppercase font-medium ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`} style={{ fontSize: 'clamp(0.625rem, 0.75vw, 0.75rem)' }}>
                    Área
                  </span>
                </div>
                <div className={`font-medium ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`} style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>
                  {selectedBaja.area_resguardo}
                </div>
              </div>
            )}

            {/* Resguardantes - flex-[3] para más espacio con scroll interno */}
            <div className={`rounded-lg border p-[0.625vw] flex-[3] flex flex-col overflow-hidden ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10'
                : 'bg-black/[0.02] border-black/10'
            }`}>
              <div className="flex items-center gap-[0.375vw] mb-[0.5vw] flex-shrink-0">
                <User className={`flex-shrink-0 ${
                  isDarkMode ? 'text-white/40' : 'text-black/40'
                }`} style={{ width: 'clamp(12px, 0.75vw, 14px)', height: 'clamp(12px, 0.75vw, 14px)', minWidth: '12px', minHeight: '12px' }} />
                <span className={`uppercase font-medium ${
                  isDarkMode ? 'text-white/40' : 'text-black/40'
                }`} style={{ fontSize: 'clamp(0.625rem, 0.75vw, 0.75rem)' }}>
                  Resguardantes ({Array.from(new Set(selectedBaja.articulos.map(a => a.usufinal || 'Sin asignar'))).length})
                </span>
              </div>
              <div className="flex flex-col gap-[0.375vw] overflow-y-auto flex-1">
                {Array.from(new Set(selectedBaja.articulos.map(a => a.usufinal || 'Sin asignar'))).map((resguardante, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-[0.5vw] px-[0.625vw] py-[0.375vw] rounded border flex-shrink-0 ${
                      isDarkMode
                        ? 'bg-white/5 border-white/10 text-white'
                        : 'bg-black/5 border-black/10 text-black'
                    }`}
                  >
                    <div className={`rounded-full flex-shrink-0 ${
                      isDarkMode ? 'bg-white' : 'bg-black'
                    }`} style={{ width: 'clamp(4px, 0.375vw, 6px)', height: 'clamp(4px, 0.375vw, 6px)' }} />
                    <span className="font-medium" style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>{resguardante}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions - flex-[1] */}
            <div className="grid grid-cols-2 gap-[0.5vw] flex-[1]">
              <button
                onClick={onGeneratePDF}
                disabled={isGeneratingPDF}
                className={`py-[0.5vw] px-[0.75vw] border rounded-lg transition-colors flex items-center justify-center gap-[0.375vw] font-medium ${
                  isGeneratingPDF
                    ? isDarkMode
                      ? 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed'
                      : 'bg-black/5 text-black/40 border-black/10 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                      : 'bg-black/5 hover:bg-black/10 text-black border-black/10'
                }`}
                style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="animate-spin flex-shrink-0" style={{ width: 'clamp(12px, 0.875vw, 14px)', height: 'clamp(12px, 0.875vw, 14px)', minWidth: '12px', minHeight: '12px' }} />
                    <span>Preparando...</span>
                  </>
                ) : (
                  <>
                    <Download className="flex-shrink-0" style={{ width: 'clamp(12px, 0.875vw, 14px)', height: 'clamp(12px, 0.875vw, 14px)', minWidth: '12px', minHeight: '12px' }} />
                    <span>{selectedItemsCount > 0 ? `PDF (${selectedItemsCount})` : 'PDF'}</span>
                  </>
                )}
              </button>
              <RoleGuard roles={["admin", "superadmin"]} userRole={userRole ?? undefined}>
                <button
                  onClick={onDeleteFolio}
                  disabled={isDeleting}
                  className={`py-[0.5vw] px-[0.75vw] border rounded-lg transition-colors flex items-center justify-center gap-[0.375vw] font-medium ${
                    isDeleting
                      ? isDarkMode
                        ? 'bg-white/5 text-white/40 border-white/10 cursor-not-allowed'
                        : 'bg-black/5 text-black/40 border-black/10 cursor-not-allowed'
                      : isDarkMode
                        ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                        : 'bg-black/5 hover:bg-black/10 text-black border-black/10'
                  }`}
                  style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="animate-spin flex-shrink-0" style={{ width: 'clamp(12px, 0.875vw, 14px)', height: 'clamp(12px, 0.875vw, 14px)', minWidth: '12px', minHeight: '12px' }} />
                      <span>Borrando...</span>
                    </>
                  ) : (
                    <>
                      <X className="flex-shrink-0" style={{ width: 'clamp(12px, 0.875vw, 14px)', height: 'clamp(12px, 0.875vw, 14px)', minWidth: '12px', minHeight: '12px' }} />
                      <span>Borrar</span>
                    </>
                  )}
                </button>
              </RoleGuard>
            </div>
          </div>
        </>
      ) : (
        <div className={`flex-1 flex flex-col items-center justify-center p-[2vw] ${
          isDarkMode ? 'text-white/40' : 'text-black/40'
        }`}>
          <FileText className="mb-[0.75vw] flex-shrink-0" style={{ width: 'clamp(36px, 3vw, 48px)', height: 'clamp(36px, 3vw, 48px)', minWidth: '36px', minHeight: '36px' }} />
          <p style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>Seleccione un resguardo</p>
          <p className="mt-[0.25vw]" style={{ fontSize: 'clamp(0.625rem, 0.75vw, 0.75rem)' }}>Haga clic en un folio para ver los detalles</p>
        </div>
      )}
    </div>
  );
};
