/**
 * Utility functions for ITEA Obsoletos component
 * 
 * This file contains helper functions for formatting, validation,
 * and data manipulation used throughout the obsolete items system.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import supabase from '@/app/lib/supabase/client';
import type { AnimatedCounterProps, ImagePreviewProps } from './types';

/**
 * Formats a date string to a localized format
 * 
 * @param dateStr - Date string in ISO format or YYYY-MM-DD
 * @returns Formatted date string in DD/MM/YYYY format or empty string if null
 * 
 * @example
 * formatDate('2024-01-15') // Returns '15/01/2024'
 * formatDate(null) // Returns ''
 */
export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '';
  
  // If the string is YYYY-MM-DD, display it as is (reversed)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr.split('-').reverse().join('/');
  }
  
  // Otherwise, try to parse and display in local format
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    // Adjust for timezone offset
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() + userTimezoneOffset);
    return localDate.toLocaleDateString('es-MX');
  }
  
  return dateStr;
};

/**
 * Truncates text to a specified length and adds ellipsis
 * 
 * @param text - Text to truncate
 * @param length - Maximum length before truncation (default: 50)
 * @returns Truncated text with ellipsis or "No Data" if null
 * 
 * @example
 * truncateText('This is a very long text', 10) // Returns 'This is a ...'
 * truncateText(null) // Returns 'No Data'
 */
export const truncateText = (text: string | null, length: number = 50): string => {
  if (!text) return "No Data";
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

/**
 * AnimatedCounter component - Displays an animated number counter
 * Shows loading state with random number animation, then smoothly counts to target value
 * 
 * @param value - Target value to count to
 * @param className - Additional CSS classes
 * @param prefix - Text to show before the number
 * @param suffix - Text to show after the number
 * @param loading - Whether the counter is in loading state
 * @param isInteger - Whether to format as integer (no decimals)
 */
export function AnimatedCounter({
  value,
  className = '',
  prefix = '',
  suffix = '',
  loading = false,
  isInteger = false,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (loading) {
      // Show random numbers while loading
      const interval = setInterval(() => {
        setDisplayValue(Math.random() * value * 1.5);
      }, 100);
      return () => clearInterval(interval);
    } else {
      // Animate to final value
      setIsAnimating(true);
      const duration = 1000; // 1 second
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        current += increment;
        if (step >= steps) {
          setDisplayValue(value);
          setIsAnimating(false);
          clearInterval(timer);
        } else {
          setDisplayValue(current);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [value, loading]);

  const formattedValue = isInteger
    ? Math.round(displayValue).toLocaleString('es-MX')
    : displayValue.toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}
      {formattedValue}
      {suffix}
    </motion.span>
  );
}

/**
 * ImagePreview component - Displays images from Supabase storage
 * Handles loading states, errors, and signed URLs for the muebles.itea bucket
 * 
 * @param imagePath - Path to the image in storage
 */
export function ImagePreview({ imagePath }: ImagePreviewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!imagePath) {
      setLoading(false);
      return;
    }

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);

        // Get signed URL from muebles.itea bucket
        const { data, error: urlError } = await supabase.storage
          .from('muebles.itea')
          .createSignedUrl(imagePath, 3600); // 1 hour expiry

        if (urlError) throw urlError;

        setImageUrl(data.signedUrl);
      } catch (err) {
        console.error('Error loading image:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [imagePath]);

  if (!imagePath) {
    return (
      <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <span className="text-gray-400 dark:text-gray-500">Sin imagen</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <span className="text-red-400">Error al cargar imagen</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <img
        src={imageUrl}
        alt="Imagen del artículo"
        className="w-full h-auto rounded-lg object-cover"
      />
    </motion.div>
  );
}
