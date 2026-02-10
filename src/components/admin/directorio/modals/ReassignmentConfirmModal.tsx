'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import type { Directorio, Area } from '@/types/admin';
import { AreaChip } from '../components/AreaChip';

interface ReassignmentConfirmModalProps {
  show: boolean;
  fromEmployee: Directorio & { areas?: Area[] };
  toEmployee: Directorio & { areas?: Area[] };
  goodsCount: number;
  onConfirm: () => Promise<{ success: boolean; remainingGoods: number }>;
  onCancel: () => void;
  onShowDeleteModal?: () => void;
}

type ConfirmState = 'confirm' | 'processing' | 'success' | 'error';

/**
 * Final confirmation modal for goods reassignment
 * Shows from/to employees and executes batch update
 */
export function ReassignmentConfirmModal({
  show,
  fromEmployee,
  toEmployee,
  goodsCount,
  onConfirm,
  onCancel,
  onShowDeleteModal,
}: ReassignmentConfirmModalProps) {
  const [state, setState] = useState<ConfirmState>('confirm');
  const [error, setError] = useState<string | null>(null);
  const [remainingGoods, setRemainingGoods] = useState(0);

  // Reset state when modal opens
  useEffect(() => {
    if (show) {
      setState('confirm');
      setError(null);
      setRemainingGoods(0);
    }
  }, [show]);

  const handleConfirm = async () => {
    setState('processing');
    setError(null);

    try {
      const result = await onConfirm();
      
      if (result.success) {
        setState('success');
        setRemainingGoods(result.remainingGoods);
        
        // Auto-close after 2 seconds if there are remaining goods
        // Otherwise show delete modal option
        setTimeout(() => {
          if (result.remainingGoods === 0 && onShowDeleteModal) {
            onShowDeleteModal();
          } else {
            onCancel();
          }
        }, 2000);
      } else {
        throw new Error('La reasignación no se completó correctamente');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reasignar bienes');
      setState('error');
    }
  };

  const handleRetry = () => {
    setState('confirm');
    setError(null);
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
              relative w-full max-w-2xl p-6
              bg-white dark:bg-black
              border border-black/10 dark:border-white/10
              rounded-xl shadow-xl
            "
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reassignment-confirm-title"
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

            {/* Confirm State */}
            {state === 'confirm' && (
              <div>
                {/* Title */}
                <h3 
                  id="reassignment-confirm-title"
                  className="text-lg font-medium text-black dark:text-white mb-6"
                >
                  Confirmar Reasignación
                </h3>

                {/* From/To layout */}
                <div className="flex items-center gap-4 mb-6">
                  {/* From employee */}
                  <div className="flex-1 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-xs text-red-800 dark:text-red-300 mb-2 font-medium">
                      Desde:
                    </p>
                    <p className="font-medium text-black dark:text-white">
                      {fromEmployee.nombre || 'Sin nombre'}
                    </p>
                    {fromEmployee.puesto && (
                      <p className="text-sm text-black/60 dark:text-white/60 mt-0.5">
                        {fromEmployee.puesto}
                      </p>
                    )}
                    {fromEmployee.areas && fromEmployee.areas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {fromEmployee.areas.map((area) => (
                          <AreaChip key={area.id_area} area={area} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0">
                    <ArrowRight className="w-6 h-6 text-black/40 dark:text-white/40" />
                  </div>

                  {/* To employee */}
                  <div className="flex-1 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-800 dark:text-green-300 mb-2 font-medium">
                      Hacia:
                    </p>
                    <p className="font-medium text-black dark:text-white">
                      {toEmployee.nombre || 'Sin nombre'}
                    </p>
                    {toEmployee.puesto && (
                      <p className="text-sm text-black/60 dark:text-white/60 mt-0.5">
                        {toEmployee.puesto}
                      </p>
                    )}
                    {toEmployee.areas && toEmployee.areas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {toEmployee.areas.map((area) => (
                          <AreaChip key={area.id_area} area={area} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Goods count badge */}
                <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-center">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Se reasignarán <strong>{goodsCount} bien{goodsCount !== 1 ? 'es' : ''}</strong>
                  </p>
                </div>

                {/* Warning message */}
                <div className="mb-6 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    Esta acción actualizará los registros en la base de datos. Asegúrese de que la información es correcta.
                  </p>
                </div>

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
                      bg-blue-600 hover:bg-blue-700
                      text-white font-medium
                      transition-colors
                    "
                  >
                    Confirmar Reasignación
                  </button>
                </div>
              </div>
            )}

            {/* Processing State */}
            {state === 'processing' && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400 animate-spin" />
                <p className="text-black dark:text-white font-medium mb-2">
                  Reasignando bienes...
                </p>
                <p className="text-sm text-black/60 dark:text-white/60">
                  Por favor espere
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
                <p className="text-black dark:text-white font-medium mb-2">
                  ¡Reasignación completada!
                </p>
                <p className="text-sm text-black/60 dark:text-white/60">
                  {remainingGoods === 0 
                    ? 'Todos los bienes han sido reasignados'
                    : `Quedan ${remainingGoods} bien${remainingGoods !== 1 ? 'es' : ''} a cargo`
                  }
                </p>
              </div>
            )}

            {/* Error State */}
            {state === 'error' && (
              <div>
                {/* Error icon */}
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-medium text-black dark:text-white mb-2 text-center">
                  Error en la Reasignación
                </h3>

                {/* Error message */}
                <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-300">
                    {error || 'Ocurrió un error al reasignar los bienes'}
                  </p>
                </div>

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
                    Cerrar
                  </button>
                  <button
                    onClick={handleRetry}
                    className="
                      flex-1 px-4 py-2.5 rounded-lg
                      bg-blue-600 hover:bg-blue-700
                      text-white font-medium
                      transition-colors
                    "
                  >
                    Reintentar
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
