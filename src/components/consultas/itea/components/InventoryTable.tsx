import {
    ArrowUpDown,
    AlertCircle,
    FileWarning,
    CheckCircle,
    XCircle,
    AlertTriangle,
    BadgeCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Mueble } from '../types';
import { truncateText, getTypeIcon } from '../utils';
import TableSkeleton from './TableSkeleton';

interface InventoryTableProps {
    muebles: Mueble[];
    paginatedMuebles: Mueble[];
    loading: boolean;
    error: string | null;
    selectedItem: Mueble | null;
    foliosResguardo: Record<string, string>;
    sortField: keyof Mueble | null;
    sortDirection: 'asc' | 'desc';
    isDarkMode: boolean;
    onSort: (field: keyof Mueble) => void;
    onSelectItem: (item: Mueble) => void;
    syncingIds?: string[];
}

export default function InventoryTable({
    muebles,
    paginatedMuebles,
    loading,
    error,
    selectedItem,
    foliosResguardo,
    sortField,
    sortDirection,
    isDarkMode,
    onSort,
    onSelectItem,
    syncingIds = []
}: InventoryTableProps) {
    
    // Ensure syncingIds is always an array
    const syncingIdsArray = Array.isArray(syncingIds) ? syncingIds : [];
    
    function SortableHeader({ 
        field, 
        label 
    }: { 
        field: keyof Mueble; 
        label: string 
    }) {
        const isActive = sortField === field;
        
        return (
            <th
                onClick={() => onSort(field)}
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-all ${
                    isActive
                        ? isDarkMode 
                            ? 'text-white bg-white/[0.02]' 
                            : 'text-black bg-black/[0.02]'
                        : isDarkMode 
                            ? 'text-white/60 hover:bg-white/[0.02] hover:text-white' 
                            : 'text-black/60 hover:bg-black/[0.02] hover:text-black'
                }`}
                title={`Ordenar por ${label}`}
            >
                <div className="flex items-center gap-1.5">
                    {label}
                    <ArrowUpDown size={12} className={isActive ? 'opacity-100' : 'opacity-40'} />
                </div>
            </th>
        );
    }

    const getStatusBadgeColors = (status: string | null) => {
        if (!status) return { text: isDarkMode ? 'text-white/60' : 'text-black/60', style: {} };
        
        const statusUpper = status.toUpperCase();
        
        if (statusUpper === 'ACTIVO') {
            return {
                text: isDarkMode ? 'text-green-400' : 'text-green-600',
                style: { 
                    backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    borderColor: isDarkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.3)'
                }
            };
        }
        
        if (statusUpper === 'INACTIVO') {
            return {
                text: isDarkMode ? 'text-gray-400' : 'text-gray-600',
                style: { 
                    backgroundColor: isDarkMode ? 'rgba(156, 163, 175, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                    borderColor: isDarkMode ? 'rgba(156, 163, 175, 0.3)' : 'rgba(156, 163, 175, 0.3)'
                }
            };
        }
        
        if (statusUpper === 'BAJA') {
            return {
                text: isDarkMode ? 'text-red-400' : 'text-red-600',
                style: { 
                    backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                }
            };
        }
        
        return {
            text: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
            style: { 
                backgroundColor: isDarkMode ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                borderColor: isDarkMode ? 'rgba(234, 179, 8, 0.3)' : 'rgba(234, 179, 8, 0.3)'
            }
        };
    };

    /**
     * Skeleton loader for syncing cells
     */
    function CellSkeleton() {
        return (
            <div className={`h-4 rounded animate-pulse ${
                isDarkMode ? 'bg-white/10' : 'bg-black/10'
            }`} style={{ width: '80%' }} />
        );
    }

    return (
        <div className={`rounded-lg border overflow-hidden h-full flex flex-col ${
            isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/10'
        }`}>
            <div className={`overflow-auto flex-1 ${
                isDarkMode 
                  ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30'
                  : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20 hover:scrollbar-thumb-black/30'
            }`}>
                <table className="min-w-full">
                    <thead className={`sticky top-0 z-10 backdrop-blur-xl ${
                        isDarkMode ? 'bg-black/95 border-b border-white/10' : 'bg-white/95 border-b border-black/10'
                    }`}>
                        <tr>
                            <SortableHeader field="id_inv" label="ID Inventario" />
                            <SortableHeader field="descripcion" label="Descripción" />
                            <SortableHeader field="area" label="Área" />
                            <SortableHeader field="directorio" label="Director/Jefe" />
                            <SortableHeader field="estatus" label="Estado" />
                            <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                isDarkMode ? 'text-white/60' : 'text-black/60'
                            }`}>
                                Folio Resguardo
                            </th>
                        </tr>
                    </thead>
                    <tbody className={isDarkMode ? 'bg-black' : 'bg-white'}>
                        {loading ? (
                            <TableSkeleton isDarkMode={isDarkMode} />
                        ) : error ? (
                            <tr className="h-96">
                                <td colSpan={6} className="px-6 py-24 text-center">
                                    <div className={`flex flex-col items-center justify-center space-y-4 ${
                                        isDarkMode ? 'text-red-400' : 'text-red-600'
                                    }`}>
                                        <AlertCircle className="h-12 w-12" />
                                        <p className="text-lg font-medium">Error al cargar datos</p>
                                        <p className={`text-sm max-w-lg mx-auto ${
                                            isDarkMode ? 'text-white/40' : 'text-black/40'
                                        }`}>{error}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : muebles.length === 0 ? (
                            <tr className="h-96">
                                <td colSpan={6} className={`px-6 py-24 text-center ${
                                    isDarkMode ? 'text-white/40' : 'text-black/40'
                                }`}>
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <FileWarning className={`h-12 w-12 ${
                                            isDarkMode ? 'text-white/20' : 'text-black/20'
                                        }`} />
                                        <p className="text-lg font-light">No se encontraron artículos ITEA</p>
                                        <p className={`text-sm ${
                                            isDarkMode ? 'text-white/30' : 'text-black/30'
                                        }`}>No hay registros disponibles actualmente</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedMuebles.map((item, index) => {
                                const folio = item.id_inv ? foliosResguardo[item.id_inv] : undefined;
                                const isSelected = selectedItem?.id === item.id;
                                const isSyncing = syncingIdsArray.includes(item.id);
                                
                                return (
                                    <motion.tr
                                        key={item.id}
                                        onClick={() => onSelectItem(item)}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: index * 0.02 }}
                                        className={`group cursor-pointer transition-all border-b ${
                                            isDarkMode ? 'border-white/5' : 'border-black/5'
                                        } ${
                                            isSelected
                                                ? isDarkMode
                                                    ? 'bg-white/[0.08] border-l-2 !border-l-white/60'
                                                    : 'bg-black/[0.08] border-l-2 !border-l-black/60'
                                                : isDarkMode
                                                    ? 'hover:bg-white/[0.03]'
                                                    : 'hover:bg-black/[0.03]'
                                        }`}
                                    >
                                        <td className={`px-4 py-3.5 whitespace-nowrap text-sm transition-all ${
                                            isDarkMode ? 'text-white' : 'text-black'
                                        } ${isSelected ? 'font-medium' : 'font-light'}`}>
                                            <div className="flex items-center gap-2">
                                                {/* Color indicator */}
                                                {item.colores?.nombre && (() => {
                                                    const colorHex = 
                                                        item.colores.nombre === 'ROJO' ? '#ef4444' :
                                                        item.colores.nombre === 'BLANCO' ? '#ffffff' :
                                                        item.colores.nombre === 'VERDE' ? '#22c55e' :
                                                        '#9ca3af';
                                                    
                                                    const isWhite = item.colores.nombre === 'BLANCO';
                                                    
                                                    return (
                                                        <div className="relative group/color">
                                                            <div 
                                                                className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200 cursor-help group-hover/color:scale-150 group-hover/color:shadow-lg"
                                                                style={{
                                                                    backgroundColor: colorHex,
                                                                    border: isWhite 
                                                                        ? `1.5px solid ${isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'}` 
                                                                        : 'none',
                                                                    opacity: 0.9,
                                                                    boxShadow: `0 0 8px ${colorHex}40`
                                                                }}
                                                            />
                                                            {/* Popover on hover */}
                                                            <div 
                                                                className="absolute left-0 top-full mt-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover/color:opacity-100 transition-all duration-200 z-50 shadow-xl backdrop-blur-sm"
                                                                style={{
                                                                    backgroundColor: `${colorHex}f5`,
                                                                    border: `2px solid ${colorHex}`,
                                                                    color: isWhite ? '#000000' : '#ffffff',
                                                                    minWidth: '120px'
                                                                }}
                                                            >
                                                                {/* Arrow */}
                                                                <div 
                                                                    className="absolute -top-1.5 left-2 w-3 h-3 rotate-45"
                                                                    style={{
                                                                        backgroundColor: colorHex,
                                                                        border: `2px solid ${colorHex}`,
                                                                        borderRight: 'none',
                                                                        borderBottom: 'none'
                                                                    }}
                                                                />
                                                                <div className="relative">
                                                                    <div className="font-bold text-sm tracking-wide mb-1">
                                                                        {item.colores.nombre}
                                                                    </div>
                                                                    {item.colores.significado && (
                                                                        <div 
                                                                            className="text-[11px] leading-tight font-light"
                                                                            style={{
                                                                                color: isWhite ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)'
                                                                            }}
                                                                        >
                                                                            {item.colores.significado}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                                <span className={`${isSelected ? 'opacity-100' : 'opacity-90'}`}>
                                                    {item.id_inv}
                                                </span>
                                            </div>
                                        </td>
                                        <td className={`px-4 py-3.5 text-sm font-light transition-all ${
                                            isDarkMode ? 'text-white/90' : 'text-black/90'
                                        }`}>
                                            <div className={`max-w-md ${isSelected ? 'font-normal' : ''}`}>
                                                {truncateText(item.descripcion, 50)}
                                            </div>
                                        </td>
                                        <td className={`px-4 py-3.5 text-sm font-light ${
                                            isDarkMode ? 'text-white/80' : 'text-black/80'
                                        }`}>
                                            {isSyncing ? <CellSkeleton /> : truncateText(item.area?.nombre ?? null, 25)}
                                        </td>
                                        <td className={`px-4 py-3.5 text-sm font-light ${
                                            isDarkMode ? 'text-white/80' : 'text-black/80'
                                        }`}>
                                            {isSyncing ? <CellSkeleton /> : truncateText(item.directorio?.nombre ?? null, 25)}
                                        </td>
                                        <td className="px-4 py-3.5 text-sm">
                                            {(() => {
                                                const status = item.estatus;
                                                const { text, style } = getStatusBadgeColors(status);
                                                return (
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-light border ${text}`}
                                                        style={style}
                                                    >
                                                        {status === 'ACTIVO' && <CheckCircle className="h-3 w-3" />}
                                                        {status === 'INACTIVO' && <XCircle className="h-3 w-3" />}
                                                        {status === 'BAJA' && <AlertTriangle className="h-3 w-3" />}
                                                        {truncateText(status, 20)}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-4 py-3.5 text-sm">
                                            {folio ? (
                                                <button
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-light border transition-all ${
                                                        isDarkMode
                                                            ? 'bg-white/5 hover:bg-white/10 text-white border-white/20 hover:border-white/30'
                                                            : 'bg-black/5 hover:bg-black/10 text-black border-black/20 hover:border-black/30'
                                                    }`}
                                                    title={`Ver resguardo ${folio}`}
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        window.location.href = `/resguardos/consultar?folio=${folio}`;
                                                    }}
                                                >
                                                    <BadgeCheck className="h-3.5 w-3.5" />
                                                    <span className="font-medium">{folio}</span>
                                                </button>
                                            ) : (
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-light border ${
                                                    isDarkMode
                                                        ? 'bg-white/[0.02] text-white/30 border-white/10'
                                                        : 'bg-black/[0.02] text-black/30 border-black/10'
                                                }`}>
                                                    <XCircle className="h-3.5 w-3.5" />
                                                    Sin resguardo
                                                </span>
                                            )}
                                        </td>
                                    </motion.tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
