import React, { RefObject } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { 
  Archive, X, Edit, Plus, Calendar, DollarSign, Store, Receipt, 
  Building2, Shield, Save, XCircle, AlertTriangle, Info, Trash2 
} from 'lucide-react';
import ImagePreview from './ImagePreview';
import CustomSelect from './CustomSelect';
import { Mueble, FilterOptions, Directorio, ResguardoDetalle } from '../types';
import { formatDate } from '../utils';

/**
 * DetailPanel Component
 * 
 * Displays detailed information about a selected inventory item.
 * Supports both view mode and edit mode with form inputs.
 * Integrates with modals for area selection, director info, baja, and inactive operations.
 */

interface DetailPanelProps {
  selectedItem: Mueble | null;
  detailRef: RefObject<HTMLDivElement | null>;
  isEditing: boolean;
  editFormData: Mueble | null;
  imagePreview: string | null;
  uploading: boolean;
  filterOptions: FilterOptions;
  directorio: Directorio[];
  foliosResguardo: Record<string, string>;
  resguardoDetalles: Record<string, ResguardoDetalle>;
  onClose: () => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, field: keyof Mueble) => void;
  onSelectDirector: (idDirectorio: number) => void;
  isSyncing?: boolean;
}

export default function DetailPanel({
  selectedItem,
  detailRef,
  isEditing,
  editFormData,
  imagePreview,
  uploading,
  filterOptions,
  directorio,
  foliosResguardo,
  resguardoDetalles,
  onClose,
  onImageChange,
  onFormChange,
  onSelectDirector,
  isSyncing = false
}: DetailPanelProps) {
  const { isDarkMode } = useTheme();

  if (!selectedItem) return null;

  return (
    <div
      ref={detailRef}
      className={`border rounded-lg overflow-visible flex flex-col flex-shrink-0 w-full h-[600px] ${
        isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/10'
      }`}
    >
      {/* Header - Fixed at top */}
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
          <Archive
            className={`h-4 w-4 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}
          />
          Detalle del Bien
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

      {/* Scrollable Content */}
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
            foliosResguardo={foliosResguardo}
            resguardoDetalles={resguardoDetalles}
            isDarkMode={isDarkMode}
            isSyncing={isSyncing}
          />
        )}
      </div>
    </div>
  );
}

/**
 * EditMode Component
 * Renders the edit form for modifying inventory item details
 */
interface EditModeProps {
  editFormData: Mueble | null;
  imagePreview: string | null;
  uploading: boolean;
  filterOptions: FilterOptions;
  directorio: Directorio[];
  isDarkMode: boolean;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, field: keyof Mueble) => void;
  onSelectDirector: (idDirectorio: number) => void;
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
      {/* Image Section */}
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
                        id="image-upload"
                        aria-label="Seleccionar nueva imagen"
                        title="Seleccionar nueva imagen"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <ImagePreview imagePath={editFormData?.image_path || null} isDarkMode={isDarkMode} />
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

      {/* Form Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ID Inventario */}
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
            className={`w-full border rounded-lg px-3 py-2 text-sm font-light focus:outline-none transition-all ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.04]'
                : 'bg-black/[0.02] border-black/10 text-black placeholder:text-black/30 focus:border-black/20 focus:bg-black/[0.04]'
            }`}
            placeholder="Ingrese el ID de inventario"
          />
        </div>

        {/* Rubro */}
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
          />
        </div>

        {/* Descripción */}
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
            className={`w-full border rounded-lg px-3 py-2 text-sm font-light focus:outline-none transition-all resize-none ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.04]'
                : 'bg-black/[0.02] border-black/10 text-black placeholder:text-black/30 focus:border-black/20 focus:bg-black/[0.04]'
            }`}
            rows={3}
            placeholder="Ingrese la descripción"
          />
        </div>

        {/* Estado */}
        <div className="form-group">
          <label
            className={`block text-xs font-medium uppercase tracking-wider mb-2 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            Estado
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
          />
        </div>

        {/* Valor */}
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
              type="number"
              value={editFormData?.valor || 0}
              onChange={(e) => onFormChange(e, 'valor')}
              className={`w-full border rounded-lg pl-8 pr-16 py-2 text-sm font-light focus:outline-none transition-all ${
                isDarkMode
                  ? 'bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.04]'
                  : 'bg-black/[0.02] border-black/10 text-black placeholder:text-black/30 focus:border-black/20 focus:bg-black/[0.04]'
              }`}
              title="Ingrese el valor"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className={`text-xs font-light ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                MXN
              </span>
            </div>
          </div>
        </div>

        {/* Fecha de Adquisición */}
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
            className={`w-full border rounded-lg px-3 py-2 text-sm font-light focus:outline-none transition-all ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10 text-white focus:border-white/20 focus:bg-white/[0.04]'
                : 'bg-black/[0.02] border-black/10 text-black focus:border-black/20 focus:bg-black/[0.04]'
            }`}
            title="Seleccione la fecha de adquisición"
          />
        </div>

        {/* Forma de Adquisición */}
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
              ...(filterOptions.formadq ?? []).map(forma => ({ value: forma, label: forma }))
            ]}
            placeholder="Seleccionar forma de adquisición"
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Proveedor */}
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
            className={`w-full border rounded-lg px-3 py-2 text-sm font-light focus:outline-none transition-all ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.04]'
                : 'bg-black/[0.02] border-black/10 text-black placeholder:text-black/30 focus:border-black/20 focus:bg-black/[0.04]'
            }`}
            title="Ingrese el nombre del proveedor"
            placeholder="Nombre del proveedor"
          />
        </div>

        {/* Factura */}
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
            className={`w-full border rounded-lg px-3 py-2 text-sm font-light focus:outline-none transition-all ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.04]'
                : 'bg-black/[0.02] border-black/10 text-black placeholder:text-black/30 focus:border-black/20 focus:bg-black/[0.04]'
            }`}
            title="Ingrese el número de factura"
            placeholder="Número de factura"
          />
        </div>

        {/* Estado (ubicacion_es) */}
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
            title="Estado"
            placeholder="Estado"
            value={editFormData?.ubicacion_es || ''}
            onChange={(e) => onFormChange(e, 'ubicacion_es')}
            className={`w-full border rounded-lg px-3 py-2 text-sm font-light focus:outline-none transition-all ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.04]'
                : 'bg-black/[0.02] border-black/10 text-black placeholder:text-black/30 focus:border-black/20 focus:bg-black/[0.04]'
            }`}
          />
        </div>

        {/* Municipio */}
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
            title="Municipio"
            placeholder="Municipio"
            value={editFormData?.ubicacion_mu || ''}
            onChange={(e) => onFormChange(e, 'ubicacion_mu')}
            className={`w-full border rounded-lg px-3 py-2 text-sm font-light focus:outline-none transition-all ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.04]'
                : 'bg-black/[0.02] border-black/10 text-black placeholder:text-black/30 focus:border-black/20 focus:bg-black/[0.04]'
            }`}
          />
        </div>

        {/* Nomenclatura */}
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
            title="Nomenclatura"
            placeholder="Nomenclatura"
            value={editFormData?.ubicacion_no || ''}
            onChange={(e) => onFormChange(e, 'ubicacion_no')}
            className={`w-full border rounded-lg px-3 py-2 text-sm font-light focus:outline-none transition-all ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.04]'
                : 'bg-black/[0.02] border-black/10 text-black placeholder:text-black/30 focus:border-black/20 focus:bg-black/[0.04]'
            }`}
          />
        </div>

        {/* Estatus */}
        <div className="form-group">
          <label
            className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-2 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            Estatus
          </label>
          <CustomSelect
            value={editFormData?.estatus || ''}
            onChange={(val) => onFormChange({ target: { value: val } } as any, 'estatus')}
            options={filterOptions.estatus.map(status => ({ value: status, label: status }))}
            placeholder="Seleccione el estatus"
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Área (read-only) */}
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
                ? 'bg-white/[0.01] border-white/10 text-white/50'
                : 'bg-black/[0.01] border-black/10 text-black/50'
            }`}
            aria-label="Área (se autocompleta al seleccionar un director/jefe)"
          />
        </div>

        {/* Director/Jefe de Área */}
        <div className="form-group">
          <label
            className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-2 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            Director/Jefe de Área
          </label>
          <CustomSelect
            value={editFormData?.id_directorio || ''}
            onChange={(val) => onSelectDirector(Number(val))}
            options={[
              { value: '', label: 'Seleccionar Director/Jefe' },
              ...directorio.map(dir => ({ value: dir.id_directorio, label: dir.nombre }))
            ]}
            placeholder="Seleccionar Director/Jefe"
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Usuario Final */}
        <div className="form-group">
          <label
            className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-2 ${
              isDarkMode ? 'text-white/60' : 'text-black/60'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            Usuario Final
          </label>
          <input
            type="text"
            value={editFormData?.resguardante || ''}
            onChange={(e) => onFormChange(e, 'resguardante')}
            className={`w-full border rounded-lg px-3 py-2 text-sm font-light focus:outline-none transition-all ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/10 text-white placeholder:text-white/30 focus:border-white/20 focus:bg-white/[0.04]'
                : 'bg-black/[0.02] border-black/10 text-black placeholder:text-black/30 focus:border-black/20 focus:bg-black/[0.04]'
            }`}
            title="Ingrese el Usuario Final"
            placeholder="Ingrese el Usuario Final"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * ViewMode Component
 * Renders the read-only view of inventory item details
 */
interface ViewModeProps {
  selectedItem: Mueble;
  foliosResguardo: Record<string, string>;
  resguardoDetalles: Record<string, ResguardoDetalle>;
  isDarkMode: boolean;
  isSyncing?: boolean;
}

function ViewMode({
  selectedItem,
  foliosResguardo,
  resguardoDetalles,
  isDarkMode,
  isSyncing = false
}: ViewModeProps) {
  const folio = selectedItem?.id_inv ? (foliosResguardo[selectedItem.id_inv] || null) : null;
  const detalleResguardo = folio ? resguardoDetalles[folio] : undefined;

  function FieldSkeleton() {
    return (
      <div className={`h-5 rounded animate-pulse ${
        isDarkMode ? 'bg-white/10' : 'bg-black/10'
      }`} style={{ width: '60%' }} />
    );
  }

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
        <ImagePreview imagePath={selectedItem.image_path ?? null} isDarkMode={isDarkMode} />
      </div>

      {/* Resguardo Info */}
      {folio && detalleResguardo ? (
        <div className={`flex flex-wrap items-center gap-2 rounded-lg px-4 py-3 mb-4 text-xs font-light border ${
          isDarkMode
            ? 'bg-white/[0.04] border-white/20 text-white'
            : 'bg-black/[0.04] border-black/20 text-black'
        }`}>
          <span className="font-medium">Folio:</span>
          <span className="truncate">{detalleResguardo.folio}</span>
          <span className={isDarkMode ? 'text-white/40' : 'text-black/40'}>•</span>
          <span className="font-medium">Fecha:</span>
          <span className="truncate">{formatDate(detalleResguardo.f_resguardo)}</span>
          <span className={isDarkMode ? 'text-white/40' : 'text-black/40'}>•</span>
          <span className="font-medium">Área:</span>
          <span className="truncate">{detalleResguardo.area_resguardo}</span>
          <span className={isDarkMode ? 'text-white/40' : 'text-black/40'}>•</span>
          <span className="font-medium">Director:</span>
          <span className="truncate">{detalleResguardo.dir_area}</span>
        </div>
      ) : (
        <div
          className={`flex items-center gap-2 border rounded-lg px-4 py-3 mb-4 text-xs font-light ${
            isDarkMode
              ? 'bg-white/[0.02] border-white/10 text-white/60'
              : 'bg-black/[0.02] border-black/10 text-black/60'
          }`}
        >
          <XCircle className="h-3.5 w-3.5" />
          Sin resguardo asignado
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <DetailCard label="ID Inventario" value={selectedItem.id_inv} isDarkMode={isDarkMode} />
        <DetailCard
          label="Rubro"
          value={selectedItem.rubro || 'No especificado'}
          isDarkMode={isDarkMode}
        />
        <DetailCard
          label="Descripción"
          value={selectedItem.descripcion || 'No especificado'}
          isDarkMode={isDarkMode}
          colSpan2
        />
        <DetailCard
          label="Valor"
          value={
            selectedItem.valor
              ? `${parseFloat(selectedItem.valor).toLocaleString('es-MX', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}`
              : '$0.00'
          }
          isDarkMode={isDarkMode}
        />
        <DetailCard
          label="Fecha de Adquisición"
          value={formatDate(selectedItem.f_adq) || 'No especificado'}
          isDarkMode={isDarkMode}
        />
        <DetailCard
          label="Forma de Adquisición"
          value={selectedItem.formadq || 'No especificado'}
          isDarkMode={isDarkMode}
        />
        <DetailCard
          label="Proveedor"
          value={selectedItem.proveedor || 'No especificado'}
          isDarkMode={isDarkMode}
        />
        <DetailCard
          label="Factura"
          value={selectedItem.factura || 'No especificado'}
          isDarkMode={isDarkMode}
        />
        <DetailCard
          label="Estado"
          value={selectedItem.estado || 'No especificado'}
          isDarkMode={isDarkMode}
        />
        <DetailCard
          label="Estado"
          value={selectedItem.ubicacion_es || 'No especificado'}
          isDarkMode={isDarkMode}
        />
        <DetailCard
          label="Municipio"
          value={selectedItem.ubicacion_mu || 'No especificado'}
          isDarkMode={isDarkMode}
        />
        <DetailCard
          label="Nomenclatura"
          value={selectedItem.ubicacion_no || 'No especificado'}
          isDarkMode={isDarkMode}
        />
        <DetailCard
          label="Estatus"
          value={selectedItem.estatus || 'No especificado'}
          isDarkMode={isDarkMode}
        />
        <DetailCard
          label="Área"
          value={selectedItem.area?.nombre || 'No especificado'}
          isDarkMode={isDarkMode}
          isLoading={isSyncing}
        />
        <DetailCard
          label="Director/Jefe de Área"
          value={selectedItem.directorio?.nombre || 'No especificado'}
          isDarkMode={isDarkMode}
          isLoading={isSyncing}
        />
        <DetailCard
          label="Usuario Final"
          value={selectedItem.resguardante || 'No especificado'}
          isDarkMode={isDarkMode}
        />
        
        {/* Baja Information Section */}
        {selectedItem.fechabaja && (
          <div className="detail-card bg-red-900/20 border border-red-800/50 rounded-lg p-4 col-span-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Información de Baja
            </h3>
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="h-4 w-4 text-red-400" />
                <span>Fecha: {formatDate(selectedItem.fechabaja)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Info className="h-4 w-4 text-red-400" />
                <span>Causa: {selectedItem.causadebaja}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * DetailCard Component
 * Reusable card for displaying a single detail field
 */
interface DetailCardProps {
  label: string;
  value: string;
  isDarkMode: boolean;
  colSpan2?: boolean;
  isLoading?: boolean;
}

function DetailCard({ label, value, isDarkMode, colSpan2 = false, isLoading = false }: DetailCardProps) {
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
      {isLoading ? (
        <div className={`h-5 rounded animate-pulse ${
          isDarkMode ? 'bg-white/10' : 'bg-black/10'
        }`} style={{ width: '60%' }} />
      ) : (
        <p className={`font-light text-sm ${isDarkMode ? 'text-white/90' : 'text-black/90'}`}>
          {value}
        </p>
      )}
    </div>
  );
}
