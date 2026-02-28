import { useQuery } from '@tanstack/react-query';
import { fetchEstatus } from '@/lib/api/estatus';

/**
 * React Query hook for fetching estatus from config table
 * 
 * This hook provides automatic caching, loading states, and error handling
 * for the estatus API endpoint. Estatus values change rarely, so they are
 * cached for 10 minutes and remain in cache for 15 minutes after last usage.
 * 
 * @returns UseQueryResult with estatus data, loading state, and error
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { data, isLoading, error } = useEstatusQuery();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   
 *   return (
 *     <ul>
 *       {data?.estatus.map(status => (
 *         <li key={status.id}>{status.concepto}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useEstatusQuery() {
  return useQuery({
    queryKey: ['estatus'],
    queryFn: fetchEstatus,
    staleTime: 10 * 60 * 1000, // 10 minutes - estatus changes rarely
    gcTime: 15 * 60 * 1000, // 15 minutes - cache persists longer (formerly cacheTime)
    retry: 2, // Retry failed requests twice
  });
}
