import { useState, useCallback } from 'react';
import supabase from '@/app/lib/supabase/client';
import type { Directorio, Area, FilterOptions, MuebleITEA } from '../types';

interface DirectorFormData {
  directorName: string;
  areaName: string;
}

interface UseDirectorManagementReturn {
  directorio: Directorio[];
  showDirectorModal: boolean;
  incompleteDirector: Directorio | null;
  directorFormData: DirectorFormData;
  savingDirector: boolean;
  showAreaSelectModal: boolean;
  areaOptionsForDirector: Area[];
  setShowDirectorModal: (show: boolean) => void;
  setDirectorFormData: (data: DirectorFormData) => void;
  setShowAreaSelectModal: (show: boolean) => void;
  fetchDirectorio: (setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions>>) => Promise<void>;
  handleSelectDirector: (
    director: Directorio,
    selectedItem: MuebleITEA | null,
    editFormData: Partial<MuebleITEA>,
    setEditFormData: React.Dispatch<React.SetStateAction<Partial<MuebleITEA>>>,
    setSelectedItem: React.Dispatch<React.SetStateAction<MuebleITEA | null>>
  ) => void;
  saveDirectorInfo: (
    setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions>>,
    selectedItem: MuebleITEA | null,
    editFormData: Partial<MuebleITEA>,
    setEditFormData: React.Dispatch<React.SetStateAction<Partial<MuebleITEA>>>,
    setSelectedItem: React.Dispatch<React.SetStateAction<MuebleITEA | null>>
  ) => Promise<void>;
  handleAreaSelection: (
    area: Area,
    selectedItem: MuebleITEA | null,
    editFormData: Partial<MuebleITEA>,
    setEditFormData: React.Dispatch<React.SetStateAction<Partial<MuebleITEA>>>,
    setSelectedItem: React.Dispatch<React.SetStateAction<MuebleITEA | null>>
  ) => void;
}

