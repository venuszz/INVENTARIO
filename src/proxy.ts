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

    const authToken = request.cookies.get('authToken')?.value
    const userData = request.cookies.get('userData')?.value

    // Si no hay token o datos de usuario, redirigir al login
    if (!authToken || !userData) {
        const url = new URL('/login', request.url)
        url.searchParams.set('from', pathname)
        return NextResponse.redirect(url)
    }

    // Opcionalmente: verificar el token solo una vez cada cierto tiempo para mejorar rendimiento
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { data, error } = await supabase.auth.getUser(authToken)

        if (error || !data.user) {
            // Limpiar cookies en caso de error
            const response = NextResponse.redirect(new URL('/login?from=' + pathname, request.url))
            response.cookies.delete('authToken')
            response.cookies.delete('userData')
            return response
        }

        return NextResponse.next()
    } catch (error) {
        console.error('Error en middleware de autenticación:', error)
        const response = NextResponse.redirect(new URL('/login?from=' + pathname, request.url))
        // Limpiar cookies en caso de error
        response.cookies.delete('authToken')
        response.cookies.delete('userData')
        return response
    }
}

export const config = {
    matcher: [
        '/((?!api|_next|public|favicon.ico).*)'
    ]
}