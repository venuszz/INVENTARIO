/**
 * useResguardoDetails - Hook for fetching and managing resguardo details
 * Handles loading details for a specific folio
 */

import { useState, useCallback, useRef } from 'react';
import supabase from '@/app/lib/supabase/client';
import { useResguardosStore } from '@/stores/resguardosStore';
import { useIneaIndexation } from '@/hooks/indexation/useIneaIndexation';
import { useIteaIndexation } from '@/hooks/indexation/useIteaIndexation';
import { useNoListadoIndexation } from '@/hooks/indexation/useNoListadoIndexation';
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
  // Get data from stores
  const resguardosFromStore = useResguardosStore(state => state.resguardos);
  const { muebles: ineaMuebles } = useIneaIndexation();
  const { muebles: iteaMuebles } = useIteaIndexation();
  const { muebles: noListadoMuebles } = useNoListadoIndexation();
  
  const [selectedFolio, setSelectedFolio] = useState<string | null>(null);
  const [resguardoDetails, setResguardoDetails] = useState<ResguardoDetalle | null>(null);
  const [articulos, setArticulos] = useState<ResguardoArticulo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

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
   * Fetch resguardo details by folio from store
   */
  const fetchDetails = useCallback(async (folio: string) => {
    setLoading(true);
    try {
      console.log('📦 [RESGUARDO DETAILS] Fetching folio:', folio);
      console.log('📦 [RESGUARDO DETAILS] Store has', resguardosFromStore.length, 'resguardos');
      
      // Filter resguardos from store by folio
      const resguardosForFolio = resguardosFromStore.filter(r => r.folio === folio);
      
      console.log('📦 [RESGUARDO DETAILS] Found', resguardosForFolio.length, 'records for folio');

      if (resguardosForFolio.length > 0) {
        const firstItem = resguardosForFolio[0];

        // Create details object
        const details: ResguardoDetalle = {
          folio: firstItem.folio,
          fecha: firstItem.f_resguardo,
          director: firstItem.director_nombre || ''
        };

        // Map articles - get mueble details from inventory stores
        const articlesList: ResguardoArticulo[] = resguardosForFolio.map((item) => {
          // Find mueble in appropriate store based on origen
          let mueble: any = null;
          
          if (item.origen === 'ITEA') {
            mueble = iteaMuebles.find(m => m.id === item.id_mueble);
          } else if (item.origen === 'NO_LISTADO' || item.origen === 'TLAXCALA') {
            mueble = noListadoMuebles.find(m => m.id === item.id_mueble);
          } else {
            mueble = ineaMuebles.find(m => m.id === item.id_mueble);
          }

          if (!mueble) {
            console.warn(`⚠️ [RESGUARDO DETAILS] Mueble not found in store:`, item.id_mueble, item.origen);
            return {
              id: parseInt(item.id),
              num_inventario: 'N/A',
              descripcion: 'Artículo no encontrado',
              rubro: '',
              condicion: '',
              resguardante: item.resguardante || '',
              origen: item.origen
            };
          }

          return {
            id: parseInt(item.id),
            num_inventario: mueble.id_inv || '',
            descripcion: mueble.descripcion || '',
            rubro: mueble.rubro || '',
            condicion: mueble.estado || '',
            resguardante: item.resguardante || '',
            origen: item.origen
          };
        });

        console.log('✅ [RESGUARDO DETAILS] Loaded', articlesList.length, 'articles');

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
        console.error('❌ [RESGUARDO DETAILS] No resguardos found for folio:', folio);
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
  }, [resguardosFromStore, ineaMuebles, iteaMuebles, noListadoMuebles]);

  /**
   * Select a folio and load its details
   */
  const selectFolio = useCallback(async (folio: string) => {
    // If empty string, clear selection
    if (!folio) {
      clearSelection();
      return;
    }
    await fetchDetails(folio);
  }, [fetchDetails, clearSelection]);

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
