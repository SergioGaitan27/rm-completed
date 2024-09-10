import { NextResponse } from 'next/server';
import { getProductById, updateProduct } from '@/app/lib/actions/product';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await getProductById(params.id);
    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    // console.error('Error al obtener el producto:', error);
    return NextResponse.json({ error: 'Error al obtener el producto' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updatedProduct = await updateProduct(params.id, body);
    if (!updatedProduct) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    return NextResponse.json(updatedProduct);
  } catch (error) {
    // console.error('Error al actualizar el producto:', error);
    return NextResponse.json({ error: 'Error al actualizar el producto' }, { status: 500 });
  }
}