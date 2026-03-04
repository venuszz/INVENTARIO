import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import supabase from '@/app/lib/supabase/client';
import { useIneaObsoletosIndexation } from '@/hooks/indexation/useIneaObsoletosIndexation';
import { useIneaObsoletosStore } from '@/stores/ineaObsoletosStore';
import { detectChanges, Change } from '../utils/changeDetection';
import { registrarCambios } from '@/lib/changeHistory';
import type { ChangeHistoryEntry } from '@/types/changeHistory';
import type { Mueble, FilterOptions, Directorio } from '../types';

interface UseItemEditReturn {
  selectedItem: Mueble | null;
  isEditing: boolean;
  editFormData: Mueble | null;
  imageFile: File | null;
  imagePreview: string | null;
  uploading: boolean;
  isSaving: boolean;
  showReactivarModal: boolean;
  reactivating: boolean;
  showChangeConfirmModal: boolean;
  setShowChangeConfirmModal: (show: boolean) => void;
  changeReason: string;
  setChangeReason: (reason: string) => void;
  pendingChanges: Change[];
  detailRef: React.RefObject<HTMLDivElement | null>;
  handleSelectItem: (item: Mueble) => void;
  handleStartEdit: () => void;
  cancelEdit: () => void;
  closeDetail: () => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  saveChanges: () => Promise<void>;
  confirmAndSaveChanges: (user: any) => Promise<void>;
  handleEditFormChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    field: keyof Mueble
  ) => void;
  setShowReactivarModal: (show: boolean) => void;
  reactivarArticulo: (user: any) => Promise<void>;
  setSelectedItem: (item: Mueble | null) => void;
}

interface UseItemEditProps {
  muebles: Mueble[];
  fetchMuebles: () => Promise<void>;
  sortField: keyof Mueble;
  sortDirection: 'asc' | 'desc';
  searchTerm: string;
  filters: { estado: string; area: string; rubro: string };
  rowsPerPage: number;
  setCurrentPage: (page: number) => void;
  setMessage: (message: { type: 'success' | 'error' | 'info' | 'warning'; text: string } | null) => void;
  setLoading: (loading: boolean) => void;
  filterOptions?: FilterOptions;
  directorio?: Directorio[];
}

