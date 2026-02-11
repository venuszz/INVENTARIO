"use client"

import { useTheme } from '@/context/ThemeContext';
import { usePendingUsers } from './hooks/usePendingUsers';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { Shield, CheckCircle, XCircle, BadgeCheck, User, Mail, Calendar, Key, Globe } from 'lucide-react';
import { Role } from './types';
import { useState } from 'react';

const roles: Role[] = [
    { value: 'usuario', label: 'Usuario Normal', description: 'Acceso estándar', color: 'bg-blue-500' },
    { value: 'admin', label: 'Administrador', description: 'Control de sistema', color: 'bg-red-500' },
];

type FilterType = 'all' | 'oauth' | 'local';

export default function UsuariosPendientesManager() {
    const { isDarkMode } = useTheme();
    const {
        pendingUsers,
        selectedUser,
        setSelectedUser,
        loading,
        processingUserId,
        selectedRol,
        setSelectedRol,
        handleAction,
        filterType,
        setFilterType
    } = usePendingUsers();
    
    const [imageError, setImageError] = useState<{ [key: string]: boolean }>({});

    const handleImageError = (userId: string) => {
        setImageError(prev => ({ ...prev, [userId]: true }));
    };

    const filters: { value: FilterType; label: string }[] = [
        { value: 'all', label: 'Todos' },
        { value: 'oauth', label: 'OAuth' },
        { value: 'local', label: 'Locales' }
    ];

    return (
        <div className={`h-[calc(100vh-4rem)] overflow-hidden transition-colors duration-300 ${
            isDarkMode 
                ? 'bg-black text-white' 
                : 'bg-white text-black'
        }`}>
            <div className={`h-full overflow-y-auto p-4 md:p-8 ${
                isDarkMode 
                    ? 'scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30'
                    : 'scrollbar-thin scrollbar-track-black/5 scrollbar-thumb-black/20 hover:scrollbar-thumb-black/30'
            }`}>
                <div className="w-full max-w-5xl mx-auto pb-8">
                    {/* Header */}
                    <div className={`mb-8 pb-6 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                        <h1 className="text-3xl font-light tracking-tight mb-1">
                            Usuarios Pendientes
                        </h1>
                        <p className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                            Gestiona las solicitudes de acceso al sistema
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="mb-6 flex gap-2">
                        {filters.map(filter => (
                            <button
                                key={filter.value}
                                onClick={() => setFilterType(filter.value)}
                                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                                    filterType === filter.value
                                        ? (isDarkMode
                                            ? 'bg-white/10 text-white'
                                            : 'bg-black/10 text-black')
                                        : (isDarkMode
                                            ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                            : 'bg-black/5 text-black/60 hover:bg-black/10 hover:text-black')
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {/* Main content */}
                    {loading ? (
                        <LoadingSkeleton isDarkMode={isDarkMode} />
                    ) : pendingUsers.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className={`text-sm ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                                No hay usuarios pendientes de aprobación
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {pendingUsers.map((user) => {
                                const isExpanded = selectedUser?.id === user.id;
                                const isOAuth = user.user_type === 'oauth';
                                
                                return (
                                    <div
                                        key={user.id}
                                        className={`rounded-lg border transition-all ${
                                            isDarkMode
                                                ? 'border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                                                : 'border-black/5 hover:border-black/10 hover:bg-black/[0.02]'
                                        }`}
                                    >
                                        {/* Collapsed view */}
                                        <button
                                            onClick={() => setSelectedUser(isExpanded ? null : user)}
                                            className="w-full px-4 py-3.5 flex items-center justify-between text-left"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className={`w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 ${isDarkMode
                                                    ? 'bg-white/5'
                                                    : 'bg-black/5'
                                                }`}>
                                                    {user.avatar_url && !imageError[user.id] ? (
                                                        <img
                                                            src={user.avatar_url}
                                                            alt={user.username}
                                                            className="w-full h-full object-cover"
                                                            onError={() => handleImageError(user.id)}
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-medium">
                                                            {user.first_name?.[0] || user.username[0]}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h3 className="text-sm font-medium truncate">
                                                            {user.first_name || user.username} {user.last_name || ''}
                                                        </h3>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 ${
                                                            isOAuth
                                                                ? (isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/20 text-blue-600')
                                                                : (isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-500/20 text-purple-600')
                                                        }`}>
                                                            {isOAuth ? <Globe size={10} /> : <Key size={10} />}
                                                            {isOAuth ? 'OAuth' : 'Local'}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs truncate ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                isDarkMode
                                                    ? isExpanded ? 'bg-white text-black' : 'hover:bg-white/5'
                                                    : isExpanded ? 'bg-black text-white' : 'hover:bg-black/5'
                                            }`}>
                                                {isExpanded ? 'Cerrar' : 'Revisar'}
                                            </div>
                                        </button>

                                        {/* Expanded view */}
                                        {isExpanded && (
                                            <div className={`px-4 pb-4 pt-3 border-t ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}>
                                                <div className="space-y-4">
                                                    {/* User info - inline layout */}
                                                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Mail size={14} className={isDarkMode ? 'text-white/40' : 'text-black/40'} />
                                                            <span className="text-sm">{user.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <User size={14} className={isDarkMode ? 'text-white/40' : 'text-black/40'} />
                                                            <span className="text-sm">{user.username}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar size={14} className={isDarkMode ? 'text-white/40' : 'text-black/40'} />
                                                            <span className="text-sm">
                                                                {new Date(user.created_at).toLocaleDateString('es-MX', { 
                                                                    day: '2-digit', 
                                                                    month: 'short', 
                                                                    year: 'numeric' 
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Role selector - inline */}
                                                    <div>
                                                        <h4 className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>
                                                            Asignar rol
                                                        </h4>
                                                        <div className="flex gap-2">
                                                            {roles.map(role => (
                                                                <button
                                                                    key={role.value}
                                                                    onClick={() => setSelectedRol({ ...selectedRol, [user.id]: role.value })}
                                                                    className={`flex-1 px-3 py-2 rounded-lg text-left flex items-center justify-between transition-all text-sm ${
                                                                        selectedRol[user.id] === role.value
                                                                            ? (isDarkMode
                                                                                ? 'bg-white/10'
                                                                                : 'bg-black/10')
                                                                            : (isDarkMode
                                                                                ? 'bg-white/5 hover:bg-white/10'
                                                                                : 'bg-black/5 hover:bg-black/10')
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <Shield size={14} />
                                                                        <span>{role.label}</span>
                                                                    </div>
                                                                    {selectedRol[user.id] === role.value && (
                                                                        <CheckCircle size={14} />
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex justify-end gap-2 pt-2">
                                                        <button
                                                            onClick={() => handleAction('reject')}
                                                            disabled={processingUserId === user.id}
                                                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-2 ${isDarkMode
                                                                ? 'hover:bg-white/5'
                                                                : 'hover:bg-black/5'
                                                            }`}
                                                        >
                                                            <XCircle size={14} />
                                                            Rechazar
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction('approve')}
                                                            disabled={processingUserId === user.id}
                                                            className={`px-6 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-2 ${isDarkMode
                                                                ? 'bg-white text-black hover:bg-white/90'
                                                                : 'bg-black text-white hover:bg-black/90'
                                                            }`}
                                                        >
                                                            {processingUserId === user.id ? (
                                                                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <BadgeCheck size={14} />
                                                                    Aprobar
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Footer */}
                    {!loading && pendingUsers.length > 0 && (
                        <div className={`mt-8 pt-4 border-t text-xs ${isDarkMode ? 'border-white/10 text-white/40' : 'border-black/10 text-black/40'}`}>
                            {pendingUsers.length} {pendingUsers.length === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .scrollbar-thin {
                    scrollbar-width: thin;
                }
                
                .scrollbar-thin::-webkit-scrollbar {
                    width: 6px;
                }
                
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
                    border-radius: 3px;
                }
                
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
                    border-radius: 3px;
                }
                
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: ${isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
                }
            `}</style>
        </div>
    );
}
