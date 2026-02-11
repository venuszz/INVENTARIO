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
