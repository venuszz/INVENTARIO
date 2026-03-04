import { Mueble } from '../types';

/**
 * Representa un cambio detectado en un campo
 */
export interface Change {
  field: string;
  label: string;
  oldValue: string | null;
  newValue: string | null;
  fieldType: 'simple' | 'relational' | 'image';
}

/**
 * Estructura para el historial de cambios (preparado para BD)
 */
export interface ChangeHistory {
  id?: string;
  mueble_id: string;
  changes: Change[];
  reason: string;
  changed_by: string;
  changed_at?: string;
}

/**
 * Formatea la fecha en formato legible
 */
const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'Sin fecha';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

/**
 * Formatea el valor de un campo para mostrar en el modal
 */
export const formatFieldValue = (
  field: keyof Mueble,
  value: any,
  item: Mueble
): string => {
  // Valores nulos o undefined
  if (value === null || value === undefined || value === '') {
    return 'No especificado';
  }

  // Campos relacionales
  if (field === 'id_estatus') {
    return item.config_estatus?.concepto || value?.toString() || 'Sin estatus';
  }

  if (field === 'id_area') {
    return typeof item.area === 'object' && item.area !== null
      ? item.area.nombre
      : value?.toString() || 'Sin área';
  }

  if (field === 'id_directorio') {
    return typeof item.directorio === 'object' && item.directorio !== null
      ? item.directorio.nombre || 'Sin nombre'
      : value?.toString() || 'Sin director';
  }

  // Valor monetario
  if (field === 'valor') {
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue)) return '$0.00';
    return `$${numValue.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} MXN`;
  }

  // Fechas
  if (field === 'f_adq' || field === 'fechabaja') {
    return formatDate(value);
  }

  // Imagen
  if (field === 'image_path') {
    return value ? 'Imagen actualizada' : 'Sin imagen';
  }

  // Valores simples
  return value.toString();
};

/**
 * Detecta los cambios entre el item original y el editado
 */
