'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Loader2, Search, Package, CheckSquare, Square } from 'lucide-react';
import supabase from '@/app/lib/supabase/client';
import type { Directorio, Area } from '@/types/admin';
import type { GoodSummary } from '../types';
import { AreaChip } from '../components/AreaChip';

interface BienesACargoModalProps {
  show: boolean;
  employee: Directorio & { areas?: Area[] };
  bienesCount: number;
  onReassign: (data: { goodIds: string[]; toResguardanteId: number }) => void;
  onCancel: () => void;
}

type ViewState = 'info' | 'reassignment';

interface ResguardanteOption extends Directorio {
  areas: Area[];
}

/**
 * Modal for goods reassignment with 2 views: info → reassignment
 * Reassignment view has split layout (33% | 67%)
 */
export function BienesACargoModal({ 
  show, 
  employee, 
  bienesCount,
  onReassign,
  onCancel 
}: BienesACargoModalProps) {
  const [view, setView] = useState<ViewState>('info');
  const [goods, setGoods] = useState<GoodSummary[]>([]);
  const [selectedGoodIds, setSelectedGoodIds] = useState<Set<string>>(new Set());
  const [resguardantes, setResguardantes] = useState<ResguardanteOption[]>([]);
  const [selectedResguardante, setSelectedResguardante] = useState<ResguardanteOption | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (show) {
      setView('info');
      setSelectedGoodIds(new Set());
      setSelectedResguardante(null);
      setSearchTerm('');
      setError(null);
    }
  }, [show]);

  // Load goods when entering reassignment view
  useEffect(() => {
    if (show && view === 'reassignment' && goods.length === 0) {
      loadGoods();
      loadResguardantes();
    }
  }, [show, view]);

  const loadGoods = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: goodsError } = await supabase
        .from('goods')
        .select('id, numero_inventario, descripcion, estado_fisico, rubro')
        .eq('key_resguardante', employee.id_directorio);

      if (goodsError) throw goodsError;

      const goodsList: GoodSummary[] = (data || []).map(good => ({
        id: good.id,
        numero_inventario: good.numero_inventario,
        descripcion: good.descripcion,
        estado_fisico: good.estado_fisico,
        rubro: good.rubro,
      }));

      setGoods(goodsList);
      
      // Pre-select all goods
      setSelectedGoodIds(new Set(goodsList.map(g => g.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar bienes');
    } finally {
      setLoading(false);
    }
  };

  const loadResguardantes = async () => {
    try {
      // Get all directorio except current employee
      const { data: directorioData, error: directorioError } = await supabase
        .from('directorio')
        .select('id_directorio, nombre, puesto')
        .neq('id_directorio', employee.id_directorio)
        .order('nombre');

      if (directorioError) throw directorioError;

      // Get areas for each directorio
      const { data: relationsData, error: relationsError } = await supabase
        .from('directorio_areas')
        .select('id_directorio, id_area, area:id_area(id_area, nombre)');

      if (relationsError) throw relationsError;

      // Build resguardantes with areas
      const resguardantesWithAreas: ResguardanteOption[] = (directorioData || []).map(dir => {
        const dirAreas = (relationsData || [])
          .filter((rel: any) => rel.id_directorio === dir.id_directorio)
          .map((rel: any) => rel.area)
          .filter(Boolean);

        return {
          ...dir,
          area: null, // Not used in this context
          areas: dirAreas,
        };
      });

      setResguardantes(resguardantesWithAreas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar resguardantes');
    }
  };

  const toggleGood = (goodId: string) => {
    setSelectedGoodIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(goodId)) {
        newSet.delete(goodId);
      } else {
        newSet.add(goodId);
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedGoodIds(new Set());
  };

  const filteredResguardantes = useMemo(() => {
    if (!searchTerm.trim()) return resguardantes;

    const term = searchTerm.toLowerCase();
    return resguardantes.filter(r => 
      r.nombre?.toLowerCase().includes(term) ||
      r.puesto?.toLowerCase().includes(term) ||
      r.areas.some(a => a.nombre.toLowerCase().includes(term))
    );
  }, [resguardantes, searchTerm]);

  const isValid = selectedGoodIds.size > 0 && selectedResguardante !== null;

  const handleConfirm = () => {
    if (!isValid || !selectedResguardante) return;

    onReassign({
      goodIds: Array.from(selectedGoodIds),
      toResguardanteId: selectedResguardante.id_directorio,
    });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={view === 'info' ? onCancel : undefined}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
              relative w-full bg-white dark:bg-black
              border border-black/10 dark:border-white/10
              rounded-xl shadow-xl flex flex-col
              ${view === 'info' ? 'max-w-md' : 'max-w-5xl h-[600px]'}
            `}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bienes-modal-title"
          >
            {/* Info View */}
            {view === 'info' && (
              <div className="p-6">
                {/* Close button */}
                <button
                  onClick={onCancel}
                  className="
                    absolute top-4 right-4
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

                {/* Alert icon */}
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>

                {/* Title */}
                <h3 
                  id="bienes-modal-title"
                  className="text-lg font-medium text-black dark:text-white mb-2 text-center"
                >
                  Bienes a Cargo
                </h3>

                {/* Alert message */}
                <div className="mb-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    Este empleado tiene <strong>{bienesCount} bien{bienesCount !== 1 ? 'es' : ''}</strong> a su cargo.
                    Debe reasignarlos antes de poder eliminarlo.
                  </p>
                </div>

                {/* Employee data */}
                <div className="mb-6 p-4 rounded-lg bg-black/5 dark:bg-white/5">
                  <p className="font-medium text-black dark:text-white mb-1">
                    {employee.nombre || 'Sin nombre'}
                  </p>
                  {employee.puesto && (
                    <p className="text-sm text-black/60 dark:text-white/60 mb-2">
                      {employee.puesto}
                    </p>
                  )}
                  {employee.areas && employee.areas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {employee.areas.map((area) => (
                        <AreaChip key={area.id_area} area={area} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={onCancel}
                    className="
                      flex-1 px-4 py-2.5 rounded-lg
                      bg-black/5 dark:bg-white/5
                      hover:bg-black/10 dark:hover:bg-white/10
                      text-black dark:text-white
                      font-medium transition-colors
                    "
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => setView('reassignment')}
                    className="
                      flex-1 px-4 py-2.5 rounded-lg
                      bg-blue-600 hover:bg-blue-700
                      text-white font-medium
                      transition-colors
                    "
                  >
                    Reasignar Bienes
                  </button>
                </div>
              </div>
            )}

            {/* Reassignment View */}
            {view === 'reassignment' && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-black/10 dark:border-white/10">
                  <h3 className="text-lg font-medium text-black dark:text-white">
                    Reasignar Bienes
                  </h3>
                  <button
                    onClick={onCancel}
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
                  {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* Left panel: Selected goods (33%) */}
                      <div className="w-[33%] border-r border-black/10 dark:border-white/10 flex flex-col">
                        <div className="p-4 border-b border-black/10 dark:border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-black dark:text-white text-sm">
                              Bienes Seleccionados
                            </h4>
                            <span className="text-xs text-black/60 dark:text-white/60">
                              {selectedGoodIds.size} de {goods.length}
                            </span>
                          </div>
                          {selectedGoodIds.size > 0 && (
                            <button
                              onClick={clearSelection}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Limpiar selección
                            </button>
                          )}
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                          {goods.map((good) => (
                            <button
                              key={good.id}
                              onClick={() => toggleGood(good.id)}
                              className={`
                                w-full p-2 rounded-lg text-left transition-colors flex items-start gap-2
                                ${selectedGoodIds.has(good.id)
                                  ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-500/50'
                                  : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                                }
                              `}
                            >
                              {selectedGoodIds.has(good.id) ? (
                                <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                              ) : (
                                <Square className="w-4 h-4 text-black/40 dark:text-white/40 flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-black dark:text-white truncate">
                                  {good.numero_inventario || 'Sin número'}
                                </p>
                                <p className="text-xs text-black/60 dark:text-white/60 truncate">
                                  {good.descripcion || 'Sin descripción'}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Right panel: Resguardante selector (67%) */}
                      <div className="flex-1 flex flex-col">
                        <div className="p-4 border-b border-black/10 dark:border-white/10">
                          <h4 className="font-medium text-black dark:text-white text-sm mb-3">
                            Seleccionar Resguardante
                          </h4>
                          
                          {/* Search bar */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
                            <input
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="Buscar resguardante..."
                              className="
                                w-full pl-9 pr-3 py-2 rounded-lg
                                bg-white dark:bg-black
                                border border-black/10 dark:border-white/10
                                text-sm text-black dark:text-white
                                placeholder:text-black/40 dark:placeholder:text-white/40
                                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                              "
                            />
                          </div>
                        </div>

                        {/* Selected resguardante */}
                        {selectedResguardante && (
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-800 dark:text-blue-300 mb-2">
                              Resguardante seleccionado:
                            </p>
                            <div className="p-3 rounded-lg bg-white dark:bg-black border border-blue-200 dark:border-blue-800">
                              <p className="font-medium text-black dark:text-white">
                                {selectedResguardante.nombre || 'Sin nombre'}
                              </p>
                              {selectedResguardante.puesto && (
                                <p className="text-sm text-black/60 dark:text-white/60 mt-0.5">
                                  {selectedResguardante.puesto}
                                </p>
                              )}
                              {selectedResguardante.areas.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {selectedResguardante.areas.map((area) => (
                                    <AreaChip key={area.id_area} area={area} />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Resguardantes list */}
                        <div className="flex-1 overflow-y-auto p-4">
                          {filteredResguardantes.length === 0 ? (
                            <div className="text-center py-8">
                              <Package className="w-12 h-12 mx-auto mb-3 text-black/20 dark:text-white/20" />
                              <p className="text-black/60 dark:text-white/60 text-sm">
                                No se encontraron resguardantes
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {filteredResguardantes.map((resguardante) => (
                                <button
                                  key={resguardante.id_directorio}
                                  onClick={() => setSelectedResguardante(resguardante)}
                                  className={`
                                    w-full p-3 rounded-lg text-left transition-colors
                                    ${selectedResguardante?.id_directorio === resguardante.id_directorio
                                      ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-500/50'
                                      : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                                    }
                                  `}
                                >
                                  <p className="font-medium text-black dark:text-white">
                                    {resguardante.nombre || 'Sin nombre'}
                                  </p>
                                  {resguardante.puesto && (
                                    <p className="text-sm text-black/60 dark:text-white/60 mt-0.5">
                                      {resguardante.puesto}
                                    </p>
                                  )}
                                  {resguardante.areas.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {resguardante.areas.map((area) => (
                                        <AreaChip key={area.id_area} area={area} />
                                      ))}
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                {error && (
                  <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between gap-3 p-6 border-t border-black/10 dark:border-white/10">
                  <div className="text-sm text-black/60 dark:text-white/60">
                    {selectedGoodIds.size} bien{selectedGoodIds.size !== 1 ? 'es' : ''} seleccionado{selectedGoodIds.size !== 1 ? 's' : ''}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setView('info')}
                      className="
                        px-4 py-2.5 rounded-lg
                        bg-black/5 dark:bg-white/5
                        hover:bg-black/10 dark:hover:bg-white/10
                        text-black dark:text-white
                        font-medium transition-colors
                      "
                    >
                      Atrás
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={!isValid}
                      className="
                        px-6 py-2.5 rounded-lg
                        bg-blue-600 hover:bg-blue-700
                        text-white font-medium
                        transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
