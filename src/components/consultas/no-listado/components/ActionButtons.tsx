import { RefreshCw } from 'lucide-react';

interface ActionButtonsProps {
    onRefresh: () => void;
    isDarkMode: boolean;
}

export default function ActionButtons({ onRefresh, isDarkMode }: ActionButtonsProps) {
    return (
        <div className="flex items-center gap-2 mt-4 md:mt-0">
            <button
                onClick={onRefresh}
                className={`px-4 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 shadow-md ${isDarkMode
                    ? 'border-amber-700/30 bg-amber-900/10 text-amber-100 hover:bg-amber-900/20'
                    : 'border-amber-200 bg-white text-amber-800 hover:bg-amber-50'
                    }`}
                title="Recargar datos desde la base de datos"
            >
                <RefreshCw className="h-4 w-4 animate-spin-slow" />
                Actualizar
            </button>
        </div>
    );
}
