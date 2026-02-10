import { useState, useEffect } from 'react';
import supabase from '@/app/lib/supabase/client';

interface ImagePreviewProps {
  imagePath: string | null;
  isDarkMode: boolean;
}

export default function ImagePreview({ imagePath, isDarkMode }: ImagePreviewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!imagePath) {
        if (isMounted) {
          setLoading(false);
          setError(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError(false);
        }

        const { data, error } = await supabase
          .storage
          .from('muebles.inea')
          .createSignedUrl(imagePath, 3600);

        if (error) throw error;

        const img = new Image();
        img.src = data.signedUrl;

        img.onload = () => {
          if (isMounted) {
            setImageUrl(data.signedUrl);
            setLoading(false);
          }
        };

        img.onerror = () => {
          if (isMounted) {
            setError(true);
            setLoading(false);
          }
        };
      } catch (err) {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
        console.error("Error loading image:", err);
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [imagePath]);

  if (loading) {
    return (
      <div className={`w-full h-64 flex items-center justify-center rounded-lg ${
        isDarkMode ? 'bg-white/5' : 'bg-black/5'
      }`}>
        <span className={isDarkMode ? 'text-white/40' : 'text-black/40'}>
          Cargando imagen...
        </span>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`w-full h-64 flex items-center justify-center rounded-lg ${
        isDarkMode ? 'bg-white/5' : 'bg-black/5'
      }`}>
        <span className={isDarkMode ? 'text-white/30' : 'text-black/30'}>
          Imagen no disponible
        </span>
      </div>
    );
  }

  return (
    <div className={`w-full h-64 rounded-lg overflow-hidden ${
      isDarkMode ? 'bg-black' : 'bg-white'
    }`}>
      <img
        src={imageUrl}
        alt="Imagen del bien"
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}
