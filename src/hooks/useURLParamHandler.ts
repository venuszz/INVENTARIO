import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export interface UseURLParamHandlerOptions<T> {
  paramName: 'id' | 'folio';
  items: T[];
  isLoading: boolean;
  getItemKey: (item: T) => string | number;
  onItemSelect: (item: T) => void;
}

export interface UseURLParamHandlerReturn {
  isProcessingParam: boolean;
  paramNotFound: boolean;
  foundItem: any | null;
  clearParamNotFound: () => void;
}

export function useURLParamHandler<T>(
  options: UseURLParamHandlerOptions<T>
): UseURLParamHandlerReturn {
  const { paramName, items, isLoading, getItemKey, onItemSelect } = options;
  const searchParams = useSearchParams();
  const [isProcessingParam, setIsProcessingParam] = useState(false);
  const [paramNotFound, setParamNotFound] = useState(false);
  const [foundItem, setFoundItem] = useState<T | null>(null);
  const processedParamRef = useRef<string | null>(null);

  useEffect(() => {
    // Get the parameter value from URL
    const paramValue = searchParams.get(paramName);

    // If no parameter or still loading, do nothing
    if (!paramValue || isLoading) {
      return;
    }

    // If we already processed this parameter, skip
    if (processedParamRef.current === paramValue) {
      return;
    }

    // Mark as processing
    setIsProcessingParam(true);
    processedParamRef.current = paramValue;

    // Search for the item in the data
    const foundItem = items.find((item) => {
      const itemKey = getItemKey(item);
      return String(itemKey) === String(paramValue);
    });

    if (foundItem) {
      // Item found - select it automatically
      onItemSelect(foundItem);
      setFoundItem(foundItem);
      setParamNotFound(false);
    } else {
      // Item not found - set flag
      setFoundItem(null);
      setParamNotFound(true);
    }

    setIsProcessingParam(false);
  }, [paramName, searchParams, items, isLoading, getItemKey, onItemSelect]);

  const clearParamNotFound = () => {
    setParamNotFound(false);
  };

  return {
    isProcessingParam,
    paramNotFound,
    foundItem,
    clearParamNotFound
  };
}
