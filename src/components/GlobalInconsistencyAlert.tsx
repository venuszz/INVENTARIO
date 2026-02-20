"use client";
import { usePathname } from 'next/navigation';
import { useAdminIndexation } from '@/hooks/indexation/useAdminIndexation';
import { useDirectorioStats } from '@/components/admin/directorio/hooks/useDirectorioStats';
import { useDirectorioInconsistencies } from '@/components/admin/directorio/hooks/useDirectorioInconsistencies';
import { InconsistencyAlert } from '@/components/admin/directorio/components/InconsistencyAlert';
import { useMemo } from 'react';

export default function GlobalInconsistencyAlert() {
    const pathname = usePathname();
    
    // Hook de indexación admin
    const { 
        directorio, 
        areas, 
        directorioAreas
    } = useAdminIndexation();
    
    // Get all directorio IDs for stats calculation
    const directorioIds = useMemo(
        () => directorio.map(d => d.id_directorio),
        [directorio]
    );
    
    // Hook para estadísticas
    const { stats: directorioStats } = useDirectorioStats(directorioIds);
    
    // Hook para detectar inconsistencias
    const { inconsistencies } = useDirectorioInconsistencies(
        directorio,
        areas,
        directorioAreas,
        directorioStats
    );
    
    // Determinar si estamos en la página de directorio
    const isInDirectorioPage = pathname === '/admin/personal';
    
    // Solo renderizar si hay inconsistencias
    if (inconsistencies.length === 0) return null;
    
    // Si estamos en la página de directorio, no renderizar (el componente local lo hace)
    if (isInDirectorioPage) return null;
    
    return <InconsistencyAlert inconsistencies={inconsistencies} isInDirectorioPage={false} />;
}
