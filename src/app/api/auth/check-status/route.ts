import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/auth/check-status?userId=xxx
 * 
 * Endpoint para verificar el estado de aprobación de un usuario
 * sin necesidad de autenticación (usa service role key)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'userId es requerido' 
      }, { status: 400 });
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ 
        success: false, 
        error: 'Error de configuración del servidor' 
      }, { status: 500 });
    }
    
    // Crear cliente admin para consultar sin autenticación
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('is_active, pending_approval')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true,
      is_active: data.is_active,
      pending_approval: data.pending_approval
    });
    
  } catch (error) {
    console.error('Check status error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error al verificar estado' 
    }, { status: 500 });
  }
}
