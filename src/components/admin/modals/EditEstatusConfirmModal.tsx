/**
 * Edit Estatus Confirmation Modal
 * 
 * Displays a confirmation modal before editing an estatus record,
 * showing how many items will be affected across different tables.
 */

import { X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Component props interface
 */
interface EditEstatusConfirmModalProps {
  show: boolean;
  estatusName: string;
  affectedCounts: {
    inea: number;
    itea: number;
    noListado: number;
    total: number;
  };
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  isDarkMode: boolean;
}

/**
 * EditEstatusConfirmModal component
 * 
 * Renders a confirmation modal for estatus edit operations with:
 * - Estatus name being edited
 * - Breakdown of affected items by source (INEA, ITEA, TLAXCALA)
 * - Total count of affected items
 * - Confirm and cancel buttons
 * - Loading state during save
 * 
 * @param props - Component props
 * @returns Confirmation modal UI or null if not shown
 */
export function EditEstatusConfirmModal({
  show,
  estatusName,
  affectedCounts,
  onConfirm,
  onCancel,
  loading,
  isDarkMode
}: EditEstatusConfirmModalProps) {
  
  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 flex items-center justify-center z-50 px-4 backdrop-blur-sm ${
            isDarkMode ? 'bg-black/80' : 'bg-black/50'
          }`}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`rounded-lg border w-full max-w-md overflow-hidden backdrop-blur-xl ${
              isDarkMode ? 'bg-black/95 border-white/10' : 'bg-white/95 border-black/10'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isDarkMode ? 'bg-yellow-500/10' : 'bg-yellow-50'
                  }`}>
                    <AlertTriangle size={20} className={isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Confirmar edición
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`}>
                      Esta acción afectará múltiples bienes
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={onCancel}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'hover:bg-white/10 text-white'
                      : 'hover:bg-black/10 text-black'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* Estatus being edited */}
              <div className={`p-3 rounded-lg border mb-4 ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <label className={`block text-xs font-medium mb-1 ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                  Estatus a editar
                </label>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {estatusName}
                </span>
              </div>

              {/* Affected items breakdown */}
              <div className={`p-4 rounded-lg border mb-6 ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <label className={`block text-xs font-medium mb-3 ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                  Bienes que se actualizarán
                </label>
                
                <div className="space-y-2">
                  {/* INEA */}
                  {affectedCounts.inea > 0 && (
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        isDarkMode 
                          ? 'bg-white/90 text-gray-900 border-white/80' 
                          : 'bg-blue-50 text-blue-900 border-blue-200'
                      }`}>
                        INEA
                      </span>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {affectedCounts.inea} {affectedCounts.inea === 1 ? 'bien' : 'bienes'}
                      </span>
                    </div>
                  )}
                  
                  {/* ITEA */}
                  {affectedCounts.itea > 0 && (
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        isDarkMode 
                          ? 'bg-white/80 text-gray-900 border-white/70' 
                          : 'bg-green-50 text-green-900 border-green-200'
                      }`}>
                        ITEA
                      </span>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {affectedCounts.itea} {affectedCounts.itea === 1 ? 'bien' : 'bienes'}
                      </span>
                    </div>
                  )}
                  
                  {/* TLAXCALA */}
                  {affectedCounts.noListado > 0 && (
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        isDarkMode 
                          ? 'bg-white/70 text-gray-900 border-white/60' 
                          : 'bg-purple-50 text-purple-900 border-purple-200'
                      }`}>
                        TLAXCALA
                      </span>
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {affectedCounts.noListado} {affectedCounts.noListado === 1 ? 'bien' : 'bienes'}
                      </span>
                    </div>
                  )}
                  
                  {/* Total */}
                  <div className={`flex items-center justify-between pt-2 mt-2 border-t ${
                    isDarkMode ? 'border-white/10' : 'border-black/10'
                  }`}>
                    <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Total
                    </span>
                    <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {affectedCounts.total} {affectedCounts.total === 1 ? 'bien' : 'bienes'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <motion.button
                  onClick={onCancel}
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    isDarkMode
                      ? 'bg-black border-white/10 text-white hover:border-white/20 hover:bg-white/[0.02]'
                      : 'bg-white border-black/10 text-black hover:border-black/20 hover:bg-black/[0.02]'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    loading
                      ? isDarkMode
                        ? 'bg-black border-white/5 text-white/40 cursor-not-allowed'
                        : 'bg-white border-black/5 text-black/40 cursor-not-allowed'
                      : isDarkMode
                        ? 'bg-white text-black border-white hover:bg-white/90'
                        : 'bg-black text-white border-black hover:bg-black/90'
                  }`}
                  whileHover={!loading ? { scale: 1.01 } : {}}
                  whileTap={!loading ? { scale: 0.99 } : {}}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Confirmar cambios'
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
