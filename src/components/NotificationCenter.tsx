import { useState, useEffect } from 'react';
import { Bell, Check, AlertCircle, Info, X, ChevronRight, AlertTriangle, ArrowLeft, Clock, Moon } from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useTheme } from '@/context/ThemeContext';

export default function NotificationsPanel({ onClose }: { onClose?: () => void }) {
    const { isDarkMode } = useTheme();
    const [activeFilter, setActiveFilter] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [animateIn, setAnimateIn] = useState(false);
    const [modalAnimate, setModalAnimate] = useState(false);
    const [showRead, setShowRead] = useState(false);

    // Extraer deleteNotification del hook
    const { notifications, loading, markAsRead, deleteNotification, refresh, doNotDisturb, setDoNotDisturb } = useNotifications();

    // Activar animaciones
    useEffect(() => {
        setAnimateIn(true);
    }, []);

    useEffect(() => {
        if (modalOpen) {
            setTimeout(() => setModalAnimate(true), 50);
        } else {
            setModalAnimate(false);
        }
    }, [modalOpen]);

    // Filtrar notificaciones eliminadas
    const filteredNotifications = notifications.filter(notification => {
        if (notification.data?.is_deleted) return false;
        if (activeFilter === 'all') return true;
        if (activeFilter === 'unread') return !notification.is_read;
        return notification.category === activeFilter;
    });

    // Separar notificaciones leídas y no leídas
    const unreadNotifications = filteredNotifications.filter(n => !n.is_read);
    const readNotifications = filteredNotifications.filter(n => n.is_read);

    // Abrir modal y marcar como leída automáticamente
    const openModal = async (notification: Notification) => {
        setSelectedNotification(notification);
        setModalOpen(true);
        if (!notification.is_read) {
            try {
                await markAsRead(notification.id);
                await refresh(); // Refresca el estado global tras marcar como leída
            } catch (error) {
                console.error('Error al marcar como leída:', error);
            }
        }
    };

    // Formatear fecha relativa
    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'ahora';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;

        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
        });
    };

    // Obtener color según el tipo de notificación
    const getTypeColor = (type: string) => {
        switch (type) {
            case 'info': return 'bg-blue-500';
            case 'success': return 'bg-green-500';
            case 'warning': return 'bg-yellow-500';
            case 'danger': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    // Obtener color del texto según el tipo
    const getTypeTextColor = (type: string) => {
        const baseColors = {
            info: isDarkMode ? 'text-blue-400' : 'text-blue-600',
            success: isDarkMode ? 'text-green-400' : 'text-green-600',
            warning: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
            danger: isDarkMode ? 'text-red-400' : 'text-red-600',
            default: isDarkMode ? 'text-gray-400' : 'text-gray-600'
        };
        return baseColors[type as keyof typeof baseColors] || baseColors.default;
    };

    // Icono según el tipo
    const getIcon = (type: string, size = 16) => {
        const iconClass = getTypeTextColor(type);
        switch (type) {
            case 'info': return <Info className={iconClass} size={size} />;
            case 'success': return <Check className={iconClass} size={size} />;
            case 'warning': return <AlertTriangle className={iconClass} size={size} />;
            case 'danger': return <AlertCircle className={iconClass} size={size} />;
            default: return <Bell className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} size={size} />;
        }
    };

    // Componente de modal como panel lateral
    const NotificationDetailPanel = () => {
        if (!selectedNotification) return null;

        const typeColor = getTypeTextColor(selectedNotification.type);
        const typeBgColor = getTypeColor(selectedNotification.type);

        return (
            <div
                className={`fixed inset-y-0 right-0 z-20 flex transition-all duration-300 ease-in-out ${modalOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Panel lateral */}
                <div
                    className={`w-96 h-full flex flex-col shadow-xl transition-all duration-300 ${isDarkMode
                            ? 'bg-black border-l border-gray-800'
                            : 'bg-white border-l border-gray-200'
                        } ${modalAnimate ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
                >
                    {/* Indicador de tipo en la parte superior */}
                    <div className={`h-1 w-full ${typeBgColor}`} />

                    {/* Header */}
                    <div className="pt-6 pb-3 flex flex-col px-6">
                        <div className="flex items-center justify-between mb-6">
                            <button
                                onClick={() => setModalOpen(false)}
                                className={`flex items-center gap-2 transition-colors ${isDarkMode
                                        ? 'text-gray-500 hover:text-white'
                                        : 'text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                <ArrowLeft size={18} />
                                <span className="text-xs">Volver</span>
                            </button>

                            <div className={`text-xs font-medium ${typeColor} flex items-center gap-2`}>
                                {getIcon(selectedNotification.type, 14)}
                                {selectedNotification.type}
                            </div>
                        </div>

                        <h2 className={`text-lg font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>{selectedNotification.title}</h2>

                        <div className={`flex items-center gap-4 text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'
                            }`}>
                            <span>{selectedNotification.creator_name}</span>
                            <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(selectedNotification.created_at).toLocaleString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    </div>

                    {/* Separador sutil */}
                    <div className={`h-px w-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-200'
                        }`} />

                    {/* Contenido con scroll */}
                    <div className="px-6 py-6 overflow-y-auto flex-grow">
                        {/* Badges informativos */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <div className={`inline-flex px-2 py-1 rounded-md text-xs font-medium bg-opacity-10 ${selectedNotification.importance === 'high'
                                    ? isDarkMode ? 'bg-red-900 text-red-400' : 'bg-red-100 text-red-700'
                                    : selectedNotification.importance === 'medium'
                                        ? isDarkMode ? 'bg-yellow-900 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                                        : isDarkMode ? 'bg-blue-900 text-blue-400' : 'bg-blue-100 text-blue-700'
                                }`}>
                                {selectedNotification.importance}
                            </div>
                            {/* Eliminado: device y category badges */}
                        </div>

                        {/* Descripción */}
                        <div className="mb-8">
                            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>{selectedNotification.description}</p>
                        </div>

                        {/* Información adicional */}
                        {selectedNotification.data && Object.keys(selectedNotification.data).length > 0 && (
                            <div className="mt-6">
                                <h4 className={`text-xs uppercase tracking-wider mb-3 font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                    }`}>Detalles</h4>
                                <div className={`rounded-md ${isDarkMode ? 'bg-gray-900/30' : 'bg-gray-50'
                                    }`}>
                                    {Object.entries(selectedNotification.data ?? {}).map(([key, value], index) => (
                                        <div
                                            key={key}
                                            className={`py-3 px-4 flex items-center justify-between ${index !== Object.entries(selectedNotification.data ?? {}).length - 1
                                                    ? isDarkMode ? 'border-b border-gray-800/50' : 'border-b border-gray-200/50'
                                                    : ''
                                                }`}
                                        >
                                            <span className={`text-xs capitalize ${isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                                }`}>{key.replace(/_/g, ' ')}</span>
                                            <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                }`}>
                                                {Array.isArray(value) ? value.join(', ') : value.toString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer con acciones */}
                    <div className={`px-6 py-4 border-t flex items-center justify-end ${isDarkMode
                            ? 'bg-black border-gray-900'
                            : 'bg-white border-gray-200'
                        }`}>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className={`flex flex-col w-full max-w-sm ml-auto rounded-lg overflow-hidden shadow-xl border transition-all duration-500 transform ${isDarkMode
                    ? 'bg-black text-white border-gray-900'
                    : 'bg-white text-gray-900 border-gray-200'
                } ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                {/* Barra superior minimalista */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4">
                    <h1 className="text-base font-medium">Notificaciones</h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setDoNotDisturb(!doNotDisturb)}
                            title={doNotDisturb ? 'Desactivar modo No Molestar' : 'Activar modo No Molestar'}
                            className={`p-2 rounded-full transition-colors ${doNotDisturb
                                    ? isDarkMode
                                        ? 'bg-purple-900/30 text-purple-400'
                                        : 'bg-purple-100 text-purple-600'
                                    : isDarkMode
                                        ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Moon size={16} />
                        </button>
                        {onClose && (
                            <button
                                title='Cerrar panel'
                                onClick={onClose}
                                className={`p-2 rounded-full transition-colors ${isDarkMode
                                        ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300'
                                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filtros minimal */}
                <div className="px-5 relative">
                    <div className="flex space-x-4 relative">
                        {['all', 'unread', 'security', 'system'].map((filter) => (
                            <button
                                key={filter}
                                className={`py-2 text-xs font-medium transition-colors ${activeFilter === filter
                                        ? isDarkMode ? 'text-white' : 'text-gray-900'
                                        : isDarkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                onClick={() => setActiveFilter(filter)}
                            >
                                {filter === 'all' ? 'Todas' :
                                    filter === 'unread' ? 'No leídas' :
                                        filter === 'security' ? 'Seguridad' : 'Sistema'}

                                {activeFilter === filter && (
                                    <span className={`absolute bottom-0 left-0 w-full h-0.5 rounded-full ${isDarkMode ? 'bg-white' : 'bg-gray-900'
                                        }`} />
                                )}
                            </button>
                        ))}
                    </div>
                    <div className={`absolute bottom-0 left-0 right-0 h-px ${isDarkMode ? 'bg-gray-900' : 'bg-gray-200'
                        }`} />
                </div>

                {/* Lista de notificaciones */}
                <div className="notifications-list overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="relative w-8 h-8">
                                <div className={`absolute top-0 left-0 w-full h-full border-2 rounded-full ${isDarkMode ? 'border-gray-900' : 'border-gray-200'
                                    }`}></div>
                                <div className={`absolute top-0 left-0 w-full h-full border-2 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin ${isDarkMode ? 'border-t-gray-400' : 'border-t-gray-600'
                                    }`}></div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* No leídas */}
                            {unreadNotifications.length === 0 && readNotifications.length === 0 && (
                                <div className={`flex flex-col items-center justify-center py-16 ${isDarkMode ? 'text-gray-700' : 'text-gray-500'
                                    }`}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
                                        }`}>
                                        <Bell size={20} strokeWidth={1.5} className={
                                            isDarkMode ? 'text-gray-600' : 'text-gray-400'
                                        } />
                                    </div>
                                    <p className="text-xs">No hay notificaciones</p>
                                </div>
                            )}
                            {unreadNotifications.map((notification, idx) => (
                                <div
                                    key={notification.id ?? `notification-${idx}`}
                                    className={`notification-item px-5 py-4 cursor-pointer transition-colors ${isDarkMode
                                            ? 'bg-gray-900/20 hover:bg-gray-900/40'
                                            : 'bg-gray-50/50 hover:bg-gray-100/70'
                                        }`}
                                    onClick={() => openModal(notification)}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className={`flex-shrink-0 mt-1 w-2 h-2 rounded-full ${getTypeColor(notification.type)}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <p className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                                    }`}>{notification.title}</p>
                                                <p className={`ml-2 text-xs ${isDarkMode ? 'text-gray-700' : 'text-gray-500'
                                                    }`}>{formatRelativeTime(notification.created_at)}</p>
                                            </div>
                                            <p className={`text-xs mt-1 line-clamp-1 ${isDarkMode ? 'text-gray-600' : 'text-gray-600'
                                                }`}>{notification.description}</p>
                                            <div className="flex mt-2 items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs ${notification.importance === 'high'
                                                            ? isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-700'
                                                            : notification.importance === 'medium'
                                                                ? isDarkMode ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                                                                : isDarkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                                                        }`}>{notification.importance}</span>
                                                </div>
                                                <button
                                                    className={`p-1 rounded-full transition-colors ${isDarkMode
                                                            ? 'hover:bg-gray-800 text-red-400 hover:text-white'
                                                            : 'hover:bg-gray-200 text-red-500 hover:text-red-700'
                                                        }`}
                                                    title="Borrar notificación"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            await deleteNotification(notification.id);
                                                            await refresh(); // Refresca el estado global tras borrar
                                                        } catch (err) {
                                                            console.error('Error al borrar notificación:', err);
                                                        }
                                                    }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className={`mt-1 flex-shrink-0 ${isDarkMode ? 'text-gray-700' : 'text-gray-400'
                                            }`} />
                                    </div>
                                </div>
                            ))}
                            {/* Leídas en desplegable */}
                            {readNotifications.length > 0 && (
                                <div className="mt-2">
                                    <button
                                        className={`w-full flex items-center justify-between px-4 py-2 text-xs border rounded transition-colors mb-1 ${isDarkMode
                                                ? 'bg-black/60 hover:bg-gray-900 border-gray-800'
                                                : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                                            }`}
                                        onClick={() => setShowRead(v => !v)}
                                    >
                                        <span className="font-medium">{showRead ? 'Ocultar' : 'Mostrar'} notificaciones leídas</span>
                                        <ChevronRight size={14} className={`transition-transform ${showRead ? 'rotate-90' : ''}`} />
                                        <span className={`ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                            }`}>({readNotifications.length})</span>
                                    </button>
                                    {showRead && (
                                        <div className="space-y-1">
                                            {readNotifications.map((notification, idx) => (
                                                <div
                                                    key={notification.id ?? `notification-read-${idx}`}
                                                    className={`notification-item px-3 py-1 cursor-pointer transition-colors rounded flex items-center min-h-[28px] ${isDarkMode
                                                            ? 'bg-black/40 hover:bg-gray-900/40'
                                                            : 'bg-gray-50/60 hover:bg-gray-100/80'
                                                        }`}
                                                    style={{ fontSize: '11px', lineHeight: '1.1' }}
                                                    onClick={() => openModal(notification)}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${getTypeColor(notification.type)}`} />
                                                    <span className={`truncate flex-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'
                                                        }`}>{notification.title}</span>
                                                    <span className={`ml-2 ${isDarkMode ? 'text-gray-700' : 'text-gray-500'
                                                        }`}>{formatRelativeTime(notification.created_at)}</span>
                                                    <button
                                                        className={`ml-2 p-1 rounded-full transition-colors ${isDarkMode
                                                                ? 'hover:bg-gray-800 text-red-400 hover:text-white'
                                                                : 'hover:bg-gray-200 text-red-500 hover:text-red-700'
                                                            }`}
                                                        title="Borrar notificación"
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            try {
                                                                await deleteNotification(notification.id);
                                                                await refresh(); // Refresca el estado global tras borrar
                                                            } catch (err) {
                                                                console.error('Error al borrar notificación:', err);
                                                            }
                                                        }}
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <style jsx>{`
                    .notifications-list {
                        max-height: 440px;
                        scrollbar-width: none;
                    }
                    
                    .notifications-list::-webkit-scrollbar {
                        display: none;
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }

                    .notification-item {
                        animation: fadeIn 0.2s ease-out forwards;
                    }

                    .notification-item:nth-child(1) { animation-delay: 50ms; }
                    .notification-item:nth-child(2) { animation-delay: 100ms; }
                    .notification-item:nth-child(3) { animation-delay: 150ms; }
                    .notification-item:nth-child(4) { animation-delay: 200ms; }
                    .notification-item:nth-child(5) { animation-delay: 250ms; }
                `}</style>
            </div>

            {/* Panel de detalle lateral en lugar de modal */}
            <NotificationDetailPanel />
        </>
    );
}