"use client"

import { useState, useEffect, useRef } from 'react'
import supabase from '@/app/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, Lock, Shield } from 'lucide-react'

export default function RegisterPage() {
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

    useEffect(() => {
        setIsLoaded(true)

        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                setMousePosition({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                })
            }
        }

        window.addEventListener('mousemove', handleMouseMove)

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
        }
    }, [])

    const validateInputs = () => {
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

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)

        if (isLoading) return
        if (!validateInputs()) return

        setIsLoading(true)

        try {

            // Generar un email único para Supabase con formato válido pero SIN timestamp
            const sanitizedUsername = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
            const uniqueEmail = `${sanitizedUsername}@guerita.com`


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
                } catch  {
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

    return (
        <div
            ref={containerRef}
            className="min-h-screen w-full overflow-hidden relative"
        >
            <div className="absolute inset-0 bg-black opacity-80 z-0">
                <div className="absolute inset-0 bg-grid"></div>
            </div>

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

            <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
                <div className="w-full max-w-4xl bg-black/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-blue-800/30 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-8 flex flex-col justify-center items-center">
                            <div className={`transform transition-all duration-1000 ${isLoaded ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
                                <img
                                    src="/images/ITEA_logo.png"
                                    alt="Logo Gobierno"
                                    className="h-32 w-auto object-contain animate-float mb-8"
                                    onLoad={() => setIsLoaded(true)}
                                />
                            </div>

                            <h1 className="text-3xl font-bold text-center text-white mb-4">
                                Sistema Gubernamental
                            </h1>

                            <p className="text-center text-gray-300 mb-6">
                                Acceso institucional a la plataforma de administración y gestión del Inventario.
                            </p>

                            <div className="relative h-32 w-32 mt-6">
                                <div className="absolute inset-0">
                                    <div className="orbit orbit1"></div>
                                    <div className="orbit orbit2"></div>
                                    <div className="orbital-dot orbital-dot1"></div>
                                    <div className="orbital-dot orbital-dot2"></div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-black/40">
                            <h2 className="text-2xl font-bold text-white mb-8 text-center">
                                Registro de Usuario
                            </h2>

                            <form onSubmit={handleRegister} className="space-y-6">
                                {error && (
                                    <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-lg text-center">
                                        {error}
                                    </div>
                                )}

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User className="text-blue-400" size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Nombre de Usuario"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-gray-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg"
                                    />
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="text-blue-400" size={20} />
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="Contraseña"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg"
                                    />
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Shield className="text-blue-400" size={20} />
                                    </div>
                                    <select
                                        value={rol}
                                        onChange={(e) => setRol(e.target.value)}
                                        title='Rol de Usuario'
                                        className="w-full pl-12 pr-4 py-4 bg-gray-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg appearance-none"
                                        required
                                    >
                                        <option value="usuario">Usuario Normal</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                                    >
                                        {isLoading ? 'Procesando...' : 'Crear Cuenta'}
                                    </button>
                                </div>

                                <div className="text-center mt-6">
                                    <p className="text-gray-400">
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
                    width: 100px;
                    height: 100px;
                    animation: spin 20s linear infinite;
                }
                
                .orbit2 {
                    width: 160px;
                    height: 160px;
                    animation: spin 30s linear infinite reverse;
                }
                
                .orbital-dot {
                    position: absolute;
                    width: 6px;
                    height: 6px;
                    background: white;
                    border-radius: 50%;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }
                
                .orbital-dot1 {
                    animation: orbit1 20s linear infinite;
                    box-shadow: 0 0 10px 2px rgba(100, 200, 255, 0.5);
                }
                
                .orbital-dot2 {
                    animation: orbit2 30s linear infinite reverse;
                    box-shadow: 0 0 10px 2px rgba(255, 100, 255, 0.5);
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
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
                    from { transform: rotate(0deg) translateX(50px) rotate(0deg); }
                    to { transform: rotate(360deg) translateX(50px) rotate(-360deg); }
                }
                
                @keyframes orbit2 {
                    from { transform: rotate(0deg) translateX(80px) rotate(0deg); }
                    to { transform: rotate(360deg) translateX(80px) rotate(-360deg); }
                }
            `}</style>
        </div>
    )
}