'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, CheckCircle, X } from 'lucide-react';
import type { Directorio } from '@/types/admin';
import { AreaChip } from '../components/AreaChip';
import type { Area } from '@/types/admin';

interface DeleteModalProps {
  show: boolean;
  employee: Directorio & { areas?: Area[] };
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

type DeleteState = 'confirm' | 'deleting' | 'success';

/**
 * Delete confirmation modal with 3 states: confirm → deleting → success
 */
export function DeleteModal({ show, employee, onConfirm, onCancel }: DeleteModalProps) {
  const [state, setState] = useState<DeleteState>('confirm');
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (show) {
      setState('confirm');
      setError(null);
    }
  }, [show]);

  const handleConfirm = async () => {
    setState('deleting');
    setError(null);

    try {
      await onConfirm();
      setState('success');
      
      // Auto-close after 1.5 seconds
      setTimeout(() => {
        onCancel();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
      setState('confirm');
    }
  };

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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="
              relative w-full max-w-md p-6
              bg-white dark:bg-black
              border border-black/10 dark:border-white/10
              rounded-xl shadow-xl
            "
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            {/* Close button (only in confirm state) */}
            {state === 'confirm' && (
              <button
                onClick={onCancel}
                className="
                  absolute top-4 right-4
                  p-1 rounded-md
                  text-black/40 dark:text-white/40
                  hover:text-black/60 dark:hover:text-white/60
                  hover:bg-black/5 dark:hover:bg-white/5
                  transition-colors
                "
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            )}

            {/* Confirmation State */}
            {state === 'confirm' && (
              <div>
                {/* Icon */}
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>

                {/* Title */}
                <h3 
                  id="delete-modal-title"
                  className="text-lg font-medium text-black dark:text-white mb-2 text-center"
                >
                  ¿Eliminar empleado?
                </h3>

                {/* Employee data */}
                <div className="mb-4 p-4 rounded-lg bg-black/5 dark:bg-white/5">
                  <p className="font-medium text-black dark:text-white mb-1">
                    {employee.nombre || 'Sin nombre'}
                  </p>
                  {employee.puesto && (
                    <p className="text-sm text-black/60 dark:text-white/60 mb-2">
                      {employee.puesto}
                    </p>
                  )}
                  {employee.areas && employee.areas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {employee.areas.map((area) => (
                        <AreaChip key={area.id_area} area={area} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Warning message */}
                <p className="text-sm text-black/60 dark:text-white/60 text-center mb-6">
                  Esta acción no se puede deshacer
                </p>

                {/* Error message */}
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={onCancel}
                    className="
                      flex-1 px-4 py-2.5 rounded-lg
                      bg-black/5 dark:bg-white/5
                      hover:bg-black/10 dark:hover:bg-white/10
                      text-black dark:text-white
                      font-medium transition-colors
                    "
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="
                      flex-1 px-4 py-2.5 rounded-lg
                      bg-red-600 hover:bg-red-700
                      text-white font-medium
                      transition-colors
                    "
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )}

            {/* Deleting State */}
            {state === 'deleting' && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400 animate-spin" />
                <p className="text-black dark:text-white font-medium">
                  Eliminando...
                </p>
              </div>
            )}

            {/* Success State */}
            {state === 'success' && (
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                >
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600 dark:text-green-400" />
                </motion.div>
                <p className="text-black dark:text-white font-medium">
                  ¡Eliminado!
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
