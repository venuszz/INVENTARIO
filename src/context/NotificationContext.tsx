"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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
    creator_name?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    loading: boolean;
    error: string | null;
    doNotDisturb: boolean;
    setDoNotDisturb: (value: boolean) => void;
    createNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'is_read' | 'created_by' | 'created_by_role'>) => Promise<any>;
    markAsRead: (id: number) => Promise<void>;
    deleteNotification: (id: number) => Promise<void>;
    refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [doNotDisturb, setDoNotDisturb] = useState(false);
    const [initialized, setInitialized] = useState(false);

    const [userData, setUserData] = useState<any>(null);

    // Initial load from localStorage and cookies
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('doNotDisturb');
            if (saved !== null) {
                setDoNotDisturb(JSON.parse(saved));
            }

            const cookieData = Cookies.get('userData');
            if (cookieData) {
                try {
                    setUserData(JSON.parse(cookieData));
                } catch (e) {
                    console.error("Error parsing userData cookie", e);
                }
            }
            setInitialized(true);
        }
    }, []);

    // Monitor cookie changes for login/logout (simple polling)
    useEffect(() => {
        const interval = setInterval(() => {
            const cookieData = Cookies.get('userData');
            if (!cookieData) {
                if (userData !== null) setUserData(null);
                return;
            }
            try {
                const parsed = JSON.parse(cookieData);
                if (JSON.stringify(parsed) !== JSON.stringify(userData)) {
                    setUserData(parsed);
                }
            } catch (e) {
                // Ignore parse errors
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [userData]);

    const userId = userData?.id;
    const userRole = userData?.rol;

    // Persist DND to localStorage
    useEffect(() => {
        if (initialized && typeof window !== 'undefined') {
            localStorage.setItem('doNotDisturb', JSON.stringify(doNotDisturb));
        }
    }, [doNotDisturb, initialized]);

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const { data: notificationsData, error: notificationsError } = await supabase
                .rpc('get_admin_notifications', { admin_uuid: userId });

            if (notificationsError) throw notificationsError;

            const userIds = [...new Set((notificationsData as { created_by: string }[] || []).map(n => n.created_by))];

            let userMap: Record<string, string> = {};
            if (userIds.length > 0) {
                const { data: usersData, error: usersError } = await supabase
                    .from('users')
                    .select('id, first_name, last_name')
                    .in('id', userIds);

                if (usersError) throw usersError;

                userMap = ((usersData || []) as { id: string; first_name: string; last_name: string }[]).reduce((acc: Record<string, string>, user) => {
                    acc[user.id] = `${user.first_name} ${user.last_name}`.trim();
                    return acc;
                }, {});
            }

            const notificationsWithUsers = (notificationsData || []).map((notification: any) => ({
                ...notification,
                id: notification.notification_id ?? notification.id,
                creator_name: userMap[notification.created_by] || 'Usuario desconocido'
            }));

            setNotifications(notificationsWithUsers);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError(err instanceof Error ? err.message : 'Error al cargar notificaciones');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            fetchNotifications();
            const interval = setInterval(() => {
                fetchNotifications();
            }, 30000); // 30 segundos entre actualizaciones automáticas
            return () => clearInterval(interval);
        } else {
            setNotifications([]);
        }
    }, [userId, fetchNotifications]);

    const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'is_read' | 'created_by' | 'created_by_role'>) => {
        if (!userRole || (userRole !== 'admin' && userRole !== 'usuario')) return null;
        if (!userId) throw new Error('No se encontró el id del usuario autenticado');

        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert([{ ...notification }])
                .select();

            if (error) throw error;
            await fetchNotifications();
            return data?.[0];
        } catch (err) {
            console.error('Error al crear la notificación:', err);
            throw err;
        }
    };

    const markAsRead = async (id: number) => {
        if (!userId) throw new Error('No se encontró el id del usuario autenticado');
        try {
            const { error } = await supabase
                .from('admin_notification_states')
                .update({ is_read: true })
                .eq('notification_id', id)
                .eq('admin_id', userId);

            if (error) throw error;

            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error('Error marking as read:', err);
            throw err;
        }
    };

    const deleteNotification = async (id: number) => {
        if (!userId) throw new Error('No se encontró el id del usuario autenticado');
        try {
            const { error } = await supabase
                .from('admin_notification_states')
                .update({ is_deleted: true })
                .eq('notification_id', id)
                .eq('admin_id', userId);

            if (error) throw error;
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Error deleting notification:', err);
            throw err;
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            loading,
            error,
            doNotDisturb,
            setDoNotDisturb,
            createNotification,
            markAsRead,
            deleteNotification,
            refresh: fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
