/**
 * Normaliza texto removiendo tildes y convirtiendo a minúsculas
 * para búsquedas insensibles a acentos
 */
export function normalizeText(text: string | null | undefined): string {
    if (!text) return '';
    
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Remueve diacríticos (tildes)
}

/**
 * Verifica si un texto normalizado incluye otro texto normalizado
 */
export function normalizedIncludes(text: string | null | undefined, search: string): boolean {
    return normalizeText(text).includes(normalizeText(search));
}

/**
 * Verifica si un texto normalizado comienza con otro texto normalizado
 */
export function normalizedStartsWith(text: string | null | undefined, search: string): boolean {
    return normalizeText(text).startsWith(normalizeText(search));
}
