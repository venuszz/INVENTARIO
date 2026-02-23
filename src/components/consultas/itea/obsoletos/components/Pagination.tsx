import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  isDarkMode: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  isDarkMode
}: PaginationProps) {
  
  const rowsOptions = [25, 50, 100];

  const handleRowsRotate = () => {
    const currentIndex = rowsOptions.indexOf(rowsPerPage);
    const nextIndex = (currentIndex + 1) % rowsOptions.length;
    onRowsPerPageChange(rowsOptions[nextIndex]);
  };

  const startRange = (currentPage - 1) * rowsPerPage + 1;
  const endRange = Math.min(currentPage * rowsPerPage, totalCount);

  return (
    <div className={`mt-[1.5vw] flex flex-col sm:flex-row items-center justify-between gap-[1vw] px-[1vw] py-[0.75vw] ${
      isDarkMode ? 'text-white' : 'text-black'
    }`}>
      <div className="flex items-center gap-[0.75vw]">
        <span className={`text-[0.875rem] ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
          Mostrar
        </span>
        
        <button
          onClick={handleRowsRotate}
          className={`px-[0.75vw] py-[0.375vw] rounded-lg border text-[0.875rem] font-medium transition-all ${
            isDarkMode
              ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              : 'bg-black/5 border-black/10 text-black hover:bg-black/10'
          }`}
          title="Cambiar filas por página"
        >
          {rowsPerPage}
        </button>

        <span className={`text-[0.875rem] ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
          registros
        </span>
      </div>

      <div className={`text-[0.875rem] ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
        {startRange}-{endRange} de {totalCount}
      </div>

      <div className="flex items-center gap-[0.5vw]">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-[0.5vw] rounded-lg border transition-all ${
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
          <ChevronLeft className="h-[1vw] w-[1vw] min-h-[14px] min-w-[14px]" />
        </button>

        <div className={`flex items-center gap-[0.5vw] px-[0.75vw] py-[0.375vw] text-[0.875rem] ${
          isDarkMode ? 'text-white/80' : 'text-black/80'
        }`}>
          <span className="font-medium">{currentPage}</span>
          <span className={isDarkMode ? 'text-white/40' : 'text-black/40'}>de</span>
          <span className="font-medium">{totalPages}</span>
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-[0.5vw] rounded-lg border transition-all ${
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
          <ChevronRight className="h-[1vw] w-[1vw] min-h-[14px] min-w-[14px]" />
        </button>
      </div>
    </div>
  );
}
