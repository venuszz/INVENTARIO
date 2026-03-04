'use client';

import React, { useState, useRef, useEffect } from 'react';
import { History, X } from 'lucide-react';
import type { CambioInventario } from '@/types/changeHistory';

interface FieldHistoryIconProps {
  fieldHistory: CambioInventario[];
  isDarkMode: boolean;
}

export default function FieldHistoryIcon({ fieldHistory, isDarkMode }: FieldHistoryIconProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!fieldHistory || fieldHistory.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`p-1 rounded transition-all ${
          isDarkMode
            ? 'hover:bg-white/10 text-white/60 hover:text-white'
            : 'hover:bg-black/10 text-black/60 hover:text-black'
        }`}
        title={`Ver historial de cambios (${fieldHistory.length})`}
      >
        <History className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className={`absolute bottom-full mb-2 right-0 w-80 max-h-[350px] overflow-y-auto rounded-lg border shadow-xl z-50 ${
            isDarkMode
              ? 'bg-black border-white/20'
              : 'bg-white border-black/20'
          }`}
          style={{
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {/* Header */}
          <div
            className={`sticky top-0 px-3 py-2 border-b flex items-center justify-between ${
              isDarkMode
                ? 'bg-black border-white/10'
                : 'bg-white border-black/10'
            }`}
          >
            <div className="flex items-center gap-2">
              <History className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">
                Historial de Cambios
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className={`p-0.5 rounded transition-all ${
                isDarkMode
                  ? 'hover:bg-white/10'
                  : 'hover:bg-black/10'
              }`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* Content */}
          <div className="p-2 space-y-2">
            {fieldHistory.map((cambio, index) => (
              <div
                key={cambio.id}
                className={`p-2 rounded-lg border text-xs ${
                  isDarkMode
                    ? 'bg-white/[0.02] border-white/10'
                    : 'bg-black/[0.02] border-black/10'
                }`}
              >
                {/* Date and User */}
                <div className={`flex items-center justify-between mb-1.5 ${
                  isDarkMode ? 'text-white/50' : 'text-black/50'
                }`}>
                  <span className="text-[10px]">
                    {new Date(cambio.fecha_cambio).toLocaleString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {cambio.usuario && (
                    <span className="text-[10px] font-medium">
                      {cambio.usuario.first_name} {cambio.usuario.last_name}
                    </span>
                  )}
                </div>

                {/* Change Details */}
                <div className="space-y-1">
                  <div>
                    <span className={`text-[10px] font-medium ${
                      isDarkMode ? 'text-white/40' : 'text-black/40'
                    }`}>
                      Anterior:
                    </span>
                    <div className={`mt-0.5 px-1.5 py-0.5 rounded ${
                      isDarkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-500/10 text-red-600'
                    }`}>
                      {cambio.valor_anterior || '(vacío)'}
                    </div>
                  </div>
                  <div>
                    <span className={`text-[10px] font-medium ${
                      isDarkMode ? 'text-white/40' : 'text-black/40'
                    }`}>
                      Nuevo:
                    </span>
                    <div className={`mt-0.5 px-1.5 py-0.5 rounded ${
                      isDarkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-500/10 text-green-600'
                    }`}>
                      {cambio.valor_nuevo || '(vacío)'}
                    </div>
                  </div>
                  {cambio.metadata?.contexto_adicional?.razon && (
                    <div>
                      <span className={`text-[10px] font-medium ${
                        isDarkMode ? 'text-white/40' : 'text-black/40'
                      }`}>
                        Razón:
                      </span>
                      <div className={`mt-0.5 text-[10px] ${
                        isDarkMode ? 'text-white/70' : 'text-black/70'
                      }`}>
                        {cambio.metadata.contexto_adicional.razon}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
