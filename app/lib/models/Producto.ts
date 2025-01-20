// app/lib/models/Producto.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IProductBase, IStockLocation } from '../../types/product';

export interface IProduct extends IProductBase, Document {
  ajustado: boolean;
}

// Re-exporta el tipo IStockLocation
export type { IStockLocation };

const ProductSchema: Schema = new Schema({
  
  boxCode: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true // Agregar trim para limpiar espacios
  },
  productCode: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  piecesPerBox: { 
    type: Number, 
    required: true,
    min: 0 // Agregar validación mínima
  },
  cost: { 
    type: Number, 
    required: true,
    min: 0
  },
  price1: { 
    type: Number, 
    required: true,
    min: 0
  },
  price1MinQty: { 
    type: Number, 
    required: true,
    min: 1
  },
  price2: { 
    type: Number, 
    required: true,
    min: 0
  },
  price2MinQty: { 
    type: Number, 
    required: true,
    min: 1
  },
  price3: { type: Number, required: true },
  price3MinQty: { type: Number, required: true },
  price4: { type: Number },
  price5: { type: Number },
  stockLocations: [{
    location: { type: String, required: true },
    quantity: { type: Number, required: true }
  }],
  imageUrl: { type: String },
  category: { type: String, default: 'Sin categoría' },
  availability: { type: Boolean, default: true },
  ajustado: { type: Boolean, default: false } 
});

const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;