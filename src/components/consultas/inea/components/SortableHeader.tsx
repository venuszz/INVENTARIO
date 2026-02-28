import { ChevronUp, ChevronDown } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface SortableHeaderProps<T> {
  field: T;
  label: string;
  sortField: T | null;
  sortDirection: 'asc' | 'desc';
  onSort: (field: T) => void;
}

export function SortableHeader<T extends string>({ 
  field, 
  label,
  sortField,
  sortDirection,
  onSort
}: SortableHeaderProps<T>) {
  const { isDarkMode } = useTheme();
  const isActive = sortField === field;
  
  return (
    <th
      onClick={() => onSort(field)}
      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-all ${
        isActive
          ? isDarkMode 
            ? 'text-white bg-white/[0.02]' 
            : 'text-black bg-black/[0.02]'
          : isDarkMode 
            ? 'text-white/60 hover:bg-white/[0.02] hover:text-white' 
            : 'text-black/60 hover:bg-black/[0.02] hover:text-black'
      }`}
      title={`Ordenar por ${label}`}
    >
      <div className="flex items-center gap-1.5">
        {label}
        {isActive && (
          sortDirection === 'asc' 
            ? <ChevronUp className="w-3.5 h-3.5" /> 
            : <ChevronDown className="w-3.5 h-3.5" />
        )}
      </div>
    </th>
  );
}
