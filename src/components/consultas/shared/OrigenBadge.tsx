'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import TransferOrigenModal from './modals/TransferOrigenModal';

export type OrigenType = 'inea' | 'itea' | 'no-listado' | 'INEA' | 'ITEJPA' | 'TLAXCALA';

interface OrigenBadgeProps {
  currentOrigen: OrigenType;
  idInventario: string;
  recordId: string;
  onTransferSuccess: () => void;
  disabled?: boolean;
  hasActiveResguardo?: boolean;
  isDarkMode?: boolean;
  variant?: 'default' | 'levantamiento';
  itemDescription?: string;
  itemArea?: string;
  itemDirector?: string;
  itemColor?: string | null;
  itemColorName?: string | null;
  itemColorSignificado?: string | null;
}

const ORIGEN_CONFIG = {
  inea: {
    label: 'INEA',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    hoverBg: 'hover:bg-blue-200',
  },
  itea: {
    label: 'ITEJPA',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    hoverBg: 'hover:bg-green-200',
  },
  'no-listado': {
    label: 'TLAXCALA',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    hoverBg: 'hover:bg-gray-200',
  },
  INEA: {
    label: 'INEA',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    hoverBg: 'hover:bg-blue-200',
  },
  ITEJPA: {
    label: 'ITEJPA',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    hoverBg: 'hover:bg-green-200',
  },
  TLAXCALA: {
    label: 'TLAXCALA',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    hoverBg: 'hover:bg-purple-200',
  },
};

// Configuración para el diseño de Levantamiento (dark mode compatible)
const getLevantamientoConfig = (isDarkMode: boolean) => ({
  INEA: isDarkMode 
    ? 'bg-white/90 text-gray-900 border border-white/80' 
    : 'bg-blue-50 text-blue-900 border border-blue-200',
  ITEJPA: isDarkMode 
    ? 'bg-white/80 text-gray-900 border border-white/70' 
    : 'bg-green-50 text-green-900 border border-green-200',
  TLAXCALA: isDarkMode 
    ? 'bg-white/70 text-gray-900 border border-white/60' 
    : 'bg-purple-50 text-purple-900 border border-purple-200',
});

