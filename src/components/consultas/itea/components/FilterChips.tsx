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
      case 'color': return 'COLOR';
      default: return '';
    }
  };

  const getColorHex = (colorName: string) => {
    const name = colorName.toUpperCase();
    switch (name) {
      case 'ROJO': return '#ef4444';
      case 'BLANCO': return '#ffffff';
      case 'VERDE': return '#22c55e';
      case 'AMARILLO': return '#eab308';
      case 'AZUL': return '#3b82f6';
      case 'NARANJA': return '#f97316';
      default: return '#9ca3af';
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
        {activeFilters.map((filter, index) => {
          const isColorFilter = filter.type === 'color';
          const colorHex = isColorFilter ? getColorHex(filter.term) : null;
          const isWhiteColor = filter.term.toUpperCase() === 'BLANCO';
          
          return (
            <motion.div
              key={`${filter.type}-${filter.term}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isColorFilter && colorHex
                  ? ''
                  : isDarkMode
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-black/5 border-black/10 text-black'
              }`}
              style={isColorFilter && colorHex ? {
                backgroundColor: `${colorHex}f0`,
                borderColor: colorHex,
                color: isWhiteColor ? '#000000' : '#ffffff',
                borderWidth: '2px'
              } : undefined}
            >
              {isColorFilter && colorHex && (
                <div 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: colorHex,
                    border: isWhiteColor ? `1.5px solid ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)'}` : 'none'
                  }}
                />
              )}
              <span className={isColorFilter ? 'font-bold' : (isDarkMode ? 'text-white/60' : 'text-gray-600')}>
                {getTypeLabel(filter.type)}:
              </span>
              <span className="max-w-[200px] truncate font-semibold">
                {filter.term}
              </span>
              <button
                onClick={() => onRemoveFilter(index)}
                className={`ml-1 rounded-full p-0.5 transition-colors ${
                  isColorFilter
                    ? isWhiteColor
                      ? 'hover:bg-black/10 text-black/70 hover:text-black'
                      : 'hover:bg-white/20 text-white/80 hover:text-white'
                    : isDarkMode 
                      ? 'text-white/60 hover:text-white hover:bg-white/10' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-black/10'
                }`}
                aria-label="Eliminar filtro"
              >
                <X size={12} />
              </button>
            </motion.div>
          );
        })}
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
