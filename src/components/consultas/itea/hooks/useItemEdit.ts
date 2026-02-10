import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import supabase from '@/app/lib/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';
import { Mueble, Message } from '../types';

export function useItemEdit() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { createNotification } = useNotifications();
    
    const [selectedItem, setSelectedItem] = useState<Mueble | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState<Mueble | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<Message | null>(null);
    const [showBajaModal, setShowBajaModal] = useState(false);
    const [bajaCause, setBajaCause] = useState('');
    const [showInactiveModal, setShowInactiveModal] = useState(false);

    const handleSelectItem = (item: Mueble) => {
        setSelectedItem(item);
        setIsEditing(false);
        setEditFormData(null);
        setImageFile(null);
        setImagePreview(null);
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
        
        // Clear id parameter from URL
        const params = new URLSearchParams(searchParams.toString());
        params.delete('id');
        const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
        router.replace(newUrl);
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

    const validateDirectorAreaRelation = async (idDirectorio: number, idArea: number): Promise<boolean> => {
        try {
            const response = await fetch(
                '/api/supabase-proxy?target=' + encodeURIComponent(
                    `/rest/v1/directorio_areas?id_directorio=eq.${idDirectorio}&id_area=eq.${idArea}&select=id`
                ),
                {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            if (!response.ok) {
                console.error('Error validating director-area relation');
                return false;
            }

            const data = await response.json();
            return data && data.length > 0;
        } catch (err) {
            console.error('Error validating director-area relation:', err);
            return false;
        }
    };

    const saveChanges = async () => {
        if (!editFormData) return;

        setUploading(true);

        try {
            // Validate director-area relation if both fields are present
            if (editFormData.id_directorio && editFormData.id_area) {
                const isValid = await validateDirectorAreaRelation(
                    editFormData.id_directorio,
                    editFormData.id_area
                );

                if (!isValid) {
                    setMessage({
                        type: 'error',
                        text: 'La combinación de director y área no es válida. El director seleccionado no está asignado a esta área.'
                    });
                    setUploading(false);
                    return;
                }
            }

            let imagePath = editFormData.image_path;
            if (imageFile) {
                const newPath = await uploadImage(editFormData.id);
                if (newPath) imagePath = newPath;
            }

            // Extract only the database columns (exclude nested objects)
            const { area, directorio, ...dbFields } = editFormData;
            
            const response = await fetch(
                '/api/supabase-proxy?target=' + encodeURIComponent(`/rest/v1/mueblesitea?id=eq.${editFormData.id}`),
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
                if (error.code === '23503') {
                    setMessage({
                        type: 'error',
                        text: 'Error: La referencia de director o área no es válida. Por favor, verifique los datos.'
                    });
                    setUploading(false);
                    return;
                }
                throw new Error(error.message || 'Error al guardar cambios');
            }

            // Notification for edit
            await createNotification({
                title: `Artículo editado (ID: ${editFormData.id_inv})`,
                description: `El artículo "${editFormData.descripcion}" fue editado. Cambios guardados por el usuario actual.`,
                type: 'info',
                category: 'inventario',
                device: 'web',
                importance: 'medium',
                data: { changes: [`Edición de artículo: ${editFormData.id_inv}`], affectedTables: ['mueblesitea'] }
            });

            // Refetch the mueble with JOINs to get updated nested objects
            const refetchResponse = await fetch(
                '/api/supabase-proxy?target=' + encodeURIComponent(
                    `/rest/v1/mueblesitea?id=eq.${editFormData.id}&select=*,area:area(id_area,nombre),directorio:directorio(id_directorio,nombre,puesto)`
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

            setSelectedItem(refetchedMueble || { ...editFormData, image_path: imagePath });
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
            await createNotification({
                title: 'Error al editar artículo',
                description: 'Error al guardar los cambios en el artículo.',
                type: 'danger',
                category: 'inventario',
                device: 'web',
                importance: 'high',
                data: { affectedTables: ['mueblesitea'] }
            });
        } finally {
            setUploading(false);
        }
    };

    const handleEditFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
        field: keyof Mueble
    ) => {
        if (!editFormData) return;

        const newData = { ...editFormData };

        // Force uppercase for text inputs and textarea
        let value = e.target.value;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
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
                newData.valor = value || null;
                break;
            case 'id_area':
                newData.id_area = value ? parseInt(value) : null;
                break;
            case 'id_directorio':
                newData.id_directorio = value ? parseInt(value) : null;
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
            case 'fechabaja':
            case 'causadebaja':
            case 'resguardante':
            case 'image_path':
                newData[field] = value || null;
                break;
        }

        setEditFormData(newData);
    };

    const markAsBaja = async () => {
        if (!selectedItem) return;
        setShowBajaModal(true);
    };

    const confirmBaja = async (user: any) => {
        if (!selectedItem || !bajaCause) return;
        setShowBajaModal(false);
        
        try {
            const todayDate = new Date();
            const today = todayDate.getFullYear() + '-' +
                String(todayDate.getMonth() + 1).padStart(2, '0') + '-' +
                String(todayDate.getDate()).padStart(2, '0');
            
            const updateResponse = await fetch(
                '/api/supabase-proxy?target=' + encodeURIComponent(`/rest/v1/mueblesitea?id=eq.${selectedItem.id}`),
                {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({ 
                        estatus: 'BAJA', 
                        causadebaja: bajaCause, 
                        fechabaja: today 
                    })
                }
            );
            
            if (!updateResponse.ok) {
                const error = await updateResponse.json();
                throw new Error(error.message || 'Error al dar de baja');
            }

            let createdBy = 'SISTEMA';
            if (user?.firstName && user?.lastName) {
                createdBy = `${user.firstName} ${user.lastName}`;
            }

            const insertResponse = await fetch(
                '/api/supabase-proxy?target=' + encodeURIComponent('/rest/v1/deprecated'),
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        id_inv: selectedItem.id_inv,
                        descripcion: selectedItem.descripcion || '',
                        area: selectedItem.area?.nombre || '',
                        created_by: createdBy,
                        motive: bajaCause
                    })
                }
            );
            
            if (!insertResponse.ok) {
                const error = await insertResponse.json();
                throw new Error(error.message || 'Error al insertar en deprecated');
            }

            await createNotification({
                title: `Artículo dado de baja (ID: ${selectedItem.id_inv})`,
                description: `El artículo "${selectedItem.descripcion}" fue dado de baja. Motivo: ${bajaCause}.`,
                type: 'danger',
                category: 'inventario',
                device: 'web',
                importance: 'high',
                data: { changes: [`Baja de artículo: ${selectedItem.id_inv}`], affectedTables: ['mueblesitea', 'deprecated'] }
            });

            setSelectedItem(null);
            setMessage({ type: 'success', text: 'Artículo dado de baja correctamente' });
        } catch (error) {
            console.error('Error al dar de baja:', error);
            setMessage({ type: 'error', text: 'Error al dar de baja. Por favor, intente nuevamente.' });
            await createNotification({
                title: 'Error al dar de baja artículo',
                description: 'Error al dar de baja el artículo.',
                type: 'danger',
                category: 'inventario',
                device: 'web',
                importance: 'high',
                data: { affectedTables: ['mueblesitea', 'deprecated'] }
            });
        }
    };

    const markAsInactive = async () => {
        if (!selectedItem) return;
        setShowInactiveModal(true);
    };

    const confirmMarkAsInactive = async () => {
        if (!selectedItem) return;
        setShowInactiveModal(false);
        
        try {
            const response = await fetch(
                '/api/supabase-proxy?target=' + encodeURIComponent(`/rest/v1/mueblesitea?id=eq.${selectedItem.id}`),
                {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({ estatus: 'INACTIVO' })
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al marcar como inactivo');
            }

            await createNotification({
                title: `Artículo marcado como INACTIVO (ID: ${selectedItem.id_inv})`,
                description: `El artículo "${selectedItem.descripcion}" fue marcado como INACTIVO por el usuario actual.`,
                type: 'warning',
                category: 'inventario',
                device: 'web',
                importance: 'medium',
                data: { changes: [`Inactivación de artículo: ${selectedItem.id_inv}`], affectedTables: ['mueblesitea'] }
            });

            setSelectedItem(null);
            setMessage({
                type: 'success',
                text: 'Artículo marcado como INACTIVO correctamente'
            });
        } catch (error) {
            console.error('Error al marcar como inactivo:', error);
            setMessage({
                type: 'error',
                text: 'Error al cambiar el estatus. Por favor, intente nuevamente.'
            });
            await createNotification({
                title: 'Error al marcar como INACTIVO',
                description: 'Error al cambiar el estatus del artículo.',
                type: 'danger',
                category: 'inventario',
                device: 'web',
                importance: 'high',
                data: { affectedTables: ['mueblesitea'] }
            });
        }
    };

    return {
        selectedItem,
        setSelectedItem,
        isEditing,
        setIsEditing,
        editFormData,
        setEditFormData,
        imageFile,
        setImageFile,
        imagePreview,
        setImagePreview,
        uploading,
        message,
        setMessage,
        showBajaModal,
        setShowBajaModal,
        bajaCause,
        setBajaCause,
        showInactiveModal,
        setShowInactiveModal,
        handleSelectItem,
        handleStartEdit,
        cancelEdit,
        closeDetail,
        handleImageChange,
        saveChanges,
        handleEditFormChange,
        markAsBaja,
        confirmBaja,
        markAsInactive,
        confirmMarkAsInactive
    };
}
