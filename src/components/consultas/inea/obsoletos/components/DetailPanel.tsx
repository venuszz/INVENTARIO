'use client';

import React, { RefObject } from 'react';
import { 
  ClipboardList, X, Edit, Plus, Calendar, DollarSign, Store, Receipt, 
  Building2, Shield, AlertTriangle, Info, ChevronDown, RotateCw
} from 'lucide-react';
import { Mueble, FilterOptions, Directorio, BajaInfo } from '../types';
import { formatDate } from '../utils';

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
      <div className="w-full h-64 flex items-center justify-center bg-white/5 rounded-lg">
        <span className="text-white/40">Cargando imagen...</span>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white/5 rounded-lg">
        <span className="text-white/30">Imagen no disponible</span>
      </div>
    );
  }

  return (
    <div className="w-full h-64 bg-black rounded-lg overflow-hidden">
      <img
        src={imageUrl}
        alt="Imagen del bien"
        className="w-full h-full object-cover"
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
  saving?: boolean;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  selectedItem,
  detailRef,
  isEditing,
  editFormData,
  imagePreview,
  uploading,
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
  saving = false
}) => {
  if (!selectedItem) return null;

  return (
    <div
      ref={detailRef}
      className={`border rounded-lg overflow-visible flex flex-col flex-shrink-0 w-full h-[600px] ${
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
              className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all p-4 ${
                isDarkMode
                  ? 'border-white/10 hover:border-white/20'
                  : 'border-black/10 hover:border-black/20'
              }`}
            >
              <div className="text-center">
                <Plus
                  className={`h-6 w-6 mx-auto mb-1 ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                  }`}
                />
                <span
                  className={`text-xs ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
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
              className={`text-xs p-2 rounded-lg ${
                isDarkMode
                  ? 'text-white/40 bg-white/[0.02]'
                  : 'text-black/40 bg-black/[0.02]'
              }`}
            >
              <p>Formatos: JPG, PNG, GIF, WebP</p>
              <p>Tamaño máximo: 5MB</p>
              {uploading && (
                <p className="text-red-400 mt-1">Subiendo imagen...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Form Fields */}
        <div className="form-group">
          <label
            className={`text-xs font-medium uppercase tracking-wider mb-2 block ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            ID Inventario
          </label>
          <input
            type="text"
            value={editFormData?.id_inv || ''}
            onChange={(e) => onFormChange(e, 'id_inv')}
            className={`w-full border rounded-lg px-4 py-2.5 text-sm transition-all ${
              isDarkMode
                ? 'bg-black border-white/10 text-white placeholder-white/40 focus:border-white/20'
                : 'bg-white border-black/10 text-black placeholder-black/40 focus:border-black/20'
            }`}
            placeholder="Ingrese el ID de inventario"
          />
        </div>

        <div className="form-group">
          <label
            className={`text-xs font-medium uppercase tracking-wider mb-2 block ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            Rubro
          </label>
          <select
            value={editFormData?.rubro || ''}
            onChange={(e) => onFormChange(e, 'rubro')}
            className={`w-full border rounded-lg px-4 py-2.5 text-sm transition-all ${
              isDarkMode
                ? 'bg-black border-white/10 text-white focus:border-white/20'
                : 'bg-white border-black/10 text-black focus:border-black/20'
            }`}
          >
            {filterOptions.rubros.map((rubro) => (
              <option key={rubro} value={rubro}>
                {rubro}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group col-span-2">
          <label
            className={`text-xs font-medium uppercase tracking-wider mb-2 block ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            Descripción
          </label>
          <textarea
            value={editFormData?.descripcion || ''}
            onChange={(e) => onFormChange(e, 'descripcion')}
            className={`w-full border rounded-lg px-4 py-2.5 text-sm transition-all ${
              isDarkMode
                ? 'bg-black border-white/10 text-white placeholder-white/40 focus:border-white/20'
                : 'bg-white border-black/10 text-black placeholder-black/40 focus:border-black/20'
            }`}
            rows={3}
            placeholder="Ingrese la descripción"
          />
        </div>

        <div className="form-group">
          <label
            className={`text-xs font-medium uppercase tracking-wider mb-2 block ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            Valor
          </label>
          <div className="relative">
            <span
              className={`absolute inset-y-0 left-0 flex items-center pl-3 text-sm ${
                isDarkMode ? 'text-white/40' : 'text-black/40'
              }`}
            >
              $
            </span>
            <input
              type="number"
              value={editFormData?.valor || 0}
              onChange={(e) => onFormChange(e, 'valor')}
              className={`w-full border rounded-lg pl-8 pr-4 py-2.5 text-sm transition-all ${
                isDarkMode
                  ? 'bg-black border-white/10 text-white placeholder-white/40 focus:border-white/20'
                  : 'bg-white border-black/10 text-black placeholder-black/40 focus:border-black/20'
              }`}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="form-group">
          <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Fecha de Adquisición</label>
          <div className="relative">
            <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              type="date"
              value={editFormData?.f_adq || ''}
              onChange={(e) => onFormChange(e, 'f_adq')}
              className={`w-full border rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white focus:ring-white/50'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
              }`}
            />
          </div>
        </div>

        <div className="form-group">
          <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Forma de Adquisición</label>
          <div className="relative">
            <select
              value={editFormData?.formadq || ''}
              onChange={(e) => onFormChange(e, 'formadq')}
              className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white focus:ring-white/50'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
              }`}
            >
              <option value="">Seleccionar forma de adquisición</option>
              {filterOptions.formadq.map((forma) => (
                <option key={forma} value={forma}>{forma}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Proveedor</label>
          <div className="relative">
            <Store className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              type="text"
              value={editFormData?.proveedor || ''}
              onChange={(e) => onFormChange(e, 'proveedor')}
              className={`w-full border rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-white/50'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500'
              }`}
              placeholder="Nombre del proveedor"
            />
          </div>
        </div>

        <div className="form-group">
          <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Factura</label>
          <div className="relative">
            <Receipt className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              type="text"
              value={editFormData?.factura || ''}
              onChange={(e) => onFormChange(e, 'factura')}
              className={`w-full border rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-white/50'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500'
              }`}
              placeholder="Número de factura"
            />
          </div>
        </div>

        <div className="form-group">
          <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Estado</label>
          <div className="relative">
            <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Estado"
              value={editFormData?.ubicacion_es || ''}
              onChange={(e) => onFormChange(e, 'ubicacion_es')}
              className={`w-full border rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-white/50'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500'
              }`}
            />
          </div>
        </div>

        <div className="form-group">
          <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Municipio</label>
          <input
            type="text"
            placeholder="Municipio"
            value={editFormData?.ubicacion_mu || ''}
            onChange={(e) => onFormChange(e, 'ubicacion_mu')}
            className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-white/50'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500'
            }`}
          />
        </div>

        <div className="form-group">
          <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Nomenclatura</label>
          <input
            type="text"
            placeholder="Nomenclatura"
            value={editFormData?.ubicacion_no || ''}
            onChange={(e) => onFormChange(e, 'ubicacion_no')}
            className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-white/50'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500'
            }`}
          />
        </div>

        <div className="form-group">
          <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Estado Físico</label>
          <div className="relative">
            <select
              value={editFormData?.estado || ''}
              onChange={(e) => onFormChange(e, 'estado')}
              className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white focus:ring-white/50'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
              }`}
            >
              <option value="">Seleccione un estado</option>
              {filterOptions.estados.map((estado) => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Área</label>
          <input
            type="text"
            value={editFormData?.area?.nombre || ''}
            readOnly
            className={`w-full border rounded-lg px-4 py-2.5 cursor-not-allowed ${
              isDarkMode
                ? 'bg-gray-900 border-gray-700 text-gray-500'
                : 'bg-gray-100 border-gray-300 text-gray-500'
            }`}
          />
        </div>

        <div className="form-group">
          <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Director/Jefe de Área</label>
          <div className="relative">
            <select
              value={editFormData?.usufinal || ''}
              onChange={(e) => onSelectDirector(e.target.value)}
              className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white focus:ring-white/50'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
              }`}
            >
              <option value="">Seleccionar Director/Jefe</option>
              {directorio.map((dir) => (
                <option key={dir.id_directorio} value={dir.nombre}>{dir.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            <Shield className="h-4 w-4" />
            Resguardante
          </label>
          <input
            type="text"
            value={editFormData?.resguardante || ''}
            onChange={(e) => onFormChange(e, 'resguardante')}
            className={`w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-white/50'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500'
            }`}
            placeholder="Ingrese el resguardante"
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
        <DetailCard label="ID Inventario" value={selectedItem.id_inv} isDarkMode={isDarkMode} />
        <DetailCard label="Rubro" value={selectedItem.rubro || 'No especificado'} isDarkMode={isDarkMode} />
        <DetailCard label="Descripción" value={selectedItem.descripcion || 'No especificado'} isDarkMode={isDarkMode} colSpan2 />
        <DetailCard 
          label="Valor" 
          value={selectedItem.valor ? `$${parseFloat(String(selectedItem.valor)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'} 
          isDarkMode={isDarkMode} 
        />
        <DetailCard label="Fecha de Adquisición" value={formatDate(selectedItem.f_adq) || 'No especificado'} isDarkMode={isDarkMode} />
        <DetailCard label="Forma de Adquisición" value={selectedItem.formadq || 'No especificado'} isDarkMode={isDarkMode} />
        <DetailCard label="Proveedor" value={selectedItem.proveedor || 'No especificado'} isDarkMode={isDarkMode} />
        <DetailCard label="Factura" value={selectedItem.factura || 'No especificado'} isDarkMode={isDarkMode} />
        <DetailCard label="Estado Físico" value={selectedItem.estado || 'No especificado'} isDarkMode={isDarkMode} />
        <DetailCard label="Estado (Ubicación)" value={selectedItem.ubicacion_es || 'No especificado'} isDarkMode={isDarkMode} />
        <DetailCard label="Municipio" value={selectedItem.ubicacion_mu || 'No especificado'} isDarkMode={isDarkMode} />
        <DetailCard label="Nomenclatura" value={selectedItem.ubicacion_no || 'No especificado'} isDarkMode={isDarkMode} />
        <DetailCard label="Estatus" value={selectedItem.estatus || 'No especificado'} isDarkMode={isDarkMode} />
        <DetailCard label="Área" value={isSyncing ? null : (selectedItem.area?.nombre || 'No especificado')} isDarkMode={isDarkMode} isSyncing={isSyncing} />
        <DetailCard label="Director/Jefe de Área" value={isSyncing ? null : (selectedItem.usufinal || 'No especificado')} isDarkMode={isDarkMode} isSyncing={isSyncing} />
        <DetailCard label="Resguardante" value={selectedItem.resguardante || 'No especificado'} isDarkMode={isDarkMode} />
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
}

function DetailCard({ label, value, isDarkMode, colSpan2 = false, isSyncing = false }: DetailCardProps) {
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
        className={`text-xs font-medium uppercase tracking-wider mb-2 ${
          isDarkMode ? 'text-white/60' : 'text-black/60'
        }`}
      >
        {label}
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
