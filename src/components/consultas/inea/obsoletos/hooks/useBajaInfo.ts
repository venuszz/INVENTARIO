import { useState, useEffect } from 'react';
import supabase from '@/app/lib/supabase/client';
import type { Mueble, BajaInfo } from '../types';

interface UseBajaInfoReturn {
  bajaInfo: BajaInfo | null;
  loading: boolean;
  error: string | null;
}

interface UseBajaInfoProps {
  selectedItem: Mueble | null;
  isEditing: boolean;
}

export function useBajaInfo({ selectedItem, isEditing }: UseBajaInfoProps): UseBajaInfoReturn {
  const [bajaInfo, setBajaInfo] = useState<BajaInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedItem || isEditing) {
      setBajaInfo(null);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchBajaInfo() {
      setLoading(true);
      setError(null);
      try {
        if (!selectedItem) return;
        const { data, error } = await supabase
          .from('deprecated')
          .select('created_by, created_at, motive')
          .eq('id_inv', selectedItem.id_inv)
          .eq('descripcion', selectedItem.descripcion || '')
          .eq('area', selectedItem.area || '')
          .eq('motive', selectedItem.causadebaja || '')
          .order('created_at', { ascending: false })
          .limit(1);
        if (error) throw error;
        if (!cancelled) {
          setBajaInfo(data && data.length > 0 ? data[0] : null);
        }
      } catch {
        if (!cancelled) setError('No se pudo obtener la información de baja.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBajaInfo();

    return () => {
      cancelled = true;
    };
  }, [selectedItem, isEditing]);

  return {
    bajaInfo,
    loading,
    error,
  };
}
