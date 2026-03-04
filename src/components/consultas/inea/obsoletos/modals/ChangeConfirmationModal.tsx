import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, ArrowRight } from 'lucide-react';
import { Change } from '../utils/changeDetection';

interface ChangeConfirmationModalProps {
  show: boolean;
  changes: Change[];
  changeReason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isDarkMode: boolean;
  isSaving: boolean;
}

export function ChangeConfirmationModal({
  show,
  changes,
  changeReason,
  onReasonChange,
  onConfirm,
  onCancel,
  isDarkMode,
  isSaving
}: ChangeConfirmationModalProps) {
  if (!show) return null;

  const isReasonValid = changeReason.trim().length > 0;
  // Use two columns only when there are 4 or more changes
  const useTwoColumns = changes.length >= 4;

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`max-w-5xl w-full rounded-lg border shadow-2xl ${
              isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/10'
            }`}
          >
            {/* Header */}
            <div
              className={`px-6 py-4 border-b flex items-center justify-between ${
                isDarkMode ? 'border-white/10' : 'border-black/10'
              }`}
            >
              <div>
                <h2
                  className={`text-lg font-light tracking-tight ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}
                >
                  Confirmar Cambios
                </h2>
                <p
                  className={`text-xs font-light mt-0.5 ${
                    isDarkMode ? 'text-white/50' : 'text-black/50'
                  }`}
                >
                  {changes.length} {changes.length === 1 ? 'modificación' : 'modificaciones'}
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className={`rounded-lg p-1.5 transition-all ${
                  isSaving
                    ? 'opacity-50 cursor-not-allowed'
                    : isDarkMode
                    ? 'text-white/60 hover:text-white hover:bg-white/5'
                    : 'text-black/60 hover:text-black hover:bg-black/5'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Changes List - Dynamic Columns */}
            <div
              className={`px-6 py-5 max-h-96 overflow-y-auto ${
                isDarkMode
                  ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30'
                  : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20 hover:scrollbar-thumb-black/30'
              }`}
            >
              <div className={`grid ${useTwoColumns ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                {changes.map((change, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`border rounded-lg px-4 py-3 ${
                      isDarkMode
                        ? 'bg-white/[0.02] border-white/10'
                        : 'bg-black/[0.02] border-black/10'
                    }`}
                  >
                    <div
                      className={`text-xs font-medium uppercase tracking-wider mb-2 ${
                        isDarkMode ? 'text-white/50' : 'text-black/50'
                      }`}
                    >
                      {change.label}
                    </div>
                    <div className="flex items-center gap-2.5 text-sm">
                      <div
                        className={`flex-1 min-w-0 px-3 py-1.5 rounded truncate ${
                          isDarkMode
                            ? 'bg-red-500/10 text-red-400/80'
                            : 'bg-red-50 text-red-600'
                        }`}
                        title={change.oldValue || 'No especificado'}
                      >
                        {change.oldValue || 'No especificado'}
                      </div>
                      <ArrowRight
                        className={`h-4 w-4 flex-shrink-0 ${
                          isDarkMode ? 'text-white/30' : 'text-black/30'
                        }`}
                      />
                      <div
                        className={`flex-1 min-w-0 px-3 py-1.5 rounded truncate ${
                          isDarkMode
                            ? 'bg-green-500/10 text-green-400/80'
                            : 'bg-green-50 text-green-600'
                        }`}
                        title={change.newValue || 'No especificado'}
                      >
                        {change.newValue || 'No especificado'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Reason Textarea */}
            <div
              className={`px-6 py-5 border-t ${
                isDarkMode ? 'border-white/10' : 'border-black/10'
              }`}
            >
              <label
                className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-2 ${
                  isDarkMode ? 'text-white/50' : 'text-black/50'
                }`}
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Motivo del Cambio
                <span
                  className={`${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}
                >
                  *
                </span>
              </label>
              <textarea
                value={changeReason}
                onChange={(e) => onReasonChange(e.target.value.toUpperCase())}
                placeholder="DESCRIBA EL MOTIVO..."
                disabled={isSaving}
                className={`w-full border rounded-lg px-3 py-2 text-sm font-light focus:outline-none transition-all resize-none ${
                  isSaving ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  isDarkMode
                    ? 'bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.04]'
                    : 'bg-black/[0.02] border-black/10 text-black placeholder:text-black/30 focus:border-black/20 focus:bg-black/[0.04]'
                }`}
                rows={4}
                maxLength={500}
              />
              <div
                className={`text-xs font-light mt-1.5 text-right ${
                  isDarkMode ? 'text-white/30' : 'text-black/30'
                }`}
              >
                {changeReason.length}/500
              </div>
            </div>

            {/* Actions */}
            <div
              className={`px-6 py-4 border-t flex items-center justify-end gap-3 ${
                isDarkMode ? 'border-white/10' : 'border-black/10'
              }`}
            >
              <motion.button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg border text-sm font-light tracking-tight transition-all ${
                  isSaving
                    ? isDarkMode
                      ? 'bg-white/[0.02] border-white/10 text-white/30 cursor-not-allowed'
                      : 'bg-black/[0.02] border-black/10 text-black/30 cursor-not-allowed'
                    : isDarkMode
                    ? 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
                    : 'bg-black/[0.02] border-black/10 text-black/60 hover:bg-black/5 hover:text-black'
                }`}
                whileHover={!isSaving ? { scale: 1.02 } : {}}
                whileTap={!isSaving ? { scale: 0.98 } : {}}
              >
                Cancelar
              </motion.button>
              <motion.button
                type="button"
                onClick={onConfirm}
                disabled={isSaving || !isReasonValid}
                className={`px-4 py-2 rounded-lg border text-sm font-light tracking-tight transition-all ${
                  isSaving || !isReasonValid
                    ? isDarkMode
                      ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                      : 'bg-black/5 border-black/10 text-black/40 cursor-not-allowed'
                    : isDarkMode
                    ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    : 'bg-black/5 border-black/10 text-black hover:bg-black/10'
                }`}
                whileHover={!isSaving && isReasonValid ? { scale: 1.02 } : {}}
                whileTap={!isSaving && isReasonValid ? { scale: 0.98 } : {}}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  'Confirmar'
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
