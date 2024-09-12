// app/models/Transfer.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ITransfer extends Document {
  transfers: Array<{
    productId: string;
    productName: string;
    productCode: string;
    boxCode: string;
    fromLocation: string;
    toLocation: string;
    quantity: number;
  }>;
  evidenceImageUrl: string;
  date: Date;
}

const TransferSchema: Schema = new Schema({
  transfers: [{
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    productCode: { type: String, required: true },
    boxCode: { type: String, required: true },
    fromLocation: { type: String, required: true },
    toLocation: { type: String, required: true },
    quantity: { type: Number, required: true }
  }],
  evidenceImageUrl: { type: String, required: false },
  date: { type: Date, default: Date.now }
});

export default mongoose.models.Transfer || mongoose.model<ITransfer>('Transfer', TransferSchema);