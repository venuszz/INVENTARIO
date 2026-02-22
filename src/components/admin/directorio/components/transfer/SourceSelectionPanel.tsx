'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { Search, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import type { SelectedBien } from '../../types/transfer';

/**
 * SourceSelectionPanel Component
 * 
 * Wizard-style panel for selecting source director, areas, and bienes.
 * Uses a step-by-step approach for better UX.
 * 
 * Steps:
 * 1. Select Source Director (with search)
 * 2. Select Areas/Bienes
 * 
 * Features:
 * - Step-by-step wizard interface
 * - Search bar for directors
 * - Only shows directors with areas
 * - Area selection with checkboxes
 * - Bien selection for partial transfers
 * - Resguardo warnings on areas
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.3, 3.4
 */

interface Director {
  id_directorio: number;
  nombre: string;
  puesto?: string;
}

interface Area {
  id_area: number;
  nombre: string;
  bienCount?: number;
  resguardoCount?: number;
}

interface Bien {
  id: string; // UUID string
  id_inv: string;
  descripcion: string;
  valor: number;
  id_area: number;
  source: 'inea' | 'itea' | 'no_listado';
}

interface SourceSelectionPanelProps {
  directors: Director[];
  selectedDirector: Director | null;
  selectedAreas: number[];
  selectedBienes: SelectedBien[];
  onSelectDirector: (directorId: number) => void;
  onSelectArea: (areaId: number) => void;
  onDeselectArea: (areaId: number) => void;
  onSelectBienes: (bienes: SelectedBien[]) => void;
  onDeselectBienes: (bienIds: string[]) => void;

  // Data for areas and bienes
  areas?: Area[];
  bienes?: Bien[];
  directorioAreas?: Array<{ id_directorio: number; id_area: number }>;
}

type WizardStep = 'select_director' | 'select_areas';

