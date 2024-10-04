// app/lib/models/StockMovement.ts

import mongoose, { Document, Schema } from 'mongoose';

// Define los tipos posibles de movimiento
export type MovementType = 'sale' | 'restock' | 'return' | 'adjustment';

export interface IStockMovement extends Document {
  productId: mongoose.Types.ObjectId;
  quantityChange: number; // Negativo para deducciones, positivo para adiciones
  location: string;
  movementType: MovementType;
  ticketId?: string; // Opcional, referencia al ticket si aplica
  date: Date;
  performedBy?: string; // Opcional, ID del usuario que realizó el movimiento
}

const StockMovementSchema: Schema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantityChange: { type: Number, required: true },
  location: { type: String, required: true },
  movementType: { type: String, enum: ['sale', 'restock', 'return', 'adjustment'], required: true },
  ticketId: { type: String },
  date: { type: Date, default: Date.now },
  performedBy: { type: String }, // Puedes ajustar el tipo según tu sistema de usuarios
});

export default mongoose.models.StockMovement || mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
