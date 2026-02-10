import type { ActiveFilter } from './types';

/**
 * Formatea una fecha a formato DD/MM/YYYY
 * @param dateString - String de fecha a formatear
 * @returns Fecha formateada o string vacío si es inválida
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Trunca un texto a una longitud específica
 * @param text - Texto a truncar
 * @param length - Longitud máxima (default: 50)
 * @returns Texto truncado con "..." o "No Data" si es null
 */
export function truncateText(text: string | null, length: number = 50): string {
  if (!text) return "No Data";
  return text.length > length ? `${text.substring(0, length)}...` : text;
}

/**
 * Obtiene el icono correspondiente a un tipo de filtro
 * @param type - Tipo de filtro
 * @param isDarkMode - Si está en modo oscuro
 * @returns Elemento JSX con el icono
 */
export function getTypeIcon(type: ActiveFilter['type'], isDarkMode: boolean) {
  const iconClass = isDarkMode ? 'h-4 w-4 text-white/80 font-medium' : 'h-4 w-4 text-gray-600/80 font-medium';
  switch (type) {
    case 'id': return <span className={iconClass}>#</span>;
    case 'area': return <span className={iconClass}>A</span>;
    case 'usufinal': return <span className={iconClass}>D</span>;
    case 'resguardante': return <span className={iconClass}>R</span>;
    case 'descripcion': return <span className={iconClass}>Desc</span>;
    case 'rubro': return <span className={iconClass}>Ru</span>;
    case 'estado': return <span className={iconClass}>Edo</span>;
    case 'estatus': return <span className={iconClass}>Est</span>;
    default: return null;
  }
}

/**
 * Obtiene la etiqueta correspondiente a un tipo de filtro
 * @param type - Tipo de filtro
 * @returns String con la etiqueta
 */
export function getTypeLabel(type: ActiveFilter['type']): string {
  switch (type) {
    case 'id': return 'ID';
    case 'area': return 'ÁREA';
    case 'usufinal': return 'DIRECTOR';
    case 'resguardante': return 'RESGUARDANTE';
    case 'descripcion': return 'DESCRIPCIÓN';
    case 'rubro': return 'RUBRO';
    case 'estado': return 'ESTADO';
    case 'estatus': return 'ESTATUS';
    default: return '';
  }
}
