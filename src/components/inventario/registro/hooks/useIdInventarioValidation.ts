import { useState, useEffect, useMemo } from 'react';
import { useUnifiedInventory } from '@/components/consultas/levantamiento/hooks/useUnifiedInventory';

interface IdValidationResult {
  exists: boolean;
  institution: 'INEA' | 'ITEA' | 'TLAXCALA' | null;
  loading: boolean;
  itemData: any | null; // Datos completos del bien encontrado
}

export function useIdInventarioValidation(idInventario: string) {
  const { muebles, loading: indexationLoading } = useUnifiedInventory();
  const [result, setResult] = useState<IdValidationResult>({
    exists: false,
    institution: null,
    loading: false,
    itemData: null,
  });

  // Create a lookup map for fast ID searches
  const idMap = useMemo(() => {
    const map = new Map<string, { institution: 'INEA' | 'ITEA' | 'TLAXCALA'; data: any }>();
    muebles.forEach(mueble => {
      if (mueble.id_inv) {
        // Normalize ITEJPA to ITEA for consistency
        const normalizedInstitution = mueble.origen === 'ITEJPA' ? 'ITEA' : mueble.origen;
        map.set(mueble.id_inv.trim().toLowerCase(), {
          institution: normalizedInstitution as 'INEA' | 'ITEA' | 'TLAXCALA',
          data: mueble
        });
      }
    });
    return map;
  }, [muebles]);

  useEffect(() => {
    // Reset if empty
    if (!idInventario || idInventario.trim() === '') {
      setResult({ exists: false, institution: null, loading: false, itemData: null });
      return;
    }

    // Show loading while indexation is in progress
    if (indexationLoading) {
      setResult({ exists: false, institution: null, loading: true, itemData: null });
      return;
    }

    // Debounce the validation
    const timeoutId = setTimeout(() => {
      const trimmedId = idInventario.trim().toLowerCase();
      const foundItem = idMap.get(trimmedId);

      if (foundItem) {
        setResult({ 
          exists: true, 
          institution: foundItem.institution, 
          loading: false,
          itemData: foundItem.data
        });
      } else {
        setResult({ exists: false, institution: null, loading: false, itemData: null });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [idInventario, idMap, indexationLoading]);

  return result;
}
