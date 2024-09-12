// app/models/Pedido.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IPedidos } from '@/app/types/product';

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
  date: { type: Date, default: Date.now },
  isSurtido: { type: Boolean, default: false }
});

export default mongoose.models.Pedido || mongoose.model<IPedidos>('Pedido', PedidoSchema);