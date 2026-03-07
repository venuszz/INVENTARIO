'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { OrigenType } from '../OrigenBadge';
import useOrigenTransfer from '@/hooks/useOrigenTransfer';

interface TransferOrigenModalProps {
  isOpen: boolean;
  onClose: () => void;
  idInventario: string;
  recordId: string;
  currentOrigen: 'inea' | 'itea' | 'no-listado';
  targetOrigen: 'inea' | 'itea' | 'no-listado';
  onSuccess: () => void;
  isDarkMode?: boolean;
  itemDescription?: string;
  itemArea?: string;
  itemDirector?: string;
  itemColor?: string | null;
  itemColorName?: string | null;
  itemColorSignificado?: string | null;
}

const ORIGEN_LABELS: Record<'inea' | 'itea' | 'no-listado', string> = {
  inea: 'INEA',
  itea: 'ITEJPA',
  'no-listado': 'TLAXCALA',
};

// Configuración para el diseño de Levantamiento (dark mode compatible)
const getLevantamientoConfig = (isDarkMode: boolean): Record<'inea' | 'itea' | 'no-listado', string> => ({
  inea: isDarkMode 
    ? 'bg-white/90 text-gray-900 border border-white/80' 
    : 'bg-blue-50 text-blue-900 border border-blue-200',
  itea: isDarkMode 
    ? 'bg-white/80 text-gray-900 border border-white/70' 
    : 'bg-green-50 text-green-900 border border-green-200',
  'no-listado': isDarkMode 
    ? 'bg-white/70 text-gray-900 border border-white/60' 
    : 'bg-purple-50 text-purple-900 border border-purple-200',
});

