import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Step2Props } from '../types';
import { useAdminIndexation } from '@/hooks/indexation/useAdminIndexation';

// Custom Estado Físico Select Component with colors
interface EstadoFisicoSelectProps {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
  isDarkMode: boolean;
  showError?: boolean;
}

const ESTADO_CONFIG = {
  'BUENO': { 
    label: 'Bueno', 
    color: (isDark: boolean) => isDark ? 'text-green-400' : 'text-green-600',
    bg: (isDark: boolean) => isDark ? 'bg-green-500/10' : 'bg-green-50',
    border: (isDark: boolean) => isDark ? 'border-green-500/30' : 'border-green-200',
    dot: (isDark: boolean) => isDark ? 'bg-green-400' : 'bg-green-500'
  },
  'REGULAR': { 
    label: 'Regular', 
    color: (isDark: boolean) => isDark ? 'text-yellow-400' : 'text-yellow-600',
    bg: (isDark: boolean) => isDark ? 'bg-yellow-500/10' : 'bg-yellow-50',
    border: (isDark: boolean) => isDark ? 'border-yellow-500/30' : 'border-yellow-200',
    dot: (isDark: boolean) => isDark ? 'bg-yellow-400' : 'bg-yellow-500'
  },
  'MALO': { 
    label: 'Malo', 
    color: (isDark: boolean) => isDark ? 'text-red-400' : 'text-red-600',
    bg: (isDark: boolean) => isDark ? 'bg-red-500/10' : 'bg-red-50',
    border: (isDark: boolean) => isDark ? 'border-red-500/30' : 'border-red-200',
    dot: (isDark: boolean) => isDark ? 'bg-red-400' : 'bg-red-500'
  }
};

