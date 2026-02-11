'use client';

import React from 'react';
import { AlertTriangle, RotateCw, X, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mueble } from '../types';

interface ReactivarModalProps {
  show: boolean;
  selectedItem: Mueble | null;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  isDarkMode: boolean;
  reactivating?: boolean;
}

/**
 * ReactivarModal Component
 * 
 * Confirmation dialog for reactivating a deprecated item.
 * Shows item details and warning message before confirming.
 */
export const ReactivarModal: React.FC<ReactivarModalProps> = ({
  show,
  selectedItem,
  onConfirm,
  onClose,
  isDarkMode,
  reactivating = false
}) => {
  if (!show || !selectedItem) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 flex items-center justify-center z-50 px-4 ${
            isDarkMode ? 'bg-black/90' : 'bg-black/50'
          } backdrop-blur-sm`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`rounded-lg shadow-2xl border w-full max-w-md overflow-hidden ${
              isDarkMode
                ? 'bg-black border-white/10'
                : 'bg-white border-black/10'
            }`}
          >
            {/* Header */}
            <div className={`relative px-6 py-5 border-b ${
              isDarkMode ? 'border-white/10' : 'border-black/10'
            }`}>
              <button
                onClick={onClose}
                disabled={reactivating}
                className={`absolute top-4 right-4 p-1.5 rounded-lg transition-all ${
                  reactivating
                    ? 'opacity-50 cursor-not-allowed'
                    : isDarkMode
                      ? 'text-white/60 hover:text-white hover:bg-white/5'
                      : 'text-black/60 hover:text-black hover:bg-black/5'
                }`}
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className={`p-3 rounded-lg border mb-3 ${
                  isDarkMode
                    ? 'bg-white/[0.02] border-white/10'
                    : 'bg-black/[0.02] border-black/10'
                }`}>
                  <RotateCw className={`h-6 w-6 ${
                    isDarkMode ? 'text-white/60' : 'text-black/60'
                  }`} />
                </div>
                <h3 className={`text-lg font-light tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  ¿Reactivar este artículo?
                </h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Item Details */}
              <div className={`rounded-lg border p-4 ${
                isDarkMode
                  ? 'border-white/10 bg-white/[0.02]'
                  : 'border-black/10 bg-black/[0.02]'
              }`}>
                <div className={`text-sm font-light space-y-1 ${
                  isDarkMode ? 'text-white/80' : 'text-black/80'
                }`}>
                  <div>
                    <span className={`font-medium ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>ID:</span> {selectedItem.id_inv}
                  </div>
                  <div>
                    <span className={`font-medium ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>Descripción:</span> {selectedItem.descripcion || 'No especificado'}
                  </div>
                  {selectedItem.area && (
                    <div>
                      <span className={`font-medium ${
                        isDarkMode ? 'text-white' : 'text-black'
                      }`}>Área:</span> {selectedItem.area.nombre}
                    </div>
                  )}
                </div>
              </div>

              {/* Warning Message */}
              <div className={`rounded-lg border p-4 ${
                isDarkMode
                  ? 'bg-yellow-500/[0.08] border-yellow-500/30'
                  : 'bg-yellow-500/[0.08] border-yellow-500/30'
              }`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                    isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  }`} />
                  <div className="flex-1">
                    <p className={`text-sm font-light ${
                      isDarkMode ? 'text-white/90' : 'text-black/90'
                    }`}>
                      Este artículo volverá al inventario activo y se eliminará su registro de baja.
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Message */}
              <div className={`flex items-start gap-2 text-xs font-light ${
                isDarkMode ? 'text-white/40' : 'text-black/40'
              }`}>
                <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <p>
                  Una vez reactivado, el artículo aparecerá nuevamente en el inventario activo de INEA.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className={`p-5 border-t flex justify-end gap-3 ${
              isDarkMode ? 'border-white/10' : 'border-black/10'
            }`}>
              <button
                onClick={onClose}
                disabled={reactivating}
                className={`px-4 py-2 rounded-lg text-sm border font-light transition-all flex items-center gap-2 ${
                  reactivating
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                } ${
                  isDarkMode
                    ? 'bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/5 border-white/10'
                    : 'bg-black/[0.02] text-black/60 hover:text-black hover:bg-black/5 border-black/10'
                }`}
              >
                <X className="h-3.5 w-3.5" />
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={reactivating}
                className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 font-light transition-all border ${
                  reactivating
                    ? isDarkMode
                      ? 'bg-white/[0.02] text-white/20 cursor-not-allowed border-white/10'
                      : 'bg-black/[0.02] text-black/20 cursor-not-allowed border-black/10'
                    : isDarkMode
                      ? 'bg-white/5 text-white hover:bg-white/10 border-white/10'
                      : 'bg-black/5 text-black hover:bg-black/10 border-black/10'
                }`}
              >
                {reactivating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Reactivando...
                  </>
                ) : (
                  <>
                    <RotateCw className="h-3.5 w-3.5" />
                    Reactivar
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
