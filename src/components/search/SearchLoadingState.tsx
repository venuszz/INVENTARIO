interface SearchLoadingStateProps {
    isDarkMode: boolean;
}

export default function SearchLoadingState({ isDarkMode }: SearchLoadingStateProps) {
    return (
        <div className="p-3 space-y-2">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2.5 px-2.5 py-2">
                    <div className={`w-4 h-4 rounded ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} animate-pulse`} />
                    <div className="flex-1 space-y-1.5">
                        <div 
                            className={`h-3.5 rounded ${isDarkMode ? 'bg-white/10' : 'bg-black/10'} animate-pulse`} 
                            style={{ width: `${60 + i * 10}%` }} 
                        />
                        <div 
                            className={`h-2.5 rounded ${isDarkMode ? 'bg-white/5' : 'bg-black/5'} animate-pulse`} 
                            style={{ width: `${40 + i * 5}%` }} 
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
