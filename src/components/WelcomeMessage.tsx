"use client";
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export function WelcomeMessage() {
    const [userData, setUserData] = useState<{
        firstName: string;
    } | null>(null);

    // Obtener datos del usuario de las cookies
    useEffect(() => {
        const userDataCookie = Cookies.get('userData');
        if (userDataCookie) {
            try {
                const parsedData = JSON.parse(userDataCookie);
                setUserData({ firstName: parsedData.firstName });
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
            <div className="h-6 overflow-hidden relative">
                <div className="text-sm font-extralight text-gray-300">
                    {userData.firstName}
                </div>
            </div>
        </div>
    );
}