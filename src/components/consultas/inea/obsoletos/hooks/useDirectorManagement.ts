import { useState, useCallback } from 'react';
import supabase from '@/app/lib/supabase/client';
import type { Directorio, Mueble, FilterOptions } from '../types';

interface UseDirectorManagementReturn {
  directorio: Directorio[];
  showDirectorModal: boolean;
  incompleteDirector: Directorio | null;
  directorFormData: { area: string };
  savingDirector: boolean;
  showAreaSelectModal: boolean;
  areaOptionsForDirector: string[];
  fetchDirectorio: () => Promise<void>;
  fetchFilterOptions: () => Promise<Partial<FilterOptions>>;
  handleSelectDirector: (nombre: string, selectedItem: Mueble | null, editFormData: Mueble | null, setEditFormData: (data: Mueble) => void, setSelectedItem: (item: Mueble) => void) => void;
  saveDirectorInfo: () => Promise<void>;
  setShowDirectorModal: (show: boolean) => void;
  setDirectorFormData: (data: { area: string }) => void;
  setShowAreaSelectModal: (show: boolean) => void;
  handleAreaSelection: (area: string, editFormData: Mueble | null, selectedItem: Mueble | null, setEditFormData: (data: Mueble) => void, setSelectedItem: (item: Mueble) => void) => void;
}

interface UseDirectorManagementProps {
  setMessage: (message: { type: 'success' | 'error' | 'info' | 'warning'; text: string } | null) => void;
  setFilterOptions: (options: any) => void;
}

