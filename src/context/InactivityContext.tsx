"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface InactivityContextType {
    isInactive: boolean;
    resetInactivity: () => void;
}

const InactivityContext = createContext<InactivityContextType | undefined>(undefined);

export function InactivityProvider({ children }: { children: ReactNode }) {
    const [isInactive, setIsInactive] = useState(false);
    const [lastActivity, setLastActivity] = useState(Date.now());

    const resetInactivity = () => {
        setLastActivity(Date.now());
        setIsInactive(false);
    };

    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        const handleActivity = () => {
            resetInactivity();
        };

        // Agregar listeners para detectar actividad
        events.forEach(event => {
            document.addEventListener(event, handleActivity);
        });

        // Verificar inactividad cada segundo
        const interval = setInterval(() => {
            const now = Date.now();
            const timeSinceLastActivity = now - lastActivity;
            
            // 60 segundos = 60000 ms
            if (timeSinceLastActivity >= 60000) {
                setIsInactive(true);
            }
        }, 1000);

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
            clearInterval(interval);
        };
    }, [lastActivity]);

    return (
        <InactivityContext.Provider value={{ isInactive, resetInactivity }}>
            {children}
        </InactivityContext.Provider>
    );
}

export function useInactivity() {
    const context = useContext(InactivityContext);
    if (context === undefined) {
        throw new Error('useInactivity must be used within an InactivityProvider');
    }
    return context;
}
