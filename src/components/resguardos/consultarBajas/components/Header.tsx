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
    <div className={`p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b gap-2 sm:gap-0 ${
      isDarkMode
        ? 'bg-gray-900/30 border-gray-800'
        : 'bg-gray-50/50 border-gray-200'
    }`}>
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
          <span className={`mr-2 sm:mr-3 p-1 sm:p-2 rounded-lg border text-sm sm:text-base shadow-lg ${
            isDarkMode
              ? 'bg-red-800 text-white border-red-700/50'
              : 'bg-red-600 text-white border-red-600'
          }`}>
            BAJ
          </span>
          <span className={isDarkMode ? 'text-red-500' : 'text-gray-900'}>
            Consulta de Resguardos Dados de Baja
          </span>
        </h1>
        <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border ${
          isDarkMode
            ? 'text-gray-400 bg-gray-900/50 border-gray-800/50'
            : 'text-gray-600 bg-gray-100 border-gray-300'
        }`}>
          <ListChecks className={`h-4 w-4 ${
            isDarkMode ? 'text-red-400' : 'text-red-600'
          }`} />
          <span>{totalCount} resguardos dados de baja</span>
        </div>
      </div>
      <SectionRealtimeToggle 
        sectionName="Resguardos Bajas" 
        isConnected={realtimeConnected} 
      />
    </div>
  );
};
