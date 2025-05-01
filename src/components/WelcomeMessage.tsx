"use client";
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export function WelcomeMessage() {
    const [userData, setUserData] = useState<{
        firstName: string;
        rol?: string;
    } | null>(null);

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
        <div className="flex items-center">
            <div className="flex flex-col">
                <div className="text-xs font-light text-gray-300">
                    {userData.firstName}
                </div>
                {userData.rol && (
                    <div className="text-[10px] text-gray-400 leading-none">{userData.rol}</div>
                )}
            </div>
        </div>
    );
}