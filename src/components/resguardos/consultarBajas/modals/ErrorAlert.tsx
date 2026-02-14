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
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 px-4 py-3 rounded-lg shadow-lg border z-50 backdrop-blur-sm animate-fade-in ${
      isDarkMode
        ? 'bg-red-900/80 text-red-100 border-red-800'
        : 'bg-red-50 text-red-900 border-red-200'
    }`}>
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 animate-pulse" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{error}</p>
        </div>
        <button
          title='Cerrar alerta'
          onClick={onClose}
          className={`ml-4 flex-shrink-0 p-1 rounded-full transition-colors ${
            isDarkMode
              ? 'text-red-200 hover:text-white hover:bg-red-800'
              : 'text-red-600 hover:text-red-800 hover:bg-red-100'
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
