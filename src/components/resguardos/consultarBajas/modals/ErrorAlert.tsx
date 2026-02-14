import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  error: string | null;
  onClose: () => void;
  isDarkMode: boolean;
}

/**
 * Error alert component
 * Displays error messages in a fixed bottom-right position
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onClose,
  isDarkMode
}) => {
  if (!error) return null;

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 rounded-lg border z-50 backdrop-blur-xl ${
      isDarkMode 
        ? 'bg-red-500/10 border-red-500/30' 
        : 'bg-red-50 border-red-200'
    }`}>
      <div className="p-4 flex items-start gap-3">
        <div className={`p-1.5 rounded-lg flex-shrink-0 ${
          isDarkMode ? 'bg-red-500/10' : 'bg-red-100'
        }`}>
          <AlertCircle size={16} className={isDarkMode ? 'text-red-400' : 'text-red-600'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>{error}</p>
        </div>
        <button
          title='Cerrar alerta'
          onClick={onClose}
          className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
            isDarkMode
              ? 'hover:bg-white/10 text-white'
              : 'hover:bg-black/10 text-black'
          }`}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
