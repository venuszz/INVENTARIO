'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

/**
 * TransferLayout Component
 * 
 * Layout component for the transfer mode with two panels.
 * 
 * Features:
 * - Grid layout 40/60 for desktop (1.4)
 * - Grid layout 50/50 for tablet (768-1024px) (13.1)
 * - Stack vertical for mobile (<768px) with navigation (13.1, 13.2)
 * - Animated vertical divider line
 * - Entrance/exit animations
 * - Responsive breakpoints
 * - Dark mode support with useTheme
 * - Uses page scroll (no overflow-hidden on main container)
 * 
 * Requirements: 1.4, 13.1, 13.2
 */

interface TransferLayoutProps {
  leftPanel: ReactNode;
  centerPanel?: ReactNode;
  rightPanel?: ReactNode;
}

type MobilePanel = 'source' | 'preview';

export function TransferLayout({ leftPanel, centerPanel, rightPanel }: TransferLayoutProps) {
  const { isDarkMode } = useTheme();
  const [mobileActivePanel, setMobileActivePanel] = useState<MobilePanel>('source');

  // Determine if we have 3 panels or 2 panels
  const hasThreePanels = !!centerPanel;
  const hasRightPanel = !!rightPanel;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Mobile Navigation Tabs (visible only on mobile) */}
      <div className={`
        md:hidden border-b
        ${isDarkMode ? 'border-white/10' : 'border-black/10'}
      `}>
        <div className="flex">
          <button
            onClick={() => setMobileActivePanel('source')}
            className={`
              flex-1 px-4 py-3 text-sm font-medium
              transition-colors relative
              ${mobileActivePanel === 'source'
                ? isDarkMode 
                  ? 'text-blue-400' 
                  : 'text-blue-600'
                : isDarkMode
                  ? 'text-white/60 hover:text-white'
                  : 'text-black/60 hover:text-black'
              }
            `}
            aria-label="Seleccionar origen"
            aria-current={mobileActivePanel === 'source' ? 'page' : undefined}
          >
            Seleccionar Origen
            {mobileActivePanel === 'source' && (
              <motion.div
                layoutId="mobile-tab-indicator"
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                }`}
              />
            )}
          </button>
          <button
            onClick={() => setMobileActivePanel('preview')}
            className={`
              flex-1 px-4 py-3 text-sm font-medium
              transition-colors relative
              ${mobileActivePanel === 'preview'
                ? isDarkMode 
                  ? 'text-blue-400' 
                  : 'text-blue-600'
                : isDarkMode
                  ? 'text-white/60 hover:text-white'
                  : 'text-black/60 hover:text-black'
              }
            `}
            aria-label="Vista previa"
            aria-current={mobileActivePanel === 'preview' ? 'page' : undefined}
          >
            Vista Previa
            {mobileActivePanel === 'preview' && (
              <motion.div
                layoutId="mobile-tab-indicator"
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
                }`}
              />
            )}
          </button>
        </div>
      </div>

      {/* Desktop/Tablet Grid Layout */}
      <motion.div
        layout
        className={`
          hidden md:grid
          gap-4
          relative
          transition-all duration-300
          mb-4
          ${hasThreePanels 
            ? 'grid-cols-[40%_60%]' 
            : hasRightPanel
              ? 'grid-cols-2'
              : 'grid-cols-1'
          }
        `}
      >
        {/* Left Panel - Source Selection (only when not showing right panel) */}
        {leftPanel && (
          <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={`
              rounded-xl border 
              ${hasThreePanels ? 'h-[calc(160vh-120px)] overflow-y-auto' : ''} 
              ${isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/10'}
            `}
          >
            {leftPanel}
          </motion.div>
        )}

        {/* Center Panel - Bienes Selection (always visible when present) */}
        <AnimatePresence mode="wait">
          {centerPanel && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95, x: leftPanel ? -20 : 0 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={`rounded-xl border h-[calc(160vh-120px)] overflow-y-auto ${isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/10'}`}
            >
              {centerPanel}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Panel - Preview (only when showing preview) */}
        <AnimatePresence mode="wait">
          {rightPanel && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className={`rounded-xl border h-[calc(160vh-120px)] overflow-y-auto ${isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/10'}`}
            >
              {rightPanel}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Mobile Stack Layout with Swipe Navigation */}
      <div className="md:hidden relative">
        <AnimatePresence mode="wait">
          {mobileActivePanel === 'source' ? (
            <motion.div
              key="source"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className={`rounded-xl border ${isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/10'}`}
            >
              {leftPanel}
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className={`rounded-xl border ${isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/10'}`}
            >
              {rightPanel}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Navigation Buttons (floating) */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          <button
            onClick={() => setMobileActivePanel('source')}
            disabled={mobileActivePanel === 'source'}
            className={`
              p-2 rounded-full
              ${isDarkMode 
                ? 'bg-black border-white/10' 
                : 'bg-white border-black/10'
              }
              border
              shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isDarkMode 
                ? 'hover:bg-white/5' 
                : 'hover:bg-black/5'
              }
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500/50
            `}
            aria-label="Panel anterior"
          >
            <ChevronLeft className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
          </button>
          <button
            onClick={() => setMobileActivePanel('preview')}
            disabled={mobileActivePanel === 'preview'}
            className={`
              p-2 rounded-full
              ${isDarkMode 
                ? 'bg-black border-white/10' 
                : 'bg-white border-black/10'
              }
              border
              shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isDarkMode 
                ? 'hover:bg-white/5' 
                : 'hover:bg-black/5'
              }
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500/50
            `}
            aria-label="Panel siguiente"
          >
            <ChevronRight className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
