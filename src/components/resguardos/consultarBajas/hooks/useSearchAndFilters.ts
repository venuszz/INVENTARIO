import { useState } from 'react';

export function useSearchAndFilters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterDirector, setFilterDirector] = useState('');
  const [filterResguardante, setFilterResguardante] = useState('');

  const resetSearch = () => {
    setSearchTerm('');
  };

  const clearFilters = () => {
    setFilterDate('');
    setFilterDirector('');
    setFilterResguardante('');
  };

  return {
    searchTerm,
    filterDate,
    filterDirector,
    filterResguardante,
    setSearchTerm,
    setFilterDate,
    setFilterDirector,
    setFilterResguardante,
    resetSearch,
    clearFilters,
  };
}
