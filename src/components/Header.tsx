"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, User, LogOut, Database, FileText, Settings, Menu, X, Grid } from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import supabase from '@/app/lib/supabase/client';
import { WelcomeMessage } from "@/components/WelcomeMessage";
import RoleGuard from "@/components/roleGuard";

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
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
    const [userData, setUserData] = useState<{ firstName?: string; lastName?: string; username?: string; email?: string; rol?: string }>({});
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
    const [popoverPosition, setPopoverPosition] = useState<'top' | 'bottom'>('bottom');
    const handleLogout = useCerrarSesion();

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
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showLogoutModal]);

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
                {title: 'Consultar bajas', path: '/resguardos/consultar/bajas'},
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
        <nav className="bg-black text-white shadow-lg relative z-50">
            {/* Desktop Navigation */}
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/" onClick={closeAll} className="hover:opacity-80 transition-opacity">
                                <img
                                    src="/images/ITEA_logo.svg"  // Ruta a tu imagen en la carpeta public
                                    alt="Logo ITEA"
                                    className="h-10 w-auto"  // Ajusta la altura según necesites
                                />
                            </Link>
                        </div>
                        <div className="hidden md:ml-8 md:flex md:space-x-1">
                            {menuItems.map((item) => (
                                <div key={item.title} className="relative">
                                    {item.submenu ? (
                                        <>
                                            <button
                                                onClick={() => toggleMenu(item.title)}
                                                className={`flex items-center px-4 py-2 rounded-md ${isActive(item.path) ? 'text-blue-400 bg-blue-950' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
                                            >
                                                <span className="mr-2">{item.icon}</span>
                                                {item.title}
                                                <ChevronDown className={`ml-1 w-3 h-3 transition-transform ${openMenu === item.title ? 'rotate-180' : ''}`} />
                                            </button>
                                            {openMenu === item.title && (
                                                <div className="absolute left-0 mt-1 w-56 rounded-md bg-black shadow-lg z-20">
                                                    <div className="py-1">
                                                        {item.submenu.map((subItem) => (
                                                            <div key={subItem.title}>
                                                                {subItem.children ? (
                                                                    <div className="relative">
                                                                        <button
                                                                            onClick={(e) => toggleSubmenu(`${item.title}-${subItem.title}`, e)}
                                                                            className={`flex justify-between w-full px-4 py-2 text-sm ${isActive(subItem.path) ? 'text-blue-400 bg-black' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                                                                        >
                                                                            {subItem.title}
                                                                            <ChevronRight className="w-3 h-3" />
                                                                        </button>
                                                                        {openSubmenu === `${item.title}-${subItem.title}` && (
                                                                            <div className="absolute left-full top-0 w-56 rounded-md bg-black shadow-lg z-30">
                                                                                <div className="py-1">
                                                                                    {subItem.children.map((child) => (
                                                                                        <Link
                                                                                            key={child.title}
                                                                                            href={child.path}
                                                                                            onClick={closeAll}
                                                                                            className={`block px-4 py-2 text-sm ${pathname === child.path ? 'text-blue-400 bg-black' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                                                                                        >
                                                                                            {child.title}
                                                                                        </Link>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <Link
                                                                        href={subItem.path}
                                                                        onClick={closeAll}
                                                                        className={`block px-4 py-2 text-sm ${pathname === subItem.path ? 'text-blue-400 bg-black' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
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
                                            className={`flex items-center px-4 py-2 rounded-md ${isActive(item.path) ? 'text-blue-400 bg-blue-950' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
                                        >
                                            <span className="mr-2">{item.icon}</span>
                                            {item.title}
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="hidden md:flex items-center">
                        <WelcomeMessage />
                        <div className="flex items-center space-x-3">
                        <RoleGuard roles={["superadmin"]} userRole={userData.rol}>
                            <Link
                                href="/register"
                                className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-full"
                                title="Añadir usuario"
                            >
                                <User className="h-5 w-5" />
                            </Link>
                        </RoleGuard>
                            <Link
                                href="/dashboard"
                                className={`p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-full ${pathname === '/dashboard' ? 'text-blue-400 bg-blue-950' : ''}`}
                                title="Dashboard"
                            >
                                <Grid className="h-5 w-5" />
                            </Link>
                            <button 
                                onClick={initiateLogout} 
                                className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-full" 
                                title='Cerrar sesión'
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={toggleMobileMenu}
                        className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-black">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {menuItems.map((item) => (
                            <div key={item.title}>
                                <button
                                    onClick={() => toggleMenu(item.title)}
                                    className={`flex justify-between w-full px-3 py-2 rounded-md ${isActive(item.path) ? 'text-blue-400 bg-black' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
                                >
                                    <div className="flex items-center">
                                        <span className="mr-3">{item.icon}</span>
                                        {item.title}
                                    </div>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${openMenu === item.title ? 'rotate-180' : ''}`} />
                                </button>

                                {openMenu === item.title && item.submenu && (
                                    <div className="pl-6 py-1">
                                        {item.submenu.map((subItem) => (
                                            <div key={subItem.title} className="py-1">
                                                {subItem.children ? (
                                                    <div>
                                                        <button
                                                            onClick={(e) => toggleSubmenu(`${item.title}-${subItem.title}`, e)}
                                                            className={`flex justify-between w-full px-3 py-2 rounded-md text-sm ${isActive(subItem.path) ? 'text-blue-400 bg-black' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                                                        >
                                                            {subItem.title}
                                                            <ChevronDown className={`w-4 h-4 transition-transform ${openSubmenu === `${item.title}-${subItem.title}` ? 'rotate-180' : ''}`} />
                                                        </button>

                                                        {openSubmenu === `${item.title}-${subItem.title}` && (
                                                            <div className="pl-3 py-1">
                                                                {subItem.children.map((child) => (
                                                                    <Link
                                                                        key={child.title}
                                                                        href={child.path}
                                                                        onClick={closeAll}
                                                                        className={`block px-3 py-2 rounded-md text-sm ${pathname === child.path ? 'text-blue-400 bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                                                                    >
                                                                        {child.title}
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Link
                                                        href={subItem.path}
                                                        onClick={closeAll}
                                                        className={`block px-3 py-2 rounded-md text-sm ${pathname === subItem.path ? 'text-blue-400 bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
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
                                    className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-full" 
                                    title='Cerrar sesión'
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Popover */}
            {showLogoutModal && (
                <div 
                    className="fixed z-50"
                    style={{
                        position: 'fixed',
                        top: `${modalPosition.y}px`,
                        left: `${modalPosition.x}px`,
                        transform: 'translateX(-50%)',
                    }}
                >
                    <div 
                        className="bg-gray-900/95 backdrop-blur-sm rounded-lg border border-blue-500/20 overflow-visible w-64 popover-content"
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
                                <div className="p-2 bg-blue-500/10 rounded-full">
                                    <LogOut className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-300">
                                        {userData.firstName 
                                            ? `¿Cerrar sesión, ${userData.firstName}?`
                                            : "¿Cerrar sesión?"}
                                    </p>
                                </div>
                                <div className="flex w-full gap-2">
                                    <button
                                        onClick={() => setShowLogoutModal(false)}
                                        className="flex-1 py-1.5 px-3 bg-gray-800/50 text-gray-300 text-xs rounded-md hover:bg-gray-800 border border-gray-700/50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmLogout}
                                        className="flex-1 py-1.5 px-3 bg-blue-600/20 text-blue-300 text-xs rounded-md hover:bg-blue-600/30 border border-blue-500/30 transition-colors"
                                    >
                                        Confirmar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}