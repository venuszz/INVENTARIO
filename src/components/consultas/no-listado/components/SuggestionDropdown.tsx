import { ActiveFilter } from '../types';
import { getTypeIcon, getTypeLabel } from '../utils';

interface SuggestionDropdownProps {
    show: boolean;
    suggestions: { value: string; type: ActiveFilter['type'] }[];
    highlightedIndex: number;
    onSelect: (index: number) => void;
    isDarkMode: boolean;
}

export default function SuggestionDropdown({
    show,
    suggestions,
    highlightedIndex,
    onSelect,
    isDarkMode
}: SuggestionDropdownProps) {
    if (!show || suggestions.length === 0) return null;

    return (
        <ul
            id="omnibox-suggestions"
            role="listbox"
            title="Sugerencias de búsqueda"
            className={`absolute left-0 top-full w-full mt-1 animate-fadeInUp max-h-80 overflow-y-auto rounded-lg shadow-sm border backdrop-blur-xl transition-all duration-200 z-50 ${isDarkMode
                ? 'border-white/10 bg-black/90'
                : 'border-gray-200 bg-white/95'
                }`}
        >
            {suggestions.map((s, i) => {
                const isSelected = highlightedIndex === i;
                return (
                    <li
                        key={s.value + s.type}
                        role="option"
                        {...(isSelected && { 'aria-selected': 'true' })}
                        onMouseDown={() => onSelect(i)}
                        className={`flex items-center gap-1.5 px-2 py-1 cursor-pointer select-none text-xs whitespace-normal break-words w-full transition-colors ${isSelected
                            ? (isDarkMode ? 'bg-white/5 text-white' : 'bg-blue-50 text-blue-900')
                            : (isDarkMode ? 'text-white/80 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50')
                            }`}
                    >
                        <span className={`shrink-0 ${isDarkMode ? 'text-white/70' : 'text-gray-600'
                            }`}>{getTypeIcon(s.type)}</span>
                        <span className="font-normal whitespace-normal break-words w-full truncate">{s.value}</span>
                        <span className={`ml-auto text-[10px] font-mono ${isDarkMode ? 'text-white/60' : 'text-gray-500'
                            }`}>{getTypeLabel(s.type)}</span>
                    </li>
                );
            })}
        </ul>
    );
}
