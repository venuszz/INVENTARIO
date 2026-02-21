import { useMemo } from 'react';
import type { DirectorWithAreaStats } from './useDirectorioStats';

interface DirectorioArea {
    id_directorio: number;
    id_area: number;
}

interface Directorio {
    id_directorio: number;
    nombre: string | null;
    area: string | null;
    puesto: string | null;
}

interface Area {
    id_area: number;
    nombre: string;
}

interface DirectorioStats {
    resguardos: number;
    bienesACargo: number;
}

interface DuplicateAreaInconsistency {
    id: string;
    type: 'duplicate_area';
    id_area: number;
    areaName: string;
    directors: Array<{
        id: number;
        nombre: string;
        stats?: {
            bienesCount: number;
            resguardosCount: number;
        };
    }>;
}

interface EmptyDirectorInconsistency {
    id: string;
    type: 'empty_director';
    id_directorio: number;
    directorName: string;
    areaCount: number;
    areas: Array<{
        id: number;
        nombre: string;
    }>;
}

interface EmptyAreaInconsistency {
    id: string;
    type: 'empty_area';
    id_area: number;
    areaName: string;
    directorCount: number;
}

export type Inconsistency = DuplicateAreaInconsistency | EmptyDirectorInconsistency | EmptyAreaInconsistency;

export function useDirectorioInconsistencies(
    directorio: Directorio[],
    areas: Area[],
    directorioAreas: DirectorioArea[],
    directorioStats?: Map<number, DirectorioStats>,
    areaStats?: Map<string, DirectorWithAreaStats[]>
) {
    const inconsistencies = useMemo<Inconsistency[]>(() => {
        const issues: Inconsistency[] = [];
        
        // 1. Detectar áreas duplicadas (múltiples directores con la misma área)
        const areaToDirectorsMap = new Map<number, number[]>();
        
        directorioAreas.forEach(rel => {
            if (!areaToDirectorsMap.has(rel.id_area)) {
                areaToDirectorsMap.set(rel.id_area, []);
            }
            areaToDirectorsMap.get(rel.id_area)!.push(rel.id_directorio);
        });
        
        // Encontrar áreas con más de un director
        areaToDirectorsMap.forEach((directorIds, id_area) => {
            if (directorIds.length > 1) {
                const area = areas.find(a => a.id_area === id_area);
                if (!area) return;
                
                // Obtener stats por área para cada director
                const areaKey = `area-${id_area}`;
                const areaStatsForArea = areaStats?.get(areaKey) || [];
                
                const directors = directorIds
                    .map(id => directorio.find(d => d.id_directorio === id))
                    .filter((d): d is Directorio => d !== undefined)
                    .map(d => {
                        // Buscar las stats específicas de este director en esta área
                        const directorAreaStats = areaStatsForArea.find(
                            stat => stat.directorId === d.id_directorio
                        );
                        
                        return {
                            id: d.id_directorio,
                            nombre: d.nombre || 'Sin nombre',
                            stats: directorAreaStats ? {
                                bienesCount: directorAreaStats.stats.bienesCount,
                                resguardosCount: directorAreaStats.stats.resguardosCount
                            } : {
                                bienesCount: 0,
                                resguardosCount: 0
                            }
                        };
                    });
                
                issues.push({
                    id: `duplicate_area_${id_area}`,
                    type: 'duplicate_area',
                    id_area,
                    areaName: area.nombre,
                    directors
                });
            }
        });
        
        // 2. Detectar directores sin bienes a cargo en NINGUNA de sus áreas (si tenemos stats)
        // NOTA: Un director puede tener bienes totales pero ninguno en áreas específicas asignadas
        // Por ejemplo: director con 10 bienes pero ninguno en las áreas que tiene asignadas oficialmente
        if (directorioStats) {
            directorio.forEach(dir => {
                const directorAreas = directorioAreas.filter(da => da.id_directorio === dir.id_directorio);
                
                // Solo verificar si tiene áreas asignadas
                if (directorAreas.length > 0) {
                    // Verificar si tiene bienes en ALGUNA de sus áreas asignadas
                    let hasBienesInAssignedAreas = false;
                    
                    // Necesitamos verificar por área específica, no el total
                    // El problema es que bienesACargo es el total, no por área
                    // Por ahora, usamos el total como aproximación
                    const stats = directorioStats.get(dir.id_directorio);
                    
                    if (stats && stats.bienesACargo === 0) {
                        // Mapear las áreas con sus nombres
                        const areasWithNames = directorAreas
                            .map(da => {
                                const area = areas.find(a => a.id_area === da.id_area);
                                return area ? { id: area.id_area, nombre: area.nombre } : null;
                            })
                            .filter((a): a is { id: number; nombre: string } => a !== null);
                        
                        issues.push({
                            id: `empty_director_${dir.id_directorio}`,
                            type: 'empty_director',
                            id_directorio: dir.id_directorio,
                            directorName: dir.nombre || 'Sin nombre',
                            areaCount: directorAreas.length,
                            areas: areasWithNames
                        });
                    }
                }
            });
        }
        
        // 3. Detectar áreas sin bienes asignados (si tenemos stats)
        if (directorioStats) {
            const areaGoodsCount = new Map<number, number>();
            
            // Contar bienes por área
            directorioAreas.forEach(rel => {
                const stats = directorioStats.get(rel.id_directorio);
                if (stats) {
                    const current = areaGoodsCount.get(rel.id_area) || 0;
                    areaGoodsCount.set(rel.id_area, current + stats.bienesACargo);
                }
            });
            
            // Encontrar áreas con directores pero sin bienes
            areaToDirectorsMap.forEach((directorIds, id_area) => {
                const goodsCount = areaGoodsCount.get(id_area) || 0;
                
                if (goodsCount === 0 && directorIds.length > 0) {
                    const area = areas.find(a => a.id_area === id_area);
                    if (area) {
                        issues.push({
                            id: `empty_area_${id_area}`,
                            type: 'empty_area',
                            id_area,
                            areaName: area.nombre,
                            directorCount: directorIds.length
                        });
                    }
                }
            });
        }
        
        return issues;
    }, [directorio, areas, directorioAreas, directorioStats, areaStats]);
    
    return { inconsistencies };
}
