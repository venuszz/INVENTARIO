"use client";
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export function WelcomeMessage() {
    const [userData, setUserData] = useState<{
        firstName: string;
        rol?: string;
    } | null>(null);

    // Obtener datos del usuario de las cookies
    useEffect(() => {
        const userDataCookie = Cookies.get('userData');
        if (userDataCookie) {
            try {
                const parsedData = JSON.parse(userDataCookie);
                setUserData({ firstName: parsedData.firstName, rol: parsedData.rol });
            } catch (error) {
                console.error('Error al parsear datos del usuario:', error);
            }
        }
    }, []);

    if (!userData || !userData.firstName) {
        return null;
    }

    return (
        <div className="hidden md:flex items-center mr-6">
            <div className="overflow-hidden relative flex flex-col">
                <div className="text-sm font-extralight text-gray-300">
                    {userData.firstName}
                </div>
                {userData.rol && (
                    <div className="text-xs text-gray-400 leading-tight">{userData.rol}</div>
                )}
            </div>
        </div>
    );
}