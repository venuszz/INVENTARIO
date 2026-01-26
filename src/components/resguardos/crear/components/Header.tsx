/**
 * Header component for Crear Resguardos page
 * Displays title, realtime toggle, and selected items counter
 */

import { ListChecks } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <div className={`flex justify-between items-center mb-8 pb-6 border-b ${
      isDarkMode ? 'border-white/10' : 'border-black/10'
    }`}>
      <div>
        <h1 className="text-3xl font-light tracking-tight mb-1">
          Crear Resguardo
        </h1>
        <div className="flex items-center gap-3">
          <p className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-black/60'}`}>
            Asigna artículos a un responsable
          </p>
          {selectedCount > 0 && (
            <>
              <span className={`text-sm ${isDarkMode ? 'text-white/20' : 'text-black/30'}`}>
                •
              </span>
              <motion.div 
                className="flex items-center gap-1.5"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <ListChecks 
                  size={14} 
                  className={isDarkMode ? 'text-green-400' : 'text-green-600'} 
                />
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {selectedCount} {selectedCount === 1 ? 'artículo' : 'artículos'}
                </span>
              </motion.div>
            </>
          )}
        </div>
      </div>
      <SectionRealtimeToggle 
        sectionName="Inventarios" 
        isConnected={ineaConnected || iteaConnected || noListadoConnected} 
      />
    </div>
  );
}
