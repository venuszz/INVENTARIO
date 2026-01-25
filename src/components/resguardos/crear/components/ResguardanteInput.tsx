/**
 * ResguardanteInput component
 * Input field for resguardante name
 */

import { useTheme } from '@/context/ThemeContext';

interface ResguardanteInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

/**
 * Input field for entering resguardante name
 */
export function ResguardanteInput({ value, onChange, disabled }: ResguardanteInputProps) {
  const { isDarkMode } = useTheme();

  return (
    <div className="mb-4">
      <label className={`text-sm font-medium mb-1 ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Resguardante
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Nombre del resguardante"
        className={`block w-full border rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 transition-colors ${
          isDarkMode
            ? 'bg-black border-gray-800 text-white placeholder-gray-500 focus:ring-blue-500 hover:border-blue-500'
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 hover:border-blue-400'
        }`}
        disabled={disabled}
      />
    </div>
  );
}
