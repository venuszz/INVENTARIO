import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface SyncStatusBannerProps {
  isSyncing: boolean;
  syncingCount: number;
  syncingSources: string[];
  isDarkMode: boolean;
}

export default function SyncStatusBanner({ 
  isSyncing, 
  syncingCount, 
  syncingSources,
  isDarkMode 
}: SyncStatusBannerProps) {
  return (
    <AnimatePresence>
      {isSyncing && (
        <motion.div
          initial={{ opacity: 0, x: -20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.9 }}
          transition={{ 
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
          className="fixed top-[5.5rem] left-6 z-50"
        >
          <div className={`
            flex items-center gap-3 px-4 py-3 rounded-xl
            backdrop-blur-xl shadow-2xl border
            ${isDarkMode
              ? 'bg-black/80 border-white/10 text-white shadow-black/50'
              : 'bg-white/80 border-black/10 text-black shadow-black/20'
            }
          `}>
            {/* Spinner Icon */}
            <div className="relative">
              <RefreshCw 
                className={`h-5 w-5 animate-spin ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}
              />
              {/* Pulse effect */}
              <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
                isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
              }`} />
            </div>
            
            {/* Text Content */}
            <div className="flex flex-col">
              <span className="text-sm font-medium tracking-tight">
                Sincronizando
              </span>
              <span className={`text-xs font-light ${
                isDarkMode ? 'text-white/60' : 'text-black/60'
              }`}>
                {syncingCount} {syncingCount === 1 ? 'registro' : 'registros'}
                {syncingSources.length > 0 && (
                  <span className="ml-1">
                    ({syncingSources.join(', ')})
                  </span>
                )}
              </span>
            </div>

            {/* Progress indicator dots */}
            <div className="flex gap-1 ml-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                  }`}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
