'use client';

import { ReactNode } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface ResolverLayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
}

export function ResolverLayout({ leftPanel, rightPanel }: ResolverLayoutProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] items-start" style={{ gap: 'clamp(1rem, 1.5vw, 1.5rem)' }}>
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
