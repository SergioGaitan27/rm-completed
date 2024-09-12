// app/models/Pedido.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPedido extends Document {
  pedidos: Array<{
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

const PedidoSchema: Schema = new Schema({
  pedidos: [{
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

export default mongoose.models.Pedido || mongoose.model<IPedido>('Pedido', PedidoSchema);