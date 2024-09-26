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
  profit: { type: Number, required: true }
});

const MobileTicketSchema: Schema = new Schema({
  ticketId: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  sequenceNumber: { type: Number, required: true },
  customerName: { type: String, required: false }, // New field
  items: [TicketItemSchema],
  totalAmount: { type: Number, required: true },
  totalProfit: { type: Number, required: true },
  paymentType: { type: String, enum: ['cash', 'card'], required: true },
  amountPaid: { type: Number, required: false },
  change: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid', required: true },
  fulfillmentStatus: { type: String, enum: ['pending', 'processing', 'completed'], default: 'pending', required: true },
  deviceId: { type: String, required: true },
  gpsCoordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  employeeId: { type: String, required: true },
  syncStatus: { type: String, enum: ['pending', 'synced', 'failed'], default: 'pending', required: true },
  offlineCreated: { type: Boolean, default: false, required: true }
});

// Índices
MobileTicketSchema.index({ location: 1, sequenceNumber: 1 }, { unique: true });
MobileTicketSchema.index({ location: 1, date: 1 });
MobileTicketSchema.index({ deviceId: 1, syncStatus: 1 });

export default mongoose.models.MobileTicket || mongoose.model<IMobileTicket>('MobileTicket', MobileTicketSchema);