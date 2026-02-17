import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function limpiarDatosArticulo(id_inv: string, origen: string): Promise<void> {
  const tabla = origen === 'ITEA' ? 'itea' : 
               origen === 'NO_LISTADO' || origen === 'TLAXCALA' ? 'mueblestlaxcala' : 
               'inea';
  
  await supabaseAdmin
    .from(tabla)
    .update({ 
      id_area: null,
      id_directorio: null
    })
    .eq('id_inv', id_inv);
}

export async function POST(request: Request) {
  try {
    const { bajasData, resguardosIds, mueblesData, deleteByFolio, folio, userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no válido' },
        { status: 400 }
      );
    }

    const bajasDataWithUser = bajasData.map((baja: any) => ({
      ...baja,
      created_by: userId
    }));

    const { data: insertedBajas, error: insertError } = await supabaseAdmin
      .from('resguardos_bajas')
      .insert(bajasDataWithUser)
      .select();

    if (insertError) {
      return NextResponse.json(
        { error: 'Error al insertar registros de baja', details: insertError.message },
        { status: 500 }
      );
    }

    if (deleteByFolio) {
      const { error: deleteError } = await supabaseAdmin
        .from('resguardos')
        .delete()
        .eq('folio', folio);

      if (deleteError) {
        return NextResponse.json(
          { error: 'Error al eliminar resguardos', details: deleteError.message },
          { status: 500 }
        );
      }
    } else {
      const { error: deleteError } = await supabaseAdmin
        .from('resguardos')
        .delete()
        .in('id', resguardosIds);

      if (deleteError) {
        return NextResponse.json(
          { error: 'Error al eliminar resguardos', details: deleteError.message },
          { status: 500 }
        );
      }
    }

    for (const mueble of mueblesData) {
      try {
        await limpiarDatosArticulo(mueble.id_inv, mueble.origen);
      } catch (cleanError) {
        // Continue even if cleanup fails
      }
    }

    return NextResponse.json({
      success: true,
      insertedCount: insertedBajas?.length || 0,
      message: 'Baja procesada correctamente'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al procesar la baja', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
