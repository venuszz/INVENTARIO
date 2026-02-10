import { Hash, MapPin, User, FileText, Package, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { ActiveFilter } from '../types';

interface SuggestionDropdownProps {
  suggestions: { value: string; type: ActiveFilter['type'] }[];
  highlightedIndex: number;
  onSuggestionClick: (index: number) => void;
  isDarkMode: boolean;
}

export default function SuggestionDropdown({
  suggestions,
  highlightedIndex,
  onSuggestionClick,
  isDarkMode
}: SuggestionDropdownProps) {
  if (suggestions.length === 0) return null;

  const getIcon = (type: ActiveFilter['type']) => {
    const iconClass = "w-3.5 h-3.5";
    switch (type) {
      case 'id': return <Hash className={iconClass} />;
      case 'area': return <MapPin className={iconClass} />;
      case 'usufinal': return <User className={iconClass} />;
      case 'resguardante': return <User className={iconClass} />;
      case 'descripcion': return <FileText className={iconClass} />;
      case 'rubro': return <Package className={iconClass} />;
      default: return <Search className={iconClass} />;
    }
  };

  const getLabel = (type: ActiveFilter['type']) => {
    switch (type) {
      case 'id': return 'ID de Inventario';
      case 'area': return 'Área';
      case 'usufinal': return 'Director';
      case 'resguardante': return 'Resguardante';
      case 'descripcion': return 'Descripción';
      case 'rubro': return 'Rubro';
      case 'estado': return 'Estado';
      case 'estatus': return 'Estatus';
      default: return 'Búsqueda';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`absolute z-50 w-full mt-2 rounded-lg border shadow-lg overflow-hidden ${
        isDarkMode
          ? 'bg-black border-white/10'
          : 'bg-white border-black/10'
      }`}
    >
      <div className={`max-h-60 overflow-y-auto p-1 ${
        isDarkMode 
          ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30'
          : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20 hover:scrollbar-thumb-black/30'
      }`}>
        {suggestions.map((suggestion, index) => {
          const isSelected = index === highlightedIndex;
          return (
            <button
              key={`${suggestion.type}-${suggestion.value}-${index}`}
              type="button"
              onClick={() => onSuggestionClick(index)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150 ${
                isSelected
                  ? isDarkMode 
                    ? 'bg-white/10 text-white' 
                    : 'bg-black/10 text-black'
                  : isDarkMode
                    ? 'hover:bg-white/[0.04] text-white/90'
                    : 'hover:bg-black/[0.03] text-black/90'
              }`}
            >
              {/* Icon */}
              <span className={isSelected 
                ? (isDarkMode ? 'text-white' : 'text-black')
                : (isDarkMode ? 'text-white/40' : 'text-black/40')
              }>
                {getIcon(suggestion.type)}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate font-medium">
                  {suggestion.value}
                </div>
                <div className={`text-xs truncate ${
                  isSelected
                    ? (isDarkMode ? 'text-white/60' : 'text-black/60')
                    : (isDarkMode ? 'text-white/40' : 'text-black/40')
                }`}>
                  {getLabel(suggestion.type)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Scrollbar styles */}
      <style jsx>{`
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
        }
      `}</style>
    </motion.div>
  );
}