function EstadoFisicoSelect({ value, onChange, hasError, isDarkMode, showError }: EstadoFisicoSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (estado: string) => {
    onChange(estado);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const currentConfig = value ? ESTADO_CONFIG[value as keyof typeof ESTADO_CONFIG] : null;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group w-full px-0 pb-2 border-b-2 text-sm text-left transition-all flex items-center justify-between bg-transparent ${
          showError && hasError
            ? 'border-red-500'
            : value
              ? isDarkMode
                ? 'border-white/40 hover:border-white/60 focus:border-white'
                : 'border-black/40 hover:border-black/60 focus:border-black'
              : isDarkMode
                ? 'border-white/10 hover:border-white/20 focus:border-white'
                : 'border-black/10 hover:border-black/20 focus:border-black'
        } focus:outline-none`}
      >
        {value && currentConfig ? (
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${currentConfig.dot(isDarkMode)}`} />
            <span className={currentConfig.color(isDarkMode)}>{currentConfig.label}</span>
          </span>
        ) : (
          <span className={isDarkMode ? 'text-white/40' : 'text-black/40'}>
            Seleccionar estado...
          </span>
        )}
        <div className="flex items-center gap-2">
          {value && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={handleClear}
              className={`p-0.5 rounded-full transition-colors ${
                isDarkMode ? 'hover:bg-white/20' : 'hover:bg-black/20'
              }`}
            >
              <X size={12} />
            </motion.div>
          )}
          <ChevronDown 
            size={16} 
            className={`transition-transform ${isOpen ? 'rotate-180' : ''} ${
              isDarkMode ? 'text-white/40' : 'text-black/40'
            }`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 w-full mt-2 rounded-lg border overflow-hidden backdrop-blur-xl ${
              isDarkMode
                ? 'bg-black/95 border-white/10 shadow-2xl shadow-white/5'
                : 'bg-white/95 border-black/10 shadow-2xl shadow-black/5'
            }`}
          >
            <div className="py-2">
              {Object.entries(ESTADO_CONFIG).map(([key, config]) => (
                <motion.button
                  key={key}
                  type="button"
                  onClick={() => handleSelect(key)}
                  className={`w-full px-4 py-3 text-sm text-left transition-all flex items-center gap-3 ${
                    value === key
                      ? `${config.bg(isDarkMode)} ${config.border(isDarkMode)} border-l-2`
                      : isDarkMode
                        ? 'hover:bg-white/5'
                        : 'hover:bg-black/5'
                  }`}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.15 }}
                >
                  <span className={`w-3 h-3 rounded-full ${config.dot(isDarkMode)}`} />
                  <span className={`flex-1 font-medium ${config.color(isDarkMode)}`}>
                    {config.label}
                  </span>
                  {value === key && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`p-1 rounded-full ${
                        isDarkMode ? 'bg-white/20' : 'bg-black/20'
                      }`}
                    >
                      <Check size={12} className={config.color(isDarkMode)} />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Custom Select Component (reused from Step1)
interface CustomSelectProps {
  value: string;
  options: string[];
  optionsWithDetails?: Array<{ nombre: string; area?: string; puesto?: string }>;
  onChange: (value: string) => void;
  placeholder: string;
  hasError?: boolean;
  isDarkMode: boolean;
  showError?: boolean;
}

function CustomSelect({ value, options, optionsWithDetails, onChange, placeholder, hasError, isDarkMode, showError }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredOptions = optionsWithDetails 
    ? optionsWithDetails.filter(option =>
        option.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.area?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className={`group w-full px-0 pb-2 border-b-2 text-sm text-left transition-all flex items-center justify-between bg-transparent ${
          showError && hasError
            ? 'border-red-500'
            : value
              ? isDarkMode
                ? 'border-white/40 hover:border-white/60 focus:border-white'
                : 'border-black/40 hover:border-black/60 focus:border-black'
              : isDarkMode
                ? 'border-white/10 hover:border-white/20 focus:border-white'
                : 'border-black/10 hover:border-black/20 focus:border-black'
        } focus:outline-none`}
      >
        <span className={`flex-1 ${value ? '' : isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
          {value || placeholder}
        </span>
        <div className="flex items-center gap-2">
          {value && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={handleClear}
              className={`p-0.5 rounded-full transition-colors ${
                isDarkMode ? 'hover:bg-white/20' : 'hover:bg-black/20'
              }`}
            >
              <X size={12} />
            </motion.div>
          )}
          <ChevronDown 
            size={16} 
            className={`transition-transform ${isOpen ? 'rotate-180' : ''} ${
              isDarkMode ? 'text-white/40' : 'text-black/40'
            }`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 w-full mt-2 rounded-lg border overflow-hidden backdrop-blur-xl ${
              isDarkMode
                ? 'bg-black/95 border-white/10 shadow-2xl shadow-white/5'
                : 'bg-white/95 border-black/10 shadow-2xl shadow-black/5'
            }`}
          >
            {/* Search input */}
            <div className={`p-3 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className={`w-full px-0 pb-1 border-b text-sm transition-all bg-transparent ${
                  isDarkMode
                    ? 'border-white/10 text-white placeholder:text-white/40 focus:border-white/30'
                    : 'border-black/10 text-black placeholder:text-black/40 focus:border-black/30'
                } focus:outline-none`}
              />
            </div>

            {/* Options list */}
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className={`px-4 py-8 text-sm text-center ${
                  isDarkMode ? 'text-white/40' : 'text-black/40'
                }`}>
                  No se encontraron resultados
                </div>
              ) : optionsWithDetails ? (
                filteredOptions.map((option, index) => {
                  const detailedOption = option as { nombre: string; area?: string; puesto?: string };
                  return (
                    <motion.button
                      key={index}
                      type="button"
                      onClick={() => handleSelect(detailedOption.nombre)}
                      className={`w-full px-4 py-3 text-left transition-all border-b ${
                        value === detailedOption.nombre
                          ? isDarkMode
                            ? 'bg-white/10 border-white/10'
                            : 'bg-black/10 border-black/10'
                          : isDarkMode
                            ? 'hover:bg-white/5 border-white/5'
                            : 'hover:bg-black/5 border-black/5'
                      }`}
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium mb-1 ${
                            value === detailedOption.nombre
                              ? isDarkMode ? 'text-white' : 'text-black'
                              : isDarkMode ? 'text-white/90' : 'text-black/90'
                          }`}>
                            {detailedOption.nombre}
                          </div>
                          <div className={`text-xs flex items-center gap-2 ${
                            isDarkMode ? 'text-white/40' : 'text-black/40'
                          }`}>
                            {detailedOption.area && (
                              <span className="truncate">{detailedOption.area}</span>
                            )}
                          </div>
                        </div>
                        {value === detailedOption.nombre && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`p-1 rounded-full flex-shrink-0 ${
                              isDarkMode ? 'bg-white/20' : 'bg-black/20'
                            }`}
                          >
                            <Check size={12} className={isDarkMode ? 'text-white' : 'text-black'} />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })
              ) : (
                (filteredOptions as string[]).map((option, index) => (
                  <motion.button
                    key={index}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full px-4 py-2.5 text-sm text-left transition-all flex items-center justify-between ${
                      value === option
                        ? isDarkMode
                          ? 'bg-white/10 text-white font-medium'
                          : 'bg-black/10 text-black font-medium'
                        : isDarkMode
                          ? 'hover:bg-white/5 text-white/80'
                          : 'hover:bg-black/5 text-black/80'
                    }`}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <span>{option}</span>
                    {value === option && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`p-1 rounded-full ${
                          isDarkMode ? 'bg-white/20' : 'bg-black/20'
                        }`}
                      >
                        <Check size={12} className={isDarkMode ? 'text-white' : 'text-black'} />
                      </motion.div>
                    )}
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Custom Date Input Component
interface CustomDateInputProps {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
  isDarkMode: boolean;
  showError?: boolean;
}

function CustomDateInput({ value, onChange, hasError, isDarkMode, showError }: CustomDateInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        setDisplayValue(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    input = input.replace(/\D/g, '');
    input = input.substring(0, 8);
    
    let formatted = '';
    if (input.length > 0) {
      let day = input.substring(0, 2);
      if (parseInt(day) > 31) day = '31';
      formatted = day;
      
      if (input.length >= 3) {
        let month = input.substring(2, 4);
        if (parseInt(month) > 12) month = '12';
        formatted += '-' + month;
      }
      
      if (input.length >= 5) {
        formatted += '-' + input.substring(4, 8);
      }
    }
    
    setDisplayValue(formatted);
    
    if (input.length === 8) {
      const day = input.substring(0, 2);
      const month = input.substring(2, 4);
      const year = input.substring(4, 8);
      
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900) {
        onChange(`${year}-${month}-${day}`);
      }
    } else if (input.length === 0) {
      onChange('');
    }
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleTextChange}
          placeholder="DD-MM-AAAA"
          className={`w-full px-0 pb-2 pr-8 border-b-2 text-sm transition-all bg-transparent ${
            showError && hasError
              ? 'border-red-500'
              : value
                ? isDarkMode
                  ? 'border-white/40 hover:border-white/60'
                  : 'border-black/40 hover:border-black/60'
                : isDarkMode
                  ? 'border-white/10 hover:border-white/20'
                  : 'border-black/10 hover:border-black/20'
          } ${isDarkMode ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'} focus:outline-none ${
            isDarkMode ? 'focus:border-white' : 'focus:border-black'
          }`}
        />
        <button
          type="button"
          onClick={() => dateInputRef.current?.showPicker()}
          className={`absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${
            isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
          }`}
        >
          <Calendar 
            size={16} 
            className={isDarkMode ? 'text-white/40' : 'text-black/40'} 
          />
        </button>
      </div>
      
      <input
        ref={dateInputRef}
        type="date"
        value={value}
        onChange={handleDatePickerChange}
        className="absolute opacity-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
}

export default function Step2LocationStatus({
  formData,
  filterOptions,
  touched,
  showAreaWarning = false,
  onChange,
  onBlur,
  onDirectorSelect,
  onAreaWarningClick,
  isFieldValid,
  isDarkMode
}: Step2Props) {
  const [showErrors, setShowErrors] = useState(false);
  
  // Get director data with areas from admin indexation
  const { directorio, areas, directorioAreas } = useAdminIndexation();
  
  // Build director-area map
  const directorAreasMap = directorioAreas.reduce((acc, rel) => {
    if (!acc[rel.id_directorio]) acc[rel.id_directorio] = [];
    acc[rel.id_directorio].push(rel.id_area);
    return acc;
  }, {} as { [id_directorio: number]: number[] });
  
  // Build options with details including areas from relations
  const directoresWithDetails = directorio.map(d => {
    const areaIds = directorAreasMap[d.id_directorio] || [];
    const areaNames = areaIds
      .map(id => areas.find(a => a.id_area === id)?.nombre)
      .filter(Boolean)
      .join(', ');
    
    return {
      nombre: d.nombre || '',
      area: areaNames || 'Sin área asignada',
      puesto: d.puesto || 'Director/Jefe'
    };
  });

  useEffect(() => {
    const hasAnyTouched = Object.keys(touched).length > 0;
    setShowErrors(hasAnyTouched);
  }, [touched]);

  const getInputClasses = (fieldName: string) => {
    const hasError = showErrors && !isFieldValid(fieldName);
    const hasValue = formData[fieldName as keyof typeof formData];
    
    return `w-full px-0 pb-2 border-b-2 text-sm transition-all bg-transparent ${
      hasError
        ? 'border-red-500'
        : hasValue
          ? isDarkMode
            ? 'border-white/40 hover:border-white/60 focus:border-white'
            : 'border-black/40 hover:border-black/60 focus:border-black'
          : isDarkMode
            ? 'border-white/10 hover:border-white/20 focus:border-white'
            : 'border-black/10 hover:border-black/20 focus:border-black'
    } ${isDarkMode ? 'text-white placeholder:text-white/40' : 'text-black placeholder:text-black/40'} focus:outline-none`;
  };

  const getLabelClasses = () => {
    return `block mb-2 text-xs font-medium uppercase tracking-wider transition-colors ${
      isDarkMode ? 'text-white/60' : 'text-black/60'
    }`;
  };

  const handleSelectChange = (name: string, value: string) => {
    const syntheticEvent = {
      target: { name, value }
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange(syntheticEvent);
  };

  const handleDirectorChange = (value: string) => {
    const syntheticEvent = {
      target: { name: 'usufinal', value }
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange(syntheticEvent);
    if (value) {
      onDirectorSelect(value);
    }
  };

  const handleDateChange = (value: string) => {
    const syntheticEvent = {
      target: { name: 'fechabaja', value }
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);
  };

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className={`pb-6 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
        <h2 className="text-xl font-light tracking-tight mb-1">
          Ubicación y Estado del Bien
        </h2>
        <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
          Define la ubicación física y condiciones del bien
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-8">
        {/* Ubicación Section */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className={`text-sm font-medium uppercase tracking-wider mb-4 ${
            isDarkMode ? 'text-white/60' : 'text-black/60'
          }`}>
            Ubicación Actual
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={getLabelClasses()}>Estado</label>
              <input
                type="text"
                name="ubicacion_es"
                value={formData.ubicacion_es}
                onChange={onChange}
                maxLength={2}
                className={getInputClasses('ubicacion_es')}
                placeholder="Clave (2 caracteres)"
              />
            </div>

            <div>
              <label className={getLabelClasses()}>Municipio</label>
              <input
                type="text"
                name="ubicacion_mu"
                value={formData.ubicacion_mu}
                onChange={onChange}
                maxLength={2}
                className={getInputClasses('ubicacion_mu')}
                placeholder="Clave (2 caracteres)"
              />
            </div>

            <div>
              <label className={getLabelClasses()}>Nomenclatura</label>
              <input
                type="text"
                name="ubicacion_no"
                value={formData.ubicacion_no}
                onChange={onChange}
                maxLength={2}
                className={getInputClasses('ubicacion_no')}
                placeholder="Clave (2 caracteres)"
              />
            </div>
          </div>
        </motion.div>

        {/* Condiciones Section */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className={`text-sm font-medium uppercase tracking-wider mb-4 ${
            isDarkMode ? 'text-white/60' : 'text-black/60'
          }`}>
            Condiciones
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={getLabelClasses()}>
                Estado Físico
              </label>
              <EstadoFisicoSelect
                value={formData.estado}
                onChange={(value) => handleSelectChange('estado', value)}
                hasError={!isFieldValid('estado')}
                showError={showErrors}
                isDarkMode={isDarkMode}
              />
            </div>

            <div>
              <label className={getLabelClasses()}>
                Estatus <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                value={formData.estatus}
                options={filterOptions.estatus}
                onChange={(value) => handleSelectChange('estatus', value)}
                placeholder="Seleccionar estatus..."
                hasError={!isFieldValid('estatus')}
                showError={showErrors}
                isDarkMode={isDarkMode}
              />
              {showErrors && !isFieldValid('estatus') && (
                <motion.p 
                  className="text-red-500 text-xs mt-2 font-medium"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  Este campo es obligatorio
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Responsables Section */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className={`text-sm font-medium uppercase tracking-wider mb-4 ${
            isDarkMode ? 'text-white/60' : 'text-black/60'
          }`}>
            Responsables
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={getLabelClasses()}>
                Director/Jefe de Área <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                value={formData.usufinal}
                options={directorio.map(d => d.nombre || '')}
                optionsWithDetails={directoresWithDetails}
                onChange={handleDirectorChange}
                placeholder="Seleccionar director..."
                hasError={!isFieldValid('usufinal')}
                showError={showErrors}
                isDarkMode={isDarkMode}
              />
              {showErrors && !isFieldValid('usufinal') && (
                <motion.p 
                  className="text-red-500 text-xs mt-2 font-medium"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  Este campo es obligatorio
                </motion.p>
              )}
            </div>

            <div>
              <label className={getLabelClasses()}>
                Área <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  readOnly
                  onBlur={onBlur}
                  className={`${getInputClasses('area')} cursor-not-allowed opacity-60 ${
                    showAreaWarning && formData.usufinal && !formData.area ? 'pr-8' : ''
                  }`}
                  placeholder="Se asigna automáticamente"
                />
                {showAreaWarning && formData.usufinal && !formData.area && (
                  <motion.button
                    type="button"
                    onClick={onAreaWarningClick}
                    className={`absolute right-0 bottom-2 p-1 rounded transition-colors ${
                      isDarkMode
                        ? 'text-yellow-400 hover:text-yellow-300'
                        : 'text-yellow-600 hover:text-yellow-700'
                    }`}
                    title="Este director no tiene área asignada. Click para asignar."
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg 
                      className="w-5 h-5" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                      />
                    </svg>
                  </motion.button>
                )}
              </div>
              {showErrors && !isFieldValid('area') && !showAreaWarning && (
                <motion.p 
                  className="text-red-500 text-xs mt-2 font-medium"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  Este campo es obligatorio
                </motion.p>
              )}
              {showAreaWarning && formData.usufinal && !formData.area && (
                <motion.p 
                  className={`text-xs mt-2 font-medium ${
                    isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  }`}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  El director no tiene área asignada
                </motion.p>
              )}
            </div>

            <div>
              <label className={getLabelClasses()}>Usuario Final</label>
              <input
                type="text"
                name="resguardante"
                value={formData.resguardante}
                onChange={onChange}
                className={getInputClasses('resguardante')}
                placeholder="Persona que usará el bien..."
              />
            </div>
          </div>
        </motion.div>

        {/* Información de Baja (conditional) */}
        <AnimatePresence>
          {formData.estatus === 'BAJA' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`p-6 rounded-lg border ${
                isDarkMode 
                  ? 'bg-red-500/5 border-red-500/20' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <h3 className={`text-sm font-medium uppercase tracking-wider mb-4 ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  Información de Baja
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={getLabelClasses()}>Fecha de Baja</label>
                    <CustomDateInput
                      value={formData.fechabaja}
                      onChange={handleDateChange}
                      hasError={false}
                      showError={false}
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  <div>
                    <label className={getLabelClasses()}>Causa de Baja</label>
                    <CustomSelect
                      value={formData.causadebaja}
                      options={filterOptions.causasBaja}
                      onChange={(value) => handleSelectChange('causadebaja', value)}
                      placeholder="Seleccionar causa..."
                      hasError={false}
                      showError={false}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <motion.div 
        className={`pt-6 border-t text-xs ${
          isDarkMode ? 'border-white/10 text-white/40' : 'border-black/10 text-black/40'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Los campos marcados con <span className="text-red-500">*</span> son obligatorios
      </motion.div>
    </motion.div>
  );
}
