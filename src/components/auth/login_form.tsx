"use client"

import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import supabase from '@/app/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import { User, Lock, Eye, EyeOff, LogIn, Moon, Sun } from 'lucide-react';
import Cookies from 'js-cookie';

export default function LoginPage() {
    const { isDarkMode, toggleDarkMode } = useTheme();
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
                .rpc('get_user_by_username', { p_username: username });

            if (userError || !userData || userData.length === 0) {
                setError('Usuario o contraseña incorrectos');
                setIsLoading(false);
                return;
            }

            const user = userData[0];

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: user.email,
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
                id: user.id,
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name,
                rol: user.rol
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
        <div className={`h-screen relative overflow-hidden flex items-center justify-center transition-colors duration-300 ${
            isDarkMode
                ? 'bg-black'
                : 'bg-gradient-to-br from-blue-50 via-white to-blue-100'
        }`}>
            {/* Botón de tema - Posición fija superior derecha */}
            <button
                onClick={toggleDarkMode}
                className={`fixed top-6 right-6 z-50 p-3 rounded-full transition-all duration-200 hover:scale-110 ${
                    isDarkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-800/50 bg-white/5 border border-white/10'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white/80 border border-gray-200'
                }`}
                aria-label="Cambiar modo de color"
                title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
                {isDarkMode ? (
                    <Sun className="w-5 h-5" />
                ) : (
                    <Moon className="w-5 h-5" />
                )}
            </button>

            {/* Efectos de fondo animados - Más suaves */}
            <div className="absolute inset-0 pointer-events-none">
                <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl transition-all duration-[3000ms] ${
                    isDarkMode ? 'bg-blue-500/10' : 'bg-blue-400/20'
                }`} style={{ animation: 'float 8s ease-in-out infinite' }}></div>
                <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl transition-all duration-[3000ms] ${
                    isDarkMode ? 'bg-white/10' : 'bg-blue-300/15'
                }`} style={{ animation: 'float 10s ease-in-out infinite', animationDelay: '2s' }}></div>
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-2xl transition-all duration-[3000ms] ${
                    isDarkMode ? 'bg-blue-400/5' : 'bg-blue-200/15'
                }`} style={{ animation: 'float 12s ease-in-out infinite', animationDelay: '4s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-6xl px-6" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Panel izquierdo - Información */}
                    <div className="text-center lg:text-left" style={{ animation: 'fadeInLeft 0.8s ease-out' }}>
                        <div className="inline-flex items-center justify-center lg:justify-start mb-8">
                            <div className="relative group">
                                <div className={`absolute -inset-1 rounded-3xl blur-md transition-all duration-500 ${
                                    isDarkMode
                                        ? 'bg-blue-500/10 group-hover:bg-blue-500/20'
                                        : 'bg-blue-400/20 group-hover:bg-blue-400/30'
                                }`} style={{ animation: 'pulse 3s ease-in-out infinite' }}></div>
                                <div className={`relative p-6 rounded-3xl backdrop-blur-xl transition-all duration-300 ${
                                    isDarkMode
                                        ? 'bg-white/5 border border-white/10'
                                        : 'bg-white/60 border border-blue-200/30'
                                }`}>
                                    <img
                                        src={isDarkMode ? "/images/ITEA_logo.png" : "/images/ITEA_logo_negro.svg"}
                                        alt="Logo ITEA"
                                        className="h-28 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                                    />
                                </div>
                            </div>
                        </div>

                        <h1 className={`text-5xl lg:text-6xl font-extralight mb-6 tracking-tight transition-colors duration-300 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                            Sistema
                            <span className={`block transition-colors duration-300 ${
                                isDarkMode ? 'text-blue-400' : 'text-blue-600'
                            }`}>Gubernamental</span>
                        </h1>
                        <p className={`text-xl font-light transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            Acceso a la plataforma de gestión de inventario.
                        </p>
                    </div>

                    {/* Panel derecho - Formulario */}
                    <div className="w-full max-w-md mx-auto lg:mx-0" style={{ animation: 'fadeInRight 0.8s ease-out' }}>
                        <form onSubmit={handleLogin} className="space-y-6">
                            <h2 className={`text-2xl font-bold mb-6 text-center lg:hidden transition-colors duration-300 ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                Iniciar Sesión
                            </h2>
                            {/* Campo de Usuario */}
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-200">
                                    <User className={`w-5 h-5 transition-all duration-200 ${
                                        isDarkMode ? 'text-gray-400 group-focus-within:text-blue-400' : 'text-gray-500 group-focus-within:text-blue-600'
                                    }`} />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Nombre de Usuario"
                                    className={`w-full pl-12 pr-4 py-4 text-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-xl transition-all duration-200 ${
                                        isDarkMode
                                            ? 'bg-white/5 border border-white/20 text-white placeholder-gray-400 hover:bg-white/10 focus:bg-white/10 focus:border-white/30'
                                            : 'bg-white/80 border border-gray-300 text-gray-900 placeholder-gray-500 hover:bg-white focus:bg-white focus:border-blue-400'
                                    }`}
                                    autoComplete="username"
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            {/* Campo de Contraseña */}
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-200">
                                    <Lock className={`w-5 h-5 transition-all duration-200 ${
                                        isDarkMode ? 'text-gray-400 group-focus-within:text-blue-400' : 'text-gray-500 group-focus-within:text-blue-600'
                                    }`} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Contraseña"
                                    className={`w-full pl-12 pr-12 py-4 text-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-xl transition-all duration-200 ${
                                        isDarkMode
                                            ? 'bg-white/5 border border-white/20 text-white placeholder-gray-400 hover:bg-white/10 focus:bg-white/10 focus:border-white/30'
                                            : 'bg-white/80 border border-gray-300 text-gray-900 placeholder-gray-500 hover:bg-white focus:bg-white focus:border-blue-400'
                                    }`}
                                    autoComplete="current-password"
                                    disabled={isLoading}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className={`absolute right-4 top-1/2 transform -translate-y-1/2 focus:outline-none transition-all duration-200 ${
                                        isDarkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'
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
                                <div className="relative" style={{ animation: 'shake 0.4s ease-in-out' }}>
                                    <div className={`absolute inset-0 rounded-xl blur-sm transition-colors duration-300 ${
                                        isDarkMode ? 'bg-red-500/10' : 'bg-red-400/20'
                                    }`}></div>
                                    <p className={`relative text-sm text-center p-3 rounded-xl backdrop-blur-sm transition-colors duration-300 ${
                                        isDarkMode
                                            ? 'text-red-400 bg-red-500/5 border border-red-500/20'
                                            : 'text-red-600 bg-red-50/80 border border-red-200'
                                    }`} style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                        {error}
                                    </p>
                                </div>
                            )}

                            {/* Botón de envío */}
                            <div className="space-y-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 px-6 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:bg-blue-800 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-70 relative overflow-hidden group shadow-lg hover:shadow-xl"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                    {isLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Procesando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
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
                @keyframes fadeInUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(30px);
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0);
                    }
                }
                
                @keyframes fadeInLeft {
                    from { 
                        opacity: 0; 
                        transform: translateX(-30px);
                    }
                    to { 
                        opacity: 1; 
                        transform: translateX(0);
                    }
                }
                
                @keyframes fadeInRight {
                    from { 
                        opacity: 0; 
                        transform: translateX(30px);
                    }
                    to { 
                        opacity: 1; 
                        transform: translateX(0);
                    }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes float {
                    0%, 100% { 
                        transform: translateY(0px) scale(1);
                    }
                    50% { 
                        transform: translateY(-20px) scale(1.05);
                    }
                }
                
                @keyframes pulse {
                    0%, 100% { 
                        opacity: 0.6;
                    }
                    50% { 
                        opacity: 1;
                    }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
            `}</style>
        </div>
    );
}