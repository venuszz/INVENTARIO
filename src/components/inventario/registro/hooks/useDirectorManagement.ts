import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { useAdminIndexation } from '@/hooks/indexation/useAdminIndexation';
import supabase from '@/app/lib/supabase/client';
import { Directorio, Area } from '../types';

interface UseDirectorManagementParams {
  onAreaAssigned: (directorName: string, areaName: string) => void;
  onCancel?: (directorName: string, areaName: string) => void;
}

interface UseDirectorManagementReturn {
  directorio: Directorio[];
  areas: Area[];
  directorAreasMap: { [id_directorio: number]: number[] };
  showDirectorModal: boolean;
  showAreaSelectModal: boolean;
  incompleteDirector: Directorio | null;
  directorFormData: { area: string };
  areaOptionsForDirector: Area[];
  savingDirector: boolean;
  handleSelectDirector: (nombre: string) => void;
  saveDirectorInfo: () => Promise<void>;
  handleCancelDirectorModal: () => void;
  handleCancelAreaModal: () => void;
  setShowDirectorModal: (show: boolean) => void;
  setShowAreaSelectModal: (show: boolean) => void;
  setDirectorFormData: Dispatch<SetStateAction<{ area: string }>>;
  refetchDirectorio: () => Promise<void>;
}

export function useDirectorManagement({ onAreaAssigned, onCancel }: UseDirectorManagementParams): UseDirectorManagementReturn {
  // Get data from admin indexation hook
  const { directorio: adminDirectorio, areas: adminAreas, directorioAreas } = useAdminIndexation();
  
  const [directorAreasMap, setDirectorAreasMap] = useState<{ [id_directorio: number]: number[] }>({});
  const [showDirectorModal, setShowDirectorModal] = useState(false);
  const [showAreaSelectModal, setShowAreaSelectModal] = useState(false);
  const [incompleteDirector, setIncompleteDirector] = useState<Directorio | null>(null);
  const [directorFormData, setDirectorFormData] = useState({ area: '' });
  const [areaOptionsForDirector, setAreaOptionsForDirector] = useState<Area[]>([]);
  const [savingDirector, setSavingDirector] = useState(false);

  // Convert admin data to component format
  const directorio: Directorio[] = adminDirectorio.map(d => ({
    id_directorio: d.id_directorio,
    nombre: d.nombre || '',
    area: d.area || null,
    puesto: d.puesto || null
  }));

  const areas: Area[] = adminAreas.map(a => ({
    id_area: a.id_area,
    nombre: a.nombre
  }));

  // Build director-area relationships map from directorioAreas
  useEffect(() => {
    const map: { [id_directorio: number]: number[] } = {};
    directorioAreas.forEach((rel) => {
      if (!map[rel.id_directorio]) map[rel.id_directorio] = [];
      map[rel.id_directorio].push(rel.id_area);
    });
    setDirectorAreasMap(map);
  }, [directorioAreas]);

  // Handle director selection
  const handleSelectDirector = useCallback((nombre: string) => {
    const selected = directorio.find(d => d.nombre === nombre);
    if (!selected) return;

    // Get areas assigned to this director
    const areaIds = directorAreasMap[selected.id_directorio] || [];
    const areasForDirector = areas.filter(a => areaIds.includes(a.id_area));

    // If no areas, show modal to complete info
    if (areasForDirector.length === 0) {
      setIncompleteDirector(selected);
      setDirectorFormData({ area: '' });
      setShowDirectorModal(true);
      return;
    }

    // If multiple areas, show selection modal
    if (areasForDirector.length > 1) {
      setAreaOptionsForDirector(areasForDirector);
      setIncompleteDirector(selected);
      setShowAreaSelectModal(true);
      return;
    }

    // If exactly one area, assign directly
    onAreaAssigned(nombre, areasForDirector[0].nombre);
  }, [directorio, directorAreasMap, areas, onAreaAssigned]);

  // Save director info
  const saveDirectorInfo = useCallback(async () => {
    if (!incompleteDirector) return;

    setSavingDirector(true);
    try {
      const { error: updateError } = await supabase
        .from('directorio')
        .update({
          area: directorFormData.area
        })
        .eq('id_directorio', incompleteDirector.id_directorio);

      if (updateError) throw updateError;

      // Call the callback with updated info
      onAreaAssigned(incompleteDirector.nombre, directorFormData.area);

      setShowDirectorModal(false);
    } catch (err) {
      console.error('Error updating director:', err);
      throw err;
    } finally {
      setSavingDirector(false);
    }
  }, [incompleteDirector, directorFormData, onAreaAssigned]);

  // Handle cancel director modal - keep director name but clear area
  const handleCancelDirectorModal = useCallback(() => {
    setShowDirectorModal(false);
    // Keep the director name but signal that area is missing
    if (incompleteDirector && onCancel) {
      onCancel(incompleteDirector.nombre, ''); // Pass director name with empty area
    }
    setDirectorFormData({ area: '' });
  }, [incompleteDirector, onCancel]);

  // Handle cancel area selection modal - keep director name but clear area
  const handleCancelAreaModal = useCallback(() => {
    setShowAreaSelectModal(false);
    setAreaOptionsForDirector([]);
    // Keep the director name but signal that area is missing
    if (incompleteDirector && onCancel) {
      onCancel(incompleteDirector.nombre, ''); // Pass director name with empty area
    }
  }, [incompleteDirector, onCancel]);

  // Refetch function (not needed anymore since data comes from indexation)
  const refetchDirectorio = useCallback(async () => {
    // Data is automatically updated through indexation
  }, []);

  return {
    directorio,
    areas,
    directorAreasMap,
    showDirectorModal,
    showAreaSelectModal,
    incompleteDirector,
    directorFormData,
    areaOptionsForDirector,
    savingDirector,
    handleSelectDirector,
    saveDirectorInfo,
    handleCancelDirectorModal,
    handleCancelAreaModal,
    setShowDirectorModal,
    setShowAreaSelectModal,
    setDirectorFormData,
    refetchDirectorio
  };
}
