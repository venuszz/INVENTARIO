// ============================================================================
// REALTIME INDICATOR COMPONENT
// ============================================================================
// Indicador avanzado de conexión en tiempo real con información detallada
// sobre el estado de todos los módulos, reconexión, y estadísticas.

'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Database,
  Signal,
  XCircle
} from 'lucide-react';
import { useIndexationStore } from '@/stores/indexationStore';
import { ALL_MODULE_CONFIGS } from '@/config/modules';
import type { RealtimeIndicatorProps } from '@/types/indexation';

/**
 * Componente indicador de conexión en tiempo real
 * 
 * Muestra el estado de conexión WebSocket con diferentes variantes visuales.
 * Incluye estadísticas detalladas, estado de reconexión, y métricas por módulo.
 * 
 * @example
 * ```tsx
 * <RealtimeIndicator variant="detailed" isConnected={true} />
 * ```
 */
export default function RealtimeIndicator({
  variant = 'default',
  isConnected,
  onReindexClick,
}: RealtimeIndicatorProps) {
  
  const [showTooltip, setShowTooltip] = useState(false);
  const modules = useIndexationStore((state) => state.modules);
  
  // ==========================================================================
  // CÁLCULO DE ESTADÍSTICAS
  // ==========================================================================
  
  const stats = useMemo(() => {
    const moduleKeys = Object.keys(modules);
    const totalModules = ALL_MODULE_CONFIGS.length;
    
    const connectedModules = moduleKeys.filter(
      key => modules[key]?.realtimeConnected
    ).length;
    
    const reconnectingModules = moduleKeys.filter(
      key => modules[key]?.reconnectionStatus === 'reconnecting'
    ).length;
    
    const failedModules = moduleKeys.filter(
      key => modules[key]?.reconnectionStatus === 'failed'
    ).length;
    
    const indexedModules = moduleKeys.filter(
      key => modules[key]?.isIndexed
    ).length;
    
    // Calcular tiempo desde última actividad
    const lastEventTimes = moduleKeys
      .map(key => modules[key]?.lastEventReceivedAt)
      .filter(Boolean)
      .map(time => new Date(time!).getTime());
    
    const lastActivity = lastEventTimes.length > 0
      ? Math.max(...lastEventTimes)
      : null;
    
    const timeSinceLastActivity = lastActivity
      ? Date.now() - lastActivity
      : null;
    
    // Total de intentos de reconexión
    const totalReconnectionAttempts = moduleKeys.reduce(
      (sum, key) => sum + (modules[key]?.reconnectionAttempts || 0),
      0
    );
    
    return {
      totalModules,
      connectedModules,
      reconnectingModules,
      failedModules,
      indexedModules,
      lastActivity,
      timeSinceLastActivity,
      totalReconnectionAttempts,
      connectionHealth: connectedModules / totalModules,
    };
  }, [modules]);
  
  // ==========================================================================
  // FORMATO DE TIEMPO
  // ==========================================================================
  
  const formatTimeSince = (ms: number | null) => {
    if (!ms) return 'Nunca';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };
  
  // ==========================================================================
  // VARIANTE: MINIMAL (Solo punto con tooltip)
  // ==========================================================================
  
  if (variant === 'minimal') {
    return (
      <div 
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
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
        
        {/* Tooltip con estadísticas */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 min-w-[200px]">
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {stats.connectedModules}/{stats.totalModules} módulos conectados
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    Última actividad: {formatTimeSince(stats.timeSinceLastActivity)}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  
  // ==========================================================================
  // VARIANTE: DEFAULT (Ícono + Label + Stats)
  // ==========================================================================
  
  if (variant === 'default') {
    return (
      <div 
        className="relative flex items-center gap-2"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="relative">
          <AnimatePresence mode="wait">
            {isConnected ? (
              <motion.div
                key="connected"
                className="relative"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Wifi className="w-4 h-4 text-green-500" />
                
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
                  <WifiOff className="w-4 h-4 text-yellow-500" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex flex-col">
          <span className={`text-xs font-semibold ${
            isConnected ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
          }`}>
            {isConnected ? 'Online' : 'Offline'}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            {stats.connectedModules}/{stats.totalModules} módulos
          </span>
        </div>
        
        {/* Indicador de salud */}
        <div className="flex items-center gap-1">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${
                stats.connectionHealth > 0.8 ? 'bg-green-500' :
                stats.connectionHealth > 0.5 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${stats.connectionHealth * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        
        {/* Tooltip detallado */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute top-full left-0 mt-2 z-50"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[280px]">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Estado de Conexión
                    </span>
                    <Signal className={`w-4 h-4 ${
                      isConnected ? 'text-green-500' : 'text-yellow-500'
                    }`} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Conectados</div>
                      <div className="font-semibold text-green-600 dark:text-green-400">
                        {stats.connectedModules}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Indexados</div>
                      <div className="font-semibold text-blue-600 dark:text-blue-400">
                        {stats.indexedModules}
                      </div>
                    </div>
                    {stats.reconnectingModules > 0 && (
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Reconectando</div>
                        <div className="font-semibold text-yellow-600 dark:text-yellow-400">
                          {stats.reconnectingModules}
                        </div>
                      </div>
                    )}
                    {stats.failedModules > 0 && (
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Fallidos</div>
                        <div className="font-semibold text-red-600 dark:text-red-400">
                          {stats.failedModules}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Última actividad: {formatTimeSince(stats.timeSinceLastActivity)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  
  // ==========================================================================
  // VARIANTE: DETAILED (Panel completo con todas las métricas)
  // ==========================================================================
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            {isConnected ? (
              <>
                <motion.div
                  className="w-3 h-3 rounded-full bg-green-500 relative z-10"
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
                className="w-3 h-3 rounded-full bg-yellow-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Conexión en Tiempo Real
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isConnected ? 'Sistema operativo' : 'Sistema desconectado'}
            </p>
          </div>
        </div>
        
        {!isConnected && onReindexClick && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReindexClick}
            className="px-3 py-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
              Reindexar
            </span>
          </motion.button>
        )}
      </div>
      
      {/* Métricas principales */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricCard
          icon={Database}
          label="Módulos"
          value={`${stats.connectedModules}/${stats.totalModules}`}
          color="blue"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Indexados"
          value={stats.indexedModules}
          color="green"
        />
        <MetricCard
          icon={Activity}
          label="Salud"
          value={`${Math.round(stats.connectionHealth * 100)}%`}
          color={stats.connectionHealth > 0.8 ? 'green' : stats.connectionHealth > 0.5 ? 'yellow' : 'red'}
        />
        <MetricCard
          icon={Clock}
          label="Última Act."
          value={formatTimeSince(stats.timeSinceLastActivity)}
          color="gray"
          small
        />
      </div>
      
      {/* Alertas y advertencias */}
      {(stats.reconnectingModules > 0 || stats.failedModules > 0) && (
        <div className="space-y-2 mb-4">
          {stats.reconnectingModules > 0 && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <span className="text-xs text-yellow-700 dark:text-yellow-300">
                {stats.reconnectingModules} módulo(s) intentando reconectar
              </span>
            </div>
          )}
          
          {stats.failedModules > 0 && (
            <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-xs text-red-700 dark:text-red-300">
                {stats.failedModules} módulo(s) fallaron al reconectar
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Estado por módulo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Estado por Módulo
          </span>
          {stats.totalReconnectionAttempts > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {stats.totalReconnectionAttempts} intentos de reconexión
            </span>
          )}
        </div>
        
        <div className="space-y-1.5">
          {ALL_MODULE_CONFIGS.map((module) => {
            const moduleState = modules[module.key];
            const Icon = module.icon;
            
            return (
              <div
                key={module.key}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {module.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {moduleState?.isIndexed && (
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  )}
                  
                  {moduleState?.reconnectionStatus === 'reconnecting' && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <RefreshCw className="w-3 h-3 text-yellow-500" />
                    </motion.div>
                  )}
                  
                  {moduleState?.reconnectionStatus === 'failed' && (
                    <XCircle className="w-3 h-3 text-red-500" />
                  )}
                  
                  <div className={`w-2 h-2 rounded-full ${
                    moduleState?.realtimeConnected ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Footer con timestamp */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            <span>Actualización en tiempo real</span>
          </div>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE AUXILIAR: METRIC CARD
// ============================================================================

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  small?: boolean;
}

function MetricCard({ icon: Icon, label, value, color, small }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    gray: 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400',
  };
  
  return (
    <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">
          {label}
        </span>
      </div>
      <div className={`font-bold ${small ? 'text-xs' : 'text-sm'}`}>
        {value}
      </div>
    </div>
  );
}
