"use client"

import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import supabase from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, Lock, Shield, UserCircle, Users, Eye, EyeOff, ChevronRight } from 'lucide-react'
import { useUserRole } from "@/hooks/useUserRole"
import RoleGuard from "@/components/roleGuard"
import Link from 'next/link'

export default function RegisterPage() {
    const { isDarkMode } = useTheme();
    // --- LÓGICA ORIGINAL (SIN CAMBIOS) ---
    const [step, setStep] = useState(1); // Paso 1: Datos personales, Paso 2: Credenciales
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rol, setRol] = useState('usuario');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();
    const userRole = useUserRole();

    const validatePersonalData = () => {
        if (!firstName.trim()) {
            setError('Por favor, ingresa tu nombre');
            return false;
        }
        if (!lastName.trim()) {
            setError('Por favor, ingresa tu apellido');
            return false;
        }
        return true;
    };

    const validateCredentials = () => {
        if (!username.trim()) {
            setError('Por favor, ingresa un nombre de usuario');
            return false;
        }
        if (username.length < 3) {
            setError('El nombre de usuario debe tener al menos 3 caracteres');
            return false;
        }
        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return false;
        }
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return false;
        }
        return true;
    };

    const handleNextStep = () => {
        setError(null);
        if (validatePersonalData()) {
            setStep(2);
        }
    };

    const handlePrevStep = () => {
        setError(null);
        setStep(1);
    };

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (isLoading) return;
        if (!validateCredentials()) return;

        setIsLoading(true);

        try {
            const sanitizedUsername = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const uniqueEmail = `${sanitizedUsername}@inventario.com`;

            // Verificar si el username ya existe usando RPC
            const { data: usernameExists, error: checkError } = await supabase
                .rpc('check_username_exists', { p_username: username });

            if (checkError) {
                setError('Ocurrió un error al verificar disponibilidad. Intenta de nuevo.');
                setIsLoading(false);
                return;
            }

            if (usernameExists) {
                setError('Este nombre de usuario ya está en uso. Por favor, elige otro.');
                setIsLoading(false);
                return;
            }

            // Verificar si el email ya existe usando RPC
            const { data: emailExists, error: emailCheckError } = await supabase
                .rpc('check_email_exists', { p_email: uniqueEmail });

            if (emailCheckError) {
                setError('Ocurrió un error al verificar disponibilidad. Intenta de nuevo.');
                setIsLoading(false);
                return;
            }

            if (emailExists) {
                setError('Este usuario ya está registrado. Por favor, elige otro nombre de usuario.');
                setIsLoading(false);
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email: uniqueEmail,
                password,
                options: {
                    data: {
                        username,
                        firstName,
                        lastName,
                        rol
                    },
                    emailRedirectTo: undefined,
                }
            });

            if (error) {
                setError(error.message);
                setIsLoading(false);
                return;
            }

            if (data.user) {
                const { error: userError } = await supabase
                    .from('users')
                    .insert({
                        id: data.user.id,
                        username,
                        email: uniqueEmail,
                        first_name: firstName,
                        last_name: lastName,
                        rol: rol,
                    });

                if (userError) {
                    setError(userError.message);
                    setIsLoading(false);
                    return;
                }

                try {
                    await supabase.functions.invoke('confirm-user', {
                        body: { user_id: data.user.id }
                    });
                } catch {
                    // Ignorar error de confirmación si falla, el flujo principal continúa
                }
            }

            router.push('/login?message=Registro exitoso. Por favor, inicia sesión.');
        } catch {
            setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- PANTALLA DE ACCESO RESTRINGIDO ---
    const restrictedContent = (
        <div className={`min-h-screen w-full flex items-center justify-center p-4 relative transition-colors duration-500 ${isDarkMode
            ? 'bg-black text-white'
            : 'bg-gray-50 text-gray-900'
            }`}>



            <div className={`relative z-10 w-full max-w-lg p-10 md:p-14 rounded-2xl flex flex-col items-center border ${isDarkMode
                ? 'bg-[#0A0A0A] border-gray-800 shadow-2xl shadow-black'
                : 'bg-white border-gray-200 shadow-xl shadow-gray-200/50'
                }`}>

                {/* Logo Section */}
                <div className="mb-12">
                    <img
                        src={isDarkMode ? "/images/ITEA_logo.png" : "/images/ITEA_logo_negro.svg"}
                        alt="Logo ITEA"
                        className="h-24 w-auto object-contain"
                    />
                </div>

                {/* Restricted Access Badge */}
                <div className={`mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-[0.2em] border ${isDarkMode
                    ? 'bg-white/5 text-gray-400 border-white/10'
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>
                    <Shield size={12} />
                    Acceso Restringido
                </div>

                <h1 className={`text-2xl font-semibold text-center mb-4 tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Área Protegida
                </h1>

                <p className={`text-center text-sm mb-12 max-w-xs leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Esta sección requiere permisos de administrador.
                    Si crees que esto es un error, contacta al equipo de sistemas.
                </p>

                <Link
                    href="/"
                    className={`w-full py-4 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-3 ${isDarkMode
                        ? 'bg-white text-black hover:bg-gray-200'
                        : 'bg-black text-white hover:bg-gray-800'
                        }`}
                >
                    Volver al Panel Principal
                </Link>
            </div>


        </div>
    );

    return (
        <RoleGuard roles={["superadmin"]} userRole={userRole} fallback={restrictedContent}>
            {/* --- NUEVO DISEÑO INSPIRADO EN EL COMPONENTE DE LOGIN --- */}
            <div className={`min-h-screen relative overflow-hidden flex items-center justify-center p-4 transition-colors duration-500 ${isDarkMode
                ? 'bg-black'
                : 'bg-gradient-to-br from-blue-50 via-white to-blue-100'
                }`}>
                {/* Efectos de fondo animados */}
                <div className="absolute inset-0">
                    <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse transition-colors duration-500 ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-400/30'
                        }`}></div>
                    <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse transition-colors duration-500 ${isDarkMode ? 'bg-white/20' : 'bg-blue-300/20'
                        }`} style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="relative z-10 w-full max-w-6xl px-6 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Panel izquierdo - Información */}
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center justify-center lg:justify-start mb-8">
                                <div className="relative group">
                                    <div className={`absolute -inset-1 rounded-3xl blur-md group-hover:transition-all duration-700 animate-pulse ${isDarkMode
                                        ? 'bg-blue-500/20 group-hover:bg-blue-500/30'
                                        : 'bg-blue-400/30 group-hover:bg-blue-400/40'
                                        }`}></div>
                                    <div className={`relative p-6 rounded-3xl backdrop-blur-xl transition-colors duration-500 ${isDarkMode
                                        ? 'bg-white/5 border border-white/10'
                                        : 'bg-white/60 border border-blue-200/30'
                                        }`}>
                                        <img
                                            src={isDarkMode ? "/images/ITEA_logo.png" : "/images/ITEA_logo_negro.svg"}
                                            alt="Logo ITEA"
                                            className="h-28 w-auto object-contain"
                                        />
                                    </div>
                                </div>
                            </div>
                            <h1 className={`text-5xl lg:text-6xl font-extralight mb-6 tracking-tight transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                Registro de
                                <span className={`block transition-colors duration-500 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                    }`}>Nuevo Usuario</span>
                            </h1>
                            <p className={`text-xl font-light transition-colors duration-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                Creación de cuentas para el sistema de inventario.
                            </p>
                        </div>

                        {/* Panel derecho - Formulario Multi-paso */}
                        <div className="w-full max-w-md mx-auto lg:mx-0">
                            <form onSubmit={step === 1 ? (e => { e.preventDefault(); handleNextStep(); }) : handleRegister} className="space-y-5">
                                {/* Indicador de Pasos */}
                                <div className="flex items-center justify-center gap-4 mb-6">
                                    <div className={`flex items-center gap-2 transition-opacity duration-300 ${step === 1 ? 'opacity-100' : 'opacity-50'}`}>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 text-white font-bold">1</div>
                                        <span className={`font-medium transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>Datos</span>
                                    </div>
                                    <div className={`flex-1 h-0.5 transition-colors duration-500 ${step === 2
                                        ? 'bg-blue-500'
                                        : isDarkMode ? 'bg-white/20' : 'bg-gray-300'
                                        }`}></div>
                                    <div className={`flex items-center gap-2 transition-opacity duration-300 ${step === 2 ? 'opacity-100' : 'opacity-50'}`}>
                                        <span className={`font-medium transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>Acceso</span>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors duration-500 ${step === 2
                                            ? 'bg-blue-600 text-white'
                                            : isDarkMode ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-600'
                                            }`}>2</div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="relative">
                                        <div className={`absolute inset-0 rounded-xl blur-sm transition-colors duration-500 ${isDarkMode ? 'bg-red-500/10' : 'bg-red-400/20'
                                            }`}></div>
                                        <p className={`relative text-sm text-center p-3 rounded-xl animate-fade-in backdrop-blur-sm transition-colors duration-500 ${isDarkMode
                                            ? 'text-red-400 bg-red-500/5 border border-red-500/20'
                                            : 'text-red-600 bg-red-50/80 border border-red-200'
                                            }`}>{error}</p>
                                    </div>
                                )}

                                {/* Campos del Paso 1 */}
                                {step === 1 && (
                                    <>
                                        <div className="relative group">
                                            <UserCircle className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-400 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                }`} />
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                placeholder="Nombre(s)"
                                                required
                                                className={`w-full pl-12 pr-4 py-4 text-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors duration-500 ${isDarkMode
                                                    ? 'bg-white/5 border border-white/20 text-white placeholder-gray-400'
                                                    : 'bg-white/80 border border-gray-300 text-gray-900 placeholder-gray-500'
                                                    }`}
                                            />
                                        </div>
                                        <div className="relative group">
                                            <Users className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-400 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                }`} />
                                            <input
                                                type="text"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                placeholder="Apellido(s)"
                                                required
                                                className={`w-full pl-12 pr-4 py-4 text-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors duration-500 ${isDarkMode
                                                    ? 'bg-white/5 border border-white/20 text-white placeholder-gray-400'
                                                    : 'bg-white/80 border border-gray-300 text-gray-900 placeholder-gray-500'
                                                    }`}
                                            />
                                        </div>
                                        <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors">Continuar</button>
                                    </>
                                )}

                                {/* Campos del Paso 2 */}
                                {step === 2 && (
                                    <>
                                        <div className="relative group">
                                            <User className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-400 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                }`} />
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                placeholder="Nombre de Usuario"
                                                required
                                                className={`w-full pl-12 pr-4 py-4 text-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors duration-500 ${isDarkMode
                                                    ? 'bg-white/5 border border-white/20 text-white placeholder-gray-400'
                                                    : 'bg-white/80 border border-gray-300 text-gray-900 placeholder-gray-500'
                                                    }`}
                                            />
                                        </div>
                                        <div className="relative group">
                                            <Lock className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-400 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                }`} />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Contraseña (mín. 8 caracteres)"
                                                required
                                                minLength={8}
                                                className={`w-full pl-12 pr-12 py-4 text-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors duration-500 ${isDarkMode
                                                    ? 'bg-white/5 border border-white/20 text-white placeholder-gray-400'
                                                    : 'bg-white/80 border border-gray-300 text-gray-900 placeholder-gray-500'
                                                    }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(v => !v)}
                                                className={`absolute right-4 top-1/2 -translate-y-1/2 hover:text-blue-400 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                    }`}
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                        <div className="relative group">
                                            <Lock className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-400 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                }`} />
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirmar Contraseña"
                                                required
                                                minLength={8}
                                                className={`w-full pl-12 pr-12 py-4 text-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors duration-500 ${isDarkMode
                                                    ? 'bg-white/5 border border-white/20 text-white placeholder-gray-400'
                                                    : 'bg-white/80 border border-gray-300 text-gray-900 placeholder-gray-500'
                                                    }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(v => !v)}
                                                className={`absolute right-4 top-1/2 -translate-y-1/2 hover:text-blue-400 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                    }`}
                                            >
                                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                        <div className="relative group">
                                            <Shield className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-400 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                }`} />
                                            <select
                                                title='Rol de usuario'
                                                value={rol}
                                                onChange={(e) => setRol(e.target.value)}
                                                required
                                                className={`w-full pl-12 pr-4 py-4 text-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none transition-colors duration-500 ${isDarkMode
                                                    ? 'bg-white/5 border border-white/20 text-white placeholder-gray-400'
                                                    : 'bg-white/80 border border-gray-300 text-gray-900 placeholder-gray-500'
                                                    }`}
                                            >
                                                <option value="usuario" className={isDarkMode ? "bg-gray-900" : "bg-white"}>Usuario Normal</option>
                                                <option value="admin" className={isDarkMode ? "bg-gray-900" : "bg-white"}>Administrador</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <button
                                                type="button"
                                                onClick={handlePrevStep}
                                                className={`w-full py-4 rounded-2xl font-semibold transition-colors ${isDarkMode
                                                    ? 'bg-white/10 text-white hover:bg-white/20'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    }`}
                                            >
                                                Atrás
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center disabled:bg-blue-800"
                                            >
                                                {isLoading ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : 'Crear Cuenta'}
                                            </button>
                                        </div>
                                    </>
                                )}

                                <div className="text-center pt-2">
                                    <p className={`text-sm transition-colors duration-500 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        ¿Ya tienes una cuenta?
                                        <a href="/login" className={`hover:underline transition-colors duration-300 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                            }`}> Iniciar sesión</a>
                                    </p>
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
                    .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
                `}</style>
            </div>
        </RoleGuard>
    )
}