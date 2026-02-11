"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, User, LogOut, Database, FileText, Settings, Menu, X, Grid, Bell, Moon, Sun, Package, UserCheck, Link2, Crown, Cog, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import supabase from '@/app/lib/supabase/client';
import RoleGuard from "@/components/roleGuard";
import NotificationsPanel from './NotificationCenter';
import { useTheme } from "@/context/ThemeContext";
import { UniversalSearchBar } from './search';
import { useSession } from '@/hooks/useSession';
import { clearAllIndexationData } from '@/lib/clearIndexationData';
import { motion, AnimatePresence } from 'framer-motion';


type MenuItem = {
    title: string;
    icon: React.ReactNode;
    path: string;
    submenu?: {
        title: string;
        path: string;
        children?: {
            title: string;
            path: string;
        }[];
    }[];
};

export function useCerrarSesion() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            console.log('🚪 Iniciando proceso de logout completo...');
            
            // 1. Limpiar TODOS los datos de indexación (IndexedDB + Zustand stores)
            console.log('🧹 Limpiando datos de indexación...');
            await clearAllIndexationData();
            
            // 2. Cerrar sesión en Supabase
            console.log('🔐 Cerrando sesión en Supabase...');
            await supabase.auth.signOut();

            // 3. Llamar al endpoint de logout del servidor
            // Esto eliminará todas las cookies HttpOnly de manera segura
            console.log('🍪 Eliminando cookies del servidor...');
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });

            // 4. Limpiar COMPLETAMENTE localStorage
            console.log('💾 Limpiando localStorage completamente...');
            localStorage.clear(); // Elimina TODO el localStorage
            
            // 5. Limpiar COMPLETAMENTE sessionStorage
            console.log('📦 Limpiando sessionStorage...');
            sessionStorage.clear();
            
            // 6. Limpiar todas las cookies del lado del cliente
            console.log('🍪 Eliminando cookies del cliente...');
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            
            // 7. Limpiar caché del navegador (Service Workers si existen)
            console.log('🗑️ Limpiando caché...');
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }
            
            // 8. Limpiar IndexedDB completamente (por si acaso)
            console.log('🗄️ Limpiando IndexedDB...');
            if (window.indexedDB) {
                const databases = await window.indexedDB.databases();
                databases.forEach(db => {
                    if (db.name) {
                        window.indexedDB.deleteDatabase(db.name);
                    }
                });
            }

            console.log('✅ Logout completado exitosamente - Todo limpio');
            
            // 9. Redireccionar al login con recarga forzada
            window.location.href = '/login';
        } catch (error) {
            console.error('❌ Error al cerrar sesión:', error);
            // Aún así hacer limpieza básica y redirigir
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/login';
        }
    };

    return handleLogout;
}

