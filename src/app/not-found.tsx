"use client"

import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect } from 'react';

export default function NotFound() {
    const { isDarkMode, toggleDarkMode } = useTheme();

    useEffect(() => {
        // Ocultar Header e IndexationPopover
        const headerContainer = document.querySelector('.header-container') as HTMLElement;
        const indexationContainer = document.querySelector('.indexation-popover-container') as HTMLElement;
        const mainElement = document.querySelector('main') as HTMLElement;
        
        if (headerContainer) headerContainer.style.display = 'none';
        if (indexationContainer) indexationContainer.style.display = 'none';
        if (mainElement) {
            mainElement.style.flex = 'none';
            mainElement.style.overflow = 'visible';
        }

        return () => {
            if (headerContainer) headerContainer.style.display = '';
            if (indexationContainer) indexationContainer.style.display = '';
            if (mainElement) {
                mainElement.style.flex = '';
                mainElement.style.overflow = '';
            }
        };
    }, []);

    return (
        <div className={`fixed inset-0 flex items-center justify-center transition-colors duration-300 ${
            isDarkMode ? 'bg-black' : 'bg-white'
        }`}>
            <button
                onClick={toggleDarkMode}
                className={`fixed top-6 right-6 z-50 p-2.5 rounded-lg transition-all duration-200 ${
                    isDarkMode
                        ? 'text-white/60 hover:text-white'
                        : 'text-black/60 hover:text-black'
                }`}
                aria-label="Cambiar modo de color"
            >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="w-full max-w-5xl px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <motion.div 
                        className="text-center lg:text-left"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center justify-center lg:justify-start mb-12">
                            <img
                                src={isDarkMode ? "/images/ITEA_logo.png" : "/images/ITEA_logo_negro.svg"}
                                alt="Logo ITEA"
                                className="h-24 w-auto object-contain"
                            />
                        </div>

                        <h1 className={`text-5xl lg:text-6xl font-light mb-3 tracking-tight ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                            Página
                            <span className={`block ${
                                isDarkMode ? 'text-white/70' : 'text-black/70'
                            }`}>No Encontrada</span>
                        </h1>
                        <p className={`text-base font-light ${
                            isDarkMode ? 'text-white/40' : 'text-black/40'
                        }`}>
                            Error 404
                        </p>
                    </motion.div>

                    <motion.div 
                        className="w-full max-w-md mx-auto lg:mx-0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <div className="text-center space-y-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                                className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
                                    isDarkMode ? 'bg-white/10' : 'bg-black/10'
                                }`}
                            >
                                <span className={`text-4xl font-light ${
                                    isDarkMode ? 'text-white/60' : 'text-black/60'
                                }`}>
                                    404
                                </span>
                            </motion.div>

                            <div>
                                <h2 className={`text-2xl font-light mb-2 ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                    Página No Encontrada
                                </h2>
                                
                                <p className={`text-sm ${
                                    isDarkMode ? 'text-white/60' : 'text-black/60'
                                }`}>
                                    La página que buscas no existe o ha sido movida.
                                </p>
                            </div>

                            <Link
                                href="/"
                                className={`inline-flex items-center gap-2 py-3 px-5 rounded-lg text-sm font-medium transition-all border ${
                                    isDarkMode
                                        ? 'bg-white text-black border-white hover:bg-white/90'
                                        : 'bg-black text-white border-black hover:bg-black/90'
                                }`}
                            >
                                <Home className="w-3.5 h-3.5" />
                                <span>Volver al inicio</span>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
