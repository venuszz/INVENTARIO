/**
 * Custom hook for generating unique resguardo folios
 * 
 * Generates folios in the format: RES-YYYYMMDD-XXX
 * where XXX is a sequential number for the day
 */

import { useState, useCallback } from 'react';
import supabase from '@/app/lib/supabase/client';

export interface UseFolioGenerationReturn {
  folio: string;
  generateFolio: () => Promise<string | null>;
  resetFolio: () => void;
}

/**
 * Hook for generating unique resguardo folios
 * 
 * @returns Object containing folio, generateFolio function, and resetFolio function
 */
export function useFolioGeneration(): UseFolioGenerationReturn {
  const [folio, setFolio] = useState('');

  const generateFolio = useCallback(async (): Promise<string | null> => {
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const datePart = `${year}${month}${day}`;

      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const { data, error } = await supabase
        .from('resguardos')
        .select('folio')
        .gte('f_resguardo', startOfDay)
        .lte('f_resguardo', endOfDay);

      if (error) throw error;

      const foliosUnicos = Array.from(new Set((data || []).map(r => r.folio)));
      const sequential = String(foliosUnicos.length + 1).padStart(3, '0');
      const newFolio = `RES-${datePart}-${sequential}`;

      setFolio(newFolio);
      return newFolio;
    } catch (err) {
      console.error('Error al generar el folio:', err);
      return null;
    }
  }, []);

  const resetFolio = useCallback(() => {
    generateFolio();
  }, [generateFolio]);

  return {
    folio,
    generateFolio,
    resetFolio,
  };
}
