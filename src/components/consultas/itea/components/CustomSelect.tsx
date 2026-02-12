import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomSelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
  isDarkMode: boolean;
  disabled?: boolean;
  className?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  isDarkMode,
  disabled = false,
  className = ''
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string | number) => {
    onChange(String(optionValue));
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full border rounded-lg px-3 py-2 text-sm font-light focus:outline-none transition-all text-left flex items-center justify-between ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        } ${
          isDarkMode
            ? 'bg-white/[0.02] border-white/10 text-white focus:border-white/20 focus:bg-white/[0.04]'
            : 'bg-black/[0.02] border-black/10 text-black focus:border-black/20 focus:bg-black/[0.04]'
        }`}
      >
        <span className={selectedOption ? '' : isDarkMode ? 'text-white/30' : 'text-black/30'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''} ${
            isDarkMode ? 'text-white/40' : 'text-black/40'
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 w-full mt-1 border rounded-lg shadow-lg overflow-hidden ${
              isDarkMode
                ? 'bg-black border-white/10 shadow-black/50'
                : 'bg-white border-black/10 shadow-black/10'
            }`}
          >
            <div className="max-h-60 overflow-y-auto scrollbar-thin">
              {options.map((option, index) => (
                <motion.button
                  key={`${option.value}-${index}`}
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2 text-sm font-light text-left flex items-center justify-between transition-all ${
                    option.value === value
                      ? isDarkMode
                        ? 'bg-white/10 text-white'
                        : 'bg-black/10 text-black'
                      : isDarkMode
                      ? 'text-white/80 hover:bg-white/5'
                      : 'text-black/80 hover:bg-black/5'
                  }`}
                >
                  <span>{option.label}</span>
                  {option.value === value && (
                    <Check className={`h-3.5 w-3.5 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
