/**
 * useResguardoDetails - Hook for fetching and managing resguardo details
 * Handles loading details for a specific folio
 */

import { useState, useCallback, useRef } from 'react';
import supabase from '@/app/lib/supabase/client';
import { ResguardoDetalle, ResguardoArticulo } from '../types';

export interface UseResguardoDetailsReturn {
  selectedFolio: string | null;
  resguardoDetails: ResguardoDetalle | null;
  articulos: ResguardoArticulo[];
  loading: boolean;
  error: string | null;
  selectFolio: (folio: string) => Promise<void>;
  clearSelection: () => void;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing resguardo details
 */
export function useResguardoDetails(): UseResguardoDetailsReturn {
  const [selectedFolio, setSelectedFolio] = useState<string | null>(null);
  const [resguardoDetails, setResguardoDetails] = useState<ResguardoDetalle | null>(null);
  const [articulos, setArticulos] = useState<ResguardoArticulo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  /**
   * Fetch resguardo details by folio
   */
  const fetchDetails = useCallback(async (folio: string) => {
    setLoading(true);
    try {
      // Fetch all records for this folio with relational data
      const { data, error: queryError } = await supabase
        .from('resguardos')
        .select(`
          id,
          folio,
          f_resguardo,
          id_directorio,
          directorio!inner (
            nombre,
            puesto
          ),
          id_mueble,
          origen,
          puesto_resguardo,
          resguardante,
          created_by
        `)
        .eq('folio', folio);

      if (queryError) throw queryError;

      if (data && data.length > 0) {
        const firstItem = data[0];

        // Create details object
        const details: ResguardoDetalle = {
          folio: firstItem.folio,
          fecha: firstItem.f_resguardo,
          director: (firstItem.directorio as any)?.nombre || ''
        };

        // Map articles - need to fetch mueble details based on id_mueble and origen
        const articlesList: ResguardoArticulo[] = await Promise.all(
          data.map(async (item) => {
            // Determine which table to query based on origen
            const tableName = item.origen === 'ITEA' ? 'itea' : 
                            item.origen === 'NO_LISTADO' ? 'no_listado' : 
                            'inea';
            
            // Fetch mueble details
            const { data: muebleData, error: muebleError } = await supabase
              .from(tableName)
              .select('id, id_inv, descripcion, rubro, estado')
              .eq('id', item.id_mueble)
              .single();

            if (muebleError) {
              console.error(`Error fetching mueble from ${tableName}:`, muebleError);
              // Return basic info if mueble fetch fails
              return {
                id: item.id,
                num_inventario: 'N/A',
                descripcion: 'Error al cargar',
                rubro: '',
                condicion: '',
                resguardante: item.resguardante || '',
                origen: item.origen
              };
            }

            return {
              id: item.id,
              num_inventario: muebleData.id_inv || '',
              descripcion: muebleData.descripcion || '',
              rubro: muebleData.rubro || '',
              condicion: muebleData.estado || '',
              resguardante: item.resguardante || '',
              origen: item.origen
            };
          })
        );

        setResguardoDetails(details);
        setArticulos(articlesList);
        setSelectedFolio(folio);
        setError(null);

        // Auto-scroll to details panel on mobile
        if (window.innerWidth < 768 && detailRef.current) {
          setTimeout(() => {
            detailRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      } else {
        setError(`No se encontraron resguardos para el folio: ${folio}`);
        setResguardoDetails(null);
        setArticulos([]);
        setSelectedFolio(null);
      }
    } catch (err) {
      setError('Error al cargar los detalles del resguardo');
      console.error('Error fetching resguardo details:', err);
      setResguardoDetails(null);
      setArticulos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Select a folio and load its details
   */
  const selectFolio = useCallback(async (folio: string) => {
    await fetchDetails(folio);
  }, [fetchDetails]);

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    setSelectedFolio(null);
    setResguardoDetails(null);
    setArticulos([]);
    setError(null);
  }, []);

  /**
   * Refetch current folio details
   */
  const refetch = useCallback(async () => {
    if (selectedFolio) {
      await fetchDetails(selectedFolio);
    }
  }, [selectedFolio, fetchDetails]);

  return {
    selectedFolio,
    resguardoDetails,
    articulos,
    loading,
    error,
    selectFolio,
    clearSelection,
    refetch
  };
}
