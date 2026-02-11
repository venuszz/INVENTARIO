import { User, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { RegisterFormData } from '../types';
import { motion } from 'framer-motion';

interface CredentialsStepProps {
    formData: RegisterFormData;
    isDarkMode: boolean;
    isLoading: boolean;
    showPassword: boolean;
    showConfirmPassword: boolean;
    onFieldChange: (field: keyof RegisterFormData, value: string) => void;
    onTogglePassword: () => void;
    onToggleConfirmPassword: () => void;
    onPrevStep: () => void;
}

export function CredentialsStep({
    formData,
    isDarkMode,
    isLoading,
    showPassword,
    showConfirmPassword,
    onFieldChange,
    onTogglePassword,
    onToggleConfirmPassword,
    onPrevStep
}: CredentialsStepProps) {
    return (
        <>
            <motion.div 
                className="relative"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 z-10">
                    <User className={`w-4 h-4 ${
                        isDarkMode ? 'text-white/30' : 'text-black/30'
                    }`} />
                </div>
                <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => onFieldChange('username', e.target.value)}
                    placeholder="Nombre de Usuario"
                    required
                    className={`w-full pl-11 pr-4 py-3.5 text-sm rounded-lg border focus:outline-none transition-all ${
                        isDarkMode
                            ? 'bg-transparent border-white/20 text-white placeholder-white/30 focus:border-white/40'
                            : 'bg-transparent border-black/20 text-gray-900 placeholder-black/30 focus:border-black/40'
                    }`}
                />
            </motion.div>
            <motion.div 
                className="relative"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 z-10">
                    <Lock className={`w-4 h-4 ${
                        isDarkMode ? 'text-white/30' : 'text-black/30'
                    }`} />
                </div>
                <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => onFieldChange('password', e.target.value)}
                    placeholder="Contraseña (mín. 8 caracteres)"
                    required
                    minLength={8}
                    className={`w-full pl-11 pr-11 py-3.5 text-sm rounded-lg border focus:outline-none transition-all ${
                        isDarkMode
                            ? 'bg-transparent border-white/20 text-white placeholder-white/30 focus:border-white/40'
                            : 'bg-transparent border-black/20 text-gray-900 placeholder-black/30 focus:border-black/40'
                    }`}
                />
                <button
                    type="button"
                    onClick={onTogglePassword}
                    className={`absolute right-3.5 top-1/2 transform -translate-y-1/2 focus:outline-none transition-colors ${
                        isDarkMode ? 'text-white/30 hover:text-white/50' : 'text-black/30 hover:text-black/50'
                    }`}
                    tabIndex={-1}
                >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </motion.div>
            <motion.div 
                className="relative"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 z-10">
                    <Lock className={`w-4 h-4 ${
                        isDarkMode ? 'text-white/30' : 'text-black/30'
                    }`} />
                </div>
                <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => onFieldChange('confirmPassword', e.target.value)}
                    placeholder="Confirmar Contraseña"
                    required
                    minLength={8}
                    className={`w-full pl-11 pr-11 py-3.5 text-sm rounded-lg border focus:outline-none transition-all ${
                        isDarkMode
                            ? 'bg-transparent border-white/20 text-white placeholder-white/30 focus:border-white/40'
                            : 'bg-transparent border-black/20 text-gray-900 placeholder-black/30 focus:border-black/40'
                    }`}
                />
                <button
                    type="button"
                    onClick={onToggleConfirmPassword}
                    className={`absolute right-3.5 top-1/2 transform -translate-y-1/2 focus:outline-none transition-colors ${
                        isDarkMode ? 'text-white/30 hover:text-white/50' : 'text-black/30 hover:text-black/50'
                    }`}
                    tabIndex={-1}
                >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </motion.div>
            
            {/* Role Toggle */}
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
            >
                <p className={`text-xs mb-2 ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                    Tipo de usuario
                </p>
                <div className={`flex gap-2 p-1 rounded-lg border ${
                    isDarkMode ? 'border-white/20 bg-white/5' : 'border-black/20 bg-black/5'
                }`}>
                    <motion.button
                        type="button"
                        onClick={() => onFieldChange('rol', 'usuario')}
                        className={`flex-1 py-2.5 px-4 rounded-md text-xs font-medium transition-all ${
                            formData.rol === 'usuario'
                                ? isDarkMode
                                    ? 'bg-white text-black'
                                    : 'bg-black text-white'
                                : isDarkMode
                                    ? 'text-white/60 hover:text-white'
                                    : 'text-black/60 hover:text-black'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Usuario Normal
                    </motion.button>
                    <motion.button
                        type="button"
                        onClick={() => onFieldChange('rol', 'admin')}
                        className={`flex-1 py-2.5 px-4 rounded-md text-xs font-medium transition-all ${
                            formData.rol === 'admin'
                                ? isDarkMode
                                    ? 'bg-white text-black'
                                    : 'bg-black text-white'
                                : isDarkMode
                                    ? 'text-white/60 hover:text-white'
                                    : 'text-black/60 hover:text-black'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Administrador
                    </motion.button>
                </div>
            </motion.div>

            <motion.div 
                className="grid grid-cols-2 gap-3 pt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <motion.button
                    type="button"
                    onClick={onPrevStep}
                    className={`w-full py-3 px-5 rounded-lg text-sm font-medium transition-all border ${
                        isDarkMode
                            ? 'border-white/20 text-white/60 hover:text-white hover:bg-white/5'
                            : 'border-black/20 text-black/60 hover:text-black hover:bg-black/5'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    Atrás
                </motion.button>
                <motion.button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 px-5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        isDarkMode
                            ? 'bg-white/5 text-white border border-white/20 hover:bg-white/10'
                            : 'bg-black/5 text-black border border-black/20 hover:bg-black/10'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    whileHover={{ scale: isLoading ? 1 : 1.01 }}
                    whileTap={{ scale: isLoading ? 1 : 0.99 }}
                >
                    {isLoading ? (
                        <>
                            <div className={`w-3.5 h-3.5 border-2 rounded-full animate-spin ${
                                isDarkMode ? 'border-white/30 border-t-white' : 'border-black/30 border-t-black'
                            }`}></div>
                            <span>Procesando...</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-4 h-4" />
                            Crear Cuenta
                        </>
                    )}
                </motion.button>
            </motion.div>
        </>
    );
}
