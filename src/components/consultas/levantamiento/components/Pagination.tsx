/**
 * Pagination component for the Levantamiento table
 * 
 * Provides page navigation controls, rows-per-page selector, and record count display.
 */

import React from 'react';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

/**
 * Component props interface
 */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  isDarkMode: boolean;
}

/**
 * Pagination component
 * 
 * Renders pagination controls with:
 * - Record count display
 * - Rows-per-page selector
 * - First/Previous/Next/Last navigation buttons
 * - Numbered page buttons with ellipsis
 * - Current page indicator
 * 
 * @param props - Component props
 * @returns Pagination UI
 */
export function Pagination({
  currentPage,
  totalPages,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  isDarkMode
}: PaginationProps) {
  
  /**
   * Generate numbered page buttons with ellipsis
   */
  const renderPageButtons = () => {
    const pageButtons = [];
    const maxButtons = 5; // Maximum number of visible page buttons
    
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);
    
    // Adjust range for pages near the start
    if (currentPage <= 3) {
      end = Math.min(totalPages, maxButtons);
    }
    // Adjust range for pages near the end
    else if (currentPage >= totalPages - 2) {
      start = Math.max(1, totalPages - maxButtons + 1);
    }
    
    // Add start ellipsis if needed
    if (start > 1) {
      pageButtons.push(
        <span 
          key="start-ellipsis" 
          className={`px-2 ${isDarkMode ? 'text-neutral-500' : 'text-gray-500'}`}
        >
          ...
        </span>
      );
    }
    
    // Add numbered page buttons
    for (let i = start; i <= end; i++) {
      const isCurrentPage = i === currentPage;
      pageButtons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`mx-0.5 px-3 py-1.5 rounded-lg border text-sm font-semibold transition
            ${isCurrentPage
              ? isDarkMode 
                ? 'bg-white/10 text-white border-white/30 shadow' 
                : 'bg-blue-600 text-white border-blue-600 shadow'
              : isDarkMode 
                ? 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-white/5 hover:text-white hover:border-white/20' 
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:text-gray-900 hover:border-gray-400'
            }
          `}
          aria-current={isCurrentPage ? 'page' : undefined}
        >
          {i}
        </button>
      );
    }
    
    // Add end ellipsis if needed
    if (end < totalPages) {
      pageButtons.push(
        <span 
          key="end-ellipsis" 
          className={`px-2 ${isDarkMode ? 'text-neutral-500' : 'text-gray-500'}`}
        >
          ...
        </span>
      );
    }
    
    return pageButtons;
  };

  return (
    <>
      {/* Record count and rows-per-page selector */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mt-4 mb-3 px-2">
        {/* Record counter */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-inner ${isDarkMode ? 'bg-neutral-900/50 border-neutral-800' : 'bg-gray-100 border-gray-200'}`}>
          {totalCount === 0 ? (
            <span className={`flex items-center gap-2 ${isDarkMode ? 'text-neutral-400' : 'text-gray-600'}`}>
              <AlertCircle className={`h-4 w-4 ${isDarkMode ? 'text-neutral-500' : 'text-gray-500'}`} />
              No hay registros para mostrar
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className={isDarkMode ? 'text-neutral-300' : 'text-gray-700'}>
                Mostrando
              </span>
              <span className={`px-2 py-0.5 rounded-lg font-mono border ${isDarkMode ? 'bg-white/10 text-white border-white/30' : 'bg-white text-gray-900 border-gray-300'}`}>
                {((currentPage - 1) * rowsPerPage) + 1}–{Math.min(currentPage * rowsPerPage, totalCount)}
              </span>
              <span className={isDarkMode ? 'text-neutral-300' : 'text-gray-700'}>
                de
              </span>
              <span className={`px-2 py-0.5 rounded-lg font-mono border ${isDarkMode ? 'bg-neutral-900 text-neutral-300 border-neutral-800' : 'bg-gray-200 text-gray-700 border-gray-300'}`}>
                {totalCount}
              </span>
              <span className={isDarkMode ? 'text-neutral-400' : 'text-gray-600'}>
                registros
              </span>
              
              {/* Rows per page selector */}
              <span className={`ml-4 ${isDarkMode ? 'text-neutral-400' : 'text-gray-500'}`}>
                |
              </span>
              <label 
                htmlFor="rows-per-page" 
                className={`ml-2 text-xs ${isDarkMode ? 'text-neutral-400' : 'text-gray-600'}`}
              >
                Filas por página:
              </label>
              <select
                id="rows-per-page"
                value={rowsPerPage}
                onChange={e => onRowsPerPageChange(Number(e.target.value))}
                className={`ml-1 px-2 py-1 rounded-lg border font-mono text-xs focus:outline-none focus:ring-2 transition ${isDarkMode ? 'bg-neutral-900 border-neutral-700 text-white focus:ring-white/50 focus:border-white/50' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
              >
                {[10, 20, 30, 50, 100].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Current page indicator */}
        {totalPages > 1 && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-inner ${isDarkMode ? 'bg-neutral-900/50 border-neutral-800' : 'bg-gray-100 border-gray-200'}`}>
            <span className={isDarkMode ? 'text-neutral-400' : 'text-gray-600'}>
              Página
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`px-2.5 py-0.5 rounded-lg font-mono font-bold border min-w-[2rem] text-center transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-white/20 text-white border-white/40 hover:bg-white/30' : 'bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200'}`}>
                {currentPage}
              </span>
              <span className={isDarkMode ? 'text-neutral-500' : 'text-gray-500'}>
                /
              </span>
              <span className={`px-2.5 py-0.5 rounded-lg font-mono min-w-[2rem] text-center border ${isDarkMode ? 'bg-neutral-900 text-neutral-400 border-neutral-800' : 'bg-gray-200 text-gray-700 border-gray-300'}`}>
                {totalPages}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pagination navigation bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6 select-none">
          {/* First page button */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={`px-2 py-1 rounded-lg border transition disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode ? 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800' : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
            title="Primera página"
          >
            <ChevronLeft className="inline h-4 w-4 -mr-1" />
            <ChevronLeft className="inline h-4 w-4 -ml-2" />
          </button>

          {/* Previous page button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-2 py-1 rounded-lg border transition disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode ? 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800' : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
            title="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Numbered page buttons */}
          {renderPageButtons()}

          {/* Next page button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-2 py-1 rounded-lg border transition disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode ? 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800' : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
            title="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Last page button */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`px-2 py-1 rounded-lg border transition disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode ? 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800' : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
            title="Última página"
          >
            <ChevronRight className="inline h-4 w-4 -mr-2" />
            <ChevronRight className="inline h-4 w-4 -ml-1" />
          </button>
        </div>
      )}
    </>
  );
}
