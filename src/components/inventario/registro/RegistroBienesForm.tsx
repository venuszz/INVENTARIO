"use client"
import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from "@/app/lib/supabase/client";
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/context/ThemeContext';

// Import custom hooks
import { useFormData } from './hooks/useFormData';
import { useFilterOptions } from './hooks/useFilterOptions';
import { useDirectorManagement } from './hooks/useDirectorManagement';

// Import components
import FormStepIndicator from './FormStepIndicator';
import FormNavigation from './FormNavigation';
import Step1BasicInfo from './steps/Step1BasicInfo';
import Step2LocationStatus from './steps/Step2LocationStatus';
import Step3AdditionalDetails from './steps/Step3AdditionalDetails';
import DirectorInfoModal from './modals/DirectorInfoModal';
import AreaSelectionModal from './modals/AreaSelectionModal';

// Import types
import { Institucion, Message } from './types';

export default function RegistroBienesForm() {
  // Theme and notifications
  const { isDarkMode } = useTheme();
  const { createNotification } = useNotifications();

  // State management
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [institucion, setInstitucion] = useState<Institucion>('INEA');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<Message>({ type: '', text: '' });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showAreaWarning, setShowAreaWarning] = useState<boolean>(false);
  const imageFileRef = useRef<File | null>(null);
  const previousDirectorRef = useRef<{ usufinal: string; area: string }>({ usufinal: '', area: '' });

  // Custom hooks
  const { filterOptions } = useFilterOptions();
  
  const {
    formData,
    touched,
    handleChange,
    handleBlur,
    handleCurrencyChange,
    setFormData,
    setTouched,
    resetForm,
    isFieldValid,
    isStepComplete
  } = useFormData(
    filterOptions.estados.includes('BUENO') ? 'BUENO' : filterOptions.estados[0] || '',
    filterOptions.estatus.includes('ACTIVO') ? 'ACTIVO' : filterOptions.estatus[0] || ''
  );

  const {
    showDirectorModal,
    showAreaSelectModal,
    incompleteDirector,
    directorFormData,
    areaOptionsForDirector,
    savingDirector,
    handleSelectDirector,
    saveDirectorInfo,
    handleCancelDirectorModal,
    handleCancelAreaModal,
    setShowDirectorModal,
    setShowAreaSelectModal,
    setDirectorFormData
  } = useDirectorManagement({
    onAreaAssigned: (directorName: string, areaName: string) => {
      setFormData(prev => ({
        ...prev,
        usufinal: directorName,
        area: areaName
      }));
      setShowAreaWarning(false);
    },
    onCancel: (directorName: string, areaName: string) => {
      // Keep director name but clear area and show warning
      setFormData(prev => ({
        ...prev,
        usufinal: directorName,
        area: areaName
      }));
      setShowAreaWarning(true);
    }
  });

  // Update default estado/estatus when filterOptions change
  useEffect(() => {
    if (filterOptions.estados.length > 0 && !formData.estado) {
      setFormData(prev => ({
        ...prev,
        estado: filterOptions.estados.includes('BUENO') ? 'BUENO' : filterOptions.estados[0]
      }));
    }
    if (filterOptions.estatus.length > 0 && !formData.estatus) {
      setFormData(prev => ({
        ...prev,
        estatus: filterOptions.estatus.includes('ACTIVO') ? 'ACTIVO' : filterOptions.estatus[0]
      }));
    }
  }, [filterOptions, formData.estado, formData.estatus, setFormData]);

  // Image handling
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      imageFileRef.current = file;
      setFormData(prev => ({ ...prev, image_path: file.name }));

      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setImagePreview(null);
    imageFileRef.current = null;
    setFormData(prev => ({ ...prev, image_path: '' }));
  };

  // Upload image to Supabase storage
  const uploadImage = async (muebleId: number): Promise<string | null> => {
    if (!imageFileRef.current) return null;

    try {
      const bucketName = institucion === 'INEA' ? 'muebles.inea' : 'muebles.itea';
      const fileExt = imageFileRef.current.name.split('.').pop();
      const fileName = `${muebleId}/image.${fileExt}`;

      const { error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, imageFileRef.current, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;
      return fileName;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const tableName = institucion === 'INEA' ? 'muebles' : 'mueblesitea';

      // Prepare data for saving (convert to uppercase and clean valor)
      const dataToSave = {
        ...formData,
        id_inv: formData.id_inv.toUpperCase(),
        rubro: formData.rubro.toUpperCase(),
        descripcion: formData.descripcion.toUpperCase(),
        valor: formData.valor.replace(/[^\d.]/g, ''),
        formadq: formData.formadq.toUpperCase(),
        proveedor: formData.proveedor.toUpperCase(),
        factura: formData.factura.toUpperCase(),
        ubicacion_es: formData.ubicacion_es.toUpperCase(),
        ubicacion_mu: formData.ubicacion_mu.toUpperCase(),
        ubicacion_no: formData.ubicacion_no.toUpperCase(),
        estado: formData.estado.toUpperCase(),
        estatus: formData.estatus.toUpperCase(),
        area: formData.area.toUpperCase(),
        usufinal: formData.usufinal.toUpperCase(),
        causadebaja: formData.causadebaja.toUpperCase(),
        resguardante: formData.resguardante.toUpperCase(),
        f_adq: formData.f_adq || null,
        fechabaja: formData.fechabaja || null
      };

      // Insert main data
      const { data, error } = await supabase
        .from(tableName)
        .insert([dataToSave])
        .select();

      if (error) throw error;

      // Upload image if exists
      if (imageFileRef.current && data?.[0]?.id) {
        const imagePath = await uploadImage(data[0].id);
        if (imagePath) {
          await supabase
            .from(tableName)
            .update({ image_path: imagePath })
            .eq('id', data[0].id);
        }
      }

      setMessage({
        type: 'success',
        text: `Bien registrado correctamente en ${institucion}`
      });

      // Success notification
      await createNotification({
        title: `Nuevo bien registrado (${institucion})`,
        description: `Se registró el bien "${formData.descripcion}" con ID ${formData.id_inv} en el área "${formData.area}".`,
        type: 'success',
        category: 'inventario',
        device: 'web',
        importance: 'medium',
        data: { changes: [`Registro de bien: ${formData.id_inv}`], affectedTables: [tableName] }
      });

      // Reset form
      resetForm(
        filterOptions.estados.includes('BUENO') ? 'BUENO' : filterOptions.estados[0] || '',
        filterOptions.estatus.includes('ACTIVO') ? 'ACTIVO' : filterOptions.estatus[0] || ''
      );
      setImagePreview(null);
      imageFileRef.current = null;
      setCurrentStep(1);
    } catch (error) {
      console.error('Error saving:', error);
      setMessage({
        type: 'error',
        text: "Error al guardar el registro. Intente nuevamente."
      });

      // Error notification
      await createNotification({
        title: 'Error al registrar bien',
        description: 'Ocurrió un error al guardar el registro de un bien.',
        type: 'danger',
        category: 'inventario',
        device: 'web',
        importance: 'high',
        data: { affectedTables: [institucion === 'INEA' ? 'muebles' : 'mueblesitea'] }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation handlers
  const nextStep = () => {
    // Mark all required fields for current step as touched
    const requiredFields = {
      1: ['id_inv', 'rubro', 'valor', 'formadq', 'f_adq'],
      2: ['estatus', 'area', 'usufinal'],
      3: ['descripcion']
    };
    
    const fieldsToTouch = requiredFields[currentStep as keyof typeof requiredFields];
    const newTouched = { ...touched };
    fieldsToTouch.forEach(field => {
      newTouched[field] = true;
    });
    setTouched(newTouched);
    
    // Only proceed if step is complete
    if (isStepComplete(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };
  
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const handleCloseMessage = () => setMessage({ type: '', text: '' });
  const handleStepClick = (step: number) => setCurrentStep(step);

  // Wrapper for director selection that saves previous state
  const handleDirectorSelectWithBackup = (nombre: string) => {
    // Save current values before selecting new director
    previousDirectorRef.current = {
      usufinal: formData.usufinal,
      area: formData.area
    };
    handleSelectDirector(nombre);
  };

  return (
    <div className={`h-[calc(100vh-4rem)] overflow-hidden transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      <motion.div 
        className={`h-full overflow-y-auto p-4 md:p-8 ${
          isDarkMode 
            ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30'
            : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20 hover:scrollbar-thumb-black/30'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="w-full max-w-5xl mx-auto pb-8">
          {/* Header */}
          <div className={`mb-8 pb-6 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
            <h1 className="text-3xl font-light tracking-tight mb-6">
              Registro de Bienes
            </h1>
            
            {/* Step Indicator - Tabs style */}
            <FormStepIndicator
              currentStep={currentStep}
              isStepComplete={isStepComplete}
              onStepClick={handleStepClick}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Message notification */}
          <AnimatePresence>
            {message.text && (
              <motion.div 
                className={`mb-6 p-4 rounded-lg flex items-center justify-between border ${
                  message.type === 'success'
                    ? isDarkMode 
                      ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                      : 'bg-green-50 border-green-200 text-green-800'
                    : isDarkMode
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-red-50 border-red-200 text-red-800'
                }`}
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  {message.type === 'success' ? (
                    <CheckCircle size={18} />
                  ) : (
                    <AlertTriangle size={18} />
                  )}
                  <span className="text-sm font-medium">{message.text}</span>
                </div>
                <motion.button
                  onClick={handleCloseMessage}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/10'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={14} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Step 1 */}
                {currentStep === 1 && (
                  <Step1BasicInfo
                    formData={formData}
                    filterOptions={filterOptions}
                    touched={touched}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onCurrencyChange={handleCurrencyChange}
                    isFieldValid={isFieldValid}
                    isDarkMode={isDarkMode}
                  />
                )}

                {/* Step 2 */}
                {currentStep === 2 && (
                  <Step2LocationStatus
                    formData={formData}
                    filterOptions={filterOptions}
                    touched={touched}
                    showAreaWarning={showAreaWarning}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onDirectorSelect={handleDirectorSelectWithBackup}
                    onAreaWarningClick={() => {
                      // Find the director and open the modal
                      const director = filterOptions.usuarios.find(u => u.nombre === formData.usufinal);
                      if (director) {
                        handleDirectorSelectWithBackup(director.nombre);
                      }
                    }}
                    isFieldValid={isFieldValid}
                    isDarkMode={isDarkMode}
                  />
                )}

                {/* Step 3 */}
                {currentStep === 3 && (
                  <Step3AdditionalDetails
                    formData={formData}
                    institucion={institucion}
                    imagePreview={imagePreview}
                    touched={touched}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onImageChange={handleImageChange}
                    onImageRemove={handleImageRemove}
                    onInstitucionChange={setInstitucion}
                    isFieldValid={isFieldValid}
                    isDarkMode={isDarkMode}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <FormNavigation
              currentStep={currentStep}
              isStepComplete={isStepComplete}
              isSubmitting={isSubmitting}
              onPrevious={prevStep}
              onNext={nextStep}
              onSubmit={handleSubmit}
              isDarkMode={isDarkMode}
            />
          </form>
        </div>
      </motion.div>

      {/* Director Info Modal */}
      <DirectorInfoModal
        isOpen={showDirectorModal}
        director={incompleteDirector}
        areaValue={directorFormData.area}
        isSaving={savingDirector}
        onAreaChange={(value) => setDirectorFormData({ area: value })}
        onSave={saveDirectorInfo}
        onCancel={handleCancelDirectorModal}
        isDarkMode={isDarkMode}
      />

      {/* Area Selection Modal */}
      <AreaSelectionModal
        isOpen={showAreaSelectModal}
        director={incompleteDirector}
        areas={areaOptionsForDirector}
        onSelect={(areaName) => {
          setFormData(prev => ({
            ...prev,
            area: areaName
          }));
          setShowAreaSelectModal(false);
        }}
        onCancel={handleCancelAreaModal}
        isDarkMode={isDarkMode}
      />

      {/* CSS Styles */}
      <style jsx>{`
        select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 1rem;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
        }

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
  );
}
