// app/lib/models/Sequence.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface ISequence extends Document {
  _id: string; // Por ejemplo, la ubicación
  sequenceValue: number;
}

const SequenceSchema: Schema = new Schema({
  _id: { type: String, required: true },
  sequenceValue: { type: Number, default: 0 },
});

export default mongoose.models.Sequence || mongoose.model<ISequence>('Sequence', SequenceSchema);
