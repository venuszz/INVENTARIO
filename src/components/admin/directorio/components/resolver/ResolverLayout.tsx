'use client';

import { ReactNode } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface ResolverLayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
}

export function ResolverLayout({ leftPanel, rightPanel }: ResolverLayoutProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-6 items-start">
      {/* Left Panel - Inconsistency List */}
      <div className="h-full">
        {leftPanel}
      </div>

      {/* Right Panel - Resolution Panel */}
      <div className="h-full">
        {rightPanel}
      </div>
    </div>
  );
}
