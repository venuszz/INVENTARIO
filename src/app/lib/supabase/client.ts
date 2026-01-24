"use client";

/**
 * Supabase Client - Conexión Directa SIN Proxy
 * 
 * IMPORTANTE: Este cliente NO puede usar tokens de AXpert directamente porque son
 * de otro proyecto de Supabase. Para usuarios de AXpert, las peticiones deben
 * hacerse desde el servidor usando el Service Role Key.
 * 
 * Este cliente solo funciona para:
 * 1. Usuarios locales (con su propio access_token de este proyecto)
 * 2. Realtime (que usa el anon key + RLS)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing');
}

// Cliente de Supabase solo para Realtime
// NO se usa para REST API (usamos el proxy para eso)
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
    global: {
        headers: {
            'X-Client-Info': 'inventario-app',
        },
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});

// Función para actualizar el token de Realtime
// Por ahora solo usamos el anon key
export function updateSupabaseAuth() {
    console.log('🔑 [Supabase Client] Realtime configurado con anon key');
}

// Configurar Realtime al cargar
if (typeof window !== 'undefined') {
    setTimeout(() => {
        updateSupabaseAuth();
    }, 100);
}

export default supabase;