import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db/mongodb';
import Pedido from '@/app/lib/models/Pedido';
import Product from '@/app/lib/models/Producto';
import { IPedidos, IPedidoItem } from '@/app/types/product';

export async function GET(req: NextRequest, { params }: { params: { pedidoNumber: string } }) {
  try {
    await connectDB();

    const pedido = await Pedido.findById(params.pedidoNumber);

    if (!pedido) {
      return NextResponse.json({ message: 'Pedido no encontrado' }, { status: 404 });
    }

    // Convertir el documento de Mongoose a un objeto plano
    const pedidoObject = pedido.toObject();

    // Obtener los IDs de productos únicos del pedido
    const productIds = Array.from(new Set(pedidoObject.pedidos.map((item: IPedidoItem) => item.productId)));

    // Obtener la información de piecesPerBox para estos productos
    const productsInfo = await Product.find({ _id: { $in: productIds } }, 'boxCode piecesPerBox');

    // Crear un mapa para un acceso rápido
    const productInfoMap = new Map(productsInfo.map(p => [p._id.toString(), p.toObject()]));

    // Agregar piecesPerBox a cada item del pedido
    const pedidosConPiecesPerBox = pedidoObject.pedidos.map((item: IPedidoItem) => ({
      ...item,
      piecesPerBox: productInfoMap.get(item.productId.toString())?.piecesPerBox || 1
    }));

    const pedidoConPiecesPerBox = {
      ...pedidoObject,
      pedidos: pedidosConPiecesPerBox
    };

    return NextResponse.json(pedidoConPiecesPerBox, { status: 200 });
  } catch (error) {
    console.error('Error al obtener los detalles del pedido:', error);
    return NextResponse.json({ 
      message: 'Error al obtener los detalles del pedido', 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { pedidoNumber: string } }) {
  try {
    await connectDB();

    const { isSurtido } = await req.json();

    const updatedPedido = await Pedido.findByIdAndUpdate(
      params.pedidoNumber,
      { $set: { isSurtido } },
      { new: true, runValidators: true }
    );

    if (!updatedPedido) {
      return NextResponse.json({ message: 'Pedido no encontrado' }, { status: 404 });
    }

    return NextResponse.json(updatedPedido, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar el pedido:', error);
    return NextResponse.json({ 
      message: 'Error al actualizar el pedido', 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}