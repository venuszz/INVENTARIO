import type { Inconsistency } from '../hooks/useDirectorioInconsistencies';

/**
 * Verifica si un área específica está en conflicto (duplicada)
 */
export function isAreaInConflict(id_area: number, inconsistencies: Inconsistency[]): boolean {
    return inconsistencies.some(
        issue => issue.type === 'duplicate_area' && issue.id_area === id_area
    );
}

/**
 * Obtiene los nombres de los otros directores que tienen la misma área
 */
export function getConflictingDirectors(
    id_area: number, 
    current_id_directorio: number,
    inconsistencies: Inconsistency[]
): string[] {
    const issue = inconsistencies.find(
        i => i.type === 'duplicate_area' && i.id_area === id_area
    );
    
    if (!issue || issue.type !== 'duplicate_area') return [];
    
    return issue.directors
        .filter(d => d.id_directorio !== current_id_directorio)
        .map(d => d.nombre);
}

/**
 * Obtiene el mensaje de tooltip para un área en conflicto
 */
export function getConflictTooltip(
    id_area: number,
    current_id_directorio: number,
    inconsistencies: Inconsistency[]
): string {
    const conflictingDirectors = getConflictingDirectors(id_area, current_id_directorio, inconsistencies);
    
    if (conflictingDirectors.length === 0) return '';
    
    if (conflictingDirectors.length === 1) {
        return `Esta área también está asignada a: ${conflictingDirectors[0]}`;
    }
    
    return `Esta área también está asignada a: ${conflictingDirectors.join(', ')}`;
}
