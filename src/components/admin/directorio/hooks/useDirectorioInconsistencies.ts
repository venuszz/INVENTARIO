import { useMemo } from 'react';

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
    type: 'duplicate_area';
    id_area: number;
    areaName: string;
    directors: Array<{
        id_directorio: number;
        nombre: string;
    }>;
}

interface EmptyDirectorInconsistency {
    type: 'empty_director';
    id_directorio: number;
    directorName: string;
    areaCount: number;
}

interface EmptyAreaInconsistency {
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
    directorioStats?: Map<number, DirectorioStats>
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
                
                const directors = directorIds
                    .map(id => directorio.find(d => d.id_directorio === id))
                    .filter((d): d is Directorio => d !== undefined)
                    .map(d => ({
                        id_directorio: d.id_directorio,
                        nombre: d.nombre || 'Sin nombre'
                    }));
                
                issues.push({
                    type: 'duplicate_area',
                    id_area,
                    areaName: area.nombre,
                    directors
                });
            }
        });
        
        // 2. Detectar directores sin bienes a cargo (si tenemos stats)
        if (directorioStats) {
            directorio.forEach(dir => {
                const stats = directorioStats.get(dir.id_directorio);
                const areaCount = directorioAreas.filter(da => da.id_directorio === dir.id_directorio).length;
                
                // Solo reportar si tiene áreas asignadas pero sin bienes
                if (stats && stats.bienesACargo === 0 && areaCount > 0) {
                    issues.push({
                        type: 'empty_director',
                        id_directorio: dir.id_directorio,
                        directorName: dir.nombre || 'Sin nombre',
                        areaCount
                    });
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
    }, [directorio, areas, directorioAreas, directorioStats]);
    
    return { inconsistencies };
}
