'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, User, Folder, ArrowRight, UserPlus, AlertTriangle, Loader2, Search, AlertCircle } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import supabase from '@/app/lib/supabase/client';
import { useIteaStore } from '@/stores/iteaStore';
import { useIneaStore } from '@/stores/ineaStore';
import { useNoListadoStore } from '@/stores/noListadoStore';
import type { InconsistencyWithStats } from '../../../types/resolver';

type DirectorOption = 'delete_all' | 'keep_areas' | 'reassign_areas';

interface AreaWithBienes {
  id: number;
  nombre: string;
  bienesCount: number;
  hasConflict?: boolean; // Si otro director ya tiene esta área con bienes
}

interface AreaConflict {
  areaId: number;
  areaName: string;
  directors: {
    id: number;
    nombre: string;
    bienesCount: number;
  }[];
}

interface Director {
  id: number;
  nombre: string;
  areas: AreaWithBienes[];
  totalBienes: number;
}

interface SearchSuggestion {
  value: string;
  label: string;
  director: Director;
}

interface EmptyDirectorConfirmationProps {
  inconsistency: InconsistencyWithStats;
  onBack: () => void;
  onConfirm: (option: DirectorOption, targetDirectorId?: number) => Promise<void>;
}

export function EmptyDirectorConfirmation({
  inconsistency,
  onBack,
  onConfirm,
}: EmptyDirectorConfirmationProps) {
  const { isDarkMode } = useTheme();
  const [selectedOption, setSelectedOption] = useState<DirectorOption>('delete_all');
  const [selectedTargetDirectorId, setSelectedTargetDirectorId] = useState<number | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [availableDirectors, setAvailableDirectors] = useState<Director[]>([]);
  const [isLoadingDirectors, setIsLoadingDirectors] = useState(false);
  const [deleteAllDisabled, setDeleteAllDisabled] = useState(false);
  const [areaConflicts, setAreaConflicts] = useState<AreaConflict[]>([]);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Get data from stores
  const iteaMuebles = useIteaStore(state => state.muebles);
  const ineaMuebles = useIneaStore(state => state.muebles);
  const noListadoMuebles = useNoListadoStore(state => state.muebles);

  const currentDirectorId = inconsistency.id_directorio || inconsistency.directorId || 0;
  const currentDirectorAreas = inconsistency.areas || [];

  // Validate delete_all option
  useEffect(() => {
    const validateDeleteAll = async () => {
      try {
        // Check if any of the current director's areas are assigned to other directors with bienes
        const areaIds = currentDirectorAreas.map(a => a.id);
        
        if (areaIds.length === 0) {
          setDeleteAllDisabled(false);
          setAreaConflicts([]);
          return;
        }

        // Fetch other directors with these areas
        const { data: otherDirectorAreas, error } = await supabase
          .from('directorio_areas')
          .select('id_directorio, id_area, directorio:id_directorio(nombre)')
          .in('id_area', areaIds)
          .neq('id_directorio', currentDirectorId);

        if (error) throw error;

        if (!otherDirectorAreas || otherDirectorAreas.length === 0) {
          setDeleteAllDisabled(false);
          setAreaConflicts([]);
          return;
        }

        // Group conflicts by area
        const conflictMap = new Map<number, AreaConflict>();
        
        for (const relation of otherDirectorAreas) {
          const directorId = relation.id_directorio;
          const areaId = relation.id_area;
          const areaName = currentDirectorAreas.find(a => a.id === areaId)?.nombre || '';
          const directorName = (relation.directorio as any)?.nombre || 'Desconocido';

          // Count bienes for this director in this area
          const iteaCount = iteaMuebles.filter(m => 
            m.id_directorio === directorId && m.id_area === areaId
          ).length;
          
          const ineaCount = ineaMuebles.filter(m => 
            m.id_directorio === directorId && m.id_area === areaId
          ).length;
          
          const noListadoCount = noListadoMuebles.filter(m => 
            m.id_directorio === directorId && m.id_area === areaId
          ).length;

          const totalBienes = iteaCount + ineaCount + noListadoCount;

          if (totalBienes > 0) {
            if (!conflictMap.has(areaId)) {
              conflictMap.set(areaId, {
                areaId,
                areaName,
                directors: []
              });
            }
            
            conflictMap.get(areaId)!.directors.push({
              id: directorId,
              nombre: directorName,
              bienesCount: totalBienes
            });
          }
        }

        const conflicts = Array.from(conflictMap.values());
        
        if (conflicts.length > 0) {
          setDeleteAllDisabled(true);
          setAreaConflicts(conflicts);
        } else {
          setDeleteAllDisabled(false);
          setAreaConflicts([]);
        }
      } catch (error) {
        console.error('Error validating delete_all:', error);
        setDeleteAllDisabled(false);
        setAreaConflicts([]);
      }
    };

    validateDeleteAll();
  }, [currentDirectorAreas, currentDirectorId, iteaMuebles, ineaMuebles, noListadoMuebles]);

  // Fetch available directors when reassign_areas option is selected
  useEffect(() => {
    if (selectedOption === 'reassign_areas') {
      fetchAvailableDirectors();
    }
  }, [selectedOption]);

  const fetchAvailableDirectors = async () => {
    setIsLoadingDirectors(true);
    try {
      // Fetch all directors except the current one
      const { data: directors, error: directorsError } = await supabase
        .from('directorio')
        .select('id_directorio, nombre')
        .neq('id_directorio', currentDirectorId)
        .order('nombre');

      if (directorsError) throw directorsError;

      if (!directors || directors.length === 0) {
        setAvailableDirectors([]);
        return;
      }

      // Fetch detailed info for each director
      const directorsWithDetails = await Promise.all(
        directors.map(async (director: { id_directorio: number; nombre: string }) => {
          // Fetch areas for this director
          const { data: directorAreas, error: areasError } = await supabase
            .from('directorio_areas')
            .select('id_area, area:id_area(nombre)')
            .eq('id_directorio', director.id_directorio);

          if (areasError) throw areasError;

          const areas: AreaWithBienes[] = [];
          let totalBienes = 0;

          if (directorAreas) {
            for (const areaRelation of directorAreas) {
              const areaId = areaRelation.id_area;
              const areaName = (areaRelation.area as any)?.nombre || 'Sin nombre';

              // Count bienes for this area
              const iteaCount = iteaMuebles.filter(m => 
                m.id_directorio === director.id_directorio && m.id_area === areaId
              ).length;
              
              const ineaCount = ineaMuebles.filter(m => 
                m.id_directorio === director.id_directorio && m.id_area === areaId
              ).length;
              
              const noListadoCount = noListadoMuebles.filter(m => 
                m.id_directorio === director.id_directorio && m.id_area === areaId
              ).length;

              const bienesCount = iteaCount + ineaCount + noListadoCount;
              totalBienes += bienesCount;

              // Check if this area is one of the current director's areas (conflict)
              const hasConflict = currentDirectorAreas.some(a => a.id === areaId);

              areas.push({
                id: areaId,
                nombre: areaName,
                bienesCount,
                hasConflict
              });
            }
          }

          return {
            id: director.id_directorio,
            nombre: director.nombre,
            areas,
            totalBienes
          };
        })
      );

      setAvailableDirectors(directorsWithDetails);
    } catch (error) {
      console.error('Error fetching directors:', error);
      setAvailableDirectors([]);
    } finally {
      setIsLoadingDirectors(false);
    }
  };

  // Filter directors based on search term
  const filteredDirectors = useMemo(() => {
    if (!searchTerm.trim()) return availableDirectors;
    
    const term = searchTerm.toLowerCase();
    return availableDirectors.filter(director => 
      director.nombre.toLowerCase().includes(term) ||
      director.areas.some(area => area.nombre.toLowerCase().includes(term))
    );
  }, [availableDirectors, searchTerm]);

  // Generate search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) return [];
    
    const term = searchTerm.toLowerCase();
    const suggestions: SearchSuggestion[] = [];
    
    availableDirectors.forEach(director => {
      // Match by director name
      if (director.nombre.toLowerCase().includes(term)) {
        suggestions.push({
          value: director.nombre,
          label: `${director.nombre} (${director.areas.length} áreas, ${director.totalBienes} bienes)`,
          director
        });
      }
      // Match by area name
      else {
        const matchingAreas = director.areas.filter(area => 
          area.nombre.toLowerCase().includes(term)
        );
        
        if (matchingAreas.length > 0) {
          suggestions.push({
            value: director.nombre,
            label: `${director.nombre} - ${matchingAreas[0].nombre}`,
            director
          });
        }
      }
    });
    
    // Remove duplicates and limit to 5
    const uniqueSuggestions = suggestions.filter((s, i, arr) => 
      arr.findIndex(x => x.director.id === s.director.id) === i
    );
    
    return uniqueSuggestions.slice(0, 5);
  }, [availableDirectors, searchTerm]);

  const handleConfirm = async () => {
    if (selectedOption === 'reassign_areas' && !selectedTargetDirectorId) {
      return;
    }

    setIsConfirming(true);
    try {
      await onConfirm(selectedOption, selectedTargetDirectorId || undefined);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || searchSuggestions.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % searchSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + searchSuggestions.length) % searchSuggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && searchSuggestions[highlightedIndex]) {
        setSearchTerm(searchSuggestions[highlightedIndex].value);
        setShowSuggestions(false);
        setSelectedTargetDirectorId(searchSuggestions[highlightedIndex].director.id);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const canConfirm = selectedOption !== 'reassign_areas' || selectedTargetDirectorId !== null;

  return (
    <div className={`h-full rounded-lg border ${
      isDarkMode ? 'bg-black/40 border-white/5' : 'bg-white border-neutral-200'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className={`p-6 border-b ${isDarkMode ? 'border-white/5' : 'border-neutral-200'}`}>
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className={`w-5 h-5 ${isDarkMode ? 'text-blue-500/80' : 'text-blue-600'}`} />
            <div className="flex-1">
              <p className={`text-xs ${isDarkMode ? 'text-white/30' : 'text-black/40'}`}>
                Responsable sin bienes
              </p>
              <h3 className={`text-lg font-light tracking-tight ${
                isDarkMode ? 'text-white/90' : 'text-black'
              }`}>
                {inconsistency.directorName}
              </h3>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${
            isDarkMode 
              ? 'bg-white/[0.02] border-white/5' 
              : 'bg-neutral-50 border-neutral-200'
          }`}>
            <p className={`text-sm ${isDarkMode ? 'text-white/50' : 'text-neutral-700'}`}>
              <span className={`font-medium ${isDarkMode ? 'text-white/80' : 'text-black'}`}>
                {inconsistency.directorName}
              </span>{' '}
              no tiene bienes asignados. Selecciona qué hacer con {inconsistency.areas?.length === 1 ? 'su área' : 'sus áreas'}.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Areas List */}
          <div className={`p-3 rounded-lg border ${
            isDarkMode 
              ? 'bg-white/[0.02] border-white/5' 
              : 'bg-neutral-50 border-neutral-200'
          }`}>
            <h5 className={`text-xs font-medium uppercase tracking-wider mb-2 ${
              isDarkMode ? 'text-white/30' : 'text-neutral-500'
            }`}>
              Áreas asignadas ({inconsistency.areas?.length || 0})
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {inconsistency.areas?.map((area) => (
                <span 
                  key={`area-chip-${area.id}`} 
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${
                    isDarkMode 
                      ? 'bg-white/[0.03] text-white/60 border-white/10' 
                      : 'bg-white text-neutral-700 border-neutral-300'
                  }`}
                >
                  <Folder className="w-2.5 h-2.5" />
                  {area.nombre}
                </span>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <h4 className={`text-xs font-medium uppercase tracking-wider ${
              isDarkMode ? 'text-white/30' : 'text-neutral-500'
            }`}>
              Selecciona una acción
            </h4>

            {/* Option 1: Keep Areas (RECOMENDADO) */}
            <motion.button
              onClick={() => setSelectedOption('keep_areas')}
              whileHover={{ scale: 1.002 }}
              whileTap={{ scale: 0.998 }}
              className={`
                w-full p-4 rounded-lg border transition-all text-left
                ${selectedOption === 'keep_areas'
                  ? isDarkMode
                    ? 'border-white/20 bg-white/[0.03]'
                    : 'border-neutral-400 bg-neutral-100'
                  : isDarkMode
                    ? 'border-white/5 hover:border-white/10 bg-white/[0.01]'
                    : 'border-neutral-300 hover:border-neutral-400 bg-white'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                    ${selectedOption === 'keep_areas'
                      ? isDarkMode
                        ? 'border-white/60 bg-white/60'
                        : 'border-neutral-700 bg-neutral-700'
                      : isDarkMode
                        ? 'border-white/20'
                        : 'border-neutral-400'
                    }
                  `}>
                    {selectedOption === 'keep_areas' && (
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        isDarkMode ? 'bg-black' : 'bg-white'
                      }`} />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Folder className={`w-3.5 h-3.5 ${
                      isDarkMode ? 'text-white/40' : 'text-neutral-500'
                    }`} />
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-white/70' : 'text-neutral-900'
                    }`}>
                      Eliminar solo el responsable
                    </p>
                    <span className={`px-1.5 py-0.5 text-xs rounded border ${
                      isDarkMode 
                        ? 'bg-emerald-500/10 text-emerald-400/80 border-emerald-500/20' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      Recomendado
                    </span>
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-neutral-600'}`}>
                    Se eliminará el responsable pero las áreas permanecerán en el sistema sin responsable asignado
                  </p>
                </div>
              </div>
            </motion.button>

            {/* Option 2: Delete All */}
            <motion.button
              onClick={() => !deleteAllDisabled && setSelectedOption('delete_all')}
              whileHover={!deleteAllDisabled ? { scale: 1.002 } : {}}
              whileTap={!deleteAllDisabled ? { scale: 0.998 } : {}}
              disabled={deleteAllDisabled}
              className={`
                w-full p-4 rounded-lg border transition-all text-left
                ${deleteAllDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${selectedOption === 'delete_all'
                  ? isDarkMode
                    ? 'border-white/20 bg-white/[0.03]'
                    : 'border-neutral-400 bg-neutral-100'
                  : isDarkMode
                    ? 'border-white/5 hover:border-white/10 bg-white/[0.01]'
                    : 'border-neutral-300 hover:border-neutral-400 bg-white'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                    ${selectedOption === 'delete_all'
                      ? isDarkMode
                        ? 'border-white/60 bg-white/60'
                        : 'border-neutral-700 bg-neutral-700'
                      : isDarkMode
                        ? 'border-white/20'
                        : 'border-neutral-400'
                    }
                  `}>
                    {selectedOption === 'delete_all' && (
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        isDarkMode ? 'bg-black' : 'bg-white'
                      }`} />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Trash2 className={`w-3.5 h-3.5 ${
                      isDarkMode ? 'text-white/40' : 'text-neutral-500'
                    }`} />
                    <p className={`text-sm font-medium ${
                      isDarkMode ? 'text-white/70' : 'text-neutral-900'
                    }`}>
                      Eliminar responsable y áreas
                    </p>
                  </div>
                  <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-neutral-600'}`}>
                    Se eliminará el responsable y todas sus áreas del sistema
                  </p>
                  {deleteAllDisabled && areaConflicts.length > 0 && (
                    <div className={`mt-3 p-3 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-red-500/10 border-red-500/20' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-start gap-2 mb-3">
                        <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          isDarkMode ? 'text-red-400/80' : 'text-red-600'
                        }`} />
                        <div className="flex-1">
                          <p className={`text-xs font-medium ${
                            isDarkMode ? 'text-red-400/90' : 'text-red-700'
                          }`}>
                            No se puede eliminar
                          </p>
                          <p className={`text-xs mt-0.5 ${
                            isDarkMode ? 'text-red-400/70' : 'text-red-600'
                          }`}>
                            {areaConflicts.length === 1 
                              ? 'La siguiente área ya está asignada a otro responsable con bienes'
                              : 'Las siguientes áreas ya están asignadas a otros responsables con bienes'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {areaConflicts.map((conflict) => (
                          <div 
                            key={conflict.areaId}
                            className={`rounded-lg border ${
                              isDarkMode 
                                ? 'bg-red-500/5 border-red-500/10' 
                                : 'bg-white border-red-200'
                            }`}
                          >
                            {/* Area header */}
                            <div className={`flex items-center gap-2 px-3 py-2 border-b ${
                              isDarkMode ? 'border-red-500/10' : 'border-red-200'
                            }`}>
                              <Folder className={`w-3.5 h-3.5 flex-shrink-0 ${
                                isDarkMode ? 'text-red-400/70' : 'text-red-600'
                              }`} />
                              <span className={`text-xs font-medium flex-1 ${
                                isDarkMode ? 'text-red-400/90' : 'text-red-700'
                              }`}>
                                {conflict.areaName}
                              </span>
                              <span className={`text-xs ${
                                isDarkMode ? 'text-red-400/60' : 'text-red-600'
                              }`}>
                                {conflict.directors.length} {conflict.directors.length === 1 ? 'responsable' : 'responsables'}
                              </span>
                            </div>
                            
                            {/* Directors list */}
                            <div className="p-2 space-y-1">
                              {conflict.directors.map((director) => (
                                <div 
                                  key={director.id}
                                  className={`flex items-center gap-2 px-2 py-1.5 rounded ${
                                    isDarkMode 
                                      ? 'bg-red-500/5' 
                                      : 'bg-red-50/50'
                                  }`}
                                >
                                  <User className={`w-3 h-3 flex-shrink-0 ${
                                    isDarkMode ? 'text-red-400/60' : 'text-red-500'
                                  }`} />
                                  <span className={`text-xs flex-1 truncate ${
                                    isDarkMode ? 'text-red-400/80' : 'text-red-700'
                                  }`}>
                                    {director.nombre}
                                  </span>
                                  <span className={`text-xs font-medium flex-shrink-0 ${
                                    isDarkMode ? 'text-red-400/70' : 'text-red-600'
                                  }`}>
                                    {director.bienesCount} {director.bienesCount === 1 ? 'bien' : 'bienes'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.button>

            {/* Option 3: Reassign Areas */}
            <div className={`
              rounded-lg border transition-all
              ${selectedOption === 'reassign_areas'
                ? isDarkMode
                  ? 'border-white/20 bg-white/[0.03]'
                  : 'border-neutral-400 bg-neutral-100'
                : isDarkMode
                  ? 'border-white/5 bg-white/[0.01]'
                  : 'border-neutral-300 bg-white'
              }
            `}>
              <button
                onClick={() => setSelectedOption('reassign_areas')}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`
                      w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                      ${selectedOption === 'reassign_areas'
                        ? isDarkMode
                          ? 'border-white/60 bg-white/60'
                          : 'border-neutral-700 bg-neutral-700'
                        : isDarkMode
                          ? 'border-white/20'
                          : 'border-neutral-400'
                      }
                    `}>
                      {selectedOption === 'reassign_areas' && (
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          isDarkMode ? 'bg-black' : 'bg-white'
                        }`} />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <UserPlus className={`w-3.5 h-3.5 ${
                        isDarkMode ? 'text-white/40' : 'text-neutral-500'
                      }`} />
                      <p className={`text-sm font-medium ${
                        isDarkMode ? 'text-white/70' : 'text-neutral-900'
                      }`}>
                        Reasignar áreas a otro responsable
                      </p>
                    </div>
                    <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-neutral-600'}`}>
                      Selecciona el responsable que recibirá estas áreas (solo se transferirán las áreas, no hay bienes)
                    </p>
                  </div>
                </div>
              </button>

              {selectedOption === 'reassign_areas' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4 space-y-3"
                >
                  {/* Search bar */}
                  {!isLoadingDirectors && availableDirectors.length > 0 && (
                    <div className="relative">
                      <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                          isDarkMode ? 'text-white/40' : 'text-neutral-400'
                        }`} />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowSuggestions(true);
                            setHighlightedIndex(-1);
                          }}
                          onFocus={() => setShowSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                          onKeyDown={handleSearchKeyDown}
                          placeholder="Buscar responsable o área..."
                          className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border transition-all ${
                            isDarkMode
                              ? 'bg-black border-white/10 text-white placeholder-white/40 focus:border-white/20'
                              : 'bg-white border-neutral-300 text-black placeholder-neutral-400 focus:border-neutral-400'
                          } focus:outline-none`}
                        />
                      </div>

                      {/* Search suggestions */}
                      <AnimatePresence>
                        {showSuggestions && searchSuggestions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className={`absolute z-50 w-full mt-2 rounded-lg border shadow-lg overflow-hidden ${
                              isDarkMode 
                                ? 'bg-black border-white/10' 
                                : 'bg-white border-neutral-200'
                            }`}
                          >
                            <div className={`max-h-60 overflow-y-auto p-1 ${
                              isDarkMode 
                                ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30'
                                : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20 hover:scrollbar-thumb-black/30'
                            }`}>
                              {searchSuggestions.map((suggestion, index) => {
                                const isSelected = index === highlightedIndex;
                                
                                return (
                                  <button
                                    key={suggestion.director.id}
                                    onClick={() => {
                                      setSearchTerm(suggestion.value);
                                      setShowSuggestions(false);
                                      setSelectedTargetDirectorId(suggestion.director.id);
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150 ${
                                      isSelected
                                        ? isDarkMode 
                                          ? 'bg-white/10 text-white' 
                                          : 'bg-black/10 text-black'
                                        : isDarkMode
                                          ? 'hover:bg-white/[0.04] text-white/90'
                                          : 'hover:bg-black/[0.03] text-black/90'
                                    }`}
                                  >
                                    <span className={isSelected 
                                      ? (isDarkMode ? 'text-white' : 'text-black')
                                      : (isDarkMode ? 'text-white/40' : 'text-black/40')
                                    }>
                                      <User className="w-3.5 h-3.5" />
                                    </span>
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm truncate font-medium">
                                        {suggestion.director.nombre}
                                      </div>
                                      <div className={`text-xs truncate ${
                                        isSelected
                                          ? (isDarkMode ? 'text-white/60' : 'text-black/60')
                                          : (isDarkMode ? 'text-white/40' : 'text-black/40')
                                      }`}>
                                        {suggestion.director.areas.length} áreas · {suggestion.director.totalBienes} bienes
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Scrollbar styles */}
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
                    </div>
                  )}

                  {isLoadingDirectors ? (
                    <div className={`flex items-center justify-center gap-2 py-4 ${
                      isDarkMode ? 'text-white/40' : 'text-neutral-500'
                    }`}>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">Cargando responsables...</span>
                    </div>
                  ) : filteredDirectors.length === 0 ? (
                    <div className={`p-3 rounded-lg border text-center ${
                      isDarkMode 
                        ? 'bg-white/[0.02] border-white/5 text-white/40' 
                        : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                    }`}>
                      <p className="text-xs">
                        {searchTerm ? 'No se encontraron responsables con ese criterio' : 'No hay otros responsables disponibles'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredDirectors.map((director) => {
                        const isSelected = selectedTargetDirectorId === director.id;
                        const hasConflicts = director.areas.some(a => a.hasConflict);

                        return (
                          <button
                            key={`target-director-${director.id}`}
                            onClick={() => setSelectedTargetDirectorId(isSelected ? null : director.id)}
                            className={`
                              w-full p-3 rounded-lg border transition-all text-left
                              ${isSelected
                                ? isDarkMode
                                  ? 'border-white/20 bg-white/[0.03]'
                                  : 'border-neutral-400 bg-neutral-100'
                                : isDarkMode
                                  ? 'border-white/5 hover:border-white/10 bg-white/[0.01]'
                                  : 'border-neutral-300 hover:border-neutral-400 bg-white'
                              }
                            `}
                          >
                            <div className="space-y-2">
                              {/* Director header */}
                              <div className="flex items-center gap-2">
                                <div className="flex-shrink-0">
                                  <div className={`
                                    w-3 h-3 rounded-full border-2 flex items-center justify-center transition-colors
                                    ${isSelected
                                      ? isDarkMode
                                        ? 'border-white/60 bg-white/60'
                                        : 'border-neutral-700 bg-neutral-700'
                                      : isDarkMode
                                        ? 'border-white/20'
                                        : 'border-neutral-400'
                                    }
                                  `}>
                                    {isSelected && (
                                      <div className={`w-1 h-1 rounded-full ${
                                        isDarkMode ? 'bg-black' : 'bg-white'
                                      }`} />
                                    )}
                                  </div>
                                </div>
                                <User className={`w-3 h-3 ${
                                  isDarkMode ? 'text-white/40' : 'text-neutral-500'
                                }`} />
                                <span className={`text-xs font-medium flex-1 ${
                                  isDarkMode ? 'text-white/70' : 'text-neutral-900'
                                }`}>
                                  {director.nombre}
                                </span>
                                <span className={`text-xs ${
                                  isDarkMode ? 'text-white/40' : 'text-neutral-500'
                                }`}>
                                  {director.totalBienes} bienes
                                </span>
                                {isSelected && (
                                  <ArrowRight className={`w-3 h-3 ${
                                    isDarkMode ? 'text-white/50' : 'text-neutral-600'
                                  }`} />
                                )}
                              </div>

                              {/* Areas list */}
                              {director.areas.length > 0 && (
                                <div className={`pl-5 space-y-1 ${
                                  isDarkMode ? 'border-l border-white/5' : 'border-l border-neutral-200'
                                }`}>
                                  {director.areas.map((area) => (
                                    <div 
                                      key={`area-${area.id}`}
                                      className={`flex items-center gap-2 text-xs ${
                                        area.hasConflict
                                          ? isDarkMode
                                            ? 'text-yellow-400/80'
                                            : 'text-yellow-700'
                                          : isDarkMode
                                            ? 'text-white/50'
                                            : 'text-neutral-600'
                                      }`}
                                    >
                                      <Folder className="w-2.5 h-2.5 flex-shrink-0" />
                                      <span className="flex-1 truncate">{area.nombre}</span>
                                      <span className="flex-shrink-0">{area.bienesCount}</span>
                                      {area.hasConflict && (
                                        <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Conflict warning */}
                              {hasConflicts && (
                                <div className={`mt-2 p-2 rounded border flex items-start gap-1.5 ${
                                  isDarkMode 
                                    ? 'bg-yellow-500/10 border-yellow-500/20' 
                                    : 'bg-yellow-50 border-yellow-200'
                                }`}>
                                  <AlertCircle className={`w-3 h-3 flex-shrink-0 mt-0.5 ${
                                    isDarkMode ? 'text-yellow-400/80' : 'text-yellow-700'
                                  }`} />
                                  <p className={`text-xs ${
                                    isDarkMode ? 'text-yellow-400/80' : 'text-yellow-700'
                                  }`}>
                                    Este responsable ya tiene algunas de estas áreas. Se consolidarán automáticamente.
                                  </p>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={`p-4 border-t ${
          isDarkMode ? 'border-white/5' : 'border-neutral-200'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              disabled={isConfirming}
              className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDarkMode
                  ? 'text-white/50 border border-white/10 hover:bg-white/5'
                  : 'text-black/60 border border-black/10 hover:bg-black/5'
              }`}
            >
              Atrás
            </button>
            <button
              onClick={handleConfirm}
              disabled={isConfirming || !canConfirm}
              className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDarkMode
                  ? 'bg-red-500/90 hover:bg-red-500 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isConfirming ? 'Confirmando...' : 'Confirmar acción'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
