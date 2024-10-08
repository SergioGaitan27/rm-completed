import { NextRequest, NextResponse } from 'next/server';
import { processCorte } from '@/app/lib/actions/corte';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { actualCash, actualCard, location } = data;

    if (actualCash === undefined || actualCard === undefined || !location) {
      return NextResponse.json({ success: false, message: 'Datos incompletos' }, { status: 400 });
    }

    const corteResults = await processCorte({ actualCash, actualCard, location });

    return NextResponse.json({ success: true, data: corteResults }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Error al realizar el corte' }, { status: 500 });
  }
}
