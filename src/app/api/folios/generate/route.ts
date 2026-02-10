import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente admin que bypassa RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { tipo } = await request.json();

    if (!tipo || !['RESGUARDO', 'BAJA'].includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo de folio inválido' },
        { status: 400 }
      );
    }

    // Llamar a la función de PostgreSQL que maneja la atomicidad
    const { data, error } = await supabaseAdmin
      .rpc('generar_folio', { p_tipo: tipo });

    if (error) {
      console.error('[API Folios Generate] Error:', error);
      return NextResponse.json(
        { error: 'Error al generar folio' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'No se recibió folio de la base de datos' },
        { status: 500 }
      );
    }

    return NextResponse.json({ folio: data });
  } catch (error) {
    console.error('[API Folios Generate] Error crítico:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
