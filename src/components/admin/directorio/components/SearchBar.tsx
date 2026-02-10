'use client';

import { Search } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultCount: number;
  totalCount: number;
}

/**
 * Search bar component with result count display
 */
export function SearchBar({ 
  value, 
  onChange, 
  placeholder = 'Buscar...', 
  resultCount,
  totalCount 
}: SearchBarProps) {
  const { isDarkMode } = useTheme();

  return (
    <div className="relative">
      <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm transition-all ${isDarkMode
          ? 'bg-black border-white/10 text-white placeholder:text-white/40 focus:border-white/20'
          : 'bg-white border-black/10 text-black placeholder:text-black/40 focus:border-black/20'
        } focus:outline-none`}
      />
    </div>
  );
}
