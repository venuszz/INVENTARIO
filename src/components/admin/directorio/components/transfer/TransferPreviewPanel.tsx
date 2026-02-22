'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Search, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import type { TransferPreview, ValidationError } from '../../types/transfer';

/**
 * TransferPreviewPanel Component
 * 
 * Wizard-style panel for selecting target director and area (if needed).
 * Similar UX to SourceSelectionPanel with step-by-step flow.
 * 
 * Steps:
 * 1. Select Target Director (with search)
 * 2. Select Target Area (only for partial transfers)
 * 3. Review & Confirm
 * 
 * Features:
 * - Step-by-step wizard interface
 * - Search bar for directors
 * - Area selection for partial transfers
 * - Transfer summary with statistics
 * - Dark mode support
 * - Responsive vh-based heights
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
}

interface TransferPreviewPanelProps {
  preview: TransferPreview | null;
  targetDirectors: Director[];
  selectedTargetDirector: Director | null;
  targetAreas: Area[];
  selectedTargetArea: number | null;
  onSelectTargetDirector: (directorId: number) => void;
  onSelectTargetArea: (areaId: number) => void;
  onConfirm: () => void;
  isValidating: boolean;
  validationErrors: ValidationError[];
}

type WizardStep = 'select_director' | 'select_area' | 'review';

export function TransferPreviewPanel({
  preview,
  targetDirectors,
  selectedTargetDirector,
  targetAreas,
  selectedTargetArea,
  onSelectTargetDirector,
  onSelectTargetArea,
  onConfirm,
  isValidating,
  validationErrors,
}: TransferPreviewPanelProps) {
  const { isDarkMode } = useTheme();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('select_director');
  const [directorSearchQuery, setDirectorSearchQuery] = useState('');
  const [areaSearchQuery, setAreaSearchQuery] = useState('');

  // Filter directors by search query
  const filteredDirectors = targetDirectors.filter(d =>
    !directorSearchQuery ||
    d.nombre.toLowerCase().includes(directorSearchQuery.toLowerCase()) ||
    d.puesto?.toLowerCase().includes(directorSearchQuery.toLowerCase())
  );

  // Filter areas by search query
  const filteredAreas = targetAreas.filter(a =>
    !areaSearchQuery ||
    a.nombre.toLowerCase().includes(areaSearchQuery.toLowerCase())
  );

  // Handle director selection
  const handleSelectDirector = (directorId: number) => {
    onSelectTargetDirector(directorId);
    
    // Always go to area selection, regardless of transfer type
    setCurrentStep('select_area');
  };

  // Handle area selection
  const handleSelectArea = (areaId: number) => {
    onSelectTargetArea(areaId);
    setCurrentStep('review');
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentStep === 'review') {
      setCurrentStep('select_area');
    } else if (currentStep === 'select_area') {
      setCurrentStep('select_director');
    }
  };

  // Check if can confirm - always require target area selection
  const canConfirm = preview && 
    selectedTargetDirector && 
    selectedTargetArea !== null &&
    validationErrors.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header with Step Indicator */}
      <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
        <h2 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Seleccionar Destino
        </h2>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            currentStep === 'select_director'
              ? isDarkMode ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
              : isDarkMode ? 'text-white/40' : 'text-black/40'
          }`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
              currentStep === 'select_director'
                ? isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                : isDarkMode ? 'bg-white/20 text-white/60' : 'bg-black/20 text-black/60'
            }`}>
              1
            </div>
            <span className="text-sm font-medium">Director</span>
          </div>
          
          <ChevronRight className={`w-4 h-4 ${isDarkMode ? 'text-white/20' : 'text-black/20'}`} />
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            currentStep === 'select_area'
              ? isDarkMode ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
              : isDarkMode ? 'text-white/40' : 'text-black/40'
          }`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
              currentStep === 'select_area'
                ? isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                : isDarkMode ? 'bg-white/20 text-white/60' : 'bg-black/20 text-black/60'
            }`}>
              2
            </div>
            <span className="text-sm font-medium">Área</span>
          </div>
          
          <ChevronRight className={`w-4 h-4 ${isDarkMode ? 'text-white/20' : 'text-black/20'}`} />
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            currentStep === 'review'
              ? isDarkMode ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
              : isDarkMode ? 'text-white/40' : 'text-black/40'
          }`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
              currentStep === 'review'
                ? isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                : isDarkMode ? 'bg-white/20 text-white/60' : 'bg-black/20 text-black/60'
            }`}>
              3
            </div>
            <span className="text-sm font-medium">Confirmar</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <AnimatePresence mode="wait">
          {/* Step 1: Select Director */}
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
                    No se encontraron directores
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
                        <ChevronRight className={`w-4 h-4 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Select Area (always shown) */}
          {currentStep === 'select_area' && selectedTargetDirector && (
            <motion.div
              key="select_area"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Back Button + Selected Director Info */}
              <button
                onClick={handleBack}
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
                  {selectedTargetDirector.nombre}
                </div>
                {selectedTargetDirector.puesto && (
                  <div className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                    {selectedTargetDirector.puesto}
                  </div>
                )}
              </div>

              {/* For complete area transfer, show option to create new or merge */}
              {preview?.transferType === 'complete_area' && (
                <div className={`mb-4 p-3 rounded-lg border ${isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-black/10 bg-black/[0.02]'}`}>
                  <div className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-white/70' : 'text-black/70'}`}>
                    ¿Cómo deseas transferir el área?
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                    Puedes transferir el área completa (se eliminará del director origen) o fusionar los bienes a un área existente.
                  </div>
                </div>
              )}

              {/* Option 1: Create new area (only for complete transfer) */}
              {preview?.transferType === 'complete_area' && (
                <button
                  onClick={() => handleSelectArea(-1)} // -1 indicates "create new area"
                  className={`
                    w-full px-4 py-3 rounded-lg mb-3
                    border-2 transition-all duration-200
                    text-left
                    focus:outline-none focus:ring-2 focus:ring-offset-0
                    ${isDarkMode
                      ? 'border-white/20 hover:border-white/30 hover:bg-white/[0.03] bg-white/[0.02]'
                      : 'border-black/20 hover:border-black/30 hover:bg-black/[0.03] bg-black/[0.02]'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}>
                      <svg className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-black'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold mb-0.5 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        Transferir área completa
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                        El área "{preview.sourceDirector.areas[0]?.nombre}" se moverá al director destino y se eliminará del origen
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
                  </div>
                </button>
              )}

              {/* Divider (only for complete transfer) */}
              {preview?.transferType === 'complete_area' && (
                <div className="relative mb-3">
                  <div className={`absolute inset-0 flex items-center ${isDarkMode ? 'text-white/20' : 'text-black/20'}`}>
                    <div className="w-full border-t"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className={`px-2 ${isDarkMode ? 'bg-black text-white/40' : 'bg-white text-black/40'}`}>
                      o fusionar a área existente
                    </span>
                  </div>
                </div>
              )}

              {/* Search Bar for Areas */}
              <div className="relative mb-3">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
                <input
                  type="text"
                  value={areaSearchQuery}
                  onChange={(e) => setAreaSearchQuery(e.target.value)}
                  placeholder="Buscar área existente..."
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
                {filteredAreas.length === 0 ? (
                  <div className={`text-center py-8 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                    No se encontraron áreas
                  </div>
                ) : (
                  filteredAreas.map((area) => (
                    <button
                      key={area.id_area}
                      onClick={() => handleSelectArea(area.id_area)}
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
                            {area.nombre}
                          </div>
                          <div className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                            {area.bienCount || 0} bienes
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Review & Confirm */}
          {currentStep === 'review' && preview && selectedTargetDirector && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              {/* Back Button */}
              <button
                onClick={handleBack}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg mb-3
                  transition-colors
                  ${isDarkMode ? 'hover:bg-white/5 text-white/60' : 'hover:bg-black/5 text-black/60'}
                `}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Atrás</span>
              </button>

              {/* Transfer Summary - Redesigned */}
              <div className="flex-1 flex flex-col gap-4 min-h-0">
                {/* Main Transfer Card */}
                <div className={`flex-1 flex flex-col rounded-xl border-2 overflow-hidden ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                  {/* Source Section - Takes 45% */}
                  <div className={`flex-[45] p-6 ${isDarkMode ? 'bg-white/[0.03]' : 'bg-black/[0.03]'}`}>
                    <div className="h-full flex flex-col justify-center">
                      <div className={`text-[10px] font-bold tracking-[0.15em] mb-3 ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                        DESDE
                      </div>
                      <div className={`text-xl font-bold mb-1.5 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {preview.sourceDirector.nombre}
                      </div>
                      {preview.sourceDirector.puesto && (
                        <div className={`text-xs mb-4 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                          {preview.sourceDirector.puesto}
                        </div>
                      )}
                      {preview.sourceDirector.areas.length > 0 && (
                        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg mt-auto ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                          <div className={`text-[10px] font-medium ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                            ÁREA:
                          </div>
                          <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            {preview.sourceDirector.areas[0]?.nombre}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arrow Section - Takes 10% */}
                  <div className={`flex-[10] flex items-center justify-center ${isDarkMode ? 'bg-white/[0.01]' : 'bg-black/[0.01]'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                      <svg className={`w-6 h-6 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>

                  {/* Destination Section - Takes 45% */}
                  <div className={`flex-[45] p-6 ${isDarkMode ? 'bg-white/[0.03]' : 'bg-black/[0.03]'}`}>
                    <div className="h-full flex flex-col justify-center">
                      <div className={`text-[10px] font-bold tracking-[0.15em] mb-3 ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                        HACIA
                      </div>
                      <div className={`text-xl font-bold mb-1.5 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {selectedTargetDirector.nombre}
                      </div>
                      {selectedTargetDirector.puesto && (
                        <div className={`text-xs mb-4 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                          {selectedTargetDirector.puesto}
                        </div>
                      )}
                      {selectedTargetArea && (
                        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg mt-auto ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                          <div className={`text-[10px] font-medium ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                            {selectedTargetArea === -1 ? 'NUEVA ÁREA:' : 'ÁREA:'}
                          </div>
                          <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            {selectedTargetArea === -1 
                              ? preview.sourceDirector.areas[0]?.nombre 
                              : targetAreas.find(a => a.id_area === selectedTargetArea)?.nombre}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Info Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Transfer Type */}
                  <div className={`col-span-3 p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                    <div className={`text-[10px] font-bold tracking-wider mb-1 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                      TIPO DE TRANSFERENCIA
                    </div>
                    <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {preview.transferType === 'complete_area' 
                        ? 'Área Completa' 
                        : 'Bienes Seleccionados'}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                    <div className={`text-[10px] font-bold tracking-wider mb-1 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                      BIENES
                    </div>
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {preview.totalCount}
                    </div>
                  </div>

                  <div className={`col-span-2 p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                    <div className={`text-[10px] font-bold tracking-wider mb-1 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                      VALOR TOTAL
                    </div>
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      ${preview.totalValue.toLocaleString('es-MX')}
                    </div>
                  </div>

                  {/* Warning */}
                  <div className={`col-span-3 p-3 rounded-lg border ${isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-black/10 bg-black/[0.02]'}`}>
                    <div className={`text-[10px] font-bold tracking-wider mb-1.5 ${isDarkMode ? 'text-white/50' : 'text-black/50'}`}>
                      ⚠ ACCIÓN IRREVERSIBLE
                    </div>
                    <div className={`text-xs leading-relaxed ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                      {preview.transferType === 'complete_area' ? (
                        selectedTargetArea === -1 ? (
                          <>
                            El área "{preview.sourceDirector.areas[0]?.nombre}" se transferirá completamente al director destino. 
                            <span className={`font-semibold ${isDarkMode ? 'text-white/80' : 'text-black/80'}`}> El área se eliminará del director origen</span> ya que no puede pertenecer a dos directores simultáneamente. 
                            Se actualizarán INEA, ITEA y No Listado.
                          </>
                        ) : (
                          <>
                            Todos los bienes del área origen se fusionarán al área destino seleccionada. 
                            El área origen permanecerá con el director pero sin bienes. 
                            Se actualizarán INEA, ITEA y No Listado.
                          </>
                        )
                      ) : (
                        <>Los {preview.totalCount} bienes seleccionados se moverán al área destino. El área origen conservará sus bienes restantes.</>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={onConfirm}
                disabled={!canConfirm || isValidating}
                className={`
                  w-full px-6 py-3 rounded-lg mt-3
                  text-sm font-semibold
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${
                    canConfirm && !isValidating
                      ? isDarkMode
                        ? 'bg-white text-black hover:bg-white/90 focus:ring-white/30 focus:ring-offset-black'
                        : 'bg-black text-white hover:bg-black/90 focus:ring-black/30 focus:ring-offset-white'
                      : isDarkMode
                        ? 'bg-white/20 text-white/50 cursor-not-allowed'
                        : 'bg-black/20 text-black/50 cursor-not-allowed'
                  }
                `}
              >
                {isValidating ? 'Validando...' : 'Confirmar Transferencia'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
