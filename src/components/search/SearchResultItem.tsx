import { FileText, Package, Archive } from 'lucide-react';
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
            result.id_inv;

    return (
        <button
            onClick={() => onClick(result)}
            onMouseEnter={onMouseEnter}
            data-search-index={dataIndex}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150 ${
                isSelected
                    ? isDarkMode 
                        ? 'bg-white/10 text-white' 
                        : 'bg-black/10 text-black'
                    : isDarkMode
                        ? 'hover:bg-white/[0.04] text-white/90'
                        : 'hover:bg-black/[0.03] text-black/90'
            }`}
        >
            {/* Icon */}
            <span className={isSelected 
                ? (isDarkMode ? 'text-white' : 'text-black')
                : (isDarkMode ? 'text-white/40' : 'text-black/40')
            }>
                {getIcon(result.origen)}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className={`text-sm truncate font-medium`}>
                    {displayId}
                </div>
                {result.descripcion && (
                    <div className={`text-xs truncate ${
                        isSelected
                            ? (isDarkMode ? 'text-white/60' : 'text-black/60')
                            : (isDarkMode ? 'text-white/40' : 'text-black/40')
                    }`}>
                        {(result.area || result.area_resguardo) && (
                            <>
                                <span className="font-medium">{result.area || result.area_resguardo}</span>
                                {' · '}
                            </>
                        )}
                        {result.descripcion}
                    </div>
                )}
            </div>
        </button>
    );
}
