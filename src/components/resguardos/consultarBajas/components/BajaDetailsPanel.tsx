import { FileText, FileDigit, Calendar, Building2, User, Download, X, Info } from 'lucide-react';
import RoleGuard from '@/components/roleGuard';
import type { ResguardoBajaDetalle } from '../types';

interface BajaDetailsPanelProps {
  selectedBaja: ResguardoBajaDetalle | null;
  selectedItemsCount: number;
  onGeneratePDF: () => void;
  onDeleteFolio: () => void;
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
  userRole,
  isDarkMode
}) => {
  return (
    <div className={`rounded-xl border p-4 mb-4 shadow-inner ${
      isDarkMode
        ? 'bg-gray-900/30 border-gray-800'
        : 'bg-white border-gray-200'
    }`}>
      <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${
        isDarkMode ? 'text-gray-100' : 'text-gray-900'
      }`}>
        <FileText className={`h-5 w-5 ${
          isDarkMode ? 'text-red-400' : 'text-red-600'
        }`} />
        Detalles del Resguardo
      </h2>

      {selectedBaja ? (
        <>
          <div className="space-y-4">
            <div>
              <label className={`block text-xs uppercase tracking-wider mb-1 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>Folio Resguardo</label>
              <div className={`text-lg font-medium flex items-center gap-2 ${
                isDarkMode ? 'text-red-400' : 'text-red-600'
              }`}>
                <FileDigit className="h-5 w-5" />
                {selectedBaja.folio_resguardo}
              </div>
            </div>

            <div>
              <label className={`block text-xs uppercase tracking-wider mb-1 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>Fecha</label>
              <div className={`text-sm flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <Calendar className={`h-4 w-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                {selectedBaja.f_resguardo.slice(0, 10).split('-').reverse().join('/')}
              </div>
            </div>

            <div>
              <label className={`block text-xs uppercase tracking-wider mb-1 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>Director de Área</label>
              <div className={`text-sm flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <Building2 className={`h-4 w-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                {selectedBaja.dir_area}
              </div>
              <div className={`text-xs mt-1 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>
                {selectedBaja.area_resguardo}
              </div>
            </div>

            <div>
              <label className={`block text-xs uppercase tracking-wider mb-1 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>Puesto</label>
              <div className={`text-sm flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <User className={`h-4 w-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                {selectedBaja.puesto}
              </div>
            </div>

            <div>
              <label className={`block text-xs uppercase tracking-wider mb-1 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-600'
              }`}>Resguardantes</label>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(selectedBaja.articulos.map(a => a.usufinal || 'Sin asignar'))).map((resguardante, idx) => {
                  const colorPalette = isDarkMode ? [
                    'from-slate-800 to-slate-700 border-slate-600 text-slate-200',
                    'from-zinc-800 to-zinc-700 border-zinc-600 text-zinc-200',
                    'from-neutral-800 to-neutral-700 border-neutral-600 text-neutral-200',
                    'from-stone-800 to-stone-700 border-stone-600 text-stone-200',
                    'from-red-900 to-red-800 border-red-700 text-red-200',
                    'from-orange-900 to-orange-800 border-orange-700 text-orange-200',
                    'from-amber-900 to-amber-800 border-amber-700 text-amber-200',
                    'from-emerald-900 to-emerald-800 border-emerald-700 text-emerald-200',
                    'from-teal-900 to-teal-800 border-teal-700 text-teal-200',
                    'from-cyan-900 to-cyan-800 border-cyan-700 text-cyan-200',
                  ] : [
                    'from-slate-200 to-slate-300 border-slate-400 text-slate-800',
                    'from-zinc-200 to-zinc-300 border-zinc-400 text-zinc-800',
                    'from-neutral-200 to-neutral-300 border-neutral-400 text-neutral-800',
                    'from-stone-200 to-stone-300 border-stone-400 text-stone-800',
                    'from-red-200 to-red-300 border-red-400 text-red-800',
                    'from-orange-200 to-orange-300 border-orange-400 text-orange-800',
                    'from-amber-200 to-amber-300 border-amber-400 text-amber-800',
                    'from-emerald-200 to-emerald-300 border-emerald-400 text-emerald-800',
                    'from-teal-200 to-teal-300 border-teal-400 text-teal-800',
                    'from-cyan-200 to-cyan-300 border-cyan-400 text-cyan-800',
                  ];
                  const color = colorPalette[idx % colorPalette.length];
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${color} border shadow-md transition-all duration-200 hover:scale-105 tracking-wider`}
                    >
                      <User className="h-3.5 w-3.5 mr-1 opacity-80" />
                      {resguardante}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={onGeneratePDF}
            className={`mt-6 w-full py-2.5 border rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
              isDarkMode
                ? 'bg-red-900/20 border-red-800 text-red-400 hover:bg-red-800/30 hover:text-white hover:shadow-red-500/20'
                : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400 hover:text-red-800'
            }`}
          >
            <Download className="h-4 w-4" />
            Generar PDF de {selectedItemsCount > 0 ? 'Artículos Seleccionados' : 'Baja Completa'}
          </button>

          <RoleGuard roles={["admin", "superadmin"]} userRole={userRole ?? undefined}>
            <button
              onClick={onDeleteFolio}
              className={`w-full py-2 rounded-lg transition-all duration-300 border flex items-center justify-center gap-2 mt-2 shadow-lg ${
                isDarkMode
                  ? 'bg-gradient-to-r from-red-900/20 to-red-900/10 text-red-400 hover:from-red-900/30 hover:to-red-900/20 border-red-900/50 hover:text-white hover:shadow-red-500/20'
                  : 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 hover:from-red-200 hover:to-red-100 border-red-300 hover:text-red-800'
              }`}
            >
              <X className="h-4 w-4" />
              Eliminar Folio Completo
            </button>
          </RoleGuard>
        </>
      ) : (
        <div className={`flex flex-col items-center justify-center h-full min-h-[200px] ${
          isDarkMode ? 'text-gray-500' : 'text-gray-600'
        }`}>
          <Info className={`h-12 w-12 mb-2 animate-pulse ${
            isDarkMode ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <p className="text-sm">Seleccione una baja</p>
          <p className="text-xs mt-1">Haga clic en un folio para ver los detalles</p>
        </div>
      )}
    </div>
  );
};