export default function TransferOrigenModal({
  isOpen,
  onClose,
  idInventario,
  recordId,
  currentOrigen,
  targetOrigen,
  onSuccess,
  isDarkMode = false,
  itemDescription = '',
  itemArea = '',
  itemDirector = '',
  itemColor = null,
  itemColorName = null,
  itemColorSignificado = null,
}: TransferOrigenModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const { transferOrigen, isTransferring, error } = useOrigenTransfer({
    currentOrigen,
    onSuccess: () => {
      onSuccess();
    },
  });

  const levantamientoConfig = getLevantamientoConfig(isDarkMode);

  // Detect dark mode from body class if not provided
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = document.body.classList.contains('dark');
      if (isDark !== isDarkMode) {
        // Update if needed
      }
    }
  }, [isDarkMode]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await transferOrigen(recordId, idInventario, targetOrigen);
    } catch (err) {
      // Error ya manejado por el hook
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    if (!isTransferring) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay with blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`absolute inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-black/40'}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className={`relative rounded-lg shadow-xl max-w-md w-full mx-4 ${
          isDarkMode ? 'bg-black border border-white/20' : 'bg-white border border-gray-200'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
          <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Confirmar transferencia
          </h3>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Item Details */}
          <div className={`rounded-lg p-3 border ${
            isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className={`text-xs font-medium min-w-[80px] ${
                  isDarkMode ? 'text-white/60' : 'text-gray-600'
                }`}>
                  ID:
                </span>
                <span className={`text-xs font-mono ${
                  idInventario 
                    ? isDarkMode ? 'text-white' : 'text-black'
                    : isDarkMode ? 'text-white/40' : 'text-gray-400'
                }`}>
                  {idInventario || 'Sin ID'}
                </span>
              </div>
              {itemDescription && (
                <div className="flex items-start gap-2">
                  <span className={`text-xs font-medium min-w-[80px] ${
                    isDarkMode ? 'text-white/60' : 'text-gray-600'
                  }`}>
                    Descripción:
                  </span>
                  <span className={`text-xs line-clamp-2 ${
                    isDarkMode ? 'text-white/80' : 'text-black/80'
                  }`}>
                    {itemDescription}
                  </span>
                </div>
              )}
              {itemArea && (
                <div className="flex items-start gap-2">
                  <span className={`text-xs font-medium min-w-[80px] ${
                    isDarkMode ? 'text-white/60' : 'text-gray-600'
                  }`}>
                    Área:
                  </span>
                  <span className={`text-xs ${
                    isDarkMode ? 'text-white/80' : 'text-black/80'
                  }`}>
                    {itemArea}
                  </span>
                </div>
              )}
              {itemDirector && (
                <div className="flex items-start gap-2">
                  <span className={`text-xs font-medium min-w-[80px] ${
                    isDarkMode ? 'text-white/60' : 'text-gray-600'
                  }`}>
                    Director:
                  </span>
                  <span className={`text-xs ${
                    isDarkMode ? 'text-white/80' : 'text-black/80'
                  }`}>
                    {itemDirector}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Preview Visual */}
          <div className="flex items-center justify-center gap-3 py-2">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${levantamientoConfig[currentOrigen]}`}>
              {ORIGEN_LABELS[currentOrigen]}
            </span>
            <ArrowRight className={`w-5 h-5 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`} />
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${levantamientoConfig[targetOrigen]}`}>
              {ORIGEN_LABELS[targetOrigen]}
            </span>
          </div>

          {/* Advertencia general */}
          <div className={`flex gap-2 p-3 rounded-lg border ${
            isDarkMode 
              ? 'bg-yellow-500/10 border-yellow-500/30' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
              isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
            }`} />
            <div className="text-xs">
              <p className={`font-medium mb-1 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                Importante:
              </p>
              <ul className={`list-disc list-inside space-y-0.5 ${
                isDarkMode ? 'text-yellow-400/80' : 'text-yellow-700'
              }`}>
                <li>El registro se moverá de {ORIGEN_LABELS[currentOrigen]} a {ORIGEN_LABELS[targetOrigen]}</li>
                <li>Esta acción quedará registrada en el historial</li>
              </ul>
            </div>
          </div>

          {/* Advertencia de pérdida de color (solo ITEA con color) */}
          {currentOrigen === 'itea' && itemColorName && (() => {
            const colorHex =
              itemColorName === 'ROJO' ? '#ef4444' :
              itemColorName === 'BLANCO' ? '#ffffff' :
              itemColorName === 'VERDE' ? '#22c55e' :
              itemColorName === 'AMARILLO' ? '#eab308' :
              itemColorName === 'AZUL' ? '#3b82f6' :
              itemColorName === 'NARANJA' ? '#f97316' :
              '#9ca3af';
            
            const isWhite = itemColorName === 'BLANCO';
            
            return (
              <div className={`flex gap-2 p-3 rounded-lg border ${
                isDarkMode 
                  ? 'bg-red-500/10 border-red-500/30' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`} />
                <div className="text-xs flex-1">
                  <p className={`font-medium ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>
                    Se perderá el color{' '}
                    <span className="relative inline-block group/color">
                      <span
                        className="inline-block w-2 h-2 rounded-full align-middle"
                        style={{
                          backgroundColor: colorHex,
                          border: isWhite
                            ? `1.5px solid ${isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'}`
                            : 'none',
                          boxShadow: `0 0 6px ${colorHex}40`
                        }}
                      />
                      {/* Popover on hover */}
                      <span
                        className="absolute left-0 bottom-full mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover/color:opacity-100 transition-all duration-200 z-50 shadow-xl backdrop-blur-sm"
                        style={{
                          backgroundColor: `${colorHex}f5`,
                          border: `2px solid ${colorHex}`,
                          color: isWhite ? '#000000' : '#ffffff',
                          minWidth: '120px'
                        }}
                      >
                        {/* Arrow */}
                        <span
                          className="absolute -bottom-1.5 left-2 w-3 h-3 rotate-45"
                          style={{
                            backgroundColor: colorHex,
                            borderBottom: `2px solid ${colorHex}`,
                            borderRight: `2px solid ${colorHex}`,
                            borderTop: 'none',
                            borderLeft: 'none'
                          }}
                        />
                        <span className="relative">
                          <span className="font-bold text-sm tracking-wide block mb-1">
                            {itemColorName}
                          </span>
                          {itemColorSignificado && (
                            <span
                              className="text-[11px] leading-tight font-light block"
                              style={{
                                color: isWhite ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)'
                              }}
                            >
                              {itemColorSignificado}
                            </span>
                          )}
                        </span>
                      </span>
                    </span>
                    {' '}<span className="font-bold">{itemColorName}</span>
                    {itemColorSignificado && <span className="font-normal"> ({itemColorSignificado})</span>}
                    <br />
                    Ya que es un concepto exclusivo de los bienes de ITEJPA
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Error message */}
          {error && (
            <div className={`flex gap-2 p-3 rounded-lg border ${
              isDarkMode 
                ? 'bg-red-500/10 border-red-500/30' 
                : 'bg-red-50 border-red-200'
            }`}>
              <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${
                isDarkMode ? 'text-red-400' : 'text-red-600'
              }`} />
              <div className="text-xs">
                <p className={`font-medium ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>
                  Error al transferir:
                </p>
                <p className={`mt-1 ${isDarkMode ? 'text-red-400/80' : 'text-red-700'}`}>
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex gap-2 px-6 py-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
          <button
            onClick={handleClose}
            disabled={isTransferring}
            className={`flex-1 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              isDarkMode
                ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                : 'bg-gray-100 hover:bg-gray-200 text-black border border-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isTransferring}
            className={`flex-1 px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
              isTransferring
                ? isDarkMode
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'bg-black text-white hover:bg-black/90'
            }`}
          >
            {isTransferring ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Transfiriendo...
              </>
            ) : (
              'Confirmar'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
