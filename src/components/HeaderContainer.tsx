'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';

export default function HeaderContainer() {
    const pathname = usePathname();

    // Rutas donde NO queremos mostrar el Header
    const hideHeaderPaths = ['/login', '/register'];
    const shouldShowHeader = !hideHeaderPaths.includes(pathname);

    if (!shouldShowHeader) {
        return null;
    }

    return <Header />;
}