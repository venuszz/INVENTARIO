'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Loader2, Package } from 'lucide-react';
import supabase from '@/app/lib/supabase/client';
import type { Directorio, Area } from '@/types/admin';
import type { ResguardoSummary, GoodSummary } from '../types';
import { FutureFeatureModal } from './FutureFeatureModal';

interface ResguardosActiveModalProps {
  show: boolean;
  employee: Directorio & { areas?: Area[] };
  onClose: () => void;
}

/**
 * Modal showing active resguardos with split view (40% | 60%)
 * Left: resguardos list, Right: goods details
 */
export function ResguardosActiveModal({ show, employee, onClose }: ResguardosActiveModalProps) {
  const [resguardos, setResguardos] = useState<ResguardoSummary[]>([]);
  const [selectedResguardo, setSelectedResguardo] = useState<ResguardoSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFutureModal, setShowFutureModal] = useState(false);

  // Load resguardos when modal opens
  useEffect(() => {
    if (show && employee) {
      loadResguardos();
    } else {
      // Reset state when modal closes
      setResguardos([]);
      setSelectedResguardo(null);
      setError(null);
    }
  }, [show, employee]);

  const loadResguardos = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Get resguardos for this employee
      const { data: resguardosData, error: resguardosError } = await supabase
        .from('resguardos')
        .select('id, folio, fecha')
        .eq('key_resguardante', employee.id_directorio)
        .order('fecha', { ascending: false });

      if (resguardosError) throw resguardosError;

      if (!resguardosData || resguardosData.length === 0) {
        setResguardos([]);
        return;
      }

      // 2. For each resguardo, get goods count and details
      const resguardosWithGoods = await Promise.all(
        resguardosData.map(async (resguardo) => {
          const { data: goodsData, error: goodsError } = await supabase
            .from('goods')
            .select('id, numero_inventario, descripcion, estado_fisico, rubro')
            .eq('key_resguardo', resguardo.id);

          if (goodsError) throw goodsError;

          const bienes: GoodSummary[] = (goodsData || []).map(good => ({
            id: good.id,
            numero_inventario: good.numero_inventario,
            descripcion: good.descripcion,
            estado_fisico: good.estado_fisico,
            rubro: good.rubro,
          }));

          return {
            id: resguardo.id,
            folio: resguardo.folio || 'Sin folio',
            fecha: resguardo.fecha || 'Sin fecha',
            bienesCount: bienes.length,
            bienes,
          };
        })
      );

      setResguardos(resguardosWithGoods);
      
      // Auto-select first resguardo
      if (resguardosWithGoods.length > 0) {
        setSelectedResguardo(resguardosWithGoods[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar resguardos');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="
                relative w-full max-w-5xl h-[600px]
                bg-white dark:bg-black
                border border-black/10 dark:border-white/10
                rounded-xl shadow-xl
                flex flex-col
              "
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="resguardos-modal-title"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-black/10 dark:border-white/10">
                <div>
                  <h3 
                    id="resguardos-modal-title"
                    className="text-lg font-medium text-black dark:text-white"
                  >
                    Resguardos Activos
                  </h3>
                  <p className="text-sm text-black/60 dark:text-white/60 mt-1">
                    {employee.nombre || 'Sin nombre'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="
                    p-1 rounded-md
                    text-black/40 dark:text-white/40
                    hover:text-black/60 dark:hover:text-white/60
                    hover:bg-black/5 dark:hover:bg-white/5
                    transition-colors
                  "
                  aria-label="Cerrar"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 flex overflow-hidden">
                {/* Loading state */}
                {loading && (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                  </div>
                )}

                {/* Error state */}
                {error && !loading && (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                      <p className="text-red-600 dark:text-red-400">{error}</p>
                      <button
                        onClick={loadResguardos}
                        className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                      >
                        Reintentar
                      </button>
                    </div>
                  </div>
                )}

                {/* Split view */}
                {!loading && !error && (
                  <>
                    {/* Left panel: Resguardos list (40%) */}
                    <div className="w-[40%] border-r border-black/10 dark:border-white/10 overflow-y-auto">
                      {resguardos.length === 0 ? (
                        <div className="p-6 text-center">
                          <FileText className="w-12 h-12 mx-auto mb-3 text-black/20 dark:text-white/20" />
                          <p className="text-black/60 dark:text-white/60">
                            No hay resguardos activos
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 space-y-2">
                          {resguardos.map((resguardo) => (
                            <button
                              key={resguardo.id}
                              onClick={() => setSelectedResguardo(resguardo)}
                              className={`
                                w-full p-3 rounded-lg text-left transition-colors
                                ${selectedResguardo?.id === resguardo.id
                                  ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-500/50'
                                  : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                                }
                              `}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-black dark:text-white truncate">
                                    {resguardo.folio}
                                  </p>
                                  <p className="text-xs text-black/60 dark:text-white/60 mt-0.5">
                                    {formatDate(resguardo.fecha)}
                                  </p>
                                </div>
                                <span className="
                                  px-2 py-0.5 rounded-full text-xs font-medium
                                  bg-blue-100 dark:bg-blue-900/30
                                  text-blue-700 dark:text-blue-300
                                  flex-shrink-0
                                ">
                                  {resguardo.bienesCount}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right panel: Goods details (60%) */}
                    <div className="flex-1 overflow-y-auto">
                      {!selectedResguardo ? (
                        <div className="h-full flex items-center justify-center p-6">
                          <div className="text-center">
                            <Package className="w-12 h-12 mx-auto mb-3 text-black/20 dark:text-white/20" />
                            <p className="text-black/60 dark:text-white/60">
                              Selecciona un resguardo para ver los bienes
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6">
                          <h4 className="font-medium text-black dark:text-white mb-4">
                            Bienes en Resguardo
                          </h4>
                          
                          {selectedResguardo.bienes.length === 0 ? (
                            <p className="text-black/60 dark:text-white/60 text-sm">
                              No hay bienes registrados
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {selectedResguardo.bienes.map((bien) => (
                                <div
                                  key={bien.id}
                                  className="p-3 rounded-lg bg-black/5 dark:bg-white/5"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-black dark:text-white">
                                        {bien.numero_inventario || 'Sin número'}
                                      </p>
                                      <p className="text-sm text-black/70 dark:text-white/70 mt-1">
                                        {bien.descripcion || 'Sin descripción'}
                                      </p>
                                      <div className="flex gap-3 mt-2">
                                        {bien.estado_fisico && (
                                          <span className="text-xs text-black/60 dark:text-white/60">
                                            Estado: {bien.estado_fisico}
                                          </span>
                                        )}
                                        {bien.rubro && (
                                          <span className="text-xs text-black/60 dark:text-white/60">
                                            Rubro: {bien.rubro}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 p-6 border-t border-black/10 dark:border-white/10">
                <button
                  onClick={() => setShowFutureModal(true)}
                  className="
                    px-4 py-2.5 rounded-lg
                    bg-black/5 dark:bg-white/5
                    hover:bg-black/10 dark:hover:bg-white/10
                    text-black dark:text-white
                    font-medium transition-colors
                  "
                >
                  Gestionar Bajas
                </button>
                <button
                  onClick={onClose}
                  className="
                    px-6 py-2.5 rounded-lg
                    bg-blue-600 hover:bg-blue-700
                    text-white font-medium
                    transition-colors
                  "
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Future Feature Modal */}
      <FutureFeatureModal
        show={showFutureModal}
        featureName="Gestión de Bajas"
        description="Permite gestionar las bajas de bienes desde los resguardos activos"
        onClose={() => setShowFutureModal(false)}
      />
    </>
  );
}
