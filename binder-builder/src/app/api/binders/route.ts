import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 1. AQUÍ ESTÁ EL ARREGLO: Agrega esta línea que lee la URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
// 2. Asegúrate de usar el nombre correcto que configuramos
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY ?? '';

// 3. Ahora esta validación no dará error porque ambas variables existen arriba:
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERROR: Faltan variables de entorno');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✓' : '✗');
}

// Asegúrate de que el cliente use las variables correctas aquí abajo también:
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('📝 Guardando en Supabase:', { rows: body.rows, cols: body.cols });

    // Insertamos los datos directamente en la tabla binders de Supabase
    const { data, error } = await supabase
      .from('binders')
      .insert([
        {
          rows: body.rows,
          cols: body.cols,
          grid_data: body.grid, // Supabase acepta el JSON directo si la columna es tipo jsonb
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Error de Supabase:', error);
      throw error;
    }

    console.log('✅ Guardado exitosamente con ID:', data.id);
    
    // Retornamos el id autogenerado (puede ser un número o un UUID)
    return NextResponse.json({ id: data.id });
  } catch (error: any) {
    console.error('❌ Error crítico en API Binders:', error);
    return NextResponse.json(
      { error: error.message || 'Error desconocido' }, 
      { status: 500 }
    );
  }
}