"use client"

import { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import {
    UserCheck,
    Clock,
    Mail,
    User,
    Shield,
    Search,
    ChevronRight,
    Check,
    Calendar,
    Hash,
    CheckCircle,
    XCircle,
    BadgeCheck
} from 'lucide-react';
import Image from 'next/image';

interface PendingUser {
    id: string;
    email: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
    oauth_provider: string;
    created_at: string;
    avatar_url?: string | null;
}

export default function UsuariosPendientesPage() {
    const { isDarkMode } = useTheme();
    const { user } = useSession();
    const router = useRouter();
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingUserId, setProcessingUserId] = useState<string | null>(null);
    const [selectedRol, setSelectedRol] = useState<{ [key: string]: string }>({});
    const [searchTerm, setSearchTerm] = useState('');

    // Updated roles to match RegisterPage
    const roles = [
        { value: 'usuario', label: 'Usuario Normal', description: 'Acceso estándar', color: 'bg-blue-500' },
        { value: 'admin', label: 'Administrador', description: 'Control de sistema', color: 'bg-red-500' },
    ];

    useEffect(() => {
        const checkAuth = async () => {
            if (!user) {
                router.push('/login');
                return;
            }

            if (user.rol !== 'superadmin' && user.rol !== 'admin') {
                router.push('/');
                return;
            }

            await loadPendingUsers();
        };
        checkAuth();
    }, [router, user]);

    const loadPendingUsers = async () => {
        try {
            const response = await fetch('/api/admin/pending-users');
            const result = await response.json();

            if (!response.ok) {
                console.error('Error cargando usuarios:', result.error);
            } else {
                const data = result.users || [];
                setPendingUsers(data);
                if (data.length > 0 && !selectedUser) {
                    setSelectedUser(data[0]);
                }

                // Default role is now 'usuario'
                const initialRoles: { [key: string]: string } = {};
                (data as PendingUser[]).forEach(user => {
                    initialRoles[user.id] = 'usuario';
                });
                setSelectedRol(initialRoles);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'approve' | 'reject') => {
        if (!selectedUser) return;
        const userId = selectedUser.id;

        if (action === 'approve' && !selectedRol[userId]) {
            alert('Selecciona un rol');
            return;
        }

        if (action === 'reject' && !confirm('¿Rechazar usuario permanentemente?')) {
            return;
        }

        setProcessingUserId(userId);

        try {
            const response = await fetch('/api/admin/approve-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    rol: action === 'approve' ? selectedRol[userId] : undefined,
                    action,
                }),
            });

            if (response.ok) {
                const updatedList = pendingUsers.filter(u => u.id !== userId);
                setPendingUsers(updatedList);
                setSelectedUser(updatedList.length > 0 ? updatedList[0] : null);
            } else {
                const result = await response.json();
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Falló la operación');
        } finally {
            setProcessingUserId(null);
        }
    };

    const filteredUsers = pendingUsers.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const [imageError, setImageError] = useState<{ [key: string]: boolean }>({});

    const handleImageError = (userId: string) => {
        setImageError(prev => ({ ...prev, [userId]: true }));
    };

    if (loading) {
        return (
            <div className={`h-screen flex items-center justify-center ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className={`h-[calc(100vh-4rem)] w-full overflow-hidden flex items-start justify-center p-4 pt-6 relative transition-colors duration-500 ${isDarkMode
            ? 'bg-black text-white'
            : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
            }`}>

            {/* Background Animations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 animate-float ${isDarkMode ? 'bg-blue-600' : 'bg-blue-400'}`} style={{ animationDuration: '8s' }} />
                <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 animate-float ${isDarkMode ? 'bg-purple-600' : 'bg-blue-300'}`} style={{ animationDuration: '10s', animationDelay: '2s' }} />
            </div>

            {/* Main Window - Fills available space minus padding */}
            <div className={`relative z-10 w-full max-w-6xl h-full rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row backdrop-blur-2xl transition-all duration-300 border ${isDarkMode
                ? 'bg-black border-gray-800'
                : 'bg-white border-gray-200'
                }`}>

                {/* Left Sidebar - List */}
                <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r transition-colors ${isDarkMode
                    ? 'border-gray-800 bg-gray-900/30'
                    : 'border-gray-200 bg-gray-50/50'
                    }`}>
                    <div className="p-5 shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${isDarkMode
                                    ? 'bg-white text-black border-white'
                                    : 'bg-gray-900 text-white border-gray-900'
                                    }`}>SOL</span>
                                Solicitudes
                            </h1>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                {pendingUsers.length}
                            </span>
                        </div>

                        {/* Search */}
                        <div className="relative group">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-white' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                            <input
                                type="text"
                                placeholder="Buscar aspirante..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full px-9 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 text-sm ${isDarkMode
                                    ? 'bg-black border-gray-800 text-white placeholder-gray-500 focus:ring-white hover:border-white/50'
                                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-blue-500 hover:border-blue-400'
                                    }`}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3 space-y-1">
                        {filteredUsers.length === 0 ? (
                            <div className="h-32 flex flex-col items-center justify-center opacity-40 text-xs gap-2">
                                <Clock size={24} />
                                Sin resultados
                            </div>
                        ) : (
                            filteredUsers.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 group border ${selectedUser?.id === user.id
                                        ? (isDarkMode
                                            ? 'bg-white/10 border-white/20 shadow-lg'
                                            : 'bg-blue-50 border-blue-200 text-blue-900 shadow-sm')
                                        : (isDarkMode
                                            ? 'bg-transparent border-transparent hover:bg-white/5 text-gray-400'
                                            : 'bg-transparent border-transparent hover:bg-gray-100 text-gray-600')
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-inner relative flex-shrink-0 border ${isDarkMode
                                        ? 'bg-black border-white/10'
                                        : 'bg-white border-gray-200'
                                        }`}>
                                        {user.avatar_url && !imageError[user.id] ? (
                                            <img
                                                src={user.avatar_url}
                                                alt={user.username}
                                                className="w-full h-full object-cover"
                                                onError={() => handleImageError(user.id)}
                                            />
                                        ) : (
                                            <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                                                {user.first_name?.[0] || user.username[0]}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <div className={`text-sm font-bold truncate ${selectedUser?.id === user.id
                                            ? (isDarkMode ? 'text-white' : 'text-blue-900')
                                            : (isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900')
                                            }`}>
                                            {user.first_name || user.username} {user.last_name || ''}
                                        </div>
                                        <div className={`text-[11px] truncate mt-0.5 ${isDarkMode
                                            ? (selectedUser?.id === user.id ? 'text-blue-300' : 'text-gray-500')
                                            : (selectedUser?.id === user.id ? 'text-blue-600' : 'text-gray-500')
                                            }`}>
                                            {user.email}
                                        </div>
                                    </div>
                                    {selectedUser?.id === user.id && (
                                        <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-white' : 'bg-blue-600'}`}></div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Panel - Detail View */}
                <div className="flex-1 flex flex-col min-h-0 bg-opacity-50 relative overflow-hidden">
                    {selectedUser ? (
                        <>
                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
                                <div className="max-w-4xl mx-auto animate-fadeInUp">

                                    {/* Compact Header Section */}
                                    <div className="flex flex-col md:flex-row items-center md:items-center gap-6 mb-8">
                                        <div className={`w-28 h-28 rounded-2xl overflow-hidden shadow-xl flex-shrink-0 relative group border-4 ${isDarkMode
                                            ? 'bg-black border-white/10'
                                            : 'bg-white border-gray-100 shadow-blue-500/10'
                                            }`}>
                                            {selectedUser.avatar_url && !imageError[selectedUser.id] ? (
                                                <img
                                                    src={selectedUser.avatar_url}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                    onError={() => handleImageError(selectedUser.id)}
                                                />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                                                    <span className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-300'}`}>
                                                        {selectedUser.first_name?.[0] || selectedUser.username[0]}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-center md:text-left flex-1 min-w-0">
                                            <h2 className={`text-3xl font-bold tracking-tight leading-none mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {selectedUser.first_name} <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>{selectedUser.last_name}</span>
                                            </h2>
                                            <p className={`text-sm mb-4 flex items-center justify-center md:justify-start gap-1 font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                <User size={14} className="opacity-50" /> {selectedUser.username}
                                            </p>

                                            {/* Provider & Status Badges */}
                                            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                                                {/* AXpert Branding Badge */}
                                                {selectedUser.oauth_provider === 'axpert' ? (
                                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm transition-colors ${isDarkMode
                                                        ? 'bg-white border-white'
                                                        : 'bg-black border-black text-white'
                                                        }`}>
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-black' : 'text-white'
                                                            }`}>Servicio</span>
                                                        <img
                                                            src={isDarkMode ? "/images/BlackLogo.png" : "/images/WhiteLogo.png"}
                                                            alt="AXpert"
                                                            className="h-3 w-auto object-contain"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${isDarkMode
                                                        ? 'bg-black border-white/20 text-white'
                                                        : 'bg-white border-gray-200 text-gray-700'
                                                        }`}>
                                                        <Shield size={10} />
                                                        {selectedUser.oauth_provider}
                                                    </div>
                                                )}

                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border ${isDarkMode
                                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                    : 'bg-blue-50 text-blue-700 border-blue-100'
                                                    }`}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
                                                    Aspirante
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Compact Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                                        {/* Info Column */}
                                        <div className={`p-6 rounded-2xl border transition-all duration-300 ${isDarkMode
                                            ? 'bg-black border-white/10 hover:border-white/20'
                                            : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                                            }`}>
                                            <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Información General</h3>

                                            <div className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-700'}`}>
                                                        <Mail size={18} />
                                                    </div>
                                                    <div>
                                                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Correo Electrónico</p>
                                                        <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.email}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-700'}`}>
                                                        <Hash size={18} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>ID de Usuario</p>
                                                        <p className={`text-xs font-mono truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{selectedUser.id}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-700'}`}>
                                                        <Calendar size={18} />
                                                    </div>
                                                    <div>
                                                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Fecha de Registro</p>
                                                        <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                            {new Date(selectedUser.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                            <span className="opacity-50 text-xs ml-2 font-medium">{new Date(selectedUser.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Roles Column */}
                                        <div className={`p-6 rounded-2xl border transition-all duration-300 ${isDarkMode
                                            ? 'bg-black border-white/10 hover:border-white/20'
                                            : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                                            }`}>
                                            <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Asignación de Permisos</h3>

                                            <div className="flex-1 space-y-3">
                                                {roles.map(role => (
                                                    <button
                                                        key={role.value}
                                                        onClick={() => setSelectedRol({ ...selectedRol, [selectedUser.id]: role.value })}
                                                        className={`w-full p-4 rounded-xl text-left flex items-center justify-between transition-all border-2 ${selectedRol[selectedUser.id] === role.value
                                                            ? (isDarkMode
                                                                ? 'bg-white/10 border-white text-white'
                                                                : 'bg-blue-50 border-blue-600 text-blue-900')
                                                            : (isDarkMode
                                                                ? 'border-transparent bg-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'
                                                                : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-200')
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`p-2 rounded-lg ${selectedRol[selectedUser.id] === role.value ? (isDarkMode ? 'bg-white text-black' : 'bg-blue-600 text-white') : (isDarkMode ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-600')}`}>
                                                                <Shield size={16} />
                                                            </div>
                                                            <div>
                                                                <span className="block text-sm font-bold">{role.label}</span>
                                                                <span className={`text-[10px] font-medium uppercase tracking-tight ${selectedRol[selectedUser.id] === role.value ? (isDarkMode ? 'text-blue-300' : 'text-blue-600') : 'opacity-50'}`}>{role.description}</span>
                                                            </div>
                                                        </div>
                                                        {selectedRol[selectedUser.id] === role.value &&
                                                            <div className={isDarkMode ? 'text-white' : 'text-blue-600'}>
                                                                <CheckCircle size={20} />
                                                            </div>
                                                        }
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Footer - Static at bottom of flex container */}
                            <div className={`p-6 backdrop-blur-xl border-t z-20 shrink-0 flex justify-between items-center gap-4 ${isDarkMode
                                ? 'bg-black/90 border-gray-800'
                                : 'bg-white/95 border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]'
                                }`}>
                                <button
                                    onClick={() => handleAction('reject')}
                                    disabled={processingUserId === selectedUser.id}
                                    className={`px-6 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 ${isDarkMode
                                        ? 'text-red-400 hover:bg-red-400/10'
                                        : 'text-red-600 hover:bg-red-50'
                                        }`}
                                >
                                    <XCircle size={14} />
                                    RECHAZAR SOLICITUD
                                </button>
                                <button
                                    onClick={() => handleAction('approve')}
                                    disabled={processingUserId === selectedUser.id}
                                    className={`px-10 py-4 rounded-xl text-xs font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 ${isDarkMode
                                        ? 'bg-white text-black hover:bg-gray-100 shadow-white/5'
                                        : 'bg-gray-900 text-white hover:bg-black shadow-gray-900/20'
                                        }`}
                                >
                                    {processingUserId === selectedUser.id ? (
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <BadgeCheck size={18} />
                                            CONFIRMAR ACCESO
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center select-none pointer-events-none p-10 text-center">
                            <div className={`w-24 h-24 rounded-3xl mb-6 flex items-center justify-center animate-pulse ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                <UserCheck size={40} className={`opacity-20 ${isDarkMode ? 'text-white' : 'text-gray-400'}`} />
                            </div>
                            <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Sin Selección</h3>
                            <p className={`text-xs font-bold tracking-widest uppercase opacity-40 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Selecciona un aspirante de la lista</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(150, 150, 150, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(150, 150, 150, 0.3);
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(-20px) scale(1.05); }
                }
                .animate-float {
                    animation: float linear infinite;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeInUp {
                    animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
}
