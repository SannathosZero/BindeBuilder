'use client';
import { useState } from 'react';

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
  score: string;        // Nota numérica (ej: "10/10")
  isReserved: boolean;  // Si está reservada
  notes: string;        // Comentarios o detalles extras
}

export default function Home() {
  const [rows, setRows] = useState<number>(3);
  const [cols, setCols] = useState<number>(3);
  // Inicializamos con el tamaño justo para 3x3 (9 slots)
  const [grid, setGrid] = useState<(BinderSlot | null)[]>(Array(9).fill(null));
  const [shareLink, setShareLink] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Estados del Buscador
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<PokemonCard[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  // Buscar cartas en la API con triple filtro para evitar precios en 0
  const searchCards = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=name:${encodeURIComponent(`"${searchTerm}*"`)}&pageSize=12`
      );
      const data = await response.json();
      
      const cards = data.data.map((card: any) => {
        let price = 0;

        // 1. Intentar extraer de TCGPlayer (Mercado Americano)
        if (card.tcgplayer?.prices) {
          const priceTypes = Object.values(card.tcgplayer.prices);
          for (const type of priceTypes as any[]) {
            if (type && type.market && type.market > 0) {
              price = type.market;
              break;
            }
          }
        }

        // 2. Si sigue en 0, intentar extraer de Cardmarket (Mercado Europeo/General)
        if (price === 0 && card.cardmarket?.prices) {
          const cmPrices = card.cardmarket.prices;
          price = cmPrices.averageArticlesPrice || cmPrices.trendPrice || cmPrices.lowPrice || 0;
        }

        // 3. Respaldo crítico para cartas viejas, megas o promocionales sin mercado activo
        if (price === 0 && card.tcgplayer?.prices) {
          const subPrices = Object.values(card.tcgplayer.prices);
          const validSubPrices = subPrices
            .map((p: any) => p?.mid || p?.high || p?.low || 0)
            .filter((p) => p > 0);
          
          if (validSubPrices.length > 0) {
            price = validSubPrices[0];
          }
        }

        return {
          id: card.id,
          name: card.name,
          images: { small: card.images.small },
          marketPrice: price,
          set: card.set?.name || 'Desconocido',
          rarity: card.rarity || 'Común'
        };
      });
      
      setSearchResults(cards);
    } catch (error) {
      console.error("Error buscando cartas:", error);
    } finally {
      setLoading(false);
    }
  };

  // 💾 FUNCIÓN DE GUARDADO CORREGIDA Y VINCULADA AL ESTADO REAL
  const saveBinder = async () => {
    // Validar que haya al menos una carta para no guardar carpetas vacías
    const hasCards = grid.some(slot => slot !== null);
    if (!hasCards) {
      alert("Agrega al menos una carta a tu carpeta antes de generar el link.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/binder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Enviamos las variables reales del creador estructuradas para Supabase
        body: JSON.stringify({
          rows: rows,
          cols: cols,
          grid_data: grid
        }),
      });
      
      const data = await response.json();

      if (response.ok && data.id) {
        const url = `${window.location.origin}/binder/${data.id}`;
        setShareLink(url);
      } else {
        throw new Error(data.error || "No se pudo obtener el ID de la carpeta");
      }
    } catch (error: any) {
      console.error("Error al guardar en Supabase:", error);
      alert(`Error al guardar: ${error.message || 'Inténtalo de nuevo.'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSlotClick = (index: number) => {
    setSelectedSlot(index);
  };

  const handleSelectCard = (card: PokemonCard) => {
    if (selectedSlot === null) return;
    const newGrid = [...grid];
    newGrid[selectedSlot] = { 
      card, 
      quantity: 1, 
      condition: 'NM',
      score: '10/10',
      isReserved: false,
      notes: ''
    };
    setGrid(newGrid);
  };

  const updateSlotField = (index: number, field: keyof BinderSlot, value: any) => {
    const newGrid = [...grid];
    const currentSlot = newGrid[index];
    if (!currentSlot) return;

    if (field === 'quantity' && value <= 0) {
      newGrid[index] = null;
      setSelectedSlot(null);
    } else {
      newGrid[index] = { ...currentSlot, [field]: value };
    }
    setGrid(newGrid);
  };

  const calculateTotalValue = () => {
    return grid.reduce((acc, slot) => {
      if (slot) {
        return acc + (slot.card.marketPrice * slot.quantity);
      }
      return acc;
    }, 0);
  };

  // Ajustar el array del grid dinámicamente si cambian las filas/columnas
  const handleDimensionChange = (newRows: number, newCols: number) => {
    setRows(newRows);
    setCols(newCols);
    const newSize = newRows * newCols;
    setGrid(prev => {
      if (prev.length === newSize) return prev;
      if (prev.length < newSize) {
        return [...prev, ...Array(newSize - prev.length).fill(null)];
      }
      return prev.slice(0, newSize);
    });
    setSelectedSlot(null);
  };

  const activeSlotData = selectedSlot !== null ? grid[selectedSlot] : null;

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row p-6 font-sans gap-6 select-none relative overflow-x-hidden">
      
      {/* PANEL IZQUIERDO: Buscador */}
      <div className="w-full md:w-80 bg-gray-900 p-4 rounded-2xl border border-gray-800 flex flex-col gap-4 shadow-xl shrink-0">
        <h2 className="text-xl font-bold text-yellow-400">Buscador Pokémon</h2>
        
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Ej: M Charizard, Gengar..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchCards()}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400 text-white"
          />
          <button 
            onClick={searchCards}
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm transition-all shadow-md"
          >
            {loading ? '...' : 'Buscar'}
          </button>
        </div>

        {/* Resultados */}
        <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[65vh] pr-1">
          {searchResults.map((card) => (
            <div 
              key={card.id} 
              onClick={() => handleSelectCard(card)}
              className={`cursor-pointer rounded-md overflow-hidden border-2 border-transparent hover:border-yellow-400 transition-all transform hover:scale-105 active:scale-95 ${selectedSlot === null && 'opacity-30 cursor-not-allowed'}`}
            >
              <img src={card.images.small} alt={card.name} className="w-full h-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* PANEL CENTRAL: Carpeta Virtual */}
      <div className="flex-1 flex flex-col items-center gap-4 transition-all duration-300">
        
        {/* Cabecera Principal */}
        <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl p-4 flex justify-between items-center shadow-xl gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <h1 className="text-2xl font-bold text-gray-100">Mi Carpeta Virtual</h1>
            
            {shareLink ? (
              <div className="flex flex-col gap-1 bg-gray-950 p-2 rounded-xl border border-gray-800 max-w-xs">
                <span className="text-[10px] text-green-400 font-bold">¡LINK PÚBLICO GENERADO! 👇</span>
                <div className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    readOnly 
                    value={shareLink} 
                    className="bg-transparent text-xs text-gray-300 outline-none w-full truncate"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink);
                      alert("¡Enlace copiado al portapapeles!");
                    }}
                    className="bg-gray-900 hover:bg-gray-800 text-[10px] px-2 py-1 rounded border border-gray-700 font-bold text-yellow-400 transition-colors shrink-0"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={saveBinder}
                disabled={saving}
                className="bg-green-600 hover:bg-green-500 disabled:bg-gray-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md w-fit"
              >
                {saving ? 'Guardando en Supabase...' : '🌐 Generar Link Público'}
              </button>
            )}
            <p className="text-xs text-gray-400 mt-1">Toca un espacio para editar sus detalles</p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 px-5 py-2 rounded-xl text-right shrink-0">
            <span className="text-[10px] text-yellow-400 font-bold block uppercase tracking-wider">Valor Total</span>
            <span className="text-2xl font-black text-yellow-400">${calculateTotalValue().toFixed(2)} USD</span>
          </div>
        </div>
        
        {/* Dimensiones */}
        <div className="flex gap-6 bg-gray-900 px-4 py-2 rounded-xl border border-gray-800 text-xs text-gray-400 shadow-inner">
          <label className="flex items-center gap-2">Filas: <span className="text-yellow-400 font-bold">{rows}</span> <input type="range" min="1" max="4" value={rows} onChange={(e) => handleDimensionChange(Number(e.target.value), cols)} className="accent-yellow-400 cursor-pointer" /></label>
          <label className="flex items-center gap-2">Columnas: <span className="text-yellow-400 font-bold">{cols}</span> <input type="range" min="