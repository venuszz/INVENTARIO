/**
 * Header component for Consultar Resguardos
 * Displays page title and total resguardos count
 */

import { ListChecks } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import SectionRealtimeToggle from '@/components/SectionRealtimeToggle';
import { useResguardosIndexation } from '@/hooks/indexation/useResguardosIndexation';

interface HeaderProps {
  totalResguardos: number;
}

/**
 * Header component
 * @param totalResguardos - Total number of resguardos
 */
export function Header({ totalResguardos }: HeaderProps) {
  const { isDarkMode } = useTheme();
  const { realtimeConnected } = useResguardosIndexation();

  return (
    <div className={`flex justify-between items-center mb-8 pb-6 border-b ${
      isDarkMode ? 'border-white/10' : 'border-black/10'
    }`}>
      <div>
        <h1 className="text-3xl font-light tracking-tight mb-1">
          Consulta de Resguardos
        </h1>
        <div className="flex items-center gap-3">
          <p className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-black/60'}`}>
            Visualiza y gestiona resguardos existentes
          </p>
          {totalResguardos > 0 && (
            <>
              <span className={`text-sm ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>
                •
              </span>
              <div className="flex items-center gap-1.5">
                <ListChecks 
                  size={14} 
                  className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} 
                />
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {totalResguardos} {totalResguardos === 1 ? 'resguardo' : 'resguardos'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
      
      <SectionRealtimeToggle
        moduleKey="resguardos"
        sectionName="Resguardos"
        isConnected={realtimeConnected}
      />
    </div>
  );
}
