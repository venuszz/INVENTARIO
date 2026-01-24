import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * 
 * Endpoint seguro para cerrar sesión.
 * Elimina todas las cookies de sesión del usuario.
 * 
 * Este endpoint asegura que todas las cookies (incluyendo HttpOnly)
 * sean eliminadas correctamente desde el servidor.
 */
export async function POST(request: NextRequest) {
  try {
    // Crear respuesta exitosa
    const response = NextResponse.json({ 
      success: true 
    });
    
    // Lista de todas las cookies de sesión a eliminar
    const cookiesToDelete = [
      'sb-access-token',
      'sb-refresh-token',
      'idToken',
      'userData',
      'axpert_profile',
      'axpert_avatar_url',
      'pending_user_info',
      // Cookies antiguas por si acaso
      'authToken',
      'refreshToken',
    ];
    
    // Eliminar cada cookie
    cookiesToDelete.forEach(cookieName => {
      response.cookies.delete(cookieName);
    });
    
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error al cerrar sesión' 
    }, { status: 500 });
  }
}
