import { useState } from 'react';
import type { ResguardoBajaDetalle, ResguardoBajaArticulo } from '../types';

export function useBajaDetails(allBajas: any[]) {
  const [selectedBaja, setSelectedBaja] = useState<ResguardoBajaDetalle | null>(null);
  const [groupedItems, setGroupedItems] = useState<{ [key: string]: ResguardoBajaArticulo[] }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBajaDetails = async (folioResguardo: string) => {
    // Si el folio está vacío, limpiar selección sin mostrar error
    if (!folioResguardo || folioResguardo.trim() === '') {
      clearSelection();
      return;
    }

    setLoading(true);
    try {
      // Usar datos indexados en lugar de query a Supabase
      const bajasForFolio = allBajas.filter(b => b.folio_resguardo === folioResguardo);

      if (bajasForFolio.length > 0) {
        const firstItem = bajasForFolio[0];
        const articles = bajasForFolio.map(item => ({
          id: item.id,
          num_inventario: item.num_inventario,
          descripcion: item.descripcion,
          rubro: item.rubro,
          condicion: item.condicion,
          origen: item.origen,
          folio_baja: item.folio_baja,
          usufinal: item.usufinal || firstItem.usufinal
        }));

        const grouped = articles.reduce((acc, article) => {
          const folio = article.folio_baja;
          if (!acc[folio]) {
            acc[folio] = [];
          }
          acc[folio].push(article);
          return acc;
        }, {} as { [key: string]: ResguardoBajaArticulo[] });

        setGroupedItems(grouped);

        const detalles: ResguardoBajaDetalle = {
          ...firstItem,
          articulos: articles
        };

        setSelectedBaja(detalles);
        setError(null);
      } else {
        setError(`No se encontraron bajas para el folio: ${folioResguardo}`);
        setSelectedBaja(null);
        setGroupedItems({});
      }
    } catch (err) {
      setError('Error al cargar los detalles de la baja');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedBaja(null);
    setGroupedItems({});
  };

  const getArticuloCount = (folioResguardo: string) => {
    return allBajas.filter(r => r.folio_resguardo === folioResguardo).length;
  };

  return {
    selectedBaja,
    groupedItems,
    loading,
    error,
    fetchBajaDetails,
    clearSelection,
    getArticuloCount,
  };
}
