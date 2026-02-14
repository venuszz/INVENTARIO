import { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

/**
 * Props for SuccessAlert component
 */
interface SuccessAlertProps {
  show: boolean;
  message: string | null;
  onClose: () => void;
}

/**
 * SuccessAlert - Success message alert with auto-dismiss
 * 
 * Displays a success message in a fixed position at the bottom-right of the screen.
 * Auto-dismisses after 3 seconds. Uses green theme to indicate success state.
 * 
 * @param show - Whether to show the alert
 * @param message - The success message to display
 * @param onClose - Handler to close the alert
 */
export default function SuccessAlert({ show, message, onClose }: SuccessAlertProps) {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (show && message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, message, onClose]);

  if (!show || !message) return null;

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 px-4 py-3 rounded-lg shadow-lg border z-50 backdrop-blur-sm animate-fade-in ${isDarkMode
      ? 'bg-green-900/80 text-green-100 border-green-800'
      : 'bg-green-50 text-green-900 border-green-200'
      }`}>
      <div className="flex items-center">
        <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          title='Cerrar alerta'
          onClick={onClose}
          className={`ml-4 flex-shrink-0 p-1 rounded-full transition-colors ${isDarkMode
            ? 'text-green-200 hover:text-white hover:bg-green-800'
            : 'text-green-600 hover:text-green-800 hover:bg-green-100'
            }`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
