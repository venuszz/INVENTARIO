"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, User, LogOut, Database, FileText, Settings, Menu, X, Grid, Bell, Moon, Sun } from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import supabase from '@/app/lib/supabase/client';
import RoleGuard from "@/components/roleGuard";
import NotificationsPanel from './NotificationCenter';
import NotificationsUnderConstruction from './NotificationsUnderConstruction';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from "@/context/ThemeContext";
import GlobalSearch from './GlobalSearch';


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
            // Cerrar sesión en Supabase
            await supabase.auth.signOut();

            // Eliminar tokens y datos del usuario
            Cookies.remove('authToken', { path: '/' });
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');

            // Redireccionar al login
            router.push('/login');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
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
    const [isClosingNotifications, setIsClosingNotifications] = useState(false);
    const [userData, setUserData] = useState<{ firstName?: string; lastName?: string; username?: string; email?: string; rol?: string }>({});
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
    const [popoverPosition, setPopoverPosition] = useState<'top' | 'bottom'>('bottom');

    // New state for notifications popover
    const [notifPosition, setNotifPosition] = useState({ x: 0, y: 0 });
    const [notifPopoverPos, setNotifPopoverPos] = useState<'top' | 'bottom'>('bottom');

    const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [logoShouldHide, setLogoShouldHide] = useState(false);
    const [searchBarShouldHide, setSearchBarShouldHide] = useState(false);
    const handleLogout = useCerrarSesion();
    const { notifications, doNotDisturb } = useNotifications();
    const unreadCount = notifications.filter(n => !n.is_read && !n.data?.is_deleted).length;

    // Refs para detectar colisiones
    const logoRef = useRef<HTMLDivElement>(null);
    const menuContainerRef = useRef<HTMLDivElement>(null);
    const searchBarRef = useRef<HTMLDivElement>(null);
    const actionButtonsRef = useRef<HTMLDivElement>(null);
    const actionButtonsContainerRef = useRef<HTMLDivElement>(null);
    const notificationWrapperRef = useRef<HTMLDivElement>(null);

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

    // Efecto para actualizar el estado cuando cambia doNotDisturb
    useEffect(() => {
        // Este efecto se ejecutará cada vez que doNotDisturb cambie
        // asegurando que el Header se actualice inmediatamente
    }, [doNotDisturb]);

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

    useEffect(() => {
        const userDataCookie = Cookies.get('userData');
        if (userDataCookie) {
            try {
                const parsed = JSON.parse(userDataCookie);
                setUserData({
                    firstName: parsed.firstName,
                    lastName: parsed.lastName,
                    username: parsed.username,
                    email: parsed.email,
                    rol: parsed.rol
                });
            } catch {
                setUserData({});
            }
        }
    }, []);

    // Cerrar popover al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showLogoutModal && !(event.target as HTMLElement).closest('.popover-content')) {
                setShowLogoutModal(false);
            }
            if (notificationsOpen && !(event.target as HTMLElement).closest('.notif-popover-content') && !(event.target as HTMLElement).closest('.notification-trigger')) {
                setNotificationsOpen(false);
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

    const handleNotificationsClick = (event: React.MouseEvent) => {
        if (notificationsOpen) {
            setIsClosingNotifications(true);
            setTimeout(() => {
                setNotificationsOpen(false);
                setIsClosingNotifications(false);
            }, 300);
            return;
        }

        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Configuración del popover
        const POPOVER_WIDTH = 320; // Width in pixels
        const MARGIN = 24; // Increased margin

        // Posición inicial: intentamos centrarlo con el botón
        let x = rect.left + rect.width / 2;
        let y = rect.bottom + 16; // Un poco más de espacio vertical
        let position: 'top' | 'bottom' = 'bottom';

        // Ajuste horizontal inteligente
        // Si se sale por la derecha
        if (x + POPOVER_WIDTH / 2 > windowWidth - MARGIN) {
            x = windowWidth - POPOVER_WIDTH / 2 - MARGIN;
        }
        // Si se sale por la izquierda
        else if (x - POPOVER_WIDTH / 2 < MARGIN) {
            x = POPOVER_WIDTH / 2 + MARGIN;
        }

        // Ajuste vertical
        if (y + 500 > windowHeight - MARGIN) { // Altura estimada del popover
            y = rect.top - 16;
            position = 'top';
        }

        setNotifPosition({ x, y });
        setNotifPopoverPos(position);
        setNotificationsOpen(true);
    };

    const confirmLogout = async () => {
        await handleLogout();
        setShowLogoutModal(false);
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
                    title: 'Levantamiento',
                    path: '/consultas/levantamiento',
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
        <nav className={`${pathname === '/' ? (isDarkMode ? 'text-white' : 'text-gray-900') : (isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900')} ${pathname === '/' ? '' : 'shadow-lg'} ${pathname === '/' ? 'fixed top-0 left-0 right-0' : 'relative'} z-50 transition-colors duration-300`}>
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
                    <div className="flex-1 flex justify-center">
                        <div className="hidden md:flex md:space-x-1">
                            <RoleGuard roles={["admin", "superadmin"]} userRole={userData.rol}>
                                <div
                                    className="relative"
                                    onMouseEnter={() => handleMenuHover("Inventario")}
                                    onMouseLeave={() => handleMenuHover(null)}
                                >
                                    <button
                                        onClick={() => toggleMenu("Inventario")}
                                        className={`flex items-center px-4 py-2 rounded-md transition-all duration-300 ease-in-out transform ${isActive("/inventario")
                                            ? isDarkMode ? 'text-white bg-white/10 border border-white/20 scale-105' : 'text-gray-900 bg-gray-100 border border-gray-300 scale-105'
                                            : isDarkMode
                                                ? `text-gray-300 hover:text-white hover:scale-105 ${pathname === '/' ? 'hover:bg-white/10' : 'hover:bg-gray-800'}`
                                                : `text-gray-600 hover:text-gray-900 hover:scale-105 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-gray-100'}`
                                            }`}
                                    >
                                        <span className="mr-2"><Database className="w-4 h-4" /></span>
                                        Inventario
                                        <ChevronDown className={`ml-1 w-3 h-3 transition-transform duration-300 ${openMenu === "Inventario" ? 'rotate-180' : ''}`} />
                                    </button>
                                    {openMenu === "Inventario" && (
                                        <div className={`absolute left-0 mt-1 w-56 rounded-md ${pathname === '/' ? (isDarkMode ? 'bg-black/20 border-white/20 backdrop-blur-md' : 'bg-white/20 border-gray-200/30 backdrop-blur-md') : (isDarkMode ? 'bg-black border-white/10' : 'bg-white border-gray-200')} shadow-lg z-20 border animate-in slide-in-from-top-2 fade-in duration-200`}>
                                            <div className="py-1">
                                                <RoleGuard roles={["admin", "superadmin"]} userRole={userData.rol}>
                                                    <Link
                                                        href="/inventario/registro"
                                                        onClick={closeAll}
                                                        className={`block px-4 py-2 text-sm transition-all duration-200 ${pathname === "/inventario/registro"
                                                            ? isDarkMode ? 'text-white bg-white/10 border-r-2 border-white' : 'text-gray-900 bg-gray-100 border-r-2 border-gray-900'
                                                            : isDarkMode
                                                                ? `text-gray-300 hover:text-white hover:translate-x-1 ${pathname === '/' ? 'hover:bg-white/10' : 'hover:bg-gray-800'}`
                                                                : `text-gray-600 hover:text-gray-900 hover:translate-x-1 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-gray-100'}`
                                                            }`}
                                                    >
                                                        Registro de nuevos bienes
                                                    </Link>
                                                </RoleGuard>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </RoleGuard >
                            {
                                menuItems.slice(1, 4).map((item) => (
                                    <div
                                        key={item.title}
                                        className="relative"
                                        onMouseEnter={() => handleMenuHover(item.title)}
                                        onMouseLeave={() => handleMenuHover(null)}
                                    >
                                        {item.submenu ? (
                                            <>
                                                <button
                                                    className={`flex items-center px-4 py-2 rounded-md transition-all duration-500 ease-in-out transform ${isActive(item.path)
                                                        ? isDarkMode ? 'text-white bg-white/10 border border-white/20 scale-105' : 'text-gray-900 bg-gray-100 border border-gray-300 scale-105'
                                                        : isDarkMode
                                                            ? `text-gray-300 hover:text-white hover:scale-105 ${pathname === '/' ? 'hover:bg-white/10' : 'hover:bg-gray-800'}`
                                                            : `text-gray-600 hover:text-gray-900 hover:scale-105 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-gray-100'}`
                                                        }`}
                                                >
                                                    <span className="mr-2">{item.icon}</span>
                                                    {item.title}
                                                    <ChevronDown className={`ml-1 w-3 h-3 transition-transform duration-500 ease-in-out ${openMenu === item.title ? 'rotate-180' : ''}`} />
                                                </button>
                                                {openMenu === item.title && (
                                                    <div data-dropdown="true" className={`absolute left-0 mt-1 w-56 rounded-md ${pathname === '/' ? (isDarkMode ? 'bg-black/20 border-white/20 backdrop-blur-md' : 'bg-white/20 border-gray-200/30 backdrop-blur-md') : (isDarkMode ? 'bg-black border-white/10' : 'bg-white border-gray-200')} shadow-lg z-20 border animate-in slide-in-from-top-2 fade-in duration-300`}>
                                                        <div className="py-1">
                                                            {item.submenu.map((subItem) => (
                                                                <div key={subItem.title}>
                                                                    {subItem.children ? (
                                                                        <div
                                                                            className="relative"
                                                                            onMouseEnter={() => handleSubmenuHover(`${item.title}-${subItem.title}`)}
                                                                            onMouseLeave={() => handleSubmenuHover(null)}
                                                                        >
                                                                            <button
                                                                                className={`flex justify-between w-full px-4 py-2 text-sm transition-all duration-300 ${isActive(subItem.path)
                                                                                    ? isDarkMode ? 'text-white bg-white/10 border-r-2 border-white' : 'text-gray-900 bg-gray-100 border-r-2 border-gray-900'
                                                                                    : isDarkMode
                                                                                        ? `text-gray-300 hover:text-white hover:translate-x-1 ${pathname === '/' ? 'hover:bg-white/10' : 'hover:bg-gray-800'}`
                                                                                        : `text-gray-600 hover:text-gray-900 hover:translate-x-1 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-gray-100'}`
                                                                                    }`}
                                                                            >
                                                                                {subItem.title}
                                                                                <ChevronRight className="w-3 h-3" />
                                                                            </button>
                                                                            {openSubmenu === `${item.title}-${subItem.title}` && (
                                                                                <div data-dropdown="true" className={`absolute left-full top-0 w-56 rounded-md ${pathname === '/' ? (isDarkMode ? 'bg-black/20 border-white/20 backdrop-blur-md' : 'bg-white/20 border-gray-200/30 backdrop-blur-md') : (isDarkMode ? 'bg-black border-white/10' : 'bg-white border-gray-200')} shadow-lg z-30 border animate-in slide-in-from-left-2 fade-in duration-300`}>
                                                                                    <div className="py-1">
                                                                                        {subItem.children.map((child) => (
                                                                                            <Link
                                                                                                key={child.title}
                                                                                                href={child.path}
                                                                                                onClick={closeAll}
                                                                                                className={`block px-4 py-2 text-sm transition-all duration-200 ${pathname === child.path
                                                                                                    ? isDarkMode ? 'text-white bg-white/10 border-r-2 border-white' : 'text-gray-900 bg-gray-100 border-r-2 border-gray-900'
                                                                                                    : isDarkMode
                                                                                                        ? `text-gray-300 hover:text-white hover:translate-x-1 ${pathname === '/' ? 'hover:bg-white/10' : 'hover:bg-gray-800'}`
                                                                                                        : `text-gray-600 hover:text-gray-900 hover:translate-x-1 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-gray-100'}`
                                                                                                    }`}
                                                                                            >
                                                                                                {child.title}
                                                                                            </Link>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : subItem.title === 'Crear resguardo' ? (
                                                                        <RoleGuard roles={["admin", "superadmin"]} userRole={userData.rol}>
                                                                            <Link
                                                                                href={subItem.path}
                                                                                onClick={closeAll}
                                                                                className={`block px-4 py-2 text-sm transition-all duration-200 ${pathname === subItem.path
                                                                                    ? isDarkMode ? 'text-white bg-white/10 border-r-2 border-white' : 'text-gray-900 bg-gray-100 border-r-2 border-gray-900'
                                                                                    : isDarkMode
                                                                                        ? `text-gray-300 hover:text-white hover:translate-x-1 ${pathname === '/' ? 'hover:bg-white/10' : 'hover:bg-gray-800'}`
                                                                                        : `text-gray-600 hover:text-gray-900 hover:translate-x-1 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-gray-100'}`
                                                                                    }`}
                                                                            >
                                                                                {subItem.title}
                                                                            </Link>
                                                                        </RoleGuard>
                                                                    ) : (
                                                                        <Link
                                                                            href={subItem.path}
                                                                            onClick={closeAll}
                                                                            className={`block px-4 py-2 text-sm transition-all duration-200 ${pathname === subItem.path
                                                                                ? isDarkMode ? 'text-white bg-white/10 border-r-2 border-white' : 'text-gray-900 bg-gray-100 border-r-2 border-gray-900'
                                                                                : isDarkMode
                                                                                    ? `text-gray-300 hover:text-white hover:translate-x-1 ${pathname === '/' ? 'hover:bg-white/10' : 'hover:bg-gray-800'}`
                                                                                    : `text-gray-600 hover:text-gray-900 hover:translate-x-1 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-gray-100'}`
                                                                                }`}
                                                                        >
                                                                            {subItem.title}
                                                                        </Link>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <Link
                                                href={item.path}
                                                onClick={closeAll}
                                                className={`flex items-center px-4 py-2 rounded-md transition-all duration-500 ease-in-out transform ${isActive(item.path)
                                                    ? 'text-white bg-white/10 border border-white/20 scale-105'
                                                    : 'text-gray-300 hover:text-white hover:bg-gray-800 hover:scale-105'
                                                    }`}
                                            >
                                                <span className="mr-2">{item.icon}</span>
                                                {item.title}
                                            </Link>
                                        )}
                                    </div>
                                ))
                            }
                            < RoleGuard roles={["admin", "superadmin"]} userRole={userData.rol} >
                                <div
                                    className="relative"
                                    onMouseEnter={() => handleMenuHover("Administración")}
                                    onMouseLeave={() => handleMenuHover(null)}
                                >
                                    <button
                                        onClick={() => toggleMenu("Administración")}
                                        className={`flex items-center px-4 py-2 rounded-md transition-all duration-300 ease-in-out transform ${isActive("/admin")
                                            ? isDarkMode ? 'text-white bg-white/10 border border-white/20 scale-105' : 'text-gray-900 bg-gray-100 border border-gray-300 scale-105'
                                            : isDarkMode
                                                ? `text-gray-300 hover:text-white hover:scale-105 ${pathname === '/' ? 'hover:bg-white/10' : 'hover:bg-gray-800'}`
                                                : `text-gray-600 hover:text-gray-900 hover:scale-105 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-gray-100'}`
                                            }`}
                                    >
                                        <span className="mr-2"><Settings className="w-4 h-4" /></span>
                                        Administración
                                        <ChevronDown className={`ml-1 w-3 h-3 transition-transform duration-300 ${openMenu === "Administración" ? 'rotate-180' : ''}`} />
                                    </button>
                                    {openMenu === "Administración" && (
                                        <div className={`absolute left-0 mt-1 w-56 rounded-md ${pathname === '/' ? (isDarkMode ? 'bg-black/20 border-white/20 backdrop-blur-md' : 'bg-white/20 border-gray-200/30 backdrop-blur-md') : (isDarkMode ? 'bg-black border-white/10' : 'bg-white border-gray-200')} shadow-lg z-20 border animate-in slide-in-from-top-2 fade-in duration-200`}>
                                            <div className="py-1">
                                                <Link
                                                    href="/admin/areas"
                                                    onClick={closeAll}
                                                    className={`block px-4 py-2 text-sm transition-all duration-200 ${pathname === "/admin/areas"
                                                        ? isDarkMode ? 'text-white bg-white/10 border-r-2 border-white' : 'text-gray-900 bg-gray-100 border-r-2 border-gray-900'
                                                        : isDarkMode
                                                            ? `text-gray-300 hover:text-white hover:translate-x-1 ${pathname === '/' ? 'hover:bg-white/10' : 'hover:bg-gray-800'}`
                                                            : `text-gray-600 hover:text-gray-900 hover:translate-x-1 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-gray-100'}`
                                                        }`}
                                                >
                                                    Configuración General
                                                </Link>
                                                <Link
                                                    href="/admin/personal"
                                                    onClick={closeAll}
                                                    className={`block px-4 py-2 text-sm transition-all duration-200 ${pathname === "/admin/personal"
                                                        ? isDarkMode ? 'text-white bg-white/10 border-r-2 border-white' : 'text-gray-900 bg-gray-100 border-r-2 border-gray-900'
                                                        : isDarkMode
                                                            ? `text-gray-300 hover:text-white hover:translate-x-1 ${pathname === '/' ? 'hover:bg-white/10' : 'hover:bg-gray-800'}`
                                                            : `text-gray-600 hover:text-gray-900 hover:translate-x-1 ${pathname === '/' ? 'hover:bg-black/5' : 'hover:bg-gray-100'}`
                                                        }`}
                                                >
                                                    Directorio de Personal
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </RoleGuard >
                        </div >
                    </div >

                    {/* Search Bar - After Menus */}
                    < div
                        ref={searchBarRef}
                        className={`hidden md:flex items-center ml-4 transition-all duration-300 ease-in-out ${searchBarShouldHide ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'
                            }`
                        }
                    >
                        <GlobalSearch onExpandChange={handleSearchExpand} />
                    </div >

                    {/* Right side - Action buttons */}
                    < div ref={actionButtonsContainerRef} className="hidden md:flex items-center h-full ml-auto" >
                        {/* Hover trigger area for expanding buttons */}
                        < div
                            className="flex items-center h-full"
                            onMouseEnter={() => setIsHeaderExpanded(true)}
                            onMouseLeave={() => setIsHeaderExpanded(false)}
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
                                        className={`p-2 rounded-full relative transition-all duration-200 hover:scale-110 ${isDarkMode
                                            ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                            }`}
                                        title={doNotDisturb ? "Modo No Molestar activo" : "Notificaciones"}
                                    >
                                        <Bell className="h-5 w-5" />
                                        {unreadCount > 0 && (
                                            <>
                                                <span className={`absolute top-0 right-0 h-2 w-2 rounded-full ${doNotDisturb ? 'bg-purple-500' : 'bg-white'
                                                    }`}></span>
                                                {!doNotDisturb && (
                                                    <span className="absolute -top-2 -right-2 bg-white text-black text-xs font-bold rounded-full px-1.5 min-w-[18px] text-center border border-black shadow">
                                                        {unreadCount}
                                                    </span>
                                                )}
                                                {doNotDisturb && (
                                                    <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs font-bold rounded-full p-1 min-w-[18px] text-center border border-black shadow">
                                                        <Moon size={10} />
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </button>
                                    {notificationsOpen && (
                                        <div className="absolute right-0 top-full mt-2 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                                            <NotificationsPanel onClose={() => setNotificationsOpen(false)} />
                                        </div>
                                    )}
                                </div>
                            </RoleGuard>
                            <button
                                onClick={initiateLogout}
                                className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${isDarkMode
                                    ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                title='Cerrar sesión'
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
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
                            className={`${isDarkMode ? 'bg-gray-900/95 border-white/20' : 'bg-white/95 border-gray-200'} backdrop-blur-sm rounded-lg border overflow-visible w-64 popover-content shadow-xl transition-colors duration-300`}
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
                                    <div className={`p-2 ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'} rounded-full`}>
                                        <User className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} />
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
                                    <div className="flex w-full gap-2">
                                        <button
                                            onClick={() => setShowLogoutModal(false)}
                                            className={`flex-1 py-1.5 px-3 text-xs rounded-md border transition-all duration-200 hover:scale-105 ${isDarkMode
                                                ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-800 border-gray-700/50'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-300'
                                                }`}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={confirmLogout}
                                            className={`flex-1 py-1.5 px-3 text-xs rounded-md border transition-all duration-200 hover:scale-105 ${isDarkMode
                                                ? 'bg-white/20 text-white hover:bg-white/30 border-white/30'
                                                : 'bg-gray-900 text-white hover:bg-gray-800 border-gray-900'
                                                }`}
                                        >
                                            Confirmar
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