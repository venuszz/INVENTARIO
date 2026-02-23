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
        <div className="flex-1 flex flex-col items-center justify-center text-center" style={{ padding: 'clamp(1.5rem, 2vw, 2rem)' }}>
          <div className={`rounded-full flex items-center justify-center ${
            isDarkMode ? 'bg-white/5' : 'bg-black/5'
          }`} style={{ 
            width: 'clamp(2.5rem, 3vw, 3rem)', 
            height: 'clamp(2.5rem, 3vw, 3rem)',
            marginBottom: 'clamp(0.75rem, 1vw, 1rem)'
          }}>
            <AlertTriangle className={`${isDarkMode ? 'text-white/40' : 'text-black/40'}`} style={{ width: 'clamp(1.25rem, 1.5vw, 1.5rem)', height: 'clamp(1.25rem, 1.5vw, 1.5rem)' }} />
          </div>
          <h3 className={`font-light tracking-tight ${
            isDarkMode ? 'text-white/60' : 'text-black/60'
          }`} style={{ 
            fontSize: 'clamp(0.875rem, 1vw, 1rem)',
            marginBottom: 'clamp(1rem, 1.5vw, 1.5rem)'
          }}>
            Selecciona una inconsistencia
          </h3>
          
          {/* Resumen */}
          <div className="w-full max-w-xs" style={{ gap: 'clamp(0.375rem, 0.5vw, 0.5rem)', display: 'flex', flexDirection: 'column' }}>
            <div className={`flex items-center justify-between rounded-lg ${
              isDarkMode ? 'bg-white/5' : 'bg-black/5'
            }`} style={{ padding: 'clamp(0.375rem, 0.5vw, 0.5rem) clamp(0.75rem, 1vw, 1rem)' }}>
              <span className={`${isDarkMode ? 'text-white/60' : 'text-black/60'}`} style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>
                Áreas duplicadas
              </span>
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`} style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>
                {duplicateAreas}
              </span>
            </div>
            <div className={`flex items-center justify-between rounded-lg ${
              isDarkMode ? 'bg-white/5' : 'bg-black/5'
            }`} style={{ padding: 'clamp(0.375rem, 0.5vw, 0.5rem) clamp(0.75rem, 1vw, 1rem)' }}>
              <span className={`${isDarkMode ? 'text-white/60' : 'text-black/60'}`} style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>
                Directores sin bienes
              </span>
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`} style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>
                {emptyDirectors}
              </span>
            </div>
            <div className={`flex items-center justify-between rounded-lg ${
              isDarkMode ? 'bg-white/5' : 'bg-black/5'
            }`} style={{ padding: 'clamp(0.375rem, 0.5vw, 0.5rem) clamp(0.75rem, 1vw, 1rem)' }}>
              <span className={`${isDarkMode ? 'text-white/60' : 'text-black/60'}`} style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>
                Áreas sin bienes
              </span>
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`} style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>
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
      <div className="flex-1 overflow-y-auto flex flex-col" style={{ padding: 'clamp(1rem, 1.5vw, 1.5rem)' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={inconsistency.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col flex-1"
            style={{ gap: 'clamp(1rem, 1.5vw, 1.5rem)' }}
          >
            {/* Inline Header - Más grande */}
            <div className="flex items-center border-b" style={{ 
              gap: 'clamp(0.5rem, 0.75vw, 0.75rem)',
              paddingBottom: 'clamp(0.75rem, 1vw, 1rem)',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
            }}>
              <Icon className={`flex-shrink-0 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} style={{ width: 'clamp(1rem, 1.25vw, 1.25rem)', height: 'clamp(1rem, 1.25vw, 1.25rem)' }} />
              <div className="flex-1 min-w-0">
                <p className={`${isDarkMode ? 'text-white/40' : 'text-black/40'}`} style={{ fontSize: 'clamp(0.625rem, 0.75vw, 0.75rem)' }}>
                  {config.label}
                </p>
                <h3 className={`font-light tracking-tight truncate ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`} style={{ fontSize: 'clamp(1rem, 1.125vw, 1.125rem)' }}>
                  {inconsistency.areaName || inconsistency.directorName}
                </h3>
              </div>
              
              {/* Stats Toggle - Solo para duplicate_area */}
              {inconsistency.type === 'duplicate_area' && (
                <div className={`flex items-center rounded-lg border flex-shrink-0 ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-black/5 border-black/10'
                }`} style={{ 
                  gap: 'clamp(0.5rem, 0.75vw, 0.75rem)',
                  padding: 'clamp(0.25rem, 0.375vw, 0.375rem) clamp(0.5rem, 0.75vw, 0.75rem)'
                }}>
                  <div className="flex items-center" style={{ gap: 'clamp(0.25rem, 0.375vw, 0.375rem)' }}>
                    <Package className={`${isDarkMode ? 'text-white/60' : 'text-black/60'}`} style={{ width: 'clamp(0.75rem, 0.875vw, 0.875rem)', height: 'clamp(0.75rem, 0.875vw, 0.875rem)' }} />
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`} style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>
                      {totalBienes}
                    </span>
                  </div>
                  <div className={`${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} style={{ width: '1px', height: 'clamp(0.75rem, 1vw, 1rem)' }} />
                  <div className="flex items-center" style={{ gap: 'clamp(0.25rem, 0.375vw, 0.375rem)' }}>
                    <FileText className={`${isDarkMode ? 'text-white/60' : 'text-black/60'}`} style={{ width: 'clamp(0.75rem, 0.875vw, 0.875rem)', height: 'clamp(0.75rem, 0.875vw, 0.875rem)' }} />
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`} style={{ fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)' }}>
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
      <div className={`flex-shrink-0 border-t ${
        isDarkMode ? 'border-white/10' : 'border-black/10'
      }`} style={{ padding: 'clamp(0.75rem, 1vw, 1rem)' }}>
        <div className="flex items-center" style={{ gap: 'clamp(0.5rem, 0.75vw, 0.75rem)' }}>
          <button
            onClick={onSkip}
            disabled={isResolving}
            className={`flex-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDarkMode
                ? 'text-white/60 border border-white/10 hover:bg-white/5'
                : 'text-black/60 border border-black/10 hover:bg-black/5'
            }`}
            style={{ 
              padding: 'clamp(0.375rem, 0.5vw, 0.5rem) clamp(0.75rem, 1vw, 1rem)',
              fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)'
            }}
          >
            Omitir
          </button>
          <button
            onClick={onResolve}
            disabled={isResolving}
            className={`flex-1 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDarkMode
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            style={{ 
              padding: 'clamp(0.375rem, 0.5vw, 0.5rem) clamp(0.75rem, 1vw, 1rem)',
              fontSize: 'clamp(0.75rem, 0.875vw, 0.875rem)'
            }}
          >
            {isResolving ? 'Resolviendo...' : 'Resolver'}
          </button>
        </div>
      </div>
    </div>
  );
}
