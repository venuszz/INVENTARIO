"use client"

import { useState } from 'react'
import supabase from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, Lock, Shield, UserCircle, Users, Eye, EyeOff } from 'lucide-react'
import { useUserRole } from "@/hooks/useUserRole"
import RoleGuard from "@/components/roleGuard"
import Link from 'next/link'

export default function RegisterPage() {
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

            const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('username')
                .eq('username', username)
                .single();

            if (existingUser) {
                setError('Este nombre de usuario ya está en uso. Por favor, elige otro.');
                setIsLoading(false);
                return;
            }

            if (checkError && checkError.code !== 'PGRST116') {
                setError('Ocurrió un error al verificar disponibilidad. Intenta de nuevo.');
                setIsLoading(false);
                return;
            }

            const { data: existingEmail } = await supabase
                .from('users')
                .select('email')
                .eq('email', uniqueEmail)
                .single();

            if (existingEmail) {
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

    // --- PANTALLA DE ACCESO RESTRINGIDO (SIN CAMBIOS DE DISEÑO) ---
    const restrictedContent = (
        <div className="min-h-screen w-full overflow-hidden relative bg-black">
            <div className="absolute inset-0 bg-black opacity-80 z-0">
                <div className="absolute inset-0 bg-grid"></div>
            </div>
            <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-2xl bg-black/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-red-800/30 overflow-hidden">
                    <div className="relative p-8 flex flex-col items-center justify-center bg-gradient-to-b from-black to-black/40 border-b border-red-800/20">
                        <img src="/images/ITEA_logo.png" alt="Logo ITEA" className="h-32 w-auto object-contain animate-float mb-6" />
                        <div className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
                    </div>
                    <div className="p-8">
                        <div className="flex flex-col items-center">
                            <div className="mb-6 bg-gradient-to-r from-red-500/20 via-red-500/10 to-red-500/20 p-px rounded-xl">
                                <div className="bg-black/40 rounded-xl p-4 backdrop-blur-sm">
                                    <div className="flex items-center justify-center mb-4">
                                        <Shield className="h-10 w-10 text-red-500 animate-pulse" />
                                    </div>
                                    <h1 className="text-xl font-bold text-center text-white mb-2">Acceso Restringido</h1>
                                    <p className="text-center text-gray-300 text-sm">Si necesitas acceso, contacta a un administrador.</p>
                                </div>
                            </div>
                            <Link href="/" className="group relative px-6 py-3 overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium text-sm inline-flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
                                <div className="absolute inset-0 bg-white/20 group-hover:scale-x-100 scale-x-0 origin-left transition-transform duration-300"></div>
                                <span className="relative">Volver al Panel Principal</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .bg-grid { background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px); background-size: 30px 30px; }
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                .animate-float { animation: float 6s ease-in-out infinite; }
            `}</style>
        </div>
    );

    return (
        <RoleGuard roles={["superadmin"]} userRole={userRole} fallback={restrictedContent}>
            {/* --- NUEVO DISEÑO INSPIRADO EN EL COMPONENTE DE LOGIN --- */}
            <div className="min-h-screen relative overflow-hidden bg-black flex items-center justify-center p-4">
                {/* Efectos de fondo animados */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="relative z-10 w-full max-w-6xl px-6 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Panel izquierdo - Información */}
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center justify-center lg:justify-start mb-8">
                                <div className="relative group">
                                    <div className="absolute -inset-1 rounded-3xl bg-blue-500/20 blur-md group-hover:bg-blue-500/30 transition-all duration-700 animate-pulse"></div>
                                    <div className="relative p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                                        <img src="/images/ITEA_logo.png" alt="Logo ITEA" className="h-20 w-auto object-contain" />
                                    </div>
                                </div>
                            </div>
                            <h1 className="text-5xl lg:text-6xl font-extralight text-white mb-6 tracking-tight">
                                Registro de
                                <span className="block text-blue-400">Nuevo Usuario</span>
                            </h1>
                            <p className="text-xl text-gray-400 font-light">
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
                                        <span className="text-white font-medium">Datos</span>
                                    </div>
                                    <div className={`flex-1 h-0.5 transition-colors duration-500 ${step === 2 ? 'bg-blue-500' : 'bg-white/20'}`}></div>
                                    <div className={`flex items-center gap-2 transition-opacity duration-300 ${step === 2 ? 'opacity-100' : 'opacity-50'}`}>
                                        <span className="text-white font-medium">Acceso</span>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold transition-colors duration-500 ${step === 2 ? 'bg-blue-600' : 'bg-white/20'}`}>2</div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-red-500/10 rounded-xl blur-sm"></div>
                                        <p className="relative text-red-400 text-sm text-center p-3 bg-red-500/5 border border-red-500/20 rounded-xl animate-fade-in backdrop-blur-sm">{error}</p>
                                    </div>
                                )}

                                {/* Campos del Paso 1 */}
                                {step === 1 && (
                                    <>
                                        <div className="relative group">
                                            <UserCircle className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-400" />
                                            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nombre(s)" required className="w-full pl-12 pr-4 py-4 text-base bg-white/5 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-gray-400" />
                                        </div>
                                        <div className="relative group">
                                            <Users className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-400" />
                                            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Apellido(s)" required className="w-full pl-12 pr-4 py-4 text-base bg-white/5 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-gray-400" />
                                        </div>
                                        <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors">Continuar</button>
                                    </>
                                )}

                                {/* Campos del Paso 2 */}
                                {step === 2 && (
                                    <>
                                        <div className="relative group">
                                            <User className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-400" />
                                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Nombre de Usuario" required className="w-full pl-12 pr-4 py-4 text-base bg-white/5 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-gray-400" />
                                        </div>
                                        <div className="relative group">
                                            <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-400" />
                                            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña (mín. 8 caracteres)" required minLength={8} className="w-full pl-12 pr-12 py-4 text-base bg-white/5 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-gray-400" />
                                            <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                                        </div>
                                        <div className="relative group">
                                            <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-400" />
                                            <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar Contraseña" required minLength={8} className="w-full pl-12 pr-12 py-4 text-base bg-white/5 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-gray-400" />
                                            <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400">{showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                                        </div>
                                        <div className="relative group">
                                            <Shield className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-400" />
                                            <select title='Rol de usuario' value={rol} onChange={(e) => setRol(e.target.value)} required className="w-full pl-12 pr-4 py-4 text-base bg-white/5 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-gray-400 appearance-none">
                                                <option value="usuario" className="bg-gray-900">Usuario Normal</option>
                                                <option value="admin" className="bg-gray-900">Administrador</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <button type="button" onClick={handlePrevStep} className="w-full py-4 bg-white/10 text-white rounded-2xl font-semibold hover:bg-white/20 transition-colors">Atrás</button>
                                            <button type="submit" disabled={isLoading} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center disabled:bg-blue-800">
                                                {isLoading ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : 'Crear Cuenta'}
                                            </button>
                                        </div>
                                    </>
                                )}

                                <div className="text-center pt-2">
                                    <p className="text-gray-400 text-sm">¿Ya tienes una cuenta? <a href="/login" className="text-blue-400 hover:underline">Iniciar sesión</a></p>
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