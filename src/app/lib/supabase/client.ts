"use client";

/**
 * Supabase Client - Configuración Segura con HttpOnly Cookies
 * 
 * Este cliente ha sido actualizado para trabajar con cookies HttpOnly.
 * TODAS las llamadas REST a Supabase se enrutan a través del proxy del servidor,
 * que maneja la autenticación de manera segura usando cookies HttpOnly.
 * 
 * CAMBIOS DE SEGURIDAD:
 * - ❌ ELIMINADO: Lectura de cookies desde JavaScript (js-cookie)
 * - ❌ ELIMINADO: Adjuntar tokens manualmente a headers
 * - ✅ AGREGADO: Todas las llamadas REST van a través del proxy
 * - ✅ AGREGADO: El servidor maneja autenticación con cookies HttpOnly
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        fetch: async (url, options = {}) => {
            const headers = new Headers(options.headers);
            
            const u = typeof url === 'string' ? url : url.toString();
            const isRest = u.includes('/rest/v1/');
            
            // TODAS las llamadas REST se enrutan a través del proxy del servidor
            // El proxy manejará la autenticación usando cookies HttpOnly
            if (typeof window !== 'undefined' && isRest) {
                try {
                    const parsedUrl = new URL(u);
                    const target = `${parsedUrl.pathname}${parsedUrl.search}`;
                    const proxiedUrl = `/api/supabase-proxy?target=${encodeURIComponent(target)}`;
                    
                    // NO enviar Authorization ni apikey al proxy
                    // El proxy usará las cookies HttpOnly automáticamente
                    headers.delete('Authorization');
                    headers.delete('apikey');
                    
                    return fetch(proxiedUrl, {
                        ...options,
                        headers,
                        credentials: 'include', // Importante: enviar cookies
                    });
                } catch (error) {
                    console.error('Error routing to proxy:', error);
                    // Si falla el parsing, intentar fetch normal
                }
            }
            
            // Para llamadas no-REST (auth, etc.), usar fetch normal
            const res = await fetch(url, {
                ...options,
                headers,
            });

            return res;
        },
    },
});

export default supabase;