export function useDirectorManagement({
  setMessage,
  setFilterOptions,
}: UseDirectorManagementProps): UseDirectorManagementReturn {
  const [directorio, setDirectorio] = useState<Directorio[]>([]);
  const [showDirectorModal, setShowDirectorModal] = useState(false);
  const [incompleteDirector, setIncompleteDirector] = useState<Directorio | null>(null);
  const [directorFormData, setDirectorFormData] = useState({ area: '' });
  const [savingDirector, setSavingDirector] = useState(false);
  const [showAreaSelectModal, setShowAreaSelectModal] = useState(false);
  const [areaOptionsForDirector, setAreaOptionsForDirector] = useState<string[]>([]);

  const fetchDirectorio = useCallback(async () => {
    try {
      // 1. Traer todos los directores
      const { data: directoresData, error: directoresError } = await supabase
        .from('directorio')
        .select('id_directorio, nombre');
      if (directoresError) throw directoresError;

      // 2. Traer todas las áreas
      const { data: areasData, error: areasError } = await supabase
        .from('area')
        .select('id_area, nombre');
      if (areasError) throw areasError;

      // 3. Traer todas las relaciones N:M
      const { data: relacionesData, error: relacionesError } = await supabase
        .from('directorio_areas')
        .select('id_directorio, id_area');
      if (relacionesError) throw relacionesError;

      // 4. Mapear áreas por director
      const directorioFormateado = (directoresData || []).map(director => {
        const areaIds = (relacionesData || [])
          .filter(rel => rel.id_directorio === director.id_directorio)
          .map(rel => rel.id_area);
        const areas = (areasData || [])
          .filter(a => areaIds.includes(a.id_area))
          .map(a => a.nombre);
        return {
          id_directorio: director.id_directorio,
          nombre: director.nombre,
          areas
        };
      });

      setDirectorio(directorioFormateado);

      // Actualizar filterOptions.directores
      const directores = directorioFormateado.map(item => ({
        nombre: item.nombre,
        areas: item.areas
      }));
      setFilterOptions((prev: any) => ({
        ...prev,
        directores
      }));
    } catch (err) {
      console.error('Error al cargar directorio:', err);
      setMessage({
        type: 'error',
        text: 'Error al cargar la lista de directores'
      });
    }
  }, [setMessage, setFilterOptions]);

  /**
   * Obtiene las opciones de filtro desde la base de datos
   * @returns Objeto parcial con las opciones de filtro
   */
  const fetchFilterOptions = useCallback(async (): Promise<Partial<FilterOptions>> => {
    try {
      // Obtener estados desde muebles
      const { data: estados } = await supabase
        .from('muebles')
        .select('estado')
        .filter('estado', 'not.is', null)
        .limit(1000);

      // Obtener rubros desde config
      const { data: rubros } = await supabase
        .from('config')
        .select('concepto')
        .eq('tipo', 'rubro');

      // Obtener estatus desde config
      const { data: estatus } = await supabase
        .from('config')
        .select('concepto')
        .eq('tipo', 'estatus');

      // Obtener formas de adquisición desde config
      const { data: formasAdq } = await supabase
        .from('config')
        .select('concepto')
        .eq('tipo', 'formadq');

      return {
        estados: [...new Set(estados?.map(item => item.estado?.trim()).filter(Boolean))] as string[],
        rubros: rubros?.map(item => item.concepto?.trim()).filter(Boolean) || [],
        estatus: estatus?.map(item => item.concepto?.trim()).filter(Boolean) || [],
        formadq: formasAdq?.map(item => item.concepto?.trim()).filter(Boolean) || []
      };
    } catch (error) {
      console.error('Error al cargar opciones de filtro:', error);
      return {
        estados: [],
        rubros: [],
        estatus: [],
        formadq: []
      };
    }
  }, []);

  const handleSelectDirector = (
    nombre: string,
    selectedItem: Mueble | null,
    editFormData: Mueble | null,
    setEditFormData: (data: Mueble) => void,
    setSelectedItem: (item: Mueble) => void
  ) => {
    const director = directorio.find(d => d.nombre === nombre);
    if (!director) return;

    // Si el director no tiene áreas, mostrar modal de alta de área
    if (!director.areas || director.areas.length === 0) {
      setIncompleteDirector(director);
      setDirectorFormData({ area: '' });
      setShowDirectorModal(true);
      return;
    }
    // Si tiene más de una área, mostrar modal de selección
    if (director.areas.length > 1) {
      setAreaOptionsForDirector(director.areas);
      setIncompleteDirector(director);
      setShowAreaSelectModal(true);
      return;
    }
    // Si solo tiene una área, asignar directo
    const areaNombre = director.areas[0] || '';
    
    // Buscar el objeto de área completo
    const fetchAreaObject = async () => {
      try {
        const { data: areaData, error } = await supabase
          .from('area')
          .select('id_area, nombre')
          .eq('nombre', areaNombre)
          .single();
        
        if (error) throw error;
        
        if (editFormData) {
          setEditFormData({
            ...editFormData,
            usufinal: nombre,
            area: areaData,
            id_area: areaData.id_area
          });
        } else if (selectedItem) {
          setSelectedItem({
            ...selectedItem,
            usufinal: nombre,
            area: areaData,
            id_area: areaData.id_area
          });
        }
      } catch (err) {
        console.error('Error al buscar área:', err);
        // Fallback: asignar solo el nombre si falla
        if (editFormData) {
          setEditFormData({
            ...editFormData,
            usufinal: nombre,
            area: null,
            id_area: null
          });
        } else if (selectedItem) {
          setSelectedItem({
            ...selectedItem,
            usufinal: nombre,
            area: null,
            id_area: null
          });
        }
      }
    };
    
    fetchAreaObject();
  };

  const handleAreaSelection = (
    area: string,
    editFormData: Mueble | null,
    selectedItem: Mueble | null,
    setEditFormData: (data: Mueble) => void,
    setSelectedItem: (item: Mueble) => void
  ) => {
    if (!incompleteDirector) return;
    
    // Buscar el objeto de área completo
    const fetchAreaObject = async () => {
      try {
        const { data: areaData, error } = await supabase
          .from('area')
          .select('id_area, nombre')
          .eq('nombre', area)
          .single();
        
        if (error) throw error;
        
        if (editFormData) {
          setEditFormData({
            ...editFormData,
            usufinal: incompleteDirector.nombre,
            area: areaData,
            id_area: areaData.id_area
          });
        } else if (selectedItem) {
          setSelectedItem({
            ...selectedItem,
            usufinal: incompleteDirector.nombre,
            area: areaData,
            id_area: areaData.id_area
          });
        }
      } catch (err) {
        console.error('Error al buscar área:', err);
        // Fallback: asignar null si falla
        if (editFormData) {
          setEditFormData({
            ...editFormData,
            usufinal: incompleteDirector.nombre,
            area: null,
            id_area: null
          });
        } else if (selectedItem) {
          setSelectedItem({
            ...selectedItem,
            usufinal: incompleteDirector.nombre,
            area: null,
            id_area: null
          });
        }
      }
    };
    
    fetchAreaObject();
    
    setShowAreaSelectModal(false);
    setIncompleteDirector(null);
  };

  const saveDirectorInfo = async () => {
    if (!incompleteDirector || !directorFormData.area) return;

    setSavingDirector(true);
    try {
      const { error: updateError } = await supabase
        .from('directorio_areas')
        .insert({
          id_directorio: incompleteDirector.id_directorio,
          area: directorFormData.area
        });

      if (updateError) throw updateError;

      // Update local state
      const updatedDirectorio = directorio.map(d =>
        d.id_directorio === incompleteDirector.id_directorio
          ? { ...d, areas: [...d.areas, directorFormData.area] }
          : d
      );

      setDirectorio(updatedDirectorio);

      // Update filterOptions.directores
      const updatedDirectores = updatedDirectorio.map(item => ({
        nombre: item.nombre,
        areas: item.areas
      }));

      setFilterOptions((prev: any) => ({
        ...prev,
        directores: updatedDirectores
      }));

      setShowDirectorModal(false);
      setMessage({
        type: 'success',
        text: 'Información del director actualizada correctamente'
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Error al actualizar la información del director'
      });
      console.error(err);
    } finally {
      setSavingDirector(false);
    }
  };

  return {
    directorio,
    showDirectorModal,
    incompleteDirector,
    directorFormData,
    savingDirector,
    showAreaSelectModal,
    areaOptionsForDirector,
    fetchDirectorio,
    fetchFilterOptions,
    handleSelectDirector,
    saveDirectorInfo,
    setShowDirectorModal,
    setDirectorFormData,
    setShowAreaSelectModal,
    handleAreaSelection,
  };
}
