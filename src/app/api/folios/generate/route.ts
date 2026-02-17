import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente admin que bypassa RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  console.log('🚀 [API FOLIOS] Iniciando POST /api/folios/generate');
  
  try {
    // Verificar autenticación
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    
    console.log('🔐 [API FOLIOS] Verificando autenticación:', { hasToken: !!accessToken });
    
    if (!accessToken) {
      console.error('❌ [API FOLIOS] No autenticado');
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { tipo } = await request.json();
    console.log('📋 [API FOLIOS] Tipo de folio solicitado:', tipo);

    if (!tipo || !['RESGUARDO', 'BAJA'].includes(tipo)) {
      console.error('❌ [API FOLIOS] Tipo de folio inválido:', tipo);
      return NextResponse.json(
        { error: 'Tipo de folio inválido' },
        { status: 400 }
      );
    }

    // Llamar a la función de PostgreSQL que maneja la atomicidad
    console.log('🔢 [API FOLIOS] Llamando a generar_folio con tipo:', tipo);
    const { data, error } = await supabaseAdmin
      .rpc('generar_folio', { p_tipo: tipo });

    if (error) {
      console.error('❌ [API FOLIOS] Error de Supabase:', error);
      console.error('📊 [API FOLIOS] Detalles del error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json(
        { error: 'Error al generar folio' },
        { status: 500 }
      );
    }

    if (!data) {
      console.error('❌ [API FOLIOS] No se recibió folio de la base de datos');
      return NextResponse.json(
        { error: 'No se recibió folio de la base de datos' },
        { status: 500 }
      );
    }

    console.log('✅ [API FOLIOS] Folio generado exitosamente:', data);
    return NextResponse.json({ folio: data });
  } catch (error) {
    console.error('❌ [API FOLIOS] Error crítico:', error);
    console.error('📊 [API FOLIOS] Detalles del error:', {
      message: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
