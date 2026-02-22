'use client';

import { useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

/**
 * CompletionScreen Component
 * 
 * Minimalist success screen shown after a successful transfer.
 * Displays transfer summary and auto-resets after 3 seconds.
 * 
 * Requirements: 10.3, 10.5
 */

interface CompletionScreenProps {
  bienesTransferred: number;
  ineaUpdated: number;
  iteaUpdated: number;
  noListadoUpdated: number;
  onReset: () => void;
}

function CompletionScreenComponent({
  bienesTransferred,
  ineaUpdated,
  iteaUpdated,
  noListadoUpdated,
  onReset,
}: CompletionScreenProps) {
  const { isDarkMode } = useTheme();

  // Use ref for stable timer
  const onResetRef = useRef(onReset);
  onResetRef.current = onReset;

  // Auto-reset after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onResetRef.current();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Build summary items
  const sources = [
    { label: 'INEA', count: ineaUpdated },
    { label: 'ITEA', count: iteaUpdated },
    { label: 'No Listado', count: noListadoUpdated },
  ].filter(s => s.count > 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center min-h-[60vh] px-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col items-center gap-6 max-w-sm w-full"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.15 }}
          className={`
            w-12 h-12 rounded-full flex items-center justify-center
            ${isDarkMode ? 'bg-white/10' : 'bg-black/5'}
          `}
        >
          <Check
            className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-black'}`}
            strokeWidth={2.5}
          />
        </motion.div>

        {/* Message */}
        <div className="text-center space-y-1">
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Transferencia completada
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
            {bienesTransferred} bien{bienesTransferred !== 1 ? 'es' : ''} transferido{bienesTransferred !== 1 ? 's' : ''}
            {sources.length > 0 && (
              <span>
                {' · '}
                {sources.map((s, i) => (
                  <span key={s.label}>
                    {i > 0 && ', '}
                    {s.count} {s.label}
                  </span>
                ))}
              </span>
            )}
          </p>
        </div>

        {/* Action */}
        <button
          onClick={onReset}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            transition-colors
            ${isDarkMode
              ? 'text-white/60 hover:text-white hover:bg-white/5'
              : 'text-black/60 hover:text-black hover:bg-black/5'
            }
          `}
        >
          Nueva transferencia
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Progress bar auto-reset indicator */}
        <div className={`w-32 h-0.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 3, ease: 'linear' }}
            className={`h-full rounded-full ${isDarkMode ? 'bg-white/20' : 'bg-black/15'}`}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

export const CompletionScreen = memo(CompletionScreenComponent);
