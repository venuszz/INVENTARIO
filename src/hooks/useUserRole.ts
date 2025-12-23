import { useSession } from "./useSession";

/**
 * Hook useUserRole
 * 
 * Proporciona acceso al rol del usuario actual de manera segura.
 * Utiliza el hook useSession internamente.
 * 
 * @returns {string | undefined} El rol del usuario o undefined si está cargando o no tiene rol
 */
export function useUserRole(): string | undefined {
    const { user, isLoading } = useSession();
    
    // Si está cargando, retornar undefined
    if (isLoading) {
        return undefined;
    }
    
    // Retornar el rol del usuario, convirtiendo null a undefined
    return user?.rol ?? undefined;
}
