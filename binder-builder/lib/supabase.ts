import { createClient } from '@supabase/supabase-js';

// Extraemos las variables dinámicamente o usamos un fallback string vacío para evitar que explote la carga inicial
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ [Supabase] Alerta: Las variables de entorno no están cargadas en este cliente. Asegúrate de reiniciar tu terminal con npm run dev."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);