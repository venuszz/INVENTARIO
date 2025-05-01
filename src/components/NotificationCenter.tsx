import { useState } from 'react';
import { Bell, Check, AlertCircle, Info, X, ChevronRight, AlertTriangle } from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import Cookies from 'js-cookie';

export default function NotificationsPanel({ onClose }: { onClose?: () => void }) {
    const [activeFilter, setActiveFilter] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [animateIn, setAnimateIn] = useState(false);

    const { notifications, loading, markAsRead } = useNotifications();
    const userRole = JSON.parse(Cookies.get('userData') || '{}').rol;

    // Activar animación después del montaje
    useState(() => {
        setAnimateIn(true);
    });

    // Filtrar notificaciones según la selección
    const filteredNotifications = notifications.filter(notification => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'unread') return !notification.is_read;
        return notification.category === activeFilter;
    });

    // Marcar como leída
    const handleMarkAsRead = async (id: number, event: { stopPropagation: () => void }) => {
        event.stopPropagation();
        try {
            await markAsRead(id);
        } catch (error) {
            console.error('Error al marcar como leída:', error);
        }
    };

    // Abrir modal
    const openModal = (notification: Notification) => {
        setSelectedNotification(notification);
        setModalOpen(true);
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
        if (diffMins < 60) return `hace ${diffMins}m`;
        if (diffHours < 24) return `hace ${diffHours}h`;
        if (diffDays < 7) return `hace ${diffDays}d`;

        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
        });
    };

    // Icono según el tipo
    const getIcon = (type: string, size = 16) => {
        switch (type) {
            case 'info': return <Info className="text-blue-400" size={size} />;
            case 'success': return <Check className="text-green-400" size={size} />;
            case 'warning': return <AlertTriangle className="text-yellow-400" size={size} />;
            case 'danger': return <AlertCircle className="text-red-400" size={size} />;
            default: return <Bell size={size} />;
        }
    };

    // Componente de modal
    const NotificationModal = () => {
        if (!selectedNotification) return null;

        return (
            <div className={`fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 transition-opacity duration-300 ${modalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div
                    className={`bg-gray-900 w-full max-w-md rounded-xl overflow-hidden shadow-2xl transition-all duration-500 transform ${modalOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-800">
                        <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                selectedNotification.type === 'info' ? 'bg-blue-900' :
                                selectedNotification.type === 'success' ? 'bg-green-900' :
                                selectedNotification.type === 'warning' ? 'bg-yellow-900' :
                                'bg-red-900'
                            }`}>
                                {getIcon(selectedNotification.type, 20)}
                            </div>
                            <h3 className="font-medium">{selectedNotification.title}</h3>
                        </div>
                        <button
                            title='Cerrar'
                            onClick={() => setModalOpen(false)}
                            className="p-1 rounded-full hover:bg-gray-800 transition-colors duration-200"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        <p className="text-gray-300 mb-4">{selectedNotification.description}</p>

                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="bg-gray-800 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Categoría</p>
                                <p className="text-sm">{selectedNotification.category}</p>
                            </div>
                            <div className="bg-gray-800 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Importancia</p>
                                <p className="text-sm">{selectedNotification.importance}</p>
                            </div>
                            <div className="bg-gray-800 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Dispositivo</p>
                                <p className="text-sm">{selectedNotification.device}</p>
                            </div>
                            <div className="bg-gray-800 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Fecha</p>
                                <p className="text-sm">{new Date(selectedNotification.created_at).toLocaleString('es-ES')}</p>
                            </div>
                        </div>

                        {/* Información del creador */}
                        <div className="bg-gray-800 p-3 rounded-lg mb-4">
                            <p className="text-xs text-gray-500 mb-1">Creado por</p>
                            <p className="text-sm">{selectedNotification.created_by} ({selectedNotification.created_by_role})</p>
                        </div>

                        {/* Datos adicionales */}
                        {selectedNotification.data && Object.keys(selectedNotification.data).length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-sm font-medium mb-2 text-gray-400">Información adicional</h4>
                                <div className="bg-black rounded-lg p-3 overflow-x-auto">
                                    {Object.entries(selectedNotification.data).map(([key, value]) => (
                                        <div key={key} className="flex mb-1 text-sm">
                                            <span className="text-gray-500 w-1/3">{key}:</span>
                                            <span className="text-gray-300">
                                                {Array.isArray(value) ? value.join(', ') : value.toString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-800 p-4 flex justify-end">
                        <button
                            onClick={() => {
                                handleMarkAsRead(selectedNotification.id, { stopPropagation: () => { } });
                                setModalOpen(false);
                            }}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                        >
                            Aceptar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`flex flex-col w-full max-w-md mx-auto rounded-3xl overflow-hidden bg-black text-white shadow-2xl transition-all duration-500 transform ${animateIn ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            {/* Barra superior */}
            <div className="px-4 pt-6 pb-2 bg-black flex justify-between items-center">
                <h1 className="text-xl font-bold">Notificaciones</h1>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-900 hover:bg-gray-800 transition-colors duration-200"
                        title="Cerrar"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Filtros con indicador deslizante */}
            <div className="px-4 py-3 relative">
                <div className="flex space-x-4 relative z-10">
                    <button
                        className={`text-sm relative ${activeFilter === 'all' ? 'text-white' : 'text-gray-500'}`}
                        onClick={() => setActiveFilter('all')}
                    >
                        Todas
                        {activeFilter === 'all' && (
                            <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-white rounded-full" />
                        )}
                    </button>
                    <button
                        className={`text-sm relative ${activeFilter === 'unread' ? 'text-white' : 'text-gray-500'}`}
                        onClick={() => setActiveFilter('unread')}
                    >
                        No leídas
                        {activeFilter === 'unread' && (
                            <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-white rounded-full" />
                        )}
                    </button>
                    <button
                        className={`text-sm relative ${activeFilter === 'security' ? 'text-white' : 'text-gray-500'}`}
                        onClick={() => setActiveFilter('security')}
                    >
                        Seguridad
                        {activeFilter === 'security' && (
                            <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-white rounded-full" />
                        )}
                    </button>
                    <button
                        className={`text-sm relative ${activeFilter === 'system' ? 'text-white' : 'text-gray-500'}`}
                        onClick={() => setActiveFilter('system')}
                    >
                        Sistema
                        {activeFilter === 'system' && (
                            <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-white rounded-full" />
                        )}
                    </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-900" />
            </div>

            {/* Lista de notificaciones */}
            <div className="notifications-list overflow-y-auto bg-black">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="relative w-12 h-12">
                            <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-800 rounded-full"></div>
                            <div className="absolute top-0 left-0 w-full h-full border-4 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                        </div>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                        <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center mb-4">
                            <Bell size={28} strokeWidth={1.5} />
                        </div>
                        <p className="text-sm">No hay notificaciones</p>
                    </div>
                ) : (
                    <div className="space-y-px">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`notification-item p-4 ${notification.is_read ? 'bg-black' : 'bg-gray-900'} cursor-pointer transition-all duration-300 hover:bg-gray-800 transform hover:scale-[0.995] active:scale-[0.99]`}
                                onClick={() => openModal(notification)}
                            >
                                <div className="flex items-start space-x-3">
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                        notification.type === 'info' ? 'bg-blue-900 bg-opacity-30' :
                                        notification.type === 'success' ? 'bg-green-900 bg-opacity-30' :
                                        notification.type === 'warning' ? 'bg-yellow-900 bg-opacity-30' :
                                        'bg-red-900 bg-opacity-30'
                                    }`}>
                                        {getIcon(notification.type, 18)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <p className={`text-sm font-medium truncate ${notification.is_read ? 'text-gray-400' : 'text-white'}`}>
                                                {notification.title}
                                            </p>
                                            <p className="ml-2 text-xs text-gray-600 whitespace-nowrap">
                                                {formatRelativeTime(notification.created_at)}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                            {notification.description}
                                        </p>
                                        <div className="flex mt-2 items-center justify-between">
                                            <div className="flex items-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                                                    notification.importance === 'high' ? 'bg-red-900 bg-opacity-20 text-red-400' :
                                                    notification.importance === 'medium' ? 'bg-yellow-900 bg-opacity-20 text-yellow-400' :
                                                    'bg-blue-900 bg-opacity-20 text-blue-400'
                                                }`}>
                                                    {notification.importance}
                                                </span>
                                                <span className="ml-2 text-xs text-gray-600">{notification.device}</span>
                                            </div>

                                            {!notification.is_read && (userRole === 'admin' || userRole === 'superadmin') && (
                                                <button
                                                    className="text-gray-500 hover:text-white transition-colors duration-200"
                                                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                    title="Marcar como leída"
                                                >
                                                    <Check size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <ChevronRight size={16} className="text-gray-600 mt-1 flex-shrink-0" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de detalle */}
            <NotificationModal />

            <style jsx>{`
                .notifications-list {
                    max-height: 500px;
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .notification-item {
                    animation-name: fadeInUp;
                    animation-duration: 0.4s;
                    animation-timing-function: ease-out;
                    animation-fill-mode: forwards;
                }

                .notification-item:nth-child(1) { animation-delay: 0ms; }
                .notification-item:nth-child(2) { animation-delay: 100ms; }
                .notification-item:nth-child(3) { animation-delay: 200ms; }
                .notification-item:nth-child(4) { animation-delay: 300ms; }
                .notification-item:nth-child(5) { animation-delay: 400ms; }
            `}</style>
        </div>
    );
}