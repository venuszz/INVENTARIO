import { Search } from 'lucide-react';

interface SearchEmptyStateProps {
    query: string;
    isDarkMode: boolean;
}

export default function SearchEmptyState({ query, isDarkMode }: SearchEmptyStateProps) {
    return (
        <div className="p-6 text-center">
            <Search className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-white/20' : 'text-black/20'}`} />
            <p className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                Sin resultados para "{query}"
            </p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                Intenta con otro término
            </p>
        </div>
    );
}
