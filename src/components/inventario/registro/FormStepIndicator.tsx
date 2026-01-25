import React from 'react';
import { motion } from 'framer-motion';
import { FormStepIndicatorProps } from './types';

export default function FormStepIndicator({ 
  currentStep, 
  isStepComplete, 
  onStepClick, 
  isDarkMode 
}: FormStepIndicatorProps) {
  const steps = [
    { number: 0, label: 'Institución' },
    { number: 1, label: 'Información Básica' },
    { number: 2, label: 'Ubicación y Estado' },
    { number: 3, label: 'Detalles Adicionales' }
  ];

  const handleStepClick = (stepNumber: number) => {
    // Allow navigation to step 0 and 1 always, or to completed steps
    if (stepNumber === 0 || stepNumber === 1 || (stepNumber === 2 && isStepComplete(1)) || (stepNumber === 3 && isStepComplete(1) && isStepComplete(2))) {
      onStepClick(stepNumber);
    }
  };

  return (
    <div className="flex gap-6">
      {steps.map((step, index) => {
        const isActive = currentStep === step.number;
        const isClickable = step.number === 0 || step.number === 1 || 
          (step.number === 2 && isStepComplete(1)) || 
          (step.number === 3 && isStepComplete(1) && isStepComplete(2));
        const isCompleted = isStepComplete(step.number);

        return (
          <motion.button
            key={step.number}
            onClick={() => handleStepClick(step.number)}
            disabled={!isClickable}
            className={`relative text-sm font-medium pb-3 transition-colors ${
              isActive
                ? isDarkMode ? 'text-white' : 'text-black'
                : isClickable
                  ? isDarkMode ? 'text-white/60 hover:text-white/80' : 'text-black/60 hover:text-black/80'
                  : isDarkMode ? 'text-white/20 cursor-not-allowed' : 'text-black/20 cursor-not-allowed'
            }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <span className="flex items-center gap-2">
              {/* Step number badge */}
              <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs transition-colors ${
                isActive
                  ? isDarkMode 
                    ? 'bg-white text-black' 
                    : 'bg-black text-white'
                  : isCompleted
                    ? isDarkMode
                      ? 'bg-white/20 text-white/80'
                      : 'bg-black/20 text-black/80'
                    : isDarkMode
                      ? 'bg-white/10 text-white/40'
                      : 'bg-black/10 text-black/40'
              }`}>
                {step.number === 0 ? '•' : step.number}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </span>
            
            {/* Active indicator line */}
            {isActive && (
              <motion.div
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDarkMode ? 'bg-white' : 'bg-black'}`}
                layoutId="activeStepIndicator"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
