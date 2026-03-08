/**
 * Hook optimizado para validación de items en transferencia en lote
 * 
 * Usa el store de resguardos en memoria en lugar de consultas a la base de datos
 * Complejidad: O(n) en lugar de O(n) consultas DB
 */

import { useMemo, useCallback } from 'react';
import { useResguardosStore } from '@/stores/resguardosStore';
import { useSession } from '@/hooks/useSession';
import type { LevMueble } from '../../../types';
import type { BlockReason, ValidationResult } from '@/types/batchOrigenTransfer';

export function useTransferValidation() {
  const { user } = useSession();
  const resguardos = useResguardosStore(state => state.resguardos);

  // Crear mapa de resguardos para lookup O(1)
  const resguardosMap = useMemo(() => {
    console.log('🗺️ [Transfer Validation] Creando mapa de resguardos:', resguardos.length);
    return new Map(resguardos.map(r => [r.id_mueble, r]));
  }, [resguardos]);

  // Verificar permisos de usuario
  const isAdmin = useMemo(() => {
    const admin = user?.rol === 'admin' || user?.rol === 'superadmin';
    console.log('🔑 [Transfer Validation] Usuario es admin:', admin, '(rol:', user?.rol, ')');
    return admin;
  }, [user?.rol]);

  // Función de validación optimizada
  const validateItems = useCallback((items: LevMueble[]): ValidationResult => {
    console.log('🔍 [Transfer Validation] Iniciando validación de', items.length, 'items');
    const startTime = performance.now();
    
    const validItems: LevMueble[] = [];
    const blockedItems = new Map<string, BlockReason>();

    // Verificar permisos
    if (!isAdmin) {
      console.warn('⚠️ [Transfer Validation] Usuario sin permisos de admin');
      items.forEach(item => {
        blockedItems.set(item.id, 'insufficient_permissions');
      });
      return { validItems: [], blockedItems };
    }

    // Validar cada item (en memoria, sin consultas DB)
    items.forEach((item, index) => {
      // Check resguardo (O(1) lookup en memoria)
      if (resguardosMap.has(item.id)) {
        blockedItems.set(item.id, 'resguardo_activo');
        return;
      }

      // Check estatus BAJA
      const estatusValue = item.config_estatus?.concepto || item.estatus || '';
      if (estatusValue.toUpperCase() === 'BAJA') {
        blockedItems.set(item.id, 'estatus_baja');
        return;
      }

      // Item válido
      validItems.push(item);
    });

    const endTime = performance.now();
    console.log('✅ [Transfer Validation] Validación completada en', (endTime - startTime).toFixed(2), 'ms');
    console.log('📊 [Transfer Validation] Resultado:', {
      total: items.length,
      válidos: validItems.length,
      bloqueados: blockedItems.size,
      porResguardo: Array.from(blockedItems.values()).filter(r => r === 'resguardo_activo').length,
      porBaja: Array.from(blockedItems.values()).filter(r => r === 'estatus_baja').length,
    });

    return { validItems, blockedItems };
  }, [isAdmin, resguardosMap]);

  return { 
    validateItems, 
    isAdmin,
    resguardosCount: resguardos.length 
  };
}
