import { useState, useEffect } from 'react';
import { X, XOctagon, FileText, Loader2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useFolioGenerator } from '@/hooks/useFolioGenerator';
import { ResguardoArticulo } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Props for DeleteSelectedModal component
 */
interface DeleteSelectedModalProps {
  show: boolean;
  selectedCount: number;
  articulos: ResguardoArticulo[];
  selectedArticulos: string[];
  folio: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

/**
 * DeleteSelectedModal - Confirmation modal for deleting multiple selected articles
 * 
 * Displays a warning message with the count of selected articles and a scrollable list.
 * Uses red theme to indicate destructive action.
 * 
 * @param show - Whether to show the modal
 * @param selectedCount - Number of selected articles
 * @param articulos - All articles in the resguardo
 * @param selectedArticulos - Array of selected article IDs
 * @param folio - The resguardo folio
 * @param onConfirm - Handler for confirm button
 * @param onCancel - Handler for cancel button
 * @param isDeleting - Whether deletion is in progress
 */
export default function DeleteSelectedModal({
  show,
  selectedCount,
  articulos,
  selectedArticulos,
  folio,
  onConfirm,
  onCancel,
  isDeleting
}: DeleteSelectedModalProps) {
  const { isDarkMode } = useTheme();
  const { previewNextFolio } = useFolioGenerator();
  const [folioBajaPreview, setFolioBajaPreview] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Load folio preview when modal opens
  useEffect(() => {
    if (show) {
      setLoadingPreview(true);
      previewNextFolio('BAJA')
        .then(preview => setFolioBajaPreview(preview))
        .catch(err => console.error('Error loading folio preview:', err))
        .finally(() => setLoadingPreview(false));
    }
  }, [show, previewNextFolio]);

  if (!show) return null;

  const selectedArticulosData = articulos.filter(a => selectedArticulos.includes(a.num_inventario || ''));

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm ${
            isDarkMode ? 'bg-black/80' : 'bg-black/50'
          }`}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`rounded-lg border w-full max-w-md overflow-hidden backdrop-blur-xl ${
              isDarkMode ? 'bg-black/95 border-white/10' : 'bg-white/95 border-black/10'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
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
                      ¿Eliminar artículos seleccionados?
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`}>
                      {selectedCount} {selectedCount === 1 ? 'artículo' : 'artículos'}
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={onCancel}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'hover:bg-white/10 text-white'
                      : 'hover:bg-black/10 text-black'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* Articles list */}
              <div className={`rounded-lg border p-3 mb-4 ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <label className={`block text-xs font-medium mb-2 ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                  Artículos a eliminar del resguardo {folio}
                </label>
                <ul className={`max-h-40 overflow-y-auto space-y-1.5 ${
                  isDarkMode
                    ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20'
                    : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20'
                }`}>
                  {selectedArticulosData.map(a => (
                    <li key={a.num_inventario} className={`flex items-start gap-2 p-2 rounded border ${
                      isDarkMode
                        ? 'bg-white/5 border-white/10 text-white/70'
                        : 'bg-black/5 border-black/10 text-black/70'
                    }`}>
                      <FileText size={14} className={`mt-0.5 flex-shrink-0 ${
                        isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-xs font-medium block">{a.num_inventario}</span>
                        <span className="text-xs truncate block">{a.descripcion}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Warning message */}
              <div className={`rounded-lg border p-3 mb-4 ${
                isDarkMode
                  ? 'bg-yellow-500/10 border-yellow-500/20'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <p className={`text-xs ${
                  isDarkMode ? 'text-yellow-200/80' : 'text-yellow-800'
                }`}>
                  Los bienes quedarán libres para asignarse nuevamente. Se eliminará el responsable y área de los registros originales.
                </p>
              </div>

              {/* Folio Preview with Skeleton */}
              <div className={`rounded-lg border p-3 mb-6 ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10'
                  : 'bg-black/[0.02] border-black/10'
              }`}>
                <label className={`block text-xs font-medium mb-1.5 ${
                  isDarkMode ? 'text-white/60' : 'text-black/60'
                }`}>
                  Folio de baja que se generará
                </label>
                {loadingPreview ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className={`animate-spin ${
                      isDarkMode ? 'text-white/40' : 'text-black/40'
                    }`} />
                    <div className={`h-5 w-32 rounded animate-pulse ${
                      isDarkMode ? 'bg-white/10' : 'bg-black/10'
                    }`} />
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2"
                  >
                    <FileText size={16} className={isDarkMode ? 'text-white/60' : 'text-black/60'} />
                    <span className={`text-sm font-mono font-medium ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>
                      {folioBajaPreview}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <motion.button
                  onClick={onCancel}
                  disabled={isDeleting}
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    isDarkMode
                      ? 'bg-black border-white/10 text-white hover:border-white/20 hover:bg-white/[0.02]'
                      : 'bg-white border-black/10 text-black hover:border-black/20 hover:bg-black/[0.02]'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  onClick={onConfirm}
                  disabled={isDeleting || loadingPreview}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    isDeleting || loadingPreview
                      ? 'bg-red-600/50 text-white cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                  whileHover={!isDeleting && !loadingPreview ? { scale: 1.01 } : {}}
                  whileTap={!isDeleting && !loadingPreview ? { scale: 0.99 } : {}}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Eliminando...
                    </>
                  ) : loadingPreview ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    'Eliminar seleccionados'
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
