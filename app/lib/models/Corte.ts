import mongoose, { Schema, Document } from 'mongoose';

export interface ICorte extends Document {
  location: string;
  date: Date;
  expectedCash: number;
  expectedCard: number;
  actualCash: number;
  actualCard: number;
  totalTickets: number;
}

const CorteSchema: Schema = new Schema({
  location: { type: String, required: true },
  date: { type: Date, required: true },
  expectedCash: { type: Number, required: true },
  expectedCard: { type: Number, required: true },
  actualCash: { type: Number, required: true },
  actualCard: { type: Number, required: true },
  totalTickets: { type: Number, required: true }
});

export default mongoose.models.Corte || mongoose.model<ICorte>('Corte', CorteSchema);