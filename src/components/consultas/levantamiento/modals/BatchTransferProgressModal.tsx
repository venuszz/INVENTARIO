/**
 * BatchTransferProgressModal Component
 * 
 * Modal for displaying real-time progress of batch origen transfer operations.
 * Shows progress bar, status text, items list with status icons, and completion summary.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TransferItem } from '@/types/batchOrigenTransfer';

interface BatchTransferProgressModalProps {
  show: boolean;
  items: TransferItem[];
  currentIndex: number;
  totalItems?: number;
  onClose: () => void;
  processing: boolean;
  isDarkMode: boolean;
}

export function BatchTransferProgressModal({
  show,
  items,
  currentIndex,
  totalItems,
  onClose,
  processing,
  isDarkMode,
}: BatchTransferProgressModalProps) {
  const currentItemRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Calculate summary
  const summary = useMemo(() => {
    const successful = items.filter(i => i.status === 'success').length;
    const failed = items.filter(i => i.status === 'failed').length;
    const skipped = items.filter(i => i.status === 'skipped').length;
    const pending = items.filter(i => i.status === 'pending').length;

    return { successful, failed, skipped, pending };
  }, [items]);

  const total = totalItems !== undefined ? totalItems : items.length;
  const progress = total > 0 ? (currentIndex / total) * 100 : 0;
  const isComplete = !processing && currentIndex >= total && total > 0;

  // Scroll to current item
  useEffect(() => {
    if (currentItemRef.current && processing) {
      currentItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentIndex, processing]);

  // Keyboard navigation: Escape to close (only when not processing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !processing) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [show, processing, onClose]);

  if (!show) return null;

  // Status icon helper with minimalist SVG
  const getStatusIcon = (status: TransferItem['status']) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" strokeDasharray="4 4" />
          </svg>
        );
      case 'processing':
        return (
          <motion.svg
            className="w-5 h-5 text-neutral-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </motion.svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'skipped':
        return (
          <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        );
      default:
        return null;
    }
  };

  const activeItem = items[currentIndex > 0 ? currentIndex - 1 : 0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="progress-modal-title"
      aria-busy={processing}
    >
      <div
        ref={modalRef}
        className={`w-full max-w-3xl rounded-lg shadow-xl ${isDarkMode ? 'bg-neutral-900 text-white' : 'bg-white text-black'
          }`}
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'
            }`}
        >
          <h2 id="progress-modal-title" className="text-xl font-light">
            {isComplete ? 'Transferencia Completada' : 'Procesando Transferencias'}
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!isComplete ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col w-full h-full max-h-[70vh]"
            >
              {/* Progress Summary Header */}
              <div className="flex-shrink-0 mb-6">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <h3 className={`text-base font-medium ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                      Transfiriendo bienes...
                    </h3>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-white/60' : 'text-neutral-500'}`}>
                      {currentIndex} de {total} finalizados
                    </p>
                  </div>
                  <span className={`text-2xl font-light ${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>
                    {Math.round(progress)}%
                  </span>
                </div>

                {/* Minimalist Progress Bar */}
                <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-neutral-200'}`}>
                  <motion.div
                    className={`h-full ${isDarkMode ? 'bg-neutral-300' : 'bg-neutral-600'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Items List - Table Rows */}
              <div
                className={`flex-1 overflow-y-auto rounded-xl border ${isDarkMode ? 'border-white/10 bg-[#1c1c1c]' : 'border-black/10 bg-neutral-50'}`}
              >
                <div className="flex flex-col">
                  {items.map((item, index) => {
                    // Logic to determine row state
                    const processingIndex = currentIndex > 0 ? currentIndex - 1 : 0;
                    const isProcessing = index === processingIndex && processing;
                    const isWaiting = index > processingIndex;

                    let bgClass = "bg-transparent";
                    let textClass = isDarkMode ? 'text-white' : 'text-neutral-900';
                    let descClass = isDarkMode ? 'text-white/50' : 'text-neutral-500';
                    let rowOpacity = "opacity-100";

                    if (isProcessing) {
                      bgClass = isDarkMode ? "bg-white/10" : "bg-neutral-200";
                      rowOpacity = "animate-pulse"; // Skeleton-like pulse for active item
                    } else if (isWaiting) {
                      rowOpacity = "opacity-40"; // Muted for upcoming items
                    }

                    return (
                      <div
                        key={item.id}
                        ref={isProcessing ? currentItemRef : null}
                        className={`flex items-center px-5 py-4 gap-4 transition-all duration-300 border-b ${isDarkMode ? 'border-white/5' : 'border-black/5'
                          } ${bgClass} ${rowOpacity}`}
                      >
                        {/* 1. Icon Col */}
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                          {isProcessing ? getStatusIcon('processing') : getStatusIcon(item.status)}
                        </div>

                        {/* 2. Details Col */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-medium truncate ${textClass}`}>
                              {item.idInventario}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[0.65rem] uppercase tracking-wider rounded font-medium ${isDarkMode ? 'bg-white/5 text-white/70' : 'bg-black/5 text-neutral-600'
                                }`}
                            >
                              {item.currentOrigen}
                            </span>
                          </div>
                          <span className={`text-xs truncate ${descClass}`}>
                            {item.descripcion}
                          </span>

                          {/* Error/Reason (if any) */}
                          {item.error && (
                            <div className="mt-1 text-xs text-neutral-800 dark:text-neutral-300 font-medium">
                              Error: {item.error}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : (
            /* Minimalist Success State */
            <motion.div
              className="flex flex-col items-center justify-center py-12 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 5, -5, 0] }}
                transition={{ type: 'tween', duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                className={`w-20 h-20 mb-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white' : 'bg-black'}`}>
                  <svg className={`w-6 h-6 ${isDarkMode ? 'text-black' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <motion.path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    />
                  </svg>
                </div>
              </motion.div>

              <motion.h3
                className="text-2xl font-light mb-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                ¡Transferencia Exitosa!
              </motion.h3>

              <motion.p
                className={`text-base ${isDarkMode ? 'text-white/60' : 'text-neutral-500'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Se transfirieron <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>{summary.successful}</span> bienes.
              </motion.p>

              {summary.failed > 0 && (
                <motion.p
                  className="mt-4 text-sm text-red-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  Hubo {summary.failed} transferencias fallidas.
                </motion.p>
              )}
            </motion.div>
          )}
        </div>

        {/* Footer (only visible when not complete, we let the auto-close handle the rest) */}
        {!isComplete && (
          <div
            className={`px-6 py-4 border-t flex justify-end gap-3 ${isDarkMode ? 'border-white/10' : 'border-black/10'
              }`}
          >
            <button
              onClick={onClose}
              disabled={processing}
              className={`px-4 py-2 rounded-lg transition-colors ${processing
                ? isDarkMode
                  ? 'bg-white/20 text-white/40 cursor-not-allowed'
                  : 'bg-black/20 text-black/40 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'bg-black text-white hover:bg-black/90'
                }`}
              aria-label={processing ? 'Procesando transferencia' : 'Cerrar modal'}
            >
              {processing ? 'Procesando...' : 'Cerrar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
