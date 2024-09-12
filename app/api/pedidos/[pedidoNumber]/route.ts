import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/db/mongodb';
import Pedido from '@/app/lib/models/Pedido';

export async function GET(req: NextRequest, { params }: { params: { pedidoNumber: string } }) {
  try {
    await connectDB();

    const pedido = await Pedido.findById(params.pedidoNumber);

    if (!pedido) {
      return NextResponse.json({ message: 'Pedido no encontrado' }, { status: 404 });
    }

    return NextResponse.json(pedido, { status: 200 });
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