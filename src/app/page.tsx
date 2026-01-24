"use client";
import { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function Inicio() {
  const { isDarkMode } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [ring1Speed, setRing1Speed] = useState(45);
  const [ring2Speed, setRing2Speed] = useState(65);

  useEffect(() => {
    setIsLoaded(true);

    // Velocidades aleatorias para los anillos (entre 40 y 80 segundos)
    setRing1Speed(Math.floor(Math.random() * (80 - 40 + 1)) + 40);
    setRing2Speed(Math.floor(Math.random() * (80 - 40 + 1)) + 40);

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
      {/* Fondo de gradiente animado */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${isDarkMode ? 'bg-black opacity-80' : 'bg-white/20 opacity-60'
        }`}>
        <div className="absolute inset-0 bg-grid"></div>
      </div>

      {/* Logo con animación */}
      <div className="relative z-20">
        <div className={`transform transition-all duration-1000 relative ${isLoaded ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
          {/* Elementos dinámicos sutiles alrededor del logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Anillo exterior rotando lentamente - con espacio sin cerrar */}
            <svg 
              className="absolute w-[440px] h-[440px]"
              style={{ animation: `rotate-slow ${ring1Speed}s linear infinite` }}
            >
              <circle
                cx="220"
                cy="220"
                r="219"
                fill="none"
                stroke={isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}
                strokeWidth="1"
                strokeDasharray="1300 100"
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            
            {/* Anillo medio rotando en dirección opuesta - con espacio sin cerrar */}
            <svg 
              className="absolute w-[400px] h-[400px]"
              style={{ animation: `rotate-slow ${ring2Speed}s linear infinite reverse` }}
            >
              <circle
                cx="200"
                cy="200"
                r="199"
                fill="none"
                stroke={isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)'}
                strokeWidth="1"
                strokeDasharray="1200 100"
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            
            {/* Resplandor sutil con pulso */}
            <div 
              className={`absolute w-[360px] h-[360px] rounded-full blur-3xl ${
                isDarkMode ? 'bg-white/[0.02]' : 'bg-gray-900/[0.02]'
              }`}
              style={{ animation: 'pulse-subtle 8s ease-in-out infinite' }}
            ></div>
          </div>
          
          <img
            src={isDarkMode ? "/images/TLAX_logo.svg" : "/images/TLAX_logo_negro.png"}
            alt="Logo ITEA"
            className="h-80 w-auto object-contain animate-float relative z-10"
            onLoad={() => setIsLoaded(true)}
          />
        </div>
      </div>

      {/* Derechos Reservados - Abajo a la izquierda */}
      <div className={`absolute bottom-8 left-8 z-20 text-[10px] tracking-widest uppercase transition-colors duration-500 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'
        }`}>
        Derechos Reservados © 2026  
      </div>

      {/* Created by - Abajo a la derecha, visible solo en hover */}
      <div className={`absolute bottom-8 right-8 z-20 flex items-center gap-2 opacity-0 hover:opacity-100 transition-opacity duration-500`}>
        <span className={`text-[10px] tracking-wider transition-colors duration-500 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'
          }`}>
          Created by:
        </span>
        <img
          src={isDarkMode ? "/images/WhiteLogo.png" : "/images/BlackLogo.png"}
          alt="Axpert"
          className="h-4 w-auto object-contain"
        />
      </div>

      <style jsx>{`
        .bg-grid {
          background-image: ${isDarkMode
          ? 'linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)'
          : 'linear-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.08) 1px, transparent 1px)'
        };
          background-size: 20px 20px;
          width: 100%;
          height: 100%;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse-subtle {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(1);
          }
          50% { 
            opacity: 0.5;
            transform: scale(1.02);
          }
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