export function useItemEdit({
  muebles,
  fetchMuebles,
  sortField,
  sortDirection,
  searchTerm,
  filters,
  rowsPerPage,
  setCurrentPage,
  setMessage,
  setLoading,
  filterOptions,
  directorio,
}: UseItemEditProps): UseItemEditReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { reindex: reindexObsoletos } = useIneaObsoletosIndexation();
  
  // Sync store
  const setSyncingIds = useIneaObsoletosStore(state => state.setSyncingIds);
  const removeSyncingIds = useIneaObsoletosStore(state => state.removeSyncingIds);
  const storedMuebles = useIneaObsoletosStore(state => state.muebles);
  
  const [selectedItem, setSelectedItem] = useState<Mueble | null>(null);
  
  // Update selectedItem when the mueble changes in the store
  useEffect(() => {
    if (selectedItem?.id) {
      const updatedMueble = storedMuebles.find(m => m.id === selectedItem.id);
      
      if (updatedMueble && JSON.stringify(updatedMueble) !== JSON.stringify(selectedItem)) {
        setSelectedItem(updatedMueble);
      }
    }
  }, [storedMuebles, selectedItem?.id]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Mueble | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showReactivarModal, setShowReactivarModal] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  
  // Change confirmation states
  const [showChangeConfirmModal, setShowChangeConfirmModal] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Change[]>([]);
  
  const detailRef = useRef<HTMLDivElement>(null);

  // Detectar parámetro id en URL y abrir detalles automáticamente
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (!idParam) return;
    
    if (selectedItem?.id === idParam) return;
    
    const calculateItemPage = async () => {
      try {
        // Get BAJA status ID from config table
        const { data: bajaStatus } = await supabase
          .from('config')
          .select('id')
          .eq('tipo', 'estatus')
          .eq('concepto', 'BAJA')
          .single();
        
        if (!bajaStatus) {
          console.error('No se pudo obtener el estatus BAJA');
          return;
        }

        let query = supabase
          .from('muebles')
          .select('id')
          .eq('id_estatus', bajaStatus.id);

        if (searchTerm) {
          const searchFilter = `id_inv.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%,resguardante.ilike.%${searchTerm}%,usufinal.ilike.%${searchTerm}%`;
          query = query.or(searchFilter);
        }

        if (filters.estado) {
          query = query.eq('estado', filters.estado);
        }

        if (filters.area) {
          query = query.eq('area', filters.area);
        }

        if (filters.rubro) {
          query = query.eq('rubro', filters.rubro);
        }

        const { data: allIds, error } = await query
          .order(sortField, { ascending: sortDirection === 'asc' })
          .select('id');

        if (error) throw error;

        const itemIndex = allIds?.findIndex((item: { id: string }) => item.id === idParam) ?? -1;

        if (itemIndex !== -1) {
          const targetPage = Math.floor(itemIndex / rowsPerPage) + 1;
          setCurrentPage(targetPage);
        }
      } catch (error) {
        console.error('Error calculating item page:', error);
      }
    };

    calculateItemPage();
  }, [searchParams, muebles.length, searchTerm, filters, sortField, sortDirection, rowsPerPage, selectedItem?.id, setCurrentPage]);

  // Buscar el item cuando se carguen los muebles después de cambiar la página
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (!idParam || !muebles || !Array.isArray(muebles) || muebles.length === 0) return;
    
    if (selectedItem?.id === idParam) return;
    
    const item = muebles.find(m => m.id === idParam);
    if (item) {
      setSelectedItem(item);
      setIsEditing(false);
      setEditFormData(null);
      setTimeout(() => {
        if (detailRef.current) {
          detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [muebles, searchParams, selectedItem?.id]);

  const handleSelectItem = (item: Mueble) => {
    setSelectedItem(item);
    setIsEditing(false);
    setEditFormData(null);
    setImageFile(null);
    setImagePreview(null);

    if (window.innerWidth < 768 && detailRef.current) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleStartEdit = () => {
    if (!selectedItem) return;
    setIsEditing(true);
    setEditFormData({ ...selectedItem });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditFormData(null);
    setImageFile(null);
    setImagePreview(null);
    // Clear change confirmation states
    setShowChangeConfirmModal(false);
    setChangeReason('');
    setPendingChanges([]);
  };

  const closeDetail = () => {
    setSelectedItem(null);
    setIsEditing(false);
    setEditFormData(null);
    setImageFile(null);
    setImagePreview(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('id');
    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    router.replace(newUrl);
  };

  const uploadImage = async (muebleId: string) => {
    if (!imageFile) return null;

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${muebleId}/image.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('muebles.inea')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Error subiendo imagen', uploadError);
        return null;
      }

      return filePath;
    } catch (err) {
      console.error('Error inesperado subiendo imagen', err);
      return null;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'El archivo es demasiado grande. Máximo 5MB.' });
        return;
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Formato no válido. Use JPG, PNG, GIF o WebP' });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveChanges = async () => {
    if (!editFormData || !selectedItem) return;

    // Detect changes with proper field resolution
    const changes = detectChanges(selectedItem, editFormData, {
      estatus: filterOptions?.estatus || [],
      areas: directorio?.flatMap(d => 
        d.areas?.map(areaName => ({ 
          id_area: d.id_directorio, // Temporal: usar id_directorio como id_area
          nombre: areaName 
        })) || []
      ) || [],
      directores: directorio?.map(d => ({
        id_directorio: d.id_directorio,
        nombre: d.nombre || ''
      })) || []
    });

    if (changes.length === 0) {
      setMessage({ type: 'info', text: 'No hay cambios para guardar' });
      return;
    }

    // Show confirmation modal with detected changes
    setPendingChanges(changes);
    setShowChangeConfirmModal(true);
  };

  const confirmAndSaveChanges = async (user: any) => {
    if (!editFormData || !selectedItem) return;

    // Validate change reason
    if (!changeReason.trim()) {
      setMessage({ type: 'warning', text: 'Debe proporcionar un motivo del cambio' });
      return;
    }

    setShowChangeConfirmModal(false);
    setIsSaving(true);
    setLoading(true);
    setUploading(true);
    
    // Add to syncing IDs
    setSyncingIds([editFormData.id]);

    try {
      let imagePath = editFormData.image_path;
      if (imageFile) {
        const newPath = await uploadImage(editFormData.id);
        if (newPath) imagePath = newPath;
      }

      // Extract only database columns (exclude nested objects: area, directorio, config_estatus)
      const { area, directorio, resguardante, config_estatus, ...dbFields } = editFormData as any;

      const response = await fetch(
        '/api/supabase-proxy?target=' + encodeURIComponent(`/rest/v1/muebles?id=eq.${editFormData.id}`),
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ ...dbFields, image_path: imagePath })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar cambios');
      }

      // Register changes in the new change history system
      try {
        if (!user?.id) {
          console.warn('⚠️ [Change History] Usuario no disponible, omitiendo registro de historial');
        } else {
          const changeHistoryEntries: ChangeHistoryEntry[] = pendingChanges.map(change => ({
            campo: change.field,
            valorAnterior: change.oldValue,
            valorNuevo: change.newValue,
            campoDisplay: change.label
          }));

          await registrarCambios({
            idMueble: editFormData.id, // UUID del bien
            tablaOrigen: 'muebles', // Tabla muebles para INEA
            cambios: changeHistoryEntries,
            razonCambio: changeReason
          }, user.id); // Pass userId as second parameter

          console.log('✅ [Change History] Cambios registrados exitosamente en la base de datos');
        }
      } catch (historyError) {
        console.error('❌ [Change History] Error al registrar cambios:', historyError);
        // No bloqueamos la operación si falla el historial
      }

      // Refetch the mueble with JOINs to get updated nested objects
      const refetchResponse = await fetch(
        '/api/supabase-proxy?target=' + encodeURIComponent(
          `/rest/v1/muebles?id=eq.${editFormData.id}&select=*,area:id_area(id_area,nombre),directorio:id_directorio(id_directorio,nombre,puesto),config_estatus:config!id_estatus(id,concepto)`
        ),
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      let refetchedMueble = null;
      if (refetchResponse.ok) {
        const data = await refetchResponse.json();
        if (data && data.length > 0) {
          refetchedMueble = data[0];
        }
      }

      fetchMuebles();
      setSelectedItem(refetchedMueble || { ...editFormData, image_path: imagePath });
      setIsEditing(false);
      setEditFormData(null);
      setImageFile(null);
      setImagePreview(null);
      setChangeReason('');
      setPendingChanges([]);
      setMessage({
        type: 'success',
        text: 'Cambios guardados correctamente'
      });
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      setMessage({
        type: 'error',
        text: 'Error al guardar los cambios. Por favor, intente nuevamente.'
      });
    } finally {
      // Remove from syncing IDs
      if (editFormData) {
        removeSyncingIds([editFormData.id]);
      }
      setIsSaving(false);
      setLoading(false);
      setUploading(false);
    }
  };

  const handleEditFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    field: keyof Mueble
  ) => {
    if (!editFormData) return;

    const newData = { ...editFormData };

    let value = e.target.value;
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA'
    ) {
      value = value.toUpperCase();
    }

    switch (field) {
      case 'id':
        newData.id = value;
        break;
      case 'id_inv':
        newData.id_inv = value;
        break;
      case 'valor':
        newData.valor = value ? parseFloat(value) : null;
        break;
      case 'rubro':
      case 'descripcion':
      case 'f_adq':
      case 'formadq':
      case 'proveedor':
      case 'factura':
      case 'ubicacion_es':
      case 'ubicacion_mu':
      case 'ubicacion_no':
      case 'estado':
      case 'estatus':
      case 'usufinal':
      case 'fechabaja':
      case 'causadebaja':
      case 'image_path':
        newData[field] = value || null;
        break;
      case 'area':
      case 'directorio':
        // These are relational fields, handled separately
        break;
    }

    setEditFormData(newData);
  };

  const reactivarArticulo = async (user: any) => {
    if (!selectedItem) return;
    setReactivating(true);
    
    // Add to syncing IDs
    setSyncingIds([selectedItem.id]);
    
    try {
      // Get ACTIVO estatus ID from config table
      const estatusResponse = await fetch(
        '/api/supabase-proxy?target=' + encodeURIComponent(
          `/rest/v1/config?tipo=eq.estatus&concepto=eq.ACTIVO&select=id`
        ),
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (!estatusResponse.ok) {
        throw new Error('Error al obtener ID de estatus ACTIVO');
      }
      
      const estatusData = await estatusResponse.json();
      if (!estatusData || estatusData.length === 0) {
        throw new Error('No se encontró el estatus ACTIVO en la configuración');
      }
      
      const activoEstatusId = estatusData[0].id;
      
      const response = await fetch(
        '/api/supabase-proxy?target=' + encodeURIComponent(`/rest/v1/muebles?id=eq.${selectedItem.id}`),
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            id_estatus: activoEstatusId,
            fechabaja: null,
            causadebaja: null
          })
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al reactivar');
      }
      
      fetchMuebles();
      await reindexObsoletos();
      setSelectedItem(null);
      setMessage({ type: 'success', text: 'Artículo reactivado correctamente' });
    } catch (error) {
      console.error('Error al reactivar:', error);
      setMessage({ type: 'error', text: 'Error al reactivar el artículo. Por favor, intente nuevamente.' });
    } finally {
      // Remove from syncing IDs
      removeSyncingIds([selectedItem.id]);
      setReactivating(false);
      setShowReactivarModal(false);
      setLoading(false);
    }
  };

  return {
    selectedItem,
    isEditing,
    editFormData,
    imageFile,
    imagePreview,
    uploading,
    isSaving,
    showReactivarModal,
    reactivating,
    showChangeConfirmModal,
    setShowChangeConfirmModal,
    changeReason,
    setChangeReason,
    pendingChanges,
    detailRef,
    handleSelectItem,
    handleStartEdit,
    cancelEdit,
    closeDetail,
    handleImageChange,
    saveChanges,
    confirmAndSaveChanges,
    handleEditFormChange,
    setShowReactivarModal,
    reactivarArticulo,
    setSelectedItem,
  };
}
