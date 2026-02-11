import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { PendingUser } from '../types';
import supabase from '@/app/lib/supabase/client';

type FilterType = 'all' | 'oauth' | 'local';

export function usePendingUsers() {
    const { user, isLoading: sessionLoading } = useSession();
    const router = useRouter();
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingUserId, setProcessingUserId] = useState<string | null>(null);
    const [selectedRol, setSelectedRol] = useState<{ [key: string]: string }>({});
    const [filterType, setFilterType] = useState<FilterType>('all');

    useEffect(() => {
        const checkAuth = async () => {
            if (sessionLoading) return;

            if (!user) {
                router.push('/login');
                return;
            }

            if (user.rol !== 'superadmin') {
                router.push('/');
                return;
            }

            await loadPendingUsers();
        };
        checkAuth();
    }, [router, user, sessionLoading]);

    useEffect(() => {
        if (!sessionLoading && user?.rol === 'superadmin') {
            loadPendingUsers();
        }
    }, [filterType]);

    // Realtime subscription
    useEffect(() => {
        if (!user || user.rol !== 'superadmin') return;

        const channel = supabase
            .channel('pending-users-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'users',
                    filter: 'pending_approval=eq.true'
                },
                () => {
                    loadPendingUsers();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, filterType]);

    const loadPendingUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/pending-users?type=${filterType}`);
            const result = await response.json();

            if (!response.ok) {
                console.error('Error cargando usuarios:', result.error);
            } else {
                const data = result.users || [];
                setPendingUsers(data);
                if (data.length > 0 && !selectedUser) {
                    setSelectedUser(data[0]);
                }

                const initialRoles: { [key: string]: string } = {};
                (data as PendingUser[]).forEach(user => {
                    initialRoles[user.id] = 'usuario';
                });
                setSelectedRol(initialRoles);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'approve' | 'reject') => {
        if (!selectedUser) return;
        const userId = selectedUser.id;

        if (action === 'approve' && !selectedRol[userId]) {
            alert('Selecciona un rol');
            return;
        }

        if (action === 'reject' && !confirm('¿Rechazar usuario permanentemente?')) {
            return;
        }

        setProcessingUserId(userId);

        try {
            const response = await fetch('/api/admin/approve-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    rol: action === 'approve' ? selectedRol[userId] : undefined,
                    action,
                }),
            });

            if (response.ok) {
                const updatedList = pendingUsers.filter(u => u.id !== userId);
                setPendingUsers(updatedList);
                setSelectedUser(updatedList.length > 0 ? updatedList[0] : null);
            } else {
                const result = await response.json();
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Falló la operación');
        } finally {
            setProcessingUserId(null);
        }
    };

    return {
        pendingUsers,
        selectedUser,
        setSelectedUser,
        loading,
        processingUserId,
        selectedRol,
        setSelectedRol,
        handleAction,
        filterType,
        setFilterType
    };
}
