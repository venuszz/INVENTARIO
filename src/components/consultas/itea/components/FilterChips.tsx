import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActiveFilter } from '../types';

interface FilterChipsProps {
  activeFilters: ActiveFilter[];
  onRemoveFilter: (index: number) => void;
  onClearAll: () => void;
  isDarkMode: boolean;
}

export default function FilterChips({
  activeFilters,
  onRemoveFilter,
  onClearAll,
  isDarkMode
}: FilterChipsProps) {
  if (activeFilters.length === 0) return null;

  const getTypeLabel = (type: ActiveFilter['type']) => {
    switch (type) {
      case 'id': return 'ID';
      case 'area': return 'ÁREA';
      case 'usufinal': return 'DIRECTOR';
      case 'resguardante': return 'RESGUARDANTE';
      case 'descripcion': return 'DESCRIPCIÓN';
      case 'rubro': return 'RUBRO';
      case 'estado': return 'ESTADO';
      case 'estatus': return 'ESTATUS';
      default: return '';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className={`text-xs font-medium ${
        isDarkMode ? 'text-white/60' : 'text-gray-600'
      }`}>
        Filtros activos:
      </span>
      
      <AnimatePresence mode="popLayout">
        {activeFilters.map((filter, index) => (
          <motion.div
            key={`${filter.type}-${filter.term}-${index}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isDarkMode
                ? 'bg-white/5 border-white/10 text-white'
                : 'bg-black/5 border-black/10 text-black'
            }`}
          >
            <span className={isDarkMode ? 'text-white/60' : 'text-gray-600'}>
              {getTypeLabel(filter.type)}:
            </span>
            <span className="max-w-[200px] truncate">
              {filter.term}
            </span>
            <button
              onClick={() => onRemoveFilter(index)}
              className={`ml-1 hover:bg-white/10 rounded-full p-0.5 transition-colors ${
                isDarkMode ? 'text-white/60 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Eliminar filtro"
            >
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {activeFilters.length > 1 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onClearAll}
          className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
            isDarkMode
              ? 'border-red-500/20 text-red-400 hover:bg-red-500/10'
              : 'border-red-500/20 text-red-600 hover:bg-red-50'
          }`}
        >
          Limpiar todos
        </motion.button>
      )}
    </div>
  );
}
