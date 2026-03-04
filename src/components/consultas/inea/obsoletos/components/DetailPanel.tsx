'use client';

import React, { RefObject } from 'react';
import { 
  ClipboardList, X, Edit, Plus, Calendar, DollarSign, Store, Receipt, 
  Building2, Shield, AlertTriangle, Info, ChevronDown, RotateCw
} from 'lucide-react';
import { Mueble, FilterOptions, Directorio, BajaInfo } from '../types';
import { formatDate } from '../utils';
import CustomSelect from './CustomSelect';
import FieldHistoryIcon from './FieldHistoryIcon';
import { useFieldHistory } from '../hooks/useFieldHistory';
import type { CambioInventario } from '@/types/changeHistory';

interface ImagePreviewProps {
  imagePath: string | null;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ imagePath }) => {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!imagePath) {
        if (isMounted) {
          setLoading(false);
          setError(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError(false);
        }

        const supabase = (await import('@/app/lib/supabase/client')).default;
        const { data, error } = await supabase
          .storage
          .from('muebles.inea')
          .createSignedUrl(imagePath, 3600);

        if (error) throw error;

        const img = new Image();
        img.src = data.signedUrl;

        img.onload = () => {
          if (isMounted) {
            setImageUrl(data.signedUrl);
            setLoading(false);
          }
        };

        img.onerror = () => {
          if (isMounted) {
            setError(true);
            setLoading(false);
          }
        };
      } catch (err) {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
        console.error("Error loading image:", err);
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [imagePath]);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white/[0.02] border border-white/10 rounded-lg">
        <span className="text-white/40 text-sm font-light">Cargando imagen...</span>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white/[0.02] border border-white/10 rounded-lg">
        <span className="text-white/30 text-sm font-light">Imagen no disponible</span>
      </div>
    );
  }

  return (
    <div className="w-full h-64 bg-black border border-white/10 rounded-lg overflow-hidden">
      <img
        src={imageUrl}
        alt="Imagen del bien"
        className="w-full h-full object-contain"
        onError={() => setError(true)}
      />
    </div>
  );
};

