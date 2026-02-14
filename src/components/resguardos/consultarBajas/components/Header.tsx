import { ListChecks } from 'lucide-react';
import SectionRealtimeToggle from '@/components/SectionRealtimeToggle';

interface HeaderProps {
  totalCount: number;
  realtimeConnected: boolean;
  isDarkMode: boolean;
}

/**
 * Header component for the Bajas consultation page
 * Displays title, badge, total count, and realtime toggle
 */
export const Header: React.FC<HeaderProps> = ({
  totalCount,
  realtimeConnected,
  isDarkMode
}) => {
  return (
    <div className={`flex justify-between items-center mb-8 pb-6 border-b ${
      isDarkMode ? 'border-white/10' : 'border-black/10'
    }`}>
      <div>
        <h1 className="text-3xl font-light tracking-tight mb-1">
          Consulta de Resguardos Dados de Baja
        </h1>
        <div className="flex items-center gap-3">
          <p className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-black/60'}`}>
            Visualiza resguardos dados de baja
          </p>
          {totalCount > 0 && (
            <>
              <span className={`text-sm ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>
                •
              </span>
              <div className="flex items-center gap-1.5">
                <ListChecks 
                  size={14} 
                  className={isDarkMode ? 'text-red-400' : 'text-red-600'} 
                />
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {totalCount} {totalCount === 1 ? 'resguardo' : 'resguardos'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
      <SectionRealtimeToggle 
        sectionName="Resguardos Bajas" 
        isConnected={realtimeConnected} 
      />
    </div>
  );
};
