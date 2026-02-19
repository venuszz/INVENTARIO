import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Save, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormNavigationProps } from './types';

export default function FormNavigation({
  currentStep,
  isStepComplete,
  isSubmitting,
  onPrevious,
  onNext,
  onSubmit,
  isDarkMode,
  hasDuplicateId = false,
  duplicateInstitution = null
}: FormNavigationProps & { 
  hasDuplicateId?: boolean; 
  duplicateInstitution?: 'INEA' | 'ITEA' | 'TLAXCALA' | null;
}) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleNextClick = () => {
    // If we're on step 1 and there's a duplicate ID, show confirmation
    if (currentStep === 1 && hasDuplicateId && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }
    
    // Otherwise proceed normally
    setShowConfirmation(false);
    onNext();
  };

  return (
    <motion.div 
      className={`pt-8 mt-8 border-t ${
        isDarkMode ? 'border-white/10' : 'border-black/10'
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex justify-between items-center gap-4">
        {/* Previous Button */}
        {currentStep > 1 ? (
          <motion.button
            type="button"
            onClick={onPrevious}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all ${
              isDarkMode
                ? 'text-white/60 hover:text-white'
                : 'text-black/60 hover:text-black'
            }`}
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft size={18} />
            <span>Anterior</span>
          </motion.button>
        ) : (
          <div></div>
        )}

        {/* Next/Submit Button */}
        {currentStep < 3 ? (
          <motion.button
            type="button"
            onClick={handleNextClick}
            disabled={!isStepComplete(currentStep)}
            layout
            className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all overflow-hidden ${
              showConfirmation
                ? isDarkMode
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : isStepComplete(currentStep)
                  ? isDarkMode
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-black text-white hover:bg-black/90'
                  : isDarkMode
                    ? 'bg-white/10 text-white/30 cursor-not-allowed'
                    : 'bg-black/10 text-black/30 cursor-not-allowed'
            }`}
            whileHover={isStepComplete(currentStep) && !showConfirmation ? { x: 4 } : {}}
            whileTap={isStepComplete(currentStep) ? { scale: 0.95 } : {}}
          >
            {/* Background pulse animation for confirmation state */}
            <AnimatePresence>
              {showConfirmation && (
                <motion.div
                  className={`absolute inset-0 ${
                    isDarkMode ? 'bg-amber-400/10' : 'bg-amber-500/10'
                  }`}
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0, 0.5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </AnimatePresence>

            {/* Icon with smooth transition */}
            <motion.div
              layout
              initial={false}
              animate={{ 
                rotate: showConfirmation ? [0, -10, 10, -10, 0] : 0,
                scale: showConfirmation ? 1 : 1
              }}
              transition={{ 
                rotate: showConfirmation ? { 
                  duration: 0.5, 
                  repeat: Infinity, 
                  repeatDelay: 2 
                } : { duration: 0.3 },
                scale: { duration: 0.3 }
              }}
            >
              <AnimatePresence mode="wait">
                {showConfirmation ? (
                  <motion.div
                    key="alert"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.3, type: "spring" }}
                  >
                    <AlertTriangle size={16} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>

            {/* Text with smooth transition */}
            <motion.span
              layout
              initial={false}
              animate={{ 
                opacity: 1,
                x: 0
              }}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={showConfirmation ? 'confirm' : 'next'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {showConfirmation 
                    ? `Confirmar (ID en ${duplicateInstitution})` 
                    : 'Siguiente'}
                </motion.span>
              </AnimatePresence>
            </motion.span>

            {/* Arrow icon - only show when not in confirmation */}
            <AnimatePresence>
              {!showConfirmation && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight size={18} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        ) : (
          <motion.button
            type="submit"
            onClick={onSubmit}
            disabled={isSubmitting || !isStepComplete(3)}
            className={`flex items-center gap-2 px-8 py-3 text-sm font-medium transition-all ${
              isSubmitting
                ? isDarkMode
                  ? 'bg-white/50 text-black/50 cursor-wait'
                  : 'bg-black/50 text-white/50 cursor-wait'
                : isStepComplete(3)
                  ? isDarkMode
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-black text-white hover:bg-black/90'
                  : isDarkMode
                    ? 'bg-white/10 text-white/30 cursor-not-allowed'
                    : 'bg-black/10 text-black/30 cursor-not-allowed'
            }`}
            whileHover={!isSubmitting && isStepComplete(3) ? { scale: 1.02 } : {}}
            whileTap={!isSubmitting && isStepComplete(3) ? { scale: 0.98 } : {}}
          >
            {isSubmitting ? (
              <>
                <motion.div 
                  className={`w-4 h-4 border-2 rounded-full ${
                    isDarkMode 
                      ? 'border-black/20 border-t-black' 
                      : 'border-white/20 border-t-white'
                  }`}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Guardar Registro</span>
              </>
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
