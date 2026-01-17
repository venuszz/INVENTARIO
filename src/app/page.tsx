"use client";
import { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useInactivity } from '@/context/InactivityContext';

export default function Inicio() {
  const { isDarkMode } = useTheme();
  const { isInactive } = useInactivity();
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

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

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className={`flex flex-col items-center justify-center h-screen w-full overflow-hidden relative transition-colors duration-500 ${isDarkMode ? 'bg-black' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
        }`}
    >
      {/* Clock and Date Display - Inmerso en el fondo */}
      {!isInactive && (
        <div className={`absolute top-20 left-8 z-10 transition-all duration-700 ${isDarkMode ? 'text-white/40' : 'text-gray-800/30'
          }`}>
          <div className="text-3xl font-extralight tracking-[0.3em] mb-1">
            {currentTime}
          </div>
          <div className={`text-xs capitalize font-light tracking-wider transition-colors duration-500 ${isDarkMode ? 'text-white/30' : 'text-gray-600/25'
            }`}>
            {currentDate}
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

      {/* Logo con animación */}
      <div className="relative z-20">
        <div className={`transform transition-all duration-1000 relative ${isLoaded ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
          {/* Anillo minimalista alrededor del logo */}
          {!isInactive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-[420px] h-[420px] rounded-full transition-all duration-700 ${
                isDarkMode 
                  ? 'border border-white/5' 
                  : 'border border-gray-900/5'
              }`} style={{ animation: 'rotate-slow 40s linear infinite' }}></div>
              <div className={`absolute w-[380px] h-[380px] rounded-full transition-all duration-700 ${
                isDarkMode 
                  ? 'border border-white/3' 
                  : 'border border-gray-900/3'
              }`} style={{ animation: 'rotate-slow 50s linear infinite reverse' }}></div>
            </div>
          )}
          
          <img
            src={isDarkMode ? "/images/TLAX_logo.svg" : "/images/TLAX_logo_negro.png"}
            alt="Logo ITEA"
            className="h-80 w-auto object-contain animate-float relative z-10"
            onLoad={() => setIsLoaded(true)}
          />

          {/* Mensaje de inactividad */}
          {isInactive && (
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
          )}
        </div>
      </div>

      {/* Derechos Reservados - Abajo a la izquierda */}
      <div className={`absolute bottom-8 left-8 z-20 text-[10px] tracking-widest uppercase transition-colors duration-500 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'
        }`}>
        Derechos Reservados © 2025
      </div>

      {/* Created by - Abajo a la derecha, visible solo en hover */}
      <div className={`absolute bottom-8 right-8 z-20 flex items-center gap-2 opacity-0 hover:opacity-100 transition-opacity duration-500`}>
        <span className={`text-[10px] tracking-wider transition-colors duration-500 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'
          }`}>
          Created by:
        </span>
        <img
          src={isDarkMode ? "/images/axpert-logo-white.svg" : "/images/axpert-logo-black.svg"}
          alt="Axpert"
          className="h-4 w-auto object-contain"
          onError={(e) => {
            // Fallback si no existe la imagen
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const span = document.createElement('span');
              span.className = isDarkMode ? 'text-white text-xs font-bold' : 'text-gray-900 text-xs font-bold';
              span.innerHTML = '<span style="color: #3b82f6;">A</span>|<span style="color: #8b5cf6;">X</span>pert';
              parent.appendChild(span);
            }
          }}
        />
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
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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