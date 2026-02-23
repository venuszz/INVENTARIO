import { FileText, Package, Archive, MapPin, User, Link2 } from 'lucide-react';
import { SearchResult } from './types';

interface SearchResultItemProps {
    result: SearchResult;
    onClick: (result: SearchResult) => void;
    isDarkMode: boolean;
    isSelected?: boolean;
    dataIndex?: number;
    onMouseEnter?: () => void;
}

// Highlight matching text
function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query || query.length < 2) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const idx = lowerText.indexOf(lowerQuery);

    if (idx === -1) return text;

    return (
        <>
            {text.slice(0, idx)}
            <span className="bg-yellow-300/40 dark:bg-yellow-500/30 rounded px-0.5">
                {text.slice(idx, idx + query.length)}
            </span>
            {text.slice(idx + query.length)}
        </>
    );
}

// Get icon for result type
function getIcon(origen: SearchResult['origen']) {
    switch (origen) {
        case 'RESGUARDO':
            return <FileText className="w-3.5 h-3.5" />;
        case 'RESGUARDO_BAJA':
            return <Archive className="w-3.5 h-3.5" />;
        case 'AREA':
            return <MapPin className="w-3.5 h-3.5" />;
        case 'DIRECTOR':
            return <User className="w-3.5 h-3.5" />;
        default:
            return <Package className="w-3.5 h-3.5" />;
    }
}

export default function SearchResultItem({
    result,
    onClick,
    isDarkMode,
    isSelected = false,
    dataIndex,
    onMouseEnter
}: SearchResultItemProps) {
    const displayId = result.origen === 'RESGUARDO' ? result.folio :
        result.origen === 'RESGUARDO_BAJA' ? result.folio_baja :
            result.origen === 'AREA' ? result.nombre :
                result.origen === 'DIRECTOR' ? result.nombre :
                    result.id_inv;

    const displayDescription = result.origen === 'DIRECTOR'
        ? result.puesto
        : result.origen === 'AREA'
            ? null
            : result.descripcion;

    // Recopilar información para badges según origen
    const badges: string[] = [];

    if (result.origen === 'DIRECTOR' && result.areas_asignadas && result.areas_asignadas.length > 0) {
        badges.push(...result.areas_asignadas);
    }

    if (result.rubro) badges.push(result.rubro);
    if (result.estado && result.estado !== 'Seleccionar Estado') badges.push(result.estado);
    if (result.estatus) badges.push(`Est: ${result.estatus}`);
    if (result.resguardante && result.origen !== 'DIRECTOR') badges.push(`R: ${result.resguardante}`);
    if (result.created_by_nombre) badges.push(`Por: ${result.created_by_nombre}`);
    if (result.motivo_baja) badges.push(`Motivo: ${result.motivo_baja}`);
    if (result.condicion) badges.push(`Condición: ${result.condicion}`);
    if (result.valor) badges.push(`$${parseFloat(result.valor).toLocaleString()}`);
    if (result.f_resguardo) badges.push(`F.Resguardo: ${result.f_resguardo}`);
    if (result.f_baja) badges.push(`F.Baja: ${result.f_baja}`);

    // Mostrar indicador de coincidencia relacional
    const isRelationalMatch = result.matchType === 'by_resguardante' || result.matchType === 'by_director';

    return (
        <button
            onClick={() => onClick(result)}
            onMouseEnter={onMouseEnter}
            data-search-index={dataIndex}
            className={`w-full flex items-start gap-2.5 px-2.5 py-2.5 rounded-lg text-left transition-all duration-150 ${isSelected
                ? isDarkMode
                    ? 'bg-white/10 text-white'
                    : 'bg-black/10 text-black'
                : isDarkMode
                    ? 'hover:bg-white/[0.04] text-white/90'
                    : 'hover:bg-black/[0.03] text-black/90'
                }`}
        >
            {/* Icon */}
            <span className={`flex-shrink-0 mt-0.5 ${isSelected
                ? (isDarkMode ? 'text-white' : 'text-black')
                : (isDarkMode ? 'text-white/40' : 'text-black/40')
                }`}>
                {getIcon(result.origen)}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-1.5 flex-wrap">
                    <div className={`text-sm font-medium break-words flex-1 min-w-0`}>
                        {displayId}
                    </div>
                    {isRelationalMatch && (
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${isDarkMode
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-blue-50 text-blue-600 border border-blue-200'
                            }`}>
                            <Link2 className="w-2.5 h-2.5" />
                            {result.matchType === 'by_resguardante' ? 'Por Resguardante' : 'Por Director'}
                        </div>
                    )}
                </div>
                {(displayDescription || (result.area || result.area_resguardo) || result.matchedDirector || badges.length > 0) && (
                    <div className={`text-xs mt-1 break-words ${isSelected
                        ? (isDarkMode ? 'text-white/60' : 'text-black/60')
                        : (isDarkMode ? 'text-white/40' : 'text-black/40')
                        }`}>
                        {[
                            result.matchedDirector && <span key="dir" className="font-medium">{result.matchedDirector}</span>,
                            (result.area || result.area_resguardo) && <span key="area" className="font-medium">{result.area || result.area_resguardo}</span>,
                            displayDescription && <span key="desc" className="opacity-80 line-clamp-1">{displayDescription}</span>
                        ].filter(Boolean).map((item, index, arr) => (
                            <span key={index} className="flex-shrink-0">
                                {item}
                                {index < arr.length - 1 && ' · '}
                            </span>
                        ))}

                        {badges.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {badges.map((badgeText, idx) => (
                                    <span key={idx} className={`px-1.5 py-0.5 text-[9.5px] font-medium rounded-md border transition-colors line-clamp-1 max-w-full ${isDarkMode
                                            ? 'bg-white/5 border-white/10 text-white/70'
                                            : 'bg-black/5 border-black/5 text-black/70'
                                        }`}>
                                        {badgeText}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </button>
    );
}
