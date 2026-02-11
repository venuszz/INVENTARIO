import { Search } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isDarkMode: boolean;
}

export function SearchBar({ searchTerm, setSearchTerm, isDarkMode }: SearchBarProps) {
  return (
    <div className="relative flex-grow group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className={`h-5 w-5 transition-colors duration-300 ${
          isDarkMode 
            ? 'text-gray-500 group-hover:text-gray-300' 
            : 'text-gray-400 group-hover:text-gray-600'
        }`} />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar por ID, descripción o usuario..."
        className={`pl-12 pr-4 py-3 w-full border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${
          isDarkMode 
            ? 'bg-black border-gray-700 text-white placeholder-gray-500 focus:ring-white/50 hover:border-gray-600' 
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 hover:border-gray-400'
        }`}
      />
    </div>
  );
}
