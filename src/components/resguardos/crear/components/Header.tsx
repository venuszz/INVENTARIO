/**
 * Header component for Crear Resguardos page
 * Displays title, realtime toggle, and selected items counter
 */

import { ListChecks, Info } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import SectionRealtimeToggle from '@/components/SectionRealtimeToggle';

interface HeaderProps {
  selectedCount: number;
  ineaConnected: boolean;
  iteaConnected: boolean;
  noListadoConnected: boolean;
}

/**
 * Header component with title and status indicators
 */
export function Header({ selectedCount, ineaConnected, iteaConnected, noListadoConnected }: HeaderProps) {
  const { isDarkMode } = useTheme();

  return (
    <div className={`p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b gap-2 sm:gap-0 ${
      isDarkMode
        ? 'bg-black border-gray-800'
        : 'bg-gray-50/50 border-gray-200'
    }`}>
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
        <span className={`mr-2 sm:mr-3 p-1 sm:p-2 rounded-lg border text-sm sm:text-base shadow-lg ${
          isDarkMode
            ? 'bg-gray-800 text-white border-white'
            : 'bg-gray-900 text-white border-gray-900'
        }`}>
          RES
        </span>
        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
          Creación de Resguardos
        </span>
      </h1>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        <SectionRealtimeToggle 
          sectionName="Inventarios" 
          isConnected={ineaConnected || iteaConnected || noListadoConnected} 
        />
        <p className={`text-sm sm:text-base flex items-center gap-2 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <ListChecks className={`h-4 w-4 animate-pulse ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`} />
          <span className={`font-medium ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {selectedCount}
          </span> artículos seleccionados
        </p>
        <p className={`text-sm sm:text-base flex items-center gap-2 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <Info className={`h-4 w-4 animate-pulse ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`} />
          Seleccione artículos para el resguardo
        </p>
      </div>
    </div>
  );
}
