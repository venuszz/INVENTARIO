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
      <label className={`block text-xs font-medium mb-1.5 ${
        isDarkMode ? 'text-white/60' : 'text-black/60'
      }`}>
        Resguardante
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Nombre del resguardante"
        className={`block w-full border rounded py-2 px-3 text-sm transition-colors focus:outline-none h-[38px] ${
          isDarkMode
            ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-white/30'
            : 'bg-black/5 border-black/10 text-black placeholder-black/40 focus:border-black/30'
        }`}
      />
    </div>
  );
}