export const detectChanges = (
  original: Mueble,
  edited: Mueble,
  filterOptions?: { 
    estatus?: Array<{ id: number; concepto: string }>;
    areas?: Array<{ id_area: number; nombre: string }>;
    directores?: Array<{ id_directorio: number; nombre: string }>;
  }
): Change[] => {
  const changes: Change[] = [];

  // Definición de campos a verificar
  const fieldsToCheck: Array<{
    key: keyof Mueble;
    label: string;
    type: 'simple' | 'relational' | 'image';
  }> = [
    { key: 'id_inv', label: 'ID Inventario', type: 'simple' },
    { key: 'rubro', label: 'Rubro', type: 'simple' },
    { key: 'descripcion', label: 'Descripción', type: 'simple' },
    { key: 'estado', label: 'Estado', type: 'simple' },
    { key: 'valor', label: 'Valor', type: 'simple' },
    { key: 'f_adq', label: 'Fecha de Adquisición', type: 'simple' },
    { key: 'formadq', label: 'Forma de Adquisición', type: 'simple' },
    { key: 'proveedor', label: 'Proveedor', type: 'simple' },
    { key: 'factura', label: 'Factura', type: 'simple' },
    { key: 'ubicacion_es', label: 'Estado (Ubicación)', type: 'simple' },
    { key: 'ubicacion_mu', label: 'Municipio', type: 'simple' },
    { key: 'ubicacion_no', label: 'Nomenclatura', type: 'simple' },
    { key: 'id_estatus', label: 'Estatus', type: 'relational' },
    { key: 'id_area', label: 'Área', type: 'relational' },
    { key: 'id_directorio', label: 'Director/Jefe de Área', type: 'relational' },
    { key: 'image_path', label: 'Imagen', type: 'image' },
  ];

  fieldsToCheck.forEach(({ key, label, type }) => {
    const oldVal = original[key];
    const newVal = edited[key];

    // Normalizar valores para comparación
    const normalizedOld = oldVal === null || oldVal === undefined || oldVal === '' ? null : oldVal;
    const normalizedNew = newVal === null || newVal === undefined || newVal === '' ? null : newVal;

    // Comparación especial para números
    if (typeof normalizedOld === 'number' && typeof normalizedNew === 'number') {
      if (Math.abs(normalizedOld - normalizedNew) < 0.001) {
        return; // No hay cambio significativo
      }
    }

    // Detectar cambio
    const hasChanged = normalizedOld !== normalizedNew;

    if (hasChanged) {
      // Para el valor anterior, usar el objeto original
      const oldFormatted = formatFieldValue(key, oldVal, original);
      
      // Para el valor nuevo, necesitamos manejar los campos relacionales de forma especial
      let newFormatted: string;
      
      if (type === 'relational') {
        // Para campos relacionales, buscar el nombre en las opciones de filtro
        if (key === 'id_estatus') {
          // Verificar si config_estatus coincide con el nuevo ID
          const configEstatusMatchesNewId = edited.config_estatus?.id === newVal;
          
          if (configEstatusMatchesNewId && edited.config_estatus?.concepto) {
            newFormatted = edited.config_estatus.concepto;
          } else if (filterOptions?.estatus && typeof newVal === 'number') {
            const estatus = filterOptions.estatus.find(e => e.id === newVal);
            newFormatted = estatus?.concepto || newVal?.toString() || 'Sin estatus';
          } else {
            newFormatted = newVal?.toString() || 'Sin estatus';
          }
        } else if (key === 'id_area') {
          if (typeof edited.area === 'object' && edited.area !== null) {
            newFormatted = edited.area.nombre;
          } else if (filterOptions?.areas && typeof newVal === 'number') {
            const area = filterOptions.areas.find(a => a.id_area === newVal);
            newFormatted = area?.nombre || newVal?.toString() || 'Sin área';
          } else {
            newFormatted = newVal?.toString() || 'Sin área';
          }
        } else if (key === 'id_directorio') {
          if (typeof edited.directorio === 'object' && edited.directorio !== null) {
            newFormatted = edited.directorio.nombre || 'Sin nombre';
          } else if (filterOptions?.directores && typeof newVal === 'number') {
            const director = filterOptions.directores.find(d => d.id_directorio === newVal);
            newFormatted = director?.nombre || newVal?.toString() || 'Sin director';
          } else {
            newFormatted = newVal?.toString() || 'Sin director';
          }
        } else {
          newFormatted = newVal?.toString() || 'No especificado';
        }
      } else {
        // Para campos simples, usar formatFieldValue normal
        newFormatted = formatFieldValue(key, newVal, edited);
      }

      const change: Change = {
        field: key,
        label,
        oldValue: oldFormatted,
        newValue: newFormatted,
        fieldType: type
      };
      
      changes.push(change);
    }
  });

  return changes;
};

/**
 * Prepara los datos del historial para guardar en BD (función placeholder)
 * Esta función será implementada cuando se integre con la base de datos
 */
export const prepareChangeHistoryForDB = (
  muebleId: string,
  changes: Change[],
  reason: string,
  changedBy: string
): ChangeHistory => {
  return {
    mueble_id: muebleId,
    changes,
    reason: reason.trim(),
    changed_by: changedBy,
    changed_at: new Date().toISOString()
  };
};

/**
 * Guarda el historial de cambios en la base de datos
 * TODO: Implementar cuando se cree la tabla change_history
 */
export const saveChangeHistoryToDB = async (
  history: ChangeHistory
): Promise<{ success: boolean; error?: string }> => {
  // Placeholder para futura implementación
  console.log('📝 [Change History] Preparado para guardar:', history);
  
  // TODO: Implementar llamada a API
  // const response = await fetch('/api/change-history', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(history)
  // });
  
  return { success: true };
};
