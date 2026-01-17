"use client";

import { useTheme } from "@/context/ThemeContext";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AccessDenied() {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300 ${isDarkMode ? "bg-black" : "bg-white"
        }`}
    >
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className={`p-4 rounded-full ${isDarkMode ? "bg-red-500/10" : "bg-red-50"
              }`}
          >
            <AlertCircle
              className={`w-12 h-12 ${isDarkMode ? "text-red-400" : "text-red-500"
                }`}
            />
          </div>
        </div>

        {/* Title */}
        <h1
          className={`text-3xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"
            }`}
        >
          Ups, creo que no deberías de estar aquí
        </h1>

        {/* Description */}
        <p
          className={`text-sm mb-8 ${isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
        >
          No tienes permiso para acceder a esta página. Por favor, verifica tu
          rol o contacta al administrador si crees que es un error.
        </p>

        {/* Button */}
        <Link
          href="/"
          className={`inline-block px-6 py-2.5 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${isDarkMode
              ? "bg-white/10 text-white hover:bg-white/20 border border-white/20"
              : "bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300"
            }`}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
