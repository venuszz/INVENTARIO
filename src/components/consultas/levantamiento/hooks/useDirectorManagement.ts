/**
 * Custom hook for managing director data operations
 * 
 * This hook handles fetching, validating, and updating director information
 * from the directorio table, including fuzzy matching for director names.
 */

import { useState, useCallback } from 'react';
import supabase from '@/app/lib/supabase/client';
import { DirectorioOption } from '../types';
import { clean } from '../utils';

/**
 * Hook parameters
 */
interface UseDirectorManagementParams {
  isAdmin: boolean;
}

/**
 * Hook return interface
 */
interface UseDirectorManagementReturn {
  directorOptions: DirectorioOption[];
  fetchDirectorFromDirectorio: (area: string, usufinal?: string) => Promise<void>;
  saveDirectorData: (director: DirectorioOption) => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for director management
 * 
 * Provides functions to fetch directors from the database with fuzzy matching,
 * validate director data, and update director records.
 * 
 * @param params - Hook parameters
 * @returns Director management state and functions
 * 
 * @example
 * const {
 *   directorOptions,
 *   fetchDirectorFromDirectorio,
 *   saveDirectorData,
 *   loading,
 *   error
 * } = useDirectorManagement({ isAdmin: true });
 * 
 * // Fetch directors for an area
 * await fetchDirectorFromDirectorio('DIRECCIÓN GENERAL');
 * 
 * // Save director data
 * await saveDirectorData({
 *   id_directorio: 1,
 *   nombre: 'JUAN PÉREZ',
 *   puesto: 'DIRECTOR',
 *   area: 'DIRECCIÓN GENERAL'
 * });
 */
export function useDirectorManagement({
  isAdmin
}: UseDirectorManagementParams): UseDirectorManagementReturn {
  
  const [directorOptions, setDirectorOptions] = useState<DirectorioOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch directors from directorio table with fuzzy matching
   * 
   * Searches for directors by area and optionally by name (usufinal).
   * Uses fuzzy matching to find the best match even with accents and case differences.
   * 
   * @param area - Area name to search for
   * @param usufinal - Optional director name to search for
   */
  const fetchDirectorFromDirectorio = useCallback(async (
    area: string, 
    usufinal?: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all directors from the database
      const { data, error: fetchError } = await supabase
        .from('directorio')
        .select('*');

      if (fetchError) throw fetchError;
      if (!data) throw new Error('No se pudo obtener el directorio');

      // Store all director options
      setDirectorOptions(data);

      // If usufinal is provided, perform fuzzy matching
      if (usufinal) {
        const directorClean = clean(usufinal);
        const areaClean = clean(area);

        // Priority 1: Exact match by name and area
        let bestMatch = data.find((d: DirectorioOption) => 
          clean(d.nombre) === directorClean && clean(d.area || '') === areaClean
        );

        // Priority 2: Exact match by name only
        if (!bestMatch) {
          bestMatch = data.find((d: DirectorioOption) => 
            clean(d.nombre) === directorClean
          );
        }

        // Priority 3: Partial match by name (contains)
        if (!bestMatch) {
          bestMatch = data.find((d: DirectorioOption) => 
            clean(d.nombre).includes(directorClean)
          );
        }

        // If a match is found, move it to the front of the options
        if (bestMatch) {
          const otherOptions = data.filter(d => d.id_directorio !== bestMatch!.id_directorio);
          setDirectorOptions([bestMatch, ...otherOptions]);
        }
      } else if (area) {
        // If only area is provided, filter by area
        const areaClean = clean(area);
        const matches = data.filter((d: DirectorioOption) => 
          clean(d.area || '') === areaClean
        );

        if (matches.length > 0) {
          const otherOptions = data.filter(d => 
            !matches.some(m => m.id_directorio === d.id_directorio)
          );
          setDirectorOptions([...matches, ...otherOptions]);
        }
      }

    } catch (err) {
      console.error('Error fetching director from directorio:', err);
      setError('Error al buscar en directorio.');
      setDirectorOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save director data to the database
   * 
   * Updates the director's nombre and puesto in the directorio table.
   * Only available for admin users.
   * 
   * @param director - Director data to save
   * @throws Error if user is not admin or if required fields are missing
   */
  const saveDirectorData = useCallback(async (
    director: DirectorioOption
  ): Promise<void> => {
    if (!isAdmin) {
      throw new Error('Solo los administradores pueden actualizar datos de directores');
    }

    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      const nombre = director.nombre?.trim().toUpperCase() || '';
      const puesto = director.puesto?.trim().toUpperCase() || '';

      if (!nombre || !puesto) {
        throw new Error('El nombre y el cargo son obligatorios');
      }

      // Update director in database
      const { error: updateError } = await supabase
        .from('directorio')
        .update({ nombre, puesto })
        .eq('id_directorio', director.id_directorio);

      if (updateError) throw updateError;

      // Update local state
      setDirectorOptions(prev => 
        prev.map(opt =>
          opt.id_directorio === director.id_directorio
            ? { ...opt, nombre, puesto }
            : opt
        )
      );

    } catch (err) {
      console.error('Error saving director data:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al actualizar los datos del director';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  return {
    directorOptions,
    fetchDirectorFromDirectorio,
    saveDirectorData,
    loading,
    error,
  };
}
