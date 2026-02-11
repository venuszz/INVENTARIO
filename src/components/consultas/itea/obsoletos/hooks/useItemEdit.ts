import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import supabase from '@/app/lib/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';
import { useIteaObsoletosIndexation } from '@/hooks/indexation/useIteaObsoletosIndexation';
import type { MuebleITEA, FilterState } from '../types';

interface UseItemEditReturn {
  selectedItem: MuebleITEA | null;
  isEditing: boolean;
  editFormData: Partial<MuebleITEA>;
  imageFile: File | null;
  imagePreview: string | null;
  uploading: boolean;
  showReactivarModal: boolean;
  reactivating: boolean;
  detailRef: React.RefObject<HTMLDivElement | null>;
  handleSelectItem: (item: MuebleITEA) => void;
  handleStartEdit: () => void;
  cancelEdit: () => void;
  closeDetail: () => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  saveChanges: () => Promise<void>;
  handleEditFormChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    field: keyof MuebleITEA
  ) => void;
  setShowReactivarModal: (show: boolean) => void;
  reactivarArticulo: () => Promise<void>;
  setSelectedItem: React.Dispatch<React.SetStateAction<MuebleITEA | null>>;
  setEditFormData: React.Dispatch<React.SetStateAction<Partial<MuebleITEA>>>;
}

