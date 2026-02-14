/**
 * SuggestionDropdown component for Consultar Resguardos
 * Generic reusable dropdown for displaying suggestions with keyboard navigation
 */

import { useTheme } from '@/context/ThemeContext';

interface SuggestionDropdownProps<T> {
  items: T[];
  renderItem: (item: T, index: number, isHighlighted: boolean) => React.ReactNode;
  onItemClick: (item: T, index: number) => void;
  highlightedIndex: number;
  onHighlightChange: (index: number) => void;
  show: boolean;
  ariaLabel?: string;
}

/**
 * Generic dropdown component for suggestions
 * Supports keyboard navigation and mouse hover
 * 
 * @template T - Type of items in the dropdown
 */
export function SuggestionDropdown<T>({
  items,
  renderItem,
  onItemClick,
  highlightedIndex,
  onHighlightChange,
  show,
  ariaLabel = 'Sugerencias'
}: SuggestionDropdownProps<T>) {
  const { isDarkMode } = useTheme();

  if (!show || items.length === 0) return null;

  return (
    <ul
      role="listbox"
      aria-label={ariaLabel}
      className={`absolute left-0 top-full w-full mt-1 max-h-80 overflow-y-auto rounded border backdrop-blur-xl z-50 ${
        isDarkMode
          ? 'border-white/10 bg-black/95'
          : 'border-black/10 bg-white/95'
      }`}
    >
      {items.map((item, index) => {
        const isHighlighted = highlightedIndex === index;
        return (
          <li
            key={index}
            role="option"
            aria-selected={isHighlighted}
            onMouseDown={() => onItemClick(item, index)}
            onMouseEnter={() => onHighlightChange(index)}
            className="cursor-pointer select-none"
          >
            {renderItem(item, index, isHighlighted)}
          </li>
        );
      })}
    </ul>
  );
}
