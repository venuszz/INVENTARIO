import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAXpertProfile } from '@/lib/axpert-api';

// Cliente Supabase local (INVENTARIO) - Inicializado dentro del handler para evitar errores en tiempo de evaluación

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
        return NextResponse.redirect(
            new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
        );
    }

    if (!code) {
        return NextResponse.redirect(
            new URL('/login?error=No authorization code received', request.url)
        );
    }

    const savedState = request.cookies.get('oauth_state')?.value;
    if (!savedState || savedState !== state) {
        return NextResponse.redirect(
            new URL('/login?error=Invalid state parameter', request.url)
        );
    }

    const codeVerifier = request.cookies.get('oauth_code_verifier')?.value;
    if (!codeVerifier) {
        return NextResponse.redirect(
            new URL('/login?error=Code verifier not found', request.url)
        );
    }

    const supabaseProjectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const configuredProviderUrl = process.env.SUPABASE_OAUTH_PROVIDER_URL;
    const providerUrl = configuredProviderUrl || supabaseProjectUrl;
    const clientId = process.env.SUPABASE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.SUPABASE_OAUTH_CLIENT_SECRET;

    if (!providerUrl || !clientId) {
        return NextResponse.redirect(
            new URL('/login?error=OAuth configuration missing', request.url)
        );
    }

    try {
        const tokenEndpoint = `${providerUrl}/auth/v1/oauth/token`;
        const origin = new URL(request.url).origin;
        const redirectUri = `${origin}/api/auth/callback`;

        const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            client_id: clientId,
            code_verifier: codeVerifier,
        });

        if (clientSecret) {
            tokenParams.append('client_secret', clientSecret);
        }

        const tokenResponse = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: tokenParams.toString(),
        });

        if (!tokenResponse.ok) {
            return NextResponse.redirect(
                new URL('/login?error=Token exchange failed', request.url)
            );
        }

        const tokens = await tokenResponse.json();
        const { access_token, refresh_token, id_token } = tokens;

        if (!access_token) {
            return NextResponse.redirect(
                new URL('/login?error=No access token received', request.url)
            );
        }

        // Obtener perfil desde AXpert
        const axpertProfile = await getAXpertProfile(access_token);

        if (!axpertProfile || !axpertProfile.email) {
            return NextResponse.redirect(
                new URL('/login?error=No se pudo obtener información del perfil', request.url)
            );
        }

        // Inicializar cliente de admin de Supabase (necesario para gestionar usuarios)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseServiceKey) {
            console.error('SERVER ERROR: SUPABASE_SERVICE_ROLE_KEY is not defined en .env.local');
            return NextResponse.redirect(
                new URL('/login?error=Server configuration error', request.url)
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Verificar si el usuario existe en nuestra base de datos local
        const { data: existingUser, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', axpertProfile.email)
            .single();

        let localUser = existingUser;

        if (userError && userError.code !== 'PGRST116') {
            console.error('Error verificando usuario:', userError);
            return NextResponse.redirect(
                new URL('/login?error=Error de base de datos', request.url)
            );
        }

        // Si el usuario NO existe, crearlo como pendiente de aprobación
        if (!existingUser) {
            // 1. Asegurar que el usuario existe en auth.users (para satisfacer FK users_id_fkey) y actualizar metadata
            // Intentamos actualizar primero por si ya existe en auth pero no en public.users
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                axpertProfile.id,
                {
                    user_metadata: {
                        first_name: axpertProfile.first_name,
                        last_name: axpertProfile.last_name,
                        avatar_url: axpertProfile.avatar_url, // Guardamos aquí la URL
                    }
                }
            );

            // Si falla la actualización (ej: no existe), lo creamos
            if (updateError) {
                const { error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
                    id: axpertProfile.id,
                    email: axpertProfile.email,
                    email_confirm: true,
                    user_metadata: {
                        first_name: axpertProfile.first_name,
                        last_name: axpertProfile.last_name,
                        avatar_url: axpertProfile.avatar_url, // Guardamos aquí la URL
                    }
                });

                if (authCreateError) {
                    console.log('Info: Error creando/actualizando auth user:', authCreateError.message);
                }
            }

            // Generar username automático desde el email
            const username = axpertProfile.email.split('@')[0];

            const { data: newUser, error: createError } = await supabaseAdmin
                .from('users')
                .insert({
                    id: axpertProfile.id, // Usar el mismo ID que en AXpert para consistencia
                    email: axpertProfile.email,
                    username: username,
                    first_name: axpertProfile.first_name,
                    last_name: axpertProfile.last_name,
                    oauth_provider: 'axpert',
                    oauth_user_id: axpertProfile.id,
                    rol: null,
                    is_active: false,
                    pending_approval: true,
                    // avatar_url: axpertProfile.avatar_url // REMOVED: Column does not exist
                })
                .select()
                .single();

            if (createError) {
                console.error('Error creando usuario:', createError);
                return NextResponse.redirect(
                    new URL('/login?error=Error creando usuario', request.url)
                );
            }

            localUser = newUser;
        } else {
            // Si el usuario ya existe, actualizamos su avatar en metadata de todas formas para tener lo más reciente
            await supabaseAdmin.auth.admin.updateUserById(
                axpertProfile.id,
                {
                    user_metadata: {
                        first_name: axpertProfile.first_name,
                        last_name: axpertProfile.last_name,
                        avatar_url: axpertProfile.avatar_url,
                    }
                }
            );
        }

        // Si el usuario existe pero no está activo
        if (!localUser.is_active) {
            const response = NextResponse.redirect(new URL('/pending-approval', request.url));

            const cookieOptions = {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const,
                maxAge: 60 * 60 * 4,
                path: '/',
            };

            // Guardar info temporal para mostrar en la página de pendiente
            response.cookies.set('pending_user_info', JSON.stringify({
                email: axpertProfile.email,
                firstName: axpertProfile.first_name,
                lastName: axpertProfile.last_name,
                avatarUrl: axpertProfile.avatar_url,
            }), cookieOptions);

            // COOKIE ADICIONAL SOLICITADA PARA EL USO DE ESTA SESION
            response.cookies.set('axpert_avatar_url', axpertProfile.avatar_url || '', {
                ...cookieOptions,
                httpOnly: false // Accessible by client
            });


            response.cookies.delete('oauth_state');
            response.cookies.delete('oauth_code_verifier');

            return response;
        }

        // Usuario existe y está activo - Login exitoso
        const response = NextResponse.redirect(new URL('/', request.url));

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            maxAge: 60 * 60 * 4,
            path: '/',
        };

        // NOTE: El cliente (navegador) necesita leer el token para adjuntarlo a las llamadas REST
        // en los providers de indexación. Por eso este cookie NO debe ser httpOnly.
        response.cookies.set('authToken', access_token, {
            ...cookieOptions,
            httpOnly: false,
        });

        if (refresh_token) {
            response.cookies.set('refreshToken', refresh_token, {
                ...cookieOptions,
                maxAge: 60 * 60 * 24 * 30,
            });
        }

        if (id_token) {
            response.cookies.set('idToken', id_token, cookieOptions);
        }

        // Guardar información del usuario local + perfil de AXpert
        response.cookies.set('userData', JSON.stringify({
            id: localUser.id,
            username: localUser.username,
            firstName: axpertProfile.first_name,
            lastName: axpertProfile.last_name,
            rol: localUser.rol,
            email: localUser.email,
            oauthProvider: 'axpert',
        }), {
            ...cookieOptions,
            httpOnly: false,
        });

        // Guardar el perfil de AXpert para acceso al avatar
        response.cookies.set('axpert_profile', JSON.stringify({
            avatarUrl: axpertProfile.avatar_url,
            firstName: axpertProfile.first_name,
            lastName: axpertProfile.last_name,
        }), {
            ...cookieOptions,
            httpOnly: false,
        });

        // COOKIE ADICIONAL SOLICITADA
        response.cookies.set('axpert_avatar_url', axpertProfile.avatar_url || '', {
            ...cookieOptions,
            httpOnly: false
        });

        response.cookies.delete('oauth_state');
        response.cookies.delete('oauth_code_verifier');

        return response;


    } catch (error) {
        console.error('Error en OAuth callback:', error);
        return NextResponse.redirect(
            new URL('/login?error=Authentication failed', request.url)
        );
    }
}
