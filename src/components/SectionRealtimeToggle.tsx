// ============================================================================
// SECTION REALTIME TOGGLE COMPONENT
// ============================================================================
// Toggle ultra minimalista y moderno para mostrar estado de conexión

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface SectionRealtimeToggleProps {
  moduleKey?: string;
  sectionName?: string;
  isConnected: boolean;
  onReindexClick?: () => void;
  className?: string;
}

export default function SectionRealtimeToggle({
  moduleKey,
  sectionName,
  isConnected,
  onReindexClick,
  className = '',
}: SectionRealtimeToggleProps) {
  const [prevConnected, setPrevConnected] = useState(isConnected);
  const [showPulse, setShowPulse] = useState(false);
  
  const displayName = sectionName || moduleKey || 'Unknown';
  
  useEffect(() => {
  }, [isConnected, displayName]);
  
  useEffect(() => {
    if (prevConnected !== isConnected) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 800);
      setPrevConnected(isConnected);
      return () => clearTimeout(timer);
    }
  }, [isConnected, prevConnected]);
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
          isConnected
            ? 'bg-emerald-500/10 dark:bg-emerald-500/10 hover:bg-emerald-500/15 dark:hover:bg-emerald-500/15'
            : 'bg-amber-500/10 dark:bg-amber-500/10 hover:bg-amber-500/15 dark:hover:bg-amber-500/15'
        }`}
      >
        {/* Punto indicador con pulso */}
        <div className="relative flex items-center justify-center">
          <div
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              isConnected
                ? 'bg-emerald-500 dark:bg-emerald-400'
                : 'bg-amber-500 dark:bg-amber-400'
            }`}
          />
          {showPulse && (
            <motion.div
              className={`absolute inset-0 rounded-full ${
                isConnected
                  ? 'bg-emerald-500 dark:bg-emerald-400'
                  : 'bg-amber-500 dark:bg-amber-400'
              }`}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          )}
        </div>
        
        {/* Texto */}
        <span
          className={`text-xs font-medium transition-colors duration-300 ${
            isConnected
              ? 'text-emerald-700 dark:text-emerald-300'
              : 'text-amber-700 dark:text-amber-300'
          }`}
        >
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>
      
      {/* Botón de reindexar (solo cuando está desconectado y hay callback) */}
      {!isConnected && onReindexClick && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReindexClick}
          className="px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 transition-colors flex items-center gap-2"
          title="Reindexar datos"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
            Reindexar
          </span>
        </motion.button>
      )}
    </div>
  );
}
