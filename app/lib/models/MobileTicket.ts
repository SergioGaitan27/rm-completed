import mongoose, { Schema, Document } from 'mongoose';

export interface ITicketItem extends Document {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unitType: 'pieces' | 'boxes';
  pricePerUnit: number;
  costPerUnit: number;
  total: number;
  profit: number;
  piecesPerBox?: number;
}

export interface IMobileTicket extends Document {
  ticketId: string;
  location: string;
  sequenceNumber: number;
  customerName: string; // New field
  items: ITicketItem[];
  totalAmount: number;
  totalProfit: number;
  paymentType: 'cash' | 'card';
  amountPaid: number;
  change: number;
  date: Date;
  paymentStatus: 'unpaid' | 'paid';
  fulfillmentStatus: 'pending' | 'processing' | 'completed';
  deviceId: string;
  gpsCoordinates: {
    latitude: number;
    longitude: number;
  };
  employeeId: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  offlineCreated: boolean;
}

const TicketItemSchema: Schema = new Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitType: { type: String, enum: ['pieces', 'boxes'], required: true },
  pricePerUnit: { type: Number, required: true },
  costPerUnit: { type: Number, required: true },
  total: { type: Number, required: true },
  profit: { type: Number, required: true },
  piecesPerBox: { type: Number }
});

const MobileTicketSchema: Schema = new Schema({
  ticketId: { type: String, required: false, unique: true },
  location: { type: String, required: false },
  sequenceNumber: { type: Number, required: false },
  customerName: { type: String, required: false }, // New field
  items: [TicketItemSchema],
  totalAmount: { type: Number, required: false },
  totalProfit: { type: Number, required: false },
  paymentType: { type: String, enum: ['cash', 'card'], required: false },
  amountPaid: { type: Number, required: false },
  change: { type: Number, required: false },
  date: { type: Date, default: Date.now },
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid', required: false },
  fulfillmentStatus: { type: String, enum: ['pending', 'processing', 'completed'], default: 'pending', required: false },
  deviceId: { type: String, required: false },
  gpsCoordinates: {
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false }
  },
  employeeId: { type: String, required: false },
  syncStatus: { type: String, enum: ['pending', 'synced', 'failed'], default: 'pending', required: false },
  offlineCreated: { type: Boolean, default: false, required: false }
});

// Índices
MobileTicketSchema.index({ location: 1, sequenceNumber: 1 }, { unique: true });
MobileTicketSchema.index({ location: 1, date: 1 });
MobileTicketSchema.index({ deviceId: 1, syncStatus: 1 });

export default mongoose.models.MobileTicket || mongoose.model<IMobileTicket>('MobileTicket', MobileTicketSchema);