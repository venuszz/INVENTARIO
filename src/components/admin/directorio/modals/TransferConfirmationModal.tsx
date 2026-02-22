'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import type { TransferPreview } from '../types/transfer';

/**
 * TransferConfirmationModal Component
 * 
 * Final confirmation modal for asset transfer operations.
 * Redesigned with minimalist grayscale aesthetic matching TransferPreviewPanel.
 * 
 * Features:
 * - Modal with dark backdrop and focus trap
 * - Clean transfer preview with ORIGEN → DESTINO flow
 * - Minimalist grayscale design
 * - Warning about operation irreversibility
 * - Cancel and Confirm buttons
 * - Loading state during execution
 * - Error display if operation fails
 * - Success state with auto-close
 * - Framer Motion animations
 * - Dark mode support
 * - Keyboard navigation (Escape to close)
 */

interface TransferConfirmationModalProps {
  show: boolean;
  preview: TransferPreview | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isExecuting: boolean;
  error: string | null;
}

type ModalState = 'confirm' | 'executing' | 'success' | 'error';

export function TransferConfirmationModal({
  show,
  preview,
  onConfirm,
  onCancel,
  isExecuting,
  error,
}: TransferConfirmationModalProps) {
  const { isDarkMode } = useTheme();
  const [state, setState] = useState<ModalState>('confirm');
  const [isBienesListExpanded, setIsBienesListExpanded] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Update state based on props
  useEffect(() => {
    if (isExecuting) {
      setState('executing');
    } else if (error) {
      setState('error');
    } else if (show) {
      setState('confirm');
    }
  }, [isExecuting, error, show]);

  // Reset state when modal opens
  useEffect(() => {
    if (show) {
      setState('confirm');
      setIsBienesListExpanded(false);
    }
  }, [show]);

  // Focus trap implementation
  useEffect(() => {
    if (!show) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape key (only in confirm state)
      if (e.key === 'Escape' && state === 'confirm') {
        onCancel();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Focus first element when modal opens
    setTimeout(() => {
      firstFocusableRef.current?.focus();
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [show, state, onCancel]);

  const handleConfirm = async () => {
    await onConfirm();
  };

  const handleRetry = () => {
    setState('confirm');
  };

  if (!preview) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={state === 'confirm' ? onCancel : undefined}
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
              relative w-full max-w-3xl max-h-[90vh] overflow-hidden
              rounded-xl shadow-xl
              flex flex-col
              border
              ${isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/10'}
            `}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="transfer-confirm-title"
          >
            {/* Close button (only in confirm state) */}
            {state === 'confirm' && (
              <button
                ref={firstFocusableRef}
                onClick={onCancel}
                className={`
                  absolute top-4 right-4 z-10
                  p-1 rounded-md
                  transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50
                  ${isDarkMode 
                    ? 'text-white/40 hover:text-white/60 hover:bg-white/5' 
                    : 'text-black/40 hover:text-black/60 hover:bg-black/5'
                  }
                `}
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            )}

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Confirm State */}
              {state === 'confirm' && (
                <div>
                  {/* Title */}
                  <h3 
                    id="transfer-confirm-title"
                    className={`text-xl font-semibold mb-6 pr-8 ${isDarkMode ? 'text-white' : 'text-black'}`}
                  >
                    Confirmar Transferencia
                  </h3>

                  {/* Transfer Preview - Redesigned */}
                  <div className="space-y-4">
                    {/* Main Transfer Card - Similar to TransferPreviewPanel Step 3 */}
                    <div className={`flex flex-col rounded-xl border-2 overflow-hidden ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                      {/* Source Section */}
                      <div className={`p-6 ${isDarkMode ? 'bg-white/[0.03]' : 'bg-black/[0.03]'}`}>
                        <div className={`text-[10px] font-bold tracking-[0.15em] mb-3 ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                          DESDE
                        </div>
                        <div className={`text-xl font-bold mb-1.5 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          {preview.sourceDirector.nombre}
                        </div>
                        {preview.sourceDirector.puesto && (
                          <div className={`text-xs mb-4 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                            {preview.sourceDirector.puesto}
                          </div>
                        )}
                        {preview.sourceDirector.areas.length > 0 && (
                          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                            <div className={`text-[10px] font-medium ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                              ÁREA:
                            </div>
                            <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                              {preview.sourceDirector.areas[0]?.nombre}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Arrow Section */}
                      <div className={`flex items-center justify-center py-3 ${isDarkMode ? 'bg-white/[0.01]' : 'bg-black/[0.01]'}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                          <svg className={`w-6 h-6 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </div>
                      </div>

                      {/* Destination Section */}
                      <div className={`p-6 ${isDarkMode ? 'bg-white/[0.03]' : 'bg-black/[0.03]'}`}>
                        <div className={`text-[10px] font-bold tracking-[0.15em] mb-3 ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                          HACIA
                        </div>
                        <div className={`text-xl font-bold mb-1.5 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          {preview.targetDirector.nombre}
                        </div>
                        {preview.targetDirector.puesto && (
                          <div className={`text-xs mb-4 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                            {preview.targetDirector.puesto}
                          </div>
                        )}
                        {preview.targetArea && (
                          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                            <div className={`text-[10px] font-medium ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                              {preview.allBienesSelected && preview.transferType === 'complete_area' ? 'NUEVA ÁREA:' : 'ÁREA:'}
                            </div>
                            <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                              {preview.targetArea.nombre}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Info Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      {/* Transfer Type */}
                      <div className={`col-span-3 p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                        <div className={`text-[10px] font-bold tracking-wider mb-1 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                          TIPO DE TRANSFERENCIA
                        </div>
                        <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          {preview.transferType === 'complete_area' 
                            ? 'Área Completa' 
                            : 'Bienes Seleccionados'}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                        <div className={`text-[10px] font-bold tracking-wider mb-1 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                          BIENES
                        </div>
                        <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          {preview.totalCount}
                        </div>
                      </div>

                      <div className={`col-span-2 p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                        <div className={`text-[10px] font-bold tracking-wider mb-1 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                          VALOR TOTAL
                        </div>
                        <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          ${preview.totalValue.toLocaleString('es-MX')}
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Bienes List */}
                    {preview.bienesToTransfer.length > 0 && (
                      <div>
                        <button
                          onClick={() => setIsBienesListExpanded(!isBienesListExpanded)}
                          className={`
                            w-full flex items-center justify-between
                            px-4 py-3 rounded-lg
                            border transition-colors
                            focus:outline-none focus:ring-2 focus:ring-offset-0
                            ${isDarkMode 
                              ? 'border-white/10 hover:bg-white/5 focus:ring-white/20' 
                              : 'border-black/10 hover:bg-black/5 focus:ring-black/20'
                            }
                          `}
                        >
                          <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Ver Lista de Bienes ({preview.bienesToTransfer.length})
                          </span>
                          {isBienesListExpanded ? (
                            <ChevronUp className={`w-5 h-5 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`} />
                          ) : (
                            <ChevronDown className={`w-5 h-5 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`} />
                          )}
                        </button>

                        <AnimatePresence>
                          {isBienesListExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                                {preview.bienesToTransfer.map((bien, index) => (
                                  <motion.div
                                    key={bien.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className={`p-3 rounded-lg border ${isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-black/10 bg-black/[0.02]'}`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                          {bien.id_inv}
                                        </div>
                                        <div className={`text-xs truncate mt-0.5 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                                          {bien.descripcion}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1.5">
                                          <span className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                                            ${bien.valor.toLocaleString('es-MX')}
                                          </span>
                                          <span className={`text-xs px-1.5 py-0.5 rounded uppercase ${isDarkMode ? 'bg-white/10 text-white/50' : 'bg-black/10 text-black/50'}`}>
                                            {bien.source}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Warning Message - Minimalist grayscale */}
                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-black/10 bg-black/[0.02]'}`}>
                      <div className={`text-[10px] font-bold tracking-wider mb-1.5 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                        ⚠ ACCIÓN IRREVERSIBLE
                      </div>
                      <div className={`text-xs leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                        Esta transferencia actualizará permanentemente los registros en INEA, ITEA y No Listado. 
                        Los bienes cambiarán de director y área de forma inmediata. 
                        Asegúrese de que toda la información es correcta antes de continuar.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Executing State */}
              {state === 'executing' && (
                <div className="text-center py-12">
                  <Loader2 className={`w-16 h-16 mx-auto mb-4 animate-spin ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
                  <p className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Ejecutando Transferencia...
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                    Por favor espere mientras se procesan los cambios
                  </p>
                </div>
              )}

              {/* Success State */}
              {state === 'success' && (
                <div className="text-center py-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                  >
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}>
                      <CheckCircle className={`w-10 h-10 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                    </div>
                  </motion.div>
                  <p className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Transferencia Completada
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                    {preview.totalCount} bien{preview.totalCount !== 1 ? 'es' : ''} transferido{preview.totalCount !== 1 ? 's' : ''} exitosamente
                  </p>
                </div>
              )}

              {/* Error State */}
              {state === 'error' && (
                <div>
                  {/* Error icon */}
                  <div className="mb-6 flex justify-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}>
                      <AlertTriangle className={`w-8 h-8 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className={`text-xl font-semibold mb-4 text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Error en la Transferencia
                  </h3>

                  {/* Error message */}
                  <div className={`mb-6 p-4 rounded-lg border ${isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-black/10 bg-black/[0.02]'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-black/70'}`}>
                      {error || 'Ocurrió un error al ejecutar la transferencia. Por favor intente nuevamente.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {(state === 'confirm' || state === 'error') && (
              <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                <div className="flex gap-3">
                  <button
                    onClick={onCancel}
                    className={`
                      flex-1 px-6 py-3 rounded-lg
                      font-semibold transition-colors
                      focus:outline-none focus:ring-2 focus:ring-offset-0
                      ${isDarkMode 
                        ? 'bg-white/5 hover:bg-white/10 text-white focus:ring-white/20' 
                        : 'bg-black/5 hover:bg-black/10 text-black focus:ring-black/20'
                      }
                    `}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={state === 'error' ? handleRetry : handleConfirm}
                    className={`
                      flex-1 px-6 py-3 rounded-lg
                      font-semibold transition-colors
                      focus:outline-none focus:ring-2 focus:ring-offset-0
                      ${isDarkMode
                        ? 'bg-white text-black hover:bg-white/90 focus:ring-white/30 focus:ring-offset-black'
                        : 'bg-black text-white hover:bg-black/90 focus:ring-black/30 focus:ring-offset-white'
                      }
                    `}
                  >
                    {state === 'error' ? 'Reintentar' : 'Confirmar Transferencia'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
