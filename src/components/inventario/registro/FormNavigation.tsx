import React from 'react';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { FormNavigationProps } from './types';

export default function FormNavigation({
  currentStep,
  isStepComplete,
  isSubmitting,
  onPrevious,
  onNext,
  onSubmit,
  isDarkMode
}: FormNavigationProps) {
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
            onClick={onNext}
            disabled={!isStepComplete(currentStep)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all ${
              isStepComplete(currentStep)
                ? isDarkMode
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'bg-black text-white hover:bg-black/90'
                : isDarkMode
                  ? 'bg-white/10 text-white/30 cursor-not-allowed'
                  : 'bg-black/10 text-black/30 cursor-not-allowed'
            }`}
            whileHover={isStepComplete(currentStep) ? { x: 4 } : {}}
            whileTap={isStepComplete(currentStep) ? { scale: 0.95 } : {}}
          >
            <span>Siguiente</span>
            <ChevronRight size={18} />
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
