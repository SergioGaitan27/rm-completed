import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db/mongodb';
import Product, { IProduct } from '@/app/lib/models/Producto';
import Pedido from '@/app/lib/models/Pedido';
import { IPedidoItem, IStockLocation } from '@/app/types/product';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { pedidos, isSurtido } = body as { pedidos: IPedidoItem[], isSurtido: boolean };
    console.log('Received isSurtido:', isSurtido); 

    for (const pedido of pedidos) {
      const product = await Product.findById(pedido.productId) as IProduct | null;

      if (!product) {
        throw new Error(`Producto no encontrado: ${pedido.productId}`);
      }

      const fromLocationIndex = product.stockLocations.findIndex(
        (loc: IStockLocation) => loc.location === pedido.fromLocation
      );
      const toLocationIndex = product.stockLocations.findIndex(
        (loc: IStockLocation) => loc.location === pedido.toLocation
      );

      if (fromLocationIndex === -1) {
        throw new Error(`Ubicación de origen no encontrada: ${pedido.fromLocation}`);
      }

      const fromQuantity = Number(product.stockLocations[fromLocationIndex].quantity);
      if (fromQuantity < pedido.quantity) {
        throw new Error(`Cantidad insuficiente en la ubicación de origen: ${pedido.fromLocation}`);
      }

      product.stockLocations[fromLocationIndex].quantity = (fromQuantity - pedido.quantity).toString();

      if (toLocationIndex !== -1) {
        const toQuantity = Number(product.stockLocations[toLocationIndex].quantity);
        product.stockLocations[toLocationIndex].quantity = (toQuantity + pedido.quantity).toString();
      } else {
        product.stockLocations.push({
          location: pedido.toLocation,
          quantity: pedido.quantity.toString()
        });
      }

      product.stockLocations = product.stockLocations.filter((loc: IStockLocation) => Number(loc.quantity) > 0);

      await product.save();
    }

    const newPedido = new Pedido({
      pedidos: pedidos,
      isSurtido: isSurtido // Añadimos el campo isSurtido
    });

    await newPedido.save();

    return NextResponse.json({ message: 'Pedido procesado con éxito' }, { status: 200 });

  } catch (error) {
    console.error('Error en el pedido:', error);
    return NextResponse.json({ 
      message: 'Error interno del servidor', 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const pedidos = await Pedido.find().sort({ date: -1 }).limit(50);

    return NextResponse.json(pedidos, { status: 200 });
  } catch (error) {
    console.error('Error al obtener los pedidos:', error);
    return NextResponse.json({ 
      message: 'Error al obtener los pedidos', 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}