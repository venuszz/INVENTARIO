"use client";
import { useEffect, useState, useRef } from 'react';

export default function Inicio() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const particlesRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(true);

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

    const particleInterval = setInterval(() => {
      if (particlesRef.current) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        // Posición aleatoria
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;

        // Tamaño aleatorio
        const size = Math.random() * 3 + 1;

        // Velocidad aleatoria
        const speedX = (Math.random() - 0.5) * 2;
        const speedY = (Math.random() - 0.5) * 2;

        // Aplicar estilos
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.opacity = (Math.random() * 0.5 + 0.3).toString();

        // Añadir partícula al contenedor
        (particlesRef.current as HTMLDivElement).appendChild(particle);

        // Animar la partícula
        let positionX = posX;
        let positionY = posY;

        const animate = () => {
          positionX += speedX;
          positionY += speedY;

          particle.style.left = `${positionX}%`;
          particle.style.top = `${positionY}%`;

          // Eliminar si está fuera de los límites
          if (positionX < -10 || positionX > 110 || positionY < -10 || positionY > 110) {
            particle.remove();
            return;
          }

          requestAnimationFrame(animate);
        };

        animate();

        // Eliminar después de un tiempo
        setTimeout(() => {
          if (particle.parentNode === particlesRef.current) {
            particle.remove();
          }
        }, 8000);
      }
    }, 100);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
      clearInterval(particleInterval);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center h-full w-full bg-black overflow-hidden relative"
    >
      {/* Clock and Date Display */}
      <div className="absolute top-8 left-8 z-20 text-white">
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 border border-white/10 shadow-2xl">
          <div className="text-4xl font-light tracking-wider mb-1">
            {currentTime}
          </div>
          <div className="text-sm text-gray-300 capitalize">
            {currentDate}
          </div>
        </div>
      </div>

      {/* Fondo de gradiente animado */}
      <div className="absolute inset-0 bg-black opacity-80 z-0">
        <div className="absolute inset-0 bg-grid"></div>
      </div>

      {/* Efecto de ondas en el fondo */}
      <div className="absolute inset-0 z-0">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>

      {/* Sistema de partículas */}
      <div ref={particlesRef} className="absolute inset-0 overflow-hidden z-0"></div>

      {/* Efecto de luz que sigue al cursor */}
      <div
        className="absolute w-64 h-64 rounded-full pointer-events-none z-0 opacity-20 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
          transform: `translate(${mousePosition.x - 128}px, ${mousePosition.y - 128}px)`,
          transition: 'transform 0.1s ease-out'
        }}
      ></div>

      {/* Líneas de conexión */}
      <div className="absolute inset-0 bg-connections z-0"></div>

      {/* Resplandor principal */}
      <div className={`absolute rounded-full bg-white opacity-10 transform scale-100 transition-all duration-1000 w-96 h-96 blur-3xl z-0 animate-pulse`}></div>

      {/* Logo con animación */}
      <div className="relative z-10">
        <div className={`transform transition-all duration-1000 ${isLoaded ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
          <img
            src="/images/TLAX_logo.svg"
            alt="Logo ITEA"
            className="h-80 w-auto object-contain animate-float"
            onLoad={() => setIsLoaded(true)}
          />
          <p className='text-center text-gray-800 pt-2'>Powered by A|X</p>
        </div>

        {/* Círculos orbitando alrededor del logo */}
        <div className="absolute inset-0 z-0">
          <div className="orbit orbit1"></div>
          <div className="orbit orbit2"></div>
          <div className="orbit orbit3"></div>

          <div className="orbital-dot orbital-dot1"></div>
          <div className="orbital-dot orbital-dot2"></div>
          <div className="orbital-dot orbital-dot3"></div>
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
      `}</style>
    </div>
  );
}