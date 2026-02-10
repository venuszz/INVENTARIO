'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle, Plus } from 'lucide-react';
import type { Directorio, Area } from '@/types/admin';
import { AreaChip } from '../components/AreaChip';
import { useAreaManagement } from '../hooks/useAreaManagement';
import { useAdminIndexation } from '@/hooks/indexation/useAdminIndexation';

interface AddEditModalProps {
  show: boolean;
  mode: 'add' | 'edit';
  employee?: Directorio & { areas?: Area[] };
  onSave: (data: { nombre: string; puesto: string; selectedAreas: number[] }) => Promise<void>;
  onCancel: () => void;
}

type SaveState = 'idle' | 'saving' | 'success';

/**
 * Modal for adding or editing employees with form validation
 */
export function AddEditModal({ show, mode, employee, onSave, onCancel }: AddEditModalProps) {
  const [nombre, setNombre] = useState('');
  const [puesto, setPuesto] = useState('');
  const [selectedAreas, setSelectedAreas] = useState<Area[]>([]);
  const [areaInput, setAreaInput] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const { createAreaIfNeeded } = useAreaManagement();
  const { areas } = useAdminIndexation();

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      if (mode === 'edit' && employee) {
        setNombre(employee.nombre || '');
        setPuesto(employee.puesto || '');
        setSelectedAreas(employee.areas || []);
      } else {
        setNombre('');
        setPuesto('');
        setSelectedAreas([]);
      }
      setAreaInput('');
      setSaveState('idle');
      setError(null);
    }
  }, [show, mode, employee]);

  // Validation
  const isValid = nombre.trim().length > 0 && selectedAreas.length > 0;

  const handleAddArea = useCallback(async () => {
    const trimmedInput = areaInput.trim();
    if (!trimmedInput) return;

    try {
      // Check if already selected
      const alreadySelected = selectedAreas.some(
        a => a.nombre.toUpperCase() === trimmedInput.toUpperCase()
      );
      
      if (alreadySelected) {
        setAreaInput('');
        return;
      }

      // Find existing area or create new one
      const existingArea = areas.find(
        a => a.nombre.toUpperCase() === trimmedInput.toUpperCase()
      );

      if (existingArea) {
        setSelectedAreas(prev => [...prev, existingArea]);
      } else {
        // Create new area
        const newAreaId = await createAreaIfNeeded(trimmedInput);
        const newArea: Area = {
          id_area: newAreaId,
          nombre: trimmedInput.toUpperCase(),
        };
        setSelectedAreas(prev => [...prev, newArea]);
      }

      setAreaInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar área');
    }
  }, [areaInput, selectedAreas, areas, createAreaIfNeeded]);

  const handleRemoveArea = useCallback((areaId: number) => {
    setSelectedAreas(prev => prev.filter(a => a.id_area !== areaId));
  }, []);

  const handleSave = async () => {
    if (!isValid) return;

    setSaveState('saving');
    setError(null);

    try {
      await onSave({
        nombre: nombre.trim(),
        puesto: puesto.trim(),
        selectedAreas: selectedAreas.map(a => a.id_area),
      });

      setSaveState('success');
      
      // Auto-close after 1.5 seconds
      setTimeout(() => {
        onCancel();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setSaveState('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.name === 'area') {
      e.preventDefault();
      handleAddArea();
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={saveState === 'idle' ? onCancel : undefined}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="
              relative w-full max-w-lg p-6
              bg-white dark:bg-black
              border border-black/10 dark:border-white/10
              rounded-xl shadow-xl
            "
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-edit-modal-title"
          >
            {/* Close button (only in idle state) */}
            {saveState === 'idle' && (
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
            )}

            {/* Idle/Saving State - Form */}
            {(saveState === 'idle' || saveState === 'saving') && (
              <div>
                {/* Title */}
                <h3 
                  id="add-edit-modal-title"
                  className="text-lg font-medium text-black dark:text-white mb-6"
                >
                  {mode === 'add' ? 'Agregar Empleado' : 'Editar Empleado'}
                </h3>

                {/* Form */}
                <div className="space-y-4">
                  {/* Nombre field */}
                  <div>
                    <label 
                      htmlFor="nombre"
                      className="block text-sm font-medium text-black dark:text-white mb-1.5"
                    >
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="nombre"
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value.toUpperCase())}
                      disabled={saveState === 'saving'}
                      className="
                        w-full px-3 py-2 rounded-lg
                        bg-white dark:bg-black
                        border border-black/10 dark:border-white/10
                        text-black dark:text-white
                        placeholder:text-black/40 dark:placeholder:text-white/40
                        focus:outline-none focus:ring-2 focus:ring-blue-500/50
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors
                      "
                      placeholder="NOMBRE DEL EMPLEADO"
                      required
                    />
                  </div>

                  {/* Puesto field */}
                  <div>
                    <label 
                      htmlFor="puesto"
                      className="block text-sm font-medium text-black dark:text-white mb-1.5"
                    >
                      Puesto
                    </label>
                    <input
                      id="puesto"
                      type="text"
                      value={puesto}
                      onChange={(e) => setPuesto(e.target.value.toUpperCase())}
                      disabled={saveState === 'saving'}
                      className="
                        w-full px-3 py-2 rounded-lg
                        bg-white dark:bg-black
                        border border-black/10 dark:border-white/10
                        text-black dark:text-white
                        placeholder:text-black/40 dark:placeholder:text-white/40
                        focus:outline-none focus:ring-2 focus:ring-blue-500/50
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors
                      "
                      placeholder="PUESTO (OPCIONAL)"
                    />
                  </div>

                  {/* Areas field */}
                  <div>
                    <label 
                      htmlFor="area"
                      className="block text-sm font-medium text-black dark:text-white mb-1.5"
                    >
                      Áreas <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Selected areas */}
                    {selectedAreas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {selectedAreas.map((area) => (
                          <AreaChip
                            key={area.id_area}
                            area={area}
                            editable
                            onRemove={() => handleRemoveArea(area.id_area)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Area input */}
                    <div className="flex gap-2">
                      <input
                        id="area"
                        name="area"
                        type="text"
                        value={areaInput}
                        onChange={(e) => setAreaInput(e.target.value.toUpperCase())}
                        onKeyDown={handleKeyDown}
                        disabled={saveState === 'saving'}
                        className="
                          flex-1 px-3 py-2 rounded-lg
                          bg-white dark:bg-black
                          border border-black/10 dark:border-white/10
                          text-black dark:text-white
                          placeholder:text-black/40 dark:placeholder:text-white/40
                          focus:outline-none focus:ring-2 focus:ring-blue-500/50
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-colors
                        "
                        placeholder="AGREGAR ÁREA (ENTER)"
                      />
                      <button
                        type="button"
                        onClick={handleAddArea}
                        disabled={!areaInput.trim() || saveState === 'saving'}
                        className="
                          px-3 py-2 rounded-lg
                          bg-blue-600 hover:bg-blue-700
                          text-white
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-colors
                        "
                        aria-label="Agregar área"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    
                    {selectedAreas.length === 0 && (
                      <p className="text-xs text-black/60 dark:text-white/60 mt-1">
                        Debe agregar al menos un área
                      </p>
                    )}
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={onCancel}
                    disabled={saveState === 'saving'}
                    className="
                      flex-1 px-4 py-2.5 rounded-lg
                      bg-black/5 dark:bg-white/5
                      hover:bg-black/10 dark:hover:bg-white/10
                      text-black dark:text-white
                      font-medium transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!isValid || saveState === 'saving'}
                    className="
                      flex-1 px-4 py-2.5 rounded-lg
                      bg-blue-600 hover:bg-blue-700
                      text-white font-medium
                      transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center justify-center gap-2
                    "
                  >
                    {saveState === 'saving' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      mode === 'add' ? 'Agregar' : 'Guardar'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Success State */}
            {saveState === 'success' && (
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                >
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600 dark:text-green-400" />
                </motion.div>
                <p className="text-black dark:text-white font-medium">
                  {mode === 'add' ? '¡Empleado agregado!' : '¡Cambios guardados!'}
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
