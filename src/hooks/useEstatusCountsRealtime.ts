// ============================================================================
// USE ESTATUS COUNTS REALTIME HOOK
// ============================================================================
// Hook to manage real-time updates for estatus counts in the admin areas component

import { useState, useEffect, useCallback, useRef } from 'react';
import { useIneaStore } from '@/stores/ineaStore';
import { useIteaStore } from '@/stores/iteaStore';
import { useNoListadoStore } from '@/stores/noListadoStore';
import { useIneaObsoletosStore } from '@/stores/ineaObsoletosStore';
import { useIteaObsoletosStore } from '@/stores/iteaObsoletosStore';
import supabase from '@/app/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
  const [estatusCounts, setEstatusCounts] = useState<EstatusCounts>({});
  const [isLoadingCounts, setIsLoadingCounts] = useState<boolean>(false);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const recalculateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingConfigUpdatesRef = useRef<Set<number>>(new Set());
  
  // Get data from stores
  const ineaMuebles = useIneaStore(state => state.muebles);
  const iteaMuebles = useIteaStore(state => state.muebles);
  const noListadoMuebles = useNoListadoStore(state => state.muebles);
  const ineaObsoletosMuebles = useIneaObsoletosStore(state => state.muebles);
  const iteaObsoletosMuebles = useIteaObsoletosStore(state => state.muebles);
  
  // Get lengths for dependency tracking
  const ineaLength = ineaMuebles.length;
  const iteaLength = iteaMuebles.length;
  const noListadoLength = noListadoMuebles.length;
  const ineaObsoletosLength = ineaObsoletosMuebles.length;
  const iteaObsoletosLength = iteaObsoletosMuebles.length;
  const configLength = configItems.length;
  
  // Calculate counts
  const calculateCounts = useCallback(() => {
    if (activeTab !== 'estatus') {
      setEstatusCounts({});
      return;
    }
    
    setIsLoadingCounts(true);
    
    const timer = setTimeout(() => {
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
      countByEstatus(ineaMuebles, 'inea');
      countByEstatus(ineaObsoletosMuebles, 'inea');
      countByEstatus(iteaMuebles, 'itea');
      countByEstatus(iteaObsoletosMuebles, 'itea');
      countByEstatus(noListadoMuebles, 'noListado');
      
      setEstatusCounts(counts);
      setIsLoadingCounts(false);
      setIsRecalculating(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [
    activeTab,
    ineaMuebles,
    iteaMuebles,
    noListadoMuebles,
    ineaObsoletosMuebles,
    iteaObsoletosMuebles,
    configItems,
  ]);
  
  // Initial calculation
  useEffect(() => {
    calculateCounts();
  }, [calculateCounts]);
  
  // Setup realtime listener for config table changes
  useEffect(() => {
    if (activeTab !== 'estatus') {
      // Clean up channel if not on estatus tab
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }
    
    // Setup channel
    const setupChannel = async () => {
      // Remove existing channel
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      const channel = supabase
        .channel('config-estatus-counts-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'config',
            filter: 'tipo=eq.estatus',
          },
          async (payload: any) => {
            const { new: updatedConfig } = payload;
            
            if (updatedConfig.tipo === 'estatus') {
              // Add to pending updates
              pendingConfigUpdatesRef.current.add(updatedConfig.id);
              
              // Show recalculating state immediately
              setIsRecalculating(true);
              
              // Clear existing timeout
              if (recalculateTimeoutRef.current) {
                clearTimeout(recalculateTimeoutRef.current);
              }
              
              // Debounce recalculation (wait 1 second after last update)
              recalculateTimeoutRef.current = setTimeout(() => {
                pendingConfigUpdatesRef.current.clear();
                calculateCounts();
              }, 1000);
            }
          }
        )
        .subscribe();
      
      channelRef.current = channel;
    };
    
    setupChannel();
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (recalculateTimeoutRef.current) {
        clearTimeout(recalculateTimeoutRef.current);
      }
    };
  }, [activeTab, calculateCounts]);
  
  return {
    estatusCounts,
    isLoadingCounts,
    isRecalculating,
  };
}
