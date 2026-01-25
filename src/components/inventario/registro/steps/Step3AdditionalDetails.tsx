import React, { useState, useEffect } from 'react';
import { Camera, X, Upload, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Step3Props } from '../types';

export default function Step3AdditionalDetails({
  formData,
  imagePreview,
  touched,
  onChange,
  onBlur,
  onImageChange,
  onImageRemove,
  isFieldValid,
  isDarkMode
}: Step3Props) {
  const [showErrors, setShowErrors] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const hasAnyTouched = Object.keys(touched).length > 0;
    setShowErrors(hasAnyTouched);
  }, [touched]);

  const getTextareaClasses = (fieldName: string) => {
    const hasError = showErrors && !isFieldValid(fieldName);
    const hasValue = formData[fieldName as keyof typeof formData];
    
    return `w-full px-0 pb-2 border-b-2 text-sm transition-all bg-transparent resize-none ${
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const syntheticEvent = {
        target: { files }
      } as React.ChangeEvent<HTMLInputElement>;
      onImageChange(syntheticEvent);
    }
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
          Detalles Adicionales
        </h2>
        <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
          Completa la descripción y adjunta una imagen del bien
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-8">
        {/* Descripción */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className={getLabelClasses()}>
            Descripción <span className="text-red-500">*</span>
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={onChange}
            onBlur={onBlur}
            className={`${getTextareaClasses('descripcion')} h-32`}
            placeholder="Descripción detallada del bien..."
            rows={6}
          />
          {showErrors && !isFieldValid('descripcion') && (
            <motion.p 
              className="text-red-500 text-xs mt-2 font-medium"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Este campo es obligatorio
            </motion.p>
          )}
        </motion.div>

        {/* Imagen del Bien */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className={getLabelClasses()}>Imagen del Bien</label>
          
          <AnimatePresence mode="wait">
            {imagePreview ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative rounded-lg border-2 overflow-hidden ${
                  isDarkMode ? 'border-white/10' : 'border-black/10'
                }`}
              >
                <div className="aspect-video relative">
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    className="w-full h-full object-contain"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${
                    isDarkMode 
                      ? 'from-black/80 via-transparent to-transparent' 
                      : 'from-white/80 via-transparent to-transparent'
                  }`} />
                  
                  {/* Remove button */}
                  <motion.button
                    type="button"
                    onClick={onImageRemove}
                    className={`absolute top-3 right-3 p-2 rounded-lg backdrop-blur-xl transition-all ${
                      isDarkMode
                        ? 'bg-black/50 hover:bg-black/70 text-white'
                        : 'bg-white/50 hover:bg-white/70 text-black'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={16} />
                  </motion.button>

                  {/* Filename */}
                  <div className={`absolute bottom-0 left-0 right-0 p-4 backdrop-blur-xl ${
                    isDarkMode ? 'bg-black/50' : 'bg-white/50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <ImageIcon size={16} className={isDarkMode ? 'text-white/60' : 'text-black/60'} />
                      <p className={`text-xs truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {formData.image_path}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative rounded-lg border-2 border-dashed transition-all cursor-pointer ${
                  isDragging
                    ? isDarkMode
                      ? 'border-white bg-white/5'
                      : 'border-black bg-black/5'
                    : isDarkMode
                      ? 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                      : 'border-black/10 hover:border-black/20 hover:bg-black/[0.02]'
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                
                <div className="py-12 px-6 flex flex-col items-center justify-center">
                  <motion.div
                    animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isDragging ? (
                      <Upload size={40} className={isDarkMode ? 'text-white/60' : 'text-black/60'} />
                    ) : (
                      <Camera size={40} className={isDarkMode ? 'text-white/40' : 'text-black/40'} />
                    )}
                  </motion.div>
                  
                  <p className={`mt-4 text-sm font-medium ${
                    isDarkMode ? 'text-white/60' : 'text-black/60'
                  }`}>
                    {isDragging ? 'Suelta la imagen aquí' : 'Haz click o arrastra una imagen'}
                  </p>
                  
                  <p className={`mt-2 text-xs ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`}>
                    JPG, PNG o GIF (máx. 5MB)
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
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
