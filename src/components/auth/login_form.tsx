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
    const [debugInfo, setDebugInfo] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const particlesRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectPath = searchParams.get('from') || '/'

    // Función para imprimir información de depuración
    const logDebug = (message: string) => {
        console.log(`[DEBUG] ${message}`)
        setDebugInfo(prev => {
            const timestamp = new Date().toISOString().split('T')[1].slice(0, 8)
            const newMessage = `${timestamp} - ${message}`
            return prev ? `${prev}\n${newMessage}` : newMessage
        })
    }

    useEffect(() => {
        setIsLoaded(true)
        logDebug(`Página cargada - Ruta de redirección: ${redirectPath}`)
        logDebug(`Entorno: ${process.env.NODE_ENV}`)

        // Revisar si hay tokens guardados
        const existingToken = Cookies.get('authToken')
        if (existingToken) {
            logDebug(`Token existente encontrado en cookies: ${existingToken.substring(0, 10)}...`)
        }

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
    }, [redirectPath])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        logDebug("Inicio de proceso de login")

        if (isLoading) {
            logDebug("Proceso ya en curso, ignorando solicitud")
            return
        }
        if (!username.trim() || !password.trim()) {
            setError('Por favor, ingresa tu nombre de usuario y contraseña')
            logDebug("Campos incompletos")
            return
        }

        setIsLoading(true)
        logDebug(`Intentando autenticar usuario: ${username}`)

        try {
            logDebug("Consultando información de usuario en Supabase")
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('email, rol')
                .eq('username', username)
                .single()

            if (userError) {
                logDebug(`Error al buscar usuario: ${userError.message}`)
                setError('Usuario o contraseña incorrectos')
                setIsLoading(false)
                return
            }

            if (!userData) {
                logDebug("No se encontraron datos de usuario")
                setError('Usuario o contraseña incorrectos')
                setIsLoading(false)
                return
            }

            logDebug(`Usuario encontrado, rol: ${userData.rol}`)
            logDebug("Iniciando sesión con email y contraseña")

            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: userData.email,
                password
            })

            if (authError) {
                logDebug(`Error de autenticación: ${authError.message}`)
                setError('Usuario o contraseña incorrectos')
                setIsLoading(false)
                return
            }

            logDebug(`Autenticación exitosa. Session ID: ${authData.session.access_token.substring(0, 10)}...`)

            // Guardar datos en cookies y localStorage
            logDebug("Guardando token en cookies")

            try {
                Cookies.set('authToken', authData.session.access_token, {
                    expires: 7,
                    path: '/',
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict'
                })

                Cookies.set('userData', JSON.stringify({
                    username: username,
                    rol: userData.rol
                }), {
                    expires: 7,
                    path: '/'
                })

                logDebug("Cookies establecidas correctamente")

                // Verificar que las cookies se guardaron
                const savedToken = Cookies.get('authToken')
                logDebug(`Cookie token guardado: ${savedToken ? 'Sí' : 'No'} - Primeros caracteres: ${savedToken ? savedToken.substring(0, 10) : 'N/A'}...`)
            } catch (cookieError) {
                logDebug(`Error al establecer cookies: ${cookieError instanceof Error ? cookieError.message : 'Error desconocido'}`)
            }

            logDebug("Guardando datos en localStorage")
            try {
                localStorage.setItem('authToken', authData.session.access_token)
                localStorage.setItem('refreshToken', authData.session.refresh_token)
                localStorage.setItem('userId', authData.user.id)
                localStorage.setItem('username', username)
                localStorage.setItem('rol', userData.rol)
                logDebug("localStorage actualizado correctamente")
            } catch (storageError) {
                logDebug(`Error al guardar en localStorage: ${storageError instanceof Error ? storageError.message : 'Error desconocido'}`)
            }

            logDebug(`Intentando redireccionar a: ${redirectPath}`)

            // Esperar un momento antes de redireccionar
            setTimeout(() => {
                logDebug(`Ejecutando redirección a ${redirectPath} después de timeout`)
                try {
                    router.push(redirectPath)
                    // También intentar con window.location como fallback
                    setTimeout(() => {
                        if (document.location.pathname === '/login') {
                            logDebug("Fallback: usando window.location.href para redireccionar")
                            window.location.href = redirectPath
                        }
                    }, 1000)
                } catch (routerError) {
                    logDebug(`Error en router.push: ${routerError instanceof Error ? routerError.message : 'Error desconocido'}`)
                    // Intento alternativo de redirección
                    try {
                        window.location.href = redirectPath
                        logDebug("Usando window.location.href como alternativa")
                    } catch (navError) {
                        logDebug(`Error también en window.location: ${navError instanceof Error ? navError.message : 'Error desconocido'}`)
                    }
                }
            }, 1000)

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
            logDebug(`Error inesperado: ${errorMessage}`)
            setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.')
            setIsLoading(false)
        }
    }

    // Función para limpiar la información de depuración
    const clearDebug = () => {
        setDebugInfo(null)
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
                                Iniciar Sesión
                            </h2>

                            <form onSubmit={handleLogin} className="space-y-6">
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
                                        className="w-full pl-12 pr-4 py-4 bg-gray-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg"
                                    />
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                                    >
                                        {isLoading ? 'Procesando...' : 'Iniciar Sesión'}
                                    </button>
                                </div>
                            </form>

                            {/* Panel de depuración (visible solo en desarrollo o con ?debug=true en URL) */}
                            {(process.env.NODE_ENV === 'development' || searchParams.get('debug') === 'true') && debugInfo && (
                                <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700 text-xs text-gray-300">
                                    <div className="flex justify-between mb-2">
                                        <h3 className="font-bold text-blue-400">Información de depuración</h3>
                                        <button
                                            onClick={clearDebug}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            Limpiar
                                        </button>
                                    </div>
                                    <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                                        {debugInfo}
                                    </pre>
                                </div>
                            )}
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