"use client"

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSearchParams } from 'next/navigation';
import { User, Lock, Eye, EyeOff, LogIn, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import SSOButton from './SSOButton';
import supabase from '@/app/lib/supabase/client';

export default function LoginPage() {
    const { isDarkMode, toggleDarkMode } = useTheme();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isPendingApproval, setIsPendingApproval] = useState(false);
    const [isApproved, setIsApproved] = useState(false);
    const [isAccountDisabled, setIsAccountDisabled] = useState(false);
    const [monitoringUserId, setMonitoringUserId] = useState<string | null>(null);
    const searchParams = useSearchParams();

    // Detectar si viene del registro y configurar monitoreo
    useEffect(() => {
        if (searchParams.get('awaiting_approval') === 'true') {
            const userId = localStorage.getItem('pending_user_id');
            if (userId) {
                setMonitoringUserId(userId);
                setIsPendingApproval(true);
            }
        }
    }, [searchParams]);

    // Monitoreo en tiempo real del estado del usuario
    useEffect(() => {
        if (!monitoringUserId) return;

        const checkUserStatus = async () => {
            try {
                const response = await fetch(`/api/auth/check-status?userId=${monitoringUserId}`);
                const result = await response.json();

                if (result.success && result.is_active && !result.pending_approval) {
                    setIsApproved(true);
                    setIsPendingApproval(false);
                    localStorage.removeItem('pending_user_id');
                }
            } catch (err) {
                console.error('Error checking user status:', err);
            }
        };

        checkUserStatus();

        const pollInterval = setInterval(checkUserStatus, 3000);

        const channel = supabase
            .channel(`user-status-${monitoringUserId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                    filter: `id=eq.${monitoringUserId}`
                },
                (payload) => {
                    const newData = payload.new as { is_active: boolean; pending_approval: boolean };
                    if (newData.is_active && !newData.pending_approval) {
                        setIsApproved(true);
                        setIsPendingApproval(false);
                        localStorage.removeItem('pending_user_id');
                    }
                }
            )
            .subscribe();

        return () => {
            clearInterval(pollInterval);
            supabase.removeChannel(channel);
        };
    }, [monitoringUserId]);

    if (isAccountDisabled) {
        return (
            <div className={`h-screen flex items-center justify-center transition-colors duration-300 ${
                isDarkMode ? 'bg-black' : 'bg-white'
            }`}>
                {/* Botón de tema */}
                <button
                    onClick={toggleDarkMode}
                    className={`fixed top-6 right-6 z-50 p-2.5 rounded-lg transition-all duration-200 ${
                        isDarkMode
                            ? 'text-white/60 hover:text-white'
                            : 'text-black/60 hover:text-black'
                    }`}
                    aria-label="Cambiar modo de color"
                >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <div className="w-full max-w-5xl px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        {/* Panel izquierdo - Logo */}
                        <motion.div 
                            className="text-center lg:text-left"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-flex items-center justify-center lg:justify-start mb-12">
                                <img
                                    src={isDarkMode ? "/images/ITEA_logo.png" : "/images/ITEA_logo_negro.svg"}
                                    alt="Logo ITEA"
                                    className="h-24 w-auto object-contain"
                                />
                            </div>

                            <h1 className={`text-5xl lg:text-6xl font-light mb-3 tracking-tight ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                Sistema
                                <span className={`block ${
                                    isDarkMode ? 'text-white/70' : 'text-black/70'
                                }`}>Gubernamental</span>
                            </h1>
                            <p className={`text-base font-light ${
                                isDarkMode ? 'text-white/40' : 'text-black/40'
                            }`}>
                                Gestión de inventario
                            </p>
                        </motion.div>

                        {/* Panel derecho - Cuenta desactivada */}
                        <motion.div 
                            className="w-full max-w-md mx-auto lg:mx-0"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <div className="text-center space-y-6">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                                    className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
                                        isDarkMode ? 'bg-red-500/20' : 'bg-red-500/20'
                                    }`}
                                >
                                    <svg 
                                        className="w-10 h-10 text-red-500" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" 
                                        />
                                    </svg>
                                </motion.div>

                                <div>
                                    <h2 className={`text-2xl font-light mb-2 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        Cuenta Desactivada
                                    </h2>
                                    
                                    <p className={`text-sm mb-1 ${
                                        isDarkMode ? 'text-white/60' : 'text-black/60'
                                    }`}>
                                        Tu cuenta ha sido desactivada por un administrador.
                                    </p>

                                    <p className={`text-xs ${
                                        isDarkMode ? 'text-white/40' : 'text-black/40'
                                    }`}>
                                        Por favor, contacta al administrador del sistema para más información.
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        setIsAccountDisabled(false);
                                    }}
                                    className={`w-full py-3 px-5 rounded-lg text-sm font-medium transition-all border ${
                                        isDarkMode
                                            ? 'bg-transparent border-white/20 hover:bg-white/5'
                                            : 'bg-transparent border-black/20 hover:bg-black/5'
                                    }`}
                                >
                                    Volver al login
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        );
    }

    if (isApproved) {
        return (
            <div className={`h-screen flex items-center justify-center transition-colors duration-300 ${
                isDarkMode ? 'bg-black' : 'bg-white'
            }`}>
                {/* Botón de tema */}
                <button
                    onClick={toggleDarkMode}
                    className={`fixed top-6 right-6 z-50 p-2.5 rounded-lg transition-all duration-200 ${
                        isDarkMode
                            ? 'text-white/60 hover:text-white'
                            : 'text-black/60 hover:text-black'
                    }`}
                    aria-label="Cambiar modo de color"
                >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <div className="w-full max-w-5xl px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        {/* Panel izquierdo - Logo */}
                        <motion.div 
                            className="text-center lg:text-left"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-flex items-center justify-center lg:justify-start mb-12">
                                <img
                                    src={isDarkMode ? "/images/ITEA_logo.png" : "/images/ITEA_logo_negro.svg"}
                                    alt="Logo ITEA"
                                    className="h-24 w-auto object-contain"
                                />
                            </div>

                            <h1 className={`text-5xl lg:text-6xl font-light mb-3 tracking-tight ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                Sistema
                                <span className={`block ${
                                    isDarkMode ? 'text-white/70' : 'text-black/70'
                                }`}>Gubernamental</span>
                            </h1>
                            <p className={`text-base font-light ${
                                isDarkMode ? 'text-white/40' : 'text-black/40'
                            }`}>
                                Gestión de inventario
                            </p>
                        </motion.div>

                        {/* Panel derecho - Estado aprobado */}
                        <motion.div 
                            className="w-full max-w-md mx-auto lg:mx-0"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <div className="text-center space-y-6">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                                    className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
                                        isDarkMode ? 'bg-green-500/20' : 'bg-green-500/20'
                                    }`}
                                >
                                    <svg 
                                        className="w-10 h-10 text-green-500" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M5 13l4 4L19 7" 
                                        />
                                    </svg>
                                </motion.div>

                                <div>
                                    <h2 className={`text-2xl font-light mb-2 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        ¡Cuenta Aprobada!
                                    </h2>
                                    
                                    <p className={`text-sm ${
                                        isDarkMode ? 'text-white/60' : 'text-black/60'
                                    }`}>
                                        Tu cuenta ha sido aprobada. Ya puedes iniciar sesión.
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        setIsApproved(false);
                                        setMonitoringUserId(null);
                                    }}
                                    className={`w-full py-3 px-5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 border ${
                                        isDarkMode
                                            ? 'bg-white text-black border-white hover:bg-white/90'
                                            : 'bg-black text-white border-black hover:bg-black/90'
                                    }`}
                                >
                                    <LogIn className="w-3.5 h-3.5" />
                                    <span>Iniciar sesión</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        );
    }

    if (isPendingApproval) {
        return (
            <div className={`h-screen flex items-center justify-center transition-colors duration-300 ${
                isDarkMode ? 'bg-black' : 'bg-white'
            }`}>
                {/* Botón de tema */}
                <button
                    onClick={toggleDarkMode}
                    className={`fixed top-6 right-6 z-50 p-2.5 rounded-lg transition-all duration-200 ${
                        isDarkMode
                            ? 'text-white/60 hover:text-white'
                            : 'text-black/60 hover:text-black'
                    }`}
                    aria-label="Cambiar modo de color"
                >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <div className="w-full max-w-5xl px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        {/* Panel izquierdo - Logo */}
                        <motion.div 
                            className="text-center lg:text-left"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-flex items-center justify-center lg:justify-start mb-12">
                                <img
                                    src={isDarkMode ? "/images/ITEA_logo.png" : "/images/ITEA_logo_negro.svg"}
                                    alt="Logo ITEA"
                                    className="h-24 w-auto object-contain"
                                />
                            </div>

                            <h1 className={`text-5xl lg:text-6xl font-light mb-3 tracking-tight ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                Sistema
                                <span className={`block ${
                                    isDarkMode ? 'text-white/70' : 'text-black/70'
                                }`}>Gubernamental</span>
                            </h1>
                            <p className={`text-base font-light ${
                                isDarkMode ? 'text-white/40' : 'text-black/40'
                            }`}>
                                Gestión de inventario
                            </p>
                        </motion.div>

                        {/* Panel derecho - Estado de espera */}
                        <motion.div 
                            className="w-full max-w-md mx-auto lg:mx-0"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <div className="text-center space-y-6">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                                    className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
                                        isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-500/20'
                                    }`}
                                >
                                    <motion.svg 
                                        className="w-10 h-10 text-yellow-500" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                                        />
                                    </motion.svg>
                                </motion.div>

                                <div>
                                    <h2 className={`text-2xl font-light mb-2 ${
                                        isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        Esperando Aprobación
                                    </h2>
                                    
                                    <p className={`text-sm mb-1 ${
                                        isDarkMode ? 'text-white/60' : 'text-black/60'
                                    }`}>
                                        Tu cuenta está siendo revisada por un administrador.
                                    </p>

                                    <p className={`text-xs ${
                                        isDarkMode ? 'text-white/40' : 'text-black/40'
                                    }`}>
                                        Esta página se actualizará automáticamente cuando seas aprobado.
                                    </p>

                                    <p className={`text-xs mt-3 ${
                                        isDarkMode ? 'text-white/30' : 'text-black/30'
                                    }`}>
                                        Por favor, no cierres ni actualices esta página.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        );
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (isLoading) {
            return;
        }
        if (!username.trim() || !password.trim()) {
            setError('Por favor, ingresa tu nombre de usuario y contraseña');
            return;
        }

        setIsLoading(true);

        try {
            const clientId = searchParams.get('client_id');
            const responseType = searchParams.get('response_type');
            const redirectUri = searchParams.get('redirect_uri');
            const scope = searchParams.get('scope');
            const state = searchParams.get('state');

            let redirectPath = searchParams.get('from') || '/';

            if (clientId && redirectUri) {
                const params = new URLSearchParams();
                params.append('client_id', clientId);
                if (responseType) params.append('response_type', responseType);
                params.append('redirect_uri', redirectUri);
                if (scope) params.append('scope', scope);
                if (state) params.append('state', state);

                redirectPath = `/authorize?${params.toString()}`;
            }

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include',
            });

            const data = await response.json();

            if (!data.success) {
                if (data.redirectTo === '/pending-approval') {
                    if (data.userId) {
                        localStorage.setItem('pending_user_id', data.userId);
                        window.location.href = '/login?awaiting_approval=true';
                    } else {
                        setIsPendingApproval(true);
                    }
                    setIsLoading(false);
                    return;
                }
                if (data.redirectTo === '/account-disabled') {
                    setIsAccountDisabled(true);
                    setIsLoading(false);
                    return;
                }
                setError(data.error || 'Error de autenticación');
                setIsLoading(false);
                return;
            }

            window.location.href = redirectPath;

        } catch (err) {
            console.error('Login error:', err);
            setError('Error de conexión. Intenta de nuevo más tarde.');
            setIsLoading(false);
        }
    };

    return (
        <div className={`h-screen flex items-center justify-center transition-colors duration-300 ${
            isDarkMode ? 'bg-black' : 'bg-white'
        }`}>
            {/* Botón de tema */}
            <button
                onClick={toggleDarkMode}
                className={`fixed top-6 right-6 z-50 p-2.5 rounded-lg transition-all duration-200 ${
                    isDarkMode
                        ? 'text-white/60 hover:text-white'
                        : 'text-black/60 hover:text-black'
                }`}
                aria-label="Cambiar modo de color"
            >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="w-full max-w-5xl px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    {/* Panel izquierdo - Logo e información */}
                    <motion.div 
                        className="text-center lg:text-left"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center justify-center lg:justify-start mb-12">
                            <img
                                src={isDarkMode ? "/images/ITEA_logo.png" : "/images/ITEA_logo_negro.svg"}
                                alt="Logo ITEA"
                                className="h-24 w-auto object-contain"
                            />
                        </div>

                        <h1 className={`text-5xl lg:text-6xl font-light mb-3 tracking-tight ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                            Sistema
                            <span className={`block ${
                                isDarkMode ? 'text-white/70' : 'text-black/70'
                            }`}>Gubernamental</span>
                        </h1>
                        <p className={`text-base font-light ${
                            isDarkMode ? 'text-white/40' : 'text-black/40'
                        }`}>
                            Gestión de inventario
                        </p>
                    </motion.div>

                    {/* Panel derecho - Formulario */}
                    <motion.div 
                        className="w-full max-w-md mx-auto lg:mx-0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <form onSubmit={handleLogin} className="space-y-6">
                            <h2 className={`text-2xl font-light mb-8 text-center lg:hidden ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                Iniciar Sesión
                            </h2>

                            {/* Campo de Usuario */}
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 z-10">
                                    <User className={`w-4 h-4 ${
                                        isDarkMode ? 'text-white/30' : 'text-black/30'
                                    }`} />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Usuario"
                                    className={`w-full pl-11 pr-4 py-3.5 text-sm rounded-lg border focus:outline-none transition-all ${
                                        isDarkMode
                                            ? 'bg-transparent border-white/20 text-white placeholder-white/30 focus:border-white/40'
                                            : 'bg-transparent border-black/20 text-gray-900 placeholder-black/30 focus:border-black/40'
                                    }`}
                                    autoComplete="username"
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            {/* Campo de Contraseña */}
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 z-10">
                                    <Lock className={`w-4 h-4 ${
                                        isDarkMode ? 'text-white/30' : 'text-black/30'
                                    }`} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Contraseña"
                                    className={`w-full pl-11 pr-11 py-3.5 text-sm rounded-lg border focus:outline-none transition-all ${
                                        isDarkMode
                                            ? 'bg-transparent border-white/20 text-white placeholder-white/30 focus:border-white/40'
                                            : 'bg-transparent border-black/20 text-gray-900 placeholder-black/30 focus:border-black/40'
                                    }`}
                                    autoComplete="current-password"
                                    disabled={isLoading}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className={`absolute right-3.5 top-1/2 transform -translate-y-1/2 focus:outline-none transition-colors ${
                                        isDarkMode ? 'text-white/30 hover:text-white/50' : 'text-black/30 hover:text-black/50'
                                    }`}
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    disabled={isLoading}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-2.5 rounded-lg border text-xs text-center ${
                                        isDarkMode
                                            ? 'border-red-500/20 bg-red-500/5 text-red-400'
                                            : 'border-red-500/20 bg-red-50 text-red-600'
                                    }`}
                                >
                                    {error}
                                </motion.div>
                            )}

                            {/* Botón de envío */}
                            <div className="space-y-3 pt-2">
                                <motion.button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-3 px-5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 border ${
                                        isDarkMode
                                            ? 'bg-white text-black border-white hover:bg-white/90'
                                            : 'bg-black text-white border-black hover:bg-black/90'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    whileHover={{ scale: isLoading ? 1 : 1.01 }}
                                    whileTap={{ scale: isLoading ? 1 : 0.99 }}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className={`w-3.5 h-3.5 border-2 rounded-full animate-spin ${
                                                isDarkMode ? 'border-black/30 border-t-black' : 'border-white/30 border-t-white'
                                            }`}></div>
                                            <span>Procesando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="w-3.5 h-3.5" />
                                            <span>Iniciar Sesión</span>
                                        </>
                                    )}
                                </motion.button>

                                {/* Divider */}
                                <div className="relative flex py-1 items-center">
                                    <div className={`flex-grow border-t ${
                                        isDarkMode ? 'border-white/10' : 'border-black/10'
                                    }`}></div>
                                    <span className={`flex-shrink-0 mx-4 text-xs ${
                                        isDarkMode ? 'text-white/30' : 'text-black/30'
                                    }`}>O continúa con</span>
                                    <div className={`flex-grow border-t ${
                                        isDarkMode ? 'border-white/10' : 'border-black/10'
                                    }`}></div>
                                </div>

                                {/* SSO Button */}
                                <SSOButton 
                                    disabled={isLoading}
                                    onError={(errorMsg) => setError(errorMsg)}
                                />
                            </div>

                            {/* Link to register */}
                            <div className="text-center pt-2">
                                <p className={`text-sm ${
                                    isDarkMode ? 'text-white/40' : 'text-black/40'
                                }`}>
                                    ¿No tienes una cuenta?{' '}
                                    <a 
                                        href="/register" 
                                        className={`font-medium transition-colors ${
                                            isDarkMode ? 'text-white hover:text-white/80' : 'text-black hover:text-black/80'
                                        }`}
                                    >
                                        Crear cuenta
                                    </a>
                                </p>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
