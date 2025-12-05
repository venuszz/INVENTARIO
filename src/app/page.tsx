"use client";
import { useEffect, useState, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useInactivity } from '@/context/InactivityContext';
import GravityBackground from '@/components/GravityBackground';
import { Sparkles } from 'lucide-react';

export default function Inicio() {
  const { isDarkMode } = useTheme();
  const { isInactive } = useInactivity();
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isGravityEnabled, setIsGravityEnabled] = useState(true);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cargar configuración al iniciar
  useEffect(() => {
    const saved = localStorage.getItem('gravityEnabled');
    if (saved !== null) {
      setIsGravityEnabled(saved === 'true');
    }
    setIsConfigLoaded(true);
  }, []);

  // Guardar configuración solo cuando haya cambiado y ya esté cargada
  useEffect(() => {
    if (isConfigLoaded) {
      localStorage.setItem('gravityEnabled', String(isGravityEnabled));
    }
  }, [isGravityEnabled, isConfigLoaded]);

  useEffect(() => {
    setIsLoaded(true);

    // Muestra la hora y fecha actual
    const updateDateTime = () => {
      const now = new Date();

      // Format time in 12-hour format with AM/PM
      setCurrentTime(now.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));

      // Format date in Spanish
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      };
      setCurrentDate(now.toLocaleDateString('es-MX', options));
    };

    // Update immediately and then every second
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center justify-center h-screen w-full overflow-hidden relative transition-colors duration-500 ${isDarkMode ? 'bg-black' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
        }`}
    >
      {/* Clock and Date Display - Solo visible cuando NO hay inactividad */}
      {!isInactive && (
        <div className={`absolute top-20 left-8 z-20 transition-all duration-500 ${isDarkMode ? 'text-white' : 'text-gray-800'
          } animate-in fade-in-0 slide-in-from-left-4 duration-700`}>
          <div className={`relative group backdrop-blur-sm rounded-xl p-4 shadow-2xl transition-all duration-500 ${isDarkMode
            ? 'bg-black/5 border border-white/5'
            : 'bg-white/5 border border-white/10'
            }`}>

            {/* Botón sutil para activar/desactivar efectos */}
            <button
              onClick={() => setIsGravityEnabled(!isGravityEnabled)}
              className={`absolute top-2 right-2 p-1.5 rounded-full transition-all duration-500 opacity-0 group-hover:opacity-100 ${isGravityEnabled
                ? (isDarkMode ? 'text-blue-400 bg-white/10' : 'text-blue-600 bg-black/5')
                : 'text-gray-400 hover:bg-gray-500/10'
                }`}
              title={isGravityEnabled ? "Desactivar efectos" : "Activar efectos"}
            >
              <Sparkles size={12} className={isGravityEnabled ? 'fill-current' : ''} />
            </button>

            <div className="text-4xl font-light tracking-wider mb-1">
              {currentTime}
            </div>
            <div className={`text-sm capitalize transition-colors duration-500 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
              {currentDate}
            </div>
          </div>
        </div>
      )}

      {/* Fondo de gradiente animado */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${isDarkMode ? 'bg-black opacity-80' : 'bg-white/20 opacity-60'
        }`}>
        <div className="absolute inset-0 bg-grid"></div>
      </div>

      {/* Efecto de ondas en el fondo */}
      <div className="absolute inset-0 z-0">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>

      {/* Sistema de partículas (GravityBackground) */}
      {isGravityEnabled && <GravityBackground />}

      {/* Efecto de luz que sigue al cursor */}
      <div
        className={`absolute w-64 h-64 rounded-full pointer-events-none z-0 blur-3xl transition-opacity duration-500 ${isDarkMode ? 'opacity-20' : 'opacity-30'
          }`}
        style={{
          background: isDarkMode
            ? 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)'
            : 'radial-gradient(circle, rgba(59,130,246,0.6) 0%, rgba(59,130,246,0) 70%)',
          transform: `translate(${mousePosition.x - 128}px, ${mousePosition.y - 128}px)`,
          transition: 'transform 0.1s ease-out'
        }}
      ></div>

      {/* Líneas de conexión */}
      <div className="absolute inset-0 bg-connections z-0"></div>

      {/* Resplandor principal */}
      <div className={`absolute rounded-full transform scale-100 transition-all duration-1000 w-96 h-96 blur-3xl z-10 animate-pulse ${isDarkMode ? 'bg-white opacity-10' : 'bg-gray-400 opacity-30'
        }`}></div>

      {/* Logo con animación */}
      <div className="relative z-20">
        <div className={`transform transition-all duration-1000 ${isLoaded ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
          <img
            src={isDarkMode ? "/images/TLAX_logo.svg" : "/images/TLAX_logo_negro.png"}
            alt="Logo ITEA"
            className="h-80 w-auto object-contain animate-float"
            onLoad={() => setIsLoaded(true)}
          />

          {/* Mensaje de inactividad */}
          {isInactive ? (
            <div className="text-center pt-8 animate-in fade-in-0 zoom-in-95 duration-700">
              <div className="relative inline-block px-8 py-4">
                <p className={`relative text-3xl font-medium tracking-wide transition-colors duration-500 ${isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                  <span className="animate-text-shimmer bg-gradient-to-r from-current via-current to-current bg-[length:200%_100%] bg-clip-text">
                    Esperando Interacción A|X
                  </span>
                </p>

                {/* Indicador de pulso debajo */}
                <div className="flex justify-center mt-4 space-x-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse-scale ${isDarkMode ? 'bg-white' : 'bg-gray-900'
                    }`} style={{ animationDelay: '0ms' }}></div>
                  <div className={`w-2 h-2 rounded-full animate-pulse-scale ${isDarkMode ? 'bg-white' : 'bg-gray-900'
                    }`} style={{ animationDelay: '200ms' }}></div>
                  <div className={`w-2 h-2 rounded-full animate-pulse-scale ${isDarkMode ? 'bg-white' : 'bg-gray-900'
                    }`} style={{ animationDelay: '400ms' }}></div>
                </div>
              </div>
            </div>
          ) : (
            <p className={`text-center pt-2 transition-colors duration-500 ${isDarkMode ? 'text-gray-800' : 'text-white/30'
              }`}>Derechos Reservados ©2025</p>
          )}
        </div>

        {/* Círculos orbitando alrededor del logo - Solo visible cuando NO hay inactividad */}
        {!isInactive && (
          <div className="absolute inset-0 z-0 animate-in fade-in-0 duration-1000">
            <div className="orbit orbit1"></div>
            <div className="orbit orbit2"></div>
            <div className="orbit orbit3"></div>

            <div className="orbital-dot orbital-dot1"></div>
            <div className="orbital-dot orbital-dot2"></div>
            <div className="orbital-dot orbital-dot3"></div>
          </div>
        )}
      </div>

      <style jsx>{`
        .bg-grid {
          background-image: ${isDarkMode
          ? 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)'
          : 'linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)'
        };
          background-size: 20px 20px;
          width: 100%;
          height: 100%;
        }
        
        .bg-connections {
          background-image: ${isDarkMode
          ? 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px), radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)'
          : 'radial-gradient(rgba(59, 130, 246, 0.2) 1px, transparent 1px), radial-gradient(rgba(59, 130, 246, 0.15) 1px, transparent 1px)'
        };
          background-size: 40px 40px, 20px 20px;
          background-position: 0 0, 10px 10px;
        }
        
        .wave {
          position: absolute;
          width: 200%;
          height: 200%;
          left: -50%;
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(59, 130, 246, 0.05)'};
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
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(59, 130, 246, 0.2)'};
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }
        
        .orbit1 {
          width: 300px;
          height: 300px;
          animation: spin 20s linear infinite;
        }
        
        .orbit2 {
          width: 400px;
          height: 400px;
          animation: spin 25s linear infinite reverse;
        }
        
        .orbit3 {
          width: 500px;
          height: 500px;
          animation: spin 30s linear infinite;
        }
        
        .orbital-dot {
          position: absolute;
          width: 6px;
          height: 6px;
          background: ${isDarkMode ? 'white' : '#3b82f6'};
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
          animation: orbit2 25s linear infinite reverse;
          box-shadow: 0 0 10px 2px rgba(255, 100, 255, 0.5);
        }
        
        .orbital-dot3 {
          animation: orbit3 30s linear infinite;
          box-shadow: 0 0 10px 2px rgba(100, 255, 200, 0.5);
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
          from { transform: rotate(0deg) translateX(150px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(150px) rotate(-360deg); }
        }
        
        @keyframes orbit2 {
          from { transform: rotate(0deg) translateX(200px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(200px) rotate(-360deg); }
        }
        
        @keyframes orbit3 {
          from { transform: rotate(0deg) translateX(250px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(250px) rotate(-360deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes bounce-dot {
          0%, 80%, 100% { 
            transform: translateY(0);
            opacity: 0.5;
          }
          40% { 
            transform: translateY(-12px);
            opacity: 1;
          }
        }
        
        .animate-bounce-dot {
          display: inline-block;
          animation: bounce-dot 1.4s infinite ease-in-out;
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.3;
            transform: translateX(-100%);
          }
          50% {
            opacity: 0.8;
            transform: translateX(100%);
          }
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 3s infinite ease-in-out;
        }
        
        @keyframes text-shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        
        .animate-text-shimmer {
          animation: text-shimmer 3s linear infinite;
        }
        
        @keyframes pulse-scale {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.5);
            opacity: 1;
          }
        }
        
        .animate-pulse-scale {
          animation: pulse-scale 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}