import { Clock, X } from 'lucide-react';

interface SearchHistoryItem {
    query: string;
    timestamp: number;
    resultsCount: number;
}

interface SearchHistoryProps {
    history: SearchHistoryItem[];
    onSelect: (query: string) => void;
    onRemove: (query: string) => void;
    onClear: () => void;
    isDarkMode: boolean;
}

export default function SearchHistory({
    history,
    onSelect,
    onRemove,
    onClear,
    isDarkMode
}: SearchHistoryProps) {
    if (history.length === 0) return null;

    return (
        <div className="p-2">
            {/* Header */}
            <div className="flex items-center justify-between px-2 py-1 mb-1">
                <span className={`text-[10px] font-medium ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                    Recientes
                </span>
                <button
                    onMouseDown={(e) => e.preventDefault()} // Prevent blur on input
                    onClick={onClear}
                    className={`text-[10px] ${isDarkMode ? 'text-white/30 hover:text-white/50' : 'text-black/30 hover:text-black/50'} transition-colors`}
                >
                    Limpiar
                </button>
            </div>

            {/* History Items */}
            <div className="space-y-0.5">
                {history.map((item) => (
                    <div
                        key={item.query}
                        className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.03]'}`}
                    >
                        <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${isDarkMode ? 'text-white/30' : 'text-black/30'}`} />
                        <button
                            onClick={() => onSelect(item.query)}
                            className={`flex-1 text-left text-sm truncate ${isDarkMode ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'}`}
                        >
                            {item.query}
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(item.query);
                            }}
                            className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'hover:bg-white/10 text-white/40' : 'hover:bg-black/10 text-black/40'}`}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
