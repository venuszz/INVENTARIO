import { Search, X } from 'lucide-react';
import { ActiveFilter } from '../types';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchMatchType: ActiveFilter['type'];
  handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleInputBlur: () => void;
  isDarkMode: boolean;
}

export default function SearchBar({
  searchTerm,
  setSearchTerm,
  searchMatchType,
  handleInputKeyDown,
  handleInputBlur,
  isDarkMode
}: SearchBarProps) {
  const getTypeLabel = (type: ActiveFilter['type']) => {
    switch (type) {
      case 'id': return 'ID';
      case 'area': return 'Área';
      case 'usufinal': return 'Director';
      case 'resguardante': return 'Resguardante';
      case 'descripcion': return 'Descripción';
      case 'rubro': return 'Rubro';
      case 'estado': return 'Estado';
      case 'estatus': return 'Estatus';
      default: return null;
    }
  };

  const typeLabel = searchMatchType ? getTypeLabel(searchMatchType) : null;

  return (
    <div className="relative">
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
          className={`w-full pl-10 pr-24 py-2.5 border rounded-lg text-sm font-light focus:outline-none transition-all ${
            isDarkMode
              ? 'bg-white/[0.02] border-white/10 text-white placeholder-white/30 focus:border-white/20 focus:bg-white/[0.04]'
              : 'bg-black/[0.02] border-black/10 text-black placeholder-black/30 focus:border-black/20 focus:bg-black/[0.04]'
          }`}
        />
        
        {/* Type Badge */}
        {typeLabel && (
          <div className={`absolute right-10 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-xs font-medium ${
            isDarkMode
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-blue-500/20 text-blue-600'
          }`}>
            {typeLabel}
          </div>
        )}

        {/* Clear Button */}
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${
              isDarkMode
                ? 'hover:bg-white/10 text-white/40 hover:text-white/60'
                : 'hover:bg-black/10 text-black/40 hover:text-black/60'
            }`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
