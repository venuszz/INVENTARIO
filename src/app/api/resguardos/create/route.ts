import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * API Route to create resguardos using service role key
 * This bypasses RLS policies to ensure resguardos can be created
 */
export async function POST(request: Request) {
  try {
    const { resguardos, userId } = await request.json();

    if (!resguardos || !Array.isArray(resguardos) || resguardos.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid resguardos array' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Validate all required fields (resguardante is optional)
    for (const resguardo of resguardos) {
      if (!resguardo.folio || !resguardo.f_resguardo || !resguardo.id_directorio || 
          !resguardo.id_mueble || !resguardo.origen || !resguardo.puesto_resguardo) {
        console.error('Missing required fields:', {
          folio: !!resguardo.folio,
          f_resguardo: !!resguardo.f_resguardo,
          id_directorio: !!resguardo.id_directorio,
          id_mueble: !!resguardo.id_mueble,
          origen: !!resguardo.origen,
          puesto_resguardo: !!resguardo.puesto_resguardo,
          resguardante: !!resguardo.resguardante
        });
        return NextResponse.json(
          { error: 'Missing required fields in resguardo data' },
          { status: 400 }
        );
      }
    }

    // Add created_by to all resguardos
    const resguardosWithUser = resguardos.map(r => ({
      ...r,
      created_by: userId
    }));

    // Insert all resguardos and fetch with director relation
    const { data, error } = await supabase
      .from('resguardos')
      .insert(resguardosWithUser)
      .select(`
        *,
        directorio!inner (
          nombre
        )
      `);

    if (error) {
      console.error('Error creating resguardos:', error);
      return NextResponse.json(
        { error: 'Failed to create resguardos', details: error.message },
        { status: 500 }
      );
    }

    // Map the data to include director_nombre
    const mappedData = (data || []).map((record: any) => {
      const { directorio, ...rest } = record;
      return {
        ...rest,
        director_nombre: directorio?.nombre || ''
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: mappedData,
      count: mappedData.length
    });
  } catch (error: any) {
    console.error('Unexpected error in resguardos create API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
