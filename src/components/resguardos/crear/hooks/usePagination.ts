/**
 * Custom hook for managing pagination state and controls
 */

import { useState, useMemo, useEffect } from 'react';
import type { Mueble } from '../types';

export interface UsePaginationReturn {
  currentPage: number;
  rowsPerPage: number;
  setCurrentPage: (page: number) => void;
  setRowsPerPage: (rows: number) => void;
  totalPages: number;
  paginatedItems: Mueble[];
}

/**
 * Hook for managing pagination
 * 
 * @param items - Array of items to paginate
 * @param initialRowsPerPage - Initial number of rows per page (default: 10)
 * @returns Object containing pagination state and functions
 */
export function usePagination(
  items: Mueble[],
  initialRowsPerPage: number = 10
): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const totalPages = Math.ceil(items.length / rowsPerPage);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, rowsPerPage]);

  // Reset to page 1 when items change
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  return {
    currentPage,
    rowsPerPage,
    setCurrentPage,
    setRowsPerPage,
    totalPages,
    paginatedItems,
  };
}
