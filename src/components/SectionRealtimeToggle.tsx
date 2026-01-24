// ============================================================================
// SECTION REALTIME TOGGLE COMPONENT
// ============================================================================
// Toggle minimalista que muestra el estado de conexión en tiempo real
// para una sección específica.

'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';

interface SectionRealtimeToggleProps {
  /** Nombre de la sección */
  sectionName: string;
  /** Estado de conexión */
  isConnected: boolean;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * Toggle de conexión en tiempo real para secciones individuales
 * 
 * Muestra un indicador simple con ícono de WiFi y estado (Online/Offline)
 * con colores verde para conectado y naranja para desconectado.
 * 
 * @example
 * ```tsx
 * <SectionRealtimeToggle 
 *   sectionName="INEA" 
 *   isConnected={true} 
 * />
 * ```
 */
export default function SectionRealtimeToggle({
  sectionName,
  isConnected,
  className = '',
}: SectionRealtimeToggleProps) {
  
  // Debug log
  useEffect(() => {
    console.log(`🔌 [${sectionName}] Realtime status:`, isConnected);
  }, [isConnected, sectionName]);
  
  return (
    <motion.div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
        isConnected
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
      } ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Ícono WiFi con animación */}
      <div className="relative">
        {isConnected ? (
          <>
            <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
            {/* Pulso sutil */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.4],
                opacity: [0.5, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </>
        ) : (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <WifiOff className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </motion.div>
        )}
      </div>
      
      {/* Texto de estado */}
      <div className="flex flex-col">
        <span className={`text-xs font-semibold leading-none ${
          isConnected
            ? 'text-green-700 dark:text-green-300'
            : 'text-orange-700 dark:text-orange-300'
        }`}>
          {isConnected ? 'Online' : 'Offline'}
        </span>
        <span className="text-[10px] text-gray-600 dark:text-gray-400 leading-none mt-0.5">
          {sectionName}
        </span>
      </div>
      
      {/* Punto indicador */}
      <div className="relative ml-1">
        {isConnected ? (
          <>
            <motion.div
              className="w-2 h-2 rounded-full bg-green-500 relative z-10"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-green-500"
              animate={{
                scale: [1, 2],
                opacity: [0.6, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </>
        ) : (
          <motion.div
            className="w-2 h-2 rounded-full bg-orange-500"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  );
}
