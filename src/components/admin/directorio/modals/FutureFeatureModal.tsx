'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, X } from 'lucide-react';

interface FutureFeatureModalProps {
  show: boolean;
  featureName: string;
  description?: string;
  onClose: () => void;
}

/**
 * Generic modal to inform users about features not yet implemented
 */
export function FutureFeatureModal({ 
  show, 
  featureName, 
  description, 
  onClose 
}: FutureFeatureModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="
              relative w-full max-w-md p-6 text-center
              bg-white dark:bg-black
              border border-black/10 dark:border-white/10
              rounded-xl shadow-xl
            "
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="future-feature-title"
          >
            {/* Close button */}
            <button
              onClick={onClose}
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

            {/* Icon */}
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Rocket className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            {/* Title */}
            <h3 
              id="future-feature-title"
              className="text-lg font-medium text-black dark:text-white mb-2"
            >
              Funcionalidad Próximamente
            </h3>

            {/* Feature name */}
            <p className="text-black/80 dark:text-white/80 mb-1 font-medium">
              {featureName}
            </p>

            {/* Description */}
            {description && (
              <p className="text-sm text-black/60 dark:text-white/60 mb-6">
                {description}
              </p>
            )}

            {/* Info box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Esta funcionalidad está en desarrollo y estará disponible en una próxima actualización.
              </p>
            </div>

            {/* Action button */}
            <button
              onClick={onClose}
              className="
                w-full px-6 py-2.5 rounded-lg
                bg-blue-600 hover:bg-blue-700
                text-white font-medium
                transition-colors
              "
            >
              Entendido
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
