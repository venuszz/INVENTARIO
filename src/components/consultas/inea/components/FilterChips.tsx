import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActiveFilter } from '../types';

interface FilterChipsProps {
  activeFilters: ActiveFilter[];
  removeFilter: (index: number) => void;
  clearAllFilters: () => void;
  isDarkMode: boolean;
}

export default function FilterChips({
  activeFilters,
  removeFilter,
  clearAllFilters,
  isDarkMode
}: FilterChipsProps) {
  if (activeFilters.length === 0) return null;

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
      default: return 'Filtro';
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <AnimatePresence mode="popLayout">
        {activeFilters.map((filter, index) => (
          <motion.div
            key={`${filter.type}-${filter.term}-${index}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
              isDarkMode
                ? 'bg-white/5 border-white/10 text-white'
                : 'bg-black/5 border-black/10 text-black'
            }`}
          >
            <span className={isDarkMode ? 'text-white/50' : 'text-black/50'}>
              {getTypeLabel(filter.type)}:
            </span>
            <span className="max-w-[150px] truncate">{filter.term}</span>
            <button
              type="button"
              onClick={() => removeFilter(index)}
              className={`p-0.5 rounded transition-colors ${
                isDarkMode
                  ? 'hover:bg-white/10 text-white/60 hover:text-white'
                  : 'hover:bg-black/10 text-black/60 hover:text-black'
              }`}
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {activeFilters.length > 1 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          type="button"
          onClick={clearAllFilters}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            isDarkMode
              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
              : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
          }`}
        >
          Limpiar todo
        </motion.button>
      )}
    </div>
  );
}
