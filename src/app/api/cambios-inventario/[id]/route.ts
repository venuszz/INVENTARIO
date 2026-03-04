import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/cambios-inventario/[id]
 * Retrieves change history for a specific inventory item
 * Uses service role key to bypass RLS
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idMueble } = await params;
    const { searchParams } = new URL(request.url);
    const tablaOrigen = searchParams.get('tabla_origen');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!idMueble) {
      return NextResponse.json(
        { error: 'ID de mueble requerido' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Build query for change history
    let query = supabase
      .from('cambios_inventario')
      .select('*')
      .eq('id_mueble', idMueble)
      .order('fecha_cambio', { ascending: false })
      .limit(limit);

    if (tablaOrigen) {
      query = query.eq('tabla_origen', tablaOrigen);
    }

    const { data: cambios, error } = await query;

    if (error) {
      console.error('❌ [API] Error fetching change history:', error);
      return NextResponse.json(
        { error: 'Error al obtener historial de cambios', details: error.message },
        { status: 500 }
      );
    }

    // Get unique user IDs
    const userIds = [...new Set(cambios?.map(c => c.usuario_id).filter(Boolean) || [])];

    // Fetch user information from public.users table
    let usersData: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      if (!usersError && users) {
        usersData = Object.fromEntries(users.map(u => [u.id, u]));
      }
    }

    // Merge user data with change history
    const dataWithUsers = cambios?.map(cambio => ({
      ...cambio,
      usuario: cambio.usuario_id ? usersData[cambio.usuario_id] : null
    })) || [];

    console.log(`✅ [API] Retrieved ${dataWithUsers.length} change records for item ${idMueble}`);

    return NextResponse.json({
      success: true,
      count: dataWithUsers.length,
      data: dataWithUsers
    });

  } catch (error: any) {
    console.error('❌ [API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
