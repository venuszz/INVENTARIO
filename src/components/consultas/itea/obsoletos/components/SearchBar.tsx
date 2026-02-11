import React from 'react';
import { Search } from 'lucide-react';
import type { ActiveFilter } from '../hooks/useSearchAndFilters';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchMatchType: ActiveFilter['type'];
  handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleInputBlur: () => void;
  isDarkMode: boolean;
}

export function SearchBar({
  searchTerm,
  setSearchTerm,
  searchMatchType,
  handleInputKeyDown,
  handleInputBlur,
  isDarkMode
}: SearchBarProps) {
  return (
    <div className="relative">
      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
        isDarkMode ? 'text-white/40' : 'text-black/40'
      }`} />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleInputKeyDown}
        onBlur={handleInputBlur}
        placeholder="Buscar por ID, descripción, área, director..."
        className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm font-light tracking-tight transition-all ${
          isDarkMode
            ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:bg-white/10 focus:border-white/20'
            : 'bg-black/5 border-black/10 text-black placeholder-black/40 focus:bg-black/10 focus:border-black/20'
        } focus:outline-none`}
      />
      {searchMatchType && (
        <div className={`absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-xs font-light ${
          isDarkMode
            ? 'bg-white/10 text-white/60'
            : 'bg-black/10 text-black/60'
        }`}>
          {searchMatchType === 'id' && 'ID'}
          {searchMatchType === 'descripcion' && 'Descripción'}
          {searchMatchType === 'area' && 'Área'}
          {searchMatchType === 'usufinal' && 'Director'}
          {searchMatchType === 'resguardante' && 'Resguardante'}
          {searchMatchType === 'rubro' && 'Rubro'}
          {searchMatchType === 'estado' && 'Estado'}
          {searchMatchType === 'estatus' && 'Estatus'}
        </div>
      )}
    </div>
  );
}
