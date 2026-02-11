"use client"

import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface SSOButtonProps {
    onError?: (error: string) => void;
    disabled?: boolean;
    ssoUrl?: string;
}

export default function SSOButton({ onError, disabled = false, ssoUrl }: SSOButtonProps) {
    const { isDarkMode } = useTheme();
    const [isLoading, setIsLoading] = useState(false);

    const handleSSOClick = async () => {
        setIsLoading(true);
        try {
            const url = ssoUrl || process.env.NEXT_PUBLIC_SSO_URL;
            if (!url) {
                throw new Error('SSO URL no configurada');
            }
            window.location.href = url;
        } catch (err) {
            console.error('Error iniciando SSO:', err);
            setIsLoading(false);
            if (onError) {
                onError(err instanceof Error ? err.message : 'Error iniciando SSO');
            }
        }
    };

    return (
        <button
            type="button"
            onClick={handleSSOClick}
            disabled={disabled || isLoading}
            className={`group relative w-full py-3 px-5 rounded-lg font-medium transition-all duration-700 flex items-center justify-between overflow-hidden transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border ${
                isDarkMode
                    ? 'bg-neutral-100 border-white text-black hover:text-white hover:border-neutral-800'
                    : 'bg-black border-black text-white hover:text-black hover:border-neutral-200'
            }`}
        >
            <div className="relative z-10 flex items-center text-sm">
                <span className="opacity-80">Acceder con</span>
                <span className="ml-2 font-bold tracking-tight">AXpert</span>
            </div>

            <div className="relative z-10 h-6 flex items-center">
                {/* Logo Container with enhanced crossfade */}
                {isDarkMode ? (
                    <>
                        {/* Dark Mode: Start White bg (Black Logo) -> Hover Dark bg (White Logo) */}
                        <img
                            src="/images/BlackLogo.png"
                            alt="AXpert"
                            className="h-6 w-auto object-contain transition-all duration-500 group-hover:opacity-0 group-hover:scale-90"
                        />
                        <img
                            src="/images/WhiteLogo.png"
                            alt="AXpert"
                            className="h-6 w-auto object-contain absolute right-0 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-110"
                        />
                    </>
                ) : (
                    <>
                        {/* Light Mode: Start Black bg (White Logo) -> Hover White bg (Black Logo) */}
                        <img
                            src="/images/WhiteLogo.png"
                            alt="AXpert"
                            className="h-6 w-auto object-contain transition-all duration-500 group-hover:opacity-0 group-hover:scale-90"
                        />
                        <img
                            src="/images/BlackLogo.png"
                            alt="AXpert"
                            className="h-6 w-auto object-contain absolute right-0 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-110"
                        />
                    </>
                )}
            </div>

            {/* Premium Background Reveal Animation (Inverts based on mode) */}
            <div
                className={`absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-in-out ${
                    isDarkMode ? 'bg-black' : 'bg-white'
                }`}
            ></div>

            {/* Subtle Glow Effect */}
            <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${
                    isDarkMode
                        ? 'bg-gradient-to-r from-transparent via-white/5 to-transparent'
                        : 'bg-gradient-to-r from-transparent via-black/5 to-transparent'
                }`}
            ></div>
        </button>
    );
}
