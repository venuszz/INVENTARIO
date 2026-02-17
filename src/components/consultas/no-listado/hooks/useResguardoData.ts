import { useState, useEffect, useMemo } from 'react';
import { useResguardosStore } from '@/stores/resguardosStore';
import { Mueble, ResguardoDetalle } from '../types';

export function useResguardoData(muebles: Mueble[]) {
    const resguardos = useResguardosStore(state => state.resguardos);
    
    // Create a map of mueble UUID to id_inv for quick lookup
    const muebleIdToIdInv = useMemo(() => {
        const map: { [uuid: string]: string } = {};
        muebles.forEach(m => {
            map[m.id] = m.id_inv;
        });
        return map;
    }, [muebles]);

    // Map resguardos to id_inv and create folio map
    const { foliosResguardo, resguardoDetalles } = useMemo(() => {
        const folioMap: { [id_inv: string]: string } = {};
        const detallesMap: { [folio: string]: ResguardoDetalle } = {};
        
        resguardos.forEach(r => {
            // Only process resguardos from NO_LISTADO origin
            if (r.origen !== 'NO_LISTADO') return;
            
            // Get id_inv from mueble UUID
            const idInv = muebleIdToIdInv[r.id_mueble];
            if (!idInv) return;
            
            // Map id_inv to folio
            folioMap[idInv] = r.folio;
            
            // Get area from mueble
            const mueble = muebles.find(m => m.id === r.id_mueble);
            const areaNombre = mueble?.area?.nombre || '';
            
            // Store resguardo details by folio
            if (!detallesMap[r.folio]) {
                detallesMap[r.folio] = {
                    folio: r.folio,
                    f_resguardo: r.f_resguardo,
                    area_resguardo: areaNombre,
                    dir_area: r.director_nombre || '',
                    puesto: r.director_puesto || '',
                    origen: r.origen,
                    usufinal: '', // Legacy field, not used in new structure
                    descripcion: '', // Not stored at resguardo level
                    rubro: '', // Not stored at resguardo level
                    condicion: '', // Not stored at resguardo level
                    created_by: r.created_by
                };
            }
        });
        
        return { foliosResguardo: folioMap, resguardoDetalles: detallesMap };
    }, [resguardos, muebleIdToIdInv, muebles]);

    return {
        foliosResguardo,
        resguardoDetalles
    };
}
