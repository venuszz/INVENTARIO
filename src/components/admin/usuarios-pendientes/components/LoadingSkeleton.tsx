interface LoadingSkeletonProps {
    isDarkMode: boolean;
}

export function LoadingSkeleton({ isDarkMode }: LoadingSkeletonProps) {
    return (
        <div className="space-y-1">
            {[...Array(5)].map((_, i) => (
                <div
                    key={i}
                    className={`px-4 py-3.5 rounded-lg border animate-pulse ${
                        isDarkMode
                            ? 'bg-black border-white/5'
                            : 'bg-white border-black/5'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                            <div className={`w-10 h-10 rounded-lg ${
                                isDarkMode ? 'bg-white/5' : 'bg-black/5'
                            }`} />
                            <div className="flex-1">
                                <div className={`h-4 rounded w-32 mb-2 ${
                                    isDarkMode ? 'bg-white/5' : 'bg-black/5'
                                }`} />
                                <div className={`h-3 rounded w-48 ${
                                    isDarkMode ? 'bg-white/5' : 'bg-black/5'
                                }`} />
                            </div>
                        </div>
                        <div className={`h-8 w-20 rounded-lg ${
                            isDarkMode ? 'bg-white/5' : 'bg-black/5'
                        }`} />
                    </div>
                </div>
            ))}
        </div>
    );
}
