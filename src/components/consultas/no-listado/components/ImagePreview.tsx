import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon, Loader2 } from 'lucide-react';
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
                    .from('muebles.tlaxcala')
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
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`w-full h-64 flex flex-col items-center justify-center rounded-lg border ${
                    isDarkMode 
                        ? 'bg-white/[0.02] border-white/10' 
                        : 'bg-black/[0.02] border-black/10'
                }`}
            >
                <Loader2 className={`h-8 w-8 animate-spin mb-2 ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                }`} />
                <span className={`text-sm font-light ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                }`}>
                    Cargando imagen...
                </span>
            </motion.div>
        );
    }

    if (error || !imageUrl) {
        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`w-full h-64 flex flex-col items-center justify-center rounded-lg border ${
                    isDarkMode 
                        ? 'bg-white/[0.02] border-white/10' 
                        : 'bg-black/[0.02] border-black/10'
                }`}
            >
                <ImageIcon className={`h-12 w-12 mb-2 ${
                    isDarkMode ? 'text-white/20' : 'text-black/20'
                }`} />
                <span className={`text-sm font-light ${
                    isDarkMode ? 'text-white/40' : 'text-black/40'
                }`}>
                    Imagen no disponible
                </span>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`w-full h-64 rounded-lg overflow-hidden border ${
                isDarkMode 
                    ? 'bg-white/[0.02] border-white/10' 
                    : 'bg-black/[0.02] border-black/10'
            }`}
        >
            <img
                src={imageUrl}
                alt="Imagen del bien"
                className="w-full h-full object-cover"
                onError={() => setError(true)}
            />
        </motion.div>
    );
}
