// ============================================================================
// USE ESTATUS COUNTS HOOK
// ============================================================================
// Hook to calculate counts for estatus badges in the admin areas component
// Counts are automatically recalculated when store data changes

import { useMemo } from 'react';
import { useIneaStore } from '@/stores/ineaStore';
import { useIteaStore } from '@/stores/iteaStore';
import { useNoListadoStore } from '@/stores/noListadoStore';
import { useIneaObsoletosStore } from '@/stores/ineaObsoletosStore';
import { useIteaObsoletosStore } from '@/stores/iteaObsoletosStore';

interface EstatusCounts {
  [configId: number]: {
    inea: number;
    itea: number;
    noListado: number;
    total: number;
  };
}

interface ConfigItem {
  id: number;
  tipo: string;
  concepto: string;
}

export function useEstatusCountsRealtime(configItems: ConfigItem[], activeTab: string) {
  // Get data from stores
  const ineaMuebles = useIneaStore(state => state.muebles);
  const iteaMuebles = useIteaStore(state => state.muebles);
  const noListadoMuebles = useNoListadoStore(state => state.muebles);
  const ineaObsoletosMuebles = useIneaObsoletosStore(state => state.muebles);
  const iteaObsoletosMuebles = useIteaObsoletosStore(state => state.muebles);
  
  // Calculate counts - memoized to prevent unnecessary recalculations
  const estatusCounts = useMemo(() => {
    if (activeTab !== 'estatus') {
      return {};
    }
    
    const counts: EstatusCounts = {};
    
    // Helper function to count muebles by estatus
    const countByEstatus = (muebles: any[], origen: 'inea' | 'itea' | 'noListado') => {
      muebles.forEach(mueble => {
        const estatusConcepto = mueble.config_estatus?.concepto || mueble.estatus;
        if (!estatusConcepto) return;
        
        const configItem = configItems.find(
          c => c.tipo === 'estatus' && c.concepto?.toUpperCase() === estatusConcepto.toUpperCase()
        );
        
        if (configItem) {
          if (!counts[configItem.id]) {
            counts[configItem.id] = { inea: 0, itea: 0, noListado: 0, total: 0 };
          }
          counts[configItem.id][origen]++;
          counts[configItem.id].total++;
        }
      });
    };
    
    // Count all sources
    countByEstatus([...ineaMuebles, ...ineaObsoletosMuebles], 'inea');
    countByEstatus([...iteaMuebles, ...iteaObsoletosMuebles], 'itea');
    countByEstatus(noListadoMuebles, 'noListado');
    
    return counts;
  }, [
    activeTab,
    ineaMuebles,
    iteaMuebles,
    noListadoMuebles,
    ineaObsoletosMuebles,
    iteaObsoletosMuebles,
    configItems,
  ]);
  
  return {
    estatusCounts,
  };
}
