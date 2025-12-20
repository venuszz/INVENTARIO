"use client";

// supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import Cookies from 'js-cookie';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        fetch: async (url, options = {}) => {
            const headers = new Headers(options.headers);

            const userDataRaw = typeof window !== 'undefined' ? Cookies.get('userData') : undefined;
            let isAxpertUser = false;
            if (userDataRaw) {
                try {
                    const parsed = JSON.parse(userDataRaw);
                    isAxpertUser = parsed?.oauthProvider === 'axpert';
                } catch {
                    isAxpertUser = false;
                }
            }

            const token = typeof window !== 'undefined' ? Cookies.get('authToken') : undefined;
            const currentAuth = headers.get('Authorization');
            const isAnonAuth = currentAuth === `Bearer ${supabaseAnonKey}`;
            if (token && (!currentAuth || isAnonAuth)) {
                headers.set('Authorization', `Bearer ${token}`);
            }

            const u = typeof url === 'string' ? url : url.toString();
            const isRest = u.includes('/rest/v1/');

            // AXpert tokens are issued by an external IdP (issuer mismatch). Route REST calls through server proxy.
            if (typeof window !== 'undefined' && isAxpertUser && isRest) {
                try {
                    const parsedUrl = new URL(u);
                    const target = `${parsedUrl.pathname}${parsedUrl.search}`;
                    const proxiedUrl = `/api/supabase-proxy?target=${encodeURIComponent(target)}`;

                    // Proxy authenticates via cookies; do not send Authorization to proxy.
                    headers.delete('Authorization');
                    headers.delete('apikey');

                    return fetch(proxiedUrl, {
                        ...options,
                        headers,
                    });
                } catch {
                    // If URL parsing fails, fall through to normal fetch.
                }
            }

            const res = await fetch(url, {
                ...options,
                headers,
            });

            return res;
        },
    },
});

export default supabase;