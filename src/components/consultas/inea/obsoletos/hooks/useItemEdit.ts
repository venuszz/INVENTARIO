import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import supabase from '@/app/lib/supabase/client';
import { useIneaObsoletosIndexation } from '@/hooks/indexation/useIneaObsoletosIndexation';
import type { Mueble } from '../types';

interface UseItemEditReturn {
  selectedItem: Mueble | null;
  isEditing: boolean;
  editFormData: Mueble | null;
  imageFile: File | null;
  imagePreview: string | null;
  uploading: boolean;
  showReactivarModal: boolean;
  reactivating: boolean;
  detailRef: React.RefObject<HTMLDivElement | null>;
  handleSelectItem: (item: Mueble) => void;
  handleStartEdit: () => void;
  cancelEdit: () => void;
  closeDetail: () => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  saveChanges: () => Promise<void>;
  handleEditFormChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    field: keyof Mueble
  ) => void;
  setShowReactivarModal: (show: boolean) => void;
  reactivarArticulo: () => Promise<void>;
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
  const { reindex: reindexObsoletos } = useIneaObsoletosIndexation();
  const [selectedItem, setSelectedItem] = useState<Mueble | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Mueble | null>(null);
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
          .from('muebles')
          .select('id')
          .eq('estatus', 'BAJA');

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
    if (!editFormData) return;

    setLoading(true);
    setUploading(true);

    try {
      let imagePath = editFormData.image_path;
      if (imageFile) {
        const newPath = await uploadImage(editFormData.id);
        if (newPath) imagePath = newPath;
      }

      const { error } = await supabase
        .from('muebles')
        .update({ ...editFormData, image_path: imagePath })
        .eq('id', editFormData.id);

      if (error) throw error;

            // Notification removed

      fetchMuebles();
      setSelectedItem({ ...editFormData, image_path: imagePath });
      setIsEditing(false);
      setEditFormData(null);
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
    } finally {
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
      case 'resguardante':
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

  const reactivarArticulo = async () => {
    if (!selectedItem) return;
    setReactivating(true);
    try {
      const { error } = await supabase
        .from('muebles')
        .update({
          estatus: 'ACTIVO',
          fechabaja: null,
          causadebaja: null
        })
        .eq('id', selectedItem.id);
      if (error) throw error;
      
            // Notification removed
      
      fetchMuebles();
      await reindexObsoletos();
      setSelectedItem(null);
      setMessage({ type: 'success', text: 'Artículo reactivado correctamente' });
    } catch {
      setMessage({ type: 'error', text: 'Error al reactivar el artículo. Por favor, intente nuevamente.' });
    } finally {
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
  };
}
