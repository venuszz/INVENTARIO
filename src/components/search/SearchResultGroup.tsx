import { SearchResult } from './types';
import SearchResultItem from './SearchResultItem';

interface SearchResultGroupProps {
    title: string;
    results: SearchResult[];
    onResultClick: (result: SearchResult) => void;
    isDarkMode: boolean;
    startIndex: number;
    selectedIndex: number;
    onMouseEnter: (index: number) => void;
}

export default function SearchResultGroup({
    title,
    results,
    onResultClick,
    isDarkMode,
    startIndex,
    selectedIndex,
    onMouseEnter
}: SearchResultGroupProps) {
    if (results.length === 0) return null;

    return (
        <div className="mb-1 last:mb-0">
            {/* Group Header */}
            <div className="px-2 py-1">
                <span className={`text-[10px] font-medium uppercase tracking-wide ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                    {title}
                </span>
            </div>
            
            {/* Results */}
            <div className="space-y-0.5">
                {results.map((result, index) => {
                    const globalIndex = startIndex + index;
                    return (
                        <SearchResultItem
                            key={`${result.origen}-${result.id}`}
                            result={result}
                            onClick={onResultClick}
                            isDarkMode={isDarkMode}
                            isSelected={globalIndex === selectedIndex}
                            dataIndex={globalIndex}
                            onMouseEnter={() => onMouseEnter(globalIndex)}
                        />
                    );
                })}
            </div>
        </div>
    );
}
