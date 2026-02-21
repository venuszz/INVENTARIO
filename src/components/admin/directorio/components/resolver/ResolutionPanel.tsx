'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { AlertTriangle, UserX, FolderX, Package, FileText } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import type { InconsistencyWithStats } from '../../types/resolver';

interface ResolutionPanelProps {
  inconsistency: InconsistencyWithStats | null;
  children: ReactNode;
  onSkip: () => void;
  onResolve: () => void;
  isResolving: boolean;
  pendingCount: number;
  inconsistencies: InconsistencyWithStats[];
}

const typeConfig = {
  duplicate_area: {
    icon: AlertTriangle,
    label: 'Área Duplicada',
    color: 'text-yellow-600 dark:text-yellow-400',
  },
  empty_director: {
    icon: UserX,
    label: 'Director sin Bienes',
    color: 'text-blue-600 dark:text-blue-400',
  },
  empty_area: {
    icon: FolderX,
    label: 'Área sin Bienes',
    color: 'text-purple-600 dark:text-purple-400',
  },
};

export function ResolutionPanel({
  inconsistency,
  children,
  onSkip,
  onResolve,
  isResolving,
  pendingCount,
  inconsistencies,
}: ResolutionPanelProps) {
  const { isDarkMode } = useTheme();
  
  if (!inconsistency) {
    // Contar por tipo
    const duplicateAreas = inconsistencies.filter(i => i.type === 'duplicate_area').length;
    const emptyDirectors = inconsistencies.filter(i => i.type === 'empty_director').length;
    const emptyAreas = inconsistencies.filter(i => i.type === 'empty_area').length;
    
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            isDarkMode ? 'bg-white/5' : 'bg-black/5'
          }`}>
            <AlertTriangle className={`w-6 h-6 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
          </div>
          <h3 className={`text-base font-light tracking-tight mb-6 ${
            isDarkMode ? 'text-white/60' : 'text-black/60'
          }`}>
            Selecciona una inconsistencia
          </h3>
          
          {/* Resumen */}
          <div className="w-full max-w-xs space-y-2">
            <div className={`flex items-center justify-between px-4 py-2 rounded-lg ${
              isDarkMode ? 'bg-white/5' : 'bg-black/5'
            }`}>
              <span className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                Áreas duplicadas
              </span>
              <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {duplicateAreas}
              </span>
            </div>
            <div className={`flex items-center justify-between px-4 py-2 rounded-lg ${
              isDarkMode ? 'bg-white/5' : 'bg-black/5'
            }`}>
              <span className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                Directores sin bienes
              </span>
              <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {emptyDirectors}
              </span>
            </div>
            <div className={`flex items-center justify-between px-4 py-2 rounded-lg ${
              isDarkMode ? 'bg-white/5' : 'bg-black/5'
            }`}>
              <span className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                Áreas sin bienes
              </span>
              <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {emptyAreas}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const config = typeConfig[inconsistency.type];
  const Icon = config.icon;

  // Calculate total stats for duplicate_area type
  const totalBienes = inconsistency.type === 'duplicate_area' && inconsistency.directors
    ? inconsistency.directors.reduce((sum, dir) => sum + (dir.stats?.bienesCount || 0), 0)
    : 0;
  const totalResguardos = inconsistency.type === 'duplicate_area' && inconsistency.directors
    ? inconsistency.directors.reduce((sum, dir) => sum + (dir.stats?.resguardosCount || 0), 0)
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Content - Adapta su tamaño al espacio disponible */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={inconsistency.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col flex-1 space-y-6"
          >
            {/* Inline Header - Más grande */}
            <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
              <Icon className={`w-5 h-5 flex-shrink-0 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                  {config.label}
                </p>
                <h3 className={`text-lg font-light tracking-tight truncate ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {inconsistency.areaName || inconsistency.directorName}
                </h3>
              </div>
              
              {/* Stats Toggle - Solo para duplicate_area */}
              {inconsistency.type === 'duplicate_area' && (
                <div className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border flex-shrink-0 ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-black/5 border-black/10'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <Package className={`w-3.5 h-3.5 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`} />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {totalBienes}
                    </span>
                  </div>
                  <div className={`w-px h-4 ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />
                  <div className="flex items-center gap-1.5">
                    <FileText className={`w-3.5 h-3.5 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`} />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {totalResguardos}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Resolver Content - Ocupa el espacio restante */}
            <div className="flex-1 flex flex-col">
              {children}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className={`flex-shrink-0 p-4 border-t ${
        isDarkMode ? 'border-white/10' : 'border-black/10'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onSkip}
            disabled={isResolving}
            className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDarkMode
                ? 'text-white/60 border border-white/10 hover:bg-white/5'
                : 'text-black/60 border border-black/10 hover:bg-black/5'
            }`}
          >
            Omitir
          </button>
          <button
            onClick={onResolve}
            disabled={isResolving}
            className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDarkMode
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isResolving ? 'Resolviendo...' : 'Resolver'}
          </button>
        </div>
      </div>
    </div>
  );
}
