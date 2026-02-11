import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette } from 'lucide-react';
import { Color } from '@/hooks/useColorManagement';

interface ColorAssignmentModalProps {
  show: boolean;
  itemIdInv: string | null;
  currentColor: Color | null;
  colors: Color[];
  onAssign: (colorId: string) => void;
  onRemove: () => void;
  onClose: () => void;
  isDarkMode: boolean;
  isAssigning: boolean;
}

export default function ColorAssignmentModal({
  show,
  itemIdInv,
  currentColor,
  colors,
  onAssign,
  onRemove,
  onClose,
  isDarkMode,
  isAssigning
}: ColorAssignmentModalProps) {
  if (!show) return null;

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
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`w-full max-w-md rounded-2xl border p-6 shadow-xl ${
            isDarkMode
              ? 'bg-black border-white/10'
              : 'bg-white border-black/10'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                isDarkMode ? 'bg-white/5' : 'bg-black/5'
              }`}>
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Asignar Color</h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                  {itemIdInv}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isAssigning}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-white/5'
                  : 'hover:bg-black/5'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Current Color */}
          {currentColor && (
            <div className={`mb-4 p-3 rounded-lg border ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10'
                : 'bg-black/[0.02] border-black/10'
            }`}>
              <p className={`text-xs mb-2 ${
                isDarkMode ? 'text-white/60' : 'text-black/60'
              }`}>
                Color actual
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border-2"
                  style={{
                    backgroundColor: getColorHex(currentColor.nombre),
                    borderColor: currentColor.nombre === 'BLANCO'
                      ? isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'
                      : 'transparent'
                  }}
                />
                <div>
                  <p className="font-medium">{currentColor.nombre}</p>
                  {currentColor.significado && (
                    <p className={`text-xs ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`}>
                      {currentColor.significado}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Color Options */}
          <div className="space-y-2 mb-6">
            <p className={`text-xs mb-3 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}>
              Selecciona un color
            </p>
            {colors.map((color) => (
              <button
                key={color.id}
                onClick={() => onAssign(color.id)}
                disabled={isAssigning || currentColor?.id === color.id}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  currentColor?.id === color.id
                    ? isDarkMode
                      ? 'bg-white/10 border-white/20'
                      : 'bg-black/10 border-black/20'
                    : isDarkMode
                      ? 'bg-white/[0.02] border-white/10 hover:bg-white/5'
                      : 'bg-black/[0.02] border-black/10 hover:bg-black/5'
                } ${isAssigning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full border-2 flex-shrink-0"
                    style={{
                      backgroundColor: getColorHex(color.nombre),
                      borderColor: color.nombre === 'BLANCO'
                        ? isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'
                        : 'transparent'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{color.nombre}</p>
                    {color.significado && (
                      <p className={`text-xs ${
                        isDarkMode ? 'text-white/60' : 'text-black/60'
                      }`}>
                        {color.significado}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {currentColor && (
              <button
                onClick={onRemove}
                disabled={isAssigning}
                className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-white/[0.02] border-white/10 hover:bg-white/5'
                    : 'bg-black/[0.02] border-black/10 hover:bg-black/5'
                } ${isAssigning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Remover Color
              </button>
            )}
            <button
              onClick={onClose}
              disabled={isAssigning}
              className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 hover:bg-white/10'
                  : 'bg-black/5 border-black/10 hover:bg-black/10'
              } ${isAssigning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
