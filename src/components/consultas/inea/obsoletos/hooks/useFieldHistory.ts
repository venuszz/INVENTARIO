import { useState, useEffect } from 'react';
import { obtenerHistorialCambios } from '@/lib/changeHistory';
import type { CambioInventario, TablaOrigen } from '@/types/changeHistory';

/**
 * Hook to fetch and manage field history for an inventory item
 * @param idMueble - UUID of the inventory item
 * @param tablaOrigen - Source table name
 * @returns Object with field history data and loading state
 */
export function useFieldHistory(idMueble: string | null, tablaOrigen: TablaOrigen) {
  const [fieldHistory, setFieldHistory] = useState<Record<string, CambioInventario[]>>({});
  const [fieldsWithHistory, setFieldsWithHistory] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('🟢🟢🟢 [useFieldHistory] ===== EFFECT TRIGGERED =====');
    console.log('🟢 [useFieldHistory] Effect params:', {
      idMueble,
      idMuebleType: typeof idMueble,
      idMuebleIsNull: idMueble === null,
      idMuebleIsUndefined: idMueble === undefined,
      idMuebleLength: idMueble?.length,
      tablaOrigen
    });

    if (!idMueble) {
      console.log('⚠️ [useFieldHistory] No idMueble provided, skipping fetch');
      setFieldHistory({});
      setFieldsWithHistory({});
      return;
    }

    console.log('🟢 [useFieldHistory] Starting fetch for:', idMueble, 'from table:', tablaOrigen);

    const fetchHistory = async () => {
      setLoading(true);
      console.log('🟢 [useFieldHistory] Loading set to TRUE');
      
      try {
        console.log('🟢 [useFieldHistory] Calling obtenerHistorialCambios...');
        const history = await obtenerHistorialCambios(idMueble, tablaOrigen);
        
        console.log('🟢 [useFieldHistory] obtenerHistorialCambios returned:', {
          historyLength: history.length,
          historyType: typeof history,
          isArray: Array.isArray(history),
          firstItem: history[0],
          allItems: history
        });
        
        // Group history by field
        const grouped: Record<string, CambioInventario[]> = {};
        const hasHistory: Record<string, boolean> = {};
        
        history.forEach((cambio, index) => {
          console.log(`🟢 [useFieldHistory] Processing cambio ${index}:`, {
            campo_modificado: cambio.campo_modificado,
            valor_anterior: cambio.valor_anterior,
            valor_nuevo: cambio.valor_nuevo,
            fecha_cambio: cambio.fecha_cambio
          });
          
          const field = cambio.campo_modificado;
          if (!grouped[field]) {
            grouped[field] = [];
          }
          grouped[field].push(cambio);
          hasHistory[field] = true;
        });
        
        console.log('🟢 [useFieldHistory] Grouping complete:', {
          totalFields: Object.keys(grouped).length,
          fields: Object.keys(grouped),
          counts: Object.fromEntries(
            Object.entries(grouped).map(([k, v]) => [k, v.length])
          ),
          hasHistoryObject: hasHistory
        });
        
        setFieldHistory(grouped);
        setFieldsWithHistory(hasHistory);
        console.log('🟢 [useFieldHistory] State updated successfully');
      } catch (error) {
        console.error('🔴 [useFieldHistory] Error in fetchHistory:', error);
        setFieldHistory({});
        setFieldsWithHistory({});
      } finally {
        setLoading(false);
        console.log('🟢 [useFieldHistory] Loading set to FALSE');
      }
    };

    fetchHistory();
    console.log('🟢🟢🟢 [useFieldHistory] ===== EFFECT COMPLETE =====');
  }, [idMueble, tablaOrigen]);

  console.log('🟢 [useFieldHistory] Hook returning:', {
    fieldHistoryKeys: Object.keys(fieldHistory),
    fieldsWithHistoryKeys: Object.keys(fieldsWithHistory),
    loading
  });

  return {
    fieldHistory,
    fieldsWithHistory,
    loading
  };
}
