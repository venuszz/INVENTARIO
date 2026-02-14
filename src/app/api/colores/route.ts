import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * API Route to fetch colors using service role key
 * This bypasses RLS policies to ensure color data is always accessible
 */
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data, error } = await supabase
      .from('colores')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error fetching colors:', error);
      return NextResponse.json(
        { error: 'Failed to fetch colors', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ colors: data || [] });
  } catch (error: any) {
    console.error('Unexpected error in colors API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * API Route to assign a color to a mueble using service role key
 * This bypasses RLS policies
 */
export async function POST(request: Request) {
  try {
    const { muebleId, colorId } = await request.json();

    if (!muebleId || !colorId) {
      return NextResponse.json(
        { error: 'Missing required fields: muebleId and colorId' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: existingRecord, error: fetchError } = await supabase
      .from('mueblesitea')
      .select('id, id_inv, color')
      .eq('id', muebleId)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json(
        { error: 'Mueble not found', details: fetchError?.message },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('mueblesitea')
      .update({ color: colorId })
      .eq('id', muebleId)
      .select();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to assign color', details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No rows updated' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * API Route to remove a color from a mueble using service role key
 * This bypasses RLS policies
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const muebleId = searchParams.get('muebleId');

    if (!muebleId) {
      return NextResponse.json(
        { error: 'Missing required parameter: muebleId' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: existingRecord, error: fetchError } = await supabase
      .from('mueblesitea')
      .select('id, id_inv, color')
      .eq('id', muebleId)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json(
        { error: 'Mueble not found', details: fetchError?.message },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('mueblesitea')
      .update({ color: null })
      .eq('id', muebleId)
      .select();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to remove color', details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No rows updated' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
