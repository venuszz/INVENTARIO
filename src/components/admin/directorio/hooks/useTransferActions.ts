import { useState, useCallback, useRef } from 'react';
import { useAdminIndexation } from '@/hooks/indexation/useAdminIndexation';
import { useIneaIndexation } from '@/hooks/indexation/useIneaIndexation';
import { useIteaIndexation } from '@/hooks/indexation/useIteaIndexation';
import { useNoListadoIndexation } from '@/hooks/indexation/useNoListadoIndexation';
import type { TransferResult } from '../types/transfer';

/**
 * Hook for executing transfer operations and managing API interactions
 * 
 * Provides functions to:
 * - Transfer complete areas between directors
 * - Transfer partial bienes between directors
 * - Check for active resguardos in areas
 * - Invalidate caches after successful transfers
 */

interface UseTransferActionsReturn {
  transferCompleteArea: (
    sourceDirectorId: number,
    targetDirectorId: number,
    sourceAreaId: number,
    targetAreaId: number | null,
    userId: string
  ) => Promise<TransferResult>;

  transferPartialBienes: (
    sourceDirectorId: number,
    targetDirectorId: number,
    targetAreaId: number,
    bienIds: { inea: string[]; itea: string[]; no_listado: string[] },
    userId: string
  ) => Promise<TransferResult>;

  checkResguardos: (areaId: number) => Promise<number>;

  invalidateCaches: () => Promise<void>;

  isExecuting: boolean;
  error: string | null;
}

// Exponential backoff configuration for retries
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  multiplier: 2, // 1s, 2s, 4s
};

// Cache configuration for resguardo checks
const RESGUARDO_CACHE_TTL = 30000; // 30 seconds

interface ResguardoCache {
  [areaId: number]: {
    count: number;
    timestamp: number;
  };
}

export function useTransferActions(): UseTransferActionsReturn {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get cache invalidation functions from indexation hooks
  const { reindex: reindexAdmin } = useAdminIndexation();
  const { reindex: reindexInea } = useIneaIndexation();
  const { reindex: reindexItea } = useIteaIndexation();
  const { reindex: reindexNoListado } = useNoListadoIndexation();

  // Cache for resguardo checks
  const resguardoCacheRef = useRef<ResguardoCache>({});

  /**
   * Execute a function with exponential backoff retry logic
   */
  const withRetry = useCallback(async <T,>(
    fn: () => Promise<T>,
    context: string
  ): Promise<T> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < RETRY_CONFIG.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Unknown error');

        // Don't retry on the last attempt
        if (attempt < RETRY_CONFIG.maxAttempts - 1) {
          const delay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.multiplier, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }, []);

  /**
   * Invalidate all relevant caches after a successful transfer
   * This ensures the UI reflects updated data immediately
   */
  const invalidateCaches = useCallback(async () => {
    try {
      await reindexAdmin();
      await reindexInea();
      await reindexItea();
      await reindexNoListado();
      resguardoCacheRef.current = {};
    } catch {
      // Don't throw - cache invalidation failure shouldn't fail the transfer
    }
  }, [reindexAdmin, reindexInea, reindexItea, reindexNoListado]);

  /**
   * Transfer a complete area with all its bienes to a target director
   * @param targetAreaId - null or -1 to create new area, number to merge to existing area
   */
  const transferCompleteArea = useCallback(async (
    sourceDirectorId: number,
    targetDirectorId: number,
    sourceAreaId: number,
    targetAreaId: number | null,
    userId: string
  ): Promise<TransferResult> => {
    setIsExecuting(true);
    setError(null);

    try {
      const result = await withRetry(async () => {
        const response = await fetch('/api/admin/directorio/transfer-bienes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            action: 'transfer_complete_area',
            sourceDirectorId,
            targetDirectorId,
            sourceAreaId,
            targetAreaId,
            userId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Transfer failed');
        }

        return await response.json();
      }, 'transferCompleteArea');

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al transferir área completa';
      setError(errorMessage);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  }, [withRetry, invalidateCaches]);

  /**
   * Transfer selected bienes to an existing target director area
   */
  const transferPartialBienes = useCallback(async (
    sourceDirectorId: number,
    targetDirectorId: number,
    targetAreaId: number,
    bienIds: { inea: string[]; itea: string[]; no_listado: string[] },
    userId: string
  ): Promise<TransferResult> => {
    setIsExecuting(true);
    setError(null);

    try {
      const result = await withRetry(async () => {
        const response = await fetch('/api/admin/directorio/transfer-bienes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            action: 'transfer_partial_bienes',
            sourceDirectorId,
            targetDirectorId,
            targetAreaId,
            bienIds,
            userId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Transfer failed');
        }

        return await response.json();
      }, 'transferPartialBienes');

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al transferir bienes parciales';
      setError(errorMessage);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  }, [withRetry, invalidateCaches]);

  /**
   * Check for active resguardos in an area
   * Results are cached for 30 seconds to reduce API calls
   */
  const checkResguardos = useCallback(async (areaId: number): Promise<number> => {
    // Check cache first
    const cached = resguardoCacheRef.current[areaId];
    const now = Date.now();

    if (cached && (now - cached.timestamp) < RESGUARDO_CACHE_TTL) {
      return cached.count;
    }

    try {
      // TODO: Replace with actual API endpoint when available
      // For now, return 0 as placeholder
      const count = 0;

      // Update cache
      resguardoCacheRef.current[areaId] = {
        count,
        timestamp: now,
      };

      return count;

    } catch {
      return 0;
    }
  }, []);

  return {
    transferCompleteArea,
    transferPartialBienes,
    checkResguardos,
    invalidateCaches,
    isExecuting,
    error,
  };
}
