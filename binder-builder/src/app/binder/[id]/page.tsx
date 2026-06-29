import { supabase } from '@/src/lib/supabase'; // 👈 Usamos el cliente único y corregido de tu proyecto
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PokemonCard {
  id: string;
  name: string;
  images: { small: string };
  marketPrice: number;
  set: string;
  rarity: string;
}

interface BinderSlot {
  card: PokemonCard;
  quantity: number;
  condition: 'NM' | 'LP' | 'HP';
  score: string;
  isReserved: boolean;
  notes: string;
}

// 1. Traer los datos directamente de Supabase usando el cliente seguro
async function getBinderData(id: string) {
  try {
    const { data, error } = await supabase
      .from('binders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data;
  } catch (e) {
    console.error("Error cargando binder:", e);
    return null;
  }
}

export default async function BinderPublicPage(props: { params: Promise<{ id: string }> }) {
  // 1. Esperamos de forma segura a que los parámetros de la URL existan
  const params = await props.params;
  const id = params.id;
  
  // 2. Ahora que tenemos el ID real, mandamos a pedir los datos a Supabase
  const binder = await getBinderData(id);

  // Si el binder no existe en la base de datos, manda al 404
  if (!binder) {
    notFound();
  }
  
  // ... el resto de tu código igual hacia abajo ...

  const { rows, cols, grid_data } = binder;
  const grid = grid_data as (BinderSlot | null)[];

  // Calcular el valor total de esta carpeta específica
  const totalValue = grid.reduce((acc, slot) => {
    if (slot && slot.card?.marketPrice) return acc + (slot.card.marketPrice * slot.quantity);
    return acc;
  }, 0);

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-6 font-sans select-none">
      
      {/* CABECERA PÚBLICA */}
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl p-5 flex justify-between items-center shadow-xl gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Colección Compartida</h1>
          <p className="text-xs text-gray-400 mt-1">Catálogo de cartas en tiempo real</p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 px-5 py-2 rounded-xl text-right">
          <span className="text-[10px] text-yellow-400 font-bold block uppercase tracking-wider">Valor Estimado</span>
          <span className="text-2xl font-black text-yellow-400">${totalValue.toFixed(2)} USD</span>
        </div>
      </div>

      {/* CUADRÍCULA DE CARTAS (SOLO LECTURA) */}
      <div 
        className="grid gap-4 bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-2xl w-full max-w-2xl"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: rows * cols }).map((_, index) => {
          const slot = grid[index];
          
          return (
            <div
              key={index}
              className={`aspect-[2.5/3.5] bg-gray-950 border rounded-xl flex flex-col items-center justify-center overflow-hidden relative border-gray-800 shadow-inner group`}
            >
              {slot && slot.card ? (
                <>
                  <img src={slot.card.images?.small} alt={slot.card.name} className="w-full h-full object-cover animate-fade-in" />
                  
                  {/* Cantidad */}
                  <div className="absolute top-2 right-2 bg-yellow-400 text-gray-950 text-[10px] font-black px-1.5 py-0.5 rounded shadow-md z-10">
                    x{slot.quantity}
                  </div>

                  {/* Estado / Score */}
                  {!slot.isReserved && slot.score && (
                    <div className="absolute top-2 left-2 bg-gray-950/80 backdrop-blur-xs text-[9px] font-bold px-1 rounded border border-gray-800 text-yellow-400">
                      {slot.score}
                    </div>
                  )}

                  {/* Reservada */}
                  {slot.isReserved && (
                    <div className="absolute inset-0 bg-red-950/50 backdrop-blur-[1px] flex items-center justify-center z-20">
                      <span className="bg-red-600 text-white font-black text-[9px] uppercase px-2 py-0.5 rounded-md shadow-lg tracking-wider transform -rotate-12">RESERVADA</span>
                    </div>
                  )}

                  {/* TOOLTIP CON DETALLES AL PASAR EL RATÓN */}
                  {slot.notes && (
                    <div className="absolute inset-x-0 bottom-0 bg-gray-950/90 backdrop-blur-xs p-2 text-[10px] border-t border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-300 max-h-[40%] overflow-y-auto">
                      <p className="font-bold text-[9px] text-yellow-400 uppercase tracking-wider mb-0.5">Nota:</p>
                      {slot.notes}
                    </div>
                  )}
                </>
              ) : (
                <span className="text-gray-900 text-xs font-medium">Vacío</span>
              )}
            </div>
          );
        })}
      </div>
      
      <footer className="mt-8 text-[11px] text-gray-600 tracking-wide">
        Creado con Mi Carpeta Virtual Pokémon
      </footer>
    </main>
  );
}