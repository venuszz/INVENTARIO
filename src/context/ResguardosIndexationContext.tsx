"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import supabase from '@/app/lib/supabase/client';

interface Resguardo {
    id: number;
    folio: string;
    f_resguardo: string;
    dir_area: string | null;
    area_resguardo: string | null;
    usufinal: string | null;
    num_inventario: string | null;
    descripcion: string | null;
    rubro: string | null;
    condicion: string | null;
    [key: string]: unknown;
}

interface ResguardosIndexationContextType {
    resguardos: Resguardo[];
    loading: boolean;
    progress: number;
    reindex: () => Promise<void>;
}

const ResguardosIndexationContext = createContext<ResguardosIndexationContextType | undefined>(undefined);

export const ResguardosIndexationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [resguardos, setResguardos] = useState<Resguardo[]>([]);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const fetchResguardos = useCallback(async () => {
        setLoading(true);
        setProgress(0);
        try {
            const batchSize = 1000;
            let allData: Resguardo[] = [];
            let from = 0;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await supabase
                    .from('resguardos')
                    .select('*')
                    .range(from, from + batchSize - 1);

                if (error) throw error;

                if (data && data.length > 0) {
                    allData = [...allData, ...data];
                    from += batchSize;
                    setProgress(Math.min(90, (allData.length / 10000) * 100));
                } else {
                    hasMore = false;
                }

                if (!data || data.length < batchSize) {
                    hasMore = false;
                }
            }

            setResguardos(allData);
            setProgress(100);
        } catch (error) {
            console.error('Error fetching resguardos:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchResguardos();

        // Setup realtime subscription
        channelRef.current = supabase
            .channel('resguardos-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'resguardos'
                },
                (payload) => {
                    console.log('Resguardos change detected:', payload);
                    
                    if (payload.eventType === 'INSERT') {
                        setResguardos(prev => [...prev, payload.new as Resguardo]);
                    } else if (payload.eventType === 'UPDATE') {
                        setResguardos(prev =>
                            prev.map(item =>
                                item.id === (payload.new as Resguardo).id ? (payload.new as Resguardo) : item
                            )
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setResguardos(prev =>
                            prev.filter(item => item.id !== (payload.old as Resguardo).id)
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
    }, [fetchResguardos]);

    const reindex = useCallback(async () => {
        await fetchResguardos();
    }, [fetchResguardos]);

    return (
        <ResguardosIndexationContext.Provider value={{ resguardos, loading, progress, reindex }}>
            {children}
        </ResguardosIndexationContext.Provider>
    );
};

export const useResguardosIndexation = () => {
    const context = useContext(ResguardosIndexationContext);
    if (!context) {
        throw new Error('useResguardosIndexation must be used within ResguardosIndexationProvider');
    }
    return context;
};
