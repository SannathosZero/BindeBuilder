import { supabase } from '@/lib/supabase'; // 👈 Usamos el cliente único y centralizado
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('📝 Guardando en Supabase:', { rows: body.rows, cols: body.cols });

    const { data, error } = await supabase
      .from('binders')
      .insert([
        {
          rows: body.rows,
          cols: body.cols,
          grid_data: body.grid, 
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Error de Supabase:', error);
      throw error;
    }

    console.log('✅ Guardado exitosamente con ID:', data.id);
    return NextResponse.json({ id: data.id });
  } catch (error: any) {
    console.error('❌ Error crítico en API Binders:', error);
    return NextResponse.json(
      { error: error.message || 'Error desconocido' }, 
      { status: 500 }
    );
  }
}