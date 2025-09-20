"use client"

import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import supabase from '@/app/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import { User, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import Cookies from 'js-cookie';

export default function LoginPage() {
    const { isDarkMode } = useTheme();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const searchParams = useSearchParams();

    // --- LÓGICA ORIGINAL (SIN CAMBIOS) ---
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
            const redirectPath = searchParams.get('from') || '/';

            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, email, rol, first_name, last_name')
                .eq('username', username)
                .single();

            if (userError || !userData) {
                setError('Usuario o contraseña incorrectos');
                setIsLoading(false);
                return;
            }

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: userData.email,
                password
            });

            if (authError) {
                setError('Usuario o contraseña incorrectos');
                setIsLoading(false);
                return;
            }

            const expires = new Date(Date.now() + 4 * 60 * 60 * 1000);
            Cookies.set('authToken', authData.session.access_token, {
                expires,
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            Cookies.set('userData', JSON.stringify({
                id: userData.id,
                username: username,
                firstName: userData.first_name,
                lastName: userData.last_name,
                rol: userData.rol
            }), {
                expires,
                path: '/'
            });

            // Redirección directa para una mejor experiencia
            window.location.href = redirectPath;

        } catch {
            setError('Error de conexión. Intenta de nuevo más tarde.');
            setIsLoading(false);
        }
    };

    // --- NUEVO DISEÑO INSPIRADO EN EL COMPONENTE VEHICULAR ---
    return (
        <div className={`h-screen relative overflow-hidden flex items-center justify-center transition-colors duration-500 ${
            isDarkMode
                ? 'bg-black'
                : 'bg-gradient-to-br from-blue-50 via-white to-blue-100'
        }`}>
            {/* Efectos de fondo animados */}
            <div className="absolute inset-0">
                <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse transition-colors duration-500 ${
                    isDarkMode ? 'bg-blue-500/20' : 'bg-blue-400/30'
                }`}></div>
                <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse transition-colors duration-500 ${
                    isDarkMode ? 'bg-white/20' : 'bg-blue-300/20'
                }`} style={{ animationDelay: '2s' }}></div>
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-2xl animate-pulse transition-colors duration-500 ${
                    isDarkMode ? 'bg-blue-400/10' : 'bg-blue-200/20'
                }`} style={{ animationDelay: '4s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-6xl px-6 animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Panel izquierdo - Información */}
                    <div className="text-center lg:text-left">
                        <div className="inline-flex items-center justify-center lg:justify-start mb-8">
                            <div className="relative group">
                                <div className={`absolute -inset-1 rounded-3xl blur-md group-hover:transition-all duration-700 animate-pulse ${
                                    isDarkMode
                                        ? 'bg-blue-500/20 group-hover:bg-blue-500/30'
                                        : 'bg-blue-400/30 group-hover:bg-blue-400/40'
                                }`}></div>
                                <div className={`relative p-6 rounded-3xl backdrop-blur-xl transition-colors duration-500 ${
                                    isDarkMode
                                        ? 'bg-white/5 border border-white/10'
                                        : 'bg-white/60 border border-blue-200/30'
                                }`}>
                                    <img
                                        src={isDarkMode ? "/images/ITEA_logo.svg" : "/images/ITEA_logo_negro.svg"}
                                        alt="Logo ITEA"
                                        className="h-20 w-auto object-contain"
                                    />
                                </div>
                            </div>
                        </div>

                        <h1 className={`text-5xl lg:text-6xl font-extralight mb-6 tracking-tight transition-colors duration-500 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                            Sistema
                            <span className={`block transition-colors duration-500 ${
                                isDarkMode ? 'text-blue-400' : 'text-blue-600'
                            }`}>Gubernamental</span>
                        </h1>
                        <p className={`text-xl font-light transition-colors duration-500 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            Acceso a la plataforma de gestión de inventario.
                        </p>
                    </div>

                    {/* Panel derecho - Formulario */}
                    <div className="w-full max-w-md mx-auto lg:mx-0">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <h2 className={`text-2xl font-bold mb-6 text-center lg:hidden transition-colors duration-500 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                Iniciar Sesión
                            </h2>
                            {/* Campo de Usuario */}
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300">
                                    <User className={`w-5 h-5 group-focus-within:text-blue-400 group-focus-within:scale-110 transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`} />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Nombre de Usuario"
                                    className={`w-full pl-12 pr-4 py-4 text-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-xl transition-all duration-300 ${
                                        isDarkMode
                                            ? 'bg-white/5 border border-white/20 text-white placeholder-gray-400 hover:bg-white/10 focus:bg-white/10'
                                            : 'bg-white/80 border border-gray-300 text-gray-900 placeholder-gray-500 hover:bg-white focus:bg-white'
                                    }`}
                                    autoComplete="username"
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            {/* Campo de Contraseña */}
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300">
                                    <Lock className={`w-5 h-5 group-focus-within:text-blue-400 group-focus-within:scale-110 transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Contraseña"
                                    className={`w-full pl-12 pr-12 py-4 text-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-xl transition-all duration-300 ${
                                        isDarkMode
                                            ? 'bg-white/5 border border-white/20 text-white placeholder-gray-400 hover:bg-white/10 focus:bg-white/10'
                                            : 'bg-white/80 border border-gray-300 text-gray-900 placeholder-gray-500 hover:bg-white focus:bg-white'
                                    }`}
                                    autoComplete="current-password"
                                    disabled={isLoading}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className={`absolute right-4 top-1/2 transform -translate-y-1/2 hover:text-blue-400 focus:outline-none transition-colors duration-300 ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}
                                </button>
                            </div>

                            {error && (
                                <div className="relative">
                                    <div className={`absolute inset-0 rounded-xl blur-sm transition-colors duration-500 ${
                                        isDarkMode ? 'bg-red-500/10' : 'bg-red-400/20'
                                    }`}></div>
                                    <p className={`relative text-sm text-center p-3 rounded-xl animate-fade-in backdrop-blur-sm transition-colors duration-500 ${
                                        isDarkMode
                                            ? 'text-red-400 bg-red-500/5 border border-red-500/20'
                                            : 'text-red-600 bg-red-50/80 border border-red-200'
                                    }`}>
                                        {error}
                                    </p>
                                </div>
                            )}

                            {/* Botón de envío */}
                            <div className="space-y-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 px-6 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-3 disabled:bg-blue-800 disabled:cursor-not-allowed disabled:scale-100 relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                    {isLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                            <span>Procesando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="w-5 h-5" />
                                            <span>Iniciar Sesión</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out forwards;
                }
            `}</style>
        </div>
    );
}