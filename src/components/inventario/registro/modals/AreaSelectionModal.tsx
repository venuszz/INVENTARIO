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

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className={`w-full max-w-md overflow-hidden transition-colors ${
            isDarkMode ? 'bg-black' : 'bg-white'
          }`}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className={`p-6 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'
                }`}>
                  <User className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-light tracking-tight mb-1">
                    Seleccione el Área
                  </h3>
                  <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                    El director tiene varias áreas asignadas
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
            <div className={`mb-4 pb-4 border-b ${
              isDarkMode ? 'border-white/10' : 'border-black/10'
            }`}>
              <label className={`block mb-2 text-xs font-medium uppercase tracking-wider ${
                isDarkMode ? 'text-white/40' : 'text-black/40'
              }`}>
                Director Seleccionado
              </label>
              <div className="flex items-center gap-3">
                <User size={16} className={isDarkMode ? 'text-white/60' : 'text-black/60'} />
                <span className="text-sm font-medium">
                  {director?.nombre || 'Director'}
                </span>
              </div>
            </div>

            <label className={`block mb-3 text-xs font-medium uppercase tracking-wider ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}>
              Áreas Disponibles
            </label>
            
            <div className="space-y-2">
              {areas.map((area, index) => (
                <motion.button
                  key={area.id_area}
                  onClick={() => onSelect(area.nombre)}
                  className={`w-full px-4 py-3 text-left text-sm border-b-2 transition-all ${
                    isDarkMode
                      ? 'border-white/10 hover:border-white/40 hover:bg-white/5'
                      : 'border-black/10 hover:border-black/40 hover:bg-black/5'
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {area.nombre}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className={`p-6 border-t flex justify-end ${
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
      </motion.div>
    </AnimatePresence>
  );
}
