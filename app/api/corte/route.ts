// app/api/corte/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { processCorte } from '@/app/lib/actions/corte';

export async function POST(req: NextRequest) {
  try {
    const corteData = await req.json();

    // Procesar el corte con los datos proporcionados
    const result = await processCorte(corteData);

    return NextResponse.json(
      {
        success: true,
        message: 'Corte procesado exitosamente',
        data: result,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error detallado:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Ocurrió un error desconocido' },
      { status: 500 }
    );
  }
}
