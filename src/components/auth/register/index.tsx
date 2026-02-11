"use client"

import { useTheme } from '@/context/ThemeContext';
import { useRegisterForm } from './hooks/useRegisterForm';
import { StepIndicator } from './components/StepIndicator';
import { PersonalDataStep } from './components/PersonalDataStep';
import { CredentialsStep } from './components/CredentialsStep';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

export default function RegisterForm() {
    const { isDarkMode, toggleDarkMode } = useTheme();
    const {
        step,
        formData,
        error,
        isLoading,
        showPassword,
        showConfirmPassword,
        registrationSuccess,
        setShowPassword,
        setShowConfirmPassword,
        updateField,
        handleNextStep,
        handlePrevStep,
        handleRegister
    } = useRegisterForm();

    if (registrationSuccess) {
        return (
            <div className={`h-screen flex items-center justify-center transition-colors duration-300 ${
                isDarkMode ? 'bg-black' : 'bg-white'
            }`}>
                <motion.div 
                    className="w-full max-w-md px-6"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className={`p-8 rounded-2xl border text-center ${
                        isDarkMode
                            ? 'border-white/10 bg-white/5'
                            : 'border-black/10 bg-black/5'
                    }`}>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
                                isDarkMode ? 'bg-green-500/20' : 'bg-green-500/20'
                            }`}
                        >
                            <svg 
                                className="w-8 h-8 text-green-500" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M5 13l4 4L19 7" 
                                />
                            </svg>
                        </motion.div>

                        <h2 className={`text-2xl font-light mb-3 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                            Registro Exitoso
                        </h2>
                        
                        <p className={`text-sm mb-6 ${
                            isDarkMode ? 'text-white/60' : 'text-black/60'
                        }`}>
                            Tu cuenta ha sido creada y está pendiente de aprobación por un administrador. 
                            Recibirás acceso una vez que tu solicitud sea revisada.
                        </p>

                        <a
                            href="/login"
                            className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                                isDarkMode
                                    ? 'bg-white text-black hover:bg-white/90'
                                    : 'bg-black text-white hover:bg-black/90'
                            }`}
                        >
                            Ir al inicio de sesión
                        </a>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className={`h-screen flex items-center justify-center transition-colors duration-300 ${
            isDarkMode ? 'bg-black' : 'bg-white'
        }`}>
            {/* Botón de tema */}
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
                    {/* Panel izquierdo - Logo e información */}
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
                            Registro de
                            <span className={`block ${
                                isDarkMode ? 'text-white/70' : 'text-black/70'
                            }`}>Nuevo Usuario</span>
                        </h1>
                        <p className={`text-base font-light ${
                            isDarkMode ? 'text-white/40' : 'text-black/40'
                        }`}>
                            Creación de cuentas para el sistema
                        </p>
                    </motion.div>

                    {/* Panel derecho - Formulario */}
                    <motion.div 
                        className="w-full max-w-md mx-auto lg:mx-0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <form 
                            onSubmit={step === 1 ? (e => { e.preventDefault(); handleNextStep(); }) : handleRegister} 
                            className="space-y-6"
                        >
                            <StepIndicator currentStep={step} isDarkMode={isDarkMode} />

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-2.5 rounded-lg border text-xs text-center ${
                                        isDarkMode
                                            ? 'border-red-500/20 bg-red-500/5 text-red-400'
                                            : 'border-red-500/20 bg-red-50 text-red-600'
                                    }`}
                                >
                                    {error}
                                </motion.div>
                            )}

                            {step === 1 && (
                                <PersonalDataStep
                                    formData={formData}
                                    isDarkMode={isDarkMode}
                                    onFieldChange={updateField}
                                />
                            )}

                            {step === 2 && (
                                <CredentialsStep
                                    formData={formData}
                                    isDarkMode={isDarkMode}
                                    isLoading={isLoading}
                                    showPassword={showPassword}
                                    showConfirmPassword={showConfirmPassword}
                                    onFieldChange={updateField}
                                    onTogglePassword={() => setShowPassword(v => !v)}
                                    onToggleConfirmPassword={() => setShowConfirmPassword(v => !v)}
                                    onPrevStep={handlePrevStep}
                                />
                            )}

                            <div className="text-center pt-2">
                                <p className={`text-sm ${
                                    isDarkMode ? 'text-white/40' : 'text-black/40'
                                }`}>
                                    ¿Ya tienes una cuenta?{' '}
                                    <a 
                                        href="/login" 
                                        className={`font-medium transition-colors ${
                                            isDarkMode ? 'text-white hover:text-white/80' : 'text-black hover:text-black/80'
                                        }`}
                                    >
                                        Iniciar sesión
                                    </a>
                                </p>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
