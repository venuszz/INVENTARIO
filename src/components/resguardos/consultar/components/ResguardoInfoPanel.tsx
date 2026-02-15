/**
 * ResguardoInfoPanel Component
 * 
 * Display resguardo header information with action buttons
 */

'use client';

import { FileDigit, Calendar, Building2, User, Download, XOctagon, Package } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import RoleGuard from '@/components/roleGuard';

interface ResguardoInfoPanelProps {
  folio: string;
  fecha: string;
  director: string;
  area: string;
  articulosCount: number;
  resguardantes: string[];
  onGeneratePDF: () => void;
  onDeleteAll: () => void;
  userRole: string | null;
}

/**
 * ResguardoInfoPanel - Display resguardo header information
 */
export default function ResguardoInfoPanel({
  folio,
  fecha,
  director,
  area,
  articulosCount,
  resguardantes,
  onGeneratePDF,
  onDeleteAll,
  userRole
}: ResguardoInfoPanelProps) {
  const { isDarkMode } = useTheme();

  return (
    <div className={`rounded-lg border h-[70vh] flex flex-col ${
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

      {/* Content - Sin scroll, todos los elementos se adaptan proporcionalmente */}
      <div className="flex-1 px-4 py-3 flex flex-col gap-3 overflow-hidden">
        {/* Folio - Destacado - flex-[2] para más espacio */}
        <div className={`rounded-lg border p-3 flex-[2] flex flex-col justify-center ${
          isDarkMode
            ? 'bg-white/[0.02] border-white/10'
            : 'bg-black/[0.02] border-black/10'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <FileDigit className={`h-3.5 w-3.5 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`} />
            <span className={`text-xs uppercase font-medium ${
              isDarkMode ? 'text-white/40' : 'text-black/40'
            }`}>
              Folio
            </span>
          </div>
          <div className={`text-lg font-semibold ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            {folio}
          </div>
        </div>

        {/* Fecha y Artículos - flex-[1.5] */}
        <div className="grid grid-cols-2 gap-2 flex-[1.5]">
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
              {fecha.slice(0, 10).split('-').reverse().join('/')}
            </div>
          </div>

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
              {articulosCount}
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
              Director de Área
            </span>
          </div>
          <div className={`text-sm font-medium leading-relaxed ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            {director}
          </div>
        </div>

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
              Resguardantes ({resguardantes.length})
            </span>
          </div>
          <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
            {resguardantes.map((resguardante, idx) => (
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
            className={`py-2 px-3 border rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm font-medium ${
              isDarkMode
                ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                : 'bg-black/5 hover:bg-black/10 text-black border-black/10'
            }`}
          >
            <Download className="h-3.5 w-3.5" />
            <span>PDF</span>
          </button>
          <RoleGuard roles={["admin", "superadmin"]} userRole={userRole || undefined}>
            <button
              onClick={onDeleteAll}
              className={`py-2 px-3 border rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm font-medium ${
                isDarkMode
                  ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                  : 'bg-black/5 hover:bg-black/10 text-black border-black/10'
              }`}
            >
              <XOctagon className="h-3.5 w-3.5" />
              <span>Borrar</span>
            </button>
          </RoleGuard>
        </div>
      </div>
    </div>
  );
}
