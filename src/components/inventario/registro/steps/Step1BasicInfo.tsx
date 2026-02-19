import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, X, AlertCircle, Loader2, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Step1Props } from '../types';
import { useIdInventarioValidation } from '../hooks/useIdInventarioValidation';

// Custom Select Component
interface CustomSelectProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder: string;
  hasError?: boolean;
  isDarkMode: boolean;
  showError?: boolean;
}

function CustomSelect({ value, options, onChange, placeholder, hasError, isDarkMode, showError }: CustomSelectProps) {
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

  const filteredOptions = options.filter(option =>
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
              ) : (
                filteredOptions.map((option, index) => (
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

  // Sync display value with prop value on mount and when value changes externally
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        // YYYY-MM-DD format from storage
        setDisplayValue(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    
    // Remove all non-numeric characters
    input = input.replace(/\D/g, '');
    
    // Limit to 8 digits
    input = input.substring(0, 8);
    
    // Format as DD-MM-YYYY while typing
    let formatted = '';
    if (input.length > 0) {
      // Day (max 31)
      let day = input.substring(0, 2);
      if (parseInt(day) > 31) day = '31';
      formatted = day;
      
      if (input.length >= 3) {
        // Month (max 12)
        let month = input.substring(2, 4);
        if (parseInt(month) > 12) month = '12';
        formatted += '-' + month;
      }
      
      if (input.length >= 5) {
        // Year
        formatted += '-' + input.substring(4, 8);
      }
    }
    
    setDisplayValue(formatted);
    
    // Convert to YYYY-MM-DD for storage when complete
    if (input.length === 8) {
      const day = input.substring(0, 2);
      const month = input.substring(2, 4);
      const year = input.substring(4, 8);
      
      // Validate date
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
      
      {/* Hidden native date picker */}
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

export default function Step1BasicInfo({
  formData,
  filterOptions,
  touched,
  onChange,
  onBlur,
  onCurrencyChange,
  isFieldValid,
  isDarkMode,
  isTlaxcala = false
}: Step1Props) {
  const router = useRouter();
  const [showErrors, setShowErrors] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);
  
  // Validate ID Inventario
  const idValidation = useIdInventarioValidation(formData.id_inv);

  // Show errors only if user has tried to proceed (touched will be set by parent)
  useEffect(() => {
    const hasAnyTouched = Object.keys(touched).length > 0;
    setShowErrors(hasAnyTouched);
  }, [touched]);

  // Expose validation result to parent via a custom event
  useEffect(() => {
    const event = new CustomEvent('idValidationChange', { 
      detail: { 
        exists: idValidation.exists, 
        institution: idValidation.institution 
      } 
    });
    window.dispatchEvent(event);
  }, [idValidation.exists, idValidation.institution]);

  // Format currency for display
  const formatCurrency = (value: string | number) => {
    if (!value) return 'N/A';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(numValue)) return 'N/A';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(numValue);
  };

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

  const handleDateChange = (value: string) => {
    const syntheticEvent = {
      target: { name: 'f_adq', value }
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
          Información Básica del Bien
        </h2>
        <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
          Completa los datos principales del bien a registrar
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* ID Inventario */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className={getLabelClasses()}>
            ID Inventario {!isTlaxcala && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <input
              type="text"
              name="id_inv"
              value={formData.id_inv}
              onChange={onChange}
              onBlur={onBlur}
              className={getInputClasses('id_inv')}
              placeholder="Ej. INV-2023-001"
            />
            
            {/* Validation Badge with Popover */}
            <AnimatePresence mode="wait">
              {idValidation.loading && formData.id_inv && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 top-0 -translate-y-1/2"
                >
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-semibold tracking-widest ${
                    isDarkMode 
                      ? 'bg-blue-500/5 text-blue-400/60 border border-blue-500/20' 
                      : 'bg-blue-50/50 text-blue-500/70 border border-blue-200/50'
                  }`}>
                    <Loader2 size={9} className="animate-spin" />
                  </div>
                </motion.div>
              )}
              
              {!idValidation.loading && idValidation.exists && formData.id_inv && (
                <motion.div
                  ref={badgeRef}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 top-0 -translate-y-1/2 z-50"
                  onMouseEnter={() => setShowPopover(true)}
                  onMouseLeave={() => setShowPopover(false)}
                >
                  <motion.div 
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-semibold tracking-widest cursor-pointer transition-all duration-200 ${
                      idValidation.institution === 'INEA'
                        ? isDarkMode
                          ? 'bg-amber-500/5 text-amber-400/70 border border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/30'
                          : 'bg-amber-50/50 text-amber-600/80 border border-amber-200/50 hover:bg-amber-50 hover:border-amber-300/60'
                        : idValidation.institution === 'ITEA'
                          ? isDarkMode
                            ? 'bg-purple-500/5 text-purple-400/70 border border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/30'
                            : 'bg-purple-50/50 text-purple-600/80 border border-purple-200/50 hover:bg-purple-50 hover:border-purple-300/60'
                          : isDarkMode
                            ? 'bg-emerald-500/5 text-emerald-400/70 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/30'
                            : 'bg-emerald-50/50 text-emerald-600/80 border border-emerald-200/50 hover:bg-emerald-50 hover:border-emerald-300/60'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.15 }}
                  >
                    <AlertCircle size={10} strokeWidth={2.5} />
                    <span>ID EXISTE · {idValidation.institution}</span>
                  </motion.div>

                  {/* Popover with Item Details */}
                  <AnimatePresence>
                    {showPopover && idValidation.itemData && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 top-full mt-3 w-96 pointer-events-auto"
                        style={{ zIndex: 9999 }}
                      >
                        <div className={`rounded-lg overflow-hidden shadow-2xl border ${
                          isDarkMode
                            ? 'bg-black border-white/10'
                            : 'bg-white border-black/10'
                        }`}>
                          {/* Header with institution badge */}
                          <div className={`px-5 py-3 border-b ${
                            isDarkMode ? 'border-white/5' : 'border-black/5'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className={`text-xs font-medium ${
                                isDarkMode ? 'text-white/60' : 'text-black/60'
                              }`}>
                                Bien Existente
                              </div>
                              <div className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${
                                idValidation.institution === 'INEA'
                                  ? isDarkMode
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-amber-50 text-amber-600 border border-amber-200'
                                  : idValidation.institution === 'ITEA'
                                    ? isDarkMode
                                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                      : 'bg-purple-50 text-purple-600 border border-purple-200'
                                    : isDarkMode
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              }`}>
                                {idValidation.institution}
                              </div>
                            </div>
                          </div>

                          {/* Content - Full text display */}
                          <div className="p-5 space-y-3.5">
                            {/* ID */}
                            <div>
                              <div className={`text-[10px] uppercase tracking-wider font-medium mb-1 ${
                                isDarkMode ? 'text-white/40' : 'text-black/40'
                              }`}>
                                ID Inventario
                              </div>
                              <div className={`text-sm font-semibold ${
                                isDarkMode ? 'text-white' : 'text-black'
                              }`}>
                                {idValidation.itemData.id_inv}
                              </div>
                            </div>

                            {/* Description - Full text */}
                            {idValidation.itemData.descripcion && (
                              <div>
                                <div className={`text-[10px] uppercase tracking-wider font-medium mb-1 ${
                                  isDarkMode ? 'text-white/40' : 'text-black/40'
                                }`}>
                                  Descripción
                                </div>
                                <div className={`text-xs leading-relaxed ${
                                  isDarkMode ? 'text-white/70' : 'text-black/70'
                                }`}>
                                  {idValidation.itemData.descripcion}
                                </div>
                              </div>
                            )}

                            {/* Area - Full text */}
                            {idValidation.itemData.area?.nombre && (
                              <div>
                                <div className={`text-[10px] uppercase tracking-wider font-medium mb-1 ${
                                  isDarkMode ? 'text-white/40' : 'text-black/40'
                                }`}>
                                  Área
                                </div>
                                <div className={`text-xs ${
                                  isDarkMode ? 'text-white/80' : 'text-black/80'
                                }`}>
                                  {idValidation.itemData.area.nombre}
                                </div>
                              </div>
                            )}

                            {/* Responsible - Full text */}
                            {idValidation.itemData.directorio?.nombre && (
                              <div>
                                <div className={`text-[10px] uppercase tracking-wider font-medium mb-1 ${
                                  isDarkMode ? 'text-white/40' : 'text-black/40'
                                }`}>
                                  Responsable
                                </div>
                                <div className={`text-xs ${
                                  isDarkMode ? 'text-white/80' : 'text-black/80'
                                }`}>
                                  {idValidation.itemData.directorio.nombre}
                                </div>
                              </div>
                            )}

                            {/* Value & Status in row */}
                            <div className="flex items-center gap-4">
                              {idValidation.itemData.valor && (
                                <div className="flex-1">
                                  <div className={`text-[10px] uppercase tracking-wider font-medium mb-1 ${
                                    isDarkMode ? 'text-white/40' : 'text-black/40'
                                  }`}>
                                    Valor
                                  </div>
                                  <div className={`text-xs font-semibold ${
                                    isDarkMode ? 'text-white' : 'text-black'
                                  }`}>
                                    {formatCurrency(idValidation.itemData.valor)}
                                  </div>
                                </div>
                              )}

                              {idValidation.itemData.estatus && (
                                <div className="flex-1">
                                  <div className={`text-[10px] uppercase tracking-wider font-medium mb-1 ${
                                    isDarkMode ? 'text-white/40' : 'text-black/40'
                                  }`}>
                                    Estatus
                                  </div>
                                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${
                                    idValidation.itemData.estatus === 'ACTIVO'
                                      ? isDarkMode
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                        : 'bg-green-50 text-green-600 border border-green-200'
                                      : isDarkMode
                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        : 'bg-red-50 text-red-600 border border-red-200'
                                  }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                      idValidation.itemData.estatus === 'ACTIVO'
                                        ? isDarkMode ? 'bg-green-400' : 'bg-green-500'
                                        : isDarkMode ? 'bg-red-400' : 'bg-red-500'
                                    }`} />
                                    {idValidation.itemData.estatus}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className={`px-5 pb-4`}>
                            <motion.button
                              type="button"
                              onClick={(e) => {
                                // Prevenir cualquier comportamiento por defecto del formulario
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // Determinar la ruta según la institución usando el mismo formato que SearchBar
                                const routes = {
                                  'INEA': '/consultas/inea/general',
                                  'ITEA': '/consultas/itea/general',
                                  'TLAXCALA': '/consultas/no-listado'
                                };
                                const route = routes[idValidation.institution as keyof typeof routes];
                                
                                // Usar router.push para navegación del lado del cliente (mantiene el estado)
                                router.push(`${route}?id=${idValidation.itemData.id}`);
                              }}
                              className={`w-full py-2.5 px-4 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                                isDarkMode
                                  ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-white/20'
                                  : 'bg-black/5 text-black hover:bg-black/10 border border-black/10 hover:border-black/20'
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Package size={14} />
                              Ver Detalles del Bien
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {showErrors && !isFieldValid('id_inv') && (
            <motion.p 
              className="text-red-500 text-xs mt-2 font-medium"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Este campo es obligatorio
            </motion.p>
          )}
        </motion.div>

        {/* Rubro y Valor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <label className={getLabelClasses()}>
              Rubro {!isTlaxcala && <span className="text-red-500">*</span>}
            </label>
            <CustomSelect
              value={formData.rubro}
              options={filterOptions.rubros}
              onChange={(value) => handleSelectChange('rubro', value)}
              placeholder="Seleccionar rubro..."
              hasError={!isFieldValid('rubro')}
              showError={showErrors}
              isDarkMode={isDarkMode}
            />
            {showErrors && !isFieldValid('rubro') && (
              <motion.p 
                className="text-red-500 text-xs mt-2 font-medium"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Este campo es obligatorio
              </motion.p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className={getLabelClasses()}>
              Valor {!isTlaxcala && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                type="text"
                name="valor"
                value={formData.valor}
                onChange={onCurrencyChange}
                onBlur={onBlur}
                className={getInputClasses('valor')}
                placeholder="0.00"
              />
              {formData.valor && formData.valor.includes(',') && (
                <motion.div 
                  className={`mt-1 text-xs ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Valor formateado
                </motion.div>
              )}
            </div>
            {showErrors && !isFieldValid('valor') && (
              <motion.p 
                className="text-red-500 text-xs mt-2 font-medium"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Este campo es obligatorio
              </motion.p>
            )}
          </motion.div>
        </div>

        {/* Forma de Adquisición y Fecha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <label className={getLabelClasses()}>
              Forma de Adquisición {!isTlaxcala && <span className="text-red-500">*</span>}
            </label>
            <CustomSelect
              value={formData.formadq}
              options={filterOptions.formasAdquisicion}
              onChange={(value) => handleSelectChange('formadq', value)}
              placeholder="Seleccionar..."
              hasError={!isFieldValid('formadq')}
              showError={showErrors}
              isDarkMode={isDarkMode}
            />
            {showErrors && !isFieldValid('formadq') && (
              <motion.p 
                className="text-red-500 text-xs mt-2 font-medium"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Este campo es obligatorio
              </motion.p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className={getLabelClasses()}>
              Fecha de Adquisición {!isTlaxcala && <span className="text-red-500">*</span>}
            </label>
            <CustomDateInput
              value={formData.f_adq}
              onChange={handleDateChange}
              hasError={!isFieldValid('f_adq')}
              showError={showErrors}
              isDarkMode={isDarkMode}
            />
            {showErrors && !isFieldValid('f_adq') && (
              <motion.p 
                className="text-red-500 text-xs mt-2 font-medium"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Este campo es obligatorio
              </motion.p>
            )}
          </motion.div>
        </div>

        {/* Proveedor y Factura */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
          >
            <label className={getLabelClasses()}>
              Proveedor
            </label>
            <input
              type="text"
              name="proveedor"
              value={formData.proveedor}
              onChange={onChange}
              className={getInputClasses('proveedor')}
              placeholder="Nombre del proveedor..."
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className={getLabelClasses()}>
              Factura
            </label>
            <input
              type="text"
              name="factura"
              value={formData.factura}
              onChange={onChange}
              className={getInputClasses('factura')}
              placeholder="No. de factura..."
            />
          </motion.div>
        </div>
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
        {!isTlaxcala && (
          <>Los campos marcados con <span className="text-red-500">*</span> son obligatorios</>
        )}
        {isTlaxcala && (
          <>Todos los campos son opcionales para bienes de Tlaxcala</>
        )}
      </motion.div>
    </motion.div>
  );
}
