"use client";
import { useSession } from '@/hooks/useSession';

export function WelcomeMessage() {
    const { user, isLoading } = useSession();

    // Mostrar nada mientras carga
    if (isLoading) {
        return null;
    }

    // Si no hay usuario o no tiene nombre, no mostrar nada
    if (!user || !user.firstName) {
        return null;
    }

    return (
        <div className="flex items-center">
            <div className="flex flex-col">
                <div className="text-xs font-light text-gray-300">
                    {user.firstName}
                </div>
                {user.rol && (
                    <div className="text-[10px] text-gray-400 leading-none">{user.rol}</div>
                )}
            </div>
        </div>
    );
}