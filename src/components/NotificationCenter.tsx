import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function NotificationsPanel({ onClose }: { onClose?: () => void }) {
    const { isDarkMode } = useTheme();
    const [animateIn, setAnimateIn] = useState(false);

    useEffect(() => {
        setAnimateIn(true);
    }, []);

    return (
        <div className={`flex flex-col w-[320px] h-[500px] rounded-2xl overflow-hidden shadow-2xl border transition-all duration-500 transform ${isDarkMode
            ? 'bg-black/20 text-white border-white/10 backdrop-blur-2xl'
            : 'bg-white/30 text-gray-900 border-white/20 backdrop-blur-2xl'
            } ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <h1 className={`text-lg font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Notificaciones
                </h1>
            </div>

            {/* Contenido */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isDarkMode ? 'bg-white/10' : 'bg-black/5'
                    }`}>
                    <Bell size={28} strokeWidth={1.5} className={isDarkMode ? 'text-gray-400' : 'text-gray-400'} />
                </div>
                <h2 className={`text-base font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Próximamente disponible
                </h2>
                <p className={`text-sm text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Las notificaciones estarán disponibles en una futura actualización
                </p>
            </div>
        </div>
    );
}
