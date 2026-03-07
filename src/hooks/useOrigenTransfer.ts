import { useState, useCallback } from 'react';
import { sileo } from 'sileo';
import supabase from '@/app/lib/supabase/client';

type OrigenType = 'inea' | 'itea' | 'no-listado';

interface UseOrigenTransferParams {
  currentOrigen: OrigenType;
  onSuccess?: () => void;
}

interface UseOrigenTransferReturn {
  transferOrigen: (
    recordId: string,
    idInventario: string,
    targetOrigen: OrigenType
  ) => Promise<void>;
  isTransferring: boolean;
  error: string | null;
  canTransfer: (recordId: string) => Promise<boolean>;
}

const ORIGEN_LABELS = {
  inea: 'INEA',
  itea: 'ITEA',
  'no-listado': 'No Listado',
};

// Map origen names to actual table names
const TABLE_MAP: Record<OrigenType, string> = {
  'inea': 'muebles',
  'itea': 'mueblesitea',
  'no-listado': 'mueblestlaxcala'
};

export default function useOrigenTransfer({
  currentOrigen,
  onSuccess,
}: UseOrigenTransferParams): UseOrigenTransferReturn {
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Verifica si un registro puede ser transferido
   */
  const canTransfer = useCallback(
    async (recordId: string): Promise<boolean> => {
      try {
        // Check if record has active resguardo
        const { data: resguardos } = await supabase
          .from('resguardos')
          .select('id')
          .eq('id_mueble', recordId)
          .limit(1);
        
        if (resguardos && resguardos.length > 0) {
          return false; // Has active resguardo
        }
        
        return true;
      } catch (err) {
        console.error('Error checking transfer eligibility:', err);
        return false;
      }
    },
    []
  );

  /**
   * Ejecuta la transferencia de origen directamente desde el frontend
   * Esto evita disparar eventos de realtime que causan reindexación completa
   */
  const transferOrigen = useCallback(
    async (
      recordId: string,
      idInventario: string,
      targetOrigen: OrigenType
    ): Promise<void> => {
      console.log('[useOrigenTransfer] === INICIO TRANSFER (FRONTEND) ===');
      console.log('[useOrigenTransfer] Params:', {
        recordId,
        idInventario,
        currentOrigen,
        targetOrigen,
      });

      setIsTransferring(true);
      setError(null);

      const sourceTable = TABLE_MAP[currentOrigen];
      const destTable = TABLE_MAP[targetOrigen];

      try {
        // 1. Verificar que no tenga resguardo activo
        const canProceed = await canTransfer(recordId);
        if (!canProceed) {
          throw new Error('No se puede transferir: el registro tiene un resguardo activo');
        }

        // 2. Leer registro origen
        const { data: sourceRecord, error: selectError } = await supabase
          .from(sourceTable)
          .select('*')
          .eq('id', recordId)
          .single();

        if (selectError || !sourceRecord) {
          console.error('Error reading source record:', selectError);
          throw new Error('No se pudo leer el registro origen');
        }

        // 3. Verificar que no exista duplicado en destino
        const { data: duplicateCheck } = await supabase
          .from(destTable)
          .select('id')
          .eq('id_inv', idInventario)
          .limit(1);

        if (duplicateCheck && duplicateCheck.length > 0) {
          throw new Error('El ID de inventario ya existe en la tabla destino');
        }

        // 4. Preparar datos para inserción (excluir id, created_at, updated_at)
        const { id, created_at, updated_at, ...recordData } = sourceRecord;

        // Si se transfiere desde ITEA, eliminar el campo 'color' ya que es exclusivo de ITEA
        if (currentOrigen === 'itea' && 'color' in recordData) {
          delete (recordData as any).color;
          console.log('[useOrigenTransfer] Campo "color" eliminado (exclusivo de ITEA)');
        }

        // 5. Insertar en tabla destino usando supabase-proxy (como las ediciones)
        const insertResponse = await fetch(
          '/api/supabase-proxy?target=' + encodeURIComponent(`/rest/v1/${destTable}`),
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal' // NO retornar datos para evitar reindexación
            },
            body: JSON.stringify(recordData)
          }
        );

        if (!insertResponse.ok) {
          const error = await insertResponse.json();
          throw new Error(error.message || 'Error al insertar en tabla destino');
        }

        // 6. Eliminar de tabla origen usando supabase-proxy
        const deleteResponse = await fetch(
          '/api/supabase-proxy?target=' + encodeURIComponent(`/rest/v1/${sourceTable}?id=eq.${recordId}`),
          {
            method: 'DELETE',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal' // NO retornar datos
            }
          }
        );

        if (!deleteResponse.ok) {
          const error = await deleteResponse.json();
          throw new Error(error.message || 'Error al eliminar de tabla origen');
        }

        console.log('[useOrigenTransfer] ✓ Transfer exitoso (frontend)');

        // El realtime detectará el DELETE y el INSERT automáticamente
        // y actualizará los stores de forma incremental

        // Mostrar toast de éxito (blanco y negro como cuando se edita)
        sileo.show({
          title: 'Registro transferido',
          description: `Transferido a ${ORIGEN_LABELS[targetOrigen]} - ID: ${idInventario}`,
          duration: 4000,
          position: 'top-right',
          styles: {
            title: '!text-black dark:!text-white',
            description: '!text-black/60 dark:!text-white/60',
          },
        });

        // Ejecutar callback de éxito
        if (onSuccess) {
          onSuccess();
        }
      } catch (err: any) {
        console.log('[useOrigenTransfer] === ERROR CATCH ===', err);
        const errorMessage = err.message || 'Error al transferir registro';
        setError(errorMessage);
        
        sileo.show({
          title: 'Error al transferir',
          description: errorMessage,
          duration: 5000,
          fill: '#ef4444',
          position: 'top-right',
          styles: {
            title: '!text-white',
            description: '!text-white/70',
          },
        });

        throw err;
      } finally {
        setIsTransferring(false);
      }
    },
    [
      currentOrigen,
      onSuccess,
      canTransfer,
    ]
  );

  return {
    transferOrigen,
    isTransferring,
    error,
    canTransfer,
  };
}
