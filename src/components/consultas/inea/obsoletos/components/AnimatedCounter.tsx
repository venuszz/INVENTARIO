import { useState, useEffect, useRef } from 'react';
import type { AnimatedCounterProps } from '../types';

export function AnimatedCounter({ 
  value, 
  className, 
  prefix = '', 
  suffix = '', 
  loading = false, 
  isInteger = false 
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const formatNumber = (num: number) => {
    if (isInteger) {
      return Math.floor(num).toLocaleString('es-MX');
    } else {
      return num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  };
  
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (loading) {
      intervalRef.current = setInterval(() => {
        const randomValue = isInteger ? 
          Math.floor(Math.random() * 1000) : 
          Math.random() * 10000;
        setDisplayValue(randomValue);
      }, 100);
    } else {
      const duration = 1500;
      const steps = 20;
      const increment = (value - displayValue) / steps;
      let currentStep = 0;
      
      intervalRef.current = setInterval(() => {
        if (currentStep >= steps) {
          setDisplayValue(value);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }
        
        setDisplayValue(prev => prev + increment);
        currentStep++;
      }, duration / steps);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [value, loading, isInteger, displayValue]);
  
  return (
    <div className={className}>
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </div>
  );
}
