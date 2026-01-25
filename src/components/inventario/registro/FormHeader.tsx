import React from 'react';
import { FormHeaderProps } from './types';

export default function FormHeader({ currentStep, isDarkMode }: FormHeaderProps) {
  return (
    <div className={`p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b gap-2 sm:gap-0 transition-colors duration-500 flex-shrink-0 ${
      isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
    }`}>
      <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold flex items-center transition-colors duration-500 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        <span className={`mr-2 sm:mr-3 p-1 sm:p-2 rounded-lg border text-sm sm:text-base transition-colors duration-500 ${
          isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-gray-100 text-gray-900 border-gray-300'
        }`}>
          INV
        </span>
        Registro de Bienes
      </h1>
      <div className="flex space-x-2 self-end sm:self-auto">
        <div className={`h-2 sm:h-3 w-2 sm:w-3 rounded-full transition-colors duration-500 ${
          currentStep >= 1
            ? (isDarkMode ? 'bg-white' : 'bg-blue-600')
            : (isDarkMode ? 'bg-gray-700' : 'bg-gray-300')
        }`}></div>
        <div className={`h-2 sm:h-3 w-2 sm:w-3 rounded-full transition-colors duration-500 ${
          currentStep >= 2
            ? (isDarkMode ? 'bg-white' : 'bg-blue-600')
            : (isDarkMode ? 'bg-gray-700' : 'bg-gray-300')
        }`}></div>
        <div className={`h-2 sm:h-3 w-2 sm:w-3 rounded-full transition-colors duration-500 ${
          currentStep >= 3
            ? (isDarkMode ? 'bg-white' : 'bg-blue-600')
            : (isDarkMode ? 'bg-gray-700' : 'bg-gray-300')
        }`}></div>
      </div>
    </div>
  );
}
