import { useState, useEffect } from 'react';
import { Bell, Clock, AlertCircle, CheckCircle, Info, Sparkles, FileText, Package, Users, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

// Mock notifications data based on real system operations
const mockNotifications = [
    {
        id: '1',
        type: 'success' as const,
        title: 'Resguardo generado exitosamente',
        message: 'Se creó el resguardo RG-2026-001 con 15 artículos para el director Juan Pérez del área de Sistemas',
        time: 'Hace 5 minutos',
        isDemo: true,
        icon: FileText
    },
    {
        id: '2',
        type: 'info' as const,
        title: 'Nuevo bien registrado',
        message: 'Se agregó el bien "Laptop HP EliteBook 840" con ID INV-2026-0234 al inventario ITEA',
        time: 'Hace 15 minutos',
        isDemo: true,
        icon: Package
    },
    {
        id: '3',
        type: 'warning' as const,
        title: 'Director sin datos completos',
        message: 'El director María González requiere completar información de área y puesto antes de crear resguardos',
        time: 'Hace 1 hora',
        isDemo: true,
        icon: Users
    },
    {
        id: '4',
        type: 'info' as const,
        title: 'Actualización de inventario',
        message: '23 registros del inventario INEA fueron sincronizados correctamente desde la base de datos',
        time: 'Hace 2 horas',
        isDemo: true,
        icon: CheckCircle
    },
    {
        id: '5',
        type: 'warning' as const,
        title: 'Conflicto de área detectado',
        message: 'Los artículos seleccionados pertenecen a diferentes áreas. Se requiere revisión antes de continuar',
        time: 'Hace 3 horas',
        isDemo: true,
        icon: AlertTriangle
    },
    {
        id: '6',
        type: 'success' as const,
        title: 'Folio generado',
        message: 'Se generó el folio RG-2026-002 para el nuevo resguardo. Listo para asignar artículos',
        time: 'Hace 4 horas',
        isDemo: true,
        icon: FileText
    }
];

export default function NotificationsPanel({ onClose }: { onClose?: () => void }) {
    const { isDarkMode } = useTheme();
    const [animateIn, setAnimateIn] = useState(false);

    useEffect(() => {
        setAnimateIn(true);
    }, []);

    const getNotificationIcon = (notification: typeof mockNotifications[0]) => {
        const IconComponent = notification.icon;
        return <IconComponent size={16} />;
    };

    const getNotificationColors = (type: string) => {
        switch (type) {
            case 'success':
                return isDarkMode
                    ? 'bg-green-500/10 text-green-300 border-green-500/30'
                    : 'bg-green-100 text-green-700 border-green-300';
            case 'warning':
                return isDarkMode
                    ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30'
                    : 'bg-yellow-100 text-yellow-700 border-yellow-300';
            case 'info':
            default:
                return isDarkMode
                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                    : 'bg-blue-100 text-blue-700 border-blue-300';
        }
    };

    return (
        <div className={`flex flex-col w-[380px] h-[580px] rounded-2xl overflow-hidden shadow-2xl border transition-all duration-500 transform ${isDarkMode
            ? 'bg-black/95 text-white border-white/10 backdrop-blur-2xl'
            : 'bg-white/95 text-gray-900 border-black/10 backdrop-blur-2xl'
            } ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>

            {/* Header */}
            <div className={`flex items-center justify-between px-4 pt-4 pb-3 border-b ${
                isDarkMode ? 'border-white/10' : 'border-black/10'
            }`}>
                <div className="flex items-center gap-2">
                    <Bell className={`h-4 w-4 ${
                        isDarkMode ? 'text-white/60' : 'text-black/60'
                    }`} />
                    <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-black'
                    }`}>
                        Notificaciones
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        isDarkMode 
                            ? 'bg-white/10 text-white border-white/20' 
                            : 'bg-black/10 text-black border-black/20'
                    }`}>
                        {mockNotifications.length}
                    </span>
                </div>
            </div>

            {/* Demo Banner */}
            <div className={`mx-4 mt-3 mb-2 px-3 py-2 rounded-lg border flex items-start gap-2 ${
                isDarkMode
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : 'bg-purple-100 border-purple-300'
            }`}>
                <Sparkles size={14} className={`flex-shrink-0 mt-0.5 ${
                    isDarkMode ? 'text-purple-300' : 'text-purple-700'
                }`} />
                <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${
                        isDarkMode ? 'text-purple-300' : 'text-purple-700'
                    }`}>
                        Vista previa de funcionalidad
                    </p>
                    <p className={`text-[10px] mt-0.5 ${
                        isDarkMode ? 'text-purple-300/70' : 'text-purple-600'
                    }`}>
                        Estas notificaciones simulan eventos reales del sistema
                    </p>
                </div>
            </div>

            {/* Notifications list */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="space-y-2">
                    {mockNotifications.map((notification, index) => (
                        <div
                            key={notification.id}
                            className={`rounded-lg p-3 border transition-all duration-200 ${
                                isDarkMode
                                    ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]'
                                    : 'bg-black/[0.02] border-black/10 hover:bg-black/[0.04]'
                            }`}
                            style={{
                                animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
                            }}
                        >
                            {/* Header with icon and time */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className={`flex items-center gap-2 flex-1 min-w-0`}>
                                    <span className={`inline-flex items-center justify-center p-1 rounded border ${
                                        getNotificationColors(notification.type)
                                    }`}>
                                        {getNotificationIcon(notification)}
                                    </span>
                                    <span className={`text-xs font-medium truncate ${
                                        isDarkMode ? 'text-white' : 'text-black'
                                    }`}>
                                        {notification.title}
                                    </span>
                                </div>
                                <div className={`flex items-center gap-1 text-[10px] flex-shrink-0 ${
                                    isDarkMode ? 'text-white/40' : 'text-black/40'
                                }`}>
                                    <Clock size={10} />
                                    <span>{notification.time}</span>
                                </div>
                            </div>

                            {/* Message */}
                            <p className={`text-xs leading-relaxed ${
                                isDarkMode ? 'text-white/70' : 'text-black/70'
                            }`}>
                                {notification.message}
                            </p>

                            {/* Demo badge */}
                            {notification.isDemo && (
                                <div className="mt-2 pt-2 border-t border-current opacity-20">
                                    <span className={`text-[9px] font-mono uppercase tracking-wider ${
                                        isDarkMode ? 'text-white/40' : 'text-black/40'
                                    }`}>
                                        Demo
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer info */}
            <div className={`px-4 py-3 border-t text-center ${
                isDarkMode ? 'border-white/10' : 'border-black/10'
            }`}>
                <p className={`text-[10px] ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                }`}>
                    Notificaciones en tiempo real próximamente
                </p>
            </div>

            <style jsx>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </div>
    );
}
