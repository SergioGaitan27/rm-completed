import { NextRequest, NextResponse } from 'next/server';
import { processCashMovement } from '@/app/lib/actions/cashMovements';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { amount, concept, type, location } = data;

    if (amount === undefined || !concept || !type || !location) {
      return NextResponse.json({ success: false, message: 'Datos incompletos' }, { status: 400 });
    }

    await processCashMovement({ amount, concept, type, location });

    return NextResponse.json({ success: true, message: 'Movimiento registrado' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Error al registrar el movimiento' }, { status: 500 });
  }
}
