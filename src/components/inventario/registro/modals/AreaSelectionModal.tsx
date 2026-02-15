import React from 'react';
import { User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaSelectionModalProps } from '../types';

export default function AreaSelectionModal({
  isOpen,
  director,
  areas,
  onSelect,
  onCancel,
  isDarkMode
}: AreaSelectionModalProps) {
  if (!isOpen) return null;

  // Filter out areas without valid id_area and remove duplicates
  const validAreas = areas.filter((area, index, self) => 
    area.id_area && 
    area.nombre && 
    self.findIndex(a => a.id_area === area.id_area) === index
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="area-selection-modal"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className={`w-full max-w-3xl overflow-hidden transition-colors ${
              isDarkMode ? 'bg-black' : 'bg-white'
            }`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
          >
          {/* Header */}
          <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'
                }`}>
                  <User className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-light tracking-tight">
                    Seleccione el Área
                  </h3>
                  <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                    Director: <span className="font-medium">{director?.nombre || 'Director'}</span>
                  </p>
                </div>
              </div>
              <motion.button
                onClick={onCancel}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={18} />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <label className={`block mb-3 text-xs font-medium uppercase tracking-wider ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}>
              Áreas Disponibles ({validAreas.length})
            </label>
            
            {/* Grid with max height and scroll */}
            <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 ${
              isDarkMode 
                ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30'
                : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20 hover:scrollbar-thumb-black/30'
            }`}>
              {validAreas.map((area, index) => (
                <motion.button
                  key={`area-${area.id_area}-${index}`}
                  onClick={() => onSelect(area.nombre, area.id_area)}
                  className={`px-4 py-3 text-left text-sm rounded-lg border-2 transition-all min-h-[60px] flex items-center ${
                    isDarkMode
                      ? 'border-white/10 hover:border-white/40 hover:bg-white/5'
                      : 'border-black/10 hover:border-black/40 hover:bg-black/5'
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="font-medium leading-tight break-words w-full">{area.nombre}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className={`px-6 py-4 border-t flex justify-end ${
            isDarkMode ? 'border-white/10' : 'border-black/10'
          }`}>
            <motion.button
              onClick={onCancel}
              className={`px-6 py-2.5 text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'text-white/60 hover:text-white'
                  : 'text-black/60 hover:text-black'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancelar
            </motion.button>
          </div>
        </motion.div>

        {/* Custom scrollbar styles */}
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
      )}
    </AnimatePresence>
  );
}
