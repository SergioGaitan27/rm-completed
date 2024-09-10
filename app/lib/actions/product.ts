import { connectDB } from '@/app/lib/db/mongodb';
import Product from '@/app/lib/models/Producto';

export async function createProduct(body: any) {
  await connectDB();
  const newProduct = new Product(body);
  await newProduct.save();
  return newProduct;
}

export async function getProducts() {
  await connectDB();
  return await Product.find({});
}

export async function checkProductExists(code: string, type: string) {
  await connectDB();
  const query = type === 'boxCode' ? { boxCode: code } : { productCode: code };
  const existingProduct = await Product.findOne(query);
  return !!existingProduct;
}

export async function getProductById(id: string) {
  await connectDB();
  return await Product.findById(id);
}

export async function updateProduct(id: string, body: any) {
  await connectDB();
  return await Product.findByIdAndUpdate(id, body, { new: true });
}