import { Grid, Package, FileText, FolderOpen, Settings, Plus, Users, BookOpen, Archive, Database, BarChart3, Building2, Trash2, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuickAction {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    roles?: string[];
}

interface QuickActionsProps {
    isDarkMode: boolean;
    userRoles: string[];
    selectedIndex: number;
    onMouseEnter: (index: number) => void;
}

export default function QuickActions({ isDarkMode, userRoles, selectedIndex, onMouseEnter }: QuickActionsProps) {
    const router = useRouter();

    const allActions: QuickAction[] = [
        // === CONSULTAS (Para todos) ===
        {
            id: 'vista-general-tlaxcala',
            label: 'Inventario TLAXCALA',
            icon: <Grid className="w-4 h-4" />,
            path: '/consultas/no-listado'
        },
        {
            id: 'inventario-inea',
            label: 'Inventario INEA',
            icon: <Database className="w-4 h-4" />,
            path: '/consultas/inea/general'
        },
        {
            id: 'inventario-itea',
            label: 'Inventario ITEJPA',
            icon: <Database className="w-4 h-4" />,
            path: '/consultas/itea/general'
        },
        {
            id: 'levantamiento',
            label: 'Levantamiento',
            icon: <Eye className="w-4 h-4" />,
            path: '/consultas/levantamiento'
        },
        {
            id: 'inea-obsoletos',
            label: 'INEA Obsoletos',
            icon: <Archive className="w-4 h-4" />,
            path: '/consultas/inea/obsoletos'
        },
        {
            id: 'itea-obsoletos',
            label: 'ITEJPA Obsoletos',
            icon: <Archive className="w-4 h-4" />,
            path: '/consultas/itea/obsoletos'
        },
        
        // === RESGUARDOS (Para todos) ===
        {
            id: 'consultar-resguardos',
            label: 'Consultar Resguardos',
            icon: <FolderOpen className="w-4 h-4" />,
            path: '/resguardos/consultar'
        },
        {
            id: 'consultar-bajas',
            label: 'Consultar Bajas',
            icon: <Trash2 className="w-4 h-4" />,
            path: '/resguardos/consultar/bajas'
        },
        
        // === REPORTES (Para todos) ===
        {
            id: 'reportes-tlaxcala',
            label: 'Reportes TLAXCALA',
            icon: <BarChart3 className="w-4 h-4" />,
            path: '/reportes/tlaxcala'
        },
        {
            id: 'reportes-inea',
            label: 'Reportes INEA',
            icon: <BarChart3 className="w-4 h-4" />,
            path: '/reportes/inea'
        },
        {
            id: 'reportes-itea',
            label: 'Reportes ITEJPA',
            icon: <BarChart3 className="w-4 h-4" />,
            path: '/reportes/itea'
        },
        
        // === ADMINISTRACIÓN (Solo admin/superadmin) ===
        {
            id: 'añadir-bien',
            label: 'Añadir Bien',
            icon: <Plus className="w-4 h-4" />,
            path: '/inventario/registro',
            roles: ['admin', 'superadmin']
        },
        {
            id: 'crear-resguardo',
            label: 'Crear Resguardo',
            icon: <Plus className="w-4 h-4" />,
            path: '/resguardos/crear',
            roles: ['admin', 'superadmin']
        },
        {
            id: 'directorio',
            label: 'Directorio de Personal',
            icon: <Users className="w-4 h-4" />,
            path: '/admin/personal',
            roles: ['admin', 'superadmin']
        },
        {
            id: 'areas',
            label: 'Gestión de Áreas',
            icon: <Building2 className="w-4 h-4" />,
            path: '/admin/areas',
            roles: ['admin', 'superadmin']
        },
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <BarChart3 className="w-4 h-4" />,
            path: '/dashboard',
            roles: ['admin', 'superadmin']
        },
        {
            id: 'usuarios-pendientes',
            label: 'Usuarios Pendientes',
            icon: <Users className="w-4 h-4" />,
            path: '/admin/usuarios-pendientes',
            roles: ['superadmin']
        }
    ];

    // Filtrar acciones según roles
    const filteredActions = allActions.filter(action => {
        if (!action.roles) return true;
        return action.roles.some(role => userRoles.includes(role));
    });

    const handleActionClick = (path: string) => {
        router.push(path);
    };

    return (
        <div className="p-2">
            {/* Header */}
            <div className="px-2 py-1 mb-1">
                <span className={`text-[10px] font-medium ${isDarkMode ? 'text-white/30' : 'text-black/30'}`}>
                    Acciones Rápidas
                </span>
            </div>

            {/* Actions List */}
            <div className="space-y-0.5">
                {filteredActions.map((action, index) => (
                    <button
                        key={action.id}
                        data-search-index={index}
                        onMouseEnter={() => onMouseEnter(index)}
                        onClick={() => handleActionClick(action.path)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-150 ${
                            selectedIndex === index
                                ? isDarkMode 
                                    ? 'bg-white/10 text-white' 
                                    : 'bg-black/10 text-black'
                                : isDarkMode 
                                    ? 'hover:bg-white/[0.04] text-white/70 hover:text-white' 
                                    : 'hover:bg-black/[0.03] text-black/70 hover:text-black'
                        }`}
                    >
                        <div className={`flex-shrink-0 ${selectedIndex === index ? '' : isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                            {action.icon}
                        </div>
                        <span className="text-sm font-medium truncate">
                            {action.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Keyboard Hints */}
            <div className="flex items-center justify-center gap-1 mt-2 pt-2 border-t border-current opacity-10">
                <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                    isDarkMode 
                        ? 'bg-white/5 border-white/10 text-white/30' 
                        : 'bg-black/5 border-black/10 text-black/30'
                }`}>
                    ↑↓
                </div>
                <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                    isDarkMode 
                        ? 'bg-white/5 border-white/10 text-white/30' 
                        : 'bg-black/5 border-black/10 text-black/30'
                }`}>
                    ↵
                </div>
            </div>
        </div>
    );
}
