/**
 * Cliente API para el servicio AXpert
 * Obtiene información de perfil del usuario desde el servicio externo
 */

export interface AXpertProfile {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
}

/**
 * Obtiene el perfil de un usuario desde AXpert usando el access token
 */
export async function getAXpertProfile(accessToken: string): Promise<AXpertProfile | null> {
    try {
        const supabaseProjectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const configuredProviderUrl = process.env.SUPABASE_OAUTH_PROVIDER_URL;
        const providerUrl = configuredProviderUrl || supabaseProjectUrl;

        if (!providerUrl) {
            console.error('AXpert: Provider URL no configurado');
            return null;
        }

        // Primero obtenemos la info del usuario autenticado
        const userResponse = await fetch(`${providerUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            },
        });

        if (!userResponse.ok) {
            console.error('AXpert: Error obteniendo usuario:', await userResponse.text());
            return null;
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // Extraer metadatos del usuario (fallback robusto si no hay perfil en tabla)
        const meta = userData.user_metadata || {};
        const metaFirstName = meta.first_name || meta.full_name?.split(' ')[0] || null;
        const metaLastName = meta.last_name || meta.full_name?.split(' ').slice(1).join(' ') || null;
        const metaAvatarUrl = meta.avatar_url || null;

        // Ahora obtenemos el perfil desde la tabla profiles
        const profileResponse = await fetch(`${providerUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            },
        });

        if (!profileResponse.ok) {
            console.error('AXpert: Error obteniendo perfil:', await profileResponse.text());
            // Si falla la consulta a profiles, devolver info de metadatos
            return {
                id: userId,
                email: userData.email,
                first_name: metaFirstName,
                last_name: metaLastName,
                avatar_url: getFullAvatarUrl(metaAvatarUrl),
            };
        }

        const profiles = await profileResponse.json();

        if (!profiles || profiles.length === 0) {
            console.warn('AXpert: No se encontró perfil en tabla, usando metadatos');
            return {
                id: userId,
                email: userData.email,
                first_name: metaFirstName,
                last_name: metaLastName,
                avatar_url: getFullAvatarUrl(metaAvatarUrl),
            };
        }

        const profile = profiles[0];

        return {
            id: profile.id,
            email: profile.email,
            first_name: profile.first_name || metaFirstName,
            last_name: profile.last_name || metaLastName,
            avatar_url: getFullAvatarUrl(profile.avatar_url || metaAvatarUrl),
        };
    } catch (error) {
        console.error('AXpert: Error en getAXpertProfile:', error);
        return null;
    }
}

/**
 * Obtiene solo el avatar URL desde AXpert
 * Útil para actualizar el avatar sin hacer llamadas innecesarias
 */
export async function getAXpertAvatar(accessToken: string): Promise<string | null> {
    const profile = await getAXpertProfile(accessToken);
    return profile?.avatar_url || null;
}

/**
 * Genera la URL completa del avatar si es una ruta relativa
 */
export function getFullAvatarUrl(avatarUrl: string | null): string | null {
    if (!avatarUrl) return null;

    // Si ya es una URL completa, retornarla tal cual
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
        return avatarUrl;
    }

    // Si es una ruta relativa, construir la URL completa
    const providerUrl = process.env.SUPABASE_OAUTH_PROVIDER_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!providerUrl) return null;

    // Las imágenes están en el bucket "profiles" y no tiene subcarpetas
    // La URL pública de Supabase sigue el formato: [project-url]/storage/v1/object/public/[bucket]/[filename]
    return `${providerUrl}/storage/v1/object/public/profiles/${avatarUrl}`;
}
