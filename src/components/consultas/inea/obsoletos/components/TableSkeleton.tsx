'use client';

import React from 'react';

interface TableSkeletonProps {
  /** Dark mode flag */
  isDarkMode: boolean;
  /** Number of skeleton rows to display */
  rows?: number;
}

/**
 * TableSkeleton Component
 * 
 * Displays a loading skeleton that matches the table structure
 * while data is being fetched.
 */
export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  isDarkMode,
  rows = 5
}) => {
  return (
    <div className={`rounded-lg border overflow-hidden mb-6 ${
      isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'
    }`}>
      <div className="min-w-[800px]">
        <table className={`min-w-full divide-y ${
          isDarkMode ? 'divide-gray-800' : 'divide-gray-200'
        }`}>
          {/* Skeleton Header */}
          <thead className={isDarkMode ? 'bg-black' : 'bg-gray-50'}>
            <tr>
              {[...Array(5)].map((_, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left"
                >
                  <div className={`h-4 rounded animate-pulse ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                  }`} style={{ width: `${60 + Math.random() * 40}%` }} />
                </th>
              ))}
            </tr>
          </thead>

          {/* Skeleton Body */}
          <tbody className={`divide-y ${
            isDarkMode ? 'bg-black divide-gray-800' : 'bg-white divide-gray-200'
          }`}>
            {[...Array(rows)].map((_, rowIndex) => (
              <tr key={rowIndex}>
                {[...Array(5)].map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <div className={`h-4 rounded animate-pulse ${
                      isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                    }`} style={{ 
                      width: `${50 + Math.random() * 50}%`,
                      animationDelay: `${(rowIndex * 5 + colIndex) * 50}ms`
                    }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
