"use client"

import { useState, useEffect, useRef } from 'react'
import supabase from '@/app/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, Lock } from 'lucide-react'
import Cookies from 'js-cookie'

export default function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const particlesRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectPath = searchParams.get('from') || '/'
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
    }, [redirectPath, isMobile])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        if (isLoading) {
            return
        }
        if (!username.trim() || !password.trim()) {
            setError('Por favor, ingresa tu nombre de usuario y contraseña')
            return
        }

        setIsLoading(true)

        try {
            // Primero obtenemos los datos completos del usuario
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('email, rol, first_name, last_name')
                .eq('username', username)
                .single()

            if (userError) {
                setError('Usuario o contraseña incorrectos')
                setIsLoading(false)
                return
            }

            if (!userData) {
                setError('Usuario o contraseña incorrectos')
                setIsLoading(false)
                return
            }

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: userData.email,
                password
            })

            if (authError) {
                setError('Usuario o contraseña incorrectos')
                setIsLoading(false)
                return
            }

            try {
                // Set cookie to expire in 30 minutes
                const expires = new Date(Date.now() + 30 * 60 * 1000);
                Cookies.set('authToken', authData.session.access_token, {
                    expires,
                    path: '/',
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict'
                });

                // Guardar información extendida del usuario en la cookie
                Cookies.set('userData', JSON.stringify({
                    username: username,
                    firstName: userData.first_name,
                    lastName: userData.last_name,
                    rol: userData.rol
                }), {
                    expires,
                    path: '/'
                });

                // Esperar un momento antes de redireccionar
                setTimeout(() => {
                    try {
                        router.push(redirectPath)
                        // También intentar con window.location como fallback
                        setTimeout(() => {
                            if (document.location.pathname === '/login') {
                                window.location.href = redirectPath
                            }
                        }, 1000)
                    } catch {
                        // Intento alternativo de redirección
                        try {
                            window.location.href = redirectPath
                        } catch {
                            // No se pudo redirigir
                        }
                    }
                }, 1000)
            } catch {
                setIsLoading(false)
            }
        } catch {
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
                                <div className="flex justify-center mb-6">
                                    <img
                                        src="/images/ITEA_logo.png"
                                        alt="Logo Gobierno"
                                        className="h-20 w-auto object-contain"
                                    />
                                </div>
                            )}

                            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 text-center">
                                Iniciar Sesión
                            </h2>

                            <form onSubmit={handleLogin} className="space-y-4 md:space-y-6">
                                {error && (
                                    <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-lg text-center text-sm md:text-base">
                                        {error}
                                    </div>
                                )}

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
                                        className="w-full pl-10 pr-4 py-3 md:py-4 bg-gray-800 text-white rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-base"
                                    />
                                </div>

                                <div className="pt-2 md:pt-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-blue-600 text-white py-3 md:py-4 rounded-lg md:rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-base"
                                    >
                                        {isLoading ? 'Procesando...' : 'Iniciar Sesión'}
                                    </button>
                                </div>

                                <div className="text-center mt-4 md:mt-6">
                                    <p className="text-gray-400 text-sm md:text-base">
                                        ¿No tiene una cuenta?
                                        <a
                                            href="/register"
                                            className="text-blue-400 ml-2 hover:underline"
                                        >
                                            Registrarse
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
    )
}