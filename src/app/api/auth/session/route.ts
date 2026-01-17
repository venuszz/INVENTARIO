import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/session
 * 
 * Endpoint seguro para obtener información de la sesión del usuario.
 * Lee cookies HttpOnly del servidor y retorna datos seguros al cliente.
 * 
 * Este endpoint reemplaza la lectura directa de cookies desde JavaScript,
 * protegiendo contra ataques XSS.
 */
export async function GET(request: NextRequest) {
  // Leer cookies HttpOnly del servidor
  const userDataCookie = request.cookies.get('userData')?.value;
  const pendingUserCookie = request.cookies.get('pendingUser')?.value;
  const axpertProfileCookie = request.cookies.get('axpert_profile')?.value;
  const axpertAvatarCookie = request.cookies.get('axpert_avatar_url')?.value;
  
  // Si no hay cookie de userData, verificar si hay usuario pendiente
  if (!userDataCookie) {
    // Verificar si hay usuario pendiente
    if (pendingUserCookie) {
      try {
        const pendingUser = JSON.parse(pendingUserCookie);
        return NextResponse.json({ 
          user: null,
          pendingUser: {
            email: pendingUser.email,
            firstName: pendingUser.firstName,
            lastName: pendingUser.lastName,
            avatarUrl: pendingUser.avatarUrl
          },
          axpertProfile: null,
          isAuthenticated: false 
        });
      } catch (error) {
        console.error('Error parsing pendingUser cookie:', error);
      }
    }
    
    return NextResponse.json({ 
      user: null,
      pendingUser: null,
      axpertProfile: null,
      isAuthenticated: false 
    });
  }
  
  try {
    // Parsear datos del usuario
    const userData = JSON.parse(userDataCookie);
    
    // Parsear perfil de AXpert si existe
    let axpertProfile = null;
    if (axpertProfileCookie) {
      try {
        axpertProfile = JSON.parse(axpertProfileCookie);
      } catch (parseError) {
        // Si falla el parsing del perfil, continuar sin él
        axpertProfile = null;
      }
    }
    
    // Si no hay perfil parseado pero hay avatar URL, crear objeto básico
    if (!axpertProfile && axpertAvatarCookie) {
      axpertProfile = {
        avatarUrl: axpertAvatarCookie
      };
    }
    
    // Retornar datos de sesión
    return NextResponse.json({
      user: {
        id: userData.id,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        rol: userData.rol,
        oauthProvider: userData.oauthProvider,
        loginMethod: userData.loginMethod,
      },
      pendingUser: null,
      axpertProfile,
      isAuthenticated: true
    });
    
  } catch (error) {
    // Si hay error parseando las cookies, considerarlas inválidas
    console.error('Error parsing session cookies:', error);
    
    return NextResponse.json({ 
      user: null,
      pendingUser: null,
      axpertProfile: null,
      isAuthenticated: false,
      error: 'INVALID_SESSION'
    }, { status: 401 });
  }
}
