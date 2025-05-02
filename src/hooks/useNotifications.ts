import { useState, useEffect } from 'react';
import supabase from '@/app/lib/supabase/client';
import Cookies from 'js-cookie';

interface NotificationData {
    location?: string;
    browser?: string;
    os?: string;
    version?: string;
    changes?: string[];
    userId?: string;
    email?: string;
    errorCode?: string;
    connections?: number;
    affectedTables?: string[];
    ip?: string;
    is_deleted?: boolean;
}

export interface Notification {
    id: number;
    title: string;
    description: string;
    created_at: string;
    type: 'info' | 'success' | 'warning' | 'danger';
    category: string;
    device: string;
    importance: 'high' | 'medium' | 'low';
    is_read: boolean;
    data?: NotificationData;
    created_by: string;
    created_by_role: string;
    creator_name?: string; // Nuevo campo para el nombre del creador
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const userRole = JSON.parse(Cookies.get('userData') || '{}').rol;
    const userId = JSON.parse(Cookies.get('userData') || '{}').id;

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            // Obtener notificaciones con información del creador
            const { data: notificationsData, error: notificationsError } = await supabase
                .rpc('get_admin_notifications', { admin_uuid: userId });

            if (notificationsError) throw notificationsError;

            // Obtener información de usuarios
            const userIds = [...new Set((notificationsData as { created_by: string }[]).map(n => n.created_by))];
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('id, first_name, last_name')
                .in('id', userIds);

            if (usersError) throw usersError;

            // Mapear usuarios a un objeto para fácil acceso
            const userMap = ((usersData || []) as { id: string; first_name: string; last_name: string }[]).reduce((acc: Record<string, string>, user) => {
                acc[user.id] = `${user.first_name} ${user.last_name}`.trim();
                return acc;
            }, {});

            // Combinar notificaciones con nombres de usuarios y asegurar que el campo id sea el de notifications.id
            const notificationsWithUsers = notificationsData.map((notification: {
                notification_id?: number;
                id: number;
                created_by: string;
            } & Notification) => ({
                ...notification,
                id: notification.notification_id ?? notification.id,
                creator_name: userMap[notification.created_by] || 'Usuario desconocido'
            }));

            setNotifications(notificationsWithUsers);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar notificaciones');
        } finally {
            setLoading(false);
        }
    };

    const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'is_read' | 'created_by' | 'created_by_role'>) => {
        if (!userRole) {
            throw new Error('No se encontró el rol del usuario autenticado');
        }
        if (userRole !== 'admin' && userRole !== 'usuario') {
            // No hacer nada, no dejar rastro, no lanzar error
            return null;
        }
        if (!userId) {
            throw new Error('No se encontró el id del usuario autenticado');
        }

        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert([{
                    ...notification,
                    created_by: userId
                }])
                .select();

            if (error) {
                console.error('Error de Supabase al crear notificación:', error);
                throw error;
            }

            await fetchNotifications();
            return data?.[0];
        } catch (err) {
            console.error('Error al crear la notificación:', err);
            throw new Error(err instanceof Error ? err.message : JSON.stringify(err));
        }
    };

    const markAsRead = async (id: number) => {
        if (!userId) {
            console.error('[markAsRead] No se encontró el id del usuario autenticado. userId:', userId);
            throw new Error('No se encontró el id del usuario autenticado');
        }
        if (typeof id !== 'number' || isNaN(id)) {
            console.error('[markAsRead] ID inválido:', id);
            throw new Error('ID de notificación inválido');
        }
        console.log('[markAsRead] Intentando marcar como leída:', { notification_id: id, admin_id: userId });
        try {
            const { error, data } = await supabase
                .from('admin_notification_states')
                .update({ is_read: true })
                .eq('notification_id', id)
                .eq('admin_id', userId);
            console.log('[markAsRead] Respuesta de Supabase:', { error, data });
            if (error) {
                console.error('[markAsRead] Error de Supabase:', error);
                throw error;
            }
            setNotifications(notifications.map(notification =>
                notification.id === id ? { ...notification, is_read: true } : notification
            ));
            console.log('[markAsRead] Notificación marcada como leída en el estado local:', id);
        } catch (err) {
            console.error('[markAsRead] Error inesperado:', err);
            throw new Error(err instanceof Error ? err.message : 'Error al marcar como leída');
        }
    };

    // Eliminar notificación (marcar como is_deleted)
    const deleteNotification = async (id: number) => {
        if (!userId) {
            throw new Error('No se encontró el id del usuario autenticado');
        }
        try {
            const { error } = await supabase
                .from('admin_notification_states')
                .update({ is_deleted: true })
                .eq('notification_id', id)
                .eq('admin_id', userId);
            if (error) throw error;
            setNotifications(notifications.filter(notification => notification.id !== id));
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Error al borrar notificación');
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Polling para actualizar notificaciones cada 10 segundos
        const interval = setInterval(() => {
            fetchNotifications();
        }, 10000); // 10 segundos
        return () => clearInterval(interval);
    }, []);

    return {
        notifications,
        loading,
        error,
        createNotification,
        markAsRead,
        deleteNotification,
        refresh: fetchNotifications
    };
}