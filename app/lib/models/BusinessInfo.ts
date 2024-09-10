//models/BusinessInfo.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IBusinessInfo extends Document {
  location: string;
  businessName: string;
  address: string;
  phone: string;
  taxId: string;
}

const BusinessInfoSchema: Schema = new Schema({
  location: { type: String, required: true, unique: true },
  businessName: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  taxId: { type: String, required: true }
});

export default mongoose.models.BusinessInfo || mongoose.model<IBusinessInfo>('BusinessInfo', BusinessInfoSchema);
