/**
 * Pagination component for Consultar Resguardos
 * Provides pagination controls and rows per page selector
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

/**
 * Pagination component
 * @param currentPage - Current page number
 * @param totalPages - Total number of pages
 * @param rowsPerPage - Number of rows per page
 * @param totalItems - Total number of items
 * @param onPageChange - Handler for page changes
 * @param onRowsPerPageChange - Handler for rows per page changes
 */
export function Pagination({
  currentPage,
  totalPages,
  rowsPerPage,
  totalItems,
  onPageChange,
  onRowsPerPageChange
}: PaginationProps) {
  const { isDarkMode } = useTheme();
  const rowsOptions = [10, 25, 50, 100];

  const handleRowsRotate = () => {
    const currentIndex = rowsOptions.indexOf(rowsPerPage);
    const nextIndex = (currentIndex + 1) % rowsOptions.length;
    onRowsPerPageChange(rowsOptions[nextIndex]);
    onPageChange(1);
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 ${
      isDarkMode ? 'text-white' : 'text-black'
    }`}>
      <div className="flex items-center gap-3">
        <span className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
          Mostrar
        </span>
        
        <button
          onClick={handleRowsRotate}
          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
            isDarkMode
              ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              : 'bg-black/5 border-black/10 text-black hover:bg-black/10'
          }`}
          title="Cambiar filas por página"
        >
          {rowsPerPage}
        </button>

        <span className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
          registros
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
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
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage >= totalPages}
          className={`p-2 rounded-lg border transition-all ${
            currentPage >= totalPages
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
