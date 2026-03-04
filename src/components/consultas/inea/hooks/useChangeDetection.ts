import { useMemo } from 'react';
import { Mueble } from '../types';
import { detectChanges, Change } from '../utils/changeDetection';

/**
 * Hook para detectar cambios entre el item original y el editado
 */
export function useChangeDetection(original: Mueble | null, edited: Mueble | null) {
  const changes = useMemo<Change[]>(() => {
    if (!original || !edited) return [];
    return detectChanges(original, edited);
  }, [original, edited]);

  const hasChanges = changes.length > 0;

  return {
    changes,
    hasChanges
  };
}
