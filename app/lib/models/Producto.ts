// app/lib/models/Producto.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IProductBase, IStockLocation } from '../../types/product';

export interface IProduct extends IProductBase, Document {}

// Re-exporta el tipo IStockLocation
export type { IStockLocation };

const ProductSchema: Schema = new Schema({
  boxCode: { type: String, required: true, unique: true },
  productCode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  piecesPerBox: { type: Number, required: true },
  cost: { type: Number, required: true },
  price1: { type: Number, required: true },
  price1MinQty: { type: Number, required: true },
  price2: { type: Number, required: true },
  price2MinQty: { type: Number, required: true },
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
  availability: { type: Boolean, default: true }
});

// Asegúrate de que los índices estén configurados correctamente
ProductSchema.index({ boxCode: 1 }, { unique: true });
ProductSchema.index({ productCode: 1 }, { unique: true });

// Si necesitas algún método estático o de instancia, puedes agregarlo aquí
// Por ejemplo:
// ProductSchema.methods.someMethod = function() { ... };
// ProductSchema.statics.someStaticMethod = function() { ... };

const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;