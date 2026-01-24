// /middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Rutas que requieren autenticación
const protectedRoutes = [
    '/',
    '/inventario',
    '/consultas',
    '/resguardos',
    '/reportes',
    '/admin',
]

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    const isPathProtected = protectedRoutes.some((path) =>
        pathname === path || pathname.startsWith(`${path}/`)
    )

    if (!isPathProtected) {
        return NextResponse.next()
    }

    const authToken = request.cookies.get('sb-access-token')?.value
    const userData = request.cookies.get('userData')?.value

    // Si no hay token o datos de usuario, redirigir al login
    if (!authToken || !userData) {
        console.log('🔒 [Proxy] No hay sesión, redirigiendo a login');
        const url = new URL('/login', request.url)
        url.searchParams.set('from', pathname)
        return NextResponse.redirect(url)
    }
    
    console.log('✅ [Proxy] Sesión encontrada');

    // Opcionalmente: verificar el token solo una vez cada cierto tiempo para mejorar rendimiento
    try {
        // Parsear userData para verificar proveedor
        let isAxpertUser = false;
        try {
            const parsedUserData = JSON.parse(userData);
            if (parsedUserData.oauthProvider === 'axpert') {
                isAxpertUser = true;
            }
        } catch (e) {
            // Error parsing user data, continue with standard validation
        }

        // Si es usuario de AXpert, confiamos en la cookie y permitimos el paso
        // El token de AXpert NO es válido para este proyecto de Supabase
        if (isAxpertUser) {
            console.log('✅ [Proxy] Usuario de AXpert, permitiendo acceso sin validar token');
            return NextResponse.next();
        }

        // Para usuarios locales, validar el token
        console.log('🔍 [Proxy] Usuario local, validando token...');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { data, error } = await supabase.auth.getUser(authToken)

        if (error || !data.user) {
            console.log('❌ [Proxy] Token inválido, limpiando cookies');
            // Limpiar cookies en caso de error
            const response = NextResponse.redirect(new URL('/login?from=' + pathname, request.url))
            response.cookies.delete('sb-access-token')
            response.cookies.delete('sb-refresh-token')
            response.cookies.delete('userData')
            return response
        }
        
        console.log('✅ [Proxy] Token válido, permitiendo acceso');
        return NextResponse.next()
    } catch (error) {
        console.error('❌ [Proxy] Error en autenticación:', error)
        const response = NextResponse.redirect(new URL('/login?from=' + pathname, request.url))
        // Limpiar cookies en caso de error
        response.cookies.delete('sb-access-token')
        response.cookies.delete('sb-refresh-token')
        response.cookies.delete('userData')
        return response
    }
}

export const config = {
    matcher: [
        '/((?!api|_next|public|favicon.ico).*)'
    ]
}