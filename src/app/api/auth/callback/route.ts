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

    // Decodificar el estado para ver si hay metadata (como mode: 'linking')
    let stateMetadata: any = {};
    try {
        const decodedState = Buffer.from(state, 'base64url').toString('utf-8');
        stateMetadata = JSON.parse(decodedState);
    } catch (e) {
        // Marcamos si falló para saber que es un estado tradicional
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
            const errorText = await tokenResponse.text();
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
            return NextResponse.redirect(
                new URL('/login?error=Server configuration error', request.url)
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // =================================================================================
        // MODO VINCULACIÓN DE CUENTAS (ACCOUNT LINKING)
        // =================================================================================
        
        if (stateMetadata.mode === 'linking') {
            const originalUserId = stateMetadata.original_user_id;

            if (!originalUserId) {
                return NextResponse.redirect(
                    new URL('/login?error=Invalid linking state', request.url)
                );
            }

            // Actualizar el usuario existente con los datos de AXpert
            const { error: updateError } = await supabaseAdmin
                .from('users')
                .update({
                    oauth_provider: 'axpert',
                    oauth_user_id: axpertProfile.id,
                })
                .eq('id', originalUserId);

            if (updateError) {
                return NextResponse.redirect(
                    new URL('/?error=Failed to link account', request.url)
                );
            }

            // Recuperar los datos actualizados del usuario para la cookie
            const { data: updatedUser } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('id', originalUserId)
                .single();

            // Actualizar cookies para reflejar el cambio inmediato en el frontend
            // ESTRATEGIA: En lugar de redirect 307 directo, devolvemos una página HTML intermedia.
            // Esto es crucial porque si la cookie de sesión original (authToken) tiene SameSite=Strict,
            // el navegador NO la enviará en la redirección inmediata tras volver de un dominio externo (AXpert).
            // Al cargar una página intermedia y hacer la navegación por JS/Meta, se restablece el contexto Same-Site.

            const response = new NextResponse(
                `<!DOCTYPE html>
                <html>
                <head>
                    <meta http-equiv="refresh" content="0;url=/?linked=success">
                    <title>Redirigiendo...</title>
                </head>
                <body>
                    <script>window.location.href = '/?linked=success';</script>
                </body>
                </html>`,
                {
                    status: 200,
                    headers: { 'Content-Type': 'text/html' }
                }
            );

            const cookieOptions = {
                httpOnly: true,  // ✅ SEGURIDAD: Protección contra XSS
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const,
                maxAge: 60 * 60 * 4,
                path: '/',
            };

            // Recargar userData con la nueva info
            if (updatedUser) {
                response.cookies.set('userData', JSON.stringify({
                    id: updatedUser.id,
                    username: updatedUser.username,
                    firstName: updatedUser.first_name,
                    lastName: updatedUser.last_name,
                    rol: updatedUser.rol,
                    email: axpertProfile.email, // Mostramos el de AXpert inmediatamente
                    oauthProvider: 'axpert',
                    loginMethod: 'axpert', // Indica que se usó el método de login a través de AXpert
                }), cookieOptions);
            }

            // Guardar avatar de AXpert
            response.cookies.set('axpert_profile', JSON.stringify({
                avatarUrl: axpertProfile.avatar_url,
                email: axpertProfile.email,
                firstName: axpertProfile.first_name,
                lastName: axpertProfile.last_name,
            }), cookieOptions);

            response.cookies.set('axpert_avatar_url', axpertProfile.avatar_url || '', cookieOptions);

            // Limpiar estado
            response.cookies.delete('oauth_state');
            response.cookies.delete('oauth_code_verifier');

            return response;
        }

        // =================================================================================
        // FLUJO NORMAL DE LOGIN / REGISTRO
        // =================================================================================

        // 1. INTENTO PRIMARIO: Buscar por ID de usuario OAuth (Independiente del email)
        const { data: linkedUser, error: linkedError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('oauth_user_id', axpertProfile.id)
            .eq('oauth_provider', 'axpert')
            .single();

        let localUser = linkedUser;

        // 2. INTENTO SECUNDARIO: Si no hay cuenta vinculada, buscar por EMAIL
        if (!localUser) {
            const { data: emailUser, error: emailError } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('email', axpertProfile.email)
                .single();

            if (emailUser) {
                localUser = emailUser;
                // Auto-vinculación silenciosa si coincide el email
                await supabaseAdmin.from('users').update({
                    oauth_provider: 'axpert',
                    oauth_user_id: axpertProfile.id
                }).eq('id', localUser.id);
            }
        }

        // Si el usuario NO existe, crearlo
        if (!localUser) {
            // Verificar primero si el ID ya existe en public.users (caso raro de ID colisionando)
            const { data: idCollisionUser } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('id', axpertProfile.id)
                .single();

            if (idCollisionUser) {
                // Si existe por ID, lo usamos y actualizamos sus datos de oauth
                localUser = idCollisionUser;
                await supabaseAdmin.from('users').update({
                    oauth_provider: 'axpert',
                    oauth_user_id: axpertProfile.id
                }).eq('id', localUser.id);
            } else {
                // PROCEDER CON CREACIÓN NUEVA

                // 1. Asegurar auth.users
                const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                    axpertProfile.id,
                    {
                        user_metadata: {
                            first_name: axpertProfile.first_name,
                            last_name: axpertProfile.last_name,
                            avatar_url: axpertProfile.avatar_url,
                        }
                    }
                );

                if (updateError) {
                    await supabaseAdmin.auth.admin.createUser({
                        id: axpertProfile.id,
                        email: axpertProfile.email,
                        email_confirm: true,
                        user_metadata: {
                            first_name: axpertProfile.first_name,
                            last_name: axpertProfile.last_name,
                            avatar_url: axpertProfile.avatar_url,
                        }
                    });
                }

                // Generar username
                const username = axpertProfile.email.split('@')[0];

                const { data: newUser, error: createError } = await supabaseAdmin
                    .from('users')
                    .insert({
                        id: axpertProfile.id,
                        email: axpertProfile.email,
                        username: username,
                        first_name: axpertProfile.first_name,
                        last_name: axpertProfile.last_name,
                        oauth_provider: 'axpert',
                        oauth_user_id: axpertProfile.id,
                        rol: null,
                        is_active: false,
                        pending_approval: true,
                    })
                    .select()
                    .single();

                if (createError) {
                    return NextResponse.redirect(
                        new URL('/login?error=Error creando usuario', request.url)
                    );
                }
                localUser = newUser;
            }
        } else {
            // Si el usuario ya existe, actualizamos metadata
            const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
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
                httpOnly: true,  // ✅ SEGURIDAD: Protección contra XSS
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
            response.cookies.set('axpert_avatar_url', axpertProfile.avatar_url || '', cookieOptions);

            response.cookies.delete('oauth_state');
            response.cookies.delete('oauth_code_verifier');

            return response;
        }

        // Usuario existe y está activo - Login exitoso
        const response = NextResponse.redirect(new URL('/', request.url));

        const cookieOptions = {
            httpOnly: true,  // ✅ SEGURIDAD: Protección contra XSS
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            maxAge: 60 * 60 * 4,
            path: '/',
        };
        
        // Token de acceso (NO HttpOnly para permitir Realtime)
        response.cookies.set('sb-access-token', access_token, {
            httpOnly: false, // NO HttpOnly para Realtime
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const, // LAX para permitir cookies en redirects desde OAuth
            maxAge: 60 * 60 * 4,
            path: '/',
        });

        if (refresh_token) {
            response.cookies.set('sb-refresh-token', refresh_token, {
                httpOnly: false, // NO HttpOnly para Realtime
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const, // LAX para permitir cookies en redirects desde OAuth
                maxAge: 60 * 60 * 24 * 30,
                path: '/',
            });
        }

        if (id_token) {
            response.cookies.set('idToken', id_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict' as const,
                maxAge: 60 * 60 * 4,
                path: '/',
            });
        }

        // Guardar información del usuario local + perfil de AXpert (HttpOnly)
        response.cookies.set('userData', JSON.stringify({
            id: localUser.id,
            username: localUser.username,
            firstName: axpertProfile.first_name,
            lastName: axpertProfile.last_name,
            rol: localUser.rol,
            email: axpertProfile.email,
            oauthProvider: 'axpert',
            loginMethod: 'axpert',
        }), cookieOptions);

        // Guardar el perfil de AXpert para acceso al avatar
        // Ahora con HttpOnly para proteger datos del perfil externo
        response.cookies.set('axpert_profile', JSON.stringify({
            avatarUrl: axpertProfile.avatar_url,
            email: axpertProfile.email,
            firstName: axpertProfile.first_name,
            lastName: axpertProfile.last_name,
        }), cookieOptions);

        // Cookie de avatar ahora con HttpOnly
        response.cookies.set('axpert_avatar_url', axpertProfile.avatar_url || '', cookieOptions);

        response.cookies.delete('oauth_state');
        response.cookies.delete('oauth_code_verifier');
        
        return response;

    } catch (error) {
        console.error('Error in AXpert callback:', error);
        return NextResponse.redirect(
            new URL('/login?error=Authentication failed', request.url)
        );
    }
}
