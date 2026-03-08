/**
 * TransferFAB Component
 * 
 * Floating Action Button for confirming batch origen transfer.
 * Displays the count of selected items and triggers the confirmation modal.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';

/**
 * Component props interface
 */
interface TransferFABProps {
  selectedCount: number;
  onClick: () => void;
  isDarkMode: boolean;
  isLoading?: boolean;
}

/**
 * TransferFAB component
 * 
 * Renders a floating action button that:
 * - Appears when items are selected (selectedCount > 0)
 * - Shows as a circle with arrow icon
 * - Displays a floating badge with count when collapsed
 * - Expands to show text and count on hover
 * - Shows loading state when processing
 * - Positioned at bottom-right of viewport
 * 
 * @param props - Component props
 * @returns JSX element with floating action button
 */
export function TransferFAB({
  selectedCount,
  onClick,
  isDarkMode,
  isLoading = false,
}: TransferFABProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
          }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 25 
          }}
          className="fixed bottom-6 right-6 z-50"
          onMouseEnter={() => !isLoading && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Floating badge - only visible when not hovered and not loading */}
          <AnimatePresence>
            {!isHovered && !isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ opacity: 1, scale: 1, x: -8, y: -8 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={`
                  absolute -top-2 -right-2 z-10
                  min-w-[24px] h-6 px-2 rounded-full
                  flex items-center justify-center
                  text-xs font-medium shadow-lg
                  ${isDarkMode
                    ? 'bg-white text-black'
                    : 'bg-black text-white'
                  }
                `}
              >
                {selectedCount}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main button */}
          <motion.button
            onClick={onClick}
            disabled={isLoading}
            className={`
              relative flex items-center justify-center
              h-14 rounded-full shadow-lg
              transition-shadow duration-150
              ${isLoading ? 'cursor-wait' : 'cursor-pointer'}
              ${isDarkMode
                ? 'bg-white text-black hover:shadow-xl'
                : 'bg-black text-white hover:shadow-xl'
              }
              ${isLoading ? 'opacity-90' : ''}
            `}
            animate={{ 
              width: isHovered ? 'auto' : '56px',
              paddingLeft: isHovered ? '20px' : '0px',
              paddingRight: isHovered ? '20px' : '0px',
            }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            whileTap={!isLoading ? { scale: 0.95 } : {}}
            aria-label={`Confirmar transferencia de ${selectedCount} items`}
          >
            {/* Container for icon and text */}
            <div className="flex items-center">
              {/* Icon - always visible */}
              {isLoading ? (
                <Loader2 size={20} strokeWidth={2} className="flex-shrink-0 animate-spin" />
              ) : (
                <ArrowRight size={20} strokeWidth={2} className="flex-shrink-0" />
              )}

              {/* Text and count - visible on hover */}
              <motion.div
                className="flex items-center gap-2 whitespace-nowrap overflow-hidden"
                initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                animate={{ 
                  width: isHovered ? 'auto' : 0,
                  opacity: isHovered ? 1 : 0,
                  marginLeft: isHovered ? '8px' : 0,
                }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <span className="text-sm font-light">
                  {isLoading ? 'Procesando...' : 'Confirmar'}
                </span>
                {!isLoading && (
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-medium
                    ${isDarkMode
                      ? 'bg-black/20 text-black'
                      : 'bg-white/20 text-white'
                    }
                  `}>
                    {selectedCount}
                  </span>
                )}
              </motion.div>
            </div>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
