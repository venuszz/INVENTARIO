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
    pageTitle = "Sitio en Mantenimiento",
    maintenanceEndTime = "2025-04-24T18:30:00", // EDITA AQUÍ: Formato ISO "YYYY-MM-DDTHH:MM:SS"
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
            const totalDuration = 3 * 60 * 60 * 1000; // Asumimos 3 horas de mantenimiento total
            const elapsed = totalDuration - (endTime - now);

            // Calcular progreso (0-100%)
            const calculatedProgress = Math.min(Math.max(Math.floor((elapsed / totalDuration) * 100), 5), 95);
            setProgress(calculatedProgress);

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
        <div className="bg-slate-900 text-white min-h-screen p-2 sm:p-4 md:p-6 lg:p-8 flex flex-col">
            <div className="w-full mx-auto bg-slate-800 rounded-lg sm:rounded-xl shadow-2xl overflow-hidden transition-all duration-500 transform border border-slate-700 flex-grow flex flex-col">
                {/* Header con título */}
                <div className="bg-slate-800 p-4 sm:p-6 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center">
                        <span className="mr-2 sm:mr-3 bg-amber-600 text-white p-1 sm:p-2 rounded-lg text-sm sm:text-base">
                            <AlertCircle size={20} />
                        </span>
                        {pageTitle}
                    </h1>
                </div>

                {/* Contenido principal */}
                <div className="px-4 sm:px-6 md:px-8 py-8 sm:py-12 flex-grow flex flex-col items-center justify-center">
                    <div className="mb-8 p-6 relative">
                        <div className="relative">
                            <Wrench size={80} className="text-amber-500" />
                            <div className="absolute -top-1 -right-1 animate-ping rounded-full h-3 w-3 bg-amber-400"></div>
                        </div>
                    </div>

                    <div className="text-center mb-8 max-w-lg">
                        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Mantenimiento en Progreso</h2>
                        <p className="text-slate-300 mb-6">
                            Estamos realizando tareas de mantenimiento para mejorar nuestro servicio.
                            El sistema estará disponible pronto. Gracias por tu paciencia.
                        </p>

                        <div className="mb-6">
                            <div className="flex items-center justify-center text-amber-400 mb-2">
                                <Clock size={20} className="mr-2" />
                                <span className="font-medium">Motivo: {maintenanceReason}</span>
                            </div>
                            <div className="flex items-center justify-center text-amber-400">
                                <Clock size={20} className="mr-2" />
                                <span className="font-medium">Finalización estimada: {formatEndTime()}</span>
                            </div>
                        </div>

                        {showCountdown && (
                            <div className="mb-6 bg-slate-700 p-4 rounded-lg border border-slate-600">
                                <p className="text-sm text-slate-300 mb-1">Tiempo restante estimado:</p>
                                <p className="text-2xl font-mono">{timeLeft}</p>
                            </div>
                        )}

                        <div className="w-full bg-slate-700 rounded-full h-6 mb-2 overflow-hidden">
                            <div
                                className="bg-amber-500 h-6 rounded-full transition-all duration-300 flex items-center justify-center text-xs font-bold text-slate-900"
                                style={{ width: `${progress}%` }}
                            >
                                {progress}%
                            </div>
                        </div>
                        <p className="text-sm text-slate-400">Progreso estimado del mantenimiento</p>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-center">
                        {showBackButton && (
                            <button
                                onClick={() => window.history.back()}
                                className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm">
                                <ArrowLeft size={16} className="mr-2" />
                                Regresar
                            </button>
                        )}

                        {showHomeButton && (
                            <Link href="/" className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm">
                                <Home size={16} className="mr-2" />
                                Página alternativa
                            </Link>
                        )}

                        <button
                            onClick={handleRefresh}
                            className="flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors text-sm"
                            disabled={isRefreshing}>
                            <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Intentar acceder
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-800 p-4 border-t border-slate-700 text-center text-sm text-slate-400">
                    <p>Para más información sobre este mantenimiento, contacta al equipo de soporte técnico.</p>
                </div>
            </div>
        </div>
    );
}