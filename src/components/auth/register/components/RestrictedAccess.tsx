import { Shield } from 'lucide-react';
import Link from 'next/link';

interface RestrictedAccessProps {
    isDarkMode: boolean;
}

export function RestrictedAccess({ isDarkMode }: RestrictedAccessProps) {
    return (
        <div className={`min-h-screen w-full flex items-center justify-center p-4 relative transition-colors duration-500 ${
            isDarkMode
                ? 'bg-black text-white'
                : 'bg-gray-50 text-gray-900'
        }`}>
            <div className={`relative z-10 w-full max-w-lg p-10 md:p-14 rounded-2xl flex flex-col items-center border ${
                isDarkMode
                    ? 'bg-[#0A0A0A] border-gray-800 shadow-2xl shadow-black'
                    : 'bg-white border-gray-200 shadow-xl shadow-gray-200/50'
            }`}>
                <div className="mb-12">
                    <img
                        src={isDarkMode ? "/images/ITEA_logo.png" : "/images/ITEA_logo_negro.svg"}
                        alt="Logo ITEA"
                        className="h-24 w-auto object-contain"
                    />
                </div>

                <div className={`mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-[0.2em] border ${
                    isDarkMode
                        ? 'bg-white/5 text-gray-400 border-white/10'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}>
                    <Shield size={12} />
                    Acceso Restringido
                </div>

                <h1 className={`text-2xl font-semibold text-center mb-4 tracking-tight ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                    Área Protegida
                </h1>

                <p className={`text-center text-sm mb-12 max-w-xs leading-relaxed ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                    Esta sección requiere permisos de administrador.
                    Si crees que esto es un error, contacta al equipo de sistemas.
                </p>

                <Link
                    href="/"
                    className={`w-full py-4 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-3 ${
                        isDarkMode
                            ? 'bg-white text-black hover:bg-gray-200'
                            : 'bg-black text-white hover:bg-gray-800'
                    }`}
                >
                    Volver al Panel Principal
                </Link>
            </div>
        </div>
    );
}
