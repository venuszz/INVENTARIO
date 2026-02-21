import { useState } from 'react';

interface UseInconsistencyActionsReturn {
  keepOneDirector: (areaId: number, directorId: number) => Promise<void>;
  removeAreaFromDirector: (areaId: number, directorId: number) => Promise<void>;
  deleteDirector: (directorId: number, option?: string, targetDirectorId?: number) => Promise<void>;
  deleteArea: (areaId: number) => Promise<void>;
  isExecuting: boolean;
  error: string | null;
}

export function useInconsistencyActions(): UseInconsistencyActionsReturn {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const keepOneDirector = async (areaId: number, directorIdToKeep: number) => {
    setIsExecuting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/directorio/resolve-inconsistency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'keep_one_director',
          areaId,
          directorIdToKeep,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al resolver área duplicada');
      }

      // Show batched notification for large operations (>20 changes)
      if (data.bienesTransferidos && data.bienesTransferidos > 20) {
        const { sileo } = await import('sileo');
        const { CheckCircle2 } = await import('lucide-react');
        sileo.show({
          title: 'Área duplicada resuelta',
          description: `${data.bienesTransferidos} bienes transferidos exitosamente`,
          duration: 5000,
          icon: CheckCircle2({ className: 'w-4 h-4 text-white' }),
          fill: '#16a34a',
          position: 'top-right',
          styles: {
            title: '!text-white',
            description: '!text-white/70',
          },
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al mantener director';
      setError(message);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  const removeAreaFromDirector = async (areaId: number, directorId: number) => {
    setIsExecuting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/directorio/resolve-inconsistency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'remove_area_from_director',
          areaId,
          directorId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al remover área');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al remover área';
      setError(message);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  const deleteDirector = async (directorId: number, option?: string, targetDirectorId?: number) => {
    setIsExecuting(true);
    setError(null);

    try {
      // If reassign_areas option is selected, use reassign_areas action
      if (option === 'reassign_areas' && targetDirectorId) {
        const response = await fetch('/api/admin/directorio/resolve-inconsistency', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'reassign_areas',
            directorId,
            targetDirectorId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al reasignar áreas');
        }

        // Show batched notification for area reassignment
        if (data.areasReasignadas) {
          const { sileo } = await import('sileo');
          const { CheckCircle2 } = await import('lucide-react');
          sileo.show({
            title: 'Áreas reasignadas',
            description: `${data.areasReasignadas} áreas transferidas exitosamente`,
            duration: 5000,
            icon: CheckCircle2({ className: 'w-4 h-4 text-white' }),
            fill: '#16a34a',
            position: 'top-right',
            styles: {
              title: '!text-white',
              description: '!text-white/70',
            },
          });
        }
      } else {
        // Default delete_director action
        const response = await fetch('/api/admin/directorio/resolve-inconsistency', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'delete_director',
            directorId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al eliminar director');
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar director';
      setError(message);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  const deleteArea = async (areaId: number) => {
    setIsExecuting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/directorio/resolve-inconsistency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete_area',
          areaId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar área');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar área';
      setError(message);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    keepOneDirector,
    removeAreaFromDirector,
    deleteDirector,
    deleteArea,
    isExecuting,
    error,
  };
}

