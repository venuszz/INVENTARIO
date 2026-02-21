"use client";
import { usePathname } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useAdminIndexation } from '@/hooks/indexation/useAdminIndexation';
import { useIndexationStore } from '@/stores/indexationStore';
import { useDirectorioStats } from '@/components/admin/directorio/hooks/useDirectorioStats';
import { useDirectorioInconsistencies } from '@/components/admin/directorio/hooks/useDirectorioInconsistencies';
import { InconsistencyAlert } from '@/components/admin/directorio/components/InconsistencyAlert';

export default function GlobalInconsistencyAlert() {
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    // Verificar si el usuario está autenticado
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/session', {
                    credentials: 'include'
                });
                const data = await response.json();
                setIsAuthenticated(data.isAuthenticated === true);
            } catch (error) {
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };
        
        checkAuth();
    }, [pathname]);
    
    // Determinar si debe mostrar basado en autenticación y ruta
    const shouldShow = isAuthenticated && 
                      pathname !== '/login' && 
                      pathname !== '/register' && 
                      pathname !== '/pending-approval';
    
    // Hook de indexación admin
    const { 
        directorio, 
        areas, 
        directorioAreas,
        isIndexed: adminIndexed
    } = useAdminIndexation();
    
    // Verificar que todos los módulos necesarios estén indexados
    // useDirectorioStats depende de: inea, itea, noListado, resguardos
    const modules = useIndexationStore(state => state.modules);
    const allModulesIndexed = useMemo(() => {
        const requiredModules = ['admin', 'inea', 'itea', 'noListado', 'resguardos'];
        return requiredModules.every(key => modules[key]?.isIndexed === true);
    }, [modules]);
    
    // Get all directorio IDs for stats calculation
    const directorioIds = useMemo(
        () => directorio.map(d => d.id_directorio),
        [directorio]
    );
    
    // Hook para estadísticas - solo se ejecuta si hay datos
    const { stats: directorioStats, areaStats } = useDirectorioStats(directorioIds);
    
    // Hook para detectar inconsistencias
    const { inconsistencies } = useDirectorioInconsistencies(
        directorio,
        areas,
        directorioAreas,
        directorioStats,
        areaStats
    );
    
    // No renderizar mientras carga la autenticación
    if (isLoading) return null;
    
    // No renderizar si no debe mostrar
    if (!shouldShow) return null;
    
    // No renderizar si aún no ha indexado (esperar a que terminen TODOS los módulos necesarios)
    if (!allModulesIndexed) return null;
    
    // Determinar si estamos en la página de directorio
    const isInDirectorioPage = pathname === '/admin/personal';
    
    // Solo renderizar si hay inconsistencias
    if (inconsistencies.length === 0) return null;
    
    // Si estamos en la página de directorio, no renderizar (el componente local lo hace)
    if (isInDirectorioPage) return null;
    
    return <InconsistencyAlert inconsistencies={inconsistencies} isInDirectorioPage={false} />;
}
