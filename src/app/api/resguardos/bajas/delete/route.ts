import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side Supabase client with service role (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function DELETE(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { type, folioResguardo, ids, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no válido' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Tipo de eliminación no especificado' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'folio':
        if (!folioResguardo) {
          return NextResponse.json(
            { error: 'Folio de resguardo no especificado' },
            { status: 400 }
          );
        }
        
        result = await supabaseAdmin
          .from('resguardos_bajas')
          .delete()
          .eq('folio_resguardo', folioResguardo);
        break;

      case 'selected':
      case 'single':
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          return NextResponse.json(
            { error: 'IDs no especificados' },
            { status: 400 }
          );
        }
        
        result = await supabaseAdmin
          .from('resguardos_bajas')
          .delete()
          .in('id', ids);
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de eliminación no válido' },
          { status: 400 }
        );
    }

    if (result.error) {
      console.error('Error al eliminar:', result.error);
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Eliminación exitosa' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error en DELETE /api/resguardos/bajas/delete:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
