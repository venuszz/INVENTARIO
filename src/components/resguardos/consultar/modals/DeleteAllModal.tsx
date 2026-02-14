/**
 * DeleteAllModal Component
 * 
 * Confirmation modal for deleting entire resguardo
 */

'use client';

import { X, XOctagon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface DeleteAllModalProps {
  show: boolean;
  folio: string;
  articulosCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

/**
 * DeleteAllModal - Confirm deletion of entire resguardo
 */
export default function DeleteAllModal({
  show,
  folio,
  articulosCount,
  onConfirm,
  onCancel,
  isDeleting
}: DeleteAllModalProps) {
  const { isDarkMode } = useTheme();

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm ${
      isDarkMode ? 'bg-black/80' : 'bg-black/50'
    }`}>
      <div className={`rounded-lg border w-full max-w-md overflow-hidden backdrop-blur-xl ${
        isDarkMode ? 'bg-black/95 border-white/10' : 'bg-white/95 border-black/10'
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                isDarkMode ? 'bg-red-500/10' : 'bg-red-50'
              }`}>
                <XOctagon size={20} className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
              </div>
              <div>
                <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  ¿Borrar todo el resguardo?
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-white/10 text-white'
                  : 'hover:bg-black/10 text-black'
              }`}
            >
              <X size={16} />
            </button>
          </div>

          {/* Message */}
          <div className={`rounded-lg border p-3 mb-6 ${
            isDarkMode
              ? 'bg-white/[0.02] border-white/10'
              : 'bg-black/[0.02] border-black/10'
          }`}>
            <p className={`text-sm ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}>
              Se eliminarán <span className="font-medium">todos los artículos</span> del resguardo{' '}
              <span className={`font-medium ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{folio}</span> de la base de datos.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'border-white/10 hover:bg-white/5 text-white'
                  : 'border-black/10 hover:bg-black/5 text-black'
              }`}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDeleting
                  ? 'bg-red-600/50 text-white cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              {isDeleting ? 'Eliminando...' : 'Borrar todo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
