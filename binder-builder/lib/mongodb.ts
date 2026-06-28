import mongoose from 'mongoose';

// Cambia 'tu_usuario', 'tu_password' y 'tu_cluster' por tu cadena de conexión gratuita de MongoDB Atlas
const MONGODB_URI = 'mongodb+srv://tu_usuario:tu_password@tu_cluster.mongodb.net/pokemon_db?retryWrites=true&w=majority';

if (!MONGODB_URI) {
  throw new Error('Por favor define la variable MONGODB_URI');
}

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  return mongoose.connect(MONGODB_URI);
}

// Definimos el esquema de la carpeta (Binder) libre de restricciones de Supabase
const BinderSchema = new mongoose.Schema({
  rows: Number,
  cols: Number,
  grid_data: mongoose.Schema.Types.Mixed, // Esto acepta cualquier objeto JSON que le mandes (tus cartas)
}, { timestamps: true });

// Exportamos el modelo
export const Binder = mongoose.models.Binder || mongoose.model('Binder', BinderSchema);