"use client";

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Package } from 'lucide-react';

export default function NoListadoPage() {
    const { isDarkMode } = useTheme();

    return (
        <div className={`w-full h-full flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
            }`}>
            <div className={`p-8 rounded-2xl shadow-xl text-center max-w-md w-full transition-all duration-300 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                <div className={`mx-auto w-20 h-20 mb-6 rounded-full flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                    }`}>
                    <Package className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold mb-4 tracking-tight">Inventario No Listado</h1>
                <p className={`mb-8 text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    Esta sección está en construcción. Aquí podrás gestionar las consultas de bienes no listados.
                </p>
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                    Estado: Funcional ✅
                </div>
            </div>
        </div>
    );
}