interface UseItemEditProps {
  muebles: MuebleITEA[];
  fetchMuebles: () => Promise<void>;
  sortField: keyof MuebleITEA;
  sortDirection: 'asc' | 'desc';
  searchTerm: string;
  filters: FilterState;
  rowsPerPage: number;
  setCurrentPage: (page: number) => void;
  setMessage: (message: { type: 'success' | 'error' | 'info' | 'warning'; text: string } | null) => void;
  setLoading: (loading: boolean) => void;
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
}: UseItemEditProps): UseItemEditReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { reindex: reindexObsoletos } = useIteaObsoletosIndexation();
  const { createNotification } = useNotifications();
  
  const [selectedItem, setSelectedItem] = useState<MuebleITEA | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<MuebleITEA>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showReactivarModal, setShowReactivarModal] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  
  const detailRef = useRef<HTMLDivElement>(null);

  // Detectar parámetro id en URL y abrir detalles automáticamente
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (!idParam) return;
    
    if (selectedItem?.id === idParam) return;
    
    const calculateItemPage = async () => {
      try {
        let query = supabase
          .from('mueblesitea')
          .select('id, area(id_area, nombre), directorio(id_directorio, nombre, puesto)')
          .eq('estatus', 'BAJA');

        if (searchTerm) {
          const searchFilter = `id_inv.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%,resguardante.ilike.%${searchTerm}%`;
          query = query.or(searchFilter);
        }

        if (filters.estado) {
          query = query.eq('estado', filters.estado);
        }

        if (filters.area) {
          query = query.eq('area.nombre', filters.area);
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
      setEditFormData({});
      setTimeout(() => {
        if (detailRef.current) {
          detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [muebles, searchParams, selectedItem?.id]);

  const handleSelectItem = useCallback((item: MuebleITEA) => {
    setSelectedItem(item);
    setIsEditing(false);
    setEditFormData({});
    setImageFile(null);
    setImagePreview(null);

    if (window.innerWidth < 768 && detailRef.current) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  const handleStartEdit = useCallback(() => {
    if (!selectedItem) return;
    setIsEditing(true);
    setEditFormData({ ...selectedItem });
  }, [selectedItem]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditFormData({});
    setImageFile(null);
    setImagePreview(null);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedItem(null);
    setIsEditing(false);
    setEditFormData({});
    setImageFile(null);
    setImagePreview(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('id');
    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    router.replace(newUrl);
  }, [router, searchParams]);

  const uploadImage = async (muebleId: string) => {
    if (!imageFile) return null;

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${muebleId}/image.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('muebles.itea')
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

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [setMessage]);

  const saveChanges = async () => {
    if (!editFormData || !editFormData.id) return;

    setLoading(true);
    setUploading(true);

    try {
      let imagePath = editFormData.image_path;
      if (imageFile) {
        const newPath = await uploadImage(editFormData.id);
        if (newPath) imagePath = newPath;
      }

      // Prepare update data with relational fields
      const updateData: any = {
        id_inv: editFormData.id_inv,
        rubro: editFormData.rubro,
        descripcion: editFormData.descripcion,
        valor: editFormData.valor,
        f_adq: editFormData.f_adq,
        formadq: editFormData.formadq,
        proveedor: editFormData.proveedor,
        factura: editFormData.factura,
        ubicacion_es: editFormData.ubicacion_es,
        ubicacion_mu: editFormData.ubicacion_mu,
        ubicacion_no: editFormData.ubicacion_no,
        estado: editFormData.estado,
        estatus: editFormData.estatus,
        id_area: editFormData.id_area,
        id_directorio: editFormData.id_directorio,
        fechabaja: editFormData.fechabaja,
        causadebaja: editFormData.causadebaja,
        resguardante: editFormData.resguardante,
        image_path: imagePath,
      };

      const { error } = await supabase
        .from('mueblesitea')
        .update(updateData)
        .eq('id', editFormData.id);

      if (error) throw error;

      await createNotification({
        title: `Artículo de baja ITEA editado (ID: ${editFormData.id_inv})`,
        description: `El artículo "${editFormData.descripcion}" dado de baja fue editado. Cambios guardados por el usuario actual.`,
        type: 'info',
        category: 'bajas',
        device: 'web',
        importance: 'medium',
        data: { changes: [`Edición de artículo dado de baja ITEA: ${editFormData.id_inv}`], affectedTables: ['mueblesitea'] }
      });

      await fetchMuebles();
      
      // Update selectedItem with new data
      if (selectedItem) {
        setSelectedItem({ ...selectedItem, ...editFormData, image_path: imagePath ?? null });
      }
      
      setIsEditing(false);
      setEditFormData({});
      setImageFile(null);
      setImagePreview(null);
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
      await createNotification({
        title: 'Error al editar artículo de baja ITEA',
        description: 'Error al guardar los cambios en el artículo dado de baja.',
        type: 'danger',
        category: 'bajas',
        device: 'web',
        importance: 'high',
        data: { affectedTables: ['mueblesitea'] }
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleEditFormChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    field: keyof MuebleITEA
  ) => {
    if (!editFormData) return;

    let value = e.target.value;
    
    // Force uppercase for text inputs and textareas
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA'
    ) {
      value = value.toUpperCase();
    }

    // Handle different field types
    switch (field) {
      case 'valor':
        setEditFormData(prev => ({
          ...prev,
          valor: value || null
        }));
        break;
      case 'id_area':
        setEditFormData(prev => ({
          ...prev,
          id_area: value ? parseInt(value) : null
        }));
        break;
      case 'id_directorio':
        setEditFormData(prev => ({
          ...prev,
          id_directorio: value ? parseInt(value) : null
        }));
        break;
      case 'area':
      case 'directorio':
        // These are relational fields, handled separately by director management hook
        break;
      default:
        setEditFormData(prev => ({
          ...prev,
          [field]: value || null
        }));
        break;
    }
  }, [editFormData]);

  const reactivarArticulo = async () => {
    if (!selectedItem) return;
    setReactivating(true);
    
    try {
      const { error } = await supabase
        .from('mueblesitea')
        .update({
          estatus: 'ACTIVO',
          fechabaja: null,
          causadebaja: null
        })
        .eq('id', selectedItem.id);
        
      if (error) throw error;
      
      await createNotification({
        title: `Artículo ITEA reactivado (ID: ${selectedItem.id_inv})`,
        description: `El artículo "${selectedItem.descripcion}" fue reactivado y regresó a inventario activo.`,
        type: 'success',
        category: 'bajas',
        device: 'web',
        importance: 'medium',
        data: { changes: [`Reactivación de artículo ITEA: ${selectedItem.id_inv}`], affectedTables: ['mueblesitea'] }
      });
      
      await fetchMuebles();
      await reindexObsoletos();
      setSelectedItem(null);
      setShowReactivarModal(false);
      setMessage({ type: 'success', text: 'Artículo reactivado correctamente' });
    } catch (error) {
      console.error('Error al reactivar artículo:', error);
      setMessage({ type: 'error', text: 'Error al reactivar el artículo. Por favor, intente nuevamente.' });
      await createNotification({
        title: 'Error al reactivar artículo de baja ITEA',
        description: 'Error al reactivar el artículo dado de baja.',
        type: 'danger',
        category: 'bajas',
        device: 'web',
        importance: 'high',
        data: { affectedTables: ['mueblesitea'] }
      });
    } finally {
      setReactivating(false);
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
    showReactivarModal,
    reactivating,
    detailRef,
    handleSelectItem,
    handleStartEdit,
    cancelEdit,
    closeDetail,
    handleImageChange,
    saveChanges,
    handleEditFormChange,
    setShowReactivarModal,
    reactivarArticulo,
    setSelectedItem,
    setEditFormData,
  };
}
