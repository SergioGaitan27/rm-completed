import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db/mongodb';
import Product, { IProduct } from '@/app/lib/models/Producto';
import Transfer from '@/app/lib/models/Transfer';
import { generateTransferPDF } from '@/app/utils/serverPdfGenerator';
import { ITransferItem, IStockLocation } from '@/app/types/product';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { transfers } = body as { transfers: ITransferItem[] };

    for (const transfer of transfers) {
      const product = await Product.findById(transfer.productId) as IProduct | null;

      if (!product) {
        throw new Error(`Producto no encontrado: ${transfer.productId}`);
      }

      const fromLocationIndex = product.stockLocations.findIndex(
        (loc: IStockLocation) => loc.location === transfer.fromLocation
      );
      const toLocationIndex = product.stockLocations.findIndex(
        (loc: IStockLocation) => loc.location === transfer.toLocation
      );

      if (fromLocationIndex === -1) {
        throw new Error(`Ubicación de origen no encontrada: ${transfer.fromLocation}`);
      }

      const fromQuantity = Number(product.stockLocations[fromLocationIndex].quantity);
      if (fromQuantity < transfer.quantity) {
        throw new Error(`Cantidad insuficiente en la ubicación de origen: ${transfer.fromLocation}`);
      }

      product.stockLocations[fromLocationIndex].quantity = (fromQuantity - transfer.quantity).toString();

      if (toLocationIndex !== -1) {
        const toQuantity = Number(product.stockLocations[toLocationIndex].quantity);
        product.stockLocations[toLocationIndex].quantity = (toQuantity + transfer.quantity).toString();
      } else {
        product.stockLocations.push({
          location: transfer.toLocation,
          quantity: transfer.quantity.toString()
        });
      }

      product.stockLocations = product.stockLocations.filter((loc: IStockLocation) => Number(loc.quantity) > 0);

      await product.save();
    }

    const newTransfer = new Transfer({
      transfers: transfers
    });

    await newTransfer.save();

    const pdfUrl = await generateTransferPDF(transfers);

    return NextResponse.json({ 
      message: 'Transferencias realizadas con éxito', 
      pdfUrl 
    }, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error) {
    console.error('Error en las transferencias:', error);
    return NextResponse.json({ 
      message: 'Error interno del servidor', 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const transfers = await Transfer.find().sort({ date: -1 }).limit(50);

    return NextResponse.json(transfers, { status: 200 });
  } catch (error) {
    console.error('Error al obtener las transferencias:', error);
    return NextResponse.json({ 
      message: 'Error al obtener las transferencias', 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}