// app/api/products/route.ts

import { NextResponse } from 'next/server';
import { createProduct, getProducts, checkProductExists } from '@/app/lib/actions/product';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newProduct = await createProduct(body);
    return NextResponse.json({ message: 'Producto guardado exitosamente', product: newProduct }, { status: 201 });
  } catch (error) {
    // console.error('Error al guardar el producto:', error);
    return NextResponse.json({ error: 'Error al guardar el producto' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const type = searchParams.get('type');

    if (code && type) {
      const exists = await checkProductExists(code, type);
      return NextResponse.json({ exists });
    } else {
      const products = await getProducts();
      return NextResponse.json(products);
    }
  } catch (error) {
    // console.error('Error en la operación de productos:', error);
    return NextResponse.json({ error: 'Error en la operación de productos' }, { status: 500 });
  }
}