export default function NavigationBar() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { isDarkMode, toggleDarkMode } = useTheme();
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [userData, setUserData] = useState<{ id?: string; firstName?: string; lastName?: string; username?: string; email?: string; rol?: string; oauthProvider?: 'axpert' | 'local'; loginMethod?: 'local' | 'axpert' }>({});
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
    const [popoverPosition, setPopoverPosition] = useState<'top' | 'bottom'>('bottom');
    const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [logoShouldHide, setLogoShouldHide] = useState(false);
    const [searchBarShouldHide, setSearchBarShouldHide] = useState(false);
    const [axpertAvatarUrl, setAxpertAvatarUrl] = useState<string | null>(null);
    const [showAvatarPopover, setShowAvatarPopover] = useState(false);
    const [showLinkingSuccess, setShowLinkingSuccess] = useState(false);
    const handleLogout = useCerrarSesion();

    // Refs para detectar colisiones
    const logoRef = useRef<HTMLDivElement>(null);
    const menuContainerRef = useRef<HTMLDivElement>(null);
    const searchBarRef = useRef<HTMLDivElement>(null);
    const actionButtonsRef = useRef<HTMLDivElement>(null);
    const actionButtonsContainerRef = useRef<HTMLDivElement>(null);
    const notificationWrapperRef = useRef<HTMLDivElement>(null);
    const avatarPopoverRef = useRef<HTMLDivElement>(null);

    // Detectar éxito de vinculación
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('linked') === 'success') {
            setShowLinkingSuccess(true);
            setShowAvatarPopover(true);

            // Limpiar URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);

            // Auto-ocultar mensaje de éxito después de 8 segundos
            const timer = setTimeout(() => {
                setShowLinkingSuccess(false);
            }, 8000);
            return () => clearTimeout(timer);
        }
    }, []);

    // Gestionar visibilidad de elementos
    useEffect(() => {
        const checkCollisions = () => {
            const searchRect = searchBarRef.current?.getBoundingClientRect();
            const actionButtonsContainerRect = actionButtonsContainerRef.current?.getBoundingClientRect();

            let searchBarHasCollision = false;

            // Ocultar barra de búsqueda si no hay espacio cuando el menú de botones está abierto
            if (isHeaderExpanded && searchRect && actionButtonsContainerRect) {
                const availableSpace = actionButtonsContainerRect.left - searchRect.right;
                if (availableSpace < 20) {
                    searchBarHasCollision = true;
                }
            }

            // Ocultar logo cuando se expande la búsqueda o los botones
            const shouldHideLogo = isSearchExpanded || isHeaderExpanded;

            setLogoShouldHide(shouldHideLogo);
            setSearchBarShouldHide(searchBarHasCollision);
        };

        const timer = setTimeout(checkCollisions, 50);
        window.addEventListener('resize', checkCollisions);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', checkCollisions);
        };
    }, [openMenu, openSubmenu, isSearchExpanded, isHeaderExpanded]);

    // Cerrar menús al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!(event.target as HTMLElement).closest('nav')) {
                closeAll();
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    // Cerrar menús al cambiar de ruta
    useEffect(() => {
        closeAll();
    }, [pathname]);

    // Usar useSession hook para obtener datos del usuario de manera segura
    const { user: sessionUser, axpertProfile, isAuthenticated } = useSession();

    useEffect(() => {
        if (isAuthenticated && sessionUser) {
            setUserData({
                id: sessionUser.id,
                firstName: sessionUser.firstName,
                lastName: sessionUser.lastName,
                username: sessionUser.username,
                email: sessionUser.email,
                rol: sessionUser.rol ?? undefined,
                oauthProvider: sessionUser.oauthProvider,
                loginMethod: sessionUser.loginMethod
            });

            // Cargar avatar de AXpert si el usuario inició sesión con AXpert
            if (sessionUser.oauthProvider === 'axpert' && axpertProfile?.avatarUrl) {
                setAxpertAvatarUrl(axpertProfile.avatarUrl);
            }
        } else {
            setUserData({});
            setAxpertAvatarUrl(null);
        }
    }, [isAuthenticated, sessionUser, axpertProfile]);

    // Cerrar popover al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showLogoutModal && !(event.target as HTMLElement).closest('.popover-content')) {
                setShowLogoutModal(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showLogoutModal]);

    // Cerrar notificaciones al hacer clic fuera
    useEffect(() => {
        const handleClickOutsideNotification = (event: MouseEvent) => {
            if (notificationsOpen && notificationWrapperRef.current && !notificationWrapperRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutsideNotification);
        return () => {
            document.removeEventListener('mousedown', handleClickOutsideNotification);
        };
    }, [notificationsOpen]);

    // Cerrar avatar popover al hacer clic fuera
    useEffect(() => {
        const handleClickOutsideAvatar = (event: MouseEvent) => {
            if (showAvatarPopover && avatarPopoverRef.current && !avatarPopoverRef.current.contains(event.target as Node)) {
                setShowAvatarPopover(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutsideAvatar);
        return () => {
            document.removeEventListener('mousedown', handleClickOutsideAvatar);
        };
    }, [showAvatarPopover]);

    const handleMenuHover = (menu: string | null) => {
        setOpenMenu(menu);
        if (!menu) setOpenSubmenu(null);
    };

    const handleSubmenuHover = (submenu: string | null) => {
        setOpenSubmenu(submenu);
    };

    // Manejar expansión de botones de acción
    const handleHeaderExpand = (expanded: boolean) => {
        if (expanded && isSearchExpanded) {
            setIsSearchExpanded(false);
        }
        setIsHeaderExpanded(expanded);
    };

    // Manejar expansión de búsqueda
    const handleSearchExpand = (expanded: boolean) => {
        if (expanded && isHeaderExpanded) {
            setIsHeaderExpanded(false);
        }
        setIsSearchExpanded(expanded);
    };

    // Funciones para menú móvil (click)
    const toggleMenu = (menu: string) => {
        setOpenMenu(openMenu === menu ? null : menu);
        setOpenSubmenu(null);
    };

    const toggleSubmenu = (submenu: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setOpenSubmenu(openSubmenu === submenu ? null : submenu);
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
        setOpenMenu(null);
        setOpenSubmenu(null);
    };

    const closeAll = () => {
        setOpenMenu(null);
        setOpenSubmenu(null);
        setMobileMenuOpen(false);
        setNotificationsOpen(false);
    };

    const initiateLogout = (event: React.MouseEvent) => {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Posición inicial centrada bajo el botón
        let x = rect.left + rect.width / 2;
        let y = rect.bottom + 8;
        let position: 'top' | 'bottom' = 'bottom';

        // Aseguramos que el popover tenga espacio para mostrarse
        const POPOVER_WIDTH = 256; // w-64 = 16rem = 256px
        const POPOVER_HEIGHT = 140; // altura aproximada del popover
        const MARGIN = 16; // margen de seguridad

        // Ajuste horizontal
        if (x + POPOVER_WIDTH / 2 > windowWidth - MARGIN) {
            x = windowWidth - POPOVER_WIDTH / 2 - MARGIN;
        } else if (x - POPOVER_WIDTH / 2 < MARGIN) {
            x = POPOVER_WIDTH / 2 + MARGIN;
        }

        // Ajuste vertical
        if (y + POPOVER_HEIGHT > windowHeight - MARGIN) {
            // Si no hay espacio abajo, lo mostramos arriba del botón
            y = rect.top - 8;
            position = 'top';
        }

        setModalPosition({ x, y });
        setPopoverPosition(position);
        setShowLogoutModal(true);
    };

    const confirmLogout = async () => {
        await handleLogout();
        setShowLogoutModal(false);
    };

    const getInitials = () => {
        const first = userData.firstName?.charAt(0) || '';
        const last = userData.lastName?.charAt(0) || '';
        if (!first && !last) return userData.username?.charAt(0).toUpperCase() || 'U';
        return (first + last).toUpperCase();
    };

    const menuItems: MenuItem[] = [
        {
            title: 'Inventario',
            icon: <Database className="w-4 h-4" />,
            path: '/inventario',
            submenu: [
                { title: 'Registro de nuevos bienes', path: '/inventario/registro' },
            ]
        },
        {
            title: 'Consultas',
            icon: <FileText className="w-4 h-4" />,
            path: '/consultas',
            submenu: [
                {
                    title: 'Levantamiento',
                    path: '/consultas/levantamiento',
                },
                {
                    title: 'Inventario INEA',
                    path: '/consultas/inea',
                    children: [
                        { title: 'Vista general', path: '/consultas/inea/general' },
                        { title: 'Bienes obsoletos', path: '/consultas/inea/obsoletos' }
                    ]
                },
                {
                    title: 'Inventario ITEA',
                    path: '/consultas/itea',
                    children: [
                        { title: 'Vista general', path: '/consultas/itea/general' },
                        { title: 'Bienes obsoletos', path: '/consultas/itea/obsoletos' }
                    ]
                },
                {
                    title: 'Inventario TLAXCALA',
                    path: '/consultas/no-listado',
                }
            ]
        },
        {
            title: 'Resguardos',
            icon: <Settings className="w-4 h-4" />,
            path: '/resguardos',
            submenu: [
                { title: 'Crear resguardo', path: '/resguardos/crear' },
                { title: 'Consultar resguardos', path: '/resguardos/consultar' },
                { title: 'Consultar bajas', path: '/resguardos/consultar/bajas' },
            ]
        },
        {
            title: 'Reportes',
            icon: <FileText className="w-4 h-4" />,
            path: '/reportes',
            submenu: [
                {
                    title: 'Reportes INEA',
                    path: '/reportes/inea',
                },
                {
                    title: 'Reportes ITEA',
                    path: '/reportes/itea',
                },
                {
                    title: 'Reportes TLAXCALA',
                    path: '/reportes/tlaxcala',
                }
            ]
        },
        {
            title: 'Administración',
            icon: <Settings className="w-4 h-4" />,
            path: '/admin',
            submenu: [
                { title: 'Configuración General', path: '/admin/areas' },
                { title: 'Directorio de Personal', path: '/admin/personal' }
            ]
        }
    ];

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

    return (
        <nav className={`${pathname === '/' ? (isDarkMode ? 'text-white' : 'text-gray-900') : (isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900')} ${pathname === '/' ? 'fixed top-0 left-0 right-0' : 'relative'} z-50 transition-colors duration-300`}>
            {/* Desktop Navigation */}
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center h-16 relative">
                    {/* Left side - Logo */}
                    <div className="flex items-center">
                        <div
                            ref={logoRef}
                            className={`flex items-center transition-all duration-300 ease-in-out ${logoShouldHide ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'
                                }`}
                        >
                            <div className="flex-shrink-0 flex items-center">
                                <Link href="/" onClick={closeAll} className="hover:opacity-80 transition-opacity duration-300">
                                    <Image
                                        src={isDarkMode ? "/images/ITEA_logo.png" : "/images/ITEA_logo_negro.svg"}
                                        alt="Logo ITEA"
                                        width={150}
                                        height={60}
                                        className="h-14 w-auto"
                                        priority
                                    />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Center - Navigation Menus */}
                    <div ref={menuContainerRef} className="flex-1 flex justify-center relative z-10">
                        <div className="hidden md:flex md:space-x-1">
                            <RoleGuard roles={["admin", "superadmin"]} userRole={userData.rol}>
                                <motion.div
                                    className="relative"
                                    onMouseEnter={() => handleMenuHover("Inventario")}
                                    onMouseLeave={() => handleMenuHover(null)}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <motion.button
                                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border ${isActive("/inventario")
                                            ? isDarkMode ? 'text-white bg-white/5 border-white/20' : 'text-black bg-black/5 border-black/20'
                                            : isDarkMode
                                                ? `text-white/60 hover:text-white border-transparent hover:border-white/10 ${pathname === '/' ? 'hover:bg-white/5' : 'hover:bg-white/5'}`
                                                : `text-black/60 hover:text-black border-transparent hover:border-black/10 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-black/5'}`
                                            }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Database className="w-4 h-4 mr-2" />
                                        Inventario
                                        <motion.div
                                            animate={{ rotate: openMenu === "Inventario" ? 180 : 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <ChevronDown className="ml-1 w-3 h-3" />
                                        </motion.div>
                                    </motion.button>
                                    <AnimatePresence>
                                        {openMenu === "Inventario" && (
                                            <motion.div 
                                                data-dropdown="true" 
                                                className={`absolute left-0 mt-2 w-56 rounded-lg border overflow-hidden z-20 ${
                                                    pathname === '/' 
                                                        ? (isDarkMode ? 'bg-black/95 border-white/10 backdrop-blur-md' : 'bg-white/95 border-black/10 backdrop-blur-md') 
                                                        : (isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/10')
                                                }`}
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className="py-1">
                                                    <RoleGuard roles={["admin", "superadmin"]} userRole={userData.rol}>
                                                        <Link
                                                            href="/inventario/registro"
                                                            onClick={closeAll}
                                                            className={`block px-4 py-2.5 text-sm transition-all duration-200 ${pathname === "/inventario/registro"
                                                                ? isDarkMode ? 'text-white bg-white/10 border-l-2 border-white' : 'text-black bg-black/10 border-l-2 border-black'
                                                                : isDarkMode
                                                                    ? `text-white/60 hover:text-white hover:bg-white/5`
                                                                    : `text-black/60 hover:text-black hover:bg-black/5`
                                                                }`}
                                                        >
                                                            Registro de nuevos bienes
                                                        </Link>
                                                    </RoleGuard>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </RoleGuard >
                            {
                                menuItems.slice(1, 4).map((item, index) => (
                                    <motion.div
                                        key={item.title}
                                        className="relative"
                                        onMouseEnter={() => handleMenuHover(item.title)}
                                        onMouseLeave={() => handleMenuHover(null)}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        {item.submenu ? (
                                            <>
                                                <motion.button
                                                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border ${isActive(item.path)
                                                        ? isDarkMode ? 'text-white bg-white/5 border-white/20' : 'text-black bg-black/5 border-black/20'
                                                        : isDarkMode
                                                            ? `text-white/60 hover:text-white border-transparent hover:border-white/10 ${pathname === '/' ? 'hover:bg-white/5' : 'hover:bg-white/5'}`
                                                            : `text-black/60 hover:text-black border-transparent hover:border-black/10 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-black/5'}`
                                                        }`}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <span className="mr-2">{item.icon}</span>
                                                    {item.title}
                                                    <motion.div
                                                        animate={{ rotate: openMenu === item.title ? 180 : 0 }}
                                                        transition={{ duration: 0.3 }}
                                                    >
                                                        <ChevronDown className="ml-1 w-3 h-3" />
                                                    </motion.div>
                                                </motion.button>
                                                <AnimatePresence>
                                                    {openMenu === item.title && (
                                                        <motion.div 
                                                            data-dropdown="true" 
                                                            className={`absolute left-0 mt-2 w-56 rounded-lg border overflow-visible z-20 ${
                                                                pathname === '/' 
                                                                    ? (isDarkMode ? 'bg-black/95 border-white/10 backdrop-blur-md' : 'bg-white/95 border-black/10 backdrop-blur-md') 
                                                                    : (isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/10')
                                                            }`}
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                        <div className="py-1 rounded-lg overflow-hidden">
                                                            {item.submenu.map((subItem) => (
                                                                <div key={subItem.title}>
                                                                    {subItem.children ? (
                                                                        <div
                                                                            onMouseEnter={() => handleSubmenuHover(`${item.title}-${subItem.title}`)}
                                                                            onMouseLeave={() => handleSubmenuHover(null)}
                                                                        >
                                                                            <button
                                                                                className={`flex justify-between w-full px-4 py-2.5 text-sm transition-all duration-200 ${isActive(subItem.path)
                                                                                    ? isDarkMode ? 'text-white bg-white/10 border-l-2 border-white' : 'text-black bg-black/10 border-l-2 border-black'
                                                                                    : isDarkMode
                                                                                        ? `text-white/60 hover:text-white hover:bg-white/5`
                                                                                        : `text-black/60 hover:text-black hover:bg-black/5`
                                                                                    }`}
                                                                            >
                                                                                {subItem.title}
                                                                                <motion.div
                                                                                    animate={{ rotate: openSubmenu === `${item.title}-${subItem.title}` ? 90 : 0 }}
                                                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                                >
                                                                                    <ChevronRight className="w-3 h-3" />
                                                                                </motion.div>
                                                                            </button>
                                                                            <AnimatePresence>
                                                                                {openSubmenu === `${item.title}-${subItem.title}` && (
                                                                                    <motion.div
                                                                                        initial={{ height: 0, opacity: 0 }}
                                                                                        animate={{ height: "auto", opacity: 1 }}
                                                                                        exit={{ height: 0, opacity: 0 }}
                                                                                        transition={{ 
                                                                                            duration: 0.3,
                                                                                            ease: [0.4, 0, 0.2, 1]
                                                                                        }}
                                                                                        className="overflow-hidden"
                                                                                    >
                                                                                        <div className={`pl-4 py-1 border-l-2 ml-4 ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                                                                                            {subItem.children.map((child, childIndex) => (
                                                                                                <motion.div
                                                                                                    key={child.title}
                                                                                                    initial={{ x: -10, opacity: 0 }}
                                                                                                    animate={{ x: 0, opacity: 1 }}
                                                                                                    transition={{ 
                                                                                                        duration: 0.2,
                                                                                                        delay: childIndex * 0.05,
                                                                                                        ease: "easeOut"
                                                                                                    }}
                                                                                                >
                                                                                                    <Link
                                                                                                        href={child.path}
                                                                                                        onClick={closeAll}
                                                                                                        className={`block px-4 py-2 text-sm rounded-md transition-all duration-200 ${pathname === child.path
                                                                                                            ? isDarkMode ? 'text-white bg-white/10 font-medium' : 'text-black bg-black/10 font-medium'
                                                                                                            : isDarkMode
                                                                                                                ? `text-white/50 hover:text-white hover:bg-white/5`
                                                                                                                : `text-black/50 hover:text-black hover:bg-black/5`
                                                                                                            }`}
                                                                                                    >
                                                                                                        {child.title}
                                                                                                    </Link>
                                                                                                </motion.div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </motion.div>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                    ) : subItem.title === 'Crear resguardo' ? (
                                                                        <RoleGuard roles={["admin", "superadmin"]} userRole={userData.rol}>
                                                                            <Link
                                                                                href={subItem.path}
                                                                                onClick={closeAll}
                                                                                className={`block px-4 py-2.5 text-sm transition-all duration-200 ${pathname === subItem.path
                                                                                    ? isDarkMode ? 'text-white bg-white/10 border-l-2 border-white' : 'text-black bg-black/10 border-l-2 border-black'
                                                                                    : isDarkMode
                                                                                        ? `text-white/60 hover:text-white hover:bg-white/5`
                                                                                        : `text-black/60 hover:text-black hover:bg-black/5`
                                                                                    }`}
                                                                            >
                                                                                {subItem.title}
                                                                            </Link>
                                                                        </RoleGuard>
                                                                    ) : (
                                                                        <Link
                                                                            href={subItem.path}
                                                                            onClick={closeAll}
                                                                            className={`block px-4 py-2.5 text-sm transition-all duration-200 ${pathname === subItem.path
                                                                                ? isDarkMode ? 'text-white bg-white/10 border-l-2 border-white' : 'text-black bg-black/10 border-l-2 border-black'
                                                                                : isDarkMode
                                                                                    ? `text-white/60 hover:text-white hover:bg-white/5`
                                                                                    : `text-black/60 hover:text-black hover:bg-black/5`
                                                                                }`}
                                                                        >
                                                                            {subItem.title}
                                                                        </Link>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            </>
                                        ) : (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <Link
                                                    href={item.path}
                                                    onClick={closeAll}
                                                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border ${isActive(item.path)
                                                        ? isDarkMode ? 'text-white bg-white/5 border-white/20' : 'text-black bg-black/5 border-black/20'
                                                        : isDarkMode
                                                            ? `text-white/60 hover:text-white border-transparent hover:border-white/10`
                                                            : `text-black/60 hover:text-black border-transparent hover:border-black/10`
                                                        }`}
                                                >
                                                    <span className="mr-2">{item.icon}</span>
                                                    {item.title}
                                                </Link>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ))
                            }
                            < RoleGuard roles={["admin", "superadmin"]} userRole={userData.rol} >
                                <motion.div
                                    className="relative"
                                    onMouseEnter={() => handleMenuHover("Administración")}
                                    onMouseLeave={() => handleMenuHover(null)}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.2 }}
                                >
                                    <motion.button
                                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border ${isActive("/admin")
                                            ? isDarkMode ? 'text-white bg-white/5 border-white/20' : 'text-black bg-black/5 border-black/20'
                                            : isDarkMode
                                                ? `text-white/60 hover:text-white border-transparent hover:border-white/10 ${pathname === '/' ? 'hover:bg-white/5' : 'hover:bg-white/5'}`
                                                : `text-black/60 hover:text-black border-transparent hover:border-black/10 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-black/5'}`
                                            }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Settings className="w-4 h-4 mr-2" />
                                        Administración
                                        <motion.div
                                            animate={{ rotate: openMenu === "Administración" ? 180 : 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <ChevronDown className="ml-1 w-3 h-3" />
                                        </motion.div>
                                    </motion.button>
                                    <AnimatePresence>
                                        {openMenu === "Administración" && (
                                            <motion.div 
                                                data-dropdown="true" 
                                                className={`absolute left-0 mt-2 w-56 rounded-lg border overflow-hidden z-20 ${
                                                    pathname === '/' 
                                                        ? (isDarkMode ? 'bg-black/95 border-white/10 backdrop-blur-md' : 'bg-white/95 border-black/10 backdrop-blur-md') 
                                                        : (isDarkMode ? 'bg-black border-white/10' : 'bg-white border-black/10')
                                                }`}
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className="py-1">
                                                    <Link
                                                        href="/admin/areas"
                                                        onClick={closeAll}
                                                        className={`block px-4 py-2.5 text-sm transition-all duration-200 ${pathname === "/admin/areas"
                                                            ? isDarkMode ? 'text-white bg-white/10 border-l-2 border-white' : 'text-black bg-black/10 border-l-2 border-black'
                                                            : isDarkMode
                                                                ? `text-white/60 hover:text-white hover:bg-white/5`
                                                                : `text-black/60 hover:text-black hover:bg-black/5`
                                                            }`}
                                                    >
                                                        Configuración General
                                                    </Link>
                                                    <Link
                                                        href="/admin/personal"
                                                        onClick={closeAll}
                                                        className={`block px-4 py-2.5 text-sm transition-all duration-200 ${pathname === "/admin/personal"
                                                            ? isDarkMode ? 'text-white bg-white/10 border-l-2 border-white' : 'text-black bg-black/10 border-l-2 border-black'
                                                            : isDarkMode
                                                                ? `text-white/60 hover:text-white hover:bg-white/5`
                                                                : `text-black/60 hover:text-black hover:bg-black/5`
                                                            }`}
                                                    >
                                                        Directorio de Personal
                                                    </Link>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </RoleGuard >
                        </div >
                    </div >

                    {/* Search Bar - After Menus */}
                    <div
                        ref={searchBarRef}
                        className={`hidden md:flex items-center transition-all duration-300 ease-in-out ${searchBarShouldHide ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'
                            }`
                        }
                    >
                        <UniversalSearchBar 
                            isDarkMode={isDarkMode}
                            userRoles={userData.rol ? [userData.rol] : []}
                            onExpandChange={handleSearchExpand}
                        />
                    </div>

                    {/* Right side - Action buttons */}
                    < div ref={actionButtonsContainerRef} className="hidden md:flex items-center h-full ml-auto" >
                        {/* Hover trigger area for expanding buttons */}
                        < div
                            className="flex items-center h-full"
                            onMouseEnter={() => handleHeaderExpand(true)}
                            onMouseLeave={() => handleHeaderExpand(false)}
                        >
                            {/* Collapsible buttons container */}
                            < div
                                ref={actionButtonsRef}
                                className={`flex items-center transition-all duration-500 ease-in-out overflow-hidden ${isHeaderExpanded
                                    ? 'max-w-96 opacity-100'
                                    : 'max-w-0 opacity-0'
                                    }`}
                            >
                                <div className="flex items-center space-x-2 pr-2">
                                    <RoleGuard roles={["superadmin"]} userRole={userData.rol}>
                                        <Link
                                            href="/register"
                                            className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${isDarkMode
                                                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                                }`}
                                            title="Añadir usuario"
                                        >
                                            <User className="h-5 w-5" />
                                        </Link>
                                    </RoleGuard>
                                    <RoleGuard roles={["superadmin", "admin"]} userRole={userData.rol}>
                                        <Link
                                            href="/dashboard"
                                            className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${pathname === '/dashboard'
                                                ? isDarkMode ? 'text-white bg-white/10 border border-white/20' : 'text-gray-900 bg-gray-100 border border-gray-300'
                                                : isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                                }`}
                                            title="Dashboard"
                                        >
                                            <Grid className="h-5 w-5" />
                                        </Link>
                                    </RoleGuard>
                                    <RoleGuard roles={["superadmin"]} userRole={userData.rol}>
                                        <Link
                                            href="/admin/usuarios-pendientes"
                                            className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${pathname === '/admin/usuarios-pendientes'
                                                ? isDarkMode ? 'text-white bg-white/10 border border-white/20' : 'text-gray-900 bg-gray-100 border border-gray-300'
                                                : isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                                }`}
                                            title="Validar usuarios"
                                        >
                                            <UserCheck className="h-5 w-5" />
                                        </Link>
                                    </RoleGuard>
                                    <button
                                        onClick={toggleDarkMode}
                                        className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${isDarkMode
                                            ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                            }`}
                                        aria-label="Cambiar modo de color"
                                        title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                                    >
                                        {isDarkMode ? (
                                            <Sun className="w-4 h-4" />
                                        ) : (
                                            <Moon className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div >

                            {/* Hover trigger indicator - Minimalist */}
                            < div className={`flex items-center justify-center transition-all duration-500 ease-in-out ${isHeaderExpanded
                                ? 'w-2 h-6 opacity-30'
                                : 'w-6 h-6 opacity-70 hover:opacity-100'
                                } ${isDarkMode
                                    ? 'hover:bg-gray-800/30'
                                    : 'hover:bg-gray-200/30'
                                } rounded-full`}>
                                <div className={`transition-all duration-300 ${isHeaderExpanded
                                    ? 'w-0.5 h-3 bg-current rounded-full'
                                    : 'flex space-x-0.5'
                                    }`}>
                                    {!isHeaderExpanded && (
                                        <>
                                            <div className={`w-0.5 h-0.5 rounded-full ${isDarkMode ? 'bg-gray-500' : 'bg-gray-600'
                                                }`}></div>
                                            <div className={`w-0.5 h-0.5 rounded-full ${isDarkMode ? 'bg-gray-500' : 'bg-gray-600'
                                                }`}></div>
                                            <div className={`w-0.5 h-0.5 rounded-full ${isDarkMode ? 'bg-gray-500' : 'bg-gray-600'
                                                }`}></div>
                                        </>
                                    )}
                                </div>
                            </div >
                        </div >

                        {/* Always visible buttons */}
                        < div className={`flex items-center space-x-3 transition-all duration-500 ${isHeaderExpanded ? 'ml-1' : 'ml-3'
                            }`}>
                            
                            <RoleGuard roles={["superadmin", "admin"]} userRole={userData.rol}>
                                <div className="relative" ref={notificationWrapperRef}>
                                    <button
                                        onClick={() => setNotificationsOpen(!notificationsOpen)}
                                        className={`p-2 rounded-full relative transition-all duration-300 hover:scale-110 ${isDarkMode
                                            ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                            }`}
                                        title="Notificaciones"
                                    >
                                        <Bell className="h-5 w-5" />
                                    </button>
                                    {notificationsOpen && (
                                        <div className="absolute right-0 top-full mt-2 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                                            <NotificationsPanel onClose={() => setNotificationsOpen(false)} />
                                        </div>
                                    )}
                                </div>
                            </RoleGuard>

                            {/* User Profile & Sync Hub */}
                            {(userData.id || userData.username || userData.email) && (
                                <div
                                    className="relative flex items-center"
                                    ref={avatarPopoverRef}
                                    onMouseEnter={() => setShowAvatarPopover(true)}
                                    onMouseLeave={() => setShowAvatarPopover(false)}
                                >
                                    <div className={`relative transition-all duration-500 ease-out ${showAvatarPopover ? 'scale-110' : 'scale-100'
                                        }`}>
                                        <div className={`w-8 h-8 rounded-full overflow-hidden cursor-pointer shadow-md transition-shadow hover:shadow-lg flex items-center justify-center ${!axpertAvatarUrl ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white') : ''
                                            }`}>
                                            {axpertAvatarUrl ? (
                                                <img
                                                    src={axpertAvatarUrl}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-[10px] font-bold tracking-tighter">{getInitials()}</span>
                                            )}
                                        </div>

                                        {/* Status Dot */}
                                        {/* Green if linked (AXpert), Gray/Empty if not */}
                                        {userData.oauthProvider === 'axpert' && (
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${isDarkMode ? 'bg-white border-black' : 'bg-black border-white'
                                                }`} title="Cuenta Vinculada con AXpert" />
                                        )}
                                    </div>

                                    {/* Elegant Monochromatic Popover */}
                                    {showAvatarPopover && (
                                        <div className="absolute right-0 top-full pt-3 z-50 animate-in zoom-in-95 fade-in duration-400 ease-out origin-top-right">
                                            <div className={`rounded-2xl overflow-hidden shadow-2xl border backdrop-blur-md transition-all duration-300 ${isDarkMode
                                                ? 'bg-black/90 border-white/10 text-white'
                                                : 'bg-white/95 border-gray-200 text-black'
                                                }`}
                                                style={{ width: '260px' }}
                                            >
                                                {showLinkingSuccess ? (
                                                    // === VIEW: LINKING SUCCESS MESSAGE ===
                                                    <div className="p-6 flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                                                        <div className="relative flex items-center justify-center">
                                                            <div className={`w-14 h-14 rounded-full flex items-center justify-center border transition-colors duration-500 ${isDarkMode ? 'bg-green-950/30 border-green-900/50 text-green-400' : 'bg-green-50 border-green-100 text-green-600'}`}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                        </div>

                                                        <div className="text-center space-y-2">
                                                            <h4 className={`text-sm font-bold tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                                                                Vinculación Exitosa
                                                            </h4>
                                                            <p className={`text-[10px] leading-relaxed px-1 transition-colors duration-300 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                                Su identidad digital ha sido unificada correctamente con el sistema institucional.
                                                            </p>
                                                        </div>

                                                        <button
                                                            onClick={() => setShowLinkingSuccess(false)}
                                                            className={`text-[9px] font-bold uppercase tracking-widest py-2 px-4 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/5 text-zinc-400 hover:text-white' : 'hover:bg-black/5 text-zinc-500 hover:text-black'}`}
                                                        >
                                                            Cerrar
                                                        </button>
                                                    </div>
                                                ) : userData.oauthProvider === 'axpert' ? (
                                                    // === VIEW: LINKED USER (AXpert) ===
                                                    <div className="p-5 flex flex-col items-center gap-4">
                                                        {/* Profile Avatar Large */}
                                                        <div className={`w-14 h-14 rounded-xl overflow-hidden shadow-sm border flex items-center justify-center ${isDarkMode ? 'border-white/10' : 'border-gray-100'
                                                            } ${!axpertAvatarUrl ? (isDarkMode ? 'bg-white text-black' : 'bg-black text-white') : ''}`}>
                                                            {axpertAvatarUrl ? (
                                                                <img
                                                                    src={axpertAvatarUrl}
                                                                    alt="Profile"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="text-lg font-bold">{getInitials()}</span>
                                                            )}
                                                        </div>

                                                        {/* User Info */}
                                                        <div className="text-center space-y-2">
                                                            <p className="text-sm font-bold tracking-tight">
                                                                {userData.firstName} {userData.lastName}
                                                            </p>
                                                            {/* Show email only if logged in via AXpert */}
                                                            {userData.loginMethod === 'axpert' && (
                                                                <p className={`text-[10px] font-medium opacity-50`}>
                                                                    {userData.email}
                                                                </p>
                                                            )}
                                                            {userData.rol && (
                                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${isDarkMode
                                                                    ? 'bg-white text-black border-white'
                                                                    : 'bg-black text-white border-black'
                                                                    }`}>
                                                                    {userData.rol === 'superadmin' && <Crown size={12} />}
                                                                    {userData.rol === 'admin' && <Cog size={12} />}
                                                                    {userData.rol === 'usuario' && <Shield size={12} />}
                                                                    {userData.rol}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <button
                                                            onClick={() => window.open(process.env.NEXT_PUBLIC_SSO_URL_HEADER, '_blank')}
                                                            className={`w-full py-2.5 px-4 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 active:scale-95 ${isDarkMode
                                                                ? 'bg-white text-black hover:bg-gray-200'
                                                                : 'bg-black text-white hover:bg-gray-800 shadow-md shadow-black/10'
                                                                }`}
                                                        >
                                                            <img
                                                                src={isDarkMode ? "/images/BlackLogo.png" : "/images/WhiteLogo.png"}
                                                                alt="AX"
                                                                className="h-2.5 w-auto object-contain"
                                                            />
                                                            Panel de Usuario
                                                        </button>

                                                        <button
                                                            onClick={confirmLogout}
                                                            className={`w-full py-2.5 px-4 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 active:scale-95 ${isDarkMode
                                                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                                                                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                                                }`}
                                                        >
                                                            <LogOut size={14} />
                                                            Cerrar Sesión
                                                        </button>
                                                    </div>
                                                ) : (
                                                    // === VIEW: TRADITIONAL USER (Sync Prompt) ===
                                                    <div className="p-6 flex flex-col items-center gap-6">
                                                        {/* Minimalist Institutional Connection */}
                                                        <div className="relative flex items-center justify-center w-full">
                                                            <div className="flex items-center justify-between w-full max-w-[140px] relative">
                                                                {/* Local Node - Strict Minimalist */}
                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors duration-300 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-500'}`}>
                                                                    <span className="text-[10px] font-bold tracking-tighter">{getInitials()}</span>
                                                                </div>

                                                                {/* Minimalist Connector Line */}
                                                                <div className={`h-[1px] flex-1 mx-2 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>

                                                                {/* AXpert Node - Dynamic Logo */}
                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors duration-300 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                                                                    <img
                                                                        src={isDarkMode ? "/images/WhiteLogo.png" : "/images/BlackLogo.png"}
                                                                        alt="AXpert"
                                                                        className="w-5 h-auto grayscale opacity-80"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Institutional Messaging */}
                                                        <div className="text-center space-y-2">
                                                            <h4 className={`text-sm font-bold tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                                                                Portal de Identidad Institucional
                                                            </h4>
                                                            <p className={`text-[10px] leading-relaxed px-1 transition-colors duration-300 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                                Vincule su cuenta local con la plataforma <span className="font-semibold italic">AXpert</span> para formalizar su acceso y asegurar la integridad de sus datos institucionales.
                                                            </p>
                                                        </div>

                                                        {/* Action Button (Keep unchanged architecture, but following previous styling) */}

                                                        {/* Action Button (Keep unchanged) */}

                                                        {/* Action Button */}
                                                        <button
                                                            className={`group relative w-full py-3 px-4 rounded-xl overflow-hidden transition-all duration-300 active:scale-95 shadow-lg ${isDarkMode
                                                                ? 'bg-neutral-100 text-black border border-white hover:border-neutral-300'
                                                                : 'bg-black text-white border border-black hover:border-gray-800'
                                                                }`}
                                                            onClick={async () => {
                                                                // Iniciar flujo de vinculación
                                                                window.location.href = '/api/auth/sso?mode=linking';
                                                            }}
                                                        >
                                                            {/* Default State */}
                                                            <div className="relative z-10 flex items-center justify-center gap-2 group-hover:opacity-0 transition-opacity duration-300">
                                                                <span className="text-[10px] uppercase font-extrabold tracking-widest">Vincular Cuenta</span>
                                                            </div>

                                                            {/* Hover Overlay Background (Inverted) */}
                                                            <div className={`absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out ${isDarkMode ? 'bg-black' : 'bg-white'}`}></div>

                                                            {/* Hover Content (Inverted Colors) */}
                                                            <div className={`absolute inset-0 z-10 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                                <span className="text-[10px] uppercase font-extrabold tracking-widest">Conectar</span>
                                                                <img
                                                                    src={isDarkMode ? "/images/WhiteLogo.png" : "/images/BlackLogo.png"}
                                                                    alt="AX"
                                                                    className="h-2.5 w-auto object-contain"
                                                                />
                                                            </div>
                                                        </button>

                                                        {/* User Role Badge */}
                                                        {userData.rol && (
                                                            <div className={`w-full flex justify-center`}>
                                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${isDarkMode
                                                                    ? 'bg-white text-black border-white'
                                                                    : 'bg-black text-white border-black'
                                                                    }`}>
                                                                    {userData.rol === 'superadmin' && <Crown size={12} />}
                                                                    {userData.rol === 'admin' && <Cog size={12} />}
                                                                    {userData.rol === 'usuario' && <Shield size={12} />}
                                                                    {userData.rol}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={confirmLogout}
                                                            className={`w-full py-2.5 px-4 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 active:scale-95 ${isDarkMode
                                                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                                                                : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                                                }`}
                                                        >
                                                            <LogOut size={14} />
                                                            Cerrar Sesión
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div >
                    </div >

                    <button
                        onClick={toggleMobileMenu}
                        className={`md:hidden p-2 rounded-full transition-all duration-200 hover:scale-110 ${isDarkMode
                            ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div >
            </div >

            {/* Mobile Menu */}
            {
                mobileMenuOpen && (
                    <div className={`md:hidden ${pathname === '/' ? (isDarkMode ? 'bg-black/80 backdrop-blur-md' : 'bg-white/80 backdrop-blur-md') : (isDarkMode ? 'bg-black' : 'bg-white')} animate-in slide-in-from-top-4 fade-in duration-300`}>
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            <RoleGuard roles={["superadmin"]} userRole={userData.rol}>
                                <div>
                                    <button
                                        onClick={() => toggleMenu("Inventario")}
                                        className={`flex justify-between w-full px-3 py-2 rounded-md transition-all duration-300 ${isActive("/inventario")
                                            ? isDarkMode ? 'text-white bg-white/10 border border-white/20' : 'text-gray-900 bg-gray-100 border border-gray-300'
                                            : isDarkMode
                                                ? `text-gray-300 hover:text-white ${pathname === '/' ? 'hover:bg-white/10' : 'hover:bg-gray-800'}`
                                                : `text-gray-600 hover:text-gray-900 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-gray-100'}`
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <span className="mr-3"><Database className="w-4 h-4" /></span>
                                            Inventario
                                        </div>
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openMenu === "Inventario" ? 'rotate-180' : ''}`} />
                                    </button>
                                    {openMenu === "Inventario" && (
                                        <div className="pl-6 py-1 animate-in slide-in-from-top-2 fade-in duration-200">
                                            <RoleGuard roles={["superadmin"]} userRole={userData.rol}>
                                                <Link
                                                    href="/inventario/registro"
                                                    onClick={closeAll}
                                                    className={`block px-3 py-2 rounded-md text-sm transition-all duration-200 ${pathname === "/inventario/registro"
                                                        ? isDarkMode ? 'text-white bg-white/10 border-l-2 border-white' : 'text-gray-900 bg-gray-100 border-l-2 border-gray-900'
                                                        : isDarkMode
                                                            ? `text-gray-400 hover:text-white hover:translate-x-1 ${pathname === '/' ? 'hover:bg-white/10' : 'hover:bg-gray-800'}`
                                                            : `text-gray-500 hover:text-gray-900 hover:translate-x-1 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-gray-100'}`
                                                        }`}
                                                >
                                                    Añadir nuevos bienes
                                                </Link>
                                            </RoleGuard>
                                        </div>
                                    )}
                                </div>
                            </RoleGuard>
                            {menuItems.slice(1, 4).map((item) => (
                                <div key={item.title}>
                                    <button
                                        onClick={() => toggleMenu(item.title)}
                                        className={`flex justify-between w-full px-3 py-2 rounded-md transition-all duration-300 ${isActive(item.path)
                                            ? isDarkMode ? 'text-white bg-white/10 border border-white/20' : 'text-gray-900 bg-gray-100 border border-gray-300'
                                            : isDarkMode
                                                ? `text-gray-300 hover:text-white ${pathname === '/' ? 'hover:bg-white/10' : 'hover:bg-gray-800'}`
                                                : `text-gray-600 hover:text-gray-900 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-gray-100'}`
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <span className="mr-3">{item.icon}</span>
                                            {item.title}
                                        </div>
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openMenu === item.title ? 'rotate-180' : ''}`} />
                                    </button>

                                    {openMenu === item.title && item.submenu && (
                                        <div className="pl-6 py-1 animate-in slide-in-from-top-2 fade-in duration-200">
                                            {item.submenu.map((subItem) => (
                                                <div key={subItem.title} className="py-1">
                                                    {subItem.children ? (
                                                        <div>
                                                            <button
                                                                onClick={(e) => toggleSubmenu(`${item.title}-${subItem.title}`, e)}
                                                                className={`flex justify-between w-full px-3 py-2 rounded-md text-sm transition-all duration-200 ${isActive(subItem.path)
                                                                    ? isDarkMode ? 'text-white bg-white/10 border-l-2 border-white' : 'text-gray-900 bg-gray-100 border-l-2 border-gray-900'
                                                                    : isDarkMode
                                                                        ? `text-gray-400 hover:text-white hover:translate-x-1 ${pathname === '/' ? 'hover:bg-white/10' : 'hover:bg-gray-800'}`
                                                                        : `text-gray-500 hover:text-gray-900 hover:translate-x-1 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-gray-100'}`
                                                                    }`}
                                                            >
                                                                {subItem.title}
                                                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openSubmenu === `${item.title}-${subItem.title}` ? 'rotate-180' : ''}`} />
                                                            </button>

                                                            {openSubmenu === `${item.title}-${subItem.title}` && (
                                                                <div className="pl-3 py-1 animate-in slide-in-from-top-2 fade-in duration-200">
                                                                    {subItem.children.map((child) => (
                                                                        <Link
                                                                            key={child.title}
                                                                            href={child.path}
                                                                            onClick={closeAll}
                                                                            className={`block px-3 py-2 rounded-md text-sm transition-all duration-200 ${pathname === child.path
                                                                                ? isDarkMode ? 'text-white bg-white/10 border-l-2 border-white' : 'text-gray-900 bg-gray-100 border-l-2 border-gray-900'
                                                                                : isDarkMode
                                                                                    ? `text-gray-400 hover:text-white hover:translate-x-1 ${pathname === '/' ? 'hover:bg-white/10' : 'hover:bg-gray-800'}`
                                                                                    : `text-gray-500 hover:text-gray-900 hover:translate-x-1 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-gray-100'}`
                                                                                }`}
                                                                        >
                                                                            {child.title}
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : subItem.title === 'Crear resguardo' ? (
                                                        <RoleGuard roles={["admin", "superadmin"]} userRole={userData.rol}>
                                                            <Link
                                                                href={subItem.path}
                                                                onClick={closeAll}
                                                                className={`block px-3 py-2 rounded-md text-sm transition-all duration-200 ${pathname === subItem.path
                                                                    ? isDarkMode ? 'text-white bg-white/10 border-l-2 border-white' : 'text-gray-900 bg-gray-100 border-l-2 border-gray-900'
                                                                    : isDarkMode
                                                                        ? `text-gray-400 hover:text-white hover:translate-x-1 ${pathname === '/' ? 'hover:bg-white/10' : 'hover:bg-gray-800'}`
                                                                        : `text-gray-500 hover:text-gray-900 hover:translate-x-1 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-gray-100'}`
                                                                    }`}
                                                            >
                                                                {subItem.title}
                                                            </Link>
                                                        </RoleGuard>
                                                    ) : (
                                                        <Link
                                                            href={subItem.path}
                                                            onClick={closeAll}
                                                            className={`block px-3 py-2 rounded-md text-sm transition-all duration-200 ${pathname === subItem.path
                                                                ? isDarkMode ? 'text-white bg-white/10 border-l-2 border-white' : 'text-gray-900 bg-gray-100 border-l-2 border-gray-900'
                                                                : isDarkMode
                                                                    ? `text-gray-400 hover:text-white hover:translate-x-1 ${pathname === '/' ? 'hover:bg-white/10' : 'hover:bg-gray-800'}`
                                                                    : `text-gray-500 hover:text-gray-900 hover:translate-x-1 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-gray-100'}`
                                                                }`}
                                                        >
                                                            {subItem.title}
                                                        </Link>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <RoleGuard roles={["superadmin"]} userRole={userData.rol}>
                                <div>
                                    <button
                                        onClick={() => toggleMenu("Administración")}
                                        className={`flex justify-between w-full px-3 py-2 rounded-md transition-all duration-300 ${isActive("/admin")
                                            ? isDarkMode ? 'text-white bg-white/10 border border-white/20' : 'text-gray-900 bg-gray-100 border border-gray-300'
                                            : isDarkMode
                                                ? `text-gray-300 hover:text-white ${pathname === '/' ? 'hover:bg-white/10' : 'hover:bg-gray-800'}`
                                                : `text-gray-600 hover:text-gray-900 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-gray-100'}`
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <span className="mr-3"><Settings className="w-4 h-4" /></span>
                                            Administración
                                        </div>
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openMenu === "Administración" ? 'rotate-180' : ''}`} />
                                    </button>
                                    {openMenu === "Administración" && (
                                        <div className="pl-6 py-1 animate-in slide-in-from-top-2 fade-in duration-200">
                                            <Link
                                                href="/admin/areas"
                                                onClick={closeAll}
                                                className={`block px-3 py-2 rounded-md text-sm transition-all duration-200 ${pathname === "/admin/areas"
                                                    ? isDarkMode ? 'text-white bg-white/10 border-l-2 border-white' : 'text-gray-900 bg-gray-100 border-l-2 border-gray-900'
                                                    : isDarkMode
                                                        ? `text-gray-400 hover:text-white hover:translate-x-1 ${pathname === '/' ? 'hover:bg-white/10' : 'hover:bg-gray-800'}`
                                                        : `text-gray-500 hover:text-gray-900 hover:translate-x-1 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-gray-100'}`
                                                    }`}
                                            >
                                                Configuración General
                                            </Link>
                                            <Link
                                                href="/admin/personal"
                                                onClick={closeAll}
                                                className={`block px-3 py-2 rounded-md text-sm transition-all duration-200 ${pathname === "/admin/personal"
                                                    ? isDarkMode ? 'text-white bg-white/10 border-l-2 border-white' : 'text-gray-900 bg-gray-100 border-l-2 border-gray-900'
                                                    : isDarkMode
                                                        ? `text-gray-400 hover:text-white hover:translate-x-1 ${pathname === '/' ? 'hover:bg-white/10' : 'hover:bg-gray-800'}`
                                                        : `text-gray-500 hover:text-gray-900 hover:translate-x-1 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-gray-100'}`
                                                    }`}
                                            >
                                                Directorio de Personal
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </RoleGuard>
                        </div>

                        <div className="pt-4 pb-3 border-t border-gray-800 px-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <User className="h-10 w-10 text-gray-300" />
                                </div>
                                <div className="ml-3">
                                    <div className="text-base font-medium text-white">{userData.firstName ? `${userData.firstName}${userData.lastName ? ' ' + userData.lastName : ''}` : userData.username || 'Usuario'}</div>
                                    {userData.rol && (
                                        <div className="text-xs text-gray-400 mt-0.5">{userData.rol}</div>
                                    )}
                                </div>
                                <div className="ml-auto flex space-x-2">
                                    <button
                                        onClick={initiateLogout}
                                        className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-full transition-all duration-200 hover:scale-110"
                                        title='Cerrar sesión'
                                    >
                                        <LogOut className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Logout Confirmation Popover */}
            {
                showLogoutModal && (
                    <div
                        className="fixed z-50 animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            position: 'fixed',
                            top: `${modalPosition.y}px`,
                            left: `${modalPosition.x}px`,
                            transform: 'translateX(-50%)',
                        }}
                    >
                        <div
                            className={`${isDarkMode ? 'bg-black/95 border-white/10' : 'bg-white/95 border-gray-200'} backdrop-blur-md rounded-2xl border overflow-visible w-64 popover-content shadow-2xl transition-all duration-300`}
                            data-position={popoverPosition}
                            style={{
                                '--arrow-x': '50%',
                                maxWidth: 'calc(100vw - 32px)',
                                marginTop: popoverPosition === 'bottom' ? '8px' : undefined,
                                marginBottom: popoverPosition === 'top' ? '8px' : undefined,
                            } as React.CSSProperties}
                        >
                            <div className="p-4">
                                <div className="flex flex-col items-center text-center gap-3">
                                    <div className={`p-2.5 ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-gray-100'} rounded-xl`}>
                                        <User className={`h-5 w-5 ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {userData.firstName ? `${userData.firstName}${userData.lastName ? ' ' + userData.lastName : ''}` : userData.username || 'Usuario'}
                                        </p>
                                        {userData.rol && (
                                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {userData.rol}
                                            </p>
                                        )}
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
                                            ¿Cerrar sesión?
                                        </p>
                                    </div>
                                    <div className="flex w-full gap-3 mt-2">
                                        <button
                                            onClick={() => setShowLogoutModal(false)}
                                            className={`flex-1 py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all duration-300 active:scale-95 ${isDarkMode
                                                ? 'bg-transparent text-white/50 hover:text-white hover:bg-white/5 border-white/10'
                                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-200'
                                                }`}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={confirmLogout}
                                            className={`flex-1 py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all duration-300 active:scale-95 ${isDarkMode
                                                ? 'bg-white text-black hover:bg-gray-100 border-white'
                                                : 'bg-black text-white hover:bg-gray-800 border-black'
                                                }`}
                                        >
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </nav >
    );
}