// models/containerModel.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct {
  name: string;
  code: string;
  expectedBoxes: number;
  receivedBoxes: number;
}

export interface IContainer extends Document {
  containerNumber: string;
  products: IProduct[];
  status: 'preloaded' | 'received' | 'completed';
  totalExpectedBoxes: number;
  totalReceivedBoxes: number;
  createdAt: Date;
  updatedAt: Date;
}

const ContainerSchema: Schema = new Schema({
  containerNumber: { type: String, required: true, unique: true },
  products: [{
    name: { type: String, required: true },
    code: { type: String, required: true },
    expectedBoxes: { type: Number, required: true },
    receivedBoxes: { type: Number, default: 0 }
  }],
  status: { type: String, enum: ['preloaded', 'received', 'completed'], default: 'preloaded' },
  totalExpectedBoxes: { type: Number, default: 0 },
  totalReceivedBoxes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Container || mongoose.model<IContainer>('Container', ContainerSchema);