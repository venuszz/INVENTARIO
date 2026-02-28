import { useState, useEffect } from 'react';
import supabase from '@/app/lib/supabase/client';

interface ApprovalStatus {
  isApproved: boolean;
  isPending: boolean;
}

export function useUserApprovalMonitoring(
  userId: string | null
): ApprovalStatus {
  const [isApproved, setIsApproved] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!userId) {
      setIsPending(false);
      setIsApproved(false);
      return;
    }

    setIsPending(true);

    const checkUserStatus = async () => {
      try {
        const response = await fetch(
          `/api/auth/check-status?userId=${userId}`
        );
        const result = await response.json();

        if (result.success && result.is_active && !result.pending_approval) {
          setIsApproved(true);
          setIsPending(false);
          localStorage.removeItem('pending_user_id');
        }
      } catch (err) {
        console.error('Error checking user status:', err);
      }
    };

    // Initial check
    checkUserStatus();

    // Polling every 3 seconds
    const pollInterval = setInterval(checkUserStatus, 3000);

    // Realtime subscription
    const channel = supabase
      .channel(`user-status-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          const newData = payload.new as {
            is_active: boolean;
            pending_approval: boolean;
          };
          if (newData.is_active && !newData.pending_approval) {
            setIsApproved(true);
            setIsPending(false);
            localStorage.removeItem('pending_user_id');
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { isApproved, isPending };
}
