"use client";
import { Construction, Bell, Sparkles } from 'lucide-react';
import { useTheme } from "@/context/ThemeContext";
import { useState, useEffect } from 'react';

export default function NotificationsUnderConstruction() {
    const { isDarkMode } = useTheme();
    // Aumentamos el número de esqueletos visibles
    const [skeletons, setSkeletons] = useState<number[]>([0, 1, 2, 3, 4]);
    const MAX_SKELETONS = 5; // Definimos el máximo

    // Simular flujo constante de notificaciones (entran nuevas, salen antiguas)
    useEffect(() => {
        const interval = setInterval(() => {
            setSkeletons(prev => {
                // Genera una nueva clave (timestamp o random)
                const newKey = Date.now();
                let newSkeletons = [...prev, newKey];

                // Mantener solo los MAX_SKELETONS más recientes
                if (newSkeletons.length > MAX_SKELETONS) {
                    // Eliminar el más antiguo (el primero)
                    newSkeletons = newSkeletons.slice(newSkeletons.length - MAX_SKELETONS);
                }

                return newSkeletons;
            });
        }, 2500); // Entra una nueva cada 2.5 segundos

        return () => clearInterval(interval);
    }, []);

    const skeletonColor = isDarkMode ? 'bg-zinc-800' : 'bg-gray-200';
    const containerBg = isDarkMode ? 'bg-zinc-900' : 'bg-gray-50';
    const containerBorder = isDarkMode ? 'border-zinc-800' : 'border-gray-200';

    return (
        <div className={`w-full h-full flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}>
            {/* Header */}
            <div className={`flex items-center gap-3 p-4 border-b ${containerBorder}`}>
                <div className="relative">
                    {/* Más brillo para el icono */}
                    <div className={`absolute inset-0 blur-lg rounded-full opacity-30 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-400'}`}></div>
                    <div className={`relative p-2 rounded-lg border ${isDarkMode
                        ? 'bg-zinc-900 border-zinc-800'
                        : 'bg-gray-50 border-gray-200'
                        }`}>
                        <Bell size={18} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                        <div className="absolute -top-1 -right-1">
                            {/* Ping más visible */}
                            <span className="relative flex h-3 w-3">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-400'}`}></span>
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex-1">
                    <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Notificaciones
                    </h3>
                    <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                        Próximamente
                    </p>
                </div>
            </div>

            {/* Skeleton Notifications */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {skeletons.map((key, index) => (
                    <div
                        key={key}
                        // Animación de entrada: slide-in-from-top-4 es más notorio
                        // Animación de latido/brillo sutil en el esqueleto
                        className={`animate-in fade-in slide-in-from-top-4 duration-700 animate-notification-pulse ${containerBg} rounded-lg p-3 border ${containerBorder}`}
                        style={{
                            // Desfase para que la animación de entrada se vea más escalonada
                            animationDelay: `${index * 50}ms`,
                        }}
                    >
                        {/* Avatar skeleton */}
                        <div className="flex gap-3">
                            <div className={`w-9 h-9 rounded-full ${skeletonColor} animate-pulse flex-shrink-0`}></div>
                            <div className="flex-1 space-y-2">
                                {/* Title skeleton */}
                                <div className={`h-3 rounded w-3/4 ${skeletonColor} animate-pulse`}></div>
                                {/* Description skeleton */}
                                <div className={`h-2.5 rounded w-full ${skeletonColor} animate-pulse`}></div>
                                <div className={`h-2.5 rounded w-5/6 ${skeletonColor} animate-pulse`}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className={`p-4 border-t ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className={`flex items-center justify-center gap-2 text-xs font-medium px-3 py-2 rounded-full border ${isDarkMode
                    ? 'bg-zinc-800/50 border-zinc-700 text-zinc-400'
                    : 'bg-white border-gray-200 text-gray-600'
                    }`}>
                    <Construction size={12} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
                    <span>Centro de notificaciones en desarrollo</span>
                    <Sparkles size={12} className={`animate-spin-slow ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} /> {/* Añadimos un pequeño brillo animado */}
                </div>
                <p className={`text-xs mt-2 text-center ${isDarkMode ? 'text-zinc-600' : 'text-gray-500'}`}>
                    Pronto podrás recibir y gestionar todas tus notificaciones aquí
                </p>
            </div>
        </div>
    );
}