interface StepIndicatorProps {
    currentStep: number;
    isDarkMode: boolean;
}

export function StepIndicator({ currentStep, isDarkMode }: StepIndicatorProps) {
    return (
        <div className="flex items-center justify-center gap-3 mb-8">
            <div className={`flex items-center gap-2 transition-opacity duration-300 ${currentStep === 1 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    currentStep === 1
                        ? isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                        : isDarkMode ? 'bg-white/10 text-white/60' : 'bg-black/10 text-black/60'
                }`}>1</div>
                <span className={`text-sm font-light ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Datos
                </span>
            </div>
            <div className={`flex-1 h-px max-w-[60px] transition-colors duration-300 ${
                currentStep === 2
                    ? isDarkMode ? 'bg-white/40' : 'bg-black/40'
                    : isDarkMode ? 'bg-white/10' : 'bg-black/10'
            }`}></div>
            <div className={`flex items-center gap-2 transition-opacity duration-300 ${currentStep === 2 ? 'opacity-100' : 'opacity-40'}`}>
                <span className={`text-sm font-light ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Acceso
                </span>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    currentStep === 2
                        ? isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
                        : isDarkMode ? 'bg-white/10 text-white/60' : 'bg-black/10 text-black/60'
                }`}>2</div>
            </div>
        </div>
    );
}
