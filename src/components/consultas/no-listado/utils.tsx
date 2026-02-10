import React from 'react';
import { ActiveFilter, BadgeColors } from './types';

/**
 * Genera un color HSL único y consistente a partir de un string
 */
export function stringToHslColor(str: string, s = 60, l = 30): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Obtiene los colores para el badge de estatus
 */
export function getStatusBadgeColors(status: string | null | undefined): BadgeColors {
    if (!status) return {
        bg: 'bg-gray-700',
        border: 'border-gray-600',
        text: 'text-gray-300',
        style: {}
    };
    const bg = stringToHslColor(status, 60, 22);
    const border = stringToHslColor(status, 60, 32);
    // Contraste: si el color es "oscuro" (l<30), texto claro, si no, texto oscuro
    const l = 22;
    const text = l < 30 ? 'text-white' : 'text-black';
    return {
        bg: '',
        border: '',
        text,
        style: { backgroundColor: bg, borderColor: border }
    };
}

/**
 * Formatea una fecha en formato local
 */
export function formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX');
}

/**
 * Trunca un texto a una longitud específica
 */
export function truncateText(text: string | null, length: number = 50): string {
    if (!text) return "No Data";
    return text.length > length ? `${text.substring(0, length)}...` : text;
}

/**
 * Obtiene el icono para un tipo de filtro
 */
export function getTypeIcon(type: ActiveFilter['type']): React.ReactElement | null {
    switch (type) {
        case 'id': return <span className="h-4 w-4 text-white/80 font-medium">#</span>;
        case 'area': return <span className="h-4 w-4 text-white/80 font-medium">A</span>;
        case 'usufinal': return <span className="h-4 w-4 text-white/80 font-medium">D</span>;
        case 'resguardante': return <span className="h-4 w-4 text-white/80 font-medium">R</span>;
        case 'descripcion': return <span className="h-4 w-4 text-white/80 font-medium">Desc</span>;
        case 'rubro': return <span className="h-4 w-4 text-white/80 font-medium">Ru</span>;
        case 'estado': return <span className="h-4 w-4 text-white/80 font-medium">Edo</span>;
        case 'estatus': return <span className="h-4 w-4 text-white/80 font-medium">Est</span>;
        default: return null;
    }
}

/**
 * Obtiene la etiqueta para un tipo de filtro
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
