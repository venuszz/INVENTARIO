import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  setCurrentPage: (page: number) => void;
  setRowsPerPage: (rows: number) => void;
  isDarkMode: boolean;
}

/**
 * Pagination component for the Bajas table
 * Displays page info, rows per page selector, and navigation buttons
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  rowsPerPage,
  setCurrentPage,
  setRowsPerPage,
  isDarkMode
}) => {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border shadow-inner mb-4 ${
      isDarkMode
        ? 'bg-gray-900/30 border-gray-800'
        : 'bg-gray-50/50 border-gray-200'
    }`}>
      <div className="flex items-center space-x-4">
        <span className={`text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Página {currentPage} de {totalPages}
        </span>
        <select
          title='Resguardos por página'
          value={rowsPerPage}
          onChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className={`border rounded-lg text-sm py-1.5 px-3 focus:outline-none focus:ring-2 transition-all duration-300 ${
            isDarkMode
              ? 'bg-black border-gray-800 text-white focus:ring-red-500 hover:border-gray-700'
              : 'bg-white border-gray-300 text-gray-900 focus:ring-red-500 hover:border-red-400'
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
          onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg ${
            currentPage === 1
              ? (isDarkMode
                ? 'text-gray-600 bg-black cursor-not-allowed'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
              )
              : (isDarkMode
                ? 'text-white bg-black hover:bg-gray-900 border border-gray-800 hover:border-gray-600 transition-colors'
                : 'text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 hover:border-red-400 transition-colors'
              )
          }`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          title='Siguiente'
          onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage >= totalPages}
          className={`p-2 rounded-lg ${
            currentPage >= totalPages
              ? (isDarkMode
                ? 'text-gray-600 bg-black cursor-not-allowed'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
              )
              : (isDarkMode
                ? 'text-white bg-black hover:bg-gray-900 border border-gray-800 hover:border-gray-600 transition-colors'
                : 'text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 hover:border-red-400 transition-colors'
              )
          }`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
