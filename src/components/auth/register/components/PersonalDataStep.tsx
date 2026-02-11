import { UserCircle, Users, ChevronRight } from 'lucide-react';
import { RegisterFormData } from '../types';
import { motion } from 'framer-motion';

interface PersonalDataStepProps {
    formData: RegisterFormData;
    isDarkMode: boolean;
    onFieldChange: (field: keyof RegisterFormData, value: string) => void;
}

export function PersonalDataStep({ formData, isDarkMode, onFieldChange }: PersonalDataStepProps) {
    return (
        <>
            <motion.div 
                className="relative"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 z-10">
                    <UserCircle className={`w-4 h-4 ${
                        isDarkMode ? 'text-white/30' : 'text-black/30'
                    }`} />
                </div>
                <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => onFieldChange('firstName', e.target.value)}
                    placeholder="Nombre(s)"
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
                    <Users className={`w-4 h-4 ${
                        isDarkMode ? 'text-white/30' : 'text-black/30'
                    }`} />
                </div>
                <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => onFieldChange('lastName', e.target.value)}
                    placeholder="Apellido(s)"
                    required
                    className={`w-full pl-11 pr-4 py-3.5 text-sm rounded-lg border focus:outline-none transition-all ${
                        isDarkMode
                            ? 'bg-transparent border-white/20 text-white placeholder-white/30 focus:border-white/40'
                            : 'bg-transparent border-black/20 text-gray-900 placeholder-black/30 focus:border-black/40'
                    }`}
                />
            </motion.div>
            <motion.button 
                type="submit" 
                className={`w-full py-3 px-5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    isDarkMode
                        ? 'bg-white/5 text-white border border-white/20 hover:bg-white/10'
                        : 'bg-black/5 text-black border border-black/20 hover:bg-black/10'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                Continuar
                <ChevronRight className="w-4 h-4" />
            </motion.button>
        </>
    );
}
