import { useQuery } from '@tanstack/react-query';
import { fetchAuthSession } from '@/lib/api/auth';

/**
 * React Query hook for checking authentication session
 * 
 * This hook provides automatic caching and revalidation of the user's
 * authentication status. The session is cached for 2 minutes and automatically
 * revalidated when the user returns to the window (refetchOnWindowFocus).
 * 
 * The pathname parameter is included in the query key to allow invalidation
 * when the route changes, ensuring auth is checked on navigation.
 * 
 * @param pathname - Optional current pathname to invalidate cache on route change
 * @returns UseQueryResult with auth session data, loading state, and error
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const pathname = usePathname();
 *   const { data, isLoading } = useAuthQuery(pathname);
 *   
 *   if (isLoading) return <div>Checking auth...</div>;
 *   
 *   if (data?.isAuthenticated) {
 *     return <div>Welcome, {data.user?.email}</div>;
 *   }
 *   
 *   return <div>Please log in</div>;
 * }
 * ```
 */
export function useAuthQuery(pathname?: string) {
  return useQuery({
    queryKey: ['auth', 'session', pathname],
    queryFn: fetchAuthSession,
    staleTime: 2 * 60 * 1000, // 2 minutes - recheck auth frequently
    gcTime: 5 * 60 * 1000, // 5 minutes - cache persists (formerly cacheTime)
    retry: 1, // Only retry once for auth checks
    refetchOnWindowFocus: true, // Revalidate when user returns to window
  });
}