export default function OrigenBadge({
  currentOrigen,
  idInventario,
  recordId,
  onTransferSuccess,
  disabled = false,
  hasActiveResguardo = false,
  isDarkMode = false,
  variant = 'default',
  itemDescription = '',
  itemArea = '',
  itemDirector = '',
  itemColor = null,
  itemColorName = null,
  itemColorSignificado = null,
}: OrigenBadgeProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTargetOrigen, setSelectedTargetOrigen] = useState<OrigenType | null>(null);

  const config = ORIGEN_CONFIG[currentOrigen];
  const levantamientoConfig = getLevantamientoConfig(isDarkMode);

  // Normalizar origen para compatibilidad con API
  const normalizeOrigen = (origen: OrigenType): 'inea' | 'itea' | 'no-listado' => {
    if (origen === 'INEA') return 'inea';
    if (origen === 'ITEJPA') return 'itea';
    if (origen === 'TLAXCALA') return 'no-listado';
    return origen as 'inea' | 'itea' | 'no-listado';
  };

  // Obtener opciones de destino según el variant
  const getTargetOptions = (): OrigenType[] => {
    if (variant === 'levantamiento') {
      return (['INEA', 'ITEJPA', 'TLAXCALA'] as OrigenType[]).filter(
        (origen) => origen !== currentOrigen
      );
    } else {
      return (Object.keys(ORIGEN_CONFIG) as OrigenType[])
        .filter((key) => !['INEA', 'ITEJPA', 'TLAXCALA'].includes(key))
        .filter((origen) => origen !== currentOrigen);
    }
  };

  const targetOptions = getTargetOptions();

  const handleBadgeClick = () => {
    if (!disabled && !hasActiveResguardo) {
      setIsModalOpen(true);
    }
  };

  const handleTargetSelect = (targetOrigen: OrigenType) => {
    setSelectedTargetOrigen(targetOrigen);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTargetOrigen(null);
  };

  const handleTransferSuccess = () => {
    setIsModalOpen(false);
    setSelectedTargetOrigen(null);
    onTransferSuccess();
  };

  // Si está deshabilitado o tiene resguardo, solo mostrar badge sin interacción
  if (disabled || hasActiveResguardo) {
    if (variant === 'levantamiento') {
      return (
        <span 
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${levantamientoConfig[currentOrigen as 'INEA' | 'ITEJPA' | 'TLAXCALA']}`}
          title={hasActiveResguardo ? 'No se puede transferir: tiene resguardo activo' : 'Transferencia deshabilitada'}
        >
          {config.label}
        </span>
      );
    }
    
    return (
      <div
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
        title={hasActiveResguardo ? 'No se puede transferir: tiene resguardo activo' : 'Transferencia deshabilitada'}
      >
        {config.label}
      </div>
    );
  }

  // Badge interactivo para levantamiento
  if (variant === 'levantamiento') {
    return (
      <>
        <button
          onClick={handleBadgeClick}
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-all cursor-pointer hover:opacity-80 ${levantamientoConfig[currentOrigen as 'INEA' | 'ITEJPA' | 'TLAXCALA']}`}
          title="Click para cambiar origen"
        >
          {config.label}
        </button>

        {/* Modal de selección de origen */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-black/40'}`}
              onClick={handleModalClose}
            />

            {/* Modal content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className={`relative rounded-lg shadow-xl max-w-lg w-full mx-4 ${
                isDarkMode ? 'bg-black border border-white/20' : 'bg-white border border-gray-200'
              }`}
            >
              {/* Header */}
              <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Transferir origen
                </h3>
              </div>

              {/* Body */}
              <div className="px-6 py-4 space-y-4">
                {/* Item Details */}
                <div className={`p-3 rounded-lg border ${
                  isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className={`text-xs font-medium min-w-[80px] ${
                        isDarkMode ? 'text-white/60' : 'text-gray-600'
                      }`}>
                        ID:
                      </span>
                      <span className={`text-xs font-mono ${
                        idInventario 
                          ? isDarkMode ? 'text-white' : 'text-black'
                          : isDarkMode ? 'text-white/40' : 'text-gray-400'
                      }`}>
                        {idInventario || 'Sin ID'}
                      </span>
                    </div>
                    {itemDescription && (
                      <div className="flex items-start gap-2">
                        <span className={`text-xs font-medium min-w-[80px] ${
                          isDarkMode ? 'text-white/60' : 'text-gray-600'
                        }`}>
                          Descripción:
                        </span>
                        <span className={`text-xs line-clamp-2 ${
                          isDarkMode ? 'text-white/80' : 'text-black/80'
                        }`}>
                          {itemDescription}
                        </span>
                      </div>
                    )}
                    {itemArea && (
                      <div className="flex items-start gap-2">
                        <span className={`text-xs font-medium min-w-[80px] ${
                          isDarkMode ? 'text-white/60' : 'text-gray-600'
                        }`}>
                          Área:
                        </span>
                        <span className={`text-xs ${
                          isDarkMode ? 'text-white/80' : 'text-black/80'
                        }`}>
                          {itemArea}
                        </span>
                      </div>
                    )}
                    {itemDirector && (
                      <div className="flex items-start gap-2">
                        <span className={`text-xs font-medium min-w-[80px] ${
                          isDarkMode ? 'text-white/60' : 'text-gray-600'
                        }`}>
                          Director:
                        </span>
                        <span className={`text-xs ${
                          isDarkMode ? 'text-white/80' : 'text-black/80'
                        }`}>
                          {itemDirector}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Origen Selection */}
                <div>
                  <p className={`text-xs mb-4 ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>
                    Selecciona el nuevo origen:
                  </p>
                  <div className="flex gap-4 justify-center">
                    {targetOptions.map((targetOrigen) => {
                      const targetConfig = ORIGEN_CONFIG[targetOrigen];
                      const targetLevConfig = levantamientoConfig[targetOrigen as 'INEA' | 'ITEJPA' | 'TLAXCALA'];
                      const isSelected = selectedTargetOrigen === targetOrigen;
                      
                      return (
                        <motion.button
                          key={targetOrigen}
                          onClick={() => handleTargetSelect(targetOrigen)}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          className={`relative inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all ${targetLevConfig} ${
                            isSelected
                              ? 'ring-2 ring-offset-2 ' + (isDarkMode ? 'ring-white/40 ring-offset-black' : 'ring-gray-400 ring-offset-white')
                              : 'hover:opacity-80'
                          }`}
                        >
                          {targetConfig.label}
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-lg ${
                                isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                              }`}
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className={`px-6 py-4 border-t flex gap-2 justify-end ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                <button
                  onClick={handleModalClose}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                    isDarkMode
                      ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                      : 'bg-gray-100 hover:bg-gray-200 text-black border border-gray-200'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (selectedTargetOrigen) {
                      handleModalClose();
                      // Abrir modal de confirmación
                      setTimeout(() => {
                        setSelectedTargetOrigen(selectedTargetOrigen);
                        setIsModalOpen(false);
                      }, 100);
                    }
                  }}
                  disabled={!selectedTargetOrigen}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                    selectedTargetOrigen
                      ? isDarkMode
                        ? 'bg-white text-black hover:bg-white/90'
                        : 'bg-black text-white hover:bg-black/90'
                      : isDarkMode
                        ? 'bg-white/10 text-white/40 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continuar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal de confirmación de transferencia */}
        {!isModalOpen && selectedTargetOrigen && (
          <TransferOrigenModal
            isOpen={true}
            onClose={() => setSelectedTargetOrigen(null)}
            idInventario={idInventario}
            recordId={recordId}
            currentOrigen={normalizeOrigen(currentOrigen)}
            targetOrigen={normalizeOrigen(selectedTargetOrigen)}
            onSuccess={handleTransferSuccess}
            isDarkMode={isDarkMode}
            itemDescription={itemDescription}
            itemArea={itemArea}
            itemDirector={itemDirector}
            itemColor={itemColor}
            itemColorName={itemColorName}
            itemColorSignificado={itemColorSignificado}
          />
        )}
      </>
    );
  }

  // Badge interactivo default
  return (
    <>
      <div className="relative inline-block">
        <button
          onClick={() => setIsModalOpen(true)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${config.bgColor} ${config.textColor} ${config.hoverBg} cursor-pointer`}
          title="Click para cambiar origen"
        >
          {config.label}
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Modal de confirmación */}
      {isModalOpen && selectedTargetOrigen && (
        <TransferOrigenModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          idInventario={idInventario}
          recordId={recordId}
          currentOrigen={currentOrigen as 'inea' | 'itea' | 'no-listado'}
          targetOrigen={selectedTargetOrigen as 'inea' | 'itea' | 'no-listado'}
          onSuccess={handleTransferSuccess}
          itemColor={itemColor}
          itemColorName={itemColorName}
          itemColorSignificado={itemColorSignificado}
        />
      )}
    </>
  );
}
