import { useState, useEffect } from 'react';
import { obtenerHistorialCambios } from '@/lib/changeHistory';
import type { CambioInventario, TablaOrigen } from '@/types/changeHistory';

/**
 * Hook to fetch and manage field history for an obsolete ITEA inventory item
 * @param idMueble - UUID of the inventory item
 * @param tablaOrigen - Source table name ('mueblesitea')
 * @returns Object with field history data and loading state
 */
export function useFieldHistory(idMueble: string | null, tablaOrigen: TablaOrigen) {
  const [fieldHistory, setFieldHistory] = useState<Record<string, CambioInventario[]>>({});
  const [fieldsWithHistory, setFieldsWithHistory] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!idMueble) {
      console.log('⚠️ [useFieldHistory] No idMueble provided');
      setFieldHistory({});
      setFieldsWithHistory({});
      return;
    }

    console.log('🔄 [useFieldHistory] Fetching history for:', idMueble, 'from table:', tablaOrigen);

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const history = await obtenerHistorialCambios(idMueble, tablaOrigen);
        
        console.log('✅ [useFieldHistory] Received history:', {
          idMueble,
          totalRecords: history.length,
          records: history
        });
        
        // Group history by field
        const grouped: Record<string, CambioInventario[]> = {};
        const hasHistory: Record<string, boolean> = {};
        
        history.forEach(cambio => {
          const field = cambio.campo_modificado;
          if (!grouped[field]) {
            grouped[field] = [];
          }
          grouped[field].push(cambio);
          hasHistory[field] = true;
        });
        
        console.log('📊 [useFieldHistory] Grouped by field:', {
          fields: Object.keys(grouped),
          counts: Object.fromEntries(
            Object.entries(grouped).map(([k, v]) => [k, v.length])
          )
        });
        
        setFieldHistory(grouped);
        setFieldsWithHistory(hasHistory);
      } catch (error) {
        console.error('❌ [useFieldHistory] Error fetching history:', error);
        setFieldHistory({});
        setFieldsWithHistory({});
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [idMueble, tablaOrigen]);

  return {
    fieldHistory,
    fieldsWithHistory,
    loading
  };
}
