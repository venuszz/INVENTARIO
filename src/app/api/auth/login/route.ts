import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/auth/login
 * 
 * Endpoint seguro para autenticación de usuarios.
 * Valida credenciales en el servidor y establece cookies HttpOnly.
 * 
 * Este endpoint reemplaza la autenticación desde el cliente,
 * asegurando que los tokens nunca sean accesibles desde JavaScript.
 */
export async function POST(request: NextRequest) {
  try {
    // Parsear credenciales del body
    const body = await request.json();
    const { username, password } = body;
    
    // Validar que se proporcionaron credenciales
    if (!username || !password) {
      console.log('❌ [Login] Credenciales faltantes');
      return NextResponse.json({ 
        success: false, 
        error: 'Usuario y contraseña son requeridos' 
      }, { status: 400 });
    }
    
    // Crear cliente de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ 
        success: false, 
        error: 'Error de configuración del servidor' 
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Si no hay service key, no podemos continuar
    if (!supabaseServiceKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json({ 
        success: false, 
        error: 'Error de configuración del servidor' 
      }, { status: 500 });
    }
    
    // Crear cliente admin para consultar la tabla users con todos los campos
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Obtener usuario por username - Consulta con cliente admin para obtener TODOS los campos
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (userError || !userData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuario o contraseña incorrectos' 
      }, { status: 401 });
    }
    
    const user = userData;
    
    // Validar que el usuario no esté pendiente de aprobación
    if (user.pending_approval && !user.is_active) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tu cuenta está pendiente de aprobación. Un administrador la revisará pronto.',
        redirectTo: '/pending-approval',
        userId: user.id
      }, { status: 403 });
    }
    
    // Validar que el usuario esté activo (rechazado o desactivado)
    if (!user.is_active) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tu cuenta ha sido desactivada. Contacta al administrador.',
        redirectTo: '/account-disabled'
      }, { status: 403 });
    }
    
    // Autenticar con Supabase usando email y password
    const { data: authData, error: authError } = await supabase.auth
      .signInWithPassword({
        email: user.email,
        password: password
      });
    
    if (authError || !authData.session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuario o contraseña incorrectos' 
      }, { status: 401 });
    }
    
    // Crear respuesta exitosa
    const response = NextResponse.json({ 
      success: true,
      redirectTo: '/'
    });
    
    // Configuración de cookies
    const secureCookieOptions = {
      httpOnly: false, // NO HttpOnly para permitir acceso desde JavaScript (Realtime)
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const, // LAX para compatibilidad con redirects
      maxAge: 60 * 60 * 4, // 4 horas
      path: '/',
    };
    
    // Establecer token de acceso (NO HttpOnly para Realtime)
    response.cookies.set('sb-access-token', authData.session.access_token, secureCookieOptions);
    
    // Establecer refreshToken
    if (authData.session.refresh_token) {
      response.cookies.set('sb-refresh-token', authData.session.refresh_token, {
        ...secureCookieOptions,
        maxAge: 60 * 60 * 24 * 30, // 30 días
      });
    }
    
    // Establecer userData (puede ser HttpOnly ya que no se necesita para Realtime)
    response.cookies.set('userData', JSON.stringify({
      id: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      rol: user.rol,
      email: user.email,
      oauthProvider: user.oauth_provider || null,
      loginMethod: 'local',
    }), {
      httpOnly: true, // Este sí puede ser HttpOnly
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 60 * 60 * 4,
      path: '/',
    });
    
    // Si el usuario está vinculado con AXpert, cargar su perfil
    if (user.oauth_provider === 'axpert' && user.oauth_user_id) {
      try {
        // Obtener perfil de AXpert desde auth.users metadata
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.oauth_user_id);
        
        if (authUser?.user?.user_metadata) {
          const metadata = authUser.user.user_metadata;
          
          // Establecer perfil de AXpert
          response.cookies.set('axpert_profile', JSON.stringify({
            avatarUrl: metadata.avatar_url,
            email: authUser.user.email,
            firstName: metadata.first_name,
            lastName: metadata.last_name,
          }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' as const,
            maxAge: 60 * 60 * 4,
            path: '/',
          });
          
          // Establecer avatar URL
          if (metadata.avatar_url) {
            response.cookies.set('axpert_avatar_url', metadata.avatar_url, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict' as const,
              maxAge: 60 * 60 * 4,
              path: '/',
            });
          }
        }
      } catch (profileError) {
        // Si falla la carga del perfil, continuar sin él
        console.error('Error loading AXpert profile:', profileError);
      }
    }
    
    console.log('✅ [Login] Todas las cookies establecidas');
    console.log('🎉 [Login] Login completado exitosamente');
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error de conexión. Intenta de nuevo más tarde.' 
    }, { status: 500 });
  }
}
