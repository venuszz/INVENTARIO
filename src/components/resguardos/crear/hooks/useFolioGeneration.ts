/**
 * Custom hook for generating unique resguardo folios
 * 
 * Uses centralized folios table for consecutive numbering
 * Format: RES-XXXX (e.g., RES-0001, RES-0002)
 */

import { useState, useCallback, useEffect } from 'react';
import { useFolioGenerator } from '@/hooks/useFolioGenerator';

export interface UseFolioGenerationReturn {
  folio: string;
  generateFolio: () => Promise<string | null>;
  resetFolio: () => void;
  loadPreview: () => Promise<void>;
}

/**
 * Hook for generating unique resguardo folios
 * 
 * @returns Object containing folio, generateFolio function, and resetFolio function
 */
export function useFolioGeneration(): UseFolioGenerationReturn {
  const [folio, setFolio] = useState('');
  const { generateFolio: generateFolioFromDB, previewNextFolio } = useFolioGenerator();

  /**
   * Load preview of next folio without incrementing
   * This is used to show the user what folio will be generated
   */
  const loadPreview = useCallback(async (): Promise<void> => {
    try {
      const preview = await previewNextFolio('RESGUARDO');
      setFolio(preview);
    } catch (err) {
      console.error('Error al cargar preview del folio:', err);
    }
  }, [previewNextFolio]);

  /**
   * Generate actual folio and increment counter
   * This should ONLY be called when actually creating a resguardo
   */
  const generateFolio = useCallback(async (): Promise<string | null> => {
    try {
      const newFolio = await generateFolioFromDB('RESGUARDO');
      setFolio(newFolio);
      return newFolio;
    } catch (err) {
      console.error('Error al generar el folio:', err);
      return null;
    }
  }, [generateFolioFromDB]);

  /**
   * Reset folio by loading a new preview
   */
  const resetFolio = useCallback(() => {
    loadPreview();
  }, [loadPreview]);

  return {
    folio,
    generateFolio,
    resetFolio,
    loadPreview,
  };
}
