import mongoose, { Schema, Document } from 'mongoose';

export interface ICashMovement extends Document {
  amount: number;
  concept: string;
  type: 'in' | 'out';
  date: Date;
  location: string; // Nuevo campo
}

const CashMovementSchema: Schema = new Schema({
  amount: { type: Number, required: true },
  concept: { type: String, required: true },
  type: { type: String, enum: ['in', 'out'], required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true }, // Nuevo campo
});

export default mongoose.models.CashMovement || mongoose.model<ICashMovement>('CashMovement', CashMovementSchema);
