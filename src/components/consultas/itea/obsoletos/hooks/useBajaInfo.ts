import { useState, useEffect } from 'react';
import supabase from '@/app/lib/supabase/client';
import type { BajaInfo, MuebleITEA } from '../types';

interface UseBajaInfoReturn {
  bajaInfo: BajaInfo | null;
  loading: boolean;
  error: string | null;
}

export function useBajaInfo(
  selectedItem: MuebleITEA | null,
  isEditing: boolean
): UseBajaInfoReturn {
  const [bajaInfo, setBajaInfo] = useState<BajaInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch when item is selected and not in editing mode
    if (!selectedItem || isEditing) {
      setBajaInfo(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchBajaInfo = async () => {
      setLoading(true);
      setError(null);

      try {
        // Query the deprecated table to get baja information
        const { data, error: fetchError } = await supabase
          .from('deprecated')
          .select('created_by, created_at, motive')
          .eq('id_inv', selectedItem.id_inv)
          .eq('descripcion', selectedItem.descripcion)
          .eq('area', selectedItem.area?.nombre || '')
          .eq('motive', selectedItem.causadebaja || '')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchError) {
          // If no record found, it's not necessarily an error
          if (fetchError.code === 'PGRST116') {
            setBajaInfo(null);
          } else {
            throw fetchError;
          }
        } else if (data) {
          setBajaInfo({
            created_by: data.created_by,
            created_at: data.created_at,
            motive: data.motive,
          });
        }
      } catch (err) {
        console.error('Error fetching baja info:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar información de baja');
      } finally {
        setLoading(false);
      }
    };

    fetchBajaInfo();

    // Cleanup function
    return () => {
      setBajaInfo(null);
      setLoading(false);
      setError(null);
    };
  }, [selectedItem, isEditing]);

  return { bajaInfo, loading, error };
}
