import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { ActiveFilter } from '../hooks/useSearchAndFilters';

interface FilterChipsProps {
  activeFilters: ActiveFilter[];
  removeFilter: (index: number) => void;
  clearAllFilters: () => void;
  isDarkMode: boolean;
}

export function FilterChips({
  activeFilters,
  removeFilter,
  clearAllFilters,
  isDarkMode
}: FilterChipsProps) {
  const getFilterLabel = (type: ActiveFilter['type']) => {
    switch (type) {
      case 'id': return 'ID';
      case 'descripcion': return 'Descripción';
      case 'area': return 'Área';
      case 'usufinal': return 'Director';
      case 'resguardante': return 'Resguardante';
      case 'rubro': return 'Rubro';
      case 'estado': return 'Estado';
      case 'estatus': return 'Estatus';
      default: return 'Filtro';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeFilters.map((filter, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-light tracking-tight ${
            isDarkMode
              ? 'bg-white/5 border-white/10 text-white'
              : 'bg-black/5 border-black/10 text-black'
          }`}
        >
          <span className={isDarkMode ? 'text-white/60' : 'text-black/60'}>
            {getFilterLabel(filter.type)}:
          </span>
          <span>{filter.term}</span>
          <button
            onClick={() => removeFilter(index)}
            className={`ml-1 hover:opacity-70 transition-opacity ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            <X className="h-3 w-3" />
          </button>
        </motion.div>
      ))}
      {activeFilters.length > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={clearAllFilters}
          className={`px-3 py-1.5 rounded-lg border text-sm font-light tracking-tight transition-all ${
            isDarkMode
              ? 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
              : 'bg-black/[0.02] border-black/10 text-black/60 hover:bg-black/5 hover:text-black'
          }`}
        >
          Limpiar todo
        </motion.button>
      )}
    </div>
  );
}