export function useDirectorManagement(): UseDirectorManagementReturn {
  const [directorio, setDirectorio] = useState<Directorio[]>([]);
  const [showDirectorModal, setShowDirectorModal] = useState(false);
  const [incompleteDirector, setIncompleteDirector] = useState<Directorio | null>(null);
  const [directorFormData, setDirectorFormData] = useState<DirectorFormData>({
    directorName: '',
    areaName: '',
  });
  const [savingDirector, setSavingDirector] = useState(false);
  const [showAreaSelectModal, setShowAreaSelectModal] = useState(false);
  const [areaOptionsForDirector, setAreaOptionsForDirector] = useState<Area[]>([]);

  const fetchDirectorio = useCallback(async (
    setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions>>
  ) => {
    try {
      // Fetch directors
      const { data: directoresData, error: directoresError } = await supabase
        .from('directorio')
        .select('*')
        .order('nombre');

      if (directoresError) throw directoresError;

      // Fetch areas
      const { data: areasData, error: areasError } = await supabase
        .from('area')
        .select('*')
        .order('nombre');

      if (areasError) throw areasError;

      // Fetch director-area relationships
      const { data: relationsData, error: relationsError } = await supabase
        .from('directorio_areas')
        .select('id_directorio, id_area');

      if (relationsError) throw relationsError;

      // Build director objects with their areas
      const directoresWithAreas: Directorio[] = (directoresData || []).map((dir: any) => {
        const directorAreaIds = (relationsData || [])
          .filter((rel: any) => rel.id_directorio === dir.id_directorio)
          .map((rel: any) => rel.id_area);

        const directorAreaNames = (areasData || [])
          .filter((area: any) => directorAreaIds.includes(area.id_area))
          .map((area: any) => area.nombre);

        return {
          id_directorio: dir.id_directorio,
          nombre: dir.nombre,
          areas: directorAreaNames,
        };
      });

      setDirectorio(directoresWithAreas);

      // Update filter options with directors
      setFilterOptions((prev) => ({
        ...prev,
        directores: directoresWithAreas.map((d) => ({
          nombre: d.nombre,
          areas: d.areas,
        })),
      }));
    } catch (error) {
      console.error('Error fetching directorio:', error);
    }
  }, []);

  const handleSelectDirector = useCallback((
    director: Directorio,
    selectedItem: MuebleITEA | null,
    editFormData: Partial<MuebleITEA>,
    setEditFormData: React.Dispatch<React.SetStateAction<Partial<MuebleITEA>>>,
    setSelectedItem: React.Dispatch<React.SetStateAction<MuebleITEA | null>>
  ) => {
    const directorAreas = director.areas || [];

    if (directorAreas.length === 0) {
      // Director has no areas - show DirectorModal to assign one
      setIncompleteDirector(director);
      setDirectorFormData({
        directorName: director.nombre,
        areaName: '',
      });
      setShowDirectorModal(true);
    } else if (directorAreas.length === 1) {
      // Director has exactly one area - auto-assign
      const areaName = directorAreas[0];
      
      // We need to fetch the area ID - for now just set the name
      // The actual ID will be resolved when saving
      const updates: Partial<MuebleITEA> = {
        id_directorio: director.id_directorio,
        directorio: {
          id_directorio: director.id_directorio,
          nombre: director.nombre,
          puesto: '', // Not available in Directorio type
        },
        // Area will be set as null for now, needs to be resolved with proper ID
        area: null,
      };

      if (selectedItem) {
        setEditFormData((prev) => ({ ...prev, ...updates }));
      } else {
        setSelectedItem((prev) => (prev ? { ...prev, ...updates } : null));
      }
    } else {
      // Director has multiple areas - show AreaSelectionModal
      setIncompleteDirector(director);
      // Convert area names to Area objects for the modal
      const areaObjects: Area[] = directorAreas.map((name, index) => ({
        id_area: 0, // Will be resolved later
        nombre: name,
      }));
      setAreaOptionsForDirector(areaObjects);
      setShowAreaSelectModal(true);
    }
  }, []);

  const saveDirectorInfo = useCallback(async (
    setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions>>,
    selectedItem: MuebleITEA | null,
    editFormData: Partial<MuebleITEA>,
    setEditFormData: React.Dispatch<React.SetStateAction<Partial<MuebleITEA>>>,
    setSelectedItem: React.Dispatch<React.SetStateAction<MuebleITEA | null>>
  ) => {
    if (!incompleteDirector || !directorFormData.areaName.trim()) return;

    setSavingDirector(true);

    try {
      // Check if area exists
      const { data: existingArea } = await supabase
        .from('area')
        .select('id_area, nombre')
        .eq('nombre', directorFormData.areaName.trim().toUpperCase())
        .single();

      let areaId: number;
      let areaName: string;

      if (existingArea) {
        areaId = existingArea.id_area;
        areaName = existingArea.nombre;
      } else {
        // Create new area
        const { data: newArea, error: areaError } = await supabase
          .from('area')
          .insert({ nombre: directorFormData.areaName.trim().toUpperCase() })
          .select()
          .single();

        if (areaError) throw areaError;
        areaId = newArea.id_area;
        areaName = newArea.nombre;
      }

      // Insert into directorio_areas
      const { error: relationError } = await supabase
        .from('directorio_areas')
        .insert({
          id_directorio: incompleteDirector.id_directorio,
          id_area: areaId,
        });

      if (relationError) throw relationError;

      // Update local state
      const updatedDirector: Directorio = {
        ...incompleteDirector,
        areas: [
          ...(incompleteDirector.areas || []),
          areaName, // Just the name, not an object
        ],
      };

      setDirectorio((prev) =>
        prev.map((d) =>
          d.id_directorio === incompleteDirector.id_directorio ? updatedDirector : d
        )
      );

      // Update filter options
      setFilterOptions((prev) => ({
        ...prev,
        areas: Array.from(new Set([...prev.areas, areaName])),
      }));

      // Update editFormData or selectedItem with director and area
      const updates: Partial<MuebleITEA> = {
        id_directorio: incompleteDirector.id_directorio,
        directorio: {
          id_directorio: incompleteDirector.id_directorio,
          nombre: incompleteDirector.nombre,
          puesto: '', // Not available in Directorio type
        },
        id_area: areaId,
        area: {
          id_area: areaId,
          nombre: areaName,
        },
      };

      if (selectedItem) {
        setEditFormData((prev) => ({ ...prev, ...updates }));
      } else {
        setSelectedItem((prev) => (prev ? { ...prev, ...updates } : null));
      }

      // Close modal
      setShowDirectorModal(false);
      setIncompleteDirector(null);
      setDirectorFormData({ directorName: '', areaName: '' });
    } catch (error) {
      console.error('Error saving director info:', error);
      alert('Error al guardar la información del director');
    } finally {
      setSavingDirector(false);
    }
  }, [incompleteDirector, directorFormData]);

  const handleAreaSelection = useCallback((
    area: Area,
    selectedItem: MuebleITEA | null,
    editFormData: Partial<MuebleITEA>,
    setEditFormData: React.Dispatch<React.SetStateAction<Partial<MuebleITEA>>>,
    setSelectedItem: React.Dispatch<React.SetStateAction<MuebleITEA | null>>
  ) => {
    if (!incompleteDirector) return;

    // Update editFormData or selectedItem with selected area
    const updates: Partial<MuebleITEA> = {
      id_directorio: incompleteDirector.id_directorio,
      directorio: {
        id_directorio: incompleteDirector.id_directorio,
        nombre: incompleteDirector.nombre,
        puesto: '', // Not available in Directorio type
      },
      id_area: area.id_area,
      area: {
        id_area: area.id_area,
        nombre: area.nombre,
      },
    };

    if (selectedItem) {
      setEditFormData((prev) => ({ ...prev, ...updates }));
    } else {
      setSelectedItem((prev) => (prev ? { ...prev, ...updates } : null));
    }

    // Close modal
    setShowAreaSelectModal(false);
    setIncompleteDirector(null);
    setAreaOptionsForDirector([]);
  }, [incompleteDirector]);

  return {
    directorio,
    showDirectorModal,
    incompleteDirector,
    directorFormData,
    savingDirector,
    showAreaSelectModal,
    areaOptionsForDirector,
    setShowDirectorModal,
    setDirectorFormData,
    setShowAreaSelectModal,
    fetchDirectorio,
    handleSelectDirector,
    saveDirectorInfo,
    handleAreaSelection,
  };
}
