"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, User, LogOut, Database, FileText, Settings, Menu, X } from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import supabase from '@/app/lib/supabase/client'; // Asegúrate de que la ruta sea correcta

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

    const menuItems: MenuItem[] = [
        {
            title: 'Inventario',
            icon: <Database className="w-4 h-4" />,
            path: '/inventario',
            submenu: [
                { title: 'Registro de nuevos bienes', path: '/inventario/registro' },
                { title: 'Bienes obsoletos', path: '/inventario/obsoletos' },
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
                { title: 'Levantamiento de inventario', path: '/resguardos/levantamiento' },
                { title: 'Liberación de resguardos', path: '/resguardos/liberacion' }
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
                    children: [
                        { title: 'General', path: '/reportes/inea/general' },
                        { title: 'Activos', path: '/reportes/inea/activos' },
                        { title: 'Inactivos', path: '/reportes/inea/inactivos' },
                        { title: 'No localizados', path: '/reportes/inea/no-localizados' },
                        { title: 'Obsoletos', path: '/reportes/inea/obsoletos' }
                    ]
                },
                {
                    title: 'Reportes ITEA',
                    path: '/reportes/itea',
                    children: [
                        { title: 'General', path: '/reportes/itea/general' },
                        { title: 'Activos', path: '/reportes/itea/activos' },
                        { title: 'Inactivos', path: '/reportes/itea/inactivos' },
                        { title: 'No localizados', path: '/reportes/itea/no-localizados' },
                        { title: 'Obsoletos', path: '/reportes/itea/obsoletos' },
                        { title: 'Denuncias', path: '/reportes/itea/denuncias' }
                    ]
                }
            ]
        },
        {
            title: 'Administración',
            icon: <Settings className="w-4 h-4" />,
            path: '/admin',
            submenu: [
                { title: 'Áreas organizacionales', path: '/admin/areas' },
                { title: 'Sub-áreas', path: '/admin/subareas' },
                { title: 'Directorio de personal', path: '/admin/personal' }
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
                                    <button
                                        onClick={() => toggleMenu(item.title)}
                                        className={`flex items-center px-4 py-2 rounded-md ${isActive(item.path) ? 'text-blue-400 bg-gray-900' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
                                    >
                                        <span className="mr-2">{item.icon}</span>
                                        {item.title}
                                        <ChevronDown className={`ml-1 w-3 h-3 transition-transform ${openMenu === item.title ? 'rotate-180' : ''}`} />
                                    </button>

                                    {openMenu === item.title && item.submenu && (
                                        <div className="absolute left-0 mt-1 w-56 rounded-md bg-gray-900 shadow-lg z-20">
                                            <div className="py-1">
                                                {item.submenu.map((subItem) => (
                                                    <div key={subItem.title}>
                                                        {subItem.children ? (
                                                            <div className="relative">
                                                                <button
                                                                    onClick={(e) => toggleSubmenu(`${item.title}-${subItem.title}`, e)}
                                                                    className={`flex justify-between w-full px-4 py-2 text-sm ${isActive(subItem.path) ? 'text-blue-400 bg-gray-800' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                                                                >
                                                                    {subItem.title}
                                                                    <ChevronRight className="w-3 h-3" />
                                                                </button>

                                                                {openSubmenu === `${item.title}-${subItem.title}` && (
                                                                    <div className="absolute left-full top-0 w-56 rounded-md bg-gray-900 shadow-lg z-30">
                                                                        <div className="py-1">
                                                                            {subItem.children.map((child) => (
                                                                                <Link
                                                                                    key={child.title}
                                                                                    href={child.path}
                                                                                    onClick={closeAll}
                                                                                    className={`block px-4 py-2 text-sm ${pathname === child.path ? 'text-blue-400 bg-gray-800' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
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
                                                                className={`block px-4 py-2 text-sm ${pathname === subItem.path ? 'text-blue-400 bg-gray-800' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                                                            >
                                                                {subItem.title}
                                                            </Link>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="hidden md:flex items-center space-x-3">
                        <button onClick={handleLogout} className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-full" title='Cerrar sesión'>
                            <LogOut className="h-5 w-5" />
                        </button>
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
                <div className="md:hidden bg-gray-900">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {menuItems.map((item) => (
                            <div key={item.title}>
                                <button
                                    onClick={() => toggleMenu(item.title)}
                                    className={`flex justify-between w-full px-3 py-2 rounded-md ${isActive(item.path) ? 'text-blue-400 bg-gray-800' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
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
                                                            className={`flex justify-between w-full px-3 py-2 rounded-md text-sm ${isActive(subItem.path) ? 'text-blue-400 bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
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
                                <div className="text-base font-medium text-white">Usuario</div>
                                <div className="text-sm font-medium text-gray-400">usuario@ejemplo.com</div>
                            </div>
                            <div className="ml-auto flex space-x-2">
                                <Link href="/perfil" onClick={closeAll} className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-full">
                                    <User className="h-5 w-5" />
                                </Link>
                                <button onClick={handleLogout} className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-full" title='Cerrar sesión'>
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}