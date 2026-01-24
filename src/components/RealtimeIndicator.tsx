// ============================================================================
// REALTIME INDICATOR COMPONENT
// ============================================================================
// Indicador minimalista de conexión en tiempo real con 3 variantes visuales.

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import type { RealtimeIndicatorProps } from '@/types/indexation';

/**
 * Componente indicador de conexión en tiempo real
 * 
 * Muestra el estado de conexión WebSocket con diferentes variantes visuales.
 * Incluye animaciones suaves y tooltip informativo cuando está desconectado.
 * 
 * @example
 * ```tsx
 * <RealtimeIndicator variant="default" isConnected={true} />
 * ```
 */
export default function RealtimeIndicator({
  variant = 'default',
  isConnected,
  onReindexClick,
}: RealtimeIndicatorProps) {
  
  // ==========================================================================
  // VARIANTE: MINIMAL (Solo punto)
  // ==========================================================================
  
  if (variant === 'minimal') {
    return (
      <div className="relative">
        {isConnected ? (
          <>
            {/* Punto verde con pulso */}
            <motion.div
              className="w-2 h-2 rounded-full bg-green-500 relative z-10"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Efecto de pulso radial */}
            <motion.div
              className="absolute inset-0 rounded-full bg-green-500"
              animate={{
                scale: [1, 2.5],
                opacity: [0.6, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </>
        ) : (
          /* Punto amarillo parpadeante */
          <motion.div
            className="w-2 h-2 rounded-full bg-yellow-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
    );
  }
  
  // ==========================================================================
  // VARIANTE: DEFAULT (Ícono + Label)
  // ==========================================================================
  
  if (variant === 'default') {
    return (
      <div className="flex items-center gap-1.5">
        <AnimatePresence mode="wait">
          {isConnected ? (
            <motion.div
              key="connected"
              className="relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Wifi className="w-3 h-3 text-green-500/60" />
              
              {/* Pulso radial sutil */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, transparent 60%)',
                }}
                animate={{
                  scale: [1, 1.5],
                  opacity: [0.3, 0],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="disconnected"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <motion.div
                animate={{ opacity: [0.6, 0.3, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <WifiOff className="w-3 h-3 text-yellow-500/60" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <span className={`text-[9px] font-semibold uppercase tracking-wider ${
          isConnected ? 'text-green-500/60' : 'text-yellow-500/60'
        }`}>
          {isConnected ? 'Online' : 'Offline'}
        </span>
      </div>
    );
  }
  
  // ==========================================================================
  // VARIANTE: DETAILED (Con barras de señal)
  // ==========================================================================
  
  return (
    <div className="flex items-center gap-2.5">
      {/* Punto indicador */}
      <div className="relative w-2 h-2">
        {isConnected ? (
          <>
            <motion.div
              className="w-2 h-2 rounded-full bg-green-500 relative z-10"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-green-500"
              animate={{
                scale: [1, 2.5],
                opacity: [0.6, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </>
        ) : (
          <motion.div
            className="w-2 h-2 rounded-full bg-yellow-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
      
      {/* Texto de estado */}
      <div className="flex flex-col">
        <span className={`text-xs font-semibold ${
          isConnected ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'
        }`}>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </span>
        <span className="text-[9px] text-black/40 dark:text-white/40 uppercase tracking-wider">
          Tiempo real
        </span>
      </div>
      
      {/* Barras de señal (solo cuando conectado) */}
      {isConnected && (
        <div className="flex items-end gap-0.5 ml-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-0.5 bg-green-500 rounded-full"
              animate={{ height: ['4px', '8px', '4px'] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      )}
      
      {/* Botón de reindexar cuando desconectado */}
      {!isConnected && onReindexClick && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onReindexClick}
          className="p-1 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors"
          title="Reindexar datos"
        >
          <RefreshCw className="w-3 h-3 text-yellow-500" />
        </motion.button>
      )}
    </div>
  );
}
