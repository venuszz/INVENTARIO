"use client"
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import supabase from '@/app/lib/supabase/client';

interface Obsoleto {
    id: number;
    id_inv: string;
    rubro: string | null;
    descripcion: string | null;
    valor: number | null;
    f_adq: string | null;
    formadq: string | null;
    proveedor: string | null;
    factura: string | null;
    ubicacion_es: string | null;
    ubicacion_mu: string | null;
    ubicacion_no: string | null;
    estado: string | null;
    estatus: string | null;
    area: string | null;
    usufinal: string | null;
    fechabaja: string | null;
    causadebaja: string | null;
    resguardante: string | null;
    image_path: string | null;
}

interface IteaObsoletosIndexationContextType {
    data: Obsoleto[];
    isIndexing: boolean;
    error: string | null;
    reindex: () => Promise<void>;
}

const IteaObsoletosIndexationContext = createContext<IteaObsoletosIndexationContextType | undefined>(undefined);

export function IteaObsoletosIndexationProvider({ children }: { children: React.ReactNode }) {
    const [data, setData] = useState<Obsoleto[]>([]);
    const [isIndexing, setIsIndexing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsIndexing(true);
        setError(null);

        try {
            const { data: obsoletosData, error: fetchError } = await supabase
                .from('mueblesitea')
                .select('id, id_inv, rubro, descripcion, valor, f_adq, formadq, proveedor, factura, ubicacion_es, ubicacion_mu, ubicacion_no, estado, estatus, area, usufinal, fechabaja, causadebaja, resguardante, image_path')
                .eq('estatus', 'BAJA')
                .order('id_inv', { ascending: true });

            if (fetchError) throw fetchError;

            setData((obsoletosData as Obsoleto[]) || []);
        } catch (err) {
            console.error('Error indexando obsoletos ITEA:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsIndexing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        // Suscripción a cambios en tiempo real
        const channel = supabase
            .channel('itea-obsoletos-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'mueblesitea',
                    filter: 'estatus=eq.BAJA'
                },
                () => {
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData]);

    const reindex = useCallback(async () => {
        await fetchData();
    }, [fetchData]);

    return (
        <IteaObsoletosIndexationContext.Provider value={{ data, isIndexing, error, reindex }}>
            {children}
        </IteaObsoletosIndexationContext.Provider>
    );
}

export function useIteaObsoletosIndexation() {
    const context = useContext(IteaObsoletosIndexationContext);
    if (context === undefined) {
        throw new Error('useIteaObsoletosIndexation debe usarse dentro de IteaObsoletosIndexationProvider');
    }
    return context;
}
