import { createClient } from '@supabase/supabase-js';

// 1. Leemos las variables con los nombres que dejamos configurados en Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

// 2. Validación para que Next.js no se queje al compilar
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERROR: Faltan variables de entorno en lib/supabase.ts');
}

// 3. Exportamos el cliente seguro para usarlo en todo el proyecto
export const supabase = createClient(supabaseUrl!, supabaseServiceKey!);