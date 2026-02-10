import { useState, useEffect } from 'react';
import supabase from '@/app/lib/supabase/client';
import type { Mueble, ResguardoDetalle } from '../types';

/**
 * Hook para cargar y gestionar datos de resguardos asociados a los muebles
 * @param muebles - Lista de muebles ITEA
 * @returns Objeto con folios de resguardo y detalles
 */
export function useResguardoData(muebles: Mueble[]) {
  const [foliosResguardo, setFoliosResguardo] = useState<{ [id_inv: string]: string | null }>({});
  const [resguardoDetalles, setResguardoDetalles] = useState<{ [folio: string]: ResguardoDetalle }>({});

  useEffect(() => {
    async function fetchFoliosYDetalles() {
      if (!muebles.length) return;

      const { data, error } = await supabase
        .from('resguardos')
        .select('*');

      if (!error && data) {
        const folioMap: { [id_inv: string]: string } = {};
        const detallesMap: { [folio: string]: ResguardoDetalle } = {};

        data.forEach(r => {
          if (r.num_inventario && r.folio) {
            folioMap[r.num_inventario] = r.folio;
            if (!detallesMap[r.folio]) {
              detallesMap[r.folio] = {
                folio: r.folio,
                f_resguardo: r.f_resguardo,
                area_resguardo: r.area_resguardo,
                dir_area: r.dir_area,
                puesto: r.puesto,
                origen: r.origen,
                usufinal: r.usufinal,
                descripcion: r.descripcion,
                rubro: r.rubro,
                condicion: r.condicion,
                created_by: r.created_by
              };
            }
          }
        });

        setFoliosResguardo(folioMap);
        setResguardoDetalles(detallesMap);
      } else {
        setFoliosResguardo({});
        setResguardoDetalles({});
      }
    }

    fetchFoliosYDetalles();
  }, [muebles]);

  return { foliosResguardo, resguardoDetalles };
}
