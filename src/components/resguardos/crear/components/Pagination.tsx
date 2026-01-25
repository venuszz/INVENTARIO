/**
 * Pagination component
 * Provides page navigation and rows per page selector
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
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

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border shadow-inner mb-4 hover:shadow-lg transition-shadow ${
      isDarkMode
        ? 'bg-gray-900/30 border-gray-800'
        : 'bg-gray-50/50 border-gray-200'
    }`}>
      <div className="flex items-center space-x-4">
        <span className={`text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Página <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
            {currentPage}
          </span> de <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
            {totalPages}
          </span>
        </span>
        <select
          title='Artículos por página'
          value={rowsPerPage}
          onChange={(e) => {
            onRowsPerPageChange(Number(e.target.value));
            onPageChange(1);
          }}
          className={`border rounded-lg text-sm py-1.5 px-3 focus:outline-none focus:ring-2 transition-colors ${
            isDarkMode
              ? 'bg-black border-gray-800 text-white focus:ring-white hover:border-white'
              : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 hover:border-blue-400'
          }`}
        >
          <option value={10}>10 por página</option>
          <option value={25}>25 por página</option>
          <option value={50}>50 por página</option>
          <option value={100}>100 por página</option>
        </select>
      </div>
      <div className="flex items-center space-x-2">
        <button
          title='Anterior'
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-colors ${
            currentPage === 1
              ? (isDarkMode
                ? 'text-gray-600 bg-black cursor-not-allowed'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
              )
              : (isDarkMode
                ? 'text-white bg-black hover:bg-gray-900 border border-gray-800 hover:border-white'
                : 'text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 hover:border-blue-400'
              )
          }`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          title='Siguiente'
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage >= totalPages}
          className={`p-2 rounded-lg transition-colors ${
            currentPage >= totalPages
              ? (isDarkMode
                ? 'text-gray-600 bg-black cursor-not-allowed'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
              )
              : (isDarkMode
                ? 'text-white bg-black hover:bg-gray-900 border border-gray-800 hover:border-white'
                : 'text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 hover:border-blue-400'
              )
          }`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
