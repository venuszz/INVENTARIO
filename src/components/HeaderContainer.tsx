'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import { useInactivity } from '@/context/InactivityContext';

export default function HeaderContainer() {
    const pathname = usePathname();
    const { isInactive } = useInactivity();

    // Rutas donde NO queremos mostrar el Header
    const hideHeaderPaths = ['/login', '/register'];
    const shouldShowHeader = !hideHeaderPaths.includes(pathname);

    // Ocultar header si hay inactividad y estamos en la página principal
    if (pathname === '/' && isInactive) {
        return null;
    }

    if (!shouldShowHeader) {
        return null;
    }

    return <Header />;
}