'use client';

import { Toaster } from 'sileo';

export default function SileoToaster() {
  return (
    <Toaster
      position="top-right"
      offset={{ top: 80 }}
      options={{
        styles: {
          title: '!text-white',
          description: '!text-white/70',
        }
      }}
    />
  );
}
