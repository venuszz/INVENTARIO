"use client"
import { useState, useEffect } from 'react';
import { Construction, ArrowLeft, Home, RefreshCw, Coffee } from 'lucide-react';
import Link from 'next/link';

interface UnderConstructionProps {
    pageTitle?: string;
    estimatedCompletion?: string;
    showHomeButton?: boolean;
    showBackButton?: boolean;
}

export default function UnderConstructionPage({
    pageTitle = "Página en Desarrollo",
    estimatedCompletion = "Próximamente",
    showHomeButton = true,
    showBackButton = true
}: UnderConstructionProps) {
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // Simulación de progreso
        const interval = setInterval(() => {
            setLoadingProgress(prev => {
                if (prev >= 30) {
                    clearInterval(interval);
                    return 30; // Limita el progreso al 30% para indicar que está en construcción
                }
                return prev + 1;
            });
        }, 50);

        return () => clearInterval(interval);
    }, []);

    const startAnimation = () => {
        if (isAnimating) return;

        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1500);

        // Restablece el progreso y comienza de nuevo
        setLoadingProgress(0);
        const interval = setInterval(() => {
            setLoadingProgress(prev => {
                if (prev >= 30) {
                    clearInterval(interval);
                    return 30;
                }
                return prev + 1;
            });
        }, 50);

        setTimeout(() => clearInterval(interval), 1500);
    };

    return (
        <div className="bg-black text-white min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 flex flex-col">
            <div className="w-full mx-auto bg-black rounded-lg sm:rounded-xl shadow-2xl overflow-hidden transition-all duration-500 transform border border-gray-800 flex-grow flex flex-col">
                {/* Header con título */}
                <div className="bg-black p-4 sm:p-6 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
                        <span className="mr-2 sm:mr-3 bg-gray-900 text-white p-1 sm:p-2 rounded-lg border border-gray-700 text-sm sm:text-base">404</span>
                        {pageTitle}
                    </h1>
                </div>

                {/* Contenido principal */}
                <div className="px-2 sm:px-4 md:px-6 py-6 sm:py-10 flex-grow flex flex-col items-center justify-center">
                    <div className={`mb-8 p-6 relative ${isAnimating ? 'animate-bounce' : ''}`}>
                        <Construction size={80} className="text-yellow-500" />
                        <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                            {estimatedCompletion}
                        </div>
                    </div>

                    <div className="text-center mb-8 max-w-lg">
                        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Estamos trabajando en esta sección</h2>
                        <p className="text-gray-400 mb-6">
                            Esta página está actualmente en desarrollo. Nuestro equipo está trabajando para implementar
                            todas las funcionalidades necesarias y proporcionar la mejor experiencia posible.
                        </p>

                        <div className="w-full bg-gray-800 rounded-full h-4 mb-2 overflow-hidden">
                            <div
                                className="bg-yellow-500 h-4 rounded-full transition-all duration-300"
                                style={{ width: `${loadingProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-500">Progreso estimado: {loadingProgress}%</p>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-center">
                        {showBackButton && (
                            <button
                                onClick={() => window.history.back()}
                                className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm">
                                <ArrowLeft size={16} className="mr-2" />
                                Regresar
                            </button>
                        )}

                        {showHomeButton && (
                            <Link href="/" className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm">
                                <Home size={16} className="mr-2" />
                                Ir al inicio
                            </Link>
                        )}

                        <button
                            onClick={startAnimation}
                            className="flex items-center px-4 py-2 bg-yellow-700 hover:bg-yellow-600 rounded-lg transition-colors text-sm"
                            disabled={isAnimating}>
                            <RefreshCw size={16} className={`mr-2 ${isAnimating ? 'animate-spin' : ''}`} />
                            Verificar progreso
                        </button>

                        <Link href="#" className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm">
                            <Coffee size={16} className="mr-2" />
                            Reportar problema
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-black p-4 border-t border-gray-800 text-center text-sm text-gray-500">
                    <p>Si necesitas acceso inmediato a esta funcionalidad, por favor contacta al equipo de desarrollo.</p>
                </div>
            </div>

            {/* Estilos CSS adicionales */}
            <style jsx>{`
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }
        
        .animate-bounce {
        animation: bounce 0.5s ease infinite;
        }
    `}</style>
        </div>
    );
}