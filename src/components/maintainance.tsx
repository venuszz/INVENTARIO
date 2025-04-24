"use client"
import { useState, useEffect } from 'react';
import { Wrench, ArrowLeft, Home, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface MaintenancePageProps {
    pageTitle?: string;
    maintenanceEndTime?: string; // Aquí puedes editar la hora estimada de finalización
    maintenanceReason?: string;
    showHomeButton?: boolean;
    showBackButton?: boolean;
    showCountdown?: boolean;
}

export default function MaintenancePage({
    pageTitle = "Mantenimiento",
    maintenanceEndTime = "2025-04-24T18:00:00", // EDITA AQUÍ: Formato ISO "YYYY-MM-DDTHH:MM:SS"
    maintenanceReason = "Actualización de sistemas",
    showHomeButton = true,
    showBackButton = true,
    showCountdown = true
}: MaintenancePageProps) {
    const [progress, setProgress] = useState(0);
    const [timeLeft, setTimeLeft] = useState<string>("Calculando...");
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Calcula el tiempo restante y el progreso
    useEffect(() => {
        const calculateTimeLeft = () => {
            const endTime = new Date(maintenanceEndTime).getTime();
            const now = new Date().getTime();

            setProgress(60);

            // Si ya pasó la hora de finalización
            if (now >= endTime) {
                setTimeLeft("¡El mantenimiento debería haber terminado!");
                setProgress(95); // No ponemos 100% para indicar que aún no está completamente disponible
                return;
            }

            // Calcular tiempo restante
            const diff = endTime - now;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [maintenanceEndTime]);

    const handleRefresh = () => {
        if (isRefreshing) return;

        setIsRefreshing(true);

        // Simulación de comprobación de estado
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    };

    // Formatear la hora de finalización para mostrar
    const formatEndTime = () => {
        const date = new Date(maintenanceEndTime);
        return date.toLocaleString();
    };

    return (
        <div className="bg-gray-950 text-gray-200 min-h-screen p-3 md:p-4 flex items-center justify-center">
            <div className="w-full max-w-md mx-auto bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-800">
                {/* Header */}
                <div className="bg-gray-900 p-3 border-b border-gray-800 flex items-center">
                    <div className="bg-indigo-900/30 p-1.5 rounded-md mr-2">
                        <Wrench size={16} className="text-indigo-400" />
                    </div>
                    <h1 className="text-lg font-medium">{pageTitle}</h1>
                    <div className="ml-auto flex items-center">
                        <div className="flex space-x-1">
                            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
                            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse delay-75"></div>
                            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse delay-150"></div>
                        </div>
                    </div>
                </div>

                {/* Contenido principal */}
                <div className="p-4">
                    <div className="text-center mb-4">
                        <p className="text-gray-400 text-sm mb-4">
                            Estamos realizando tareas de mantenimiento para mejorar nuestro servicio.
                            El sistema estará disponible pronto.
                        </p>

                        <div className="mb-4 text-xs">
                            <div className="flex items-center justify-center text-indigo-400 mb-1.5">
                                <AlertCircle size={14} className="mr-1.5" />
                                <span>{maintenanceReason}</span>
                            </div>
                            <div className="flex items-center justify-center text-indigo-400">
                                <Clock size={14} className="mr-1.5" />
                                <span>Finalización: {formatEndTime()}</span>
                            </div>
                        </div>

                        {showCountdown && (
                            <div className="mb-4 bg-gray-800/50 p-3 rounded-lg border border-gray-800">
                                <p className="text-xs text-gray-400 mb-1">Tiempo restante:</p>
                                <p className="text-xl font-mono">{timeLeft}</p>
                            </div>
                        )}

                        <div className="w-full bg-gray-800 rounded-full h-3 mb-1.5 overflow-hidden">
                            <div
                                className="bg-indigo-500 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500">Progreso: {progress}%</p>
                    </div>

                    <div className="flex gap-2 justify-center">
                        {showBackButton && (
                            <button
                                onClick={() => window.history.back()}
                                className="flex items-center px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors text-xs">
                                <ArrowLeft size={14} className="mr-1.5" />
                                Volver
                            </button>
                        )}

                        {showHomeButton && (
                            <Link href="/" className="flex items-center px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors text-xs">
                                <Home size={14} className="mr-1.5" />
                                Inicio
                            </Link>
                        )}

                        <button
                            onClick={handleRefresh}
                            className="flex items-center px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded-md transition-colors text-xs"
                            disabled={isRefreshing}>
                            <RefreshCw size={14} className={`mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Verificar
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-900 p-3 border-t border-gray-800 text-center text-xs text-gray-500">
                    <p>Disculpe las molestias. Gracias por su paciencia.</p>
                </div>
            </div>
        </div>
    );
}