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

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    const isPathProtected = protectedRoutes.some((path) =>
        pathname === path || pathname.startsWith(`${path}/`)
    )

    if (!isPathProtected) {
        return NextResponse.next()
    }

    const authToken = request.cookies.get('authToken')?.value

    if (!authToken) {
        const url = new URL('/login', request.url)
        url.searchParams.set('from', pathname)
        return NextResponse.redirect(url)
    }

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { data, error } = await supabase.auth.getUser(authToken)

        if (error || !data.user) {
            const url = new URL('/login', request.url)
            url.searchParams.set('from', pathname)
            return NextResponse.redirect(url)
        }

        return NextResponse.next()
    } catch (error) {
        console.error('Error en middleware de autenticación:', error)
        const url = new URL('/login', request.url)
        url.searchParams.set('from', pathname)
        return NextResponse.redirect(url)
    }
}

export const config = {
    matcher: [
        '/((?!api|_next|public|favicon.ico).*)'
    ]
}