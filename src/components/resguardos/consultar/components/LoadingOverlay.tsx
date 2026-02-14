/**
 * LoadingOverlay Component
 * 
 * Full-screen loading overlay for folio parameter loading
 */

'use client';

interface LoadingOverlayProps {
  show: boolean;
}

/**
 * LoadingOverlay - Display full-screen loading overlay
 */
export default function LoadingOverlay({ show }: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <span className="text-white animate-pulse text-lg font-bold">Cargando folio...</span>
        <div className="h-10 w-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
