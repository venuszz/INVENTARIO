import { useQuery } from '@tanstack/react-query';
import { fetchColors } from '@/lib/api/colors';

/**
 * React Query hook for fetching colors
 * 
 * This hook provides automatic caching, loading states, and error handling
 * for the colors API endpoint. Colors are cached for 5 minutes and remain
 * in cache for 10 minutes after the last usage.
 * 
 * @returns UseQueryResult with colors data, loading state, and error
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { data, isLoading, error } = useColorsQuery();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   
 *   return (
 *     <ul>
 *       {data?.colors.map(color => (
 *         <li key={color.id}>{color.nombre}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useColorsQuery() {
  return useQuery({
    queryKey: ['colors'],
    queryFn: fetchColors,
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 min
    gcTime: 10 * 60 * 1000, // 10 minutes - cache persists for 10 min (formerly cacheTime)
    retry: 2, // Retry failed requests twice
  });
}
