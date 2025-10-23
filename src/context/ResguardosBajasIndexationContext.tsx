"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import supabase from '@/app/lib/supabase/client';

interface ResguardoBaja {
    id: number;
    folio_resguardo: string | null;
    folio_baja: string | null;
    f_resguardo: string | null;
    f_baja: string | null;
    dir_area: string | null;
    area_resguardo: string | null;
    usufinal: string | null;
    num_inventario: string | null;
    descripcion: string | null;
    rubro: string | null;
    condicion: string | null;
    motivo_baja: string | null;
    [key: string]: unknown;
}

interface ResguardosBajasIndexationContextType {
    resguardosBajas: ResguardoBaja[];
    loading: boolean;
    progress: number;
    reindex: () => Promise<void>;
}

const ResguardosBajasIndexationContext = createContext<ResguardosBajasIndexationContextType | undefined>(undefined);

export const ResguardosBajasIndexationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [resguardosBajas, setResguardosBajas] = useState<ResguardoBaja[]>([]);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const fetchResguardosBajas = useCallback(async () => {
        setLoading(true);
        setProgress(0);
        try {
            const batchSize = 1000;
            let allData: ResguardoBaja[] = [];
            let from = 0;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await supabase
                    .from('resguardos_bajas')
                    .select('*')
                    .range(from, from + batchSize - 1);

                if (error) throw error;

                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                    from += batchSize;
                    setProgress(Math.min(90, (allData.length / 5000) * 100));
                } else {
                    hasMore = false;
                }

                if (!data || data.length < batchSize) {
                    hasMore = false;
                }
            }

            setResguardosBajas(allData);
            setProgress(100);
        } catch (error) {
            console.error('Error fetching resguardos bajas:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchResguardosBajas();

        // Setup realtime subscription
        channelRef.current = supabase
            .channel('resguardos-bajas-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'resguardos_bajas'
                },
                (payload) => {
                    console.log('Resguardos bajas change detected:', payload);
                    
                    if (payload.eventType === 'INSERT') {
                        setResguardosBajas(prev => [...prev, payload.new as ResguardoBaja]);
                    } else if (payload.eventType === 'UPDATE') {
                        setResguardosBajas(prev =>
                            prev.map(item =>
                                item.id === (payload.new as ResguardoBaja).id ? (payload.new as ResguardoBaja) : item
                            )
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setResguardosBajas(prev =>
                            prev.filter(item => item.id !== (payload.old as ResguardoBaja).id)
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [fetchResguardosBajas]);

    const reindex = useCallback(async () => {
        await fetchResguardosBajas();
    }, [fetchResguardosBajas]);

    return (
        <ResguardosBajasIndexationContext.Provider value={{ resguardosBajas, loading, progress, reindex }}>
            {children}
        </ResguardosBajasIndexationContext.Provider>
    );
};

export const useResguardosBajasIndexation = () => {
    const context = useContext(ResguardosBajasIndexationContext);
    if (!context) {
        throw new Error('useResguardosBajasIndexation must be used within ResguardosBajasIndexationProvider');
    }
    return context;
};
