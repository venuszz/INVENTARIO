/**
 * ResguardoDetailsPanel Component
 * 
 * Display resguardo header details with action buttons
 */

'use client';

import { FileText, FileDigit, Calendar, Building2, User, Download, XOctagon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import RoleGuard from '@/components/roleGuard';
import { forwardRef } from 'react';

interface ResguardoDetailsPanelProps {
  folio: string;
  fecha: string;
  director: string;
  area: string;
  articulosCount: number;
  resguardantes: string[];
  onGeneratePDF: () => void;
  onDeleteAll: () => void;
  children: React.ReactNode;
  userRole: string | null;
}

/**
 * ResguardoDetailsPanel - Display resguardo header details
 */
const ResguardoDetailsPanel = forwardRef<HTMLDivElement, ResguardoDetailsPanelProps>(
  ({
    folio,
    fecha,
    director,
    area,
    articulosCount,
    resguardantes,
    onGeneratePDF,
    onDeleteAll,
    children,
    userRole
  }, ref) => {
    const { isDarkMode } = useTheme();

    // Color palette for resguardantes badges
    const colorPaletteDark = [
      'from-pink-500/80 to-pink-400/80 border-pink-400 text-pink-100',
      'from-blue-500/80 to-blue-400/80 border-blue-400 text-blue-100',
      'from-green-500/80 to-green-400/80 border-green-400 text-green-100',
      'from-yellow-500/80 to-yellow-400/80 border-yellow-400 text-yellow-900',
      'from-purple-500/80 to-purple-400/80 border-purple-400 text-purple-100',
      'from-fuchsia-500/80 to-fuchsia-400/80 border-fuchsia-400 text-fuchsia-100',
      'from-cyan-500/80 to-cyan-400/80 border-cyan-400 text-cyan-900',
      'from-orange-500/80 to-orange-400/80 border-orange-400 text-orange-900',
      'from-rose-500/80 to-rose-400/80 border-rose-400 text-rose-100',
      'from-emerald-500/80 to-emerald-400/80 border-emerald-400 text-emerald-100',
    ];
    const colorPaletteLight = [
      'from-pink-400 to-pink-300 border-pink-500 text-pink-900',
      'from-blue-400 to-blue-300 border-blue-500 text-blue-900',
      'from-green-400 to-green-300 border-green-500 text-green-900',
      'from-yellow-400 to-yellow-300 border-yellow-500 text-yellow-900',
      'from-purple-400 to-purple-300 border-purple-500 text-purple-900',
      'from-fuchsia-400 to-fuchsia-300 border-fuchsia-500 text-fuchsia-900',
      'from-cyan-400 to-cyan-300 border-cyan-500 text-cyan-900',
      'from-orange-400 to-orange-300 border-orange-500 text-orange-900',
      'from-rose-400 to-rose-300 border-rose-500 text-rose-900',
      'from-emerald-400 to-emerald-300 border-emerald-500 text-emerald-900',
    ];

    return (
      <div ref={ref} className={`flex-1 p-4 border-t lg:border-t-0 lg:border-l flex flex-col lg:col-span-2 ${
        isDarkMode
          ? 'bg-white/[0.02] border-white/10'
          : 'bg-black/[0.02] border-black/10'
      }`}>
        <div className={`rounded-lg border p-4 mb-4 ${
          isDarkMode
            ? 'bg-white/[0.02] border-white/10'
            : 'bg-black/[0.02] border-black/10'
        }`}>
          <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            <FileText className="h-5 w-5" />
            Detalles del Resguardo
          </h2>

          <div className="space-y-4">
            <div>
              <label className={`block text-xs font-medium mb-2 ${
                isDarkMode ? 'text-white/60' : 'text-black/60'
              }`}>
                Folio
              </label>
              <div className={`text-lg font-medium flex items-center gap-2 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`}>
                <FileDigit className="h-5 w-5" />
                {folio}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-2 ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                  Fecha
                </label>
                <div className={`text-sm flex items-center gap-2 ${
                  isDarkMode ? 'text-white/80' : 'text-black/80'
                }`}>
                  <Calendar className="h-4 w-4" />
                  {fecha.slice(0, 10).split('-').reverse().join('/')}
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-2 ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                  Artículos
                </label>
                <div className={`text-sm ${
                  isDarkMode ? 'text-white/80' : 'text-black/80'
                }`}>
                  {articulosCount}
                </div>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-2 ${
                isDarkMode ? 'text-white/60' : 'text-black/60'
              }`}>
                Director de Área
              </label>
              <div className={`text-sm flex items-center gap-2 ${
                isDarkMode ? 'text-white/80' : 'text-black/80'
              }`}>
                <Building2 className="h-4 w-4" />
                {director}
              </div>
              <div className={`text-xs mt-1 ${
                isDarkMode ? 'text-white/60' : 'text-black/60'
              }`}>
                {area}
              </div>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-2 ${
                isDarkMode ? 'text-white/60' : 'text-black/60'
              }`}>
                Resguardantes
              </label>
              <div className="flex flex-wrap gap-2">
                {resguardantes.map((resguardante, idx) => {
                  const color = isDarkMode
                    ? colorPaletteDark[idx % colorPaletteDark.length]
                    : colorPaletteLight[idx % colorPaletteLight.length];
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${color} border shadow-md transition-all duration-200 hover:scale-105 tracking-tight`}
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
            className={`mt-6 w-full py-2.5 border rounded-lg transition-colors flex items-center justify-center gap-2 ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-600'
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
            }`}
          >
            <Download className="h-4 w-4" />
            Generar PDF
          </button>
          <RoleGuard roles={["admin", "superadmin"]} userRole={userRole || undefined}>
            <button
              onClick={onDeleteAll}
              className={`mt-2 w-full py-2.5 border rounded-lg transition-colors flex items-center justify-center gap-2 ${
                isDarkMode
                  ? 'bg-red-600 hover:bg-red-500 text-white border-red-600'
                  : 'bg-red-600 hover:bg-red-700 text-white border-red-600'
              }`}
            >
              <XOctagon className="h-4 w-4" />
              Borrar resguardo
            </button>
          </RoleGuard>
        </div>

        {children}
      </div>
    );
  }
);

ResguardoDetailsPanel.displayName = 'ResguardoDetailsPanel';

export default ResguardoDetailsPanel;
