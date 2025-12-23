"use client"

import { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Clock, CheckCircle2, Moon, Sun, Loader2 } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import supabase from '@/app/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface PendingUserInfo {
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl?: string | null;
}

export default function PendingApprovalPage() {
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { user, pendingUser } = useSession();
    const router = useRouter();
    const [userInfo, setUserInfo] = useState<PendingUserInfo | null>(null);
    const [isApproved, setIsApproved] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        const checkAccess = () => {
            // 1. Si ya tiene user (userData), significa que ya está activo/logueado -> Redirigir al inicio
            if (user) {
                router.replace('/');
                return;
            }

            // 2. Si NO tiene pendingUser, no debería estar aquí -> Redirigir al login
            if (!pendingUser) {
                router.replace('/login');
                return;
            }

            // 3. Si es válido (tiene pendingUser y no user), cargar info
            setUserInfo(pendingUser);
            setIsChecking(false);
        };

        checkAccess();
    }, [router, user, pendingUser]);

    // Supabase Realtime Subscription
    useEffect(() => {
        if (!userInfo?.email) return;

        const channel = supabase
            .channel('db-users-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                    filter: `email=eq.${userInfo.email}`
                },
                (payload) => {
                    const newUser = payload.new as any;
                    if (newUser.is_active || !newUser.pending_approval) {
                        setIsApproved(true);
                        // Auto-redirect logic
                        setTimeout(() => {
                            window.location.href = '/api/auth/sso';
                        }, 2000);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userInfo?.email]);

    if (isChecking) {
        return null; // O un spinner de carga minimalista
    }

    return (
        <div className={`h-screen relative overflow-hidden flex items-center justify-center transition-colors duration-700 ${isDarkMode
            ? 'bg-black'
            : 'bg-gradient-to-br from-blue-50 via-white to-blue-100'
            }`}>

            {/* Theme Toggle - Top Right */}
            <button
                onClick={toggleDarkMode}
                className={`fixed top-6 right-6 z-50 p-3 rounded-full transition-all duration-200 hover:scale-110 ${isDarkMode
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800/50 bg-white/5 border border-white/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white/80 border border-gray-200'
                    }`}
            >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Background Animations (Same as Login) */}
            <div className="absolute inset-0 pointer-events-none">
                <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl transition-all duration-[3000ms] ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-400/20'
                    }`} style={{ animation: 'float 8s ease-in-out infinite' }}></div>
                <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl transition-all duration-[3000ms] ${isDarkMode ? 'bg-white/10' : 'bg-blue-300/15'
                    }`} style={{ animation: 'float 10s ease-in-out infinite', animationDelay: '2s' }}></div>
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-2xl transition-all duration-[3000ms] ${isDarkMode ? 'bg-blue-400/5' : 'bg-blue-200/15'
                    }`} style={{ animation: 'float 12s ease-in-out infinite', animationDelay: '4s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-6xl px-6" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Left Panel: Branding (Same as Login) */}
                    <div className="text-center lg:text-left" style={{ animation: 'fadeInLeft 0.8s ease-out' }}>
                        <div className="inline-flex items-center justify-center lg:justify-start mb-8">
                            <div className="relative group">
                                <div className={`absolute -inset-1 rounded-3xl blur-md transition-all duration-500 ${isDarkMode
                                    ? 'bg-blue-500/10 group-hover:bg-blue-500/20'
                                    : 'bg-blue-400/20 group-hover:bg-blue-400/30'
                                    }`} style={{ animation: 'pulse 3s ease-in-out infinite' }}></div>
                                <div className={`relative p-6 rounded-3xl backdrop-blur-xl transition-all duration-300 ${isDarkMode
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

                        <h1 className={`text-5xl lg:text-6xl font-extralight mb-6 tracking-tight transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            Sistema
                            <span className={`block transition-colors duration-300 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                }`}>Gubernamental</span>
                        </h1>
                        <p className={`text-xl font-light transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            Tu acceso está siendo validado por un administrador.
                        </p>
                    </div>

                    {/* Right Panel: Content Card */}
                    <div className="w-full max-w-md mx-auto lg:mx-0" style={{ animation: 'fadeInRight 0.8s ease-out' }}>

                        {/* Mobile Logo */}
                        <div className="lg:hidden flex justify-center mb-8">
                            <img
                                src={isDarkMode ? "/images/ITEA_logo.png" : "/images/ITEA_logo_negro.svg"}
                                alt="Logo ITEA"
                                className="h-16 w-auto object-contain"
                            />
                        </div>

                        <div className={`relative overflow-hidden p-8 rounded-3xl backdrop-blur-2xl transition-all duration-300 shadow-2xl ${isDarkMode
                            ? 'bg-[#0A0A0A]/60 border border-white/10 shadow-black/50'
                            : 'bg-white/70 border border-white/60 shadow-blue-200/20'
                            }`}>

                            {/* Decorative Top Gradient Line */}
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${isApproved
                                ? 'from-emerald-500 via-green-400 to-emerald-500'
                                : 'from-blue-600 via-indigo-600 to-blue-600'
                                }`} />

                            {isApproved ? (
                                /* Approved State */
                                <div className="text-center space-y-8 py-8 animate-in zoom-in-95 duration-500">
                                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-gradient-to-tr shadow-[0_0_30px_rgba(16,185,129,0.3)] ${isDarkMode ? 'from-green-500/20 to-emerald-500/10 text-green-400' : 'from-green-100 to-emerald-50 text-green-600'
                                        }`}>
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <div>
                                        <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            ¡Solicitud Aprobada!
                                        </h2>
                                        <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Redirigiendo a tu panel...
                                        </p>
                                    </div>
                                    <div className="flex justify-center pt-2">
                                        <Loader2 size={24} className={`animate-spin ${isDarkMode ? 'text-green-500' : 'text-green-600'}`} />
                                    </div>
                                </div>
                            ) : (
                                /* Pending State */
                                <div className="space-y-8">
                                    <div className="text-center">
                                        {/* Avatar Display */}
                                        <div className="relative mb-6">
                                            <div className="w-24 h-24 mx-auto rounded-full p-1 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                                                <div className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                                                    {userInfo?.avatarUrl && !imageError ? (
                                                        <img
                                                            src={userInfo.avatarUrl}
                                                            alt="Profile"
                                                            className="w-full h-full object-cover"
                                                            onError={() => setImageError(true)}
                                                        />
                                                    ) : (
                                                        <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                            {userInfo?.firstName?.[0] || 'U'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Status Badge */}
                                            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 ${isDarkMode ? 'bg-blue-900 border border-blue-700 text-blue-200' : 'bg-blue-600 text-white'
                                                }`}>
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse"></div>
                                                En Revisión
                                            </div>
                                        </div>

                                        <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            Hola, {userInfo?.firstName || 'Usuario'}
                                        </h2>

                                        <p className={`text-sm leading-relaxed max-w-xs mx-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Hemos recibido tu solicitud correctamente. El sistema te dará acceso automáticamente en cuanto seas aprobado.
                                        </p>
                                    </div>

                                    <div className={`rounded-2xl p-4 flex items-center gap-4 ${isDarkMode ? 'bg-white/5 border border-white/5' : 'bg-blue-50 border border-blue-100'}`}>
                                        <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-white text-blue-600 shadow-sm'}`}>
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className={`text-xs font-bold uppercase tracking-wide opacity-70 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tiempo estimado</p>
                                            <p className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>~10 - 30 minutos</p>
                                        </div>
                                    </div>

                                    <div className={`text-center text-xs ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                        Serás redirigido automaticamente al inicio una vez que se apruebe tu solicitud.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInLeft {
                    from { opacity: 0; transform: translateX(-30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes fadeInRight {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(-20px) scale(1.05); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