interface DetailPanelProps {
  selectedItem: Mueble | null;
  detailRef: RefObject<HTMLDivElement | null>;
  isEditing: boolean;
  editFormData: Mueble | null;
  imagePreview: string | null;
  uploading: boolean;
  isSaving?: boolean;
  filterOptions: FilterOptions;
  directorio: Directorio[];
  bajaInfo: BajaInfo | null;
  bajaInfoLoading: boolean;
  onClose: () => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, field: keyof Mueble) => void;
  onSelectDirector: (nombre: string) => void;
  onStartEdit: () => void;
  onSaveChanges: () => Promise<void>;
  onCancelEdit: () => void;
  onReactivate: () => void;
  isDarkMode: boolean;
  isSyncing?: boolean;
  isGlobalSyncing?: boolean;
  saving?: boolean;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  selectedItem,
  detailRef,
  isEditing,
  editFormData,
  imagePreview,
  uploading,
  isSaving = false,
  filterOptions,
  directorio,
  bajaInfo,
  bajaInfoLoading,
  onClose,
  onImageChange,
  onFormChange,
  onSelectDirector,
  onStartEdit,
  onSaveChanges,
  onCancelEdit,
  onReactivate,
  isDarkMode,
  isSyncing = false,
  isGlobalSyncing = false,
  saving = false
}) => {
  if (!selectedItem) return null;

  // Disable editing if global sync is in progress
  const isDisabled = isGlobalSyncing;

  return (
    <div
      ref={detailRef}
      className={`border rounded-lg overflow-visible flex flex-col flex-shrink-0 w-full h-[150vh] ${
        isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/10'
      }`}
    >
      <div
        className={`border-b px-6 py-4 flex justify-between items-center ${
          isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/10'
        }`}
      >
        <h2
          className={`text-lg font-light tracking-tight flex items-center gap-2 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}
        >
          <ClipboardList
            className={`h-4 w-4 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}
          />
          Detalle del Artículo (BAJA)
        </h2>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          title="Cerrar detalle"
          className={`rounded-lg p-1.5 transition-all ${
            isDarkMode
              ? 'text-white/60 hover:text-white hover:bg-white/5'
              : 'text-black/60 hover:text-black hover:bg-black/5'
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className={`flex-grow p-6 overflow-y-auto ${
        isDarkMode 
          ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30'
          : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20 hover:scrollbar-thumb-black/30'
      }`}>
        {isEditing ? (
          <EditMode
            editFormData={editFormData}
            imagePreview={imagePreview}
            uploading={uploading}
            filterOptions={filterOptions}
            directorio={directorio}
            isDarkMode={isDarkMode}
            isDisabled={isDisabled}
            onImageChange={onImageChange}
            onFormChange={onFormChange}
            onSelectDirector={onSelectDirector}
          />
        ) : (
          <ViewMode
            selectedItem={selectedItem}
            bajaInfo={bajaInfo}
            bajaInfoLoading={bajaInfoLoading}
            isDarkMode={isDarkMode}
            isSyncing={isSyncing}
          />
        )}
      </div>
    </div>
  );
};

// EditMode Component
interface EditModeProps {
  editFormData: Mueble | null;
  imagePreview: string | null;
  uploading: boolean;
  filterOptions: FilterOptions;
  directorio: Directorio[];
  isDarkMode: boolean;
  isDisabled?: boolean;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, field: keyof Mueble) => void;
  onSelectDirector: (nombre: string) => void;
}

function EditMode({
  editFormData,
  imagePreview,
  uploading,
  filterOptions,
  directorio,
  isDarkMode,
  isDisabled = false,
  onImageChange,
  onFormChange,
  onSelectDirector
}: EditModeProps) {
  if (!editFormData) return null;

  return (
    <div className="space-y-6">
      <div className="form-group">
        <label
          className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-3 ${
            isDarkMode ? 'text-white/60' : 'text-black/60'
          }`}
        >
          Imagen del Bien
        </label>

        <div className="flex items-start gap-4">
          <div className="flex-1">
            {imagePreview ? (
              <div className="relative group">
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className={`w-full h-64 object-contain rounded-lg border ${
                    isDarkMode ? 'border-white/10' : 'border-black/10'
                  }`}
                />
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity ${
                    isDarkMode ? 'bg-black/60' : 'bg-white/80'
                  }`}
                >
                  <label
                    className={`cursor-pointer p-2 rounded-lg transition-all ${
                      isDarkMode
                        ? 'bg-white/10 hover:bg-white/20'
                        : 'bg-black/10 hover:bg-black/20'
                    }`}
                  >
                    <Edit
                      className={`h-4 w-4 ${
                        isDarkMode ? 'text-white' : 'text-black'
                      }`}
                    />
                    <input
                      type="file"
                      onChange={onImageChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <ImagePreview imagePath={editFormData?.image_path || null} />
            )}
          </div>

          <div className="flex-shrink-0 w-64 space-y-2">
            <label
              className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                isDarkMode 
                  ? 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]' 
                  : 'border-black/10 hover:border-black/20 hover:bg-black/[0.02]'
              }`}
            >
              <div className="text-center">
                <Plus
                  className={`h-5 w-5 mx-auto mb-1 ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`}
                />
                <span
                  className={`text-xs font-light ${
                    isDarkMode ? 'text-white/60' : 'text-black/60'
                  }`}
                >
                  Cambiar imagen
                </span>
              </div>
              <input
                type="file"
                onChange={onImageChange}
                className="hidden"
                accept="image/*"
              />
            </label>
            <div
              className={`text-xs p-2 rounded-lg border font-light ${
                isDarkMode
                  ? 'text-white/60 bg-white/[0.02] border-white/10'
                  : 'text-black/60 bg-black/[0.02] border-black/10'
              }`}
            >
              <p>Formatos: JPG, PNG, GIF, WebP</p>
              <p>Tamaño máximo: 5MB</p>
              {uploading && <p className={`mt-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>Subiendo imagen...</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Form Fields */}
        <div className="form-group">
          <label
            className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-2 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            ID Inventario
          </label>
          <input
            type="text"
            value={editFormData?.id_inv || ''}
            onChange={(e) => onFormChange(e, 'id_inv')}
            disabled={isDisabled}
            className={`w-full border rounded-lg px-3 py-2 text-sm font-light focus:outline-none transition-all ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.04]'
                : 'bg-black/[0.02] border-black/10 text-black placeholder:text-black/30 focus:border-black/20 focus:bg-black/[0.04]'
            }`}
            placeholder="Ingrese el ID de inventario"
          />
        </div>

        <div className="form-group">
          <label
            className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-2 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            Rubro
          </label>
          <CustomSelect
            value={editFormData?.rubro || ''}
            onChange={(val) => onFormChange({ target: { value: val } } as any, 'rubro')}
            options={(filterOptions.rubros ?? []).map(rubro => ({ value: rubro, label: rubro }))}
            placeholder="Seleccione el rubro"
            isDarkMode={isDarkMode}
            disabled={isDisabled}
          />
        </div>

        <div className="form-group col-span-2">
          <label
            className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-2 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            Descripción
          </label>
          <textarea
            value={editFormData?.descripcion || ''}
            onChange={(e) => onFormChange(e, 'descripcion')}
            disabled={isDisabled}
            className={`w-full border rounded-lg px-3 py-2 text-sm font-light focus:outline-none transition-all resize-none ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.04]'
                : 'bg-black/[0.02] border-black/10 text-black placeholder:text-black/30 focus:border-black/20 focus:bg-black/[0.04]'
            }`}
            rows={3}
            placeholder="Ingrese la descripción"
          />
        </div>

        <div className="form-group">
          <label
            className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-2 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            Valor
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <span className={`text-sm font-light ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>$</span>
            </div>
            <input
              type="text"
              value={editFormData?.valor || ''}
              onChange={(e) => onFormChange(e, 'valor')}
              disabled={isDisabled}
              className={`w-full border rounded-lg pl-8 pr-16 py-2 text-sm font-light focus:outline-none transition-all ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.04]'
                  : 'bg-black/[0.02] border-black/10 text-black placeholder:text-black/30 focus:border-black/20 focus:bg-black/[0.04]'
              }`}
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className={`text-xs font-light ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                MXN
              </span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label
            className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-2 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Fecha de Adquisición
          </label>
          <input
            type="date"
            value={editFormData?.f_adq || ''}
            onChange={(e) => onFormChange(e, 'f_adq')}
            disabled={isDisabled}
            className={`w-full border rounded-lg px-3 py-2 text-sm font-light focus:outline-none transition-all ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10 text-white focus:border-white/20 focus:bg-white/[0.04]'
                : 'bg-black/[0.02] border-black/10 text-black focus:border-black/20 focus:bg-black/[0.04]'
            }`}
          />
        </div>

        <div className="form-group">
          <label
            className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-2 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            Forma de Adquisición
          </label>
          <CustomSelect
            value={editFormData?.formadq || ''}
            onChange={(val) => onFormChange({ target: { value: val } } as any, 'formadq')}
            options={[
              { value: '', label: 'Seleccionar forma de adquisición' },
              ...filterOptions.formadq.map(forma => ({ value: forma, label: forma }))
            ]}
            placeholder="Seleccionar forma de adquisición"
            isDarkMode={isDarkMode}
            disabled={isDisabled}
          />
        </div>

        <div className="form-group">
          <label
            className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-2 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            <Store className="h-3.5 w-3.5" />
            Proveedor
          </label>
          <input
            type="text"
            value={editFormData?.proveedor || ''}
            onChange={(e) => onFormChange(e, 'proveedor')}
            disabled={isDisabled}
            className={`w-full border rounded-lg px-3 py-2 text-sm font-light focus:outline-none transition-all ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.04]'
                : 'bg-black/[0.02] border-black/10 text-black placeholder:text-black/30 focus:border-black/20 focus:bg-black/[0.04]'
            }`}
            placeholder="Nombre del proveedor"
          />
        </div>

        <div className="form-group">
          <label
            className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-2 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            Factura
          </label>
          <input
            type="text"
            value={editFormData?.factura || ''}
            onChange={(e) => onFormChange(e, 'factura')}
            disabled={isDisabled}
            className={`w-full border rounded-lg px-3 py-2 text-sm font-light focus:outline-none transition-all ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.04]'
                : 'bg-black/[0.02] border-black/10 text-black placeholder:text-black/30 focus:border-black/20 focus:bg-black/[0.04]'
            }`}
            placeholder="Número de factura"
          />
        </div>

        <div className="form-group">
          <label
            className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-2 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Estado
          </label>
          <input
            type="text"
            placeholder="Estado"
            value={editFormData?.ubicacion_es || ''}
            onChange={(e) => onFormChange(e, 'ubicacion_es')}
            disabled={isDisabled}
            className={`w-full border rounded-lg px-3 py-2 text-sm font-light focus:outline-none transition-all ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.04]'
                : 'bg-black/[0.02] border-black/10 text-black placeholder:text-black/30 focus:border-black/20 focus:bg-black/[0.04]'
            }`}
          />
        </div>

        <div className="form-group">
          <label
            className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-2 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Municipio
          </label>
          <input
            type="text"
            placeholder="Municipio"
            value={editFormData?.ubicacion_mu || ''}
            onChange={(e) => onFormChange(e, 'ubicacion_mu')}
            disabled={isDisabled}
            className={`w-full border rounded-lg px-3 py-2 text-sm font-light focus:outline-none transition-all ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.04]'
                : 'bg-black/[0.02] border-black/10 text-black placeholder:text-black/30 focus:border-black/20 focus:bg-black/[0.04]'
            }`}
          />
        </div>

        <div className="form-group">
          <label
            className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-2 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Nomenclatura
          </label>
          <input
            type="text"
            placeholder="Nomenclatura"
            value={editFormData?.ubicacion_no || ''}
            onChange={(e) => onFormChange(e, 'ubicacion_no')}
            disabled={isDisabled}
            className={`w-full border rounded-lg px-3 py-2 text-sm font-light focus:outline-none transition-all ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.04]'
                : 'bg-black/[0.02] border-black/10 text-black placeholder:text-black/30 focus:border-black/20 focus:bg-black/[0.04]'
            }`}
          />
        </div>

        <div className="form-group">
          <label
            className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-2 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            Estado Físico
          </label>
          <CustomSelect
            value={editFormData?.estado || ''}
            onChange={(val) => onFormChange({ target: { value: val } } as any, 'estado')}
            options={[
              { value: '', label: 'Seleccione un estado' },
              ...filterOptions.estados.map(estado => ({ value: estado, label: estado }))
            ]}
            placeholder="Seleccione un estado"
            isDarkMode={isDarkMode}
            disabled={isDisabled}
          />
        </div>

        <div className="form-group">
          <label
            className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-2 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            Área
          </label>
          <input
            type="text"
            value={editFormData?.area?.nombre || ''}
            readOnly
            className={`w-full border rounded-lg px-3 py-2 text-sm font-light cursor-not-allowed ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10 text-white/40'
                : 'bg-black/[0.02] border-black/10 text-black/40'
            }`}
          />
        </div>

        <div className="form-group">
          <label
            className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-2 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            Director/Jefe de Área
          </label>
          <CustomSelect
            value={
              typeof editFormData?.directorio === 'object' && editFormData?.directorio !== null 
                ? editFormData.directorio.nombre 
                : (editFormData?.usufinal || '')
            }
            onChange={(val) => onSelectDirector(val)}
            options={[
              { value: '', label: 'Seleccionar Director/Jefe' },
              ...directorio.map(dir => ({ value: dir.nombre || '', label: dir.nombre || '' }))
            ]}
            placeholder="Seleccionar Director/Jefe"
            isDarkMode={isDarkMode}
            disabled={isDisabled}
          />
        </div>


      </div>
    </div>
  );
}

// ViewMode Component
interface ViewModeProps {
  selectedItem: Mueble;
  bajaInfo: BajaInfo | null;
  bajaInfoLoading: boolean;
  isDarkMode: boolean;
  isSyncing?: boolean;
}

function ViewMode({
  selectedItem,
  bajaInfo,
  bajaInfoLoading,
  isDarkMode,
  isSyncing = false
}: ViewModeProps) {
  // Load field history INSIDE ViewMode component
  const { fieldsWithHistory, fieldHistory, loading: historyLoading } = useFieldHistory(selectedItem?.id || null, 'muebles');

  return (
    <div className="space-y-6">
      {/* Image Section */}
      <div
        className={`rounded-lg p-4 transition-all border ${
          isDarkMode
            ? 'bg-white/[0.02] hover:bg-white/[0.04] border-white/10'
            : 'bg-black/[0.02] hover:bg-black/[0.04] border-black/10'
        }`}
      >
        <h3
          className={`text-xs font-medium uppercase tracking-wider mb-3 ${
            isDarkMode ? 'text-white/60' : 'text-black/60'
          }`}
        >
          Fotografía del Bien
        </h3>
        <ImagePreview imagePath={selectedItem.image_path ?? null} />
      </div>

      {/* Baja Information */}
      {selectedItem.fechabaja && (
        <div className={`rounded-lg p-4 transition-all border ${
          isDarkMode
            ? 'bg-red-500/[0.08] border-red-500/30'
            : 'bg-red-500/[0.08] border-red-500/30'
        }`}>
          <h3 className={`text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-2 ${
            isDarkMode ? 'text-red-400' : 'text-red-600'
          }`}>
            <AlertTriangle className="h-3.5 w-3.5" />
            Información de Baja
          </h3>
          <div className="space-y-2">
            <div className={`flex items-center gap-2 text-sm font-light ${
              isDarkMode ? 'text-white/90' : 'text-black/90'
            }`}>
              <Calendar className="h-3.5 w-3.5" />
              <span>Fecha: {formatDate(selectedItem.fechabaja)}</span>
            </div>
            <div className={`flex items-center gap-2 text-sm font-light ${
              isDarkMode ? 'text-white/90' : 'text-black/90'
            }`}>
              <Info className="h-3.5 w-3.5" />
              <span>Causa: {selectedItem.causadebaja || 'No especificada'}</span>
            </div>
            {bajaInfoLoading ? (
              <div className={`text-xs font-light ${
                isDarkMode ? 'text-white/60' : 'text-black/60'
              }`}>Cargando información adicional...</div>
            ) : bajaInfo ? (
              <>
                <div className={`flex items-center gap-2 text-sm font-light ${
                  isDarkMode ? 'text-white/90' : 'text-black/90'
                }`}>
                  <Info className="h-3.5 w-3.5" />
                  <span>Registrado por: {bajaInfo.created_by}</span>
                </div>
                <div className={`flex items-center gap-2 text-sm font-light ${
                  isDarkMode ? 'text-white/90' : 'text-black/90'
                }`}>
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Fecha de registro: {formatDate(bajaInfo.created_at)}</span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DetailCard label="ID Inventario" value={selectedItem.id_inv} isDarkMode={isDarkMode} idMueble={selectedItem.id} fieldName="id_inv" hasHistory={fieldsWithHistory['id_inv']} fieldHistory={fieldHistory} isSyncing={isSyncing} />
        <DetailCard label="Rubro" value={selectedItem.rubro || 'No especificado'} isDarkMode={isDarkMode} idMueble={selectedItem.id} fieldName="rubro" hasHistory={fieldsWithHistory['rubro']} fieldHistory={fieldHistory} isSyncing={isSyncing} />
        <DetailCard label="Descripción" value={selectedItem.descripcion || 'No especificado'} isDarkMode={isDarkMode} colSpan2 idMueble={selectedItem.id} fieldName="descripcion" hasHistory={fieldsWithHistory['descripcion']} fieldHistory={fieldHistory} isSyncing={isSyncing} />
        <DetailCard 
          label="Valor" 
          value={selectedItem.valor ? `$${parseFloat(String(selectedItem.valor)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'} 
          isDarkMode={isDarkMode}
          idMueble={selectedItem.id}
          fieldName="valor"
          hasHistory={fieldsWithHistory['valor']}
          fieldHistory={fieldHistory}
          isSyncing={isSyncing} 
        />
        <DetailCard label="Fecha de Adquisición" value={formatDate(selectedItem.f_adq) || 'No especificado'} isDarkMode={isDarkMode} idMueble={selectedItem.id} fieldName="f_adq" hasHistory={fieldsWithHistory['f_adq']} fieldHistory={fieldHistory} isSyncing={isSyncing} />
        <DetailCard label="Forma de Adquisición" value={selectedItem.formadq || 'No especificado'} isDarkMode={isDarkMode} idMueble={selectedItem.id} fieldName="formadq" hasHistory={fieldsWithHistory['formadq']} fieldHistory={fieldHistory} isSyncing={isSyncing} />
        <DetailCard label="Proveedor" value={selectedItem.proveedor || 'No especificado'} isDarkMode={isDarkMode} idMueble={selectedItem.id} fieldName="proveedor" hasHistory={fieldsWithHistory['proveedor']} fieldHistory={fieldHistory} isSyncing={isSyncing} />
        <DetailCard label="Factura" value={selectedItem.factura || 'No especificado'} isDarkMode={isDarkMode} idMueble={selectedItem.id} fieldName="factura" hasHistory={fieldsWithHistory['factura']} fieldHistory={fieldHistory} isSyncing={isSyncing} />
        <DetailCard label="Estado Físico" value={selectedItem.estado || 'No especificado'} isDarkMode={isDarkMode} idMueble={selectedItem.id} fieldName="estado" hasHistory={fieldsWithHistory['estado']} fieldHistory={fieldHistory} isSyncing={isSyncing} />
        <DetailCard label="Estado (Ubicación)" value={selectedItem.ubicacion_es || 'No especificado'} isDarkMode={isDarkMode} idMueble={selectedItem.id} fieldName="ubicacion_es" hasHistory={fieldsWithHistory['ubicacion_es']} fieldHistory={fieldHistory} isSyncing={isSyncing} />
        <DetailCard label="Municipio" value={selectedItem.ubicacion_mu || 'No especificado'} isDarkMode={isDarkMode} idMueble={selectedItem.id} fieldName="ubicacion_mu" hasHistory={fieldsWithHistory['ubicacion_mu']} fieldHistory={fieldHistory} isSyncing={isSyncing} />
        <DetailCard label="Nomenclatura" value={selectedItem.ubicacion_no || 'No especificado'} isDarkMode={isDarkMode} idMueble={selectedItem.id} fieldName="ubicacion_no" hasHistory={fieldsWithHistory['ubicacion_no']} fieldHistory={fieldHistory} isSyncing={isSyncing} />
        <DetailCard label="Área" value={isSyncing ? null : (selectedItem.area?.nombre || 'No especificado')} isDarkMode={isDarkMode} isSyncing={isSyncing} idMueble={selectedItem.id} fieldName="id_area" hasHistory={fieldsWithHistory['id_area']} fieldHistory={fieldHistory} />
        <DetailCard label="Director/Jefe de Área" value={isSyncing ? null : (selectedItem.directorio?.nombre || selectedItem.usufinal || 'No especificado')} isDarkMode={isDarkMode} isSyncing={isSyncing} idMueble={selectedItem.id} fieldName="id_directorio" hasHistory={fieldsWithHistory['id_directorio']} fieldHistory={fieldHistory} />
      </div>
    </div>
  );
}

