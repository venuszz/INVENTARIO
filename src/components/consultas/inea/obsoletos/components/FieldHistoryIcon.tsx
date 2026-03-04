'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { History, User, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import type { CambioInventario } from '@/types/changeHistory';

interface FieldHistoryIconProps {
  fieldHistory: CambioInventario[];
  isDarkMode: boolean;
}

export default function FieldHistoryIcon({ fieldHistory, isDarkMode }: FieldHistoryIconProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ bottom: 0, right: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted (for SSR compatibility)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate popover position when it opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const margin = 8;

      // Position popover directly above the button
      // The BOTTOM of the popover should be 8px above the TOP of the button
      const bottomPosition = window.innerHeight - buttonRect.top + window.scrollY + margin;
      
      // Align right edge of popover with right edge of button
      const rightPosition = window.innerWidth - buttonRect.right + window.scrollX;

      setPopoverPosition({ 
        bottom: bottomPosition, 
        right: rightPosition 
      });
    }
  }, [isOpen]);

  // Handle mouse enter - show popover after a short delay
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 200);
  };

  // Handle mouse leave - hide popover after a short delay
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatValue = (value: string | null) => {
    if (value === null || value === '') return 'vacío';
    return value;
  };

  const getUserName = (cambio: CambioInventario) => {
    if (cambio.usuario) {
      const { first_name, last_name } = cambio.usuario;
      return `${first_name} ${last_name}`.trim();
    }
    return 'Usuario desconocido';
  };

  if (!fieldHistory || fieldHistory.length === 0) {
    return null;
  }

  const popoverContent = isOpen && mounted ? (
    <div
      ref={popoverRef}
      className={`fixed w-[320px] max-h-[350px] overflow-y-auto rounded-lg border shadow-xl z-[9999] ${
        isDarkMode
          ? 'bg-black border-white/10 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20'
          : 'bg-white border-black/10 scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20'
      }`}
      style={{
        bottom: `${popoverPosition.bottom}px`,
        right: `${popoverPosition.right}px`
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className={`px-3 py-2 border-b ${
        isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-black/10 bg-black/[0.02]'
      }`}>
        <div className="flex items-center gap-1.5">
          <History className={`h-3.5 w-3.5 ${
            isDarkMode ? 'text-white/60' : 'text-black/60'
          }`} />
          <h4 className={`text-xs font-medium tracking-tight ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Historial ({fieldHistory.length})
          </h4>
        </div>
      </div>

      {/* Content */}
      <div className="p-2 space-y-2">
        {fieldHistory.length === 0 ? (
          <div className={`text-xs text-center py-6 font-light ${
            isDarkMode ? 'text-white/40' : 'text-black/40'
          }`}>
            No hay historial disponible
          </div>
        ) : (
          fieldHistory.map((cambio, index) => (
            <motion.div
              key={cambio.id || index}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`rounded-lg border overflow-hidden ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]'
                  : 'bg-black/[0.02] border-black/10 hover:bg-black/[0.04]'
              } transition-colors`}
            >
              {/* Change Header */}
              <div className={`px-2 py-1.5 border-b ${
                isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-black/10 bg-black/[0.02]'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <User className={`h-3 w-3 flex-shrink-0 ${
                      isDarkMode ? 'text-white/40' : 'text-black/40'
                    }`} />
                    <span className={`text-[10px] font-medium truncate ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>
                      {getUserName(cambio)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Calendar className={`h-2.5 w-2.5 ${
                      isDarkMode ? 'text-white/40' : 'text-black/40'
                    }`} />
                    <span className={`text-[9px] font-light ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`}>
                      {formatDate(cambio.fecha_cambio)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Change Details */}
              <div className="px-2 py-2 space-y-1.5">
                {/* Previous Value */}
                <div className="space-y-0.5">
                  <div className={`text-[9px] font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-red-400/80' : 'text-red-600/80'
                  }`}>
                    Anterior
                  </div>
                  <div className={`text-[10px] font-light px-1.5 py-1 rounded border ${
                    isDarkMode
                      ? 'bg-red-500/5 border-red-500/20 text-white/80'
                      : 'bg-red-50 border-red-200 text-black/80'
                  }`}>
                    {formatValue(cambio.valor_anterior)}
                  </div>
                </div>
                
                {/* New Value */}
                <div className="space-y-0.5">
                  <div className={`text-[9px] font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-green-400/80' : 'text-green-600/80'
                  }`}>
                    Nuevo
                  </div>
                  <div className={`text-[10px] font-light px-1.5 py-1 rounded border ${
                    isDarkMode
                      ? 'bg-green-500/5 border-green-500/20 text-white/80'
                      : 'bg-green-50 border-green-200 text-black/80'
                  }`}>
                    {formatValue(cambio.valor_nuevo)}
                  </div>
                </div>

                {/* Change Reason */}
                {cambio.metadata?.contexto_adicional?.razon_cambio && (
                  <div className={`pt-1.5 border-t ${
                    isDarkMode ? 'border-white/10' : 'border-black/10'
                  }`}>
                    <div className={`text-[9px] font-medium uppercase tracking-wider mb-0.5 ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`}>
                      Motivo
                    </div>
                    <div className={`text-[10px] font-light italic px-1.5 py-1 rounded ${
                      isDarkMode
                        ? 'bg-white/[0.02] text-white/70'
                        : 'bg-black/[0.02] text-black/70'
                    }`}>
                      "{cambio.metadata.contexto_adicional.razon_cambio}"
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div 
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={buttonRef}
          className={`cursor-pointer transition-all ${
            isDarkMode
              ? 'text-white/40 hover:text-white/60'
              : 'text-black/40 hover:text-black/60'
          }`}
        >
          <History className="h-3.5 w-3.5" />
        </div>
      </div>
      
      {/* Render popover in portal */}
      {mounted && popoverContent && createPortal(popoverContent, document.body)}
    </>
  );
}
