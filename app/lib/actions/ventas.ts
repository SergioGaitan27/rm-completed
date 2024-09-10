// app/lib/actions/ventas.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db/mongodb';
import Product, { IProduct, IStockLocation } from '@/app/lib/models/Producto';

interface CartItem {
  _id: string;
  quantity: number;
  unitType: 'pieces' | 'boxes';
}

interface SaleData {
  items: CartItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'card';
  amountPaid: number;
}

// Función auxiliar para convertir quantity a número
function toNumber(value: string | number): number {
  return typeof value === 'string' ? parseFloat(value) : value;
}

export async function processSale(saleData: SaleData) {
  await connectDB();

  const { items, totalAmount, paymentMethod, amountPaid } = saleData;

  // Validate the sale data
  if (!items || items.length === 0 || !totalAmount || !paymentMethod) {
    return NextResponse.json({ success: false, message: 'Datos de venta inválidos' }, { status: 400 });
  }

  // Process each item in the cart
  for (const item of items) {
    const product = await Product.findById(item._id) as IProduct | null;
    if (!product) {
      return NextResponse.json({ success: false, message: `Producto no encontrado: ${item._id}` }, { status: 404 });
    }

    const quantityToReduce = item.unitType === 'boxes' ? item.quantity * product.piecesPerBox : item.quantity;

    // Calculate the total quantity in stock
    const totalStock = product.stockLocations.reduce((sum: number, location: IStockLocation) => sum + toNumber(location.quantity), 0);

    if (totalStock < quantityToReduce) {
      return NextResponse.json({ success: false, message: `Stock insuficiente para ${product.name}` }, { status: 400 });
    }

    // Reduce stock from locations
    let remainingQuantity = quantityToReduce;
    for (const location of product.stockLocations) {
      if (remainingQuantity <= 0) break;

      const locationQuantity = toNumber(location.quantity);
      if (locationQuantity >= remainingQuantity) {
        location.quantity = (locationQuantity - remainingQuantity).toString();
        remainingQuantity = 0;
      } else {
        remainingQuantity -= locationQuantity;
        location.quantity = '0';
      }
    }

    // Remove locations with zero quantity
    product.stockLocations = product.stockLocations.filter((loc: IStockLocation) => toNumber(loc.quantity) > 0);

    // Update the product in the database
    await Product.findByIdAndUpdate(item._id, { stockLocations: product.stockLocations });
  }

  // Here you would typically save the sale to a Sales collection
  // For this example, we'll just return a success message

  return NextResponse.json({
    success: true,
    message: 'Venta procesada exitosamente',
    data: {
      totalAmount,
      paymentMethod,
      amountPaid,
      change: paymentMethod === 'cash' ? amountPaid - totalAmount : 0
    }
  }, { status: 200 });
}