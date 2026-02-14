import { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

/**
 * Props for ErrorAlert component
 */
interface ErrorAlertProps {
  show: boolean;
  message: string | null;
  onClose: () => void;
}

/**
 * ErrorAlert - Error message alert with auto-dismiss
 * 
 * Displays an error message in a fixed position at the bottom-right of the screen.
 * Auto-dismisses after 5 seconds. Uses red theme to indicate error state.
 * 
 * @param show - Whether to show the alert
 * @param message - The error message to display
 * @param onClose - Handler to close the alert
 */
export default function ErrorAlert({ show, message, onClose }: ErrorAlertProps) {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (show && message) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [show, message, onClose]);

  if (!show || !message) return null;

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
          <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>{message}</p>
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
}