export function SourceSelectionPanel({
  directors,
  selectedDirector,
  selectedAreas,
  selectedBienes,
  onSelectDirector,
  onSelectArea,
  onDeselectArea,
  onSelectBienes,
  onDeselectBienes,
  areas = [],
  bienes = [],
  directorioAreas = [],
}: SourceSelectionPanelProps) {
  const { isDarkMode } = useTheme();

  // Wizard state - automatically set to step 2 if director is already selected
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    selectedDirector ? 'select_areas' : 'select_director'
  );
  const [directorSearchQuery, setDirectorSearchQuery] = useState('');
  const [bienSearchQuery, setBienSearchQuery] = useState('');

  // Auto-advance to step 2 only when selectedDirector changes to a new value.
  // We do NOT auto-revert to step 1 here — that's handled by handleBackToDirectors.
  useEffect(() => {
    if (selectedDirector) {
      setCurrentStep('select_areas');
    }
  }, [selectedDirector?.id_directorio]);

  // Calculate area count per director
  const getDirectorAreaCount = (directorId: number) => {
    return directorioAreas.filter(da => da.id_directorio === directorId).length;
  };

  // Filter directors: only those with areas
  const directorsWithAreas = useMemo(() => {
    return directors.filter(d => getDirectorAreaCount(d.id_directorio) > 0);
  }, [directors, directorioAreas]);

  // Filter directors by search query
  const filteredDirectors = useMemo(() => {
    if (!directorSearchQuery) return directorsWithAreas;

    const query = directorSearchQuery.toLowerCase();
    return directorsWithAreas.filter(d =>
      d.nombre.toLowerCase().includes(query) ||
      d.puesto?.toLowerCase().includes(query)
    );
  }, [directorsWithAreas, directorSearchQuery]);

  // Get areas for selected director
  const directorAreas = useMemo(() => {
    if (!selectedDirector) return [];

    const directorAreaIds = directorioAreas
      .filter(da => da.id_directorio === selectedDirector.id_directorio)
      .map(da => da.id_area);

    return areas.filter(a => directorAreaIds.includes(a.id_area));
  }, [selectedDirector, areas, directorioAreas]);

  // Get bienes for selected areas
  const areaBienes = useMemo(() => {
    if (selectedAreas.length === 0) return [];

    // For partial transfer, only show bienes from the first selected area
    const targetAreaId = selectedAreas[0];
    return bienes.filter(b => b.id_area === targetAreaId);
  }, [selectedAreas, bienes]);

  // Filter bienes by search query
  const filteredBienes = useMemo(() => {
    if (!bienSearchQuery) return areaBienes;

    const query = bienSearchQuery.toLowerCase();
    return areaBienes.filter(b =>
      b.id_inv.toLowerCase().includes(query) ||
      b.descripcion.toLowerCase().includes(query)
    );
  }, [areaBienes, bienSearchQuery]);

  // Handle director selection
  const handleSelectDirector = (directorId: number) => {
    onSelectDirector(directorId);
    setCurrentStep('select_areas');
  };

  // Handle back to director selection
  const handleBackToDirectors = () => {
    // Clear selections when going back
    if (selectedAreas.length > 0) {
      selectedAreas.forEach(areaId => onDeselectArea(areaId));
    }
    if (selectedBienes.length > 0) {
      onDeselectBienes(selectedBienes.map(b => b.id));
    }
    setCurrentStep('select_director');
  };

  // Handle area selection (single selection only, no deselection)
  const handleAreaSelect = (areaId: number) => {
    // If clicking on already selected area, do nothing
    if (selectedAreas.includes(areaId)) {
      return;
    }

    // Deselect current area if any
    if (selectedAreas.length > 0) {
      onDeselectArea(selectedAreas[0]);
    }

    // Select new area
    onSelectArea(areaId);
  };

  // Handle bien toggle
  const handleBienToggle = (bien: Bien) => {
    const isSelected = selectedBienes.some(b => b.id === bien.id && b.source === bien.source);

    if (isSelected) {
      // Only deselect the bien with matching ID and source
      const remainingBienes = selectedBienes.filter(b => !(b.id === bien.id && b.source === bien.source));
      onSelectBienes(remainingBienes);
    } else {
      const selectedBien: SelectedBien = {
        id: bien.id,
        id_inv: bien.id_inv,
        descripcion: bien.descripcion,
        valor: bien.valor,
        source: bien.source,
        id_area: bien.id_area,
      };
      onSelectBienes([...selectedBienes, selectedBien]);
    }
  };

  // Handle select all bienes
  const handleSelectAllBienes = () => {
    const allBienes: SelectedBien[] = filteredBienes.map(b => ({
      id: b.id,
      id_inv: b.id_inv,
      descripcion: b.descripcion,
      valor: b.valor,
      source: b.source,
      id_area: b.id_area,
    }));
    onSelectBienes(allBienes);
  };

  // Handle deselect all bienes
  const handleDeselectAllBienes = () => {
    onSelectBienes([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Step Indicator */}
      <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
        <h2 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Seleccionar Origen
        </h2>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${currentStep === 'select_director'
            ? isDarkMode ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
            : isDarkMode ? 'text-white/40' : 'text-black/40'
            }`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === 'select_director'
              ? isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
              : isDarkMode ? 'bg-white/20 text-white/60' : 'bg-black/20 text-black/60'
              }`}>
              1
            </div>
            <span className="text-sm font-medium">Director</span>
          </div>

          <ChevronRight className={`w-4 h-4 ${isDarkMode ? 'text-white/20' : 'text-black/20'}`} />

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${currentStep === 'select_areas'
            ? isDarkMode ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
            : isDarkMode ? 'text-white/40' : 'text-black/40'
            }`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === 'select_areas'
              ? isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
              : isDarkMode ? 'bg-white/20 text-white/60' : 'bg-black/20 text-black/60'
              }`}>
              2
            </div>
            <span className="text-sm font-medium">Áreas</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <AnimatePresence mode="wait">
          {currentStep === 'select_director' && (
            <motion.div
              key="select_director"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
                <input
                  type="text"
                  value={directorSearchQuery}
                  onChange={(e) => setDirectorSearchQuery(e.target.value)}
                  placeholder="Buscar director..."
                  className={`
                    w-full pl-10 pr-4 py-2 rounded-lg
                    border focus:outline-none focus:ring-2 focus:ring-blue-500/50
                    ${isDarkMode
                      ? 'border-white/10 bg-black text-white placeholder:text-white/40'
                      : 'border-black/10 bg-white text-black placeholder:text-black/40'
                    }
                  `}
                />
              </div>

              {/* Directors List */}
              <div className="space-y-2">
                {filteredDirectors.length === 0 ? (
                  <div className={`text-center py-8 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                    {directorSearchQuery ? 'No se encontraron directores' : 'No hay directores con áreas asignadas'}
                  </div>
                ) : (
                  filteredDirectors.map((director) => (
                    <button
                      key={director.id_directorio}
                      onClick={() => handleSelectDirector(director.id_directorio)}
                      className={`
                        w-full px-4 py-3 rounded-lg
                        border transition-all duration-200
                        text-left
                        focus:outline-none focus:ring-2 focus:ring-offset-0
                        ${isDarkMode
                          ? 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                          : 'border-black/10 hover:border-black/20 hover:bg-black/[0.02]'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            {director.nombre}
                          </div>
                          {director.puesto && (
                            <div className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                              {director.puesto}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                            {getDirectorAreaCount(director.id_directorio)} áreas
                          </div>
                          <ChevronRight className={`w-4 h-4 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {currentStep === 'select_areas' && selectedDirector && (
            <motion.div
              key="select_areas"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Back Button + Selected Director Info */}
              <button
                onClick={handleBackToDirectors}
                className={`
                  flex items-center gap-2 mb-4 px-3 py-2 rounded-lg
                  transition-colors
                  ${isDarkMode ? 'hover:bg-white/5 text-white/60' : 'hover:bg-black/5 text-black/60'}
                `}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Cambiar director</span>
              </button>

              <div className={`mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {selectedDirector.nombre}
                </div>
                {selectedDirector.puesto && (
                  <div className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                    {selectedDirector.puesto}
                  </div>
                )}
              </div>

              {/* Search Bar for Areas */}
              <div className="relative mb-3">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
                <input
                  type="text"
                  value={bienSearchQuery}
                  onChange={(e) => setBienSearchQuery(e.target.value)}
                  placeholder="Buscar área..."
                  className={`
                    w-full pl-10 pr-4 py-2 rounded-lg
                    border focus:outline-none focus:ring-2 focus:ring-blue-500/50
                    ${isDarkMode
                      ? 'border-white/10 bg-black text-white placeholder:text-white/40'
                      : 'border-black/10 bg-white text-black placeholder:text-black/40'
                    }
                  `}
                />
              </div>

              {/* Area List */}
              <div className="space-y-2">
                {directorAreas
                  .filter(area =>
                    !bienSearchQuery ||
                    area.nombre.toLowerCase().includes(bienSearchQuery.toLowerCase())
                  )
                  .map((area) => {
                    const hasResguardos = (area.resguardoCount || 0) > 0;
                    const isSelected = selectedAreas.includes(area.id_area);

                    return (
                      <button
                        key={area.id_area}
                        onClick={() => !hasResguardos && handleAreaSelect(area.id_area)}
                        disabled={hasResguardos}
                        className={`
                          w-full px-4 py-3 rounded-lg
                          border transition-all duration-200
                          text-left
                          focus:outline-none focus:ring-2 focus:ring-offset-0
                          ${hasResguardos ? 'opacity-50 cursor-not-allowed' : ''}
                          ${isSelected
                            ? isDarkMode
                              ? 'border-white/20 bg-white/5'
                              : 'border-black/20 bg-black/5'
                            : isDarkMode
                              ? 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                              : 'border-black/10 hover:border-black/20 hover:bg-black/[0.02]'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {/* Radio Button */}
                            <div className={`
                              w-4 h-4 rounded-full border-2 flex items-center justify-center
                              transition-colors duration-200
                              ${isSelected
                                ? isDarkMode
                                  ? 'border-white bg-transparent'
                                  : 'border-black bg-transparent'
                                : isDarkMode
                                  ? 'border-white/20'
                                  : 'border-black/20'
                              }
                            `}>
                              {isSelected && (
                                <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                {area.nombre}
                              </div>
                              <div className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                                {area.bienCount || 0} bienes
                              </div>
                            </div>
                          </div>
                          {hasResguardos && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded ${isDarkMode ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-500/10 text-yellow-600'}`}>
                              <AlertTriangle className="w-3 h-3" />
                              <span className="text-xs font-medium">
                                {area.resguardoCount}
                              </span>
                            </div>
                          )}
                          {!hasResguardos && (
                            <ChevronRight className={`w-4 h-4 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
