'use client';

import { Toaster } from 'sileo';

export default function SileoToaster() {
  return (
    <Toaster
      position="top-right"
      offset={{ top: 80 }}
      options={{
        styles: {
          title: 'color: #ffffff',
          description: 'color: rgba(255, 255, 255, 0.7)',
        }
      }}
    />
  );
}
