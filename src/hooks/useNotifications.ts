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
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setNotifications(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar notificaciones');
        } finally {
            setLoading(false);
        }
    };

    const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'is_read' | 'created_by' | 'created_by_role'>) => {
        if (!userRole || userRole === 'superadmin') {
            throw new Error('No tienes permisos para crear notificaciones');
        }
        if (!userId) {
            throw new Error('No se encontró el id del usuario autenticado');
        }

        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert([{
                    ...notification,
                    is_read: false,
                    created_by: userId
                }])
                .select();

            if (error) throw error;

            await fetchNotifications();
            return data?.[0];
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Error al crear la notificación');
        }
    };

    const markAsRead = async (id: number) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;

            setNotifications(notifications.map(notification =>
                notification.id === id ? { ...notification, is_read: true } : notification
            ));
        } catch (err) {
            throw new Error(err instanceof Error ? err.message : 'Error al marcar como leída');
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    return {
        notifications,
        loading,
        error,
        createNotification,
        markAsRead,
        refresh: fetchNotifications
    };
}