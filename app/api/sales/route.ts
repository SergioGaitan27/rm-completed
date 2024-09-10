import { NextRequest, NextResponse } from 'next/server';
import { processSale } from '@/app/lib/actions/ventas';

export async function POST(req: NextRequest) {
  try {
    const saleData = await req.json();
    return await processSale(saleData);
  } catch (error: unknown) {
    console.error("Error detallado:", error);
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Ocurrió un error desconocido' }, { status: 500 });
  }
}