// DetailCard Component
interface DetailCardProps {
  label: string;
  value: string | null;
  isDarkMode: boolean;
  colSpan2?: boolean;
  isSyncing?: boolean;
  idMueble?: string;
  fieldName?: string;
  hasHistory?: boolean;
  fieldHistory?: Record<string, CambioInventario[]>;
}

function DetailCard({ 
  label, 
  value, 
  isDarkMode, 
  colSpan2 = false, 
  isSyncing = false,
  idMueble,
  fieldName,
  hasHistory = false,
  fieldHistory
}: DetailCardProps) {
  const history = fieldName && fieldHistory && fieldHistory[fieldName] ? fieldHistory[fieldName] : [];

  return (
    <div
      className={`rounded-lg p-4 transition-all border ${
        colSpan2 ? 'col-span-2' : ''
      } ${
        isDarkMode
          ? 'bg-white/[0.02] hover:bg-white/[0.04] border-white/10'
          : 'bg-black/[0.02] hover:bg-black/[0.04] border-black/10'
      }`}
    >
      <h3
        className={`text-xs font-medium uppercase tracking-wider mb-2 flex items-center justify-between ${
          isDarkMode ? 'text-white/60' : 'text-black/60'
        }`}
      >
        <span>{label}</span>
        {hasHistory && history.length > 0 && (
          <FieldHistoryIcon fieldHistory={history} isDarkMode={isDarkMode} />
        )}
      </h3>
      {isSyncing ? (
        <div className={`h-5 rounded animate-pulse ${
          isDarkMode ? 'bg-white/10' : 'bg-black/10'
        }`} style={{ width: '60%' }} />
      ) : (
        <p
          className={`text-sm font-light ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}
        >
          {value || 'No especificado'}
        </p>
      )}
    </div>
  );
}
