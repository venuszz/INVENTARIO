"use client"
import { useState, useEffect } from 'react';
import { Wrench, ArrowLeft, Home, RefreshCw, Clock, AlertCircle, Server } from 'lucide-react';
import Link from 'next/link';

interface MaintenancePageProps {
    pageTitle?: string;
    maintenanceEndTime?: string;
    maintenanceReason?: string;
    showHomeButton?: boolean;
    showBackButton?: boolean;
    showCountdown?: boolean;
}

export default function MaintenancePage({
    pageTitle = "Mantenimiento Programado",
    maintenanceEndTime = "2025-05-19T17:10:00",
    maintenanceReason = "Actualización de base de Datos",
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
            const startTime = now - (1000 * 60 * 60 * 2); // Asumimos 2 horas de mantenimiento

            // Calcular progreso basado en tiempo transcurrido
            const totalDuration = endTime - startTime;
            const elapsed = now - startTime;
            const calculatedProgress = Math.min(Math.floor((elapsed / totalDuration) * 100), 95);

            setProgress(calculatedProgress);

            // Si ya pasó la hora de finalización
            if (now >= endTime) {
                setTimeLeft("¡El mantenimiento debería haber terminado!");
                setProgress(95);
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
        <div className="bg-black text-gray-300 min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-4xl mx-auto bg-black border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
                {/* Header - más bajo y horizontal */}
                <div className="bg-black border-b border-gray-800 p-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="bg-gray-900 p-2 rounded-lg mr-3">
                            <Wrench size={20} className="text-gray-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-white">{pageTitle}</h1>
                            <p className="text-gray-500 text-xs">Sistema en mantenimiento</p>
                        </div>
                    </div>
                    <div className="flex space-x-1.5">
                        <div className="h-2 w-2 rounded-full bg-gray-500 animate-pulse"></div>
                        <div className="h-2 w-2 rounded-full bg-gray-500 animate-pulse delay-75"></div>
                        <div className="h-2 w-2 rounded-full bg-gray-500 animate-pulse delay-150"></div>
                    </div>
                </div>

                {/* Contenido principal - Layout horizontal */}
                <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        {/* Lado izquierdo - Progreso circular */}
                        <div className="w-full md:w-1/4 flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <Server size={24} className="mx-auto text-gray-500 mb-1" />
                                        <p className="text-lg font-semibold text-white">{progress}%</p>
                                    </div>
                                </div>
                                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                                    <circle
                                        className="text-gray-800"
                                        strokeWidth="8"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="42"
                                        cx="50"
                                        cy="50"
                                    />
                                    <circle
                                        className="text-gray-500"
                                        strokeWidth="8"
                                        strokeDasharray={264}
                                        strokeDashoffset={264 - (progress / 100 * 264)}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="42"
                                        cx="50"
                                        cy="50"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Lado derecho - Información y controles */}
                        <div className="w-full md:w-3/4">
                            <div className="text-left mb-6">
                                <p className="text-gray-400 mb-6">
                                    Estamos realizando tareas de mantenimiento para mejorar la calidad y el rendimiento
                                    de nuestro servicio. El sistema estará disponible muy pronto.
                                </p>

                                <div className="flex flex-wrap gap-4 mb-6">
                                    <div className="flex-1 min-w-[200px] bg-gray-900 p-3 rounded-lg border border-gray-800 flex items-center">
                                        <div className="bg-gray-800 p-2 rounded-lg mr-3">
                                            <AlertCircle size={18} className="text-gray-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Razón</p>
                                            <p className="text-sm text-gray-300">{maintenanceReason}</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-[200px] bg-gray-900 p-3 rounded-lg border border-gray-800 flex items-center">
                                        <div className="bg-gray-800 p-2 rounded-lg mr-3">
                                            <Clock size={18} className="text-gray-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Finalización</p>
                                            <p className="text-sm text-gray-300">{formatEndTime()}</p>
                                        </div>
                                    </div>
                                </div>

                                {showCountdown && (
                                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 mb-6">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Tiempo restante</p>
                                        <p className="text-2xl font-mono font-bold text-white">{timeLeft}</p>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {showBackButton && (
                                        <button
                                            onClick={() => window.history.back()}
                                            className="flex items-center px-3 py-2 bg-gray-900 hover:bg-gray-800 rounded-md transition-all text-xs font-medium border border-gray-800 group">
                                            <ArrowLeft size={14} className="mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
                                            Volver
                                        </button>
                                    )}

                                    {showHomeButton && (
                                        <Link href="/" className="flex items-center px-3 py-2 bg-gray-900 hover:bg-gray-800 rounded-md transition-all text-xs font-medium border border-gray-800 group">
                                            <Home size={14} className="mr-1.5 group-hover:scale-110 transition-transform" />
                                            Inicio
                                        </Link>
                                    )}

                                    <button
                                        onClick={handleRefresh}
                                        className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-all text-xs font-medium border border-gray-700"
                                        disabled={isRefreshing}>
                                        <RefreshCw size={14} className={`mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                                        Verificar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-black p-3 border-t border-gray-900 text-center">
                    <p className="text-xs text-gray-600">Disculpe las molestias. Gracias por su paciencia.</p>
                </div>
            </div>
        </div>
    );
}