import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente admin que bypassa RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tipo = searchParams.get('tipo') as 'RESGUARDO' | 'BAJA';

    if (!tipo) {
      return NextResponse.json(
        { error: 'Tipo de folio requerido' },
        { status: 400 }
      );
    }

    // Obtener el folio actual sin incrementar
    const { data, error } = await supabaseAdmin
      .from('folios')
      .select('prefijo, consecutivo')
      .eq('tipo', tipo)
      .single();

    if (error) {
      console.error('[API Folios Preview] Error:', error);
      return NextResponse.json(
        { error: 'Error al obtener folio' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: `No se encontró configuración para tipo: ${tipo}` },
        { status: 404 }
      );
    }

    const folio = `${data.prefijo}${data.consecutivo.toString().padStart(4, '0')}`;

    return NextResponse.json({ folio });
  } catch (error) {
    console.error('[API Folios Preview] Error crítico:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
