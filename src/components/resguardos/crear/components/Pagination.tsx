/**
 * Pagination component
 * Provides page navigation and rows per page selector
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

/**
 * Pagination controls for table navigation
 */
export function Pagination({
  currentPage,
  totalPages,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange
}: PaginationProps) {
  const { isDarkMode } = useTheme();
  const rowsOptions = [10, 25, 50, 100];
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleRowsChange = (rows: number) => {
    onRowsPerPageChange(rows);
    onPageChange(1);
    setIsDropdownOpen(false);
  };

  return (
    <div className={`mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 ${
      isDarkMode ? 'text-white' : 'text-black'
    }`}>
      {/* Left side: Rows per page selector */}
      <div className="flex items-center gap-3">
        <span className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
          Mostrar
        </span>
        
        {/* Custom dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
              isDarkMode
                ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                : 'bg-black/5 border-black/10 text-black hover:bg-black/10'
            }`}
          >
            {rowsPerPage}
            <ChevronDown 
              size={14} 
              className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className={`absolute top-full mt-1 left-0 min-w-[80px] rounded-lg border backdrop-blur-xl shadow-lg z-50 overflow-hidden ${
                  isDarkMode 
                    ? 'bg-black/95 border-white/10' 
                    : 'bg-white/95 border-black/10'
                }`}
              >
                {rowsOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleRowsChange(option)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                      option === rowsPerPage
                        ? isDarkMode
                          ? 'bg-white/10 text-white'
                          : 'bg-black/10 text-black'
                        : isDarkMode
                          ? 'text-white/80 hover:bg-white/5'
                          : 'text-black/80 hover:bg-black/5'
                    }`}
                  >
                    <span>{option}</span>
                    {option === rowsPerPage && (
                      <Check size={14} className={isDarkMode ? 'text-white' : 'text-black'} />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
          registros
        </span>
      </div>

      {/* Right side: Page navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg border transition-all ${
            currentPage === 1
              ? isDarkMode
                ? 'border-white/5 text-white/20 cursor-not-allowed'
                : 'border-black/5 text-black/20 cursor-not-allowed'
              : isDarkMode
                ? 'border-white/10 text-white hover:bg-white/5'
                : 'border-black/10 text-black hover:bg-black/5'
          }`}
          title="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>

        <div className={`flex items-center gap-2 px-3 py-1.5 text-sm ${
          isDarkMode ? 'text-white/80' : 'text-black/80'
        }`}>
          <span className="font-medium">{currentPage}</span>
          <span className={isDarkMode ? 'text-white/40' : 'text-black/40'}>de</span>
          <span className="font-medium">{totalPages}</span>
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg border transition-all ${
            currentPage === totalPages
              ? isDarkMode
                ? 'border-white/5 text-white/20 cursor-not-allowed'
                : 'border-black/5 text-black/20 cursor-not-allowed'
              : isDarkMode
                ? 'border-white/10 text-white hover:bg-white/5'
                : 'border-black/10 text-black hover:bg-black/5'
          }`}
          title="Página siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
