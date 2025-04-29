"use client"

import { useState, useEffect, useRef } from 'react'
import supabase from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, Lock, Shield, UserCircle, Users } from 'lucide-react'
import { useUserRole } from "@/hooks/useUserRole";
import RoleGuard from "@/components/roleGuard";
import Link from 'next/link'

export default function RegisterPage() {
    const [step, setStep] = useState(1) // Paso 1: Datos personales, Paso 2: Credenciales
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [rol, setRol] = useState('usuario')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const particlesRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        // Detectar si es móvil
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }

        checkIfMobile()
        window.addEventListener('resize', checkIfMobile)

        setIsLoaded(true)

        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current && !isMobile) {
                const rect = containerRef.current.getBoundingClientRect()
                setMousePosition({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                })
            }
        }

        window.addEventListener('mousemove', handleMouseMove)

        // Solo crear partículas en dispositivos no móviles para mejor rendimiento
        if (!isMobile) {
            const interval = setInterval(() => {
                if (particlesRef.current) {
                    const particle = document.createElement('div')
                    particle.classList.add('particle')

                    const posX = Math.random() * 100
                    const posY = Math.random() * 100
                    const size = Math.random() * 3 + 1
                    const speedX = (Math.random() - 0.5) * 2
                    const speedY = (Math.random() - 0.5) * 2

                    particle.style.left = `${posX}%`
                    particle.style.top = `${posY}%`
                    particle.style.width = `${size}px`
                    particle.style.height = `${size}px`
                    particle.style.opacity = (Math.random() * 0.5 + 0.3).toString()

                    particlesRef.current.appendChild(particle)

                    let positionX = posX
                    let positionY = posY

                    const animate = () => {
                        positionX += speedX
                        positionY += speedY

                        particle.style.left = `${positionX}%`
                        particle.style.top = `${positionY}%`

                        if (positionX < -10 || positionX > 110 || positionY < -10 || positionY > 110) {
                            particle.remove()
                            return
                        }

                        requestAnimationFrame(animate)
                    }

                    animate()

                    setTimeout(() => {
                        if (particle.parentNode === particlesRef.current) {
                            particle.remove()
                        }
                    }, 8000)
                }
            }, 100)

            return () => {
                window.removeEventListener('mousemove', handleMouseMove)
                clearInterval(interval)
                window.removeEventListener('resize', checkIfMobile)
            }
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('resize', checkIfMobile)
        }
    }, [isMobile])

    const validatePersonalData = () => {
        if (!firstName.trim()) {
            setError('Por favor, ingresa tu nombre')
            return false
        }
        if (!lastName.trim()) {
            setError('Por favor, ingresa tu apellido')
            return false
        }
        return true
    }

    const validateCredentials = () => {
        if (!username.trim()) {
            setError('Por favor, ingresa un nombre de usuario')
            return false
        }
        if (username.length < 3) {
            setError('El nombre de usuario debe tener al menos 3 caracteres')
            return false
        }
        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres')
            return false
        }
        return true
    }

    const handleNextStep = () => {
        setError(null)
        if (validatePersonalData()) {
            setStep(2)
        }
    }

    const handlePrevStep = () => {
        setError(null)
        setStep(1)
    }

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)

        if (isLoading) return
        if (!validateCredentials()) return

        setIsLoading(true)

        try {
            // Generar un email único para Supabase con formato válido pero SIN timestamp
            const sanitizedUsername = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
            const uniqueEmail = `${sanitizedUsername}@inventario.com`

            // Verificar si el nombre de usuario ya existe
            const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('username')
                .eq('username', username)
                .single()

            if (existingUser) {
                setError('Este nombre de usuario ya está en uso. Por favor, elige otro.')
                setIsLoading(false)
                return
            }

            if (checkError && checkError.code !== 'PGRST116') {
                setError('Ocurrió un error al verificar disponibilidad. Intenta de nuevo.')
                setIsLoading(false)
                return
            }

            // Verificar si el email ya existe
            const { data: existingEmail } = await supabase
                .from('users')
                .select('email')
                .eq('email', uniqueEmail)
                .single()

            if (existingEmail) {
                setError('Este usuario ya está registrado. Por favor, elige otro nombre de usuario.')
                setIsLoading(false)
                return
            }


            // Registrar usuario con autoconfirmación
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
            })

            if (error) {
                setError(error.message)
                setIsLoading(false)
                return
            }

            console.log('Usuario registrado correctamente en auth')

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
                    })

                if (userError) {
                    setError(userError.message)
                    setIsLoading(false)
                    return
                }
                try {
                    const { error: confirmError } = await supabase.functions.invoke('confirm-user', {
                        body: { user_id: data.user.id }
                    })

                    if (confirmError) {
                    }
                } catch {
                }
            }

            // Autenticar al usuario automáticamente después de confirmar
            try {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: uniqueEmail,
                    password
                })

                if (signInError) {
                    console.warn('No se pudo iniciar sesión automáticamente:', signInError)
                    // Almacenamos las credenciales para intentar iniciar sesión en la página de login
                    localStorage.setItem('pendingLogin', uniqueEmail)
                }
            } catch (signInErr) {
                console.warn('Error en inicio de sesión automático:', signInErr)
            }

            console.log('Registro completo, redirigiendo a login')
            router.push('/login')
        } catch (err) {
            console.error('Error inesperado en registro:', err)
            setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.')
        } finally {
            setIsLoading(false)
        }
    }

    const userRole = useUserRole();

    // Pantalla de acceso restringido
    const restrictedContent = (
        <div className="min-h-screen w-full overflow-hidden relative">
            <div className="absolute inset-0 bg-black opacity-80 z-0">
                <div className="absolute inset-0 bg-grid"></div>
            </div>

            {!isMobile && (
                <>
                    <div className="absolute inset-0 z-0">
                        <div className="wave wave1"></div>
                        <div className="wave wave2"></div>
                        <div className="wave wave3"></div>
                    </div>

                    <div ref={particlesRef} className="absolute inset-0 overflow-hidden z-0"></div>

                    <div
                        className="absolute w-64 h-64 rounded-full pointer-events-none z-0 opacity-20 blur-3xl"
                        style={{
                            background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
                            transform: `translate(${mousePosition.x - 128}px, ${mousePosition.y - 128}px)`,
                            transition: 'transform 0.1s ease-out'
                        }}
                    ></div>

                    <div className="absolute inset-0 bg-connections z-0"></div>
                </>
            )}

            <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                <div className={`w-full max-w-2xl bg-black/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-red-800/30 overflow-hidden`}>
                    {/* Logo Section - Top */}
                    <div className="relative p-8 flex flex-col items-center justify-center bg-gradient-to-b from-black to-black/40 border-b border-red-800/20">
                        <div className={`transform transition-all duration-1000 ${isLoaded ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
                            <img
                                src="/images/ITEA_logo.png"
                                alt="Logo ITEA"
                                className="h-32 w-auto object-contain animate-float mb-6"
                                onLoad={() => setIsLoaded(true)}
                            />
                        </div>

                        <div className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>

                        <div className="absolute left-0 top-0 w-32 h-32 bg-red-500/5 rounded-br-full blur-2xl"></div>
                        <div className="absolute right-0 bottom-0 w-32 h-32 bg-blue-500/5 rounded-tl-full blur-2xl"></div>
                    </div>

                    {/* Content Section - Bottom */}
                    <div className="p-8">
                        <div className="flex flex-col items-center">
                            <div className="mb-6 bg-gradient-to-r from-red-500/20 via-red-500/10 to-red-500/20 p-px rounded-xl">
                                <div className="bg-black/40 rounded-xl p-4 backdrop-blur-sm">
                                    <div className="flex items-center justify-center mb-4">
                                        <Shield className="h-10 w-10 text-red-500 animate-pulse" />
                                    </div>
                                    <h1 className="text-xl font-bold text-center text-white mb-2">
                                        Acceso Restringido
                                    </h1>
                                    <p className="text-center text-gray-300 text-sm">
                                        Si necesitas acceso a esta funcionalidad, contacta con un administrador del sistema..
                                    </p>
                                </div>
                            </div>

                            <div className="w-full max-w-md space-y-4">
                                <div className="flex justify-center pt-2">
                                    <Link
                                        href="/"
                                        className="group relative px-6 py-3 overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium text-sm inline-flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
                                    >
                                        <div className="absolute inset-0 bg-white/20 group-hover:scale-x-100 scale-x-0 origin-left transition-transform duration-300"></div>
                                        <span className="relative">Volver al Panel Principal</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Decorative Elements */}
                            <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                            <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

                            <div className="relative w-full h-8 mt-8">
                                <div className="absolute inset-0 flex justify-around items-center">
                                    <div className="w-1 h-1 bg-red-400/40 rounded-full animate-glow"></div>
                                    <div className="w-1 h-1 bg-blue-400/40 rounded-full animate-glow-delay-1"></div>
                                    <div className="w-1 h-1 bg-red-400/40 rounded-full animate-glow-delay-2"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes glow {
                    0%, 100% { transform: scale(1); opacity: 0.4; }
                    50% { transform: scale(2); opacity: 0.8; }
                }

                .animate-glow {
                    animation: glow 3s ease-in-out infinite;
                }

                .animate-glow-delay-1 {
                    animation: glow 3s ease-in-out infinite;
                    animation-delay: 1s;
                }

                .animate-glow-delay-2 {
                    animation: glow 3s ease-in-out infinite;
                    animation-delay: 2s;
                }

                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                .bg-grid {
                    background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
                    background-size: 30px 30px;
                }

                .bg-connections {
                    background-image: 
                        radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                        radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px);
                    background-size: 40px 40px, 20px 20px;
                    background-position: 0 0, 10px 10px;
                }

                .wave {
                    position: absolute;
                    width: 200%;
                    height: 200%;
                    left: -50%;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 43%;
                }

                .wave1 {
                    bottom: -80%;
                    animation: rotate 20000ms linear infinite;
                }

                .wave2 {
                    bottom: -75%;
                    animation: rotate 25000ms linear infinite reverse;
                    opacity: 0.5;
                }

                .wave3 {
                    bottom: -70%;
                    animation: rotate 30000ms linear infinite;
                    opacity: 0.3;
                }

                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );

    return (
        <RoleGuard roles={["superadmin"]} userRole={userRole} fallback={restrictedContent}>
            <div
                ref={containerRef}
                className="min-h-screen w-full overflow-hidden relative"
            >
                <div className="absolute inset-0 bg-black opacity-80 z-0">
                    <div className="absolute inset-0 bg-grid"></div>
                </div>

                {!isMobile && (
                    <>
                        <div className="absolute inset-0 z-0">
                            <div className="wave wave1"></div>
                            <div className="wave wave2"></div>
                            <div className="wave wave3"></div>
                        </div>

                        <div ref={particlesRef} className="absolute inset-0 overflow-hidden z-0"></div>

                        <div
                            className="absolute w-64 h-64 rounded-full pointer-events-none z-0 opacity-20 blur-3xl"
                            style={{
                                background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
                                transform: `translate(${mousePosition.x - 128}px, ${mousePosition.y - 128}px)`,
                                transition: 'transform 0.1s ease-out'
                            }}
                        ></div>

                        <div className="absolute inset-0 bg-connections z-0"></div>
                    </>
                )}

                <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                    <div className={`w-full ${isMobile ? 'max-w-md' : 'max-w-4xl'} bg-black/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-blue-800/30 overflow-hidden`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8">
                            {!isMobile && (
                                <div className="p-6 md:p-8 flex flex-col justify-center items-center">
                                    <div className={`transform transition-all duration-1000 ${isLoaded ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
                                        <img
                                            src="/images/ITEA_logo.png"
                                            alt="Logo Gobierno"
                                            className="h-24 md:h-32 w-auto object-contain animate-float mb-6 md:mb-8"
                                            onLoad={() => setIsLoaded(true)}
                                        />
                                    </div>

                                    <h1 className="text-2xl md:text-3xl font-bold text-center text-white mb-3 md:mb-4">
                                        Sistema Gubernamental
                                    </h1>

                                    <p className="text-center text-gray-300 text-sm md:text-base mb-4 md:mb-6">
                                        Acceso institucional a la plataforma de administración y gestión del Inventario.
                                    </p>

                                    <div className="relative h-24 w-24 md:h-32 md:w-32 mt-4 md:mt-6">
                                        <div className="absolute inset-0">
                                            <div className="orbit orbit1"></div>
                                            <div className="orbit orbit2"></div>
                                            <div className="orbital-dot orbital-dot1"></div>
                                            <div className="orbital-dot orbital-dot2"></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className={`p-6 ${isMobile ? '' : 'md:p-8 bg-black/40'}`}>
                                {isMobile && (
                                    <div className="flex justify-center mb-4">
                                        <img
                                            src="/images/ITEA_logo.png"
                                            alt="Logo Gobierno"
                                            className="h-16 w-auto object-contain"
                                        />
                                    </div>
                                )}

                                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 text-center">
                                    Registro de Usuario
                                </h2>

                                <div className="flex justify-center mb-4 md:mb-6">
                                    <div className="flex items-center">
                                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${step === 1 ? 'bg-blue-600' : 'bg-blue-900'} text-white font-bold text-sm md:text-base`}>
                                            1
                                        </div>
                                        <div className={`h-1 w-12 md:w-20 ${step === 1 ? 'bg-gray-600' : 'bg-blue-600'}`}></div>
                                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${step === 2 ? 'bg-blue-600' : 'bg-blue-900'} text-white font-bold text-sm md:text-base`}>
                                            2
                                        </div>
                                    </div>
                                </div>

                                <p className="text-center text-gray-300 text-sm md:text-base mb-4 md:mb-6">
                                    {step === 1 ? 'Ingresa tus datos personales' : 'Configura tus credenciales de acceso'}
                                </p>

                                <form onSubmit={step === 1 ? (e => { e.preventDefault(); handleNextStep(); }) : handleRegister} className="space-y-4 md:space-y-6">
                                    {error && (
                                        <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-2 md:p-3 rounded-lg text-center text-sm md:text-base">
                                            {error}
                                        </div>
                                    )}

                                    {step === 1 ? (
                                        <>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <UserCircle className="text-blue-400" size={18} />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Nombre(s)"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    required
                                                    className="w-full pl-10 pr-4 py-3 md:py-4 bg-gray-800 text-white rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-base"
                                                />
                                            </div>

                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Users className="text-blue-400" size={18} />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Apellido(s)"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    required
                                                    className="w-full pl-10 pr-4 py-3 md:py-4 bg-gray-800 text-white rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-base"
                                                />
                                            </div>

                                            <div className="pt-2 md:pt-4">
                                                <button
                                                    type="submit"
                                                    className="w-full bg-blue-600 text-white py-3 md:py-4 rounded-lg md:rounded-xl hover:bg-blue-700 transition-colors font-semibold text-base"
                                                >
                                                    Continuar
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <User className="text-blue-400" size={18} />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Nombre de Usuario"
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    required
                                                    className="w-full pl-10 pr-4 py-3 md:py-4 bg-gray-800 text-white rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-base"
                                                />
                                            </div>

                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Lock className="text-blue-400" size={18} />
                                                </div>
                                                <input
                                                    type="password"
                                                    placeholder="Contraseña"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                    minLength={8}
                                                    className="w-full pl-10 pr-4 py-3 md:py-4 bg-gray-800 text-white rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-base"
                                                />
                                            </div>

                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Shield className="text-blue-400" size={18} />
                                                </div>
                                                <select
                                                    value={rol}
                                                    onChange={(e) => setRol(e.target.value)}
                                                    title='Rol de Usuario'
                                                    className="w-full pl-10 pr-4 py-3 md:py-4 bg-gray-800 text-white rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-base appearance-none"
                                                    required
                                                >
                                                    <option value="usuario">Usuario Normal</option>
                                                    <option value="admin">Administrador</option>
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 md:gap-4 pt-2 md:pt-4">
                                                <button
                                                    type="button"
                                                    onClick={handlePrevStep}
                                                    className="w-full bg-gray-700 text-white py-3 md:py-4 rounded-lg md:rounded-xl hover:bg-gray-600 transition-colors font-semibold text-base"
                                                >
                                                    Atrás
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="w-full bg-blue-600 text-white py-3 md:py-4 rounded-lg md:rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-base"
                                                >
                                                    {isLoading ? 'Procesando...' : 'Crear Cuenta'}
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    <div className="text-center mt-4 md:mt-6">
                                        <p className="text-gray-400 text-sm md:text-base">
                                            ¿Ya tiene una cuenta?
                                            <a
                                                href="/login"
                                                className="text-blue-400 ml-2 hover:underline"
                                            >
                                                Iniciar sesión
                                            </a>
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .particle {
                        position: absolute;
                        background: white;
                        border-radius: 50%;
                        pointer-events: none;
                    }
                    
                    .bg-grid {
                        background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                                        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
                        background-size: 20px 20px;
                        width: 100%;
                        height: 100%;
                    }
                    
                    .bg-connections {
                        background-image: 
                            radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px),
                            radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
                        background-size: 40px 40px, 20px 20px;
                        background-position: 0 0, 10px 10px;
                    }
                    
                    .wave {
                        position: absolute;
                        width: 200%;
                        height: 200%;
                        left: -50%;
                        background: rgba(255, 255, 255, 0.03);
                        border-radius: 43%;
                    }
                    
                    .wave1 {
                        bottom: -80%;
                        animation: rotate 20000ms linear infinite;
                    }
                    
                    .wave2 {
                        bottom: -75%;
                        animation: rotate 25000ms linear infinite reverse;
                        opacity: 0.5;
                    }
                    
                    .wave3 {
                        bottom: -70%;
                        animation: rotate 30000ms linear infinite;
                        opacity: 0.3;
                    }
                    
                    .orbit {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 50%;
                        transform: translate(-50%, -50%);
                    }
                    
                    .orbit1 {
                        width: 80px;
                        height: 80px;
                        animation: spin 20s linear infinite;
                    }
                    
                    .orbit2 {
                        width: 120px;
                        height: 120px;
                        animation: spin 30s linear infinite reverse;
                    }
                    
                    .orbital-dot {
                        position: absolute;
                        width: 5px;
                        height: 5px;
                        background: white;
                        border-radius: 50%;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                    }
                    
                    .orbital-dot1 {
                        animation: orbit1 20s linear infinite;
                        box-shadow: 0 0 8px 2px rgba(100, 200, 255, 0.5);
                    }
                    
                    .orbital-dot2 {
                        animation: orbit2 30s linear infinite reverse;
                        box-shadow: 0 0 8px 2px rgba(255, 100, 255, 0.5);
                    }
                    
                    @keyframes float {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-8px); }
                    }
                    
                    @keyframes pulse {
                        0%, 100% { opacity: 0.1; }
                        50% { opacity: 0.2; }
                    }
                    
                    @keyframes rotate {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    
                    @keyframes spin {
                        from { transform: translate(-50%, -50%) rotate(0deg); }
                        to { transform: translate(-50%, -50%) rotate(360deg); }
                    }
                    
                    @keyframes orbit1 {
                        from { transform: rotate(0deg) translateX(40px) rotate(0deg); }
                        to { transform: rotate(360deg) translateX(40px) rotate(-360deg); }
                    }
                    
                    @keyframes orbit2 {
                        from { transform: rotate(0deg) translateX(60px) rotate(0deg); }
                        to { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
                    }

                    @media (max-width: 768px) {
                        .orbit1 {
                            width: 60px;
                            height: 60px;
                        }
                        
                        .orbit2 {
                            width: 100px;
                            height: 100px;
                        }
                        
                        @keyframes orbit1 {
                            from { transform: rotate(0deg) translateX(30px) rotate(0deg); }
                            to { transform: rotate(360deg) translateX(30px) rotate(-360deg); }
                        }
                        
                        @keyframes orbit2 {
                            from { transform: rotate(0deg) translateX(50px) rotate(0deg); }
                            to { transform: rotate(360deg) translateX(50px) rotate(-360deg); }
                        }
                    }
                `}</style>
            </div>
        </RoleGuard>
